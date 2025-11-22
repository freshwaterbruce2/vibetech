/**
 * AIProviderManager - Manages multiple AI providers and model selection
 * Browser-compatible version without Node.js dependencies
 */
import { AI_MODELS } from '../../constants';
import { env } from '../../config/env';
import { logger } from '../../services/Logger';

import { AnthropicProvider } from './providers/AnthropicProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import {
  AIProvider,
  AIProviderConfig,
  CompletionOptions,
  CompletionResponse,
  IAIProvider,
  MODEL_REGISTRY,
  StreamCompletionResponse} from './AIProviderInterface';

export class AIProviderManager {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private currentProvider: AIProvider | null = null;
  private configs: Map<AIProvider, AIProviderConfig> = new Map();

  constructor() {
    // Initialize with validated environment variables
    try {
      const deepseekKey = env.VITE_DEEPSEEK_API_KEY;
      if (deepseekKey) {
        this.setProvider(AIProvider.DEEPSEEK, {
          provider: AIProvider.DEEPSEEK,
          apiKey: deepseekKey,
          baseUrl: env.VITE_DEEPSEEK_BASE_URL,
          model: AI_MODELS.DEEPSEEK_CHAT // ✅ 2025: Type-safe constant
        });
      }
    } catch (error) {
      // Environment variables not available, skip initialization
      logger.debug('Environment variables not available, skipping auto-initialization');
    }
  }

  async setProvider(provider: AIProvider, config: AIProviderConfig): Promise<void> {
    this.configs.set(provider, config);
    
    // Create provider instance
    let providerInstance: IAIProvider;
    
    switch (provider) {
      case AIProvider.OPENAI:
        providerInstance = new OpenAIProvider();
        break;
      case AIProvider.ANTHROPIC:
        providerInstance = new AnthropicProvider();
        break;
      case AIProvider.DEEPSEEK:
        providerInstance = new DeepSeekProvider();
        break;
      case AIProvider.GOOGLE:
        providerInstance = new GoogleProvider();
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Initialize the provider if it has an initialize method
    if (providerInstance.initialize) {
      await providerInstance.initialize(config);
    }
    
    this.providers.set(provider, providerInstance);
    
    // Set as current if it's the first provider
    if (!this.currentProvider) {
      this.currentProvider = provider;
    }
  }

  setCurrentProvider(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not configured. Call setProvider first.`);
    }
    this.currentProvider = provider;
  }

  getCurrentProvider(): IAIProvider | null {
    if (!this.currentProvider) {return null;}
    return this.providers.get(this.currentProvider) || null;
  }

  getAvailableModels(): string[] {
    return Object.keys(MODEL_REGISTRY);
  }

  getModelInfo(modelId: string) {
    return MODEL_REGISTRY[modelId];
  }

  async complete(model: string, options: CompletionOptions): Promise<CompletionResponse> {
    const modelInfo = MODEL_REGISTRY[model];
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }

    const provider = this.providers.get(modelInfo.provider);
    if (!provider) {
      throw new Error(`Provider ${modelInfo.provider} not configured`);
    }

    logger.debug('[AIProviderManager] Calling provider.complete() with model:', model);
    const result = await provider.complete(model, options);
    logger.debug('[AIProviderManager] Received result:', result);
    logger.debug('[AIProviderManager] Result choices:', result.choices);

    return result;
  }

  async *streamComplete(model: string, options: CompletionOptions): AsyncGenerator<StreamCompletionResponse> {
    const modelInfo = MODEL_REGISTRY[model];
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    const provider = this.providers.get(modelInfo.provider);
    if (!provider) {
      throw new Error(`Provider ${modelInfo.provider} not configured`);
    }
    
    yield* provider.streamComplete(model, options);
  }

  isProviderConfigured(provider: AIProvider): boolean {
    return this.providers.has(provider);
  }

  getConfiguredProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Initialize the manager (for compatibility with services expecting this method)
   */
  async initialize(): Promise<void> {
    logger.debug('[AIProviderManager] Initialized');
    // Initialization already happens in constructor
    // This method is here for interface compatibility
  }

  /**
   * Configure a provider (alias for setProvider for compatibility)
   */
  async configureProvider(provider: AIProvider, config: AIProviderConfig): Promise<void> {
    await this.setProvider(provider, config);
  }

  /**
   * Set the model for the current provider
   */
  setModel(model: string): void {
    const modelInfo = MODEL_REGISTRY[model];
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }

    // Set the provider for this model as current
    if (this.providers.has(modelInfo.provider)) {
      this.currentProvider = modelInfo.provider;
    } else {
      throw new Error(`Provider ${modelInfo.provider} not configured for model ${model}`);
    }
  }
}