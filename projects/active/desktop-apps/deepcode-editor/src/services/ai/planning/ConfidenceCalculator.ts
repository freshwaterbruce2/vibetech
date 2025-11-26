/**
 * Confidence Calculator Module
 *
 * Calculates step confidence scores and generates fallback plans.
 * Part of Phase 6: Confidence-based planning implementation.
 */
import type { StrategyMemory } from '../StrategyMemory';
import type {
    AgentStep,
    StepConfidence,
    ConfidenceFactor,
    FallbackPlan,
} from './types';

/** Common file patterns that likely exist */
const COMMON_FILE_PATTERNS = [
    'package.json',
    'tsconfig.json',
    'vite.config',
    'README.md',
    '.gitignore',
    'index.',
    'main.',
    'App.',
];

/**
 * Calculates confidence score for a step based on memory and context
 *
 * Scoring Algorithm:
 * - Baseline: 50 points
 * - Memory match: +40 points (weighted by success rate)
 * - File exists: +20 points
 * - Complex action: -15 points
 */
export async function calculateStepConfidence(
    step: AgentStep,
    memory: StrategyMemory
): Promise<StepConfidence> {
    let score = 50; // Baseline
    const factors: ConfidenceFactor[] = [];

    // Factor 1: Strategy Memory (40 points potential)
    const patterns = await memory.queryPatterns({
        problemDescription: step.description,
        actionType: step.action.type,
        maxResults: 1,
    });

    const topPattern = patterns[0];
    if (topPattern && topPattern.relevanceScore > 70) {
        const boost = (topPattern.pattern.successRate / 100) * 40;
        score += boost;
        factors.push({
            name: 'Memory Match',
            impact: boost,
            description: `Found similar past success (${topPattern.pattern.successRate}% success rate)`,
        });
    }

    // Factor 2: File Existence (20 points)
    if (step.action.type === 'read_file' || step.action.type === 'write_file') {
        const { filePath } = step.action.params;
        if (filePath && typeof filePath === 'string') {
            const exists = estimateFileExistence(filePath);
            if (exists) {
                score += 20;
                factors.push({
                    name: 'File Likely Exists',
                    impact: 20,
                    description: 'File path follows common patterns',
                });
            } else {
                score -= 10;
                factors.push({
                    name: 'File May Not Exist',
                    impact: -10,
                    description: 'Unusual file path',
                });
            }
        }
    }

    // Factor 3: Action Complexity (variance)
    if (['generate_code', 'refactor_code'].includes(step.action.type)) {
        score -= 15; // Complex actions are riskier
        factors.push({
            name: 'Complex Action',
            impact: -15,
            description: 'Code generation has inherent uncertainty',
        });
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (score >= 70) { riskLevel = 'low'; }
    else if (score >= 40) { riskLevel = 'medium'; }
    else { riskLevel = 'high'; }

    return {
        score: Math.min(100, Math.max(0, score)),
        factors,
        memoryBacked: patterns.length > 0,
        riskLevel,
    };
}

/**
 * Generates fallback plans for risky steps
 *
 * Fallback Strategies by Action Type:
 * - read_file: Search workspace first, then create default template
 * - Config files: Create with default JSON ({})
 * - High risk: Request user assistance as last resort
 */
export async function generateFallbackPlans(
    step: AgentStep,
    confidence: StepConfidence
): Promise<FallbackPlan[]> {
    const fallbacks: FallbackPlan[] = [];

    // Only generate fallbacks for medium/high risk steps
    if (confidence.riskLevel === 'low') {
        return fallbacks;
    }

    // Fallback 1: Search before read
    if (step.action.type === 'read_file') {
        const filePath = step.action.params.filePath as string;
        if (filePath) {
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
            fallbacks.push({
                id: `fallback_${step.id}_1`,
                stepId: step.id,
                trigger: 'If file not found',
                alternativeAction: {
                    type: 'search_codebase',
                    params: {
                        searchQuery: `*${fileName}`,
                    },
                },
                confidence: 75,
                reasoning: 'Search workspace for file instead of direct read',
            });
        }
    }

    // Fallback 2: Create with default template
    const configFilePath = step.action.params.filePath as string | undefined;
    if (step.action.type === 'read_file' && step.description.toLowerCase().includes('config') && configFilePath) {
        fallbacks.push({
            id: `fallback_${step.id}_2`,
            stepId: step.id,
            trigger: 'If file not found after search',
            alternativeAction: {
                type: 'write_file',
                params: {
                    filePath: configFilePath,
                    content: '{}', // Default empty config
                },
            },
            confidence: 60,
            reasoning: 'Create default config if none exists',
        });
    }

    // Fallback 3: Ask user (last resort)
    if (confidence.riskLevel === 'high') {
        fallbacks.push({
            id: `fallback_${step.id}_ask`,
            stepId: step.id,
            trigger: 'If all attempts fail',
            alternativeAction: {
                type: 'custom',
                params: {
                    action: 'request_user_input',
                    prompt: `Unable to complete: ${step.description}. Please provide guidance.`,
                },
            },
            confidence: 90, // User input is highly reliable
            reasoning: 'Request user assistance as final fallback',
        });
    }

    return fallbacks;
}

/**
 * Estimates if a file exists based on common patterns
 */
function estimateFileExistence(filePath: string): boolean {
    return COMMON_FILE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

/**
 * Estimates overall success rate based on confidence and memory
 */
export function estimateSuccessRate(avgConfidence: number, memoryRatio: number): number {
    // Base success rate from confidence
    let successRate = avgConfidence;

    // Bonus from memory-backed steps
    successRate += memoryRatio * 15;

    // Cap at 95% (never 100% certain)
    return Math.min(95, successRate);
}

/**
 * Estimates execution time based on step count
 */
export function estimateTime(stepCount: number): string {
    if (stepCount <= 2) { return '< 1 minute'; }
    if (stepCount <= 5) { return '1-3 minutes'; }
    if (stepCount <= 10) { return '3-5 minutes'; }
    return '5+ minutes';
}
