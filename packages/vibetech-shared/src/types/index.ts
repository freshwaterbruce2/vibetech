/**
 * Common TypeScript types and interfaces shared across applications
 */

export interface AgentCapability {
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentContext {
  currentFile?: string;
  selectedText?: string;
  workspaceRoot?: string;
  projectType?: string;
  recentFiles?: string[];
  openFiles?: string[];
  gitBranch?: string;
  dependencies?: Record<string, string>;
}

export interface AgentResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
  followupQuestions?: string[];
  relatedTopics?: string[];
  metadata?: Record<string, any>;
}

export interface LearningMistake {
  id?: number;
  description: string;
  impact_severity: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  solution?: string;
  prevention_strategy?: string;
  tags?: string[];
  app_source?: 'nova' | 'vibe';
  created_at?: Date;
}

export interface KnowledgeEntry {
  id?: number;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  app_source?: 'nova' | 'vibe';
  created_at?: Date;
  updated_at?: Date;
}

export interface ActivityEvent {
  id?: number;
  event_type: string;
  event_data?: string;
  app_source?: 'nova' | 'vibe';
  timestamp?: Date;
}

export interface DatabaseConfig {
  learningDbPath: string;
  activityDbPath: string;
  strategyDbPath?: string;
}

export interface StreamingOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}
