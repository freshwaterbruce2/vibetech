/**
 * ReActExecutor Service - Phase 4
 *
 * Implements the ReAct pattern (Reason-Act-Observe-Reflect) for agent step execution.
 * Provides Chain-of-Thought reasoning before actions and learning from outcomes.
 *
 * Pattern Flow:
 * 1. Thought: Reason about the best approach BEFORE taking action
 * 2. Action: Execute the planned step
 * 3. Observation: Analyze the actual outcome
 * 4. Reflection: Learn from the result and decide next steps
 *
 * @see https://arxiv.org/abs/2210.03629 (ReAct paper)
 */
import { logger } from '../../services/Logger';
import { databaseService } from '../../services/DatabaseService';
import {
  AgentStep,
  AgentTask,
  ReActCycle,
  ReActObservation,
  ReActReflection,
  ReActThought,
  StepAction,
  StepResult,
} from '../../types';

import { UnifiedAIService } from './UnifiedAIService';

export class ReActExecutor {
  private cycleHistory: Map<string, ReActCycle[]> = new Map();

  constructor(private aiService: UnifiedAIService) { }

  /**
   * Phase 1: THOUGHT - Reason about approach before acting
   * Generates detailed reasoning about how to execute the step
   */
  async generateThought(
    step: AgentStep,
    task: AgentTask,
    previousAttempts: ReActCycle[] = []
  ): Promise<ReActThought> {
    const startTime = Date.now();

    const previousLearnings = previousAttempts.length > 0
      ? `\n**Previous Attempts:**\n${previousAttempts.map((cycle, i) => `
Attempt ${i + 1}:
- Approach: ${cycle.thought.approach}
- Outcome: ${cycle.observation.actualOutcome}
- Why it ${cycle.observation.success ? 'worked' : 'failed'}: ${cycle.reflection.rootCause || 'N/A'}
- Learnings: ${cycle.reflection.knowledgeGained}
`).join('\n')}`
      : '';

    const prompt = `You are an AI coding agent about to execute a task step. Think carefully about the best approach BEFORE taking action.

**Task Context:**
User Request: ${task.userRequest}
Workspace: ${task.description}
Total Steps: ${task.steps.length}

**Current Step (#${step.order}):**
Title: ${step.title}
Description: ${step.description}
Planned Action: ${step.action.type}
Params: ${JSON.stringify(step.action.params, null, 2)}
${previousLearnings}

**Your Task:**
Reason about the best way to execute this step. Consider:
1. What is the GOAL of this step?
2. What approach should I use?
3. What alternatives exist?
4. What could go wrong?
5. What do I expect to happen?

**Response Format (JSON only):**
{
  "reasoning": "Step-by-step thought process about this step",
  "approach": "Specific strategy I'll use (e.g., 'Read file first to check existence')",
  "alternatives": ["Alternative 1", "Alternative 2"],
  "confidence": 85,
  "risks": ["Risk 1: File might not exist", "Risk 2: ..."],
  "expectedOutcome": "What I expect to happen when I execute this"
}`;

    try {
      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: undefined,
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const thoughtData = JSON.parse(jsonMatch[0]);

        const thought: ReActThought = {
          reasoning: thoughtData.reasoning || 'No reasoning provided',
          approach: thoughtData.approach || step.action.type,
          alternatives: thoughtData.alternatives || [],
          confidence: Math.min(100, Math.max(0, thoughtData.confidence || 50)),
          risks: thoughtData.risks || [],
          expectedOutcome: thoughtData.expectedOutcome || 'Unknown',
          timestamp: new Date(),
        };

        logger.debug(`[ReAct] 💭 Thought generated in ${Date.now() - startTime}ms`);
        logger.debug(`[ReAct]    Approach: ${thought.approach}`);
        logger.debug(`[ReAct]    Confidence: ${thought.confidence}%`);
        logger.debug(`[ReAct]    Risks: ${thought.risks.length}`);

        return thought;
      }

      throw new Error('Failed to parse AI thought response');
    } catch (error) {
      logger.error('[ReAct] ❌ Failed to generate thought:', error);

      // Fallback to basic thought
      return {
        reasoning: `Executing ${step.action.type} as planned`,
        approach: step.action.type,
        alternatives: [],
        confidence: 50,
        risks: ['Unknown - thought generation failed'],
        expectedOutcome: 'Unknown',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Phase 3: OBSERVATION - Analyze what actually happened
   * Compares expected vs actual outcome
   */
  async generateObservation(
    thought: ReActThought,
    action: StepAction,
    result: StepResult,
    executionTimeMs: number
  ): Promise<ReActObservation> {
    const startTime = Date.now();

    const prompt = `You are an AI coding agent analyzing the outcome of an action you just took.

**What You Thought Would Happen:**
Expected: ${thought.expectedOutcome}
Approach Used: ${thought.approach}
Confidence: ${thought.confidence}%
Identified Risks: ${thought.risks.join(', ')}

**What You Tried:**
Action: ${action.type}
Params: ${JSON.stringify(action.params, null, 2)}
Execution Time: ${executionTimeMs}ms

**What Actually Happened:**
Success: ${result.success}
${result.message ? `Message: ${result.message}` : ''}
${result.data ? `Data: ${JSON.stringify(result.data).substring(0, 200)}...` : ''}
${result.filesModified?.length ? `Files Modified: ${result.filesModified.join(', ')}` : ''}
${result.filesCreated?.length ? `Files Created: ${result.filesCreated.join(', ')}` : ''}

**Your Task:**
Analyze the outcome compared to your expectations.

**Response Format (JSON only):**
{
  "actualOutcome": "Brief description of what happened",
  "success": ${result.success},
  "differences": ["Difference 1 between expected and actual", "Difference 2"],
  "learnings": ["Learning 1", "Learning 2"],
  "unexpectedEvents": ["Unexpected event 1", "Unexpected event 2"]
}`;

    try {
      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: undefined,
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const obsData = JSON.parse(jsonMatch[0]);

        const observation: ReActObservation = {
          actualOutcome: obsData.actualOutcome || result.message || 'Action executed',
          success: result.success,
          differences: obsData.differences || [],
          learnings: obsData.learnings || [],
          unexpectedEvents: obsData.unexpectedEvents || [],
          timestamp: new Date(),
        };

        logger.debug(`[ReAct] 👁️ Observation generated in ${Date.now() - startTime}ms`);
        logger.debug(`[ReAct]    Outcome: ${observation.actualOutcome}`);
        logger.debug(`[ReAct]    Learnings: ${observation.learnings.length}`);

        return observation;
      }

      throw new Error('Failed to parse observation response');
    } catch (error) {
      logger.error('[ReAct] ❌ Failed to generate observation:', error);

      return {
        actualOutcome: result.message || (result.success ? 'Success' : 'Failed'),
        success: result.success,
        differences: [],
        learnings: [],
        unexpectedEvents: [],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Phase 4: REFLECTION - Learn from the outcome
   * Decides whether to retry and what to change
   */
  async generateReflection(
    thought: ReActThought,
    observation: ReActObservation,
    step: AgentStep,
    previousAttempts: ReActCycle[] = []
  ): Promise<ReActReflection> {
    const startTime = Date.now();

    const prompt = `You are an AI coding agent reflecting on the outcome of an action.

**Your Original Plan:**
Reasoning: ${thought.reasoning}
Approach: ${thought.approach}
Confidence: ${thought.confidence}%
Expected: ${thought.expectedOutcome}

**What Happened:**
Actual Outcome: ${observation.actualOutcome}
Success: ${observation.success}
Differences: ${observation.differences.join(', ') || 'None'}
Unexpected Events: ${observation.unexpectedEvents.join(', ') || 'None'}

**Previous Attempts:** ${previousAttempts.length}
${previousAttempts.length > 0 ? `Last attempt failed because: ${previousAttempts[previousAttempts.length - 1].reflection.rootCause}` : 'First attempt'}

**Current Retry Count:** ${step.retryCount} / ${step.maxRetries}

**Your Task:**
Reflect deeply on what happened. Should we retry with changes, or is this good enough?

**Response Format (JSON only):**
{
  "whatWorked": ["Thing 1 that worked", "Thing 2"],
  "whatFailed": ["Thing 1 that failed", "Thing 2"],
  "rootCause": "Root cause of failure (if failed)",
  "shouldRetry": ${!observation.success && step.retryCount < step.maxRetries},
  "suggestedChanges": ["Change 1 for next attempt", "Change 2"],
  "knowledgeGained": "Key insight learned from this attempt"
}`;

    try {
      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: undefined,
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const refData = JSON.parse(jsonMatch[0]);

        const reflection: ReActReflection = {
          whatWorked: refData.whatWorked || [],
          whatFailed: refData.whatFailed || [],
          rootCause: refData.rootCause,
          shouldRetry: refData.shouldRetry === true,
          suggestedChanges: refData.suggestedChanges || [],
          knowledgeGained: refData.knowledgeGained || 'No specific learning captured',
          timestamp: new Date(),
        };

        logger.debug(`[ReAct] 🤔 Reflection generated in ${Date.now() - startTime}ms`);
        logger.debug(`[ReAct]    Should Retry: ${reflection.shouldRetry}`);
        logger.debug(`[ReAct]    Root Cause: ${reflection.rootCause || 'N/A'}`);
        logger.debug(`[ReAct]    Knowledge: ${reflection.knowledgeGained}`);

        return reflection;
      }

      throw new Error('Failed to parse reflection response');
    } catch (error) {
      logger.error('[ReAct] ❌ Failed to generate reflection:', error);

      return {
        whatWorked: observation.success ? ['Action completed successfully'] : [],
        whatFailed: observation.success ? [] : ['Action failed'],
        rootCause: observation.success ? undefined : 'Unknown',
        shouldRetry: !observation.success && step.retryCount < step.maxRetries,
        suggestedChanges: [],
        knowledgeGained: 'Reflection generation failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute a complete ReAct cycle for a step
   * Returns the cycle with all phases completed
   */
  async executeReActCycle(
    step: AgentStep,
    task: AgentTask,
    actionExecutor: (action: StepAction) => Promise<StepResult>
  ): Promise<ReActCycle> {
    const cycleStartTime = Date.now();
    const previousCycles = this.cycleHistory.get(step.id) || [];
    const cycleNumber = previousCycles.length + 1;

    logger.debug(`\n[ReAct] 🔄 Starting Cycle #${cycleNumber} for step: ${step.title}`);

    // Phase 1: THOUGHT
    logger.debug('[ReAct] Phase 1/4: Generating thought...');
    const thought = await this.generateThought(step, task, previousCycles);

    // Phase 2: ACTION (executed by caller's actionExecutor function)
    logger.debug('[ReAct] Phase 2/4: Executing action...');
    const actionStartTime = Date.now();
    const result = await actionExecutor(step.action);
    const actionDuration = Date.now() - actionStartTime;

    // Phase 3: OBSERVATION
    logger.debug('[ReAct] Phase 3/4: Observing outcome...');
    const observation = await this.generateObservation(thought, step.action, result, actionDuration);

    // Phase 4: REFLECTION
    logger.debug('[ReAct] Phase 4/4: Reflecting on result...');
    const reflection = await this.generateReflection(thought, observation, step, previousCycles);

    const cycle: ReActCycle = {
      stepId: step.id,
      thought,
      action: step.action,
      observation,
      reflection,
      cycleNumber,
      totalDurationMs: Date.now() - cycleStartTime,
    };

    // Store cycle history
    previousCycles.push(cycle);
    this.cycleHistory.set(step.id, previousCycles);

    logger.debug(`[ReAct] ✅ Cycle #${cycleNumber} complete in ${cycle.totalDurationMs}ms`);
    logger.debug(`[ReAct]    Success: ${observation.success}, Retry: ${reflection.shouldRetry}\n`);

    // Log successful ReAct cycle as knowledge
    if (observation.success) {
      await databaseService.addKnowledge({
        title: `ReAct Success: ${step.title}`,
        content: `Approach: ${thought.approach}\nAction: ${step.action.type}\nResult: ${observation.actualOutcome}\nConfidence: ${thought.confidence}%\nDuration: ${cycle.totalDurationMs}ms\nOutcome: ${observation.learnings.join(', ')}`,
        category: 'react_pattern',
        tags: ['react', 'success', String(step.action.type), 'reasoning', `cycle-${cycleNumber}`],
        source: 'react_executor'
      }).catch(dbError => {
        logger.warn('[ReActExecutor] Failed to log successful cycle:', dbError);
      });
    } else if (reflection.shouldRetry) {
      // Log failed cycle that will be retried
      await databaseService.logMistake({
        mistakeType: 'react_failure',
        mistakeCategory: 'execution',
        description: `ReAct cycle failed: ${observation.actualOutcome}`,
        contextWhenOccurred: `Step: ${step.title}, Cycle: ${cycleNumber}`,
        rootCauseAnalysis: observation.unexpectedEvents?.join(', ') || 'Unknown failure',
        impactSeverity: 'LOW',
        preventionStrategy: reflection.suggestedChanges.join(', ') || 'Retry with adjustments',
        resolved: false,
        tags: ['react', 'failure', 'retry', String(step.action.type)]
      }).catch(dbError => {
        logger.warn('[ReActExecutor] Failed to log cycle failure:', dbError);
      });
    }

    return cycle;
  }

  /**
   * Get all ReAct cycles for a step
   */
  getCycleHistory(stepId: string): ReActCycle[] {
    return this.cycleHistory.get(stepId) || [];
  }

  /**
   * Clear history for a step (e.g., when step completes)
   */
  clearStepHistory(stepId: string): void {
    this.cycleHistory.delete(stepId);
  }

  /**
   * Reset all history (e.g., new task)
   */
  resetAllHistory(): void {
    this.cycleHistory.clear();
    logger.debug('[ReAct] History reset for new task');
  }
}
