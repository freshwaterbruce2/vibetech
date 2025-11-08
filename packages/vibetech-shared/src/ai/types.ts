/**
 * AI Service Types
 *
 * Common types for AI service integrations
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: string;
}

export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
}

export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Common AI Service interface
 * Platform-specific implementations should implement this
 */
export interface AIService {
  /**
   * Send a chat completion request
   */
  chat(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * Stream a chat completion
   */
  streamChat(
    request: AICompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;

  /**
   * Get embeddings for text (for semantic search)
   */
  getEmbeddings?(text: string): Promise<number[]>;
}
