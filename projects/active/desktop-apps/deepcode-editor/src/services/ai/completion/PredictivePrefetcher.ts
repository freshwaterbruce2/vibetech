/**
 * Predictive Prefetcher Service
 * Anticipates and pre-generates completions before they're needed
 *
 * October 2025 - Week 4 Implementation
 * Features:
 * - Pattern-based prediction of next cursor positions
 * - Background completion generation
 * - Priority-based prefetch queue
 * - Adaptive learning from user behavior
 * - Resource-aware throttling
 */
import { logger } from '../../../services/Logger';

import * as monaco from 'monaco-editor';
import { CompletionOrchestrator } from './CompletionOrchestrator';
import { PatternLearner } from './PatternLearner';
import { PrefetchCache } from './PrefetchCache';
import type { CodeContext } from './types';

// Prediction confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,    // Definitely prefetch
  MEDIUM: 0.5,  // Prefetch if resources available
  LOW: 0.3,     // Only prefetch if idle
};

// Resource limits
const RESOURCE_LIMITS = {
  MAX_CONCURRENT_PREFETCHES: 3,
  MAX_PREFETCH_QUEUE: 10,
  MAX_CACHE_SIZE: 50,
  PREFETCH_DEBOUNCE_MS: 500,
  IDLE_THRESHOLD_MS: 1000,
  MEMORY_LIMIT_MB: 50,
};

// Prediction patterns
const PREDICTION_PATTERNS = {
  // After typing patterns that typically need completion
  AFTER_DOT: /\.\s*$/,
  AFTER_ARROW: /=>\s*$/,
  AFTER_OPEN_PAREN: /\(\s*$/,
  AFTER_OPEN_BRACE: /\{\s*$/,
  AFTER_COLON: /:\s*$/,
  AFTER_EQUALS: /=\s*$/,
  NEW_LINE: /\n\s*$/,
  AFTER_RETURN: /return\s+$/,
  AFTER_IF: /if\s*\(\s*$/,
  AFTER_FUNCTION: /function\s+\w+\s*\(\s*$/,
  AFTER_CLASS: /class\s+\w+\s*$/,
  AFTER_IMPORT: /import\s+$/,
  AFTER_CONST: /const\s+\w+\s*=\s*$/,
};

interface PrefetchRequest {
  id: string;
  position: monaco.Position;
  context: CodeContext;
  priority: number;
  confidence: number;
  timestamp: number;
  attempts: number;
}

interface PrefetchResult {
  requestId: string;
  completions: monaco.languages.InlineCompletion[];
  generatedAt: number;
  model: string;
  latency: number;
}

export class PredictivePrefetcher {
  private orchestrator: CompletionOrchestrator;
  private patternLearner: PatternLearner;
  private cache: PrefetchCache;
  private prefetchQueue: Map<string, PrefetchRequest>;
  private activePrefetches: Set<string>;
  private lastActivity: number;
  private isIdle: boolean;
  private worker: Worker | null = null;
  private memoryUsage: number = 0;
  private stats = {
    totalPrefetches: 0,
    hits: 0,
    misses: 0,
    accuracy: 0,
    avgLatency: 0,
  };

  constructor(orchestrator: CompletionOrchestrator) {
    this.orchestrator = orchestrator;
    this.patternLearner = new PatternLearner();
    this.cache = new PrefetchCache(RESOURCE_LIMITS.MAX_CACHE_SIZE);
    this.prefetchQueue = new Map();
    this.activePrefetches = new Set();
    this.lastActivity = Date.now();
    this.isIdle = false;

    // Initialize background worker if available
    this.initializeWorker();

    // Start idle detection
    this.startIdleDetection();

    logger.debug('[PredictivePrefetcher] Initialized with adaptive learning');
  }

  /**
   * Initialize web worker for background processing
   */
  private initializeWorker(): void {
    if (typeof Worker !== 'undefined') {
      try {
        // Create inline worker for prefetch processing
        const workerCode = `
          self.onmessage = function(e) {
            const { type, data } = e.data;

            if (type === 'PROCESS_QUEUE') {
              // Process prefetch queue in background
              const processed = data.queue.filter(item =>
                item.confidence > 0.5
              ).sort((a, b) => b.priority - a.priority);

              self.postMessage({
                type: 'QUEUE_PROCESSED',
                data: processed
              });
            }
          }
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.worker = new Worker(workerUrl);

        this.worker.onmessage = (e) => {
          this.handleWorkerMessage(e.data);
        };

        logger.debug('[PredictivePrefetcher] Web Worker initialized');
      } catch (error) {
        logger.warn('[PredictivePrefetcher] Web Worker not available:', error);
      }
    }
  }

  /**
   * Start idle detection for opportunistic prefetching
   */
  private startIdleDetection(): void {
    setInterval(() => {
      const now = Date.now();
      const idleTime = now - this.lastActivity;

      this.isIdle = idleTime > RESOURCE_LIMITS.IDLE_THRESHOLD_MS;

      if (this.isIdle) {
        this.processIdlePrefetches();
      }
    }, 500);
  }

  /**
   * Predict next cursor positions and queue prefetches
   */
  async predictAndQueue(
    model: monaco.editor.ITextModel,
    currentPosition: monaco.Position,
    recentEdits: string[]
  ): Promise<void> {
    this.lastActivity = Date.now();

    // Get predictions from pattern learner
    const predictions = this.patternLearner.predictNextPositions(
      model,
      currentPosition,
      recentEdits
    );

    // Queue high-confidence predictions
    for (const prediction of predictions) {
      if (prediction.confidence >= CONFIDENCE_THRESHOLDS.LOW) {
        await this.queuePrefetch(
          model,
          prediction.position,
          prediction.confidence,
          prediction.priority
        );
      }
    }

    // Process queue based on resources
    this.processQueue();
  }

  /**
   * Queue a prefetch request
   */
  private async queuePrefetch(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    confidence: number,
    priority: number
  ): Promise<void> {
    const context = this.extractContext(model, position);
    const requestId = this.generateRequestId(context, position);

    // Check if already cached
    if (this.cache.has(requestId)) {
      this.stats.hits++;
      return;
    }

    // Check if already queued or active
    if (this.prefetchQueue.has(requestId) || this.activePrefetches.has(requestId)) {
      return;
    }

    // Add to queue
    const request: PrefetchRequest = {
      id: requestId,
      position,
      context,
      priority,
      confidence,
      timestamp: Date.now(),
      attempts: 0,
    };

    this.prefetchQueue.set(requestId, request);

    // Limit queue size
    if (this.prefetchQueue.size > RESOURCE_LIMITS.MAX_PREFETCH_QUEUE) {
      this.pruneQueue();
    }
  }

  /**
   * Process prefetch queue based on priority and resources
   */
  private async processQueue(): Promise<void> {
    // Check resource limits
    if (this.activePrefetches.size >= RESOURCE_LIMITS.MAX_CONCURRENT_PREFETCHES) {
      return;
    }

    if (this.memoryUsage > RESOURCE_LIMITS.MEMORY_LIMIT_MB * 1024 * 1024) {
      logger.warn('[PredictivePrefetcher] Memory limit reached, pausing prefetch');
      return;
    }

    // Get highest priority items
    const sortedQueue = Array.from(this.prefetchQueue.values())
      .sort((a, b) => {
        // Sort by confidence and priority
        const scoreA = a.confidence * a.priority;
        const scoreB = b.confidence * b.priority;
        return scoreB - scoreA;
      });

    // Process top items
    const toProcess = sortedQueue.slice(
      0,
      RESOURCE_LIMITS.MAX_CONCURRENT_PREFETCHES - this.activePrefetches.size
    );

    for (const request of toProcess) {
      this.processPrefetch(request);
    }
  }

  /**
   * Process a single prefetch request
   */
  private async processPrefetch(request: PrefetchRequest): Promise<void> {
    // Move from queue to active
    this.prefetchQueue.delete(request.id);
    this.activePrefetches.add(request.id);

    try {
      const startTime = Date.now();

      // Generate completion using orchestrator
      const completions = await this.orchestrator.orchestrate({
        model: monaco.editor.createModel(request.context.prefix, request.context.language),
        position: request.position,
        token: new monaco.CancellationTokenSource().token,
        context: {
          triggerKind: monaco.languages.InlineCompletionTriggerKind.Automatic,
          selectedSuggestionInfo: undefined,
        } as any,
      });

      const latency = Date.now() - startTime;

      if (completions && completions.length > 0) {
        // Cache the result
        const result: PrefetchResult = {
          requestId: request.id,
          completions,
          generatedAt: Date.now(),
          model: this.orchestrator.getModelStrategy(),
          latency,
        };

        this.cache.set(request.id, result);
        this.stats.totalPrefetches++;
        this.updateStats(latency);

        logger.debug(`[PredictivePrefetcher] Prefetched ${request.id} in ${latency}ms`);
      }
    } catch (error) {
      logger.error('[PredictivePrefetcher] Prefetch error:', error);
      request.attempts++;

      // Retry if under attempt limit
      if (request.attempts < 3) {
        this.prefetchQueue.set(request.id, request);
      }
    } finally {
      this.activePrefetches.delete(request.id);
      this.updateMemoryUsage();
    }
  }

  /**
   * Process low-priority prefetches during idle time
   */
  private async processIdlePrefetches(): Promise<void> {
    const lowPriorityRequests = Array.from(this.prefetchQueue.values())
      .filter(r => r.confidence >= CONFIDENCE_THRESHOLDS.LOW)
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const request of lowPriorityRequests.slice(0, 2)) {
      if (this.isIdle) {
        await this.processPrefetch(request);
      } else {
        break;
      }
    }
  }

  /**
   * Check if a completion is available in prefetch cache
   */
  async checkCache(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.InlineCompletion[] | null> {
    const context = this.extractContext(model, position);
    const requestId = this.generateRequestId(context, position);

    const cached = this.cache.get(requestId);
    if (cached) {
      this.stats.hits++;
      logger.debug(`[PredictivePrefetcher] Cache HIT for ${requestId}`);
      return cached.completions;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Extract context for a position
   */
  private extractContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): CodeContext {
    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.substring(0, position.column - 1);
    const startLine = Math.max(1, position.lineNumber - 10);

    const prefix = model.getValueInRange({
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    return {
      prefix,
      currentLine: textBeforeCursor,
      language: model.getLanguageId(),
      filePath: model.uri.toString(),
      lineNumber: position.lineNumber,
      column: position.column,
    };
  }

  /**
   * Generate unique ID for a request
   */
  private generateRequestId(context: CodeContext, position: monaco.Position): string {
    const contextHash = this.hashString(context.prefix.slice(-200));
    return `${context.language}:${position.lineNumber}:${position.column}:${contextHash}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Prune queue to maintain size limits
   */
  private pruneQueue(): void {
    const sortedQueue = Array.from(this.prefetchQueue.values())
      .sort((a, b) => a.confidence - b.confidence);

    // Remove lowest confidence items
    const toRemove = sortedQueue.slice(0, 5);
    for (const request of toRemove) {
      this.prefetchQueue.delete(request.id);
    }
  }

  /**
   * Update memory usage estimate
   */
  private updateMemoryUsage(): void {
    // Rough estimate of memory usage
    const cacheSize = this.cache.estimateMemoryUsage();
    const queueSize = this.prefetchQueue.size * 1024; // ~1KB per request
    this.memoryUsage = cacheSize + queueSize;
  }

  /**
   * Update statistics
   */
  private updateStats(latency: number): void {
    const alpha = 0.1; // Exponential moving average factor
    this.stats.avgLatency = this.stats.avgLatency * (1 - alpha) + latency * alpha;
    this.stats.accuracy = this.stats.hits / Math.max(1, this.stats.hits + this.stats.misses);
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(message: any): void {
    if (message.type === 'QUEUE_PROCESSED') {
      // Handle processed queue from worker
      logger.debug('[PredictivePrefetcher] Worker processed queue');
    }
  }

  /**
   * Learn from user behavior
   */
  learnFromAcceptance(
    position: monaco.Position,
    accepted: boolean,
    completionText: string
  ): void {
    this.patternLearner.recordBehavior({
      position,
      accepted,
      completionText,
      timestamp: Date.now(),
    });
  }

  /**
   * Get prefetcher statistics
   */
  getStats(): {
    cacheSize: number;
    queueSize: number;
    activeCount: number;
    hitRate: number;
    avgLatency: number;
    memoryUsageMB: number;
  } {
    return {
      cacheSize: this.cache.size(),
      queueSize: this.prefetchQueue.size,
      activeCount: this.activePrefetches.size,
      hitRate: this.stats.accuracy,
      avgLatency: Math.round(this.stats.avgLatency),
      memoryUsageMB: Math.round(this.memoryUsage / (1024 * 1024)),
    };
  }

  /**
   * Clear all caches and reset
   */
  clear(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
    this.activePrefetches.clear();
    this.memoryUsage = 0;
    logger.debug('[PredictivePrefetcher] Cleared all caches');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
    }
    this.clear();
  }
}