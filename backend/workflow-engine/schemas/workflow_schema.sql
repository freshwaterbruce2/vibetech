-- Workflow Automation Schema
-- Created: 2025-11-10
-- Part of P3.4: Automation & Workflows

-- Workflow Templates (Pre-defined workflows)
CREATE TABLE IF NOT EXISTS workflow_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT CHECK(category IN ('development', 'bug_fix', 'learning', 'custom')),
    steps TEXT NOT NULL, -- JSON array of steps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0
);

-- Active Workflow Instances
CREATE TABLE IF NOT EXISTS workflow_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    workflow_name TEXT NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 0,
    state_data TEXT, -- JSON with context
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'paused')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES workflow_templates(id)
);

-- Workflow Step Execution Log
CREATE TABLE IF NOT EXISTS workflow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL,
    step_index INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    app_source TEXT CHECK(app_source IN ('nova', 'vibe', 'auto', 'ml')),
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    output_data TEXT, -- JSON
    error_message TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflow_instances(id)
);

-- Workflow Events/Triggers
CREATE TABLE IF NOT EXISTS workflow_triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_type TEXT CHECK(trigger_type IN (
        'task_created',
        'mistake_detected',
        'file_saved',
        'test_failed',
        'manual'
    )),
    template_id INTEGER NOT NULL,
    conditions TEXT, -- JSON
    enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES workflow_templates(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template ON workflow_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type ON workflow_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);

-- Insert default workflow templates
INSERT OR IGNORE INTO workflow_templates (name, description, category, steps) VALUES
('feature_development', 'Complete feature development workflow', 'development',
 '[
    {"name":"Create Task","app":"nova","action":"create_task"},
    {"name":"Research","app":"nova","action":"gather_context"},
    {"name":"Open Files","app":"vibe","action":"open_related_files"},
    {"name":"Implementation","app":"vibe","action":"code"},
    {"name":"Run Tests","app":"auto","action":"run_tests"},
    {"name":"Review","app":"ml","action":"analyze_code"},
    {"name":"Deploy","app":"auto","action":"deploy"}
  ]'),

('bug_fix', 'Bug fix workflow', 'bug_fix',
 '[
    {"name":"Detect Bug","app":"auto","action":"detect"},
    {"name":"Gather Context","app":"auto","action":"gather_context"},
    {"name":"Find Similar","app":"nova","action":"search_mistakes"},
    {"name":"Open File","app":"vibe","action":"open_file"},
    {"name":"Apply Fix","app":"vibe","action":"edit"},
    {"name":"Test Fix","app":"auto","action":"run_tests"},
    {"name":"Update Learning","app":"nova","action":"log_solution"}
  ]'),

('learning', 'Learning and improvement workflow', 'learning',
 '[
    {"name":"Detect Mistake","app":"auto","action":"detect"},
    {"name":"Analyze Pattern","app":"ml","action":"analyze"},
    {"name":"Find Root Cause","app":"nova","action":"investigate"},
    {"name":"Generate Strategy","app":"ml","action":"suggest"},
    {"name":"Update Knowledge","app":"nova","action":"add_knowledge"},
    {"name":"Create Task","app":"nova","action":"create_improvement_task"}
  ]');
