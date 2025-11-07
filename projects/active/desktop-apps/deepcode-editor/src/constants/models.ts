/**
 * AI Model Constants - 2025 Best Practices
 * Centralized model identifiers with type-safe inference using 'as const'
 */

export const AI_MODELS = {
  // DeepSeek Models
  DEEPSEEK_CHAT: 'deepseek-chat',
  DEEPSEEK_CODER: 'deepseek-coder',
  DEEPSEEK_REASONER: 'deepseek-reasoner',

  // OpenAI Models
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',

  // Anthropic Models
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',

  // Google Models
  GEMINI_PRO: 'gemini-pro',
  GEMINI_PRO_VISION: 'gemini-pro-vision',
} as const; // ✅ 2025: Enables type inference and readonly

export type AIModelName = typeof AI_MODELS[keyof typeof AI_MODELS];

/**
 * Model Capabilities - for routing decisions
 */
export const MODEL_CAPABILITIES = {
  CODING: [
    AI_MODELS.DEEPSEEK_CODER,
    AI_MODELS.GPT_4,
    AI_MODELS.CLAUDE_3_OPUS,
  ],
  REASONING: [
    AI_MODELS.DEEPSEEK_REASONER,
    AI_MODELS.GPT_4_TURBO,
    AI_MODELS.CLAUDE_3_OPUS,
  ],
  CHAT: [
    AI_MODELS.DEEPSEEK_CHAT,
    AI_MODELS.GPT_3_5_TURBO,
    AI_MODELS.CLAUDE_3_HAIKU,
  ],
} as const;

/**
 * Default models per provider
 */
export const DEFAULT_MODELS = {
  DEEPSEEK: AI_MODELS.DEEPSEEK_CHAT,
  OPENAI: AI_MODELS.GPT_4,
  ANTHROPIC: AI_MODELS.CLAUDE_3_SONNET,
  GOOGLE: AI_MODELS.GEMINI_PRO,
} as const;
