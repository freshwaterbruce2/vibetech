/**
 * Database schemas and SQL definitions
 * Shared between NOVA Agent and Vibe Code Studio
 */

export const LEARNING_DATABASE_SCHEMA = `
-- Agent mistakes table
CREATE TABLE IF NOT EXISTS agent_mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mistake_type TEXT NOT NULL,
  mistake_category TEXT,
  description TEXT NOT NULL,
  root_cause_analysis TEXT,
  context_when_occurred TEXT,
  impact_severity TEXT CHECK(impact_severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  prevention_strategy TEXT,
  identified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT 0,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova',
  tags TEXT,
  platform TEXT CHECK(platform IN ('desktop', 'web', 'mobile', 'python', 'general')) DEFAULT 'general'
);

-- Agent knowledge table
CREATE TABLE IF NOT EXISTS agent_knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  knowledge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  applicable_tasks TEXT,
  success_rate_improvement REAL,
  confidence_level REAL,
  tags TEXT,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Code snippets table
CREATE TABLE IF NOT EXISTS code_snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  used_count INTEGER DEFAULT 0,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova'
);

-- Cross-app patterns table (NEW)
CREATE TABLE IF NOT EXISTS cross_app_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL,
  source_app TEXT CHECK(source_app IN ('nova', 'vibe')) NOT NULL,
  target_app TEXT CHECK(target_app IN ('nova', 'vibe')) NOT NULL,
  pattern_data TEXT NOT NULL,
  success_rate REAL DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mistakes_severity ON agent_mistakes(impact_severity);
CREATE INDEX IF NOT EXISTS idx_mistakes_app_source ON agent_mistakes(app_source);
CREATE INDEX IF NOT EXISTS idx_mistakes_platform ON agent_mistakes(platform);
CREATE INDEX IF NOT EXISTS idx_mistakes_resolved ON agent_mistakes(resolved);
CREATE INDEX IF NOT EXISTS idx_knowledge_app_source ON agent_knowledge(app_source);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON agent_knowledge(knowledge_type);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_app_source ON code_snippets(app_source);
CREATE INDEX IF NOT EXISTS idx_cross_patterns_source ON cross_app_patterns(source_app);
CREATE INDEX IF NOT EXISTS idx_cross_patterns_target ON cross_app_patterns(target_app);
`;

export const ACTIVITY_DATABASE_SCHEMA = `
-- Activity events table
CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_data TEXT,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Deep work sessions table
CREATE TABLE IF NOT EXISTS deep_work_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration_minutes INTEGER,
  focus_score REAL,
  interruptions INTEGER DEFAULT 0,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova',
  project_context TEXT,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_app_source ON activity_events(app_source);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_deep_work_start ON deep_work_sessions(start_time DESC);
`;

export interface MistakeFilter {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  platform?: 'desktop' | 'web' | 'mobile' | 'python' | 'general';
  app_source?: 'nova' | 'vibe';
  resolved?: boolean;
  keyword?: string;
  limit?: number;
}

export interface KnowledgeFilter {
  category?: string;
  app_source?: 'nova' | 'vibe';
  keyword?: string;
  limit?: number;
}

export interface SnippetFilter {
  language?: string;
  app_source?: 'nova' | 'vibe';
  keyword?: string;
  limit?: number;
}

