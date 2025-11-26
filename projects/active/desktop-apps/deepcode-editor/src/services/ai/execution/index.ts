/**
 * Execution Module Index
 *
 * Exports all execution-related modules for the ExecutionEngine
 */

// Types
export * from './types';

// Utilities
export * from './utils';

// Action executors
export * from './actions';

// Self-correction
export {
    generateAlternativeStrategy,
    isRecoverableError,
    suggestRecoveryAction,
    calculateBackoffDelay,
} from './SelfCorrection';

// Step executor
export {
    executeStepWithFallbacks,
    executeStepWithRetry,
} from './StepExecutor';

// Task lifecycle
export { TaskLifecycleManager } from './TaskLifecycle';
