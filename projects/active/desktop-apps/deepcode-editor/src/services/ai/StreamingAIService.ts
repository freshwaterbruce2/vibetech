/**
 * Modern Streaming AI Service - 2025 Patterns
 *
 * Features:
 * - Server-Sent Events (SSE) for streaming
 * - Multi-provider support architecture
 * - TypeScript-first with strong typing
 * - Security with output sanitization
 * - ReAct pattern for tool integration
 * - Chunk processing optimization
 */

import { EventSourceParserStream } from 'eventsource-parser/stream';
import DOMPurify from 'isomorphic-dompurify';

// Types for 2025 AI patterns
export interface AIProvider {
  name: 'deepseek' | 'openai' | 'anthropic' | 'google';
  apiKey: string;
  baseUrl: string;
  models: string[];
}

export interface StreamingOptions {
  onToken?: ((token: string) => void) | undefined;
  onComplete?: ((fullText: string) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
  onToolCall?: ((tool: ToolCall) => void) | undefined;
  signal?: AbortSignal | undefined;
  sanitize?: boolean | undefined;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ReActStep {
  thought: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  observation?: string;
}

// Base streaming client interface
export abstract class BaseStreamingClient {
  protected provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  abstract streamCompletion(messages: AIMessage[], options: StreamingOptions): Promise<void>;

  abstract supportsTools(): boolean;
  abstract supportsStreaming(): boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// DeepSeek streaming implementation
export class DeepSeekStreamingClient extends BaseStreamingClient {
  async streamCompletion(messages: AIMessage[], options: StreamingOptions): Promise<void> {
    const { onToken, onComplete, onError, sanitize = true } = options;

    try {
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.provider.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-coder',
          messages,
          stream: true,
          temperature: 0.7,
        }),
      };

      if (options.signal) {
        fetchOptions.signal = options.signal;
      }

      const response = await fetch(`${this.provider.baseUrl}/chat/completions`, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Use EventSource parser for proper SSE handling
      if (!response.body) {
        throw new Error('Response body is empty');
      }
      const parser = response
        .body.pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());

      let fullText = '';
      let lastSanitizedLength = 0;

      const reader = parser.getReader();
      try {
        let done = false;
        while (!done) {
          const result = await reader.read();
          const { done: isDone, value: event } = result;
          done = isDone;
          if (done || !event) {
            break;
          }
          if ('type' in event && event.type === 'event' && 'data' in event) {
            const data = JSON.parse(event.data);

            if (data.choices?.[0]?.delta?.content) {
              const token = data.choices[0].delta.content;
              fullText += token;

              // Sanitize incrementally for security
              if (sanitize) {
                const sanitized = DOMPurify.sanitize(fullText);
                if (sanitized.length < lastSanitizedLength) {
                  // Content was removed - potentially malicious
                  throw new Error('Potentially unsafe content detected');
                }
                lastSanitizedLength = sanitized.length;
              }

              onToken?.(token);
            }

            // Handle tool calls for ReAct pattern
            if (data.choices?.[0]?.delta?.tool_calls) {
              const toolCall = data.choices[0].delta.tool_calls[0];
              options.onToolCall?.(toolCall);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      onComplete?.(fullText);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  supportsTools(): boolean {
    return true;
  }

  supportsStreaming(): boolean {
    return true;
  }
}

// Multi-provider AI service
export class StreamingAIService {
  private providers: Map<string, BaseStreamingClient> = new Map();
  private currentProvider: string = 'deepseek';

  registerProvider(name: string, client: BaseStreamingClient) {
    this.providers.set(name, client);
  }

  setProvider(name: string) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not registered`);
    }
    this.currentProvider = name;
  }

  getClient(): BaseStreamingClient {
    const client = this.providers.get(this.currentProvider);
    if (!client) {
      throw new Error(`No client for provider ${this.currentProvider}`);
    }
    return client;
  }

  // High-level streaming method with React integration
  async streamChat(messages: AIMessage[], options: StreamingOptions): Promise<void> {
    const client = this.getClient();

    if (!client.supportsStreaming()) {
      throw new Error(`Provider ${this.currentProvider} doesn't support streaming`);
    }

    return client.streamCompletion(messages, options);
  }

  // ReAct pattern implementation
  async executeReActLoop(
    query: string,
    tools: Record<string, (args: Record<string, unknown>) => Promise<unknown>>,
    maxSteps: number = 5
  ): Promise<ReActStep[]> {
    const steps: ReActStep[] = [];
    let currentQuery = query;

    for (let i = 0; i < maxSteps; i++) {
      const thought = await this.generateThought(currentQuery, steps);
      const step: ReActStep = { thought };

      // Parse action from thought
      const actionMatch = thought.match(/Action: (\w+)\[(.*?)\]/);
      if (actionMatch && actionMatch[1]) {
        step.action = actionMatch[1];
        step.actionInput = JSON.parse(actionMatch[2] || '{}');

        // Execute tool
        if (step.action && tools[step.action]) {
          try {
            const toolFn = tools[step.action];
            if (typeof toolFn === 'function') {
              step.observation = String(await toolFn(step.actionInput));
            }
          } catch (error) {
            step.observation = `Error: ${error}`;
          }
        }
      }

      steps.push(step);

      // Check if we have a final answer
      if (thought.includes('Final Answer:')) {
        break;
      }

      // Update query with observations
      currentQuery = this.formatReActContext(query, steps);
    }

    return steps;
  }

  private async generateThought(query: string, previousSteps: ReActStep[]): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are a ReAct agent. For each query:
1. Thought: Analyze what you need to do
2. Action: Choose a tool in format Action: tool_name[{"arg": "value"}]
3. Observation: I'll provide the tool result
4. Repeat until you have Final Answer: your response`,
      },
      {
        role: 'user',
        content: this.formatReActContext(query, previousSteps),
      },
    ];

    let thought = '';
    await this.streamChat(messages as AIMessage[], {
      onToken: (token) => {
        thought += token;
      },
      sanitize: false, // Don't sanitize internal thoughts
    });

    return thought;
  }

  private formatReActContext(query: string, steps: ReActStep[]): string {
    let context = `Query: ${query}\n\n`;

    steps.forEach((step, i) => {
      context += `Step ${i + 1}:\n`;
      context += `Thought: ${step.thought}\n`;
      if (step.action) {
        context += `Action: ${step.action}[${JSON.stringify(step.actionInput)}]\n`;
      }
      if (step.observation) {
        context += `Observation: ${step.observation}\n`;
      }
      context += '\n';
    });

    return context;
  }
}

// Factory for creating providers
export class AIProviderFactory {
  static createProvider(config: {
    name: string;
    apiKey: string;
    baseUrl?: string;
  }): BaseStreamingClient {
    const provider: AIProvider = {
      name: config.name as 'deepseek' | 'openai' | 'anthropic' | 'google',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(config.name),
      models: this.getAvailableModels(config.name),
    };

    switch (config.name) {
      case 'deepseek':
        return new DeepSeekStreamingClient(provider);
      // Add more providers here
      default:
        throw new Error(`Unknown provider: ${config.name}`);
    }
  }

  private static getDefaultBaseUrl(provider: string): string {
    const urls: Record<string, string> = {
      deepseek: 'https://api.deepseek.com/v1',
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1',
    };
    return urls[provider] || '';
  }

  private static getAvailableModels(provider: string): string[] {
    const models: Record<string, string[]> = {
      deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
      openai: ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'gemini-pro-vision'],
    };
    return models[provider] || [];
  }
}

// Singleton instance
export const streamingAI = new StreamingAIService();

// Initialize with DeepSeek
const deepseekClient = AIProviderFactory.createProvider({
  name: 'deepseek',
  apiKey: import.meta.env['VITE_DEEPSEEK_API_KEY'] || '',
});

streamingAI.registerProvider('deepseek', deepseekClient);
