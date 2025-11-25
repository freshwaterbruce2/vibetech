import axios, { AxiosInstance } from 'axios';

import { retryWithBackoff } from '../../utils/errorHandler';

import { CompletionOptions } from './AIProviderInterface';
import { AIProviderManager } from './AIProviderManager';
import { AIClientConfig, AICompletionRequest, AICompletionResponse } from './types';
import { AIResponseMapper } from './AIResponseMapper';
import { AIErrorLogger } from './AIErrorLogger';
import { AIProviderDetector } from './AIProviderDetector';

/**
 * Low-level AI API client for making requests to AI services
 * Handles authentication, retries, and error handling
 * Now integrated with AIProviderManager for multi-model support
 */
export class AIClient {
  private client: AxiosInstance;
  private config: AIClientConfig;
  private providerManager: AIProviderManager;
  private useProviderManager: boolean = false;

  constructor(config: AIClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    // Initialize provider manager
    this.providerManager = new AIProviderManager();

    // Check if we should use the provider manager based on model
    this.updateProviderMode();
  }

  private updateProviderMode(): void {
    // Use provider manager for non-DeepSeek models
    this.useProviderManager = AIProviderDetector.shouldUseProviderManager(this.config.model);

    if (this.useProviderManager) {
      // Get provider configuration
      const providerConfig = AIProviderDetector.getProviderConfig(this.config.model, this.config);
      if (providerConfig) {
        this.providerManager.setProvider(providerConfig.provider, providerConfig);
      }
    }
  }

  updateConfig(newConfig: Partial<AIClientConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update client if base URL or API key changed
    if (newConfig.baseUrl || newConfig.apiKey) {
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
    
    // Update provider mode if model changed
    if (newConfig.model) {
      this.updateProviderMode();
    }
  }

  async completion(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      // Use provider manager for non-DeepSeek models
      if (this.useProviderManager) {
        const options: CompletionOptions = {
          messages: request.messages,
          temperature: request.temperature || this.config.temperature,
          maxTokens: request.maxTokens || this.config.maxTokens,
          stream: false,
        };

        const response = await this.providerManager.complete(this.config.model, options);
        return AIResponseMapper.mapProviderResponse(response);
      }

      // DeepSeek direct API call
      return await this.deepSeekCompletion(request);
    } catch (error) {
      // Log error if it should be logged
      if (AIErrorLogger.shouldLog(error as Error)) {
        await AIErrorLogger.logApiError(error as Error, {
          model: this.config.model,
          provider: this.useProviderManager ? 'provider-manager' : 'deepseek',
          operation: 'completion',
        });
      }
      throw error;
    }
  }

  /**
   * DeepSeek-specific completion implementation
   */
  private async deepSeekCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    // Filter out reasoning_content from messages for deepseek-reasoner
    const cleanMessages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: cleanMessages,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      stream: false,
    };

    // For deepseek-reasoner, don't send temperature/top_p
    if (!AIProviderDetector.isDeepSeekReasoner(this.config.model)) {
      payload['temperature'] = request.temperature ?? this.config.temperature;
    }

    const response = await retryWithBackoff(async () => {
      return await this.client.post('/chat/completions', payload);
    });

    // Validate response has content
    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      await AIErrorLogger.logEmptyResponse({
        model: this.config.model,
        provider: 'deepseek',
      });
      throw new Error('No content in API response');
    }

    return AIResponseMapper.mapDeepSeekResponse(response.data);
  }

  async *completionStream(request: AICompletionRequest): AsyncGenerator<string, void, unknown> {
    try {
      // Use provider manager for non-DeepSeek models
      if (this.useProviderManager) {
        yield* this.providerManagerStream(request);
        return;
      }

      // DeepSeek direct streaming
      yield* this.deepSeekStream(request);
    } catch (error) {
      // Log streaming error
      if (AIErrorLogger.shouldLog(error as Error)) {
        await AIErrorLogger.logStreamingError(error as Error, {
          model: this.config.model,
          provider: this.useProviderManager ? 'provider-manager' : 'deepseek',
          operation: 'stream',
        });
      }
      throw error;
    }
  }

  /**
   * Provider manager streaming
   */
  private async *providerManagerStream(
    request: AICompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    const options: CompletionOptions = {
      messages: request.messages,
      temperature: request.temperature || this.config.temperature,
      maxTokens: request.maxTokens || this.config.maxTokens,
      stream: true,
    };

    const stream = this.providerManager.streamComplete(this.config.model, options);

    for await (const chunk of stream) {
      const content = AIResponseMapper.extractStreamContent(chunk);

      if (content) {
        yield content;
      }

      if (chunk.error) {
        throw new Error(chunk.error);
      }
    }
  }

  /**
   * DeepSeek-specific streaming implementation
   */
  private async *deepSeekStream(
    request: AICompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    // Filter out reasoning_content from messages for deepseek-reasoner
    const cleanMessages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: cleanMessages,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    // For deepseek-reasoner, don't send temperature/top_p
    if (!AIProviderDetector.isDeepSeekReasoner(this.config.model)) {
      payload['temperature'] = request.temperature ?? this.config.temperature;
    }

    const response = await this.client.post('/chat/completions', payload, {
      responseType: 'stream',
    });

    let buffer = '';

    for await (const chunk of response.data) {
      buffer += chunk.toString();
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

            // Handle reasoning content for deepseek-reasoner
            const reasoning = AIResponseMapper.extractStreamReasoning(parsed);
            if (reasoning) {
              yield `[REASONING] ${reasoning}`;
            }

            // Handle regular content
            const content = AIResponseMapper.extractStreamContent(parsed);
            if (content) {
              yield content;
            }
          } catch (error) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    }
  }

  getConfig(): AIClientConfig {
    return { ...this.config };
  }
  
  getAvailableModels(): string[] {
    return this.providerManager.getAvailableModels();
  }
  
  getCurrentModel(): string {
    return this.config.model;
  }
  
  setModel(model: string): void {
    this.updateConfig({ model });
  }
}
