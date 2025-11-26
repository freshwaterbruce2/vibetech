/**
 * AgentModeV2 Module Exports
 * Re-exports all components from the AgentModeV2 module
 */

// Main component
export { AgentModeV2 } from './AgentModeV2';

// Sub-components
export { SidePanelView } from './SidePanelView';
export { StepCardView } from './StepCardView';
export { TaskControlsView } from './TaskControlsView';

// Hooks
export { useAgentModeState } from './useAgentModeState';

// Utilities
export { getStatusIcon } from './StatusIcons';

// Types
export type {
    AgentModeState,
    AgentModeV2Props,
    ApprovalPromptProps,
    PendingApproval,
    SidePanelProps,
    StepCardProps,
    TaskControlsProps,
    WorkspaceContext,
} from './types';

// Styled components (for extension/customization)
export * from './styled';
