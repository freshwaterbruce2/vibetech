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

// Model Registry with 2025 latest models
const MODELS_ARRAY: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: AIProvider.OPENAI,
    contextWindow: 128000,
    maxOutput: 4096,
    costPerMillionInput: 10,
    costPerMillionOutput: 30,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.VISION,
    ],
    recommended: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: AIProvider.OPENAI,
    contextWindow: 128000,
    maxOutput: 4096,
    costPerMillionInput: 5,
    costPerMillionOutput: 15,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.VISION,
    ],
  },
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    provider: AIProvider.OPENAI,
    contextWindow: 128000,
    maxOutput: 16384,
    costPerMillionInput: 3,
    costPerMillionOutput: 12,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.EXTENDED_THINKING,
    ],
  },

  // Anthropic Models
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: AIProvider.ANTHROPIC,
    contextWindow: 200000,
    maxOutput: 4096,
    costPerMillionInput: 15,
    costPerMillionOutput: 75,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.EXTENDED_THINKING,
    ],
    recommended: true,
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3.5 Sonnet',
    provider: AIProvider.ANTHROPIC,
    contextWindow: 200000,
    maxOutput: 4096,
    costPerMillionInput: 3,
    costPerMillionOutput: 15,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
    ],
    recommended: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: AIProvider.ANTHROPIC,
    contextWindow: 200000,
    maxOutput: 4096,
    costPerMillionInput: 0.25,
    costPerMillionOutput: 1.25,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
    ],
  },

  // Google Models
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: AIProvider.GOOGLE,
    contextWindow: 1000000,
    maxOutput: 8192,
    costPerMillionInput: 3.5,
    costPerMillionOutput: 10.5,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
      ModelCapability.FUNCTION_CALLING,
    ],
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: AIProvider.GOOGLE,
    contextWindow: 1000000,
    maxOutput: 8192,
    costPerMillionInput: 0.35,
    costPerMillionOutput: 1.05,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.VISION,
    ],
  },

  // DeepSeek Models
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: AIProvider.DEEPSEEK,
    contextWindow: 128000,
    maxOutput: 4096,
    costPerMillionInput: 0.14,
    costPerMillionOutput: 0.28,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
    ],
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: AIProvider.DEEPSEEK,
    contextWindow: 128000,
    maxOutput: 4096,
    costPerMillionInput: 0.14,
    costPerMillionOutput: 0.28,
    capabilities: [
      ModelCapability.CODE_GENERATION,
      ModelCapability.CODE_COMPLETION,
    ],
    recommended: true,
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    provider: AIProvider.DEEPSEEK,
    contextWindow: 64000,
    maxOutput: 32000,
    costPerMillionInput: 0.55,
    costPerMillionOutput: 2.19,
    capabilities: [
      ModelCapability.CHAT,
      ModelCapability.CODE_GENERATION,
      ModelCapability.EXTENDED_THINKING,
    ],
  },
];

// Convert to Record for easy lookup
export const MODEL_REGISTRY: Record<string, AIModel> = Object.fromEntries(
  MODELS_ARRAY.map(model => [model.id, model])
);