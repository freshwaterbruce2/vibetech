/**
 * Metacognitive Layer Service
 *
 * 2025 ENHANCEMENT: Agent Self-Awareness and Help-Seeking
 * Monitors agent execution and recognizes when it's stuck, then proactively
 * consults the chat AI for guidance (user's brainstorm idea!)
 *
 * Based on research:
 * - Microsoft's metacognitive AI framework (2025)
 * - "Agentic Metacognition" paper (Sept 2025)
 * - ReAct + self-reflection patterns
 */

import { AgentStep, AgentTask } from '../../types';
import { UnifiedAIService } from './UnifiedAIService';

export interface StuckPattern {
  type: 'repeated_error' | 'timeout' | 'circular_reasoning' | 'no_progress';
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
}

export interface MetacognitiveInsight {
  isStuck: boolean;
  pattern?: StuckPattern;
  recommendation: string;
  shouldSeekHelp: boolean;
  confidence: number;
}

export interface HelpRequest {
  context: string;
  problem: string;
  attemptedSolutions: string[];
  taskGoal: string;
}

export interface HelpResponse {
  diagnosis: string;
  suggestedApproach: string;
  alternativeStrategies: string[];
  shouldContinue: boolean;
  reasoning: string;
}

export class MetacognitiveLayer {
  private errorHistory: Map<string, { count: number; lastError: string; timestamp: number }> = new Map();
  private stepStartTimes: Map<string, number> = new Map();
  private helpRequestCount: number = 0;
  private readonly MAX_HELP_REQUESTS_PER_TASK = 3; // Prevent infinite help loops
  private readonly STUCK_TIMEOUT_MS = 30000; // 30 seconds
  private readonly REPEATED_ERROR_THRESHOLD = 3;

  constructor(private aiService: UnifiedAIService) {}

  /**
   * Monitor step execution and detect "stuck" patterns
   * Call this when a step starts
   */
  monitorStepStart(step: AgentStep, task: AgentTask): void {
    this.stepStartTimes.set(step.id, Date.now());
    console.log(`[Metacognitive] Monitoring step: ${step.title}`);
  }

  /**
   * Analyze if agent is stuck and should seek help
   * Call this when a step fails or takes too long
   */
  async analyzeStuckPattern(
    step: AgentStep,
    task: AgentTask,
    error?: Error
  ): Promise<MetacognitiveInsight> {
    console.log('[Metacognitive] 🤔 Analyzing execution state...');

    // Check 1: Repeated errors (same error 3+ times)
    const repeatedErrorPattern = this.detectRepeatedErrors(step, error);
    if (repeatedErrorPattern) {
      console.log('[Metacognitive] 🔴 Detected repeated error pattern');
      return {
        isStuck: true,
        pattern: repeatedErrorPattern,
        recommendation: 'Agent is hitting the same error repeatedly. Should seek help.',
        shouldSeekHelp: this.canSeekHelp(),
        confidence: 0.9,
      };
    }

    // Check 2: Timeout (step taking >30 seconds)
    const timeoutPattern = this.detectTimeout(step);
    if (timeoutPattern) {
      console.log('[Metacognitive] ⏰ Detected timeout pattern');
      return {
        isStuck: true,
        pattern: timeoutPattern,
        recommendation: 'Step is taking too long. May be stuck in processing.',
        shouldSeekHelp: this.canSeekHelp(),
        confidence: 0.7,
      };
    }

    // Check 3: No progress across multiple steps
    const noProgressPattern = this.detectNoProgress(task);
    if (noProgressPattern) {
      console.log('[Metacognitive] 📉 Detected no progress pattern');
      return {
        isStuck: true,
        pattern: noProgressPattern,
        recommendation: 'Multiple consecutive failures. Agent may need new approach.',
        shouldSeekHelp: this.canSeekHelp(),
        confidence: 0.8,
      };
    }

    // Not stuck yet
    return {
      isStuck: false,
      recommendation: 'Execution proceeding normally',
      shouldSeekHelp: false,
      confidence: 1.0,
    };
  }

  /**
   * Seek help from chat AI when stuck
   * This implements the user's brainstormed idea of "asking the chat inside the app in background"
   */
  async seekHelp(
    step: AgentStep,
    task: AgentTask,
    pattern: StuckPattern
  ): Promise<HelpResponse> {
    if (!this.canSeekHelp()) {
      console.warn('[Metacognitive] ⚠️  Max help requests reached, cannot seek more help');
      throw new Error('Maximum help requests exceeded for this task');
    }

    this.helpRequestCount++;
    console.log(`[Metacognitive] 🆘 Seeking help from AI assistant (request ${this.helpRequestCount}/${this.MAX_HELP_REQUESTS_PER_TASK})`);

    // Build help request context
    const helpRequest: HelpRequest = {
      context: this.buildContext(task),
      problem: this.describeProblem(step, pattern),
      attemptedSolutions: this.getAttemptedSolutions(step, task),
      taskGoal: task.userRequest,
    };

    // Consult chat AI in background
    const prompt = this.buildHelpPrompt(helpRequest);

    try {
      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: undefined,
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      // Parse AI response
      const helpResponse = this.parseHelpResponse(response.content);

      console.log(`[Metacognitive] 💡 AI Assistant provided guidance:`);
      console.log(`  Diagnosis: ${helpResponse.diagnosis}`);
      console.log(`  Approach: ${helpResponse.suggestedApproach}`);
      console.log(`  Alternatives: ${helpResponse.alternativeStrategies.length} strategies`);

      return helpResponse;
    } catch (error) {
      console.error('[Metacognitive] ❌ Failed to get help from AI:', error);
      throw error;
    }
  }

  /**
   * Reset metacognitive state for new task
   */
  resetForNewTask(): void {
    this.errorHistory.clear();
    this.stepStartTimes.clear();
    this.helpRequestCount = 0;
    console.log('[Metacognitive] 🔄 Reset for new task');
  }

  // ==================== PRIVATE DETECTION METHODS ====================

  private detectRepeatedErrors(step: AgentStep, error?: Error): StuckPattern | null {
    if (!error) return null;

    const errorKey = `${step.action.type}_${error.message}`;
    const history = this.errorHistory.get(errorKey);

    if (history) {
      history.count++;
      history.lastError = error.message;
      history.timestamp = Date.now();
    } else {
      this.errorHistory.set(errorKey, {
        count: 1,
        lastError: error.message,
        timestamp: Date.now(),
      });
    }

    const currentHistory = this.errorHistory.get(errorKey)!;

    if (currentHistory.count >= this.REPEATED_ERROR_THRESHOLD) {
      return {
        type: 'repeated_error',
        description: `Same error occurred ${currentHistory.count} times`,
        severity: 'high',
        evidence: [
          `Action: ${step.action.type}`,
          `Error: ${error.message}`,
          `Occurrences: ${currentHistory.count}`,
        ],
      };
    }

    return null;
  }

  private detectTimeout(step: AgentStep): StuckPattern | null {
    const startTime = this.stepStartTimes.get(step.id);
    if (!startTime) return null;

    const elapsed = Date.now() - startTime;
    if (elapsed > this.STUCK_TIMEOUT_MS) {
      return {
        type: 'timeout',
        description: `Step running for ${Math.round(elapsed / 1000)}s (threshold: ${this.STUCK_TIMEOUT_MS / 1000}s)`,
        severity: 'medium',
        evidence: [
          `Step: ${step.title}`,
          `Action: ${step.action.type}`,
          `Duration: ${Math.round(elapsed / 1000)}s`,
        ],
      };
    }

    return null;
  }

  private detectNoProgress(task: AgentTask): StuckPattern | null {
    // Count consecutive failed/skipped steps
    let consecutiveFailures = 0;
    for (let i = task.steps.length - 1; i >= 0 && consecutiveFailures < 3; i--) {
      const step = task.steps[i];
      if (step.status === 'failed' || step.status === 'skipped') {
        consecutiveFailures++;
      } else if (step.status === 'completed') {
        break; // Found a success, stop counting
      }
    }

    if (consecutiveFailures >= 3) {
      return {
        type: 'no_progress',
        description: `${consecutiveFailures} consecutive steps failed/skipped`,
        severity: 'high',
        evidence: [
          `Task: ${task.title}`,
          `Consecutive failures: ${consecutiveFailures}`,
          `Total steps: ${task.steps.length}`,
        ],
      };
    }

    return null;
  }

  private canSeekHelp(): boolean {
    return this.helpRequestCount < this.MAX_HELP_REQUESTS_PER_TASK;
  }

  // ==================== HELP REQUEST BUILDERS ====================

  private buildContext(task: AgentTask): string {
    return `
Task: ${task.title}
Goal: ${task.userRequest}
Steps completed: ${task.steps.filter(s => s.status === 'completed').length}/${task.steps.length}
Current status: ${task.status}
    `.trim();
  }

  private describeProblem(step: AgentStep, pattern: StuckPattern): string {
    return `
**Problem Type:** ${pattern.type.replace('_', ' ').toUpperCase()}
**Severity:** ${pattern.severity.toUpperCase()}
**Description:** ${pattern.description}

**Current Step:**
- Title: ${step.title}
- Action: ${step.action.type}
- Retries: ${step.retryCount}/${step.maxRetries}
${step.error ? `- Last Error: ${step.error}` : ''}

**Evidence:**
${pattern.evidence.map(e => `- ${e}`).join('\n')}
    `.trim();
  }

  private getAttemptedSolutions(step: AgentStep, task: AgentTask): string[] {
    const solutions: string[] = [];

    // Get recent failed steps as attempted solutions
    const recentSteps = task.steps
      .filter(s => s.status === 'failed' || s.status === 'skipped')
      .slice(-3);

    recentSteps.forEach(s => {
      solutions.push(`Tried ${s.action.type} for "${s.title}" - ${s.error || 'skipped'}`);
    });

    // Add current step's retries
    if (step.retryCount > 0) {
      solutions.push(`Retried "${step.title}" ${step.retryCount} times`);
    }

    return solutions;
  }

  private buildHelpPrompt(request: HelpRequest): string {
    return `I'm an AI coding agent that's stuck and needs your help. I've been trying to complete a task but I'm not making progress.

**CONTEXT:**
${request.context}

**THE PROBLEM I'M FACING:**
${request.problem}

**WHAT I'VE ALREADY TRIED:**
${request.attemptedSolutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**WHAT I'M TRYING TO ACCOMPLISH:**
"${request.taskGoal}"

**I NEED YOUR HELP WITH:**
1. Why am I stuck? What's the root cause?
2. What completely different approach should I try?
3. Are there any alternative strategies I haven't considered?
4. Should I continue trying or gracefully give up on this task?

**RESPONSE FORMAT (JSON):**
{
  "diagnosis": "Root cause analysis - why is this failing?",
  "suggestedApproach": "Completely different approach to try (be specific)",
  "alternativeStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
  "shouldContinue": true/false,
  "reasoning": "Why this approach should work / why to stop"
}

Please help me figure out what to do next. Be honest - if this task is impossible or my approach is fundamentally flawed, tell me to stop.`;
  }

  private parseHelpResponse(content: string): HelpResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          diagnosis: parsed.diagnosis || 'Unknown diagnosis',
          suggestedApproach: parsed.suggestedApproach || 'No suggestion provided',
          alternativeStrategies: parsed.alternativeStrategies || [],
          shouldContinue: parsed.shouldContinue !== false,
          reasoning: parsed.reasoning || 'No reasoning provided',
        };
      }

      // Fallback: treat entire response as suggestion
      console.warn('[Metacognitive] Could not parse JSON, using fallback interpretation');
      return {
        diagnosis: 'Unable to parse structured response',
        suggestedApproach: content,
        alternativeStrategies: [],
        shouldContinue: true,
        reasoning: 'Fallback interpretation of unstructured response',
      };
    } catch (error) {
      console.error('[Metacognitive] Failed to parse help response:', error);
      throw new Error('Could not understand AI assistant response');
    }
  }
}
