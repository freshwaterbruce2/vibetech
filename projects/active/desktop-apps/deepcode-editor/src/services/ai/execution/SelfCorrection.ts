/**
 * Self-Correction Module
 *
 * Handles alternative strategy generation and self-correction when steps fail.
 * Implements 2025 best practices for agentic AI error recovery.
 */
import { logger } from '../../../services/Logger';
import type { AgentStep, StepAction, ActionType, ActionContext, AlternativeStrategy } from './types';

/**
 * Generates an alternative strategy when a step fails
 * Analyzes errors and generates different approaches instead of blind retries
 */
export async function generateAlternativeStrategy(
    step: AgentStep,
    error: Error,
    attemptNumber: number,
    context: ActionContext
): Promise<StepAction | null> {
    try {
        logger.debug(`[SelfCorrection] 🤔 Analyzing failure for "${step.title}"`);
        logger.debug(`[SelfCorrection] Error: ${error.message}`);
        logger.debug(`[SelfCorrection] Original action: ${step.action.type}`);

        const { aiService, workspaceService, taskState } = context;

        const prompt = `I'm an AI coding agent that just failed a task step. Help me find an alternative approach.

**Failed Step:**
- Title: ${step.title}
- Description: ${step.description}
- Original Action: ${step.action.type}
- Original Params: ${JSON.stringify(step.action.params)}
- Error: ${error.message}
- Attempt: ${attemptNumber} of ${step.maxRetries}

**Context:**
- User Request: ${taskState.userRequest}
- Workspace: ${taskState.workspaceRoot}

**Your Task:**
Analyze why this failed and suggest a DIFFERENT strategy (not just retry same action).

**Common Patterns:**
- File not found → Search project, or create with default template, or skip gracefully
- API timeout → Use cached data, or try simpler request, or ask user
- Parse error → Try different format, or extract partial data, or use fallback
- Permission denied → Try alternative path, or create in temp folder, or skip

**Response Format (JSON only):**
{
  "analysis": "Why did this fail? What's the root cause?",
  "strategy": "What different approach should I try?",
  "action": "read_file | write_file | search_code | generate_code | custom",
  "params": { /* action-specific params */ },
  "confidence": 0.8,
  "fallback": "skip | fail | ask_user"
}

Generate ONE alternative strategy that's DIFFERENT from the original approach.`;

        const response = await aiService.sendContextualMessage({
            userQuery: prompt,
            workspaceContext: await workspaceService.getWorkspaceContext(),
            currentFile: undefined,
            relatedFiles: [],
            conversationHistory: [],
        });

        // Parse AI response (handle JSON in text)
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            logger.warn('[SelfCorrection] ⚠️ AI did not return valid JSON strategy');
            return null;
        }

        const strategy: AlternativeStrategy = JSON.parse(jsonMatch[0]);
        logger.debug(`[SelfCorrection] ✨ Alternative Strategy: ${strategy.strategy}`);
        logger.debug(`[SelfCorrection] Confidence: ${Math.round(strategy.confidence * 100)}%`);

        return {
            type: strategy.action as ActionType,
            params: strategy.params,
        };
    } catch (err) {
        logger.error('[SelfCorrection] ❌ Self-correction failed:', err);
        return null;
    }
}

/**
 * Analyzes an error to determine if it's recoverable
 */
export function isRecoverableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Non-recoverable errors
    const nonRecoverable = [
        'permission denied',
        'access denied',
        'not authorized',
        'invalid credentials',
        'api key',
        'authentication failed',
    ];

    for (const pattern of nonRecoverable) {
        if (message.includes(pattern)) {
            return false;
        }
    }

    // Recoverable errors (usually transient)
    const recoverable = [
        'timeout',
        'network',
        'connection',
        'rate limit',
        'temporary',
        'retry',
        'not found', // Can often create missing files
        'enoent',
    ];

    for (const pattern of recoverable) {
        if (message.includes(pattern)) {
            return true;
        }
    }

    // Default to recoverable for unknown errors
    return true;
}

/**
 * Suggests a recovery action based on error type
 */
export function suggestRecoveryAction(error: Error, step: AgentStep): string {
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('enoent')) {
        if (step.action.type === 'read_file') {
            return 'Try creating the file with default content, or search for similar files';
        }
        return 'Verify the path exists or create necessary directories';
    }

    if (message.includes('timeout')) {
        return 'Reduce request complexity or retry with exponential backoff';
    }

    if (message.includes('rate limit')) {
        return 'Wait before retrying or use cached/simpler approach';
    }

    if (message.includes('parse') || message.includes('syntax')) {
        return 'Try a different format or extract partial valid data';
    }

    return 'Analyze the error and try an alternative approach';
}

/**
 * Calculates backoff delay for retries
 */
export function calculateBackoffDelay(attemptNumber: number, baseDelay: number = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
}
