/**
 * OpenAI Provider - Implementation for OpenAI API integration
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
  StreamCompletionResponse} from '../AIProviderInterface';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
  functions?: any[];
  function_call?: 'auto' | 'none' | { name: string };
}

export class OpenAIProvider implements IAIProvider {
  private config!: AIProviderConfig;
  private apiKey!: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private usageStats = {
    tokensUsed: 0,
    estimatedCost: 0,
    requestCount: 0
  };
  private abortController?: AbortController;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;

    // Get API key from secure storage or config
    const secureKeyManager = SecureApiKeyManager.getInstance(logger);
    this.apiKey = config.apiKey || await secureKeyManager.getApiKey('openai');

    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }

    // Validate configuration
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Please configure it in the settings.');
    }

    // Validate API key format
    if (!secureKeyManager.validateApiKey(this.apiKey, 'openai')) {
      throw new Error('Invalid OpenAI API key format');
    }

    // Store the key securely if it came from config
    const currentKey = await secureKeyManager.getApiKey('openai');
    if (config.apiKey && config.apiKey !== currentKey) {
      const stored = await secureKeyManager.storeApiKey('openai', config.apiKey);
      if (!stored) {
        logger.warn('Failed to store OpenAI API key securely');
      }
    }

    await this.validateConnection();
  }

  async complete(model: string, options: CompletionOptions): Promise<CompletionResponse> {
    const request: OpenAICompletionRequest = {
      model,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.functionCall && {
          function_call: msg.functionCall
        })
      })),
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: false,
      ...(options.functions && {
        functions: options.functions,
        function_call: options.functionCall
      })
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
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
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

      return {
        id: data.id,
        choices: data.choices.map((choice: any) => ({
          message: {
            role: choice.message.role,
            content: choice.message.content,
            ...(choice.message.function_call && {
              functionCall: choice.message.function_call
            })
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
    } catch (error) {
      logger.error('OpenAI completion error:', error);
      throw error;
    }
  }

  async *streamComplete(
    model: string,
    options: CompletionOptions
  ): AsyncGenerator<StreamCompletionResponse> {
    const request: OpenAICompletionRequest = {
      model,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.functionCall && {
          function_call: msg.functionCall
        })
      })),
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: true,
      ...(options.functions && {
        functions: options.functions,
        function_call: options.functionCall
      })
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
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {break;}

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
                    content: choice.delta?.content,
                    ...(choice.delta?.function_call && {
                      functionCall: choice.delta.function_call
                    })
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
        logger.error('OpenAI stream error:', error);
        throw error;
      }
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    // Return OpenAI models from registry
    return Object.values(MODEL_REGISTRY).filter(model => model.provider === AIProvider.OPENAI);
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
      logger.error('OpenAI connection validation failed:', error);
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
    if (!usage) {return 0;}

    const modelInfo = MODEL_REGISTRY[modelName || this.config.model];
    if (!modelInfo) {return 0;}

    const inputCost = (usage.prompt_tokens / 1000000) * modelInfo.costPerMillionInput;
    const outputCost = (usage.completion_tokens / 1000000) * modelInfo.costPerMillionOutput;
    
    return inputCost + outputCost;
  }
}