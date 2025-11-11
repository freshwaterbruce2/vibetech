/**
 * DeepSeek Provider - Implementation for DeepSeek API integration
 */
import { SecureApiKeyManager } from '../../../utils/SecureApiKeyManager';

import { logger } from '../../../services/Logger';
import {
  AIModel,
  AIProvider,
  AIProviderConfig,
  CompletionOptions,
  CompletionResponse,
  IAIProvider,
  MODEL_REGISTRY,
  StreamCompletionResponse
} from '../AIProviderInterface';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekCompletionRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
}

export class DeepSeekProvider implements IAIProvider {
  private config!: AIProviderConfig;
  private apiKey!: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';
  private usageStats = {
    tokensUsed: 0,
    estimatedCost: 0,
    requestCount: 0
  };
  private abortController: AbortController | undefined = undefined;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;

    // Get API key from secure storage or config
    try {
      const secureKeyManager = SecureApiKeyManager.getInstance(logger);
      this.apiKey = config.apiKey || await secureKeyManager.getApiKey('deepseek') || '';

      if (config.baseUrl) {
        this.baseUrl = config.baseUrl;
      }

      // Validate configuration
      if (!this.apiKey) {
        logger.warn('DeepSeek API key is not configured. Please configure it in the settings.');
        // Don't throw error, allow app to start without API key
        return;
      }

      // Validate API key format (don't throw, just warn)
      try {
        if (!secureKeyManager.validateApiKey(this.apiKey, 'deepseek')) {
          logger.warn('Invalid DeepSeek API key format. Please check your settings.');
          // Clear invalid key and allow app to start
          this.apiKey = '';
          return;
        }
      } catch (error) {
        logger.warn('API key validation failed:', error);
        this.apiKey = '';
        return;
      }

      // Store the key securely if it came from config
      try {
        const currentKey = await secureKeyManager.getApiKey('deepseek');
        if (config.apiKey && config.apiKey !== currentKey) {
          const stored = await secureKeyManager.storeApiKey('deepseek', config.apiKey);
          if (!stored) {
            logger.warn('Failed to store DeepSeek API key securely');
          }
        }
      } catch (error) {
        logger.warn('Failed to store API key:', error);
      }

      // Validate connection (don't throw on failure)
      try {
        await this.validateConnection();
      } catch (error) {
        logger.warn('API connection validation failed:', error);
        // Don't fail initialization, just log warning
      }
    } catch (error) {
      logger.error('DeepSeek provider initialization error:', error);
      // Set empty key and continue (graceful degradation)
      this.apiKey = '';
    }
  }

  async complete(model: string, options: CompletionOptions): Promise<CompletionResponse> {
    const request: DeepSeekCompletionRequest = {
      model,
      messages: options.messages.filter(msg => msg.role !== 'function').map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: false
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // DEBUG: Log raw API response
      logger.debug('[DeepSeekProvider] Raw API response:', data);
      logger.debug('[DeepSeekProvider] First choice content:', data.choices?.[0]?.message?.content);

      // Update usage stats
      if (data.usage) {
        this.usageStats.tokensUsed += data.usage.total_tokens;
        this.usageStats.requestCount++;

        // Calculate cost based on model
        const modelInfo = MODEL_REGISTRY[model];
        if (modelInfo) {
          const inputCost = (data.usage.prompt_tokens / 1000000) * modelInfo.costPerMillionInput;
          const outputCost = (data.usage.completion_tokens / 1000000) * modelInfo.costPerMillionOutput;
          this.usageStats.estimatedCost += inputCost + outputCost;
        }
      }

      const result = {
        id: data.id,
        choices: data.choices.map((choice: any) => ({
          message: {
            role: choice.message.role,
            content: choice.message.content
          },
          finishReason: choice.finish_reason,
          index: choice.index
        })),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          estimatedCost: this.calculateCost(data.usage)
        },
        model: data.model,
        created: data.created
      };

      // DEBUG: Log formatted response
      logger.debug('[DeepSeekProvider] Formatted CompletionResponse:', result);
      logger.debug('[DeepSeekProvider] First choice message:', result.choices[0]?.message);

      return result;
    } catch (error) {
      logger.error('DeepSeek completion error:', error);
      throw error;
    }
  }

  async *streamComplete(
    model: string,
    options: CompletionOptions
  ): AsyncGenerator<StreamCompletionResponse> {
    const request: DeepSeekCompletionRequest = {
      model,
      messages: options.messages.filter(msg => msg.role !== 'function').map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: true
    };

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const streamResponse: StreamCompletionResponse = {
                id: parsed.id,
                choices: parsed.choices.map((choice: any) => ({
                  delta: {
                    role: choice.delta?.role,
                    content: choice.delta?.content
                  },
                  finishReason: choice.finish_reason,
                  index: choice.index
                })),
                model: parsed.model,
                created: parsed.created
              };

              yield streamResponse;
            } catch (e) {
              logger.error('Error parsing stream chunk:', e);
            }
          }
        }
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.debug('Stream cancelled');
      } else {
        logger.error('DeepSeek stream error:', error);
        throw error;
      }
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    // Return DeepSeek models from registry
    return Object.values(MODEL_REGISTRY).filter(model => model.provider === AIProvider.DEEPSEEK);
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      logger.error('DeepSeek connection validation failed:', error);
      return false;
    }
  }

  async getUsageStats(): Promise<{
    tokensUsed: number;
    estimatedCost: number;
    requestCount: number;
  }> {
    return { ...this.usageStats };
  }

  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  private calculateCost(usage: any, modelName?: string): number {
    if (!usage) { return 0; }

    const modelInfo = MODEL_REGISTRY[modelName || this.config.model];
    if (!modelInfo) { return 0; }

    const inputCost = (usage.prompt_tokens / 1000000) * modelInfo.costPerMillionInput;
    const outputCost = (usage.completion_tokens / 1000000) * modelInfo.costPerMillionOutput;

    return inputCost + outputCost;
  }
}
