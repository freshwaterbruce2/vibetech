/**
 * AI Provider Detector
 *
 * Determines the appropriate AI provider based on model name
 * Handles provider configuration and routing
 */

import { AIProvider } from './AIProviderInterface';
import { AIClientConfig } from './types';

/**
 * Model pattern configuration for provider detection
 */
const PROVIDER_PATTERNS: Record<AIProvider, RegExp[]> = {
  [AIProvider.OPENAI]: [/gpt/i, /o1/i, /text-davinci/i],
  [AIProvider.ANTHROPIC]: [/claude/i],
  [AIProvider.DEEPSEEK]: [/deepseek/i],
  [AIProvider.GOOGLE]: [/gemini/i, /palm/i],
};

export class AIProviderDetector {
  /**
   * Detect provider from model name
   */
  static detectProvider(model: string): AIProvider | null {
    const modelLower = model.toLowerCase();

    for (const [provider, patterns] of Object.entries(PROVIDER_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(modelLower)) {
          return provider as AIProvider;
        }
      }
    }

    return null;
  }

  /**
   * Determine if provider manager should be used
   * (true for non-DeepSeek models)
   */
  static shouldUseProviderManager(model: string): boolean {
    const modelLower = model.toLowerCase();
    return !modelLower.includes('deepseek');
  }

  /**
   * Get provider configuration for a model
   */
  static getProviderConfig(
    model: string,
    config: AIClientConfig
  ): {
    provider: AIProvider;
    apiKey: string;
    baseUrl: string;
    model: string;
  } | null {
    const provider = this.detectProvider(model);

    if (!provider) {
      return null;
    }

    return {
      provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    };
  }

  /**
   * Check if model is a DeepSeek reasoner model
   */
  static isDeepSeekReasoner(model: string): boolean {
    return model.toLowerCase().includes('reasoner');
  }

  /**
   * Get default base URL for a provider
   */
  static getDefaultBaseUrl(provider: AIProvider): string {
    const urls: Record<AIProvider, string> = {
      [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
      [AIProvider.OPENAI]: 'https://api.openai.com/v1',
      [AIProvider.ANTHROPIC]: 'https://api.anthropic.com/v1',
      [AIProvider.GOOGLE]: 'https://generativelanguage.googleapis.com/v1',
    };

    return urls[provider] || '';
  }

  /**
   * Get supported models for a provider
   */
  static getProviderModels(provider: AIProvider): string[] {
    const models: Record<AIProvider, string[]> = {
      [AIProvider.DEEPSEEK]: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
      [AIProvider.OPENAI]: ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
      [AIProvider.ANTHROPIC]: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3-5-sonnet'],
      [AIProvider.GOOGLE]: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
    };

    return models[provider] || [];
  }
}
