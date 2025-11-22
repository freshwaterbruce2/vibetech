/**
 * AI-Powered Inline Completion Provider for Monaco Editor
 * Provides GitHub Copilot / Cursor-style inline completions
 *
 * October 2025 - SIMPLIFIED VERSION (modular refactor)
 * Delegates to CompletionOrchestrator for all heavy lifting
 *
 * Features:
 * - 200ms debounce (Cursor-like speed)
 * - Multi-line completions (up to 500 chars, 10 lines)
 * - Multiple completion variations (up to 3)
 * - Automatic navigation support (Alt+] / Alt+[)
 * - Streaming support (via orchestrator)
 * - LRU cache (via orchestrator)
 * - Multi-model ensemble ready (Haiku + Sonnet)
 *
 * Navigation:
 * - Tab: Accept current completion
 * - Alt+] or Opt+]: Next completion variation
 * - Alt+[ or Opt+[: Previous completion variation
 * - Esc: Dismiss completion
 */
import * as monaco from 'monaco-editor';

import { logger } from '../../services/Logger';

import { CompletionOrchestrator } from './completion/CompletionOrchestrator';
import type { CompletionRequest } from './completion/types';
import { UnifiedAIService } from './UnifiedAIService';

export class InlineCompletionProvider {
  private orchestrator: CompletionOrchestrator;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = true;

  constructor(aiService: UnifiedAIService, streamingEnabled: boolean = false) {
    this.orchestrator = new CompletionOrchestrator(aiService);
    this.orchestrator.setStreaming(streamingEnabled);

    logger.debug('[COMPLETION] InlineCompletionProvider initialized (modular), streamingEnabled:', streamingEnabled);
  }

  /**
   * Enable or disable inline completions
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Enable or disable streaming completions
   */
  setStreamingEnabled(enabled: boolean): void {
    this.orchestrator.setStreaming(enabled);
  }

  /**
   * Clear the completion cache
   */
  clearCache(): void {
    this.orchestrator.clearCache();
  }

  /**
   * Set model selection strategy
   * - 'fast': Haiku 4.5 only (<500ms)
   * - 'balanced': Haiku first, upgrade to Sonnet if better
   * - 'accurate': Sonnet 4.5 only (best quality)
   * - 'adaptive': Choose based on context complexity
   */
  setModelStrategy(strategy: 'fast' | 'balanced' | 'accurate' | 'adaptive'): void {
    this.orchestrator.setModelStrategy(strategy);
  }

  /**
   * Invalidate cache for a specific file
   */
  invalidateFile(filePath: string): void {
    this.orchestrator.invalidateFile(filePath);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.orchestrator.getCacheStats();
  }

  /**
   * Get orchestrator modules for advanced configuration
   */
  getOrchestrator(): CompletionOrchestrator {
    return this.orchestrator;
  }

  /**
   * Provide inline completions (called by Monaco)
   * Main entry point - delegates to orchestrator with debouncing
   */
  async provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.InlineCompletions | undefined> {
    logger.debug('[COMPLETION] Provider triggered!', {
      position: `${position.lineNumber}:${position.column}`,
      triggerKind: context.triggerKind,
      isEnabled: this.isEnabled,
    });

    // Check if provider is enabled
    if (!this.isEnabled) {
      logger.debug('[COMPLETION] Provider disabled, skipping');
      return undefined;
    }

    // Only trigger on normal typing (not after explicit invoke or selection change)
    if (context.triggerKind !== monaco.languages.InlineCompletionTriggerKind.Automatic) {
      logger.debug('[COMPLETION] Trigger kind not automatic, skipping');
      return undefined;
    }

    try {
      // Check if model is valid
      if (!model || model.isDisposed()) {
        logger.warn('[COMPLETION] Model is disposed');
        return undefined;
      }

      // Debounce AI requests (wait for user to stop typing)
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        logger.debug('[COMPLETION] Cleared previous debounce timer');
      }

      logger.debug('[COMPLETION] Setting 200ms debounce timer');

      return new Promise((resolve) => {
        this.debounceTimer = setTimeout(async () => {
          logger.debug('[COMPLETION] Debounce timer fired - delegating to orchestrator');
          try {
            // Check cancellation before making request
            if (token.isCancellationRequested) {
              resolve(undefined);
              return;
            }

            // Delegate to orchestrator
            const request: CompletionRequest = {
              context: {
                prefix: '',
                currentLine: '',
                language: '',
                filePath: '',
                lineNumber: 0,
                column: 0,
              }, // Will be extracted by orchestrator
              model,
              position,
              token,
            };

            const completions = await this.orchestrator.orchestrate(request);

            if (completions && completions.length > 0) {
              logger.debug(`[COMPLETION] Got ${completions.length} completions from orchestrator`);
              resolve({ items: completions });
            } else {
              logger.debug('[COMPLETION] No completions from orchestrator');
              resolve(undefined);
            }
          } catch (error) {
            logger.error('[COMPLETION] Error from orchestrator:', error);
            resolve(undefined);
          }
        }, 200); // 200ms debounce (Cursor-like speed)
      });
    } catch (error) {
      logger.error('[COMPLETION] Error in provideInlineCompletions:', error);
      return undefined;
    }
  }

  /**
   * Free inline completions (cleanup)
   */
  freeInlineCompletions(): void {
    // Optional cleanup - orchestrator handles its own cleanup
  }
}

/**
 * Register the inline completion provider with Monaco
 */
export function registerInlineCompletionProvider(
  aiService: UnifiedAIService,
  streamingEnabled: boolean = false
): monaco.IDisposable {
  const provider = new InlineCompletionProvider(aiService, streamingEnabled);

  // Register for all languages
  const disposable = monaco.languages.registerInlineCompletionsProvider(
    { pattern: '**' },
    provider as any
  );

  // Store provider instance for later control
  (disposable as any).provider = provider;

  logger.debug('[COMPLETION] Registered inline completion provider (modular)');

  return disposable;
}
