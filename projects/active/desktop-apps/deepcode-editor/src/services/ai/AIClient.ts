import axios, { AxiosInstance } from 'axios';

import { retryWithBackoff } from '../../utils/errorHandler';

import { AIProvider, CompletionOptions } from './AIProviderInterface';
import { AIProviderManager } from './AIProviderManager';
import { AIClientConfig, AICompletionRequest, AICompletionResponse } from './types';

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
    const modelLower = this.config.model.toLowerCase();
    this.useProviderManager = !modelLower.includes('deepseek');
    
    if (this.useProviderManager) {
      // Determine provider from model name
      const provider = this.determineProvider(this.config.model);
      if (provider) {
        this.providerManager.setProvider(provider, {
          provider,
          apiKey: this.config.apiKey,
          baseUrl: this.config.baseUrl,
          model: this.config.model,
        });
      }
    }
  }
  
  private determineProvider(model: string): AIProvider | null {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('gpt') || modelLower.includes('o1')) {
      return AIProvider.OPENAI;
    } else if (modelLower.includes('claude')) {
      return AIProvider.ANTHROPIC;
    } else if (modelLower.includes('deepseek')) {
      return AIProvider.DEEPSEEK;
    }
    return null;
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
    // Use provider manager for supported models
    if (this.useProviderManager) {
      const options: CompletionOptions = {
        messages: request.messages,
        temperature: request.temperature || this.config.temperature,
        maxTokens: request.maxTokens || this.config.maxTokens,
        stream: false,
      };
      
      try {
        const response = await this.providerManager.complete(this.config.model, options);
        return {
          content: response.content || response.choices[0]?.message?.content || '',
          usage: response.usage,
          finishReason: response.finishReason || response.choices[0]?.finishReason,
        };
      } catch (error) {
        throw error;
      }
    }
    
    // Fall back to original implementation for DeepSeek
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
    if (this.config.model !== 'deepseek-reasoner') {
      payload['temperature'] = request.temperature ?? this.config.temperature;
    }

    const response = await retryWithBackoff(async () => {
      return await this.client.post('/chat/completions', payload);
    });

    const content = response.data.choices[0]?.message?.content;
    const reasoning_content = response.data.choices[0]?.message?.reasoning_content;
    const { usage } = response.data;

    if (!content) {
      throw new Error('No content in API response');
    }

    return {
      content,
      reasoning_content,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
          }
        : undefined,
      finishReason: response.data.choices[0]?.finish_reason,
    };
  }

  async *completionStream(request: AICompletionRequest): AsyncGenerator<string, void, unknown> {
    // Use provider manager for supported models
    if (this.useProviderManager) {
      const options: CompletionOptions = {
        messages: request.messages,
        temperature: request.temperature || this.config.temperature,
        maxTokens: request.maxTokens || this.config.maxTokens,
        stream: true,
      };
      
      const stream = this.providerManager.streamComplete(this.config.model, options);
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content;
        } else if (chunk.choices?.[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
        if (chunk.error) {
          throw new Error(chunk.error);
        }
      }
      return;
    }
    
    // Fall back to original implementation for DeepSeek
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
    if (this.config.model !== 'deepseek-reasoner') {
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
            const content = parsed.choices[0]?.delta?.content;
            const reasoning_content = parsed.choices[0]?.delta?.reasoning_content;

            // For deepseek-reasoner, we might get reasoning content
            if (reasoning_content) {
              yield `[REASONING] ${reasoning_content}`;
            }

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
