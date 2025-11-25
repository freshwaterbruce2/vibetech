/**
 * Inline Completion Provider V2
 * Enhanced provider with CompletionOrchestrator integration
 *
 * October 2025 - Week 3 Implementation
 * Features:
 * - Multi-model support via CompletionOrchestrator
 * - Enhanced ghost text rendering
 * - Smart trigger detection
 * - Suggestion filtering and ranking
 * - Streaming support with visual feedback
 */
import { logger } from '../../../services/Logger';

// This file needs runtime monaco for registerInlineCompletionsProvider
import * as monaco from 'monaco-editor';
import { CompletionOrchestrator } from './CompletionOrchestrator';
import { UnifiedAIService } from '../UnifiedAIService';
import { LRUCache } from '../../../utils/LRUCache';
import { getAnalyticsInstance } from '../CompletionAnalytics';
import { v4 as uuidv4 } from 'uuid';
import type { CompletionLatency, VariationType } from '../../../types/analytics';

// Smart trigger patterns for different languages
const TRIGGER_PATTERNS = {
  // TypeScript/JavaScript triggers
  typescript: [
    /\.$/, // After dot (property access)
    /\s+$/, // After space
    /\($/, // After opening parenthesis
    /\{$/, // After opening brace
    /\[$/, // After opening bracket
    /=>$/, // After arrow function
    /:\s*$/, // After colon (type annotation)
    /=\s*$/, // After assignment
    /return\s+$/, // After return statement
    /import\s+$/, // After import
    /export\s+$/, // After export
    /const\s+$/, // After const
    /let\s+$/, // After let
    /var\s+$/, // After var
    /function\s+$/, // After function
    /class\s+$/, // After class
    /interface\s+$/, // After interface
    /type\s+$/, // After type
    /extends\s+$/, // After extends
    /implements\s+$/, // After implements
  ],
  javascript: [
    /\.$/, /\s+$/, /\($/, /\{$/, /\[$/, /=>$/, /=\s*$/,
    /return\s+$/, /import\s+$/, /export\s+$/,
    /const\s+$/, /let\s+$/, /var\s+$/, /function\s+$/, /class\s+$/
  ],
  python: [
    /\.$/, /\s+$/, /\($/, /\[$/, /:\s*$/, /=\s*$/,
    /def\s+$/, /class\s+$/, /import\s+$/, /from\s+$/,
    /return\s+$/, /yield\s+$/, /raise\s+$/, /assert\s+$/,
    /if\s+$/, /elif\s+$/, /else:$/, /for\s+$/, /while\s+$/,
    /with\s+$/, /try:$/, /except\s+$/, /finally:$/
  ],
  default: [
    /\.$/, /\s+$/, /\($/, /\{$/, /\[$/, /=\s*$/, /:\s*$/
  ]
};

// Confidence thresholds for filtering
const CONFIDENCE_THRESHOLDS = {
  high: 0.8,
  medium: 0.5,
  low: 0.3
};

export class InlineCompletionProviderV2 {
  private orchestrator: CompletionOrchestrator;
  private cache: LRUCache<string, monaco.languages.InlineCompletion[]>;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = true;
  private analytics = getAnalyticsInstance();
  private requestStartTimes: Map<string, number> = new Map();
  private currentGhostText: string | null = null;
  private ghostTextDecoration: string[] = [];

  // Multi-model tracking
  private lastUsedModel: string = 'deepseek-chat';
  private modelPerformance: Map<string, number> = new Map();

  constructor(aiService: UnifiedAIService) {
    this.orchestrator = new CompletionOrchestrator(aiService);
    this.cache = new LRUCache(100);

    logger.debug('[InlineCompletionProviderV2] Initialized with CompletionOrchestrator');
  }

  /**
   * Enable/disable completions
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearGhostText();
    }
  }

  /**
   * Set model selection strategy for orchestrator
   */
  setModelStrategy(strategy: 'fast' | 'balanced' | 'accurate' | 'adaptive'): void {
    this.orchestrator.setModelStrategy(strategy);
    logger.debug(`[InlineCompletionProviderV2] Model strategy set to: ${strategy}`);
  }

  /**
   * Main provider method called by Monaco
   */
  async provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.InlineCompletions | undefined> {
    if (!this.isEnabled) {
      return undefined;
    }

    // Check if this is a smart trigger point
    if (!this.shouldTriggerCompletion(model, position, context)) {
      return undefined;
    }

    try {
      // Clear any existing ghost text
      this.clearGhostText();

      // Check cache first
      const cacheKey = this.getCacheKey(model, position);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('[InlineCompletionProviderV2] Cache hit');
        return { items: cached };
      }

      // Debounce requests
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      return new Promise((resolve) => {
        this.debounceTimer = setTimeout(async () => {
          try {
            // Track request start time
            const startTime = Date.now();
            this.requestStartTimes.set(cacheKey, startTime);

            // Use orchestrator for completion
            const completions = await this.orchestrator.orchestrate({
              model,
              position,
              token,
              context: context as any
            });

            if (completions && completions.length > 0) {
              // Filter and rank completions
              const filteredCompletions = this.filterAndRankCompletions(
                completions,
                model,
                position
              );

              if (filteredCompletions.length > 0) {
                // Apply ghost text rendering to first completion
                this.renderGhostText(
                  filteredCompletions[0].insertText.toString(),
                  model,
                  position
                );

                // Cache the results
                this.cache.set(cacheKey, filteredCompletions);

                // Track which model was used
                this.trackModelUsage();

                resolve({ items: filteredCompletions });
              } else {
                resolve(undefined);
              }
            } else {
              resolve(undefined);
            }
          } catch (error) {
            logger.error('[InlineCompletionProviderV2] Error:', error);
            resolve(undefined);
          }
        }, 150); // Slightly faster debounce for better UX
      });
    } catch (error) {
      logger.error('[InlineCompletionProviderV2] Provider error:', error);
      return undefined;
    }
  }

  /**
   * Free resources when provider is disposed
   */
  freeInlineCompletions(): void {
    this.clearGhostText();
  }

  /**
   * Smart trigger detection based on context
   */
  private shouldTriggerCompletion(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext
  ): boolean {
    // Only trigger on automatic typing
    if (context.triggerKind !== monaco.languages.InlineCompletionTriggerKind.Automatic) {
      return false;
    }

    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.substring(0, position.column - 1);

    // Don't trigger on empty lines unless after specific keywords
    if (!textBeforeCursor.trim()) {
      return false;
    }

    // Get language-specific triggers
    const language = model.getLanguageId();
    const triggers = TRIGGER_PATTERNS[language as keyof typeof TRIGGER_PATTERNS] || TRIGGER_PATTERNS.default;

    // Check if current position matches any trigger pattern
    const shouldTrigger = triggers.some(pattern => pattern.test(textBeforeCursor));

    // Additional smart checks
    if (!shouldTrigger) {
      // Check for minimum context (at least 3 chars typed)
      const lastWord = textBeforeCursor.split(/\s+/).pop() || '';
      if (lastWord.length >= 3) {
        return true;
      }
    }

    return shouldTrigger;
  }

  /**
   * Filter and rank completions based on context and confidence
   */
  private filterAndRankCompletions(
    completions: monaco.languages.InlineCompletion[],
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.InlineCompletion[] {
    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.substring(0, position.column - 1);
    const language = model.getLanguageId();

    // Score each completion
    const scoredCompletions = completions.map(completion => {
      let score = 1.0;
      const text = completion.insertText.toString();

      // Length penalty for very long completions
      if (text.length > 200) {
        score *= 0.8;
      }

      // Bonus for matching current indentation
      const currentIndent = textBeforeCursor.match(/^\s*/)?.[0] || '';
      if (text.startsWith(currentIndent)) {
        score *= 1.2;
      }

      // Language-specific scoring
      if (language === 'typescript' || language === 'javascript') {
        // Bonus for completing common patterns
        if (/^\s*\)/.test(text) && textBeforeCursor.includes('(')) {
          score *= 1.3; // Closing parenthesis
        }
        if (/^\s*\}/.test(text) && textBeforeCursor.includes('{')) {
          score *= 1.3; // Closing brace
        }
        if (/^\s*;/.test(text) && !textBeforeCursor.endsWith(';')) {
          score *= 1.1; // Semicolon completion
        }
      }

      // Check for syntax validity (basic)
      if (this.isSyntaxValid(textBeforeCursor + text, language)) {
        score *= 1.5;
      }

      return { completion, score };
    });

    // Sort by score and filter by threshold
    const filtered = scoredCompletions
      .sort((a, b) => b.score - a.score)
      .filter(item => item.score >= CONFIDENCE_THRESHOLDS.low)
      .slice(0, 3) // Maximum 3 variations
      .map(item => item.completion);

    return filtered;
  }

  /**
   * Basic syntax validation
   */
  private isSyntaxValid(code: string, language: string): boolean {
    // Simple bracket/parenthesis matching
    let openParens = 0;
    let openBraces = 0;
    let openBrackets = 0;

    for (const char of code) {
      switch (char) {
        case '(': openParens++; break;
        case ')': openParens--; break;
        case '{': openBraces++; break;
        case '}': openBraces--; break;
        case '[': openBrackets++; break;
        case ']': openBrackets--; break;
      }

      // Invalid if closing more than opened
      if (openParens < 0 || openBraces < 0 || openBrackets < 0) {
        return false;
      }
    }

    // Valid if all brackets are balanced or have more opening (incomplete)
    return openParens >= 0 && openBraces >= 0 && openBrackets >= 0;
  }

  /**
   * Render ghost text with visual feedback
   */
  private renderGhostText(
    text: string,
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): void {
    // Store current ghost text
    this.currentGhostText = text;

    // Create ghost text decoration
    const decoration: monaco.editor.IModelDeltaDecoration = {
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column + text.length
      ),
      options: {
        afterContentClassName: 'ghost-text-suggestion',
        inlineClassName: 'ghost-text-inline',
      }
    };

    // Apply decoration
    this.ghostTextDecoration = model.deltaDecorations(
      this.ghostTextDecoration,
      [decoration]
    );

    // Add CSS if not already added
    this.injectGhostTextStyles();
  }

  /**
   * Clear ghost text decorations
   */
  private clearGhostText(): void {
    if (this.ghostTextDecoration.length > 0) {
      // Clear decorations on all models
      monaco.editor.getModels().forEach(model => {
        model.deltaDecorations(this.ghostTextDecoration, []);
      });
      this.ghostTextDecoration = [];
      this.currentGhostText = null;
    }
  }

  /**
   * Inject CSS for ghost text rendering
   */
  private injectGhostTextStyles(): void {
    const styleId = 'inline-completion-ghost-text-styles';

    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .ghost-text-suggestion::after {
          content: attr(data-ghost-text);
          opacity: 0.5;
          font-style: italic;
          color: #888;
        }

        .ghost-text-inline {
          opacity: 0.6;
          filter: brightness(0.8);
        }

        .monaco-editor .suggest-widget {
          z-index: 100;
        }

        /* Smooth animation for ghost text appearance */
        @keyframes ghostTextFade {
          from { opacity: 0; }
          to { opacity: 0.5; }
        }

        .ghost-text-suggestion::after {
          animation: ghostTextFade 0.2s ease-in;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Generate cache key for current context
   */
  private getCacheKey(model: monaco.editor.ITextModel, position: monaco.Position): string {
    const lineContent = model.getLineContent(position.lineNumber);
    const language = model.getLanguageId();
    const prefix = lineContent.substring(0, position.column - 1);
    return `${language}:${position.lineNumber}:${prefix.slice(-50)}`;
  }

  /**
   * Track model usage for analytics
   */
  private trackModelUsage(): void {
    const currentStrategy = this.orchestrator.getModelStrategy();
    const modelKey = `${currentStrategy}:${Date.now()}`;

    // Track performance by strategy
    const currentCount = this.modelPerformance.get(currentStrategy) || 0;
    this.modelPerformance.set(currentStrategy, currentCount + 1);

    // Log usage stats periodically
    if (this.modelPerformance.get(currentStrategy)! % 10 === 0) {
      logger.debug('[InlineCompletionProviderV2] Model usage stats:',
        Object.fromEntries(this.modelPerformance));
    }
  }

  /**
   * Handle completion acceptance (called when Tab is pressed)
   */
  acceptCompletion(): boolean {
    if (this.currentGhostText) {
      // Track acceptance
      this.analytics.trackCompletionAccepted(
        uuidv4(),
        'full' as VariationType
      );

      // Week 4: Track acceptance for learning
      const position = new monaco.Position(1, 1); // Should be tracked properly
      this.orchestrator.trackAcceptance(position, true, this.currentGhostText);

      this.clearGhostText();
      return true;
    }
    return false;
  }

  /**
   * Handle completion rejection (called when Esc is pressed)
   */
  rejectCompletion(): boolean {
    if (this.currentGhostText) {
      // Track rejection
      this.analytics.trackCompletionRejected(
        uuidv4()
      );

      // Week 4: Track rejection for learning
      const position = new monaco.Position(1, 1); // Should be tracked properly
      this.orchestrator.trackAcceptance(position, false, this.currentGhostText);

      this.clearGhostText();
      return true;
    }
    return false;
  }

  /**
   * Get current provider status
   */
  getStatus(): {
    enabled: boolean;
    strategy: string;
    cacheSize: number;
    hasGhostText: boolean;
    modelUsage: Record<string, number>;
  } {
    return {
      enabled: this.isEnabled,
      strategy: this.orchestrator.getModelStrategy(),
      cacheSize: this.cache.size(),
      hasGhostText: this.currentGhostText !== null,
      modelUsage: Object.fromEntries(this.modelPerformance)
    };
  }

  /**
   * Get prefetch statistics (Week 4)
   */
  getPrefetchStats() {
    return this.orchestrator.getPrefetchStats();
  }

  /**
   * Enable/disable prefetching (Week 4)
   */
  setPrefetchingEnabled(enabled: boolean): void {
    this.orchestrator.setPrefetchingEnabled(enabled);
  }
}

/**
 * Register the enhanced inline completion provider with Monaco
 */
export function registerInlineCompletionProviderV2(
  aiService: UnifiedAIService,
  editor?: monaco.editor.IStandaloneCodeEditor
): monaco.IDisposable {
  const provider = new InlineCompletionProviderV2(aiService);

  // Register for all languages
  const disposable = monaco.languages.registerInlineCompletionsProvider(
    { pattern: '**' },
    provider as any
  );

  // Add keyboard shortcuts if editor provided
  if (editor) {
    // Tab to accept
    editor.addCommand(
      monaco.KeyCode.Tab,
      () => provider.acceptCompletion(),
      'editorTextFocus && !suggestWidgetVisible'
    );

    // Escape to reject
    editor.addCommand(
      monaco.KeyCode.Escape,
      () => provider.rejectCompletion(),
      'editorTextFocus'
    );
  }

  // Store provider instance for control
  (disposable as any).provider = provider;

  logger.debug('[InlineCompletionProviderV2] Registered with multi-model support');

  return disposable;
}