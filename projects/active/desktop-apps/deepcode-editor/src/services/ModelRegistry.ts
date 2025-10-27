/**
 * ModelRegistry - Central registry for AI model management
 * Manages model capabilities, pricing, and performance metrics
 */

export interface ModelPricing {
  inputCostPer1k: number;  // Cost per 1000 input tokens in USD
  outputCostPer1k: number; // Cost per 1000 output tokens in USD
}

export interface ModelPerformance {
  speed: number;   // 1-10 scale (10 = fastest)
  quality: number; // 1-10 scale (10 = highest quality)
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  pricing: ModelPricing;
  capabilities: string[];
  performance: ModelPerformance;
  maxTokens?: number;
  contextWindow?: number;
  description?: string; // Added Oct 20, 2025 for model details
}

export interface ModelConfig {
  models?: Partial<AIModel>[];
}

export interface CostComparison {
  cheapest: string;
  costs: Record<string, number>;
}

export class ModelRegistry {
  private models: Map<string, AIModel> = new Map();

  constructor(config?: ModelConfig) {
    this.initializeDefaultModels();

    if (config?.models) {
      config.models.forEach(model => {
        if (model.id) {
          this.registerModel(model as AIModel);
        }
      });
    }
  }

  /**
   * Initialize default models
   */
  private initializeDefaultModels(): void {
    const defaultModels: AIModel[] = [
      // OpenAI Models (Oct 2025)
      {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'openai',
        pricing: { inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'reasoning', 'multi-modal'],
        performance: { speed: 7, quality: 10 },
        maxTokens: 16000,
        contextWindow: 128000
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        provider: 'openai',
        pricing: { inputCostPer1k: 0.002, outputCostPer1k: 0.008 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'reasoning'],
        performance: { speed: 7, quality: 9 },
        maxTokens: 16000,
        contextWindow: 128000
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        pricing: { inputCostPer1k: 0.0025, outputCostPer1k: 0.01 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'multi-modal', 'vision'],
        performance: { speed: 8, quality: 9 },
        maxTokens: 16000,
        contextWindow: 128000
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        pricing: { inputCostPer1k: 0.0005, outputCostPer1k: 0.0015 },
        capabilities: ['text-generation', 'code-generation', 'code-review'],
        performance: { speed: 9, quality: 7 },
        maxTokens: 4096,
        contextWindow: 16384
      },

      // DeepSeek Models (Current API Models - Oct 20, 2025)
      // Both use V3.2-Exp backend (Sept 29, 2025 release)
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat (V3.2-Exp)',
        provider: 'deepseek',
        pricing: { inputCostPer1k: 0.000028, outputCostPer1k: 0.000042 },
        capabilities: ['text-generation', 'code-generation', 'code-completion', 'fast-inference'],
        performance: { speed: 10, quality: 9 },
        maxTokens: 8192,
        contextWindow: 128000,
        description: 'Fast general-purpose model for chat, completions, and simple coding tasks'
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner (V3.2-Exp)',
        provider: 'deepseek',
        pricing: { inputCostPer1k: 0.000028, outputCostPer1k: 0.000042 },
        capabilities: ['reasoning', 'code-generation', 'code-review', 'debugging', 'agentic-tasks', 'tool-calling', 'long-context'],
        performance: { speed: 7, quality: 10 },
        maxTokens: 8192,
        contextWindow: 128000,
        description: 'Reasoning model with chain-of-thought for complex tasks, agents, and multi-step operations'
      },

      // Anthropic Claude Models (Oct 2025 - UPDATED Oct 20)
      {
        id: 'claude-opus-4.1',
        name: 'Claude Opus 4.1',
        provider: 'anthropic',
        pricing: { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'reasoning', 'long-context', 'long-horizon-coding', 'advanced-reasoning'],
        performance: { speed: 6, quality: 10 },
        maxTokens: 16000,
        contextWindow: 200000,
        description: '74.5% SWE-bench, superior reasoning and agentic tasks (Aug 2025)'
      },
      {
        id: 'claude-sonnet-4.5',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        pricing: { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'reasoning', 'best-for-coding', 'autonomous-coding', 'swe-bench-leader'],
        performance: { speed: 8, quality: 10 },
        maxTokens: 16000,
        contextWindow: 200000,
        description: 'BEST CODING MODEL - 77.2% SWE-bench Verified, autonomous 30hr coding (Sep 29, 2025)'
      },
      {
        id: 'claude-haiku-4.5',
        name: 'Claude Haiku 4.5',
        provider: 'anthropic',
        pricing: { inputCostPer1k: 0.001, outputCostPer1k: 0.005 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'fast-inference', 'budget-friendly', 'sonnet-4-level-coding'],
        performance: { speed: 10, quality: 9 },
        maxTokens: 16000,
        contextWindow: 200000,
        description: 'NEW Oct 15, 2025! Matches Sonnet 4 coding at 2x speed, 3x cheaper - BEST VALUE'
      },

      // Google Gemini Models (Oct 2025)
      {
        id: 'gemini-3.0-pro',
        name: 'Gemini 3.0 Pro',
        provider: 'google',
        pricing: { inputCostPer1k: 0.00125, outputCostPer1k: 0.00375 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'multi-modal', 'vision', 'reasoning', 'deep-think', 'computer-use'],
        performance: { speed: 7, quality: 10 },
        maxTokens: 8192,
        contextWindow: 1000000,
        description: 'LAUNCHING OCT 22! Deep Think reasoning, 1M tokens, computer use (browser automation)'
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        pricing: { inputCostPer1k: 0.00125, outputCostPer1k: 0.00375 },
        capabilities: ['text-generation', 'code-generation', 'code-review', 'multi-modal', 'vision', 'reasoning'],
        performance: { speed: 8, quality: 9 },
        maxTokens: 8192,
        contextWindow: 1000000,
        description: 'March 2025 thinking model with enhanced reasoning'
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        pricing: { inputCostPer1k: 0.00015, outputCostPer1k: 0.00045 },
        capabilities: ['text-generation', 'code-generation', 'fast-inference', 'budget-friendly'],
        performance: { speed: 10, quality: 7 },
        maxTokens: 8192,
        contextWindow: 1000000
      },

      // Open Source Models (Free - Local Compute Only)
      {
        id: 'qwen3-coder',
        name: 'Qwen3-Coder 480B MoE',
        provider: 'qwen',
        pricing: { inputCostPer1k: 0, outputCostPer1k: 0 },
        capabilities: ['code-generation', 'code-review', 'debugging', 'multi-language', 'agentic-workflows'],
        performance: { speed: 7, quality: 10 },
        maxTokens: 32000,
        contextWindow: 1000000
      },
      {
        id: 'codellama-70b',
        name: 'CodeLlama 70B',
        provider: 'meta',
        pricing: { inputCostPer1k: 0, outputCostPer1k: 0 },
        capabilities: ['code-generation', 'code-completion', 'multi-language', 'infilling'],
        performance: { speed: 6, quality: 8 },
        maxTokens: 16000,
        contextWindow: 128000
      },
      {
        id: 'starcode2',
        name: 'StarCoder2 15B',
        provider: 'bigcode',
        pricing: { inputCostPer1k: 0, outputCostPer1k: 0 },
        capabilities: ['code-generation', 'code-completion', 'multi-language', 'infilling'],
        performance: { speed: 9, quality: 8 },
        maxTokens: 8000,
        contextWindow: 16000
      },
      {
        id: 'wizardcoder-34b',
        name: 'WizardCoder 34B',
        provider: 'wizardlm',
        pricing: { inputCostPer1k: 0, outputCostPer1k: 0 },
        capabilities: ['code-generation', 'step-by-step-reasoning', 'debugging', 'instruction-tuned'],
        performance: { speed: 7, quality: 8 },
        maxTokens: 8000,
        contextWindow: 32000
      }
    ];

    defaultModels.forEach(model => this.models.set(model.id, model));
  }

  /**
   * Get model by ID
   */
  getModel(id: string): AIModel | null {
    return this.models.get(id) || null;
  }

  /**
   * List all models
   */
  listModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  /**
   * List models by provider
   */
  listModelsByProvider(provider: string): AIModel[] {
    return this.listModels().filter(m => m.provider === provider);
  }

  /**
   * List models by capability
   */
  listModelsByCapability(capability: string): AIModel[] {
    return this.listModels().filter(m => m.capabilities.includes(capability));
  }

  /**
   * Calculate request cost
   */
  calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = this.getModel(modelId);
    if (!model) {return 0;}

    const inputCost = (inputTokens / 1000) * model.pricing.inputCostPer1k;
    const outputCost = (outputTokens / 1000) * model.pricing.outputCostPer1k;

    return inputCost + outputCost;
  }

  /**
   * Compare costs across models
   */
  compareCosts(modelIds: string[], inputTokens: number, outputTokens: number): CostComparison {
    const costs: Record<string, number> = {};
    let cheapest = '';
    let lowestCost = Infinity;

    for (const id of modelIds) {
      const cost = this.calculateCost(id, inputTokens, outputTokens);
      costs[id] = cost;

      if (cost < lowestCost) {
        lowestCost = cost;
        cheapest = id;
      }
    }

    return { cheapest, costs };
  }

  /**
   * Check if model supports capability
   */
  supportsCapability(modelId: string, capability: string): boolean {
    const model = this.getModel(modelId);
    return model ? model.capabilities.includes(capability) : false;
  }

  /**
   * Get recommended model for task
   */
  getRecommendedModel(taskType: string): AIModel {
    const models = this.listModelsByCapability(taskType);

    if (models.length === 0) {
      // Fallback to general-purpose model
      return this.getModel('gpt-3.5-turbo') || models[0];
    }

    // Rank by cost efficiency (quality / cost)
    const ranked = models.sort((a, b) => {
      const aEfficiency = a.performance.quality / (a.pricing.inputCostPer1k + a.pricing.outputCostPer1k);
      const bEfficiency = b.performance.quality / (b.pricing.inputCostPer1k + b.pricing.outputCostPer1k);
      return bEfficiency - aEfficiency;
    });

    return ranked[0];
  }

  /**
   * Rank models by speed
   */
  rankBySpeed(): AIModel[] {
    return this.listModels().sort((a, b) => b.performance.speed - a.performance.speed);
  }

  /**
   * Rank models by quality
   */
  rankByQuality(): AIModel[] {
    return this.listModels().sort((a, b) => b.performance.quality - a.performance.quality);
  }

  /**
   * Rank models by cost efficiency
   */
  rankByCostEfficiency(): AIModel[] {
    return this.listModels().sort((a, b) => {
      const aEfficiency = a.performance.quality / (a.pricing.inputCostPer1k + a.pricing.outputCostPer1k);
      const bEfficiency = b.performance.quality / (b.pricing.inputCostPer1k + b.pricing.outputCostPer1k);
      return bEfficiency - aEfficiency;
    });
  }

  /**
   * Register new model
   */
  registerModel(model: AIModel): void {
    this.models.set(model.id, model);
  }

  /**
   * Update existing model
   */
  updateModel(id: string, updates: Partial<AIModel>): void {
    const existing = this.models.get(id);
    if (existing) {
      this.models.set(id, { ...existing, ...updates });
    }
  }

  /**
   * Remove model
   */
  removeModel(id: string): void {
    this.models.delete(id);
  }

  /**
   * Select best model for budget
   */
  selectForBudget(maxCost: number, capability: string): AIModel | null {
    const models = this.listModelsByCapability(capability);

    // Filter by estimated cost (1000 input + 500 output tokens)
    const affordable = models.filter(m => {
      const cost = this.calculateCost(m.id, 1000, 500);
      return cost <= maxCost;
    });

    if (affordable.length === 0) {return null;}

    // Return highest quality within budget
    return affordable.sort((a, b) => b.performance.quality - a.performance.quality)[0];
  }

  /**
   * Select fastest model for capability
   */
  selectFastest(capability: string): AIModel | null {
    const models = this.listModelsByCapability(capability);
    if (models.length === 0) {return null;}

    return models.sort((a, b) => b.performance.speed - a.performance.speed)[0];
  }

  /**
   * Select highest quality model
   */
  selectHighestQuality(capability: string): AIModel | null {
    const models = this.listModelsByCapability(capability);
    if (models.length === 0) {return null;}

    return models.sort((a, b) => b.performance.quality - a.performance.quality)[0];
  }
}
