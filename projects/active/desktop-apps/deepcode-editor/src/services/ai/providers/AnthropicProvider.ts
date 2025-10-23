/**
 * Anthropic Provider - Implementation for Claude API integration
 */
import { logger } from '../../../services/Logger';

import {
  IAIProvider,
  AIProviderConfig,
  CompletionOptions,
  CompletionResponse,
  StreamCompletionResponse,
  AIModel,
  AIProvider,
  MODEL_REGISTRY
} from '../AIProviderInterface';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicCompletionRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  system?: string;
}

export class AnthropicProvider implements IAIProvider {
  private config!: AIProviderConfig;
  private apiKey!: string;
  private baseUrl: string = 'https://api.anthropic.com';
  private anthropicVersion: string = '2023-06-01';
  private usageStats = {
    tokensUsed: 0,
    estimatedCost: 0,
    requestCount: 0
  };
  private abortController?: AbortController;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.apiKey;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }

    // Validate configuration
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    await this.validateConnection();
  }

  async complete(model: string, options: CompletionOptions): Promise<CompletionResponse> {
    // Extract system message if present
    const systemMessage = options.messages.find(m => m.role === 'system');
    const conversationMessages = options.messages.filter(m => m.role !== 'system');

    // Convert messages to Anthropic format
    const anthropicMessages: AnthropicMessage[] = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const request: AnthropicCompletionRequest = {
      model: model,
      messages: anthropicMessages,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      top_p: options.topP,
      stop_sequences: options.stop,
      stream: false,
      ...(systemMessage && { system: systemMessage.content })
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Update usage stats
      if (data.usage) {
        this.usageStats.tokensUsed += data.usage.input_tokens + data.usage.output_tokens;
        this.usageStats.requestCount++;
        
        // Calculate cost based on model
        const modelInfo = MODEL_REGISTRY[model];
        if (modelInfo) {
          const inputCost = (data.usage.input_tokens / 1000000) * modelInfo.costPerMillionInput;
          const outputCost = (data.usage.output_tokens / 1000000) * modelInfo.costPerMillionOutput;
          this.usageStats.estimatedCost += inputCost + outputCost;
        }
      }

      return {
        id: data.id,
        choices: [{
          message: {
            role: 'assistant',
            content: data.content[0].text
          },
          finishReason: data.stop_reason || 'stop',
          index: 0
        }],
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          estimatedCost: this.calculateCost(data.usage)
        },
        model: data.model,
        created: Date.now() / 1000
      };
    } catch (error) {
      logger.error('Anthropic completion error:', error);
      throw error;
    }
  }

  async *streamComplete(
    model: string,
    options: CompletionOptions
  ): AsyncGenerator<StreamCompletionResponse> {
    // Extract system message if present
    const systemMessage = options.messages.find(m => m.role === 'system');
    const conversationMessages = options.messages.filter(m => m.role !== 'system');

    // Convert messages to Anthropic format
    const anthropicMessages: AnthropicMessage[] = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const request: AnthropicCompletionRequest = {
      model: model,
      messages: anthropicMessages,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      top_p: options.topP,
      stop_sequences: options.stop,
      stream: true,
      ...(systemMessage && { system: systemMessage.content })
    };

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let messageId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'message_start') {
                messageId = parsed.message.id;
              } else if (parsed.type === 'content_block_delta') {
                const streamResponse: StreamCompletionResponse = {
                  id: messageId,
                  choices: [{
                    delta: {
                      content: parsed.delta.text
                    },
                    index: 0
                  }],
                  model: model,
                  created: Date.now() / 1000
                };

                yield streamResponse;
              } else if (parsed.type === 'message_stop') {
                          return;
              }
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
        logger.error('Anthropic stream error:', error);
        throw error;
      }
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    // Return Anthropic models from registry
    return Object.values(MODEL_REGISTRY).filter(model => model.provider === AIProvider.ANTHROPIC);
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple endpoint to validate the key
      // We'll make a minimal request to check if the key is valid
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1
        })
      });

      // If we get a 401, the key is invalid
      // If we get a 200 or even a 400 (bad request), the key is valid
      return response.status !== 401;
    } catch (error) {
      logger.error('Anthropic connection validation failed:', error);
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
    if (!usage) return 0;

    const modelInfo = MODEL_REGISTRY[modelName || this.config.model];
    if (!modelInfo) return 0;

    const inputCost = (usage.input_tokens / 1000000) * modelInfo.costPerMillionInput;
    const outputCost = (usage.output_tokens / 1000000) * modelInfo.costPerMillionOutput;
    
    return inputCost + outputCost;
  }
}