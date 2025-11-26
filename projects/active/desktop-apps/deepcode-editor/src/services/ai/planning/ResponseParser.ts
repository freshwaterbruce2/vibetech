/**
 * Response Parser Module
 *
 * Parses AI responses into structured task plans.
 * Handles various response formats and fallbacks.
 */
import { logger } from '../../../services/Logger';
import type {
    ActionType,
    AgentStep,
    AgentTask,
    StepAction,
    TaskPlanRequest,
} from './types';

/** Valid action types */
const VALID_ACTION_TYPES: ActionType[] = [
    'read_file',
    'write_file',
    'edit_file',
    'delete_file',
    'create_directory',
    'run_command',
    'search_codebase',
    'analyze_code',
    'refactor_code',
    'generate_code',
    'run_tests',
    'git_commit',
    'review_project',
    'custom',
];

/** Actions that should require approval */
const DESTRUCTIVE_ACTIONS: ActionType[] = ['delete_file', 'write_file', 'git_commit'];

/** Dangerous command patterns */
const DANGEROUS_COMMANDS = ['rm', 'del', 'format', 'shutdown', 'reboot'];

/**
 * Parses AI response into structured AgentTask
 */
export function parseTaskPlan(
    aiResponse: string,
    userRequest: string,
    options?: TaskPlanRequest['options']
): AgentTask {
    try {
        // Validate aiResponse exists
        if (!aiResponse || typeof aiResponse !== 'string') {
            logger.error('Invalid AI response:', aiResponse);
            throw new Error('AI response is empty or invalid');
        }

        logger.debug('[ResponseParser] Raw AI response (first 500 chars):', aiResponse.substring(0, 500));

        // Extract JSON from response
        const jsonStr = extractJsonFromResponse(aiResponse);

        if (!jsonStr) {
            logger.error('[ResponseParser] Could not extract valid JSON from response');
            throw new Error('Could not extract JSON from AI response');
        }

        logger.debug('[ResponseParser] Attempting to parse JSON (first 300 chars):', jsonStr.substring(0, 300));
        const parsed = JSON.parse(jsonStr);
        logger.debug('[ResponseParser] Successfully parsed JSON');

        // Create task
        return buildTaskFromParsed(parsed, userRequest, options);
    } catch (error) {
        logger.error('Failed to parse task plan:', error);

        // Fallback: create a simple single-step task
        return createFallbackTask(userRequest);
    }
}

/**
 * Extracts JSON from various AI response formats
 */
function extractJsonFromResponse(aiResponse: string): string | null {
    let jsonStr = aiResponse;

    // Try 1: Extract from markdown code blocks
    const codeBlockMatch = aiResponse.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        logger.debug('[ResponseParser] Found JSON in markdown code block');
        return codeBlockMatch[1].trim();
    }

    // Try 2: Find JSON object with taskId
    const jsonObjectMatch = aiResponse.match(/\{[\s\S]*"taskId"[\s\S]*\}/);
    if (jsonObjectMatch) {
        logger.debug('[ResponseParser] Found JSON object in text');
        return jsonObjectMatch[0].trim();
    }

    // Try 3: Look for any valid JSON structure by brace positions
    const startIndex = aiResponse.indexOf('{');
    const endIndex = aiResponse.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        logger.debug('[ResponseParser] Extracting JSON by brace positions');
        jsonStr = aiResponse.substring(startIndex, endIndex + 1).trim();

        if (jsonStr.startsWith('{')) {
            return jsonStr;
        }
    }

    return null;
}

/**
 * Builds AgentTask from parsed JSON
 */
function buildTaskFromParsed(
    parsed: any,
    userRequest: string,
    options?: TaskPlanRequest['options']
): AgentTask {
    // Create task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build steps
    const steps: AgentStep[] = parsed.steps.map((step: any, index: number) => ({
        id: `${taskId}_step_${index + 1}`,
        taskId,
        order: step.order || index + 1,
        title: step.title,
        description: step.description,
        action: validateAction(step.action),
        status: 'pending' as const,
        requiresApproval: step.requiresApproval ?? shouldRequireApproval(step.action, options),
        retryCount: 0,
        maxRetries: step.maxRetries || 3,
    }));

    // Create task
    return {
        id: taskId,
        title: parsed.title || generateTitle(userRequest),
        description: parsed.description || userRequest,
        userRequest,
        steps,
        status: 'awaiting_approval',
        createdAt: new Date(),
    };
}

/**
 * Creates a fallback task when parsing fails
 */
function createFallbackTask(userRequest: string): AgentTask {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
        id: taskId,
        title: 'Manual Task',
        description: userRequest,
        userRequest,
        steps: [
            {
                id: `${taskId}_step_1`,
                taskId,
                order: 1,
                title: 'Execute Request',
                description: userRequest,
                action: {
                    type: 'custom',
                    params: { userRequest },
                },
                status: 'pending',
                requiresApproval: true,
                retryCount: 0,
                maxRetries: 3,
            },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
    };
}

/**
 * Validates and sanitizes action parameters
 */
export function validateAction(action: any): StepAction {
    if (!VALID_ACTION_TYPES.includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
    }

    return {
        type: action.type as ActionType,
        params: action.params || {},
    };
}

/**
 * Determines if an action should require approval
 */
export function shouldRequireApproval(
    action: StepAction,
    options?: TaskPlanRequest['options']
): boolean {
    // Always require approval for destructive actions
    if (DESTRUCTIVE_ACTIONS.includes(action.type)) {
        return true;
    }

    // Require approval for commands that could be dangerous
    if (action.type === 'run_command') {
        const command = (action.params.command as string) || '';
        if (DANGEROUS_COMMANDS.some((cmd) => command.toLowerCase().includes(cmd))) {
            return true;
        }
    }

    // If option requires approval for all, return true
    if (options?.requireApprovalForAll) {
        return true;
    }

    return false;
}

/**
 * Generates a title from user request
 */
export function generateTitle(userRequest: string): string {
    const firstSentence = userRequest.split(/[.!?]/)[0];
    if (!firstSentence) { return userRequest.substring(0, 50); }
    return firstSentence.length > 50 ? `${firstSentence.substring(0, 47)}...` : firstSentence;
}

/**
 * Extracts reasoning from AI response
 */
export function extractReasoning(aiResponse: string): string {
    try {
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;

        if (!jsonStr) {
            return 'Task decomposed into executable steps';
        }

        const parsed = JSON.parse(jsonStr);
        return parsed.reasoning || 'No reasoning provided';
    } catch {
        // Extract reasoning from text if JSON parsing fails
        const reasoningMatch = aiResponse.match(/reasoning[":]+\s*([^,\n}]+)/i);
        return reasoningMatch?.[1]?.trim() || 'Task decomposed into executable steps';
    }
}

/**
 * Extracts warnings from AI response and validates task safety
 */
export function extractWarnings(aiResponse: string, task: AgentTask): string[] {
    const warnings: string[] = [];

    try {
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;

        if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            if (parsed.warnings && Array.isArray(parsed.warnings)) {
                warnings.push(...parsed.warnings);
            }
        }
    } catch {
        // Ignore parsing errors
    }

    // Add automatic warnings based on actions
    const hasDeleteActions = task.steps.some((step) => step.action.type === 'delete_file');
    if (hasDeleteActions) {
        warnings.push('This task includes file deletions - changes may not be reversible');
    }

    const hasGitCommit = task.steps.some((step) => step.action.type === 'git_commit');
    if (hasGitCommit) {
        warnings.push('This task will create git commits');
    }

    const hasCommands = task.steps.some((step) => step.action.type === 'run_command');
    if (hasCommands) {
        warnings.push('This task will execute terminal commands');
    }

    if (task.steps.length > 8) {
        warnings.push(`This is a complex task with ${task.steps.length} steps - it may take several minutes`);
    }

    return warnings;
}

/**
 * Validates a task before execution
 */
export function validateTask(task: AgentTask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.steps || task.steps.length === 0) {
        errors.push('Task has no steps');
    }

    task.steps.forEach((step, index) => {
        if (!step.action || !step.action.type) {
            errors.push(`Step ${index + 1} has no action type`);
        }

        if (!step.title) {
            errors.push(`Step ${index + 1} has no title`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
