/**
 * Plugin System Type Definitions
 *
 * Core types and interfaces for the extensible plugin architecture
 * Enables seamless integration of new features without modifying core code
 */

import { AgentTask, AgentStep, StepResult } from '../../../types';

// Plugin capability types
export type PluginType = 'layer' | 'orchestrator' | 'reviewer' | 'executor' | 'database';

export interface PluginCapability {
  name: string;
  description: string;
  handler: Function;
  priority?: number;
}

// Base plugin interface
export interface AIPlugin {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  enabled?: boolean;

  // Lifecycle hooks
  onRegister?: () => Promise<void>;
  onUnregister?: () => Promise<void>;
  onError?: (error: Error) => void;

  // Plugin capabilities
  capabilities: PluginCapability[];

  // Dependencies on other plugins
  dependencies?: string[];

  // Configuration
  config?: Record<string, any>;
}

// Layer plugin for extending 7-layer processing
export interface LayerPlugin extends AIPlugin {
  type: 'layer';
  layerId: number;
  layerName: string;
  layerPurpose: string;
  maxTokens: number;
  temperature: number;

  processLayer(
    task: AgentTask,
    previousResults: LayerResult[]
  ): Promise<LayerResult>;
}

// Review plugin for adding review perspectives
export interface ReviewPlugin extends AIPlugin {
  type: 'reviewer';
  reviewPerspective: string;
  confidenceThreshold: number;

  performReview(
    task: AgentTask,
    edits: EditOperation[]
  ): Promise<ReviewResult>;
}

// Executor plugin for custom actions
export interface ExecutorPlugin extends AIPlugin {
  type: 'executor';
  actionType: string;

  execute(params: any): Promise<StepResult>;
  validateParams(params: any): boolean;
  estimateTime?(params: any): number;
}

// Database plugin for different learning sources
export interface DatabasePlugin extends AIPlugin {
  type: 'database';
  connectionString?: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  queryPatterns(query: PatternQuery): Promise<Pattern[]>;
  storePattern(pattern: Pattern): Promise<void>;
  getStats(): Promise<DatabaseStats>;
}

// Supporting types
export interface LayerResult {
  layerId: number;
  layerName: string;
  insights: string[];
  refinedContext: string;
  confidence?: number;
}

export interface EditOperation {
  fileId: string;
  filePath: string;
  operations: Array<{
    type: 'create' | 'update' | 'delete' | 'rename';
    content?: string;
    oldContent?: string;
    position?: { line: number; column: number };
  }>;
  status: 'pending' | 'applied' | 'reverted';
}

export interface ReviewResult {
  perspective: string;
  taskId: string;
  score: number;
  feedback: string[];
  requiredAmendments: Amendment[];
}

export interface Amendment {
  id: string;
  type: 'fix' | 'enhancement' | 'refactor' | 'documentation';
  description: string;
  changes: EditOperation[];
  atomic: boolean;
  dependencies: string[];
}

export interface Pattern {
  id: string;
  description: string;
  actionType: string;
  successRate: number;
  usageCount: number;
  context: Record<string, any>;
}

export interface PatternQuery {
  problemDescription: string;
  actionType?: string;
  context?: Record<string, any>;
  maxResults?: number;
}

export interface DatabaseStats {
  totalPatterns: number;
  averageSuccessRate: number;
  lastUpdated: Date;
}

// Plugin registry event types
export interface PluginEvent {
  type: 'registered' | 'unregistered' | 'error' | 'capability-added';
  pluginId: string;
  timestamp: Date;
  data?: any;
}

// Plugin manifest for loading from packages
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  main: string;
  type: PluginType;
  description?: string;
  author?: string;
  license?: string;
  dependencies?: Record<string, string>;
}