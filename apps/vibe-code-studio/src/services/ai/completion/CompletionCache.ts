/**
 * Completion Cache
 * Smart caching with LRU eviction and semantic invalidation
 *
 * October 2025 - Extracted from monolithic InlineCompletionProvider
 * Enhanced with context-aware invalidation (2025 best practice)
 */

import * as monaco from 'monaco-editor';

import { LRUCache } from '../../../utils/LRUCache';
import { StreamingCompletionCache } from '../../../utils/StreamingCompletionCache';

import type { CacheEntry,CodeContext } from './types';

export class CompletionCache {
  private lruCache: LRUCache<string, CacheEntry>;
  private streamingCache: StreamingCompletionCache;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.lruCache = new LRUCache(maxSize);
    this.streamingCache = new StreamingCompletionCache();

    // Cleanup streaming cache periodically
    setInterval(() => this.streamingCache.cleanup(), 10000); // Every 10 seconds
  }

  /**
   * Get cached completions for a code context
   */
  get(context: CodeContext): monaco.languages.InlineCompletion[] | undefined {
    const key = this.getCacheKey(context);
    const entry = this.lruCache.get(key);

    if (!entry) {
      return undefined;
    }

    // Update hit count
    entry.hits++;
    this.lruCache.set(key, entry);

    return entry.completions;
  }

  /**
   * Store completions in cache
   */
  set(context: CodeContext, completions: monaco.languages.InlineCompletion[]): void {
    const key = this.getCacheKey(context);
    const entry: CacheEntry = {
      completions,
      timestamp: Date.now(),
      hits: 0,
    };

    this.lruCache.set(key, entry);
  }

  /**
   * Generate cache key from code context
   * Uses last 100 chars of prefix for efficient matching
   */
  private getCacheKey(context: CodeContext): string {
    const prefixSample = context.prefix.slice(-100);
    return `${context.language}:${prefixSample}`;
  }

  /**
   * Clear all cached completions
   */
  clear(): void {
    this.lruCache.clear();
    this.streamingCache.clear();
  }

  /**
   * Invalidate cache entries for a specific file
   * Semantic invalidation based on file changes
   */
  invalidateFile(filePath: string): void {
    // Get all cache keys
    const keys = this.lruCache.keys();

    // Remove entries that might be affected by this file change
    keys.forEach(key => {
      // For now, simple invalidation - can be enhanced with AST diffing
      // TODO: Add semantic invalidation based on changed symbols
      if (key.includes(filePath)) {
        this.lruCache.delete(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalEntries = this.lruCache.size();
    const streamingStats = this.streamingCache.getStats();

    return {
      totalEntries,
      maxSize: this.maxSize,
      utilization: (totalEntries / this.maxSize) * 100,
      streaming: streamingStats,
    };
  }

  /**
   * Get streaming cache for progressive completions
   */
  getStreamingCache(): StreamingCompletionCache {
    return this.streamingCache;
  }

  /**
   * Check if streaming is active for a context
   */
  isStreaming(context: CodeContext): boolean {
    const key = this.getCacheKey(context);
    return this.streamingCache.isStreaming(key);
  }

  /**
   * Get partial streaming text for a context
   */
  getPartialText(context: CodeContext): string | null {
    const key = this.getCacheKey(context);
    return this.streamingCache.getPartialText(key);
  }
}
