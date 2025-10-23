-- ============================================================================
-- Task Management System Schema (Core Tables Only - No FTS5)
-- Database: D:\databases\database.db (SQLite 3)
-- Created: 2025-10-15
--
-- This version excludes FTS5 for testing/validation purposes
-- Use task_management_schema.sql for full version with FTS5
-- ============================================================================

-- Enable foreign key constraints (must be set per connection)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. MAIN TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(trim(title)) > 0),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'backlog' CHECK(
        status IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'archived')
    ),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    position INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON tasks(project_id, status, position);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(project_id, status, position) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(due_date) WHERE status NOT IN ('done', 'archived') AND due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_metadata_sprint ON tasks(metadata->>'sprint');

CREATE TRIGGER IF NOT EXISTS tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS tasks_completed_at
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN NEW.status = 'done' AND OLD.status != 'done'
BEGIN
    UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- 2. TASK LABELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_labels (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_name TEXT NOT NULL CHECK(length(trim(label_name)) > 0),
    color TEXT NOT NULL DEFAULT '#808080' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, label_name)
);

CREATE INDEX IF NOT EXISTS idx_task_labels_name ON task_labels(label_name);

-- ============================================================================
-- 3. TASK COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL CHECK(length(trim(content)) > 0),
    parent_comment_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON task_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

CREATE TRIGGER IF NOT EXISTS task_comments_updated_at
AFTER UPDATE ON task_comments
FOR EACH ROW
BEGIN
    UPDATE task_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 4. TASK ACTIVITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL CHECK(length(trim(action)) > 0),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id ON task_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_action ON task_activity(action);

-- ============================================================================
-- 5. TASK ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    filename TEXT NOT NULL CHECK(length(trim(filename)) > 0),
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL CHECK(file_size >= 0),
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- ============================================================================
-- VALIDATION
-- ============================================================================

SELECT 'Schema created successfully: ' || COUNT(*) || ' tables' AS result
FROM sqlite_master
WHERE type = 'table'
AND name IN ('tasks', 'task_labels', 'task_comments', 'task_activity', 'task_attachments');

SELECT 'Indexes created: ' || COUNT(*) AS result
FROM sqlite_master
WHERE type = 'index'
AND tbl_name IN ('tasks', 'task_labels', 'task_comments', 'task_activity', 'task_attachments');
