/**
 * AIChat Types
 * Type definitions for the AI Chat component
 */
import type { AgentStep, AgentTask, AIMessage, ApprovalRequest, StepStatus } from '../../types';

export type ChatMode = 'chat' | 'agent' | 'composer';

export interface WorkspaceContext {
    workspaceRoot: string;
    currentFile?: string;
    openFiles: string[];
    recentFiles: string[];
}

export interface AIChatProps {
    messages: AIMessage[];
    onSendMessage: (message: string) => void;
    onClose: () => void;
    showReasoningProcess?: boolean | undefined;
    currentModel?: string | undefined;
    mode?: ChatMode;
    onModeChange?: (mode: ChatMode) => void;
    // Agent mode integration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskPlanner?: any; // TaskPlanner instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executionEngine?: any; // ExecutionEngine instance
    workspaceContext?: WorkspaceContext;
    // Message management for Agent Mode
    onAddMessage?: (message: AIMessage) => void;
    onUpdateMessage?: (messageId: string, updater: (msg: AIMessage) => AIMessage) => void;
    // Callbacks for agent actions
    onFileChanged?: (filePath: string, action: 'created' | 'modified' | 'deleted') => void;
    onTaskComplete?: (task: AgentTask) => void;
    onTaskError?: (task: AgentTask, error: Error) => void;
    onApprovalRequired?: (step: AgentStep, request: ApprovalRequest) => Promise<boolean>;
}

export interface MemoizedStepCardProps {
    step: AgentStep;
    pendingApproval: ApprovalRequest | null;
    getStepIcon: (status: StepStatus) => React.ReactElement;
    handleApproval?: (stepId: string, approved: boolean) => void;
}

export interface MessageItemProps {
    message: AIMessage;
    showReasoningProcess: boolean;
    onCopy: (text: string) => void;
    renderAgentTask: (message: AIMessage) => React.ReactNode;
}

export interface ModeInfo {
    title: string;
    description: string;
}

export const MIN_WIDTH = 380;
export const MAX_WIDTH = 800;
export const DEFAULT_WIDTH = 380;
