/**
 * TaskPlanner Service (Refactored)
 *
 * Responsible for breaking down user requests into executable steps using AI.
 * This is the core of Agent Mode's intelligence.
 *
 * This is a facade that delegates to modular components:
 * - ProjectAnalyzer: Project analysis before planning
 * - PromptBuilder: AI prompt construction
 * - ResponseParser: Parse AI responses into tasks
 * - ConfidenceCalculator: Step confidence and fallbacks
 */
import { logger } from '../../services/Logger';
import type {
    AgentStep,
    AgentTask,
    EnhancedAgentStep,
    PlanningInsights,
    TaskPlanRequest,
    TaskPlanResponse,
} from '../../types';
import { ProjectStructureDetector } from '../../utils/ProjectStructureDetector';
import type { FileSystemService } from '../FileSystemService';

import { StrategyMemory } from './StrategyMemory';
import { UnifiedAIService } from './UnifiedAIService';

// Import from modular planning system
import {
    analyzeProjectBeforePlanning,
    buildPlanningPrompt,
    parseTaskPlan,
    extractReasoning,
    extractWarnings,
    validateTask,
    calculateStepConfidence,
    generateFallbackPlans,
    estimateSuccessRate,
    estimateTime,
} from './planning';
import type { PlanningContext } from './planning/types';

export class TaskPlanner {
    private structureDetector: ProjectStructureDetector | null = null;
    private strategyMemory: StrategyMemory;

    constructor(
        private aiService: UnifiedAIService,
        private fileSystemService?: FileSystemService
    ) {
        if (fileSystemService) {
            this.structureDetector = new ProjectStructureDetector(fileSystemService);
        }
        this.strategyMemory = new StrategyMemory();
    }

    /**
     * Plans a task by breaking down the user request into executable steps
     */
    async planTask(request: TaskPlanRequest): Promise<TaskPlanResponse> {
        const { userRequest, context, currentFileObject, options } = request;

        // Phase 1: Analyze project BEFORE planning
        logger.debug('[TaskPlanner] 🔍 Phase 1: Analyzing project before planning...');
        const projectAnalysis = await analyzeProjectBeforePlanning(
            context.workspaceRoot,
            this.fileSystemService
        );

        // Detect project structure
        let projectStructure = null;
        if (this.structureDetector && context.workspaceRoot) {
            try {
                projectStructure = await this.structureDetector.detectStructure(context.workspaceRoot);
                logger.debug('[TaskPlanner] Detected project structure:', ProjectStructureDetector.formatSummary(projectStructure));
            } catch (error) {
                const isWebMode = !window.electron?.isElectron;
                if (isWebMode) {
                    logger.warn('[TaskPlanner] Project structure detection failed in web mode.');
                } else {
                    logger.error('[TaskPlanner] Failed to detect project structure:', error);
                }
            }
        }

        // Build planning context
        const planningContext: PlanningContext = {
            userRequest,
            workspaceRoot: context.workspaceRoot,
            openFiles: context.openFiles || [],
            currentFile: context.currentFile,
            recentFiles: context.recentFiles || [],
            projectStructure: projectStructure || undefined,
            projectAnalysis,
            maxSteps: options?.maxSteps || 10,
            allowDestructive: options?.allowDestructiveActions ?? true,
        };

        // Build planning prompt
        const planningPrompt = buildPlanningPrompt(planningContext);

        // Get AI response
        const aiContextRequest = {
            userQuery: planningPrompt,
            workspaceContext: {
                rootPath: context.workspaceRoot,
                totalFiles: 0,
                languages: ['TypeScript', 'JavaScript'],
                testFiles: 0,
                projectStructure: {},
                dependencies: {},
                exports: {},
                symbols: {},
                lastIndexed: new Date(),
                summary: 'DeepCode Editor workspace',
            },
            currentFile: currentFileObject || (context.currentFile ? {
                path: context.currentFile,
                language: 'typescript',
                content: '',
            } : undefined),
            fileContent: currentFileObject?.content,
            relatedFiles: [],
            conversationHistory: [],
        };

        logger.debug('[TaskPlanner] Calling aiService.sendContextualMessage()');
        const aiResponse = await this.aiService.sendContextualMessage(aiContextRequest);

        logger.debug('[TaskPlanner] Received aiResponse');

        // Parse AI response into structured task
        const task = parseTaskPlan(aiResponse.content, userRequest, options);

        // Extract reasoning and warnings
        const reasoning = extractReasoning(aiResponse.content);
        const warnings = extractWarnings(aiResponse.content, task);

        return {
            task,
            reasoning,
            estimatedTime: estimateTime(task.steps.length),
            warnings,
        };
    }

    /**
     * Plan task with confidence scores and fallbacks (Phase 6)
     */
    async planTaskWithConfidence(
        request: TaskPlanRequest,
        memory: StrategyMemory
    ): Promise<TaskPlanResponse & { insights: PlanningInsights }> {
        // Generate base plan
        const basePlan = await this.planTask(request);

        // Enhance each step with confidence
        let totalConfidence = 0;
        let highRiskCount = 0;
        let memoryBackedCount = 0;
        let fallbackCount = 0;

        for (const step of basePlan.task.steps) {
            // Calculate confidence
            const confidence = await calculateStepConfidence(step, memory);
            (step as EnhancedAgentStep).confidence = confidence;
            totalConfidence += confidence.score;

            if (confidence.riskLevel === 'high') { highRiskCount++; }
            if (confidence.memoryBacked) { memoryBackedCount++; }

            // Generate fallbacks for risky steps
            const fallbacks = await generateFallbackPlans(step, confidence);
            if (fallbacks.length > 0) {
                (step as EnhancedAgentStep).fallbackPlans = fallbacks;
                fallbackCount += fallbacks.length;
            }
        }

        const stepCount = basePlan.task.steps.length;
        const insights: PlanningInsights = {
            overallConfidence: totalConfidence / stepCount,
            highRiskSteps: highRiskCount,
            memoryBackedSteps: memoryBackedCount,
            fallbacksGenerated: fallbackCount,
            estimatedSuccessRate: estimateSuccessRate(
                totalConfidence / stepCount,
                memoryBackedCount / stepCount
            ),
        };

        return {
            ...basePlan,
            insights,
        };
    }

    /**
     * Plan task with enhanced confidence (convenience wrapper)
     */
    async planTaskEnhanced(request: TaskPlanRequest): Promise<TaskPlanResponse & { insights: PlanningInsights }> {
        logger.debug('[TaskPlanner] 🎯 Using Phase 6 enhanced planning with confidence scores...');
        return this.planTaskWithConfidence(request, this.strategyMemory);
    }

    /**
     * Validates task before execution
     */
    validateTask(task: AgentTask): { valid: boolean; errors: string[] } {
        return validateTask(task);
    }

    /**
     * Calculate confidence for a single step
     */
    async calculateStepConfidence(step: AgentStep, memory: StrategyMemory) {
        return calculateStepConfidence(step, memory);
    }

    /**
     * Generate fallback plans for a step
     */
    async generateFallbackPlans(step: AgentStep, confidence: any) {
        return generateFallbackPlans(step, confidence);
    }
}
