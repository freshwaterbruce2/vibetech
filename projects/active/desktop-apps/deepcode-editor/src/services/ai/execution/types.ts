/**
 * Execution Module Types
 *
 * Shared types for the modular ExecutionEngine architecture
 */
import {
    ActionType,
    AgentStep,
    AgentTask,
    ApprovalRequest,
    StepAction,
    StepResult,
} from '../../../types';
import { FileSystemService } from '../../FileSystemService';
import type { GitService } from '../../GitService';
import { LiveEditorStream } from '../../LiveEditorStream';
import { WorkspaceService } from '../../WorkspaceService';
import { MetacognitiveLayer } from '../MetacognitiveLayer';
import { ReActExecutor } from '../ReActExecutor';
import { StrategyMemory } from '../StrategyMemory';
import { UnifiedAIService } from '../UnifiedAIService';

/**
 * Custom error for non-retryable failures (e.g., file not found)
 * These errors should skip the step instead of retrying
 */
export class NonRetryableError extends Error {
    constructor(message: string, public readonly reason: string = 'non-retryable') {
        super(message);
        this.name = 'NonRetryableError';
    }
}

/**
 * Callbacks for execution lifecycle events
 */
export interface ExecutionCallbacks {
    onStepStart?: (step: AgentStep) => void;
    onStepComplete?: (step: AgentStep, result: StepResult) => void;
    onStepError?: (step: AgentStep, error: Error) => void;
    onStepApprovalRequired?: (step: AgentStep, request: ApprovalRequest) => Promise<boolean>;
    onTaskProgress?: (completedSteps: number, totalSteps: number) => void;
    onTaskComplete?: (task: AgentTask) => void;
    onTaskError?: (task: AgentTask, error: Error) => void;
    onFileChanged?: (filePath: string, action: 'created' | 'modified' | 'deleted') => void;
}

/**
 * Current task state tracking
 */
export interface TaskState {
    task: AgentTask | null;
    userRequest: string;
    workspaceRoot: string;
}

/**
 * Context passed to action executors
 */
export interface ActionContext {
    fileSystemService: FileSystemService;
    aiService: UnifiedAIService;
    workspaceService: WorkspaceService;
    gitService: GitService;
    taskState: TaskState;
    liveStream: LiveEditorStream | undefined;
    callbacks: ExecutionCallbacks | undefined;
}

/**
 * Context for step execution
 */
export interface StepExecutionContext extends ActionContext {
    metacognitiveLayer: MetacognitiveLayer;
    reactExecutor: ReActExecutor;
    strategyMemory: StrategyMemory;
    enableReAct: boolean;
    enableMemory: boolean;
}

/**
 * Result from self-correction analysis
 */
export interface AlternativeStrategy {
    analysis: string;
    strategy: string;
    action: ActionType;
    params: Record<string, unknown>;
    confidence: number;
    fallback: 'skip' | 'fail' | 'ask_user';
}

/**
 * Action executor function signature
 */
export type ActionExecutor = (
    params: Record<string, unknown>,
    context: ActionContext
) => Promise<StepResult>;

/**
 * Action registry type
 */
export type ActionRegistry = Map<ActionType, ActionExecutor>;

// Re-export commonly used types
export type {
    ActionType,
    AgentStep,
    AgentTask,
    ApprovalRequest,
    StepAction,
    StepResult,
};
