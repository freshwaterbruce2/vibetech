-- ============================================================================
-- Task Management System Schema
-- Database: D:\databases\database.db (SQLite 3)
-- Created: 2025-10-15
--
-- Description:
--   Complete task management schema with Kanban workflow, full-text search,
--   and modern SQLite optimizations (JSONB, FTS5, expression indexes).
--
-- Integration:
--   - References existing 'users' table for assignments and ownership
--   - References existing 'projects' table for task organization
--
-- Features:
--   - Kanban status workflow (backlog → todo → in_progress → review → done)
--   - Full-text search with BM25 ranking (FTS5)
--   - Complete audit trail with JSONB snapshots
--   - Comments with threading support
--   - File attachment metadata
--   - Performance-optimized indexes (composite, partial, expression)
--
-- Prerequisites:
--   - WAL mode enabled (already configured on database.db)
--   - SQLite version 3.38.0+ (for JSONB and JSON operators)
--
-- Usage:
--   sqlite3 D:\databases\database.db < task_management_schema.sql
-- ============================================================================

-- Enable foreign key constraints (must be set per connection)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. MAIN TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    -- Primary key
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Core task information
    title TEXT NOT NULL CHECK(length(trim(title)) > 0),
    description TEXT,

    -- Workflow status
    status TEXT NOT NULL DEFAULT 'backlog' CHECK(
        status IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'archived')
    ),

    -- Priority level
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(
        priority IN ('low', 'medium', 'high', 'urgent')
    ),

    -- Relationships (foreign keys)
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Scheduling
    due_date TIMESTAMP,
    completed_at TIMESTAMP,

    -- Position for Kanban column ordering (lower = higher in list)
    position INTEGER NOT NULL DEFAULT 0,

    -- Extensible metadata (JSONB for 3x performance)
    -- Examples: {"sprint": "Sprint 3", "story_points": 5, "epic_id": 42}
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Primary indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id
    ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
    ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
    ON tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
    ON tasks(due_date);

-- Composite index for Kanban board queries (project + status + position)
-- Optimizes: SELECT * FROM tasks WHERE project_id = ? AND status = ? ORDER BY position
CREATE INDEX IF NOT EXISTS idx_tasks_kanban
    ON tasks(project_id, status, position);

-- Partial index for active tasks only (excludes archived)
-- Saves space and improves query performance for active task lists
CREATE INDEX IF NOT EXISTS idx_tasks_active
    ON tasks(project_id, status, position)
    WHERE status != 'archived';

-- Partial index for overdue tasks (only incomplete tasks with due dates)
-- Optimizes: SELECT * FROM tasks WHERE status NOT IN ('done', 'archived') AND due_date < NOW()
CREATE INDEX IF NOT EXISTS idx_tasks_overdue
    ON tasks(due_date)
    WHERE status NOT IN ('done', 'archived') AND due_date IS NOT NULL;

-- Expression index on JSONB field (requires SQLite 3.38.0+)
-- Optimizes queries like: SELECT * FROM tasks WHERE metadata->>'sprint' = 'Sprint 3'
CREATE INDEX IF NOT EXISTS idx_tasks_metadata_sprint
    ON tasks(metadata->>'sprint');

-- Trigger to update updated_at timestamp automatically
CREATE TRIGGER IF NOT EXISTS tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger to set completed_at when status changes to 'done'
CREATE TRIGGER IF NOT EXISTS tasks_completed_at
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN NEW.status = 'done' AND OLD.status != 'done'
BEGIN
    UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- 2. TASK LABELS (MANY-TO-MANY TAGS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_labels (
    -- Composite primary key (no separate id needed)
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_name TEXT NOT NULL CHECK(length(trim(label_name)) > 0),

    -- Display color (hex format: #FF5733)
    color TEXT NOT NULL DEFAULT '#808080' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (task_id, label_name)
);

-- Index for finding all tasks with a specific label
-- Optimizes: SELECT tasks.* FROM tasks JOIN task_labels ON ... WHERE label_name = 'bug'
CREATE INDEX IF NOT EXISTS idx_task_labels_name
    ON task_labels(label_name);

-- ============================================================================
-- 3. TASK COMMENTS (THREADED DISCUSSIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Relationships
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Comment content
    content TEXT NOT NULL CHECK(length(trim(content)) > 0),

    -- Threading support (self-referential foreign key)
    parent_comment_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fetching all comments for a task
-- Optimizes: SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id
    ON task_comments(task_id, created_at);

-- Index for finding replies to a comment
CREATE INDEX IF NOT EXISTS idx_task_comments_parent
    ON task_comments(parent_comment_id);

-- Index for finding all comments by a user
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id
    ON task_comments(user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS task_comments_updated_at
AFTER UPDATE ON task_comments
FOR EACH ROW
BEGIN
    UPDATE task_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 4. TASK ACTIVITY (COMPLETE AUDIT TRAIL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Relationships
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Action type (e.g., 'created', 'status_changed', 'assigned', 'commented', 'edited')
    action TEXT NOT NULL CHECK(length(trim(action)) > 0),

    -- Before/after snapshots (JSONB for efficient storage and querying)
    -- Example: {"field": "status", "old": "todo", "new": "in_progress"}
    old_value JSONB,
    new_value JSONB,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fetching activity timeline for a task
-- Optimizes: SELECT * FROM task_activity WHERE task_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_task_activity_task_id
    ON task_activity(task_id, created_at DESC);

-- Index for finding all actions by a user
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id
    ON task_activity(user_id);

-- Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_task_activity_action
    ON task_activity(action);

-- ============================================================================
-- 5. TASK ATTACHMENTS (FILE METADATA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Relationships
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- File metadata (store files on disk, not in DB)
    filename TEXT NOT NULL CHECK(length(trim(filename)) > 0),
    file_path TEXT NOT NULL UNIQUE,  -- Absolute path or relative to storage root
    file_size INTEGER NOT NULL CHECK(file_size >= 0),  -- Bytes
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fetching attachments for a task
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id
    ON task_attachments(task_id);

-- Index for finding files by uploader
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by
    ON task_attachments(uploaded_by);

-- ============================================================================
-- 6. FULL-TEXT SEARCH (FTS5 VIRTUAL TABLE)
-- ============================================================================

-- FTS5 virtual table for fast full-text search
-- Tokenizers:
--   - unicode61: Unicode-aware tokenization (handles international text)
--   - porter: English stemming (finds "running" when searching "run")
CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
    title,
    description,
    content=tasks,  -- Content table (FTS5 mirrors data from tasks table)
    content_rowid=id,
    tokenize='unicode61 porter'
);

-- Trigger to keep FTS5 in sync when inserting tasks
CREATE TRIGGER IF NOT EXISTS tasks_fts_insert
AFTER INSERT ON tasks
BEGIN
    INSERT INTO tasks_fts(rowid, title, description)
    VALUES (NEW.id, NEW.title, NEW.description);
END;

-- Trigger to keep FTS5 in sync when updating tasks
CREATE TRIGGER IF NOT EXISTS tasks_fts_update
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks_fts
    SET title = NEW.title, description = NEW.description
    WHERE rowid = NEW.id;
END;

-- Trigger to keep FTS5 in sync when deleting tasks
CREATE TRIGGER IF NOT EXISTS tasks_fts_delete
AFTER DELETE ON tasks
BEGIN
    DELETE FROM tasks_fts WHERE rowid = OLD.id;
END;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Query 1: Full-text search with BM25 ranking
-- SELECT tasks.*, tasks_fts.rank
-- FROM tasks
-- JOIN tasks_fts ON tasks.id = tasks_fts.rowid
-- WHERE tasks_fts MATCH 'bug AND database OR performance'
-- ORDER BY tasks_fts.rank;

-- Query 2: Kanban board for a project (optimized with composite index)
-- SELECT * FROM tasks
-- WHERE project_id = 5 AND status = 'in_progress'
-- ORDER BY position;

-- Query 3: Overdue tasks (optimized with partial index)
-- SELECT * FROM tasks
-- WHERE status NOT IN ('done', 'archived')
--   AND due_date < datetime('now')
-- ORDER BY due_date;

-- Query 4: Tasks by sprint (uses expression index on JSONB)
-- SELECT * FROM tasks
-- WHERE metadata->>'sprint' = 'Sprint 3'
-- ORDER BY priority DESC;

-- Query 5: Task activity timeline with user names
-- SELECT ta.*, u.full_name, u.email
-- FROM task_activity ta
-- JOIN users u ON ta.user_id = u.id
-- WHERE ta.task_id = 42
-- ORDER BY ta.created_at DESC
-- LIMIT 50;

-- Query 6: Tasks with specific label
-- SELECT t.*
-- FROM tasks t
-- JOIN task_labels tl ON t.id = tl.task_id
-- WHERE tl.label_name = 'urgent'
-- ORDER BY t.created_at DESC;

-- Query 7: Comment threads (recursive CTE for nested replies)
-- WITH RECURSIVE comment_tree AS (
--     SELECT id, task_id, user_id, content, parent_comment_id, created_at, 0 AS depth
--     FROM task_comments
--     WHERE task_id = 42 AND parent_comment_id IS NULL
--     UNION ALL
--     SELECT c.id, c.task_id, c.user_id, c.content, c.parent_comment_id, c.created_at, ct.depth + 1
--     FROM task_comments c
--     JOIN comment_tree ct ON c.parent_comment_id = ct.id
-- )
-- SELECT * FROM comment_tree ORDER BY created_at;

-- ============================================================================
-- SCHEMA VALIDATION
-- ============================================================================

-- Verify all tables were created successfully
SELECT 'Schema created successfully: ' || COUNT(*) || ' tables' AS result
FROM sqlite_master
WHERE type = 'table'
AND name IN ('tasks', 'task_labels', 'task_comments', 'task_activity', 'task_attachments');

-- Verify FTS5 virtual table
SELECT 'FTS5 table created: ' || name AS result
FROM sqlite_master
WHERE type = 'table' AND name = 'tasks_fts';

-- Display index count
SELECT 'Indexes created: ' || COUNT(*) AS result
FROM sqlite_master
WHERE type = 'index'
AND tbl_name IN ('tasks', 'task_labels', 'task_comments', 'task_activity', 'task_attachments');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
