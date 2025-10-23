/**
 * Model Selector
 * Implements multi-model ensemble strategy for AI completions
 *
 * October 2025 - Week 2 Implementation
 * Based on Anthropic's recommended pattern: "Sonnet plans, Haiku executes"
 *
 * Strategies:
 * - 'fast': Haiku 4.5 only (<500ms, $1/MTok)
 * - 'balanced': Haiku first, upgrade to Sonnet if context is complex
 * - 'accurate': Sonnet 4.5 only (77.2% SWE-bench, $3/MTok)
 * - 'adaptive': Analyze context complexity and choose automatically
 */
import { logger } from '../../../services/Logger';

import type { CodeContext, ModelStrategy } from './types';

/**
 * Model configuration for multi-model ensemble
 */
export interface ModelConfig {
  name: string;
  displayName: string;
  maxTokens: number;
  temperature: number;
  costPerMToken: number;
  targetLatency: number;
  capabilities: {
    codeCompletion: 'good' | 'excellent' | 'outstanding';
    contextUnderstanding: 'good' | 'excellent';
    multiLine: boolean;
    streaming: boolean;
  };
}

// Model configurations (October 2025)
const HAIKU_4_5: ModelConfig = {
  name: 'claude-haiku-4.5-20251015',
  displayName: 'Claude Haiku 4.5',
  maxTokens: 4096,
  temperature: 0.3,
  costPerMToken: 1.0, // $1/MTok
  targetLatency: 500, // <500ms
  capabilities: {
    codeCompletion: 'excellent',
    contextUnderstanding: 'good',
    multiLine: true,
    streaming: true,
  },
};

const SONNET_4_5: ModelConfig = {
  name: 'claude-sonnet-4.5-20251022',
  displayName: 'Claude Sonnet 4.5',
  maxTokens: 8192,
  temperature: 0.2,
  costPerMToken: 3.0, // $3/MTok
  targetLatency: 1500, // ~1.5s
  capabilities: {
    codeCompletion: 'outstanding',
    contextUnderstanding: 'excellent',
    multiLine: true,
    streaming: true,
  },
};

// DeepSeek fallback (existing integration)
const DEEPSEEK_CHAT: ModelConfig = {
  name: 'deepseek-chat',
  displayName: 'DeepSeek Chat',
  maxTokens: 4096,
  temperature: 0.3,
  costPerMToken: 0.14, // $0.14/MTok
  targetLatency: 800,
  capabilities: {
    codeCompletion: 'good',
    contextUnderstanding: 'good',
    multiLine: true,
    streaming: true,
  },
};

interface ContextComplexity {
  score: number; // 0-100
  factors: {
    codeLength: number;
    nestingLevel: number;
    hasImports: boolean;
    hasTypes: boolean;
    hasAsync: boolean;
    isFrameworkCode: boolean;
  };
}

export class ModelSelector {
  private strategy: ModelStrategy = 'fast';
  private performanceHistory: Map<string, ModelPerformance[]> = new Map();

  constructor(strategy: ModelStrategy = 'fast') {
    this.strategy = strategy;
  }

  /**
   * Select the appropriate model based on strategy and context
   */
  selectModel(context: CodeContext): ModelConfig {
    switch (this.strategy) {
      case 'fast':
        return this.selectFastModel();

      case 'balanced':
        return this.selectBalancedModel(context);

      case 'accurate':
        return this.selectAccurateModel();

      case 'adaptive':
        return this.selectAdaptiveModel(context);

      default:
        return this.selectFastModel();
    }
  }

  /**
   * Fast strategy: Use fastest available model
   * Best for: Rapid prototyping, simple completions
   * Priority: DeepSeek (default) > Haiku 4.5 (if available)
   */
  private selectFastModel(): ModelConfig {
    // Check if Anthropic is available (would be set in constructor)
    // For now, always use DeepSeek as primary
    return DEEPSEEK_CHAT;
  }

  /**
   * Balanced strategy: Haiku first, upgrade to Sonnet if complex
   * Best for: General development, cost-conscious users
   */
  private selectBalancedModel(context: CodeContext): ModelConfig {
    const complexity = this.analyzeComplexity(context);

    // Use Sonnet for complex code (score >70)
    if (complexity.score > 70) {
      logger.debug('[ModelSelector] Balanced: Using Sonnet (complexity:', complexity.score, ')');
      return SONNET_4_5;
    }

    // Use Haiku for simple code
    logger.debug('[ModelSelector] Balanced: Using Haiku (complexity:', complexity.score, ')');
    return HAIKU_4_5;
  }

  /**
   * Accurate strategy: Always use Sonnet 4.5
   * Best for: Critical code, complex algorithms, production code
   */
  private selectAccurateModel(): ModelConfig {
    return SONNET_4_5;
  }

  /**
   * Adaptive strategy: AI-powered model selection
   * Best for: Experienced users, optimal cost/quality balance
   */
  private selectAdaptiveModel(context: CodeContext): ModelConfig {
    const complexity = this.analyzeComplexity(context);
    const performance = this.getModelPerformance(context.language);

    // Decision tree based on complexity + historical performance
    if (complexity.score > 80) {
      // Very complex code → Sonnet
      return SONNET_4_5;
    } else if (complexity.score > 50) {
      // Moderate complexity → Check historical performance
      if (performance.haiku.acceptanceRate > 0.7) {
        // Haiku performs well → Use Haiku
        return HAIKU_4_5;
      } else {
        // Haiku struggles → Use Sonnet
        return SONNET_4_5;
      }
    } else {
      // Simple code → Haiku
      return HAIKU_4_5;
    }
  }

  /**
   * Analyze code context complexity (0-100 score)
   */
  private analyzeComplexity(context: CodeContext): ContextComplexity {
    let score = 0;
    const factors = {
      codeLength: 0,
      nestingLevel: 0,
      hasImports: false,
      hasTypes: false,
      hasAsync: false,
      isFrameworkCode: false,
    };

    // Factor 1: Code length (0-20 points)
    const prefixLength = context.prefix.length;
    factors.codeLength = prefixLength;
    if (prefixLength > 500) score += 20;
    else if (prefixLength > 200) score += 15;
    else if (prefixLength > 100) score += 10;
    else score += 5;

    // Factor 2: Nesting level (0-25 points)
    const nestingLevel = this.calculateNestingLevel(context.prefix);
    factors.nestingLevel = nestingLevel;
    if (nestingLevel > 5) score += 25;
    else if (nestingLevel > 3) score += 15;
    else if (nestingLevel > 1) score += 10;
    else score += 5;

    // Factor 3: Has imports (0-10 points)
    factors.hasImports = /^import\s+/m.test(context.prefix);
    if (factors.hasImports) score += 10;

    // Factor 4: Has TypeScript types (0-15 points)
    factors.hasTypes = /<[A-Z]|interface\s|type\s|:\s*\w+/.test(context.prefix);
    if (factors.hasTypes) score += 15;

    // Factor 5: Has async/await (0-10 points)
    factors.hasAsync = /async|await|Promise/.test(context.prefix);
    if (factors.hasAsync) score += 10;

    // Factor 6: Framework-specific code (0-20 points)
    factors.isFrameworkCode = this.isFrameworkCode(context);
    if (factors.isFrameworkCode) score += 20;

    return { score, factors };
  }

  /**
   * Calculate nesting level (braces, parentheses, brackets)
   */
  private calculateNestingLevel(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const char of code) {
      if (char === '{' || char === '(' || char === '[') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}' || char === ')' || char === ']') {
        currentNesting--;
      }
    }

    return maxNesting;
  }

  /**
   * Check if code uses frameworks (React, Vue, Angular, etc.)
   */
  private isFrameworkCode(context: CodeContext): boolean {
    const frameworkPatterns = [
      /useState|useEffect|useCallback|useMemo/, // React Hooks
      /Component|@Component|@Injectable/, // Angular
      /defineComponent|computed|ref|reactive/, // Vue 3
      /express|app\.get|app\.post/, // Express
      /async\s+function|await\s+fetch/, // Async patterns
    ];

    return frameworkPatterns.some(pattern => pattern.test(context.prefix));
  }

  /**
   * Get historical performance for a language
   */
  private getModelPerformance(language: string): {
    haiku: ModelPerformance;
    sonnet: ModelPerformance;
  } {
    const haikuHistory = this.performanceHistory.get(`haiku-${language}`) || [];
    const sonnetHistory = this.performanceHistory.get(`sonnet-${language}`) || [];

    return {
      haiku: this.calculateAveragePerformance(haikuHistory),
      sonnet: this.calculateAveragePerformance(sonnetHistory),
    };
  }

  /**
   * Calculate average performance metrics
   */
  private calculateAveragePerformance(history: ModelPerformance[]): ModelPerformance {
    if (history.length === 0) {
      return {
        acceptanceRate: 0.5, // Default 50%
        averageLatency: 0,
        totalCompletions: 0,
      };
    }

    const total = history.reduce(
      (acc, perf) => ({
        acceptanceRate: acc.acceptanceRate + perf.acceptanceRate,
        averageLatency: acc.averageLatency + perf.averageLatency,
        totalCompletions: acc.totalCompletions + perf.totalCompletions,
      }),
      { acceptanceRate: 0, averageLatency: 0, totalCompletions: 0 }
    );

    return {
      acceptanceRate: total.acceptanceRate / history.length,
      averageLatency: total.averageLatency / history.length,
      totalCompletions: total.totalCompletions,
    };
  }

  /**
   * Track model performance (called after completion is accepted/rejected)
   */
  trackPerformance(
    model: ModelConfig,
    language: string,
    accepted: boolean,
    latency: number
  ): void {
    const key = `${model.name.includes('haiku') ? 'haiku' : 'sonnet'}-${language}`;
    const history = this.performanceHistory.get(key) || [];

    // Add new performance data point
    history.push({
      acceptanceRate: accepted ? 1 : 0,
      averageLatency: latency,
      totalCompletions: 1,
    });

    // Keep last 100 data points
    if (history.length > 100) {
      history.shift();
    }

    this.performanceHistory.set(key, history);
  }

  /**
   * Get current strategy
   */
  getStrategy(): ModelStrategy {
    return this.strategy;
  }

  /**
   * Set model strategy
   */
  setStrategy(strategy: ModelStrategy): void {
    this.strategy = strategy;
    logger.debug('[ModelSelector] Strategy changed to:', strategy);
  }

  /**
   * Get all available models
   */
  getAvailableModels(): ModelConfig[] {
    return [HAIKU_4_5, SONNET_4_5, DEEPSEEK_CHAT];
  }

  /**
   * Get model by name
   */
  getModelByName(name: string): ModelConfig | undefined {
    return this.getAvailableModels().find(m => m.name === name);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Map<string, ModelPerformance[]> {
    return new Map(this.performanceHistory);
  }

  /**
   * Clear performance history
   */
  clearPerformanceHistory(): void {
    this.performanceHistory.clear();
  }
}

/**
 * Model performance metrics
 */
interface ModelPerformance {
  acceptanceRate: number; // 0-1
  averageLatency: number; // milliseconds
  totalCompletions: number;
}
