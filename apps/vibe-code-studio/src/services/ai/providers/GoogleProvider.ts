/**
 * Google Gemini Provider - Implementation for Google Gemini API integration
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

interface GoogleMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GoogleCompletionRequest {
  contents: GoogleMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    stopSequences?: string[];
  };
}

export class GoogleProvider implements IAIProvider {
  private config!: AIProviderConfig;
  private apiKey!: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
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
    this.apiKey = config.apiKey || await secureKeyManager.getApiKey('google') || '';

    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }

    // Validate configuration
    if (!this.apiKey) {
      throw new Error('Google API key is required. Please configure it in the settings.');
    }

    // Validate API key format
    if (!secureKeyManager.validateApiKey(this.apiKey, 'google')) {
      throw new Error('Invalid Google API key format');
    }

    // Store the key securely if it came from config
    if (config.apiKey && config.apiKey !== await secureKeyManager.getApiKey('google')) {
      const stored = await secureKeyManager.storeApiKey('google', config.apiKey);
      if (!stored) {
        logger.warn('Failed to store Google API key securely');
      }
    }

    await this.validateConnection();
  }

  async complete(model: string, options: CompletionOptions): Promise<CompletionResponse> {
    // Convert messages to Google format
    const googleMessages: GoogleMessage[] = options.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Extract system instruction if present
    const systemMessage = options.messages.find(m => m.role === 'system');

    const request: GoogleCompletionRequest = {
      contents: googleMessages,
      generationConfig: {
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? this.config.maxTokens ?? 8192,
        ...(options.topP !== undefined ? { topP: options.topP } : {}),
        ...(options.stop !== undefined ? { stopSequences: options.stop } : {}),
      }
    };

    try {
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          ...(systemMessage && { systemInstruction: { parts: [{ text: systemMessage.content }] } })
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Update usage stats
      if (data.usageMetadata) {
        const totalTokens = (data.usageMetadata.promptTokenCount || 0) + (data.usageMetadata.candidatesTokenCount || 0);
        this.usageStats.tokensUsed += totalTokens;
        this.usageStats.requestCount++;

        // Calculate cost based on model
        const modelInfo = MODEL_REGISTRY[model];
        if (modelInfo) {
          const inputCost = (data.usageMetadata.promptTokenCount / 1000000) * modelInfo.costPerMillionInput;
          const outputCost = (data.usageMetadata.candidatesTokenCount / 1000000) * modelInfo.costPerMillionOutput;
          this.usageStats.estimatedCost += inputCost + outputCost;
        }
      }

      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text || '';

      return {
        id: crypto.randomUUID(),
        choices: [{
          message: {
            role: 'assistant',
            content
          },
          finishReason: this.mapFinishReason(candidate?.finishReason),
          index: 0
        }],
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0),
          estimatedCost: this.calculateCost(data.usageMetadata, model)
        },
        model,
        created: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      logger.error('Google completion error:', error);
      throw error;
    }
  }

  async *streamComplete(
    model: string,
    options: CompletionOptions
  ): AsyncGenerator<StreamCompletionResponse> {
    // Convert messages to Google format
    const googleMessages: GoogleMessage[] = options.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Extract system instruction if present
    const systemMessage = options.messages.find(m => m.role === 'system');

    const request: GoogleCompletionRequest = {
      contents: googleMessages,
      generationConfig: {
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? this.config.maxTokens ?? 8192,
        ...(options.topP !== undefined ? { topP: options.topP } : {}),
        ...(options.stop !== undefined ? { stopSequences: options.stop } : {}),
      }
    };

    this.abortController = new AbortController();

    try {
      const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          ...(systemMessage && { systemInstruction: { parts: [{ text: systemMessage.content }] } })
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${response.status} - ${error}`);
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

            try {
              const parsed = JSON.parse(data);
              const candidate = parsed.candidates?.[0];
              const content = candidate?.content?.parts?.[0]?.text || '';

              if (content) {
                const streamResponse: StreamCompletionResponse = {
                  id: crypto.randomUUID(),
                  choices: [{
                    delta: {
                      role: 'assistant',
                      content
                    },
                    finishReason: this.mapFinishReason(candidate?.finishReason),
                    index: 0
                  }],
                  model,
                  created: Math.floor(Date.now() / 1000)
                };

                yield streamResponse;
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
        logger.error('Google stream error:', error);
        throw error;
      }
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    // Return Google models from registry
    return Object.values(MODEL_REGISTRY).filter(model => model.provider === AIProvider.GOOGLE);
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      logger.error('Google connection validation failed:', error);
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
      delete this.abortController;
    }
  }

  private calculateCost(usage: any, modelName?: string): number {
    if (!usage) {return 0;}

    const modelInfo = MODEL_REGISTRY[modelName || this.config.model];
    if (!modelInfo) {return 0;}

    const inputCost = (usage.promptTokenCount / 1000000) * modelInfo.costPerMillionInput;
    const outputCost = (usage.candidatesTokenCount / 1000000) * modelInfo.costPerMillionOutput;

    return inputCost + outputCost;
  }

  private mapFinishReason(googleReason?: string): 'stop' | 'length' | 'function_call' | 'content_filter' {
    switch (googleReason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
