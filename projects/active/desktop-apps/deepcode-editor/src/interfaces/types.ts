/**
 * Agent System Types
 * Interfaces for the multi-agent system and specialized agents
 */

// Re-export types from existing modules to maintain compatibility (disabled for now)
// export type { AgentTask as Task, TaskContext, TaskResult } from '../services/AutonomousAgent';

// Fallback type definitions
export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface TaskContext {
  workspaceContext?: any;
  currentFile?: any;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Context provided to agents for processing requests
 */
export interface AgentContext {
  files?: string[];
  currentFile?: string;
  selectedText?: string;
  workspaceRoot?: string;
  projectContext?: string;
  userPreferences?: Record<string, any>;
}

/**
 * Response returned by agents after processing
 */
export interface AgentResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

/**
 * Agent capability definitions
 */
export interface AgentCapability {
  name: string;
  description: string;
  category: 'analysis' | 'generation' | 'optimization' | 'validation';
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  role: string;
  capabilities: AgentCapability[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Task delegation information
 */
export interface TaskDelegation {
  taskId: string;
  agentName: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime?: number;
  dependencies?: string[];
}

/**
 * Multi-agent coordination result
 */
export interface CoordinationResult {
  taskId: string;
  agentResponses: Record<string, AgentResponse>;
  synthesizedResponse: string;
  recommendations?: string[];
  conflicts?: string[];
  nextSteps?: string[];
}

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
  agentName: string;
  tasksCompleted: number;
  averageConfidence: number;
  averageResponseTime: number;
  successRate: number;
  lastActive: Date;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
  enableMetrics: boolean;
}