/**
 * TaskPlanner Module Types
 *
 * Shared types for the modular TaskPlanner architecture
 */
import type {
    ActionType,
    AgentStep,
    AgentTask,
    StepAction,
    WorkspaceContext,
    StepConfidence,
    ConfidenceFactor,
    FallbackPlan,
    PlanningInsights,
    TaskPlanRequest,
    TaskPlanResponse,
} from '../../../types';

/**
 * Project analysis result
 */
export interface ProjectAnalysis {
    packageInfo?: {
        name: string;
        version: string;
        scripts?: string[];
        frameworks?: string[];
    };
    readme?: string;
    sourceFiles?: string[];
    entryPoints?: string[];
    testPatterns?: string[];
    raw: string;
}

/**
 * Project structure detection result
 */
export interface ProjectStructure {
    type: string;
    detectedFramework?: string;
    entryPoints: string[];
    configFiles: string[];
}

/**
 * Planning context with all necessary data
 */
export interface PlanningContext {
    userRequest: string;
    workspaceRoot: string;
    openFiles: string[];
    currentFile: string | undefined;
    recentFiles: string[];
    projectStructure: ProjectStructure | undefined;
    projectAnalysis: string | undefined;
    maxSteps: number;
    allowDestructive: boolean;
}

/**
 * Parsed task plan from AI response
 */
export interface ParsedPlan {
    title: string;
    description: string;
    reasoning: string;
    steps: ParsedStep[];
    warnings?: string[];
}

/**
 * Parsed step from AI response
 */
export interface ParsedStep {
    order?: number;
    title: string;
    description: string;
    action: {
        type: string;
        params: Record<string, unknown>;
    };
    requiresApproval?: boolean;
    maxRetries?: number;
}

/**
 * Confidence calculation context
 */
export interface ConfidenceContext {
    step: AgentStep;
    memoryPatterns: Array<{
        pattern: { successRate: number };
        relevanceScore: number;
    }>;
}

// Re-export commonly used types
export type {
    ActionType,
    AgentStep,
    AgentTask,
    StepAction,
    WorkspaceContext,
    StepConfidence,
    ConfidenceFactor,
    FallbackPlan,
    PlanningInsights,
    TaskPlanRequest,
    TaskPlanResponse,
};
