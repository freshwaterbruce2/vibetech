/**
 * EnhancedAgentMode Module Exports
 * Barrel file for Enhanced Agent Mode component
 */

// Types
export type {
  EnhancedAgentModeProps,
  WorkspaceContextInfo,
  LogEntry,
  LogEntryType,
  LogMetrics,
  TaskStatus,
  AgentInfo,
} from './types';

// Styled components
export {
  Backdrop,
  Container,
  Header,
  Title,
  StatusSection,
  StatusIndicator,
  MainContent,
  TaskSection,
  TaskInput,
  TaskTextarea,
  ExecutionLog,
  LogEntryStyled,
  Sidebar,
  SidebarSection,
  SidebarHeader,
  SidebarContent,
  AgentCard,
  PerformanceMetric,
  Footer,
  ActionButton,
  ProgressIndicator,
} from './styled';

// Hooks
export { useAgentTask } from './useAgentTask';
