/**
 * EnhancedAgentMode Types
 * Type definitions for the Enhanced Agent Mode component
 */
import type { PerformanceProfile } from '../../services/AgentPerformanceOptimizer';
import type { OrchestratorResponse } from '../../services/specialized-agents/AgentOrchestrator';

export interface EnhancedAgentModeProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: OrchestratorResponse) => void;
  orchestrator: import('../../services/specialized-agents/AgentOrchestrator').AgentOrchestrator;
  performanceOptimizer: import('../../services/AgentPerformanceOptimizer').AgentPerformanceOptimizer;
  workspaceContext?: WorkspaceContextInfo;
}

export interface WorkspaceContextInfo {
  workspaceFolder: string;
  currentFile?: string;
  openFiles?: string[];
}

export interface LogEntry {
  id: string;
  type: LogEntryType;
  timestamp: Date;
  content: string;
  agentName?: string;
  metrics?: LogMetrics;
}

export type LogEntryType = 'info' | 'agent' | 'coordination' | 'success' | 'error' | 'performance';

export interface LogMetrics {
  confidence?: number;
  processingTime?: number;
  suggestions?: number;
}

export type TaskStatus = 'idle' | 'analyzing' | 'coordinating' | 'executing' | 'completed' | 'error';

export interface AgentInfo {
  name: string;
  role: string;
}

export interface AgentProfileMap extends Map<string, PerformanceProfile> {}
