/**
 * AI Provider Interface - Abstraction for multiple AI model providers
 * Supports OpenAI, Anthropic, Google, DeepSeek, and others
 */

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  DEEPSEEK = 'deepseek',
  GROQ = 'groq',
  PERPLEXITY = 'perplexity',
  TOGETHER = 'together',
  OLLAMA = 'ollama',
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutput: number;
  costPerMillionInput: number;
  costPerMillionOutput: number;
  capabilities: ModelCapability[];
  recommended?: boolean;
}

export enum ModelCapability {
  CHAT = 'chat',
  CODE_COMPLETION = 'code_completion',
  CODE_GENERATION = 'code_generation',
  FUNCTION_CALLING = 'function_calling',
  VISION = 'vision',
  WEB_SEARCH = 'web_search',
  EXTENDED_THINKING = 'extended_thinking',
  MULTI_FILE_EDIT = 'multi_file_edit',
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface CompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  functions?: FunctionDefinition[];
  functionCall?: 'auto' | 'none' | { name: string };
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface CompletionResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
    index: number;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  };
  model: string;
  created: number;
  // Additional properties for AIClient compatibility
  content?: string;
  finishReason?: string;
}

export interface StreamCompletionResponse {
  id: string;
  choices: {
    delta: Partial<ChatMessage>;
    finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter';
    index: number;
  }[];
  model: string;
  created: number;
  // Additional properties for AIClient compatibility
  content?: string;
  error?: string;
}

export interface IAIProvider {
  /**
   * Initialize the provider with configuration
   */
  initialize?(config: AIProviderConfig): Promise<void>;

  /**
   * Send a chat completion request
   */
  complete(model: string, options: CompletionOptions): Promise<CompletionResponse>;

  /**
   * Stream a chat completion response
   */
  streamComplete(
    model: string,
    options: CompletionOptions
  ): AsyncGenerator<StreamCompletionResponse>;

  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<AIModel[]>;

  /**
   * Validate API key and connection
   */
  validateConnection(): Promise<boolean>;

  /**
   * Get current usage and costs
   */
  getUsageStats(): Promise<{
    tokensUsed: number;
    estimatedCost: number;
    requestCount: number;
  }>;

  /**
   * Cancel ongoing stream
   */
  cancelStream?(): void;
}

// Model Registry with October 2025 latest models
const MODELS_ARRAY: AIModel[] = [
  // OpenAI GPT-5 Models (October 2025)
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: AIProvider.OPENAI,
    contextWindow: 272000,
    maxOutput: 128000,
    costPerMillionInput: 1.25,
    costPerMillionOutput: 10,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.VISION,
      ModelCapability.EXTENDED_THINKING,
    ],
    recommended: true,
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: AIProvider.OPENAI,
    contextWindow: 272000,
    maxOutput: 128000,
    costPerMillionInput: 0.25,
    costPerMillionOutput: 2,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.VISION,
      ModelCapability.EXTENDED_THINKING,
    ],
    recommended: true,
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: AIProvider.OPENAI,
    contextWindow: 272000,
    maxOutput: 128000,
    costPerMillionInput: 0.05,
    costPerMillionOutput: 0.40,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
    ],
    recommended: true,
  },

  // Anthropic Claude 4 Models (October 2025)
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: AIProvider.ANTHROPIC,
    contextWindow: 200000,
    maxOutput: 16384,
    costPerMillionInput: 3,
    costPerMillionOutput: 15,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.EXTENDED_THINKING,
    ],
    recommended: true,
  },
  {
    id: 'claude-opus-4-1',
    name: 'Claude Opus 4.1',
    provider: AIProvider.ANTHROPIC,
    contextWindow: 200000,
    maxOutput: 16384,
    costPerMillionInput: 20,
    costPerMillionOutput: 80,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.EXTENDED_THINKING,
    ],
  },

  // Google Gemini Models (October 2025)
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: AIProvider.GOOGLE,
    contextWindow: 2000000,
    maxOutput: 8192,
    costPerMillionInput: 1.25,
    costPerMillionOutput: 10,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.EXTENDED_THINKING,
    ],
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: AIProvider.GOOGLE,
    contextWindow: 1000000,
    maxOutput: 8192,
    costPerMillionInput: 0.30,
    costPerMillionOutput: 1.20,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.FUNCTION_CALLING,
    ],
    recommended: true,
  },
  {
    id: 'gemini-2-5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: AIProvider.GOOGLE,
    contextWindow: 1000000,
    maxOutput: 8192,
    costPerMillionInput: 0.075,
    costPerMillionOutput: 0.30,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
    ],
    recommended: true,
  },
  {
    id: 'gemini-2-0-flash',
    name: 'Gemini 2.0 Flash',
    provider: AIProvider.GOOGLE,
    contextWindow: 1000000,
    maxOutput: 8192,
    costPerMillionInput: 0.10,
    costPerMillionOutput: 0.40,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.FUNCTION_CALLING,
    ],
  },

  // DeepSeek Models (October 2025 - Official API)
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3.2-Exp)',
    provider: AIProvider.DEEPSEEK,
    contextWindow: 128000,
    maxOutput: 8192,
    costPerMillionInput: 0.14,
    costPerMillionOutput: 0.28,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
    ],
    recommended: true,
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner (Thinking Mode)',
    provider: AIProvider.DEEPSEEK,
    contextWindow: 128000,
    maxOutput: 8192,
    costPerMillionInput: 0.55,
    costPerMillionOutput: 2.19,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.EXTENDED_THINKING,
    ],
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder (V2.5)',
    provider: AIProvider.DEEPSEEK,
    contextWindow: 128000,
    maxOutput: 8192,
    costPerMillionInput: 0.14,
    costPerMillionOutput: 0.28,
    capabilities: [
      ModelCapability.CODE_COMPLETION,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
    ],
  },
];

// Convert to Record for easy lookup
export const MODEL_REGISTRY: Record<string, AIModel> = Object.fromEntries(
  MODELS_ARRAY.map(model => [model.id, model])
);