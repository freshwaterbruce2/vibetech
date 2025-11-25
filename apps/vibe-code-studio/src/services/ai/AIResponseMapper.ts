/**
 * AI Response Mapper
 *
 * Standardizes AI responses from different providers into a unified format
 * Handles both provider manager responses and direct API responses
 */

import { AICompletionResponse } from './types';

export interface ProviderResponse {
  content?: string;
  choices?: Array<{
    message?: { content?: string };
    finishReason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

export class AIResponseMapper {
  /**
   * Map provider manager response to standard format
   */
  static mapProviderResponse(response: ProviderResponse): AICompletionResponse {
    const content =
      response.content ||
      response.choices?.[0]?.message?.content ||
      response.choices?.[0]?.message?.content ||
      '';

    const finishReason = response.finishReason || response.choices?.[0]?.finishReason;

    const usage = response.usage
      ? {
          promptTokens: response.usage.prompt_tokens || response.usage.promptTokens || 0,
          completionTokens:
            response.usage.completion_tokens || response.usage.completionTokens || 0,
          totalTokens: response.usage.total_tokens || response.usage.totalTokens || 0,
        }
      : undefined;

    return {
      content,
      usage,
      finishReason,
    };
  }

  /**
   * Map DeepSeek API response to standard format
   */
  static mapDeepSeekResponse(data: any): AICompletionResponse {
    const content = data.choices?.[0]?.message?.content;
    const reasoning_content = data.choices?.[0]?.message?.reasoning_content;
    const usage = data.usage;

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
      finishReason: data.choices?.[0]?.finish_reason,
    };
  }

  /**
   * Extract content from streaming chunk
   */
  static extractStreamContent(chunk: any): string | null {
    if (chunk.content) {
      return chunk.content;
    }

    if (chunk.choices?.[0]?.delta?.content) {
      return chunk.choices[0].delta.content;
    }

    return null;
  }

  /**
   * Extract reasoning content from streaming chunk (DeepSeek-specific)
   */
  static extractStreamReasoning(chunk: any): string | null {
    return chunk.choices?.[0]?.delta?.reasoning_content || null;
  }
}
