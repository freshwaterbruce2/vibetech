/**
 * AgentModeV2 Entry Point
 * 
 * This file re-exports the modularized AgentModeV2 component from the AgentModeV2/ folder.
 * The original monolithic component has been refactored into:
 * 
 * - AgentModeV2/AgentModeV2.tsx - Main facade component (~270 lines)
 * - AgentModeV2/types.ts - TypeScript interfaces and types
 * - AgentModeV2/styled.ts - All styled-components (~480 lines)
 * - AgentModeV2/useAgentModeState.ts - State management hook (~240 lines)
 * - AgentModeV2/StepCardView.tsx - Step card sub-component (~350 lines)
 * - AgentModeV2/SidePanelView.tsx - Side panel sub-component (~160 lines)
 * - AgentModeV2/TaskControlsView.tsx - Task controls sub-component (unused, inlined in main)
 * - AgentModeV2/StatusIcons.tsx - Status icon utilities
 * - AgentModeV2/index.ts - Module exports
 * 
 * Total: ~1500 lines split into manageable modules
 * Original: 1443 lines in single file
 */

// Re-export the default component for backward compatibility
export { default } from './AgentModeV2/AgentModeV2';

// Named exports for direct imports
export { AgentModeV2 } from './AgentModeV2/AgentModeV2';

// Re-export types for consumers
export type { AgentModeV2Props, WorkspaceContext } from './AgentModeV2/types';
