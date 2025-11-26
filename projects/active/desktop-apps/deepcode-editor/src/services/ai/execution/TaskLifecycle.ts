/**
 * Task Lifecycle Module
 *
 * Handles task execution, persistence, resumption, and completion.
 * Implements 2025 best practices for agentic AI workflows.
 */
import { logger } from '../../../services/Logger';
import type {
    AgentStep,
    AgentTask,
    StepResult,
    ExecutionCallbacks,
    StepExecutionContext,
    ActionContext,
} from './types';
import { TaskPersistence } from '../TaskPersistence';
import { executeStepWithFallbacks } from './StepExecutor';
import { buildApprovalRequest, storeStepResult } from './utils';

/**
 * Task lifecycle manager
 */
export class TaskLifecycleManager {
    private executionHistory: Map<string, StepResult[]> = new Map();
    private isPaused: boolean = false;

    constructor(private taskPersistence: TaskPersistence) {}

    /**
     * Executes a complete task with all its steps
     * Implements sequential orchestration pattern from 2025 best practices
     */
    async executeTask(
        task: AgentTask,
        context: StepExecutionContext,
        callbacks?: ExecutionCallbacks
    ): Promise<AgentTask> {
        return await this.executeTaskFromStep(task, 0, context, callbacks);
    }

    /**
     * Resumes a previously persisted task
     */
    async resumeTask(
        taskId: string,
        context: StepExecutionContext,
        callbacks?: ExecutionCallbacks
    ): Promise<AgentTask | null> {
        const persistedTask = await this.taskPersistence.getPersistedTask(taskId);
        if (!persistedTask) {
            logger.warn(`[TaskLifecycle] No persisted task found with ID: ${taskId}`);
            return null;
        }

        logger.debug(`[TaskLifecycle] Resuming task: ${persistedTask.originalTask.title} from step ${persistedTask.currentStepIndex + 1}`);

        // Update task context
        context.taskState.task = persistedTask.originalTask;
        context.taskState.userRequest = persistedTask.metadata.userRequest;
        context.taskState.workspaceRoot = persistedTask.metadata.workspaceRoot;

        // Resume from the next step
        const resumedTask = { ...persistedTask.originalTask };
        resumedTask.status = 'in_progress';

        return await this.executeTaskFromStep(
            resumedTask,
            persistedTask.currentStepIndex + 1,
            context,
            callbacks
        );
    }

    /**
     * Gets list of resumable tasks
     */
    async getResumableTasks(): Promise<Array<{ id: string; title: string; progress: string; timestamp: Date }>> {
        const persistedTasks = await this.taskPersistence.getPersistedTasks();
        return persistedTasks.map(task => ({
            id: task.id,
            title: task.originalTask.title,
            progress: `${task.metadata.completedStepsCount}/${task.metadata.totalSteps} steps completed`,
            timestamp: new Date(task.timestamp),
        }));
    }

    /**
     * Executes a task starting from a specific step (used for resumption)
     */
    private async executeTaskFromStep(
        task: AgentTask,
        startStepIndex: number,
        context: StepExecutionContext,
        callbacks?: ExecutionCallbacks
    ): Promise<AgentTask> {
        const startTime = Date.now();
        task.status = 'in_progress';
        task.startedAt = new Date();

        // Reset AI layers for new task execution
        if (startStepIndex === 0) {
            context.metacognitiveLayer.resetForNewTask();
            context.reactExecutor.resetAllHistory();
            logger.debug('[TaskLifecycle] 🧠 Metacognitive monitoring active');
            logger.debug('[TaskLifecycle] 🔄 ReAct pattern enabled:', context.enableReAct);
            logger.debug('[TaskLifecycle] 💾 Strategy memory enabled:', context.enableMemory);

            // Log memory stats
            if (context.enableMemory) {
                const stats = context.strategyMemory.getStats();
                logger.debug(`[TaskLifecycle] 📊 Memory has ${stats.totalPatterns} pattern(s), ${stats.averageSuccessRate.toFixed(1)}% avg success rate`);
            }
        }

        try {
            // Sequential execution with context preservation
            for (let i = startStepIndex; i < task.steps.length; i++) {
                if (this.isPaused) {
                    task.status = 'paused';
                    // Save current progress
                    if (context.taskState.userRequest && context.taskState.workspaceRoot) {
                        await this.taskPersistence.saveTaskState(
                            task,
                            i,
                            context.taskState.userRequest,
                            context.taskState.workspaceRoot
                        );
                    }
                    break;
                }

                const step = task.steps[i];
                if (!step) { continue; }

                // Check if approval is required (human-in-the-loop pattern)
                if (step.requiresApproval && !step.approved) {
                    step.status = 'awaiting_approval';

                    if (callbacks?.onStepApprovalRequired) {
                        const approvalRequest = buildApprovalRequest(task, step);
                        const approved = await callbacks.onStepApprovalRequired(step, approvalRequest);

                        if (!approved) {
                            step.status = 'rejected';
                            task.status = 'cancelled';
                            return task;
                        }

                        step.approved = true;
                        step.status = 'approved';
                    } else {
                        // No callback provided - auto-approve for testing
                        step.approved = true;
                        step.status = 'approved';
                    }
                }

                // Execute step with fallback support (includes retry logic)
                const result = await executeStepWithFallbacks(step, context, callbacks);

                // Store result for potential rollback
                storeStepResult(this.executionHistory, task.id, result);

                // Save progress after each step completion
                if (result.success && context.taskState.userRequest && context.taskState.workspaceRoot) {
                    await this.taskPersistence.saveTaskState(
                        task,
                        i,
                        context.taskState.userRequest,
                        context.taskState.workspaceRoot
                    );
                }

                // Update progress
                if (callbacks?.onTaskProgress) {
                    callbacks.onTaskProgress(i + 1, task.steps.length);
                }

                // If step failed and no retries left, rollback and fail task
                if (!result.success && step.retryCount >= step.maxRetries) {
                    task.error = `Step ${step.order} failed: ${result.message}`;
                    task.status = 'failed';

                    // Attempt rollback
                    await this.rollbackTask(task, context);

                    if (callbacks?.onTaskError) {
                        callbacks.onTaskError(task, new Error(task.error));
                    }

                    return task;
                }
            }

            // Task completed successfully
            if (!this.isPaused) {
                // Auto-generate synthesis if multiple files were analyzed
                const synthesisStep = await this.generateAutoSynthesis(task, context);
                if (synthesisStep) {
                    task.steps.push(synthesisStep);
                    logger.debug('[TaskLifecycle] Added auto-synthesis step to task');

                    if (callbacks?.onStepComplete) {
                        callbacks.onStepComplete(synthesisStep, synthesisStep.result!);
                    }
                }

                // Mark task as completed
                task.status = 'completed';
                task.completedAt = new Date();
                task.metadata = {
                    ...task.metadata,
                    executionTimeMs: Date.now() - startTime,
                };

                logger.debug('[TaskLifecycle] ✅ TASK COMPLETED - Status:', task.status);

                if (callbacks?.onTaskComplete) {
                    callbacks.onTaskComplete(task);
                    logger.debug('[TaskLifecycle] ✅ onTaskComplete callback fired');
                }
            }

            return task;
        } catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';

            // Attempt rollback on catastrophic failure
            await this.rollbackTask(task, context);

            if (callbacks?.onTaskError) {
                callbacks.onTaskError(task, error as Error);
            }

            return task;
        }
    }

    /**
     * Automatically generate synthesis when multiple files analyzed
     */
    private async generateAutoSynthesis(
        task: AgentTask,
        context: StepExecutionContext
    ): Promise<AgentStep | null> {
        try {
            logger.debug('[TaskLifecycle] 🔍 Checking if auto-synthesis needed...');

            // Collect all steps with AI-generated content
            const stepsWithAIContent = task.steps.filter(step =>
                step.status === 'completed' &&
                step.result?.success &&
                (step.result.data as any)?.generatedCode
            );

            // Only synthesize if we have 2+ AI-analyzed files
            if (stepsWithAIContent.length < 2) {
                logger.debug(`[TaskLifecycle] Skipping auto-synthesis (only ${stepsWithAIContent.length} AI-analyzed steps)`);
                return null;
            }

            logger.debug(`[TaskLifecycle] ✨ Auto-synthesizing results from ${stepsWithAIContent.length} analyzed files...`);

            // Collect file paths and reviews
            const fileAnalyses = stepsWithAIContent.map(step => {
                const data = step.result!.data as any;
                const filePath = data?.filePath || data?.analysis?.filePath || 'unknown';
                const review = data?.generatedCode || data?.analysis?.aiReview || '';
                return `\n### ${filePath}\n${review}`;
            }).join('\n\n---\n');

            // Generate synthesis prompt
            const synthesisPrompt = `You are reviewing a codebase. You've analyzed ${stepsWithAIContent.length} files individually. Now provide a COMPREHENSIVE SYNTHESIS of your findings.

## Individual File Analyses:
${fileAnalyses}

## Your Task:
Synthesize the above analyses into a cohesive, actionable code review report. Include:

1. **Overall Assessment** - High-level code quality summary
2. **Common Patterns** - Repeated issues or good practices across files
3. **Priority Improvements** - Top 3-5 most important changes needed
4. **Architecture Insights** - How the files work together, design patterns observed
5. **Positive Highlights** - What's done well

Be detailed, specific, and actionable. Reference specific files when making points.`;

            // Call AI for synthesis
            const response = await context.aiService.sendContextualMessage({
                userQuery: synthesisPrompt,
                workspaceContext: {
                    rootPath: context.taskState.workspaceRoot || '',
                    totalFiles: stepsWithAIContent.length,
                    languages: [],
                    testFiles: 0,
                    projectStructure: {},
                    dependencies: {},
                    exports: {},
                    symbols: {},
                    lastIndexed: new Date(),
                    summary: 'Code review synthesis',
                },
                currentFile: undefined,
                relatedFiles: [],
                conversationHistory: [],
            });

            // Create virtual synthesis step
            const synthesisStep: AgentStep = {
                id: `synthesis-${Date.now()}`,
                taskId: task.id,
                order: task.steps.length + 1,
                title: '📊 Comprehensive Review Summary',
                description: `Synthesis of ${stepsWithAIContent.length} file analyses`,
                action: {
                    type: 'generate_code',
                    params: {
                        description: 'Final synthesis',
                    },
                },
                status: 'completed',
                requiresApproval: false,
                maxRetries: 0,
                retryCount: 0,
                result: {
                    success: true,
                    data: {
                        generatedCode: response.content,
                        isSynthesis: true,
                    },
                    message: `✅ Synthesized findings from ${stepsWithAIContent.length} files`,
                },
            };

            logger.debug('[TaskLifecycle] ✅ Auto-synthesis complete!');
            return synthesisStep;

        } catch (error) {
            logger.error('[TaskLifecycle] ❌ Auto-synthesis failed:', error);
            return null;
        }
    }

    /**
     * Rolls back a task by reversing completed steps
     */
    async rollbackTask(task: AgentTask, context: ActionContext): Promise<{
        success: boolean;
        stepsRolledBack: string[];
        filesRestored: string[];
        error?: string;
    }> {
        const rolledBackSteps: string[] = [];
        const restoredFiles: string[] = [];

        try {
            const stepResults = this.executionHistory.get(task.id) || [];

            // Reverse the steps
            for (let i = stepResults.length - 1; i >= 0; i--) {
                const result = stepResults[i];
                if (!result) { continue; }

                // Attempt to reverse the action
                if (result.filesCreated) {
                    for (const file of result.filesCreated) {
                        try {
                            await context.fileSystemService.deleteFile(file);
                            restoredFiles.push(file);
                        } catch (error) {
                            logger.error(`Failed to delete created file during rollback: ${file}`, error);
                        }
                    }
                }

                if (result.filesModified) {
                    logger.warn(`Cannot restore modified files without backup: ${result.filesModified.join(', ')}`);
                }

                if (result.filesDeleted) {
                    logger.warn(`Cannot restore deleted files: ${result.filesDeleted.join(', ')}`);
                }

                rolledBackSteps.push(`Step ${i + 1}`);
            }

            // Clear execution history for this task
            this.executionHistory.delete(task.id);

            return {
                success: true,
                stepsRolledBack: rolledBackSteps,
                filesRestored: restoredFiles,
            };
        } catch (error) {
            return {
                success: false,
                stepsRolledBack: rolledBackSteps,
                filesRestored: restoredFiles,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Control methods
    pause(): void {
        this.isPaused = true;
    }

    resume(): void {
        this.isPaused = false;
    }

    isPausedState(): boolean {
        return this.isPaused;
    }

    clearHistory(taskId: string): void {
        this.executionHistory.delete(taskId);
    }
}
