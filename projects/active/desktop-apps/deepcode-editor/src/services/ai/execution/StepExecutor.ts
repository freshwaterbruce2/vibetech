/**
 * Step Executor Module
 *
 * Handles individual step execution with retry logic, ReAct pattern integration,
 * and metacognitive monitoring.
 */
import { logger } from '../../../services/Logger';
import type { StuckPattern } from '../MetacognitiveLayer';
import type {
    AgentStep,
    AgentTask,
    StepResult,
    ExecutionCallbacks,
    StepExecutionContext,
} from './types';
import { createActionRegistry, executeAction } from './actions';
import { generateAlternativeStrategy, calculateBackoffDelay } from './SelfCorrection';
import { sleep } from './utils';

/**
 * Executes a step with fallback plans if primary approach fails
 */
export async function executeStepWithFallbacks(
    step: AgentStep,
    context: StepExecutionContext,
    callbacks?: ExecutionCallbacks
): Promise<StepResult> {
    // Try primary approach first
    const result = await executeStepWithRetry(step, context, callbacks);

    // If failed and fallbacks exist, try each fallback
    const enhancedStep = step as any; // EnhancedAgentStep type
    if (!result.success && enhancedStep.fallbackPlans && enhancedStep.fallbackPlans.length > 0) {
        logger.debug(`[StepExecutor] ❌ Primary approach failed, trying fallbacks...`);

        for (const fallback of enhancedStep.fallbackPlans) {
            logger.debug(`[StepExecutor] 📋 Fallback: ${fallback.reasoning}`);

            // Create temporary step with fallback action
            const fallbackStep: AgentStep = {
                ...step,
                action: fallback.alternativeAction,
            };

            const fallbackResult = await executeStepWithRetry(fallbackStep, context, callbacks);

            if (fallbackResult.success) {
                logger.debug(`[StepExecutor] ✅ Fallback succeeded!`);
                return {
                    ...fallbackResult,
                    data: {
                        ...(typeof fallbackResult.data === 'object' && fallbackResult.data !== null
                            ? (fallbackResult.data as Record<string, unknown>)
                            : {}),
                        usedFallback: true,
                        fallbackId: fallback.id,
                    },
                };
            }
        }

        logger.debug(`[StepExecutor] ❌ All fallbacks exhausted`);
    }

    return result;
}

/**
 * Executes a single step with retry logic and error handling
 * Uses ReAct pattern (Phase 4) + self-correction (Phase 2) + metacognition (Phase 3)
 */
export async function executeStepWithRetry(
    step: AgentStep,
    context: StepExecutionContext,
    callbacks?: ExecutionCallbacks
): Promise<StepResult> {
    const {
        metacognitiveLayer,
        reactExecutor,
        strategyMemory,
        enableReAct,
        enableMemory,
        taskState,
    } = context;

    // Monitor step for stuck patterns
    if (taskState.task) {
        metacognitiveLayer.monitorStepStart(step, taskState.task);
    }

    const actionRegistry = createActionRegistry();

    while (step.retryCount <= step.maxRetries) {
        try {
            step.status = 'in_progress';
            step.startedAt = new Date();

            if (callbacks?.onStepStart) {
                callbacks.onStepStart(step);
            }

            // Query strategy memory for relevant patterns BEFORE execution
            let relevantPatterns: any[] = [];
            if (enableMemory) {
                relevantPatterns = await strategyMemory.queryPatterns({
                    problemDescription: step.description,
                    actionType: step.action.type,
                    context: {
                        taskType: step.action.type,
                    },
                    maxResults: 3,
                });
            }

            // Execute with ReAct pattern (Thought-Action-Observation-Reflection)
            let result: StepResult;
            let reActCycleData: any = null;

            if (enableReAct && taskState.task) {
                logger.debug('[StepExecutor] 🔄 Using ReAct pattern for step execution');

                // Execute the full ReAct cycle
                const reActCycle = await reactExecutor.executeReActCycle(
                    step,
                    taskState.task,
                    // Action executor function
                    async (action) => {
                        return await executeAction(action.type, action.params as Record<string, unknown>, context, actionRegistry);
                    }
                );

                reActCycleData = reActCycle;

                // Use the result from the ReAct cycle
                result = {
                    success: reActCycle.observation.success,
                    message: reActCycle.observation.actualOutcome,
                    data: {
                        reActCycle, // Include full cycle for UI display
                        thought: reActCycle.thought,
                        reflection: reActCycle.reflection,
                        relevantPatterns, // Include memory patterns that were consulted
                    }
                };

                // Store successful pattern to memory
                if (reActCycle.observation.success && enableMemory) {
                    await strategyMemory.storeSuccessfulPattern(
                        step,
                        reActCycle,
                        {
                            taskType: step.action.type,
                        }
                    );
                }

                // If ReAct reflection suggests retry with changes, apply those changes
                if (!reActCycle.observation.success && reActCycle.reflection.shouldRetry) {
                    logger.debug(`[StepExecutor] 🔄 ReAct suggests retry with changes:`, reActCycle.reflection.suggestedChanges);
                }
            } else {
                // Fallback: Execute action directly without ReAct pattern
                result = await executeAction(step.action.type, step.action.params as Record<string, unknown>, context, actionRegistry);
            }

            // Check if step was skipped (e.g., optional file not found)
            if (result.skipped) {
                step.status = 'skipped';
                step.completedAt = new Date();
                step.result = result;

                if (callbacks?.onStepComplete) {
                    callbacks.onStepComplete(step, result);
                }

                return result;
            }

            step.status = 'completed';
            step.completedAt = new Date();
            step.result = result;

            if (callbacks?.onStepComplete) {
                callbacks.onStepComplete(step, result);
            }

            return result;
        } catch (error) {
            step.retryCount++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            logger.error(`[StepExecutor] ❌ Step ${step.order} failed (attempt ${step.retryCount}/${step.maxRetries}):`, errorMessage);

            // Check if agent is stuck before final failure
            const stuckAnalysis = taskState.task
                ? await metacognitiveLayer.analyzeStuckPattern(
                    step,
                    taskState.task,
                    error as Error
                )
                : { isStuck: false, recommendation: '', confidence: 0 };

            if (stuckAnalysis.isStuck && 'shouldSeekHelp' in stuckAnalysis && stuckAnalysis.shouldSeekHelp && taskState.task) {
                logger.debug('[StepExecutor] 🤔 Agent appears stuck, seeking help from AI...');
                try {
                    const helpResponse = await metacognitiveLayer.seekHelp(
                        step,
                        taskState.task,
                        ('pattern' in stuckAnalysis && stuckAnalysis.pattern ? stuckAnalysis.pattern : 'unknown') as StuckPattern
                    );

                    if (helpResponse.shouldContinue) {
                        logger.debug(`[StepExecutor] 💡 AI guidance: ${helpResponse.suggestedApproach}`);
                        // Try the AI's suggested approach as an alternative strategy
                        step.action = {
                            type: 'custom' as any,
                            params: {
                                approach: helpResponse.suggestedApproach,
                                reasoning: helpResponse.reasoning
                            }
                        };
                    } else {
                        logger.debug(`[StepExecutor] 🛑 AI recommends stopping: ${helpResponse.reasoning}`);
                        step.status = 'failed';
                        step.error = `Stopped on AI recommendation: ${helpResponse.reasoning}`;
                        step.completedAt = new Date();

                        return {
                            success: false,
                            message: `AI analysis suggests stopping: ${helpResponse.reasoning}`,
                        };
                    }
                } catch (helpError) {
                    logger.error('[StepExecutor] ⚠️ Failed to get help:', helpError);
                    // Continue with normal retry logic if help-seeking fails
                }
            }

            if (step.retryCount >= step.maxRetries) {
                // Final failure
                step.status = 'failed';
                step.error = errorMessage;
                step.completedAt = new Date();

                const result: StepResult = {
                    success: false,
                    message: `Failed after ${step.maxRetries} retries: ${errorMessage}`,
                };

                if (callbacks?.onStepError) {
                    callbacks.onStepError(step, error as Error);
                }

                return result;
            }

            // Self-Correction - Try different strategy instead of same retry
            logger.debug(`[StepExecutor] 🔄 Attempting self-correction...`);
            const alternativeStrategy = await generateAlternativeStrategy(
                step,
                error as Error,
                step.retryCount,
                context
            );

            if (alternativeStrategy) {
                // Update step action to use alternative strategy
                logger.debug(`[StepExecutor] ✅ Using alternative: ${alternativeStrategy.type}`);
                step.action = alternativeStrategy;
                // Continue loop to try new strategy
            } else {
                // No alternative found, use exponential backoff before retry
                logger.debug(`[StepExecutor] ⚠️ No alternative found, retrying original action...`);
                const backoffMs = calculateBackoffDelay(step.retryCount);
                await sleep(backoffMs);
            }
        }
    }

    // Should never reach here, but TypeScript needs it
    return {
        success: false,
        message: 'Max retries exceeded',
    };
}
