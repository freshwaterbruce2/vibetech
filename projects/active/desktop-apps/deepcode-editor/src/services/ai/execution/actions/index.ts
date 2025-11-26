/**
 * Action Executors Index
 *
 * Centralized action registry for the ExecutionEngine
 */
import type { ActionType, ActionContext, StepResult, ActionRegistry } from '../types';

// File Actions
import {
    executeReadFile,
    executeWriteFile,
    executeEditFile,
    executeDeleteFile,
    executeCreateDirectory,
} from './FileActions';

// Code Actions
import {
    executeSearchCodebase,
    executeAnalyzeCode,
    executeRefactorCode,
    executeGenerateCode,
} from './CodeActions';

// System Actions
import {
    executeRunCommand,
    executeRunTests,
    executeGitCommit,
    executeReviewProject,
    executeCustomAction,
} from './SystemActions';

/**
 * Creates the action registry with all available action executors
 */
export function createActionRegistry(): ActionRegistry {
    const registry: ActionRegistry = new Map();

    // File operations
    registry.set('read_file', executeReadFile);
    registry.set('write_file', executeWriteFile);
    registry.set('edit_file', executeEditFile);
    registry.set('delete_file', executeDeleteFile);
    registry.set('create_directory', executeCreateDirectory);

    // Code operations
    registry.set('search_codebase', executeSearchCodebase);
    registry.set('analyze_code', executeAnalyzeCode);
    registry.set('refactor_code', executeRefactorCode);
    registry.set('generate_code', executeGenerateCode);

    // System operations
    registry.set('run_command', executeRunCommand);
    registry.set('run_tests', executeRunTests);
    registry.set('git_commit', executeGitCommit);
    registry.set('review_project', executeReviewProject);
    registry.set('custom', executeCustomAction);

    return registry;
}

/**
 * Executes an action by type using the registry
 */
export async function executeAction(
    type: ActionType,
    params: Record<string, unknown>,
    context: ActionContext,
    registry: ActionRegistry
): Promise<StepResult> {
    const executor = registry.get(type);

    if (!executor) {
        throw new Error(`Unknown action type: ${type}`);
    }

    return executor(params, context);
}

// Re-export individual action executors for direct use
export {
    // File
    executeReadFile,
    executeWriteFile,
    executeEditFile,
    executeDeleteFile,
    executeCreateDirectory,
    // Code
    executeSearchCodebase,
    executeAnalyzeCode,
    executeRefactorCode,
    executeGenerateCode,
    // System
    executeRunCommand,
    executeRunTests,
    executeGitCommit,
    executeReviewProject,
    executeCustomAction,
};
