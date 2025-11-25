/**
 * Agent Mode Types
 *
 * Defines the core types for autonomous agent functionality including
 * task planning, execution, and state management.
 */

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  userRequest: string;
  steps: AgentStep[];
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    executionTimeMs?: number;
    isChunked?: boolean;
    chunkIndex?: number;
    totalChunks?: number;
    parentTaskId?: string;
    originalStepCount?: number;
  };
}

export interface AgentStep {
  id: string;
  taskId: string;
  order: number;
  title: string;
  description: string;
  type?: string;
  action: StepAction;
  status: StepStatus;
  requiresApproval: boolean;
  approved?: boolean;
  result?: StepResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  metadata?: {
    filePath?: string;
    operationType?: 'create' | 'update' | 'delete' | 'rename';
    content?: string;
    oldContent?: string;
    position?: { line: number; column: number };
    [key: string]: any;
  };
}

export interface StepAction {
  type: ActionType;
  params: ActionParams;
}

export type ActionType =
  | 'read_file'
  | 'write_file'
  | 'edit_file'
  | 'delete_file'
  | 'create_directory'
  | 'run_command'
  | 'search_codebase'
  | 'analyze_code'
  | 'refactor_code'
  | 'generate_code'
  | 'run_tests'
  | 'git_commit'
  | 'review_project'
  | 'custom';

export interface ActionParams {
  [key: string]: unknown;
  // Specific params based on ActionType
  filePath?: string;
  content?: string;
  oldContent?: string;
  newContent?: string;
  command?: string;
  searchQuery?: string;
  codeSnippet?: string;
  targetLanguage?: string;
}

export interface StepResult {
  success: boolean;
  data?: unknown;
  message?: string;
  skipped?: boolean; // Indicates step was skipped (e.g., optional file missing)
  filesModified?: string[];
  filesCreated?: string[];
  filesDeleted?: string[];
}

export type TaskStatus =
  | 'planning'
  | 'awaiting_approval'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type StepStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ExecutionState {
  currentTask: AgentTask | null;
  currentStep: AgentStep | null;
  isExecuting: boolean;
  isPaused: boolean;
  executionHistory: ExecutionHistoryEntry[];
  queuedTasks: AgentTask[];
}

export interface ExecutionHistoryEntry {
  taskId: string;
  stepId: string;
  timestamp: Date;
  event: ExecutionEvent;
  details?: string;
}

export type ExecutionEvent =
  | 'task_created'
  | 'task_started'
  | 'task_paused'
  | 'task_resumed'
  | 'task_completed'
  | 'task_failed'
  | 'task_cancelled'
  | 'step_started'
  | 'step_awaiting_approval'
  | 'step_approved'
  | 'step_rejected'
  | 'step_completed'
  | 'step_failed'
  | 'step_retrying';

export interface TaskPlanRequest {
  userRequest: string;
  context: {
    workspaceRoot: string;
    openFiles?: string[];
    currentFile?: string;
    recentFiles?: string[];
  };
  currentFileObject?: any; // Full EditorFile object with content for context
  options?: {
    maxSteps?: number;
    requireApprovalForAll?: boolean;
    allowDestructiveActions?: boolean;
  };
}

export interface TaskPlanResponse {
  task: AgentTask;
  reasoning: string;
  estimatedTime?: string;
  warnings?: string[];
  hasMore?: boolean;
  metadata?: {
    isChunked?: boolean;
    totalSteps?: number;
    currentChunkSteps?: number;
    [key: string]: any;
  };
}

export interface ApprovalRequest {
  taskId: string;
  stepId: string;
  action: StepAction;
  reasoning: string;
  impact: {
    filesAffected: string[];
    reversible: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface ApprovalResponse {
  stepId: string;
  approved: boolean;
  modifiedParams?: ActionParams;
  feedback?: string;
}

export interface RollbackRequest {
  taskId: string;
  toStepId?: string; // If not provided, rollback entire task
}

export interface RollbackResult {
  success: boolean;
  stepsRolledBack: string[];
  filesRestored: string[];
  error?: string;
}

/**
 * Phase 4: ReAct Pattern Types
 * Implements Reason-Act-Observe-Reflect cycle for enhanced agent reasoning
 */

export interface ReActThought {
  reasoning: string;
  approach: string;
  alternatives: string[];
  confidence: number; // 0-100
  risks: string[];
  expectedOutcome: string;
  timestamp: Date;
}

export interface ReActObservation {
  actualOutcome: string;
  success: boolean;
  differences: string[]; // Expected vs actual
  learnings: string[];
  unexpectedEvents: string[];
  timestamp: Date;
}

export interface ReActReflection {
  whatWorked: string[];
  whatFailed: string[];
  rootCause?: string;
  shouldRetry: boolean;
  suggestedChanges: string[];
  knowledgeGained: string;
  timestamp: Date;
}

export interface ReActCycle {
  stepId: string;
  thought: ReActThought;
  action: StepAction;
  observation: ReActObservation;
  reflection: ReActReflection;
  cycleNumber: number; // For retry tracking
  totalDurationMs: number;
}

export interface ReActStepExtension extends AgentStep {
  reactCycles?: ReActCycle[]; // History of all reasoning cycles for this step
  currentThought?: ReActThought; // Active reasoning before execution
}

/**
 * Phase 5: Strategy Memory Types
 * Enables learning across tasks by persisting successful patterns
 */

export interface StrategyPattern {
  id: string;
  problemSignature: string;      // Hash/signature of the problem
  problemDescription: string;     // Human-readable description
  actionType: ActionType;         // What action was taken
  successfulApproach: string;     // The approach that worked
  context: {
    taskType?: string;            // Type of task (e.g., "file_operation", "code_generation")
    fileExtension?: string;       // Relevant file extension
    errorType?: string;           // Error that was resolved
    workspaceType?: string;       // Project type (React, Node, etc.)
  };
  reActCycle?: ReActCycle;        // Full ReAct cycle for reference
  confidence: number;             // 0-100 confidence in this pattern
  usageCount: number;             // How many times this pattern has been used
  successRate: number;            // Success rate when applied (0-100)
  createdAt: Date;
  lastUsedAt: Date;
  lastSuccessAt?: Date;
}

export interface StrategyQuery {
  problemDescription: string;
  actionType?: ActionType;
  context?: {
    taskType?: string;
    fileExtension?: string;
    errorType?: string;
  };
  maxResults?: number;
}

export interface StrategyMatch {
  pattern: StrategyPattern;
  relevanceScore: number;         // 0-100 how relevant this pattern is
  reason: string;                 // Why this pattern matches
}

export interface StrategyMemoryStats {
  totalPatterns: number;
  totalSuccesses: number;
  totalFailures: number;
  averageSuccessRate: number;
  mostUsedPattern?: StrategyPattern;
  oldestPattern?: StrategyPattern;
  newestPattern?: StrategyPattern;
}

/**
 * Phase 6: Enhanced Planning Types
 * Adds confidence-based planning with fallback strategies
 */

export interface StepConfidence {
  score: number;                    // 0-100 confidence in primary approach
  factors: ConfidenceFactor[];     // What influenced this score
  memoryBacked: boolean;            // Based on past success?
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ConfidenceFactor {
  name: string;                     // e.g., "Memory match", "File exists"
  impact: number;                   // +/- points
  description: string;
}

export interface FallbackPlan {
  id: string;
  stepId: string;                   // Which step this is a fallback for
  trigger: string;                  // When to use (e.g., "If primary fails")
  alternativeAction: StepAction;
  confidence: number;               // Confidence in this fallback
  reasoning: string;                // Why this fallback exists
}

export interface EnhancedAgentStep extends AgentStep {
  confidence?: StepConfidence;      // Confidence in this step
  fallbackPlans?: FallbackPlan[];   // Alternative approaches
  confidenceHistory?: number[];     // Track confidence over retries
}

export interface PlanningInsights {
  overallConfidence: number;        // Average across all steps
  highRiskSteps: number;            // Count of high-risk steps
  memoryBackedSteps: number;        // Steps with memory support
  fallbacksGenerated: number;
  estimatedSuccessRate: number;     // Based on confidence + memory
}
