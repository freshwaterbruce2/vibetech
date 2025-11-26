/**
 * Editor Module Exports
 * Barrel file for Editor component and related utilities
 */

// Types
export type {
  EditorProps,
  CompletionStats,
  PrefetchStats,
  PrefetchStatus,
  FindMatchState,
  CursorPosition,
} from './types';

// Styled components
export {
  EditorContainer,
  MonacoContainer,
  StatusOverlay,
  StatusText,
  AiIndicator,
  PrefetchIndicator,
  StatsOverlay,
} from './styled';

// Hooks
export { useEditorState } from './useEditorState';
export { useEditorKeyboard } from './useEditorKeyboard';

// Main component (re-exported from parent for backward compatibility)
// The actual Editor component remains in the parent directory
// to avoid breaking existing imports
