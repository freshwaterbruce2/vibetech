/**
 * Environment Variable Validation - 2025 Best Practices
 * Uses Zod for type-safe, validated environment variables
 * Fails fast at startup with clear error messages
 */

import { z } from 'zod';

const envSchema = z.object({
  // DeepSeek AI Configuration
  VITE_DEEPSEEK_API_KEY: z
    .string()
    .min(1, 'DeepSeek API key is required for AI features')
    .optional(),

  VITE_DEEPSEEK_BASE_URL: z
    .string()
    .url('Invalid DeepSeek API URL format')
    .default('https://api.deepseek.com/v1'),

  // OpenAI Configuration
  VITE_OPENAI_API_KEY: z
    .string()
    .min(1, 'OpenAI API key is required')
    .optional(),

  // Anthropic Configuration
  VITE_ANTHROPIC_API_KEY: z
    .string()
    .min(1, 'Anthropic API key is required')
    .optional(),

  // Google AI Configuration
  VITE_GOOGLE_API_KEY: z
    .string()
    .min(1, 'Google AI API key is required')
    .optional(),

  // Environment
  MODE: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Application Configuration
  VITE_APP_VERSION: z.string().optional(),
  VITE_APP_NAME: z.string().default('DeepCode Editor'),

  // Feature Flags
  VITE_ENABLE_TELEMETRY: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  VITE_ENABLE_AUTO_UPDATE: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

/**
 * Parsed and validated environment variables
 * Access via: env.VITE_DEEPSEEK_API_KEY
 */
export const env = envSchema.parse(import.meta.env);

/**
 * Type-safe environment variable type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in development mode
 */
export const isDevelopment = env.MODE === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = env.MODE === 'production';

/**
 * Check if API keys are configured
 */
export const hasApiKeys = {
  deepseek: !!env.VITE_DEEPSEEK_API_KEY,
  openai: !!env.VITE_OPENAI_API_KEY,
  anthropic: !!env.VITE_ANTHROPIC_API_KEY,
  google: !!env.VITE_GOOGLE_API_KEY,
};

/**
 * Get configured providers
 */
export const getConfiguredProviders = (): string[] => {
  const providers: string[] = [];
  if (hasApiKeys.deepseek) providers.push('deepseek');
  if (hasApiKeys.openai) providers.push('openai');
  if (hasApiKeys.anthropic) providers.push('anthropic');
  if (hasApiKeys.google) providers.push('google');
  return providers;
};
