/**
 * Completion Orchestrator
 * Coordinates all completion modules and implements multi-model ensemble
 *
 * October 2025 - NEW MODULE (modular refactor)
 * Implements Haiku 4.5 + Sonnet 4.5 ensemble (Anthropic recommended pattern)
 * Week 4: Added predictive prefetching support
 */
import * as monaco from 'monaco-editor';

import { logger } from '../../../services/Logger';
import type { CompletionLatency } from '../../../types/analytics';
import { UnifiedAIService } from '../UnifiedAIService';

import { CompletionCache } from './CompletionCache';
import { CompletionFetcherV2 as CompletionFetcher } from './CompletionFetcherV2';
import { CompletionParser } from './CompletionParser';
import { ModelSelector } from './ModelSelector';
import { PredictivePrefetcher } from './PredictivePrefetcher';
import type { CodeContext, CompletionRequest,ModelStrategy } from './types';
import { VariationGenerator } from './VariationGenerator';

export class CompletionOrchestrator {
  private cache: CompletionCache;
  private fetcher: CompletionFetcher;
  private parser: CompletionParser;
  private variationGenerator: VariationGenerator;
  private modelSelector: ModelSelector;
  private prefetcher: PredictivePrefetcher;
  private modelStrategy: ModelStrategy = 'fast'; // Default to Haiku 4.5
  private recentEdits: string[] = [];
  private prefetchEnabled: boolean = true;

  constructor(aiService: UnifiedAIService) {
    this.cache = new CompletionCache(100);
    this.fetcher = new CompletionFetcher(aiService);
    this.parser = new CompletionParser();
    this.variationGenerator = new VariationGenerator();
    this.modelSelector = new ModelSelector('fast');
    this.prefetcher = new PredictivePrefetcher(this);

    logger.debug('[CompletionOrchestrator] Initialized with predictive prefetching support');
  }

  /**
   * Orchestrate completion request through all modules
   * Main entry point for completion generation
   * Week 4: Enhanced with predictive prefetching
   */
  async orchestrate(
    request: CompletionRequest
  ): Promise<monaco.languages.InlineCompletion[] | null> {
    const context = this.getCodeContext(request.model, request.position);

    // Skip if current line is empty or whitespace
    if (!context.currentLine.trim()) {
      return null;
    }

    // Track edit for pattern learning
    this.trackEdit(context.currentLine);

    // Week 4: Check prefetch cache first
    if (this.prefetchEnabled) {
      const prefetched = await this.prefetcher.checkCache(request.model, request.position);
      if (prefetched) {
        logger.debug('[CompletionOrchestrator] Using prefetched completion');
        return prefetched;
      }

      // Trigger predictive prefetching for next positions
      this.prefetcher.predictAndQueue(
        request.model,
        request.position,
        this.recentEdits
      ).catch(error => {
        logger.error('[CompletionOrchestrator] Prefetch error:', error);
      });
    }

    // Check regular cache
    const cached = this.cache.get(context);
    if (cached) {
      return cached;
    }

    // Check if cancellation requested
    if (request.token.isCancellationRequested) {
      return null;
    }

    // Select model based on context complexity and strategy
    const selectedModel = this.modelSelector.selectModel(context);
    logger.debug(`[CompletionOrchestrator] Selected model: ${selectedModel.displayName} (strategy: ${this.modelSelector.getStrategy()})`);

    // Fetch completion from AI
    const requestStartTime = Date.now();

    // Pass selected model config to fetcher for routing
    const response = await this.fetcher.fetch(context, selectedModel);

    if (!response || request.token.isCancellationRequested) {
      return null;
    }

    // Track performance for adaptive learning
    if (response) {
      // Will track actual acceptance when user accepts/rejects completion
      // For now, just track that we got a response
      this.modelSelector.trackPerformance(
        selectedModel,
        context.language,
        true, // Assume accepted for now
        response.latency
      );
    }

    // Parse AI response
    const cleanedCompletion = this.parser.parse(response.text, context);

    if (!cleanedCompletion) {
      return null;
    }

    // Calculate latency metrics
    const latency: CompletionLatency = {
      firstVisible: response.latency,
      complete: Date.now() - requestStartTime,
      fromCache: response.fromCache,
      wasStreaming: response.wasStreaming,
      debounceTime: 200,
    };

    // Generate completion variations
    const variations = this.variationGenerator.generate(
      cleanedCompletion,
      request.position,
      context,
      latency
    );

    // Cache the result
    this.cache.set(context, variations);

    // Week 4: Learn from this completion for future predictions
    if (this.prefetchEnabled && variations.length > 0) {
      this.prefetcher.learnFromAcceptance(
        request.position,
        true, // Will be updated when we track actual acceptance
        variations[0].insertText.toString()
      );
    }

    return variations;
  }

  /**
   * Extract code context from Monaco model
   */
  private getCodeContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): CodeContext {
    try {
      const {lineNumber} = position;
      const {column} = position;

      // Validate line number
      if (lineNumber < 1 || lineNumber > model.getLineCount()) {
        throw new Error(`Invalid line number: ${lineNumber}`);
      }

      // Get current line
      const currentLine = model.getLineContent(lineNumber);
      const textBeforeCursor = currentLine.substring(0, column - 1);

      // Get surrounding context (10 lines before)
      const startLine = Math.max(1, lineNumber - 10);
      const prefix = model.getValueInRange({
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: column,
      });

      // Get language and file path
      const language = model.getLanguageId();
      const uri = model.uri.toString();

      return {
        prefix,
        currentLine: textBeforeCursor,
        language,
        filePath: uri,
        lineNumber,
        column,
      };
    } catch (error) {
      logger.error('[CompletionOrchestrator] Error getting context:', error);
      // Return safe defaults
      return {
        prefix: '',
        currentLine: '',
        language: 'plaintext',
        filePath: '',
        lineNumber: position.lineNumber,
        column: position.column,
      };
    }
  }

  /**
   * Set model selection strategy
   * - 'fast': Use DeepSeek primarily (or Haiku if available)
   * - 'balanced': Use DeepSeek, upgrade to Sonnet for complex code
   * - 'accurate': Use Sonnet if available, else DeepSeek
   * - 'adaptive': Choose based on context complexity and performance history
   *
   * Note: DeepSeek remains the default when Anthropic models are unavailable
   */
  setModelStrategy(strategy: ModelStrategy): void {
    this.modelStrategy = strategy;
    this.modelSelector.setStrategy(strategy);
    logger.debug(`[CompletionOrchestrator] Model strategy changed to: ${strategy}`);
  }

  /**
   * Get current model strategy
   */
  getModelStrategy(): ModelStrategy {
    return this.modelStrategy;
  }

  /**
   * Clear all cached completions
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache for a specific file
   */
  invalidateFile(filePath: string): void {
    this.cache.invalidateFile(filePath);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Enable/disable streaming completions
   */
  setStreaming(enabled: boolean): void {
    this.fetcher.setStreaming(enabled);
  }

  /**
   * Get individual modules for advanced configuration
   */
  getModules() {
    return {
      cache: this.cache,
      fetcher: this.fetcher,
      parser: this.parser,
      variationGenerator: this.variationGenerator,
      prefetcher: this.prefetcher,
    };
  }

  /**
   * Track edits for pattern learning
   * Week 4: Used by predictive prefetcher
   */
  private trackEdit(text: string): void {
    this.recentEdits.push(text);
    if (this.recentEdits.length > 20) {
      this.recentEdits = this.recentEdits.slice(-20);
    }
  }

  /**
   * Enable/disable predictive prefetching
   */
  setPrefetchingEnabled(enabled: boolean): void {
    this.prefetchEnabled = enabled;
    logger.debug(`[CompletionOrchestrator] Prefetching ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get prefetch statistics
   */
  getPrefetchStats() {
    return this.prefetcher.getStats();
  }

  /**
   * Track completion acceptance for learning
   */
  trackAcceptance(position: monaco.Position, accepted: boolean, text: string): void {
    if (this.prefetchEnabled) {
      this.prefetcher.learnFromAcceptance(position, accepted, text);
    }
  }

  /**
   * Clear all caches including prefetch
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.prefetcher.clear();
    logger.debug('[CompletionOrchestrator] All caches cleared');
  }
}
