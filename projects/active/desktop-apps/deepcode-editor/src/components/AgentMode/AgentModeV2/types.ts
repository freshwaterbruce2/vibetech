/**
 * AgentModeV2 Types
 * Type definitions for the Agent Mode V2 component
 */
import type { ExecutionEngine } from '../../../services/ai/ExecutionEngine';
import type { TaskPlanner } from '../../../services/ai/TaskPlanner';
import type { BackgroundAgentSystem } from '../../../services/BackgroundAgentSystem';
import type {
    AgentStep,
    AgentTask,
    ApprovalRequest,
    PlanningInsights,
} from '../../../types';

export interface AgentModeV2Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (task: AgentTask) => void;
    taskPlanner: TaskPlanner;
    executionEngine: ExecutionEngine;
    backgroundAgentSystem?: BackgroundAgentSystem;
    showSuccess?: (title: string, message?: string) => void;
    showError?: (title: string, message?: string) => void;
    workspaceContext?: WorkspaceContext;
}

export interface WorkspaceContext {
    workspaceRoot: string;
    currentFile?: string;
    openFiles: string[];
    recentFiles: string[];
}

export interface AgentModeState {
    userRequest: string;
    currentTask: AgentTask | null;
    pendingApproval: PendingApproval | null;
    completedSteps: number;
    skippedSteps: number;
    estimatedTime: string;
    warnings: string[];
    reasoning: string;
    planningInsights: PlanningInsights | null;
    runInBackground: boolean;
}

export interface PendingApproval {
    step: AgentStep;
    request: ApprovalRequest;
}

export interface StepCardProps {
    step: AgentStep;
    index: number;
    pendingApproval: PendingApproval | null;
    onApprove: () => void;
    onReject: () => void;
}

export interface SidePanelProps {
    workspaceContext?: WorkspaceContext;
    planningInsights: PlanningInsights | null;
    reasoning: string;
    warnings: string[];
    currentTask: AgentTask | null;
    estimatedTime: string;
}

export interface ApprovalPromptProps {
    pendingApproval: PendingApproval;
    onApprove: () => void;
    onReject: () => void;
}

export interface TaskControlsProps {
    currentTask: AgentTask | null;
    userRequest: string;
    runInBackground: boolean;
    isPaused: boolean;
    backgroundAgentSystem?: BackgroundAgentSystem;
    onPlanTask: () => void;
    onExecuteTask: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onNewTask: () => void;
    onClose: () => void;
    onRunInBackgroundChange: (checked: boolean) => void;
}
