/**
 * ExecutionEngine Service (Refactored)
 *
 * Executes agent task steps with approval gates, error handling, and rollback support.
 * Implements 2025 best practices for agentic AI workflows.
 *
 * This is a facade that delegates to modular components:
 * - TaskLifecycleManager: Task execution, persistence, resumption
 * - StepExecutor: Individual step execution with retry/fallback
 * - Action Executors: File, Code, System operations
 * - SelfCorrection: Alternative strategy generation
 */
import { logger } from '../../services/Logger';
import type { AgentTask } from '../../types';
import { FileSystemService } from '../FileSystemService';
import type { GitService } from '../GitService';
import { LiveEditorStream } from '../LiveEditorStream';
import { WorkspaceService } from '../WorkspaceService';

import { MetacognitiveLayer } from './MetacognitiveLayer';
import { ReActExecutor } from './ReActExecutor';
import { StrategyMemory } from './StrategyMemory';
import { TaskPersistence } from './TaskPersistence';
import { UnifiedAIService } from './UnifiedAIService';

// Import from modular execution system
import type {
    ExecutionCallbacks,
    TaskState,
    StepExecutionContext,
} from './execution/types';
import { NonRetryableError } from './execution/types';
import { TaskLifecycleManager } from './execution/TaskLifecycle';

// Re-export types for backward compatibility
export type { ExecutionCallbacks };
export { NonRetryableError };

/**
 * ExecutionEngine - Facade for the modular execution system
 *
 * Maintains the same public API as the original ExecutionEngine,
 * but delegates to specialized modules internally.
 */
export class ExecutionEngine {
    private taskPersistence: TaskPersistence;
    private metacognitiveLayer: MetacognitiveLayer;
    private reactExecutor: ReActExecutor;
    private strategyMemory: StrategyMemory;
    private taskLifecycleManager: TaskLifecycleManager;
    private liveStream: LiveEditorStream | undefined;
    private enableReAct: boolean = true;
    private enableMemory: boolean = true;
    private currentCallbacks: ExecutionCallbacks | undefined;
    private currentTaskState: TaskState = {
        task: null,
        userRequest: '',
        workspaceRoot: '',
    };

    constructor(
        private fileSystemService: FileSystemService,
        private aiService: UnifiedAIService,
        private workspaceService: WorkspaceService,
        private gitService: GitService
    ) {
        this.taskPersistence = new TaskPersistence(fileSystemService);
        this.metacognitiveLayer = new MetacognitiveLayer(aiService);
        this.reactExecutor = new ReActExecutor(aiService);
        this.strategyMemory = new StrategyMemory();
        this.taskLifecycleManager = new TaskLifecycleManager(this.taskPersistence);

        // Use deepseek-reasoner for agentic tasks
        this.aiService.setModel('deepseek-reasoner').catch((error) => {
            logger.warn('[ExecutionEngine] Failed to set reasoning model, falling back to default:', error);
        });
    }

    /**
     * Sets task context for persistence
     */
    setTaskContext(userRequest: string, workspaceRoot: string): void {
        this.currentTaskState.userRequest = userRequest;
        this.currentTaskState.workspaceRoot = workspaceRoot;
    }

    /**
     * Sets live editor stream instance for Phase 7 live streaming
     */
    setLiveStream(liveStream: LiveEditorStream): void {
        this.liveStream = liveStream;
    }

    /**
     * Creates the step execution context with all dependencies
     */
    private createStepExecutionContext(): StepExecutionContext {
        return {
            fileSystemService: this.fileSystemService,
            aiService: this.aiService,
            workspaceService: this.workspaceService,
            gitService: this.gitService,
            taskState: this.currentTaskState,
            liveStream: this.liveStream,
            callbacks: this.currentCallbacks,
            metacognitiveLayer: this.metacognitiveLayer,
            reactExecutor: this.reactExecutor,
            strategyMemory: this.strategyMemory,
            enableReAct: this.enableReAct,
            enableMemory: this.enableMemory,
        };
    }

    /**
     * Executes a complete task with all its steps
     */
    async executeTask(task: AgentTask, callbacks?: ExecutionCallbacks): Promise<AgentTask> {
        this.currentTaskState.task = task;
        this.currentCallbacks = callbacks;

        const context = this.createStepExecutionContext();
        return await this.taskLifecycleManager.executeTask(task, context, callbacks);
    }

    /**
     * Resumes a previously persisted task
     */
    async resumeTask(taskId: string, callbacks?: ExecutionCallbacks): Promise<AgentTask | null> {
        this.currentCallbacks = callbacks;

        const context = this.createStepExecutionContext();
        const result = await this.taskLifecycleManager.resumeTask(taskId, context, callbacks);

        if (result) {
            this.currentTaskState.task = result;
        }

        return result;
    }

    /**
     * Gets list of resumable tasks
     */
    async getResumableTasks(): Promise<Array<{ id: string; title: string; progress: string; timestamp: Date }>> {
        return await this.taskLifecycleManager.getResumableTasks();
    }

    /**
     * Rolls back a task by reversing completed steps
     */
    async rollbackTask(task: AgentTask): Promise<{
        success: boolean;
        stepsRolledBack: string[];
        filesRestored: string[];
        error?: string;
    }> {
        const context = this.createStepExecutionContext();
        return await this.taskLifecycleManager.rollbackTask(task, context);
    }

    // Control methods
    pause(): void {
        this.taskLifecycleManager.pause();
    }

    resume(): void {
        this.taskLifecycleManager.resume();
    }

    isPausedState(): boolean {
        return this.taskLifecycleManager.isPausedState();
    }

    clearHistory(taskId: string): void {
        this.taskLifecycleManager.clearHistory(taskId);
    }

    // Feature flag setters
    setEnableReAct(enabled: boolean): void {
        this.enableReAct = enabled;
    }

    setEnableMemory(enabled: boolean): void {
        this.enableMemory = enabled;
    }
}
