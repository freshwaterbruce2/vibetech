/**
 * AIProviderManager - Manages multiple AI providers and model selection
 * Browser-compatible version without Node.js dependencies
 */

import {
  IAIProvider,
  AIProvider,
  AIProviderConfig,
  CompletionOptions,
  CompletionResponse,
  StreamCompletionResponse,
  MODEL_REGISTRY
} from './AIProviderInterface';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { GoogleProvider } from './providers/GoogleProvider';

export class AIProviderManager {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private currentProvider: AIProvider | null = null;
  private configs: Map<AIProvider, AIProviderConfig> = new Map();

  constructor() {
    // Initialize with default configs from environment variables if available
    // Use a try-catch to handle environments where process.env is not available
    try {
      const deepseekKey = process.env?.VITE_DEEPSEEK_API_KEY || '';
      if (deepseekKey) {
        this.setProvider(AIProvider.DEEPSEEK, {
          provider: AIProvider.DEEPSEEK,
          apiKey: deepseekKey,
          baseUrl: process.env?.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
          model: 'deepseek-chat'
        });
      }
    } catch (error) {
      // Environment variables not available, skip initialization
      console.log('Environment variables not available, skipping auto-initialization');
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
    if (!this.currentProvider) return null;
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

    console.log('[AIProviderManager] Calling provider.complete() with model:', model);
    const result = await provider.complete(model, options);
    console.log('[AIProviderManager] Received result:', result);
    console.log('[AIProviderManager] Result choices:', result.choices);

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
}