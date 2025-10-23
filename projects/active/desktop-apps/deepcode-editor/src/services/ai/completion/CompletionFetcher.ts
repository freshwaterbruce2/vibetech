/**
 * Completion Fetcher
 * Handles AI completion requests (streaming and non-streaming)
 *
 * October 2025 - Extracted from monolithic InlineCompletionProvider
 * Supports Claude Haiku 4.5 + Sonnet 4.5 ensemble (2025 best practice)
 */
import { logger } from '../../../services/Logger';

import { UnifiedAIService } from '../UnifiedAIService';
import type { CodeContext, CompletionResponse, FetcherOptions } from './types';
import type { AIContextRequest } from '../../../types';

const DEFAULT_OPTIONS: FetcherOptions = {
  streaming: false,
  maxTokens: 500,
  temperature: 0.2,
  debounceMs: 200,
};

export class CompletionFetcher {
  private aiService: UnifiedAIService;
  private options: FetcherOptions;

  constructor(aiService: UnifiedAIService, options: Partial<FetcherOptions> = {}) {
    this.aiService = aiService;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Fetch completion from AI
   * Automatically chooses streaming vs non-streaming based on configuration
   */
  async fetch(context: CodeContext): Promise<CompletionResponse | null> {
    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = this.buildPrompt(context);

      // Fetch based on mode
      const responseText = this.options.streaming
        ? await this.fetchStreaming(prompt, context)
        : await this.fetchNonStreaming(prompt, context);

      if (!responseText) {
        return null;
      }

      const latency = Date.now() - startTime;

      return {
        text: responseText,
        model: 'deepseek-chat', // TODO: Get from aiService
        latency,
        fromCache: false,
        wasStreaming: this.options.streaming,
      };
    } catch (error) {
      logger.error('[CompletionFetcher] Fetch error:', error);
      return null;
    }
  }

  /**
   * Fetch completion without streaming (traditional approach)
   */
  private async fetchNonStreaming(
    prompt: string,
    context: CodeContext
  ): Promise<string | null> {
    try {
      const request: AIContextRequest = {
        userQuery: prompt,
        relatedFiles: [],
        workspaceContext: {
          rootPath: '',
          totalFiles: 0,
          languages: [context.language],
          testFiles: 0,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Inline completion context',
        },
        conversationHistory: [],
      };

      const response = await this.aiService.sendContextualMessage(request);
      return response?.content || null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Fetch completion with streaming (progressive display)
   * Uses async generator for real-time updates
   */
  private async fetchStreaming(
    prompt: string,
    context: CodeContext
  ): Promise<string | null> {
    try {
      const request: AIContextRequest = {
        userQuery: prompt,
        relatedFiles: [],
        workspaceContext: {
          rootPath: '',
          totalFiles: 0,
          languages: [context.language],
          testFiles: 0,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Inline completion context (streaming)',
        },
        conversationHistory: [],
      };

      // Use streaming API
      const streamGenerator = this.aiService.sendContextualMessageStream(request);

      // Accumulate chunks
      let accumulated = '';
      for await (const chunk of streamGenerator) {
        accumulated += chunk;
        // Could emit progress events here for real-time display
      }

      return accumulated || null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Build AI completion prompt
   * Optimized for code completion (concise, no explanations)
   */
  private buildPrompt(context: CodeContext): string {
    return `Complete the following ${context.language} code. Provide ONLY the completion text, no explanations:

\`\`\`${context.language}
${context.prefix}`;
  }

  /**
   * Handle fetch errors with user-friendly messages
   */
  private handleError(error: unknown): void {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        logger.warn('[CompletionFetcher] No API key configured');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        logger.error('[CompletionFetcher] Network error:', error.message);
      } else {
        logger.error('[CompletionFetcher] Error:', error.message);
      }
    } else {
      logger.error('[CompletionFetcher] Unknown error:', error);
    }
  }

  /**
   * Update fetcher options
   */
  setOptions(options: Partial<FetcherOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): FetcherOptions {
    return { ...this.options };
  }

  /**
   * Enable/disable streaming
   */
  setStreaming(enabled: boolean): void {
    this.options.streaming = enabled;
  }
}
