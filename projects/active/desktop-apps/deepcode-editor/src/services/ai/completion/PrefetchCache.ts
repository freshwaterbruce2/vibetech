/**
 * Prefetch Cache with Priority Queue
 * Intelligent caching system for predictive prefetching
 *
 * October 2025 - Week 4 Implementation
 * Features:
 * - LRU eviction with priority awareness
 * - Memory-aware caching
 * - TTL (time-to-live) support
 * - Priority-based retention
 */
import * as monaco from 'monaco-editor';

import { logger } from '../../../services/Logger';

interface CacheEntry {
  id: string;
  completions: monaco.languages.InlineCompletion[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  priority: number;
  size: number; // Estimated memory size in bytes
  ttl: number;  // Time-to-live in milliseconds
  model: string;
  latency: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  avgAccessTime: number;
}

export class PrefetchCache {
  private cache: Map<string, CacheEntry>;
  private accessOrder: string[];
  private maxSize: number;
  private maxMemory: number; // Max memory in bytes
  private currentMemory: number;
  private stats: CacheStats;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor(maxSize: number = 100, maxMemoryMB: number = 50) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    this.currentMemory = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      avgAccessTime: 0,
    };

    // Start cleanup interval
    this.startCleanupInterval();

    logger.debug(`[PrefetchCache] Initialized with ${maxSize} entries, ${maxMemoryMB}MB limit`);
  }

  /**
   * Set a cache entry
   */
  set(
    id: string,
    result: {
      requestId: string;
      completions: monaco.languages.InlineCompletion[];
      generatedAt: number;
      model: string;
      latency: number;
    }
  ): void {
    const size = this.estimateSize(result.completions);

    // Check if we need to evict entries
    while (this.shouldEvict(size)) {
      this.evictLRU();
    }

    // Create cache entry
    const entry: CacheEntry = {
      id,
      completions: result.completions,
      timestamp: result.generatedAt,
      accessCount: 0,
      lastAccessed: Date.now(),
      priority: this.calculatePriority(result),
      size,
      ttl: this.defaultTTL,
      model: result.model,
      latency: result.latency,
    };

    // Add to cache
    this.cache.set(id, entry);
    this.accessOrder.push(id);
    this.currentMemory += size;
    this.stats.entryCount++;
    this.stats.totalSize = this.currentMemory;

    logger.debug(`[PrefetchCache] Cached ${id}, size: ${size} bytes, total: ${this.currentMemory} bytes`);
  }

  /**
   * Get a cache entry
   */
  get(id: string): { completions: monaco.languages.InlineCompletion[] } | null {
    const entry = this.cache.get(id);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.remove(id);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(id);
    this.stats.hits++;

    // Update average access time
    const accessTime = Date.now() - entry.timestamp;
    this.stats.avgAccessTime = this.stats.avgAccessTime * 0.9 + accessTime * 0.1;

    return { completions: entry.completions };
  }

  /**
   * Check if cache has an entry
   */
  has(id: string): boolean {
    const entry = this.cache.get(id);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Remove a cache entry
   */
  private remove(id: string): void {
    const entry = this.cache.get(id);
    if (entry) {
      this.currentMemory -= entry.size;
      this.cache.delete(id);
      this.accessOrder = this.accessOrder.filter(i => i !== id);
      this.stats.entryCount--;
      this.stats.totalSize = this.currentMemory;
    }
  }

  /**
   * Check if we should evict entries
   */
  private shouldEvict(newSize: number): boolean {
    return (
      this.cache.size >= this.maxSize ||
      this.currentMemory + newSize > this.maxMemory
    );
  }

  /**
   * Evict least recently used entry with priority awareness
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {return;}

    // Find candidates for eviction (oldest 20%)
    const candidateCount = Math.max(1, Math.floor(this.accessOrder.length * 0.2));
    const candidates = this.accessOrder.slice(0, candidateCount);

    // Score candidates (lower score = better to evict)
    const scored = candidates.map(id => {
      const entry = this.cache.get(id);
      if (!entry) {return { id, score: 0 };}

      const age = Date.now() - entry.lastAccessed;
      const accessScore = Math.log(entry.accessCount + 1);
      const priorityScore = entry.priority * 10;
      const sizeScore = entry.size / this.maxMemory;

      // Combined score (higher = keep, lower = evict)
      const score = accessScore + priorityScore - (age / 1000000) - sizeScore;

      return { id, score };
    });

    // Evict lowest scored entry
    const toEvict = scored.reduce((min, curr) =>
      curr.score < min.score ? curr : min
    );

    this.remove(toEvict.id);
    this.stats.evictions++;

    logger.debug(`[PrefetchCache] Evicted ${toEvict.id}, score: ${toEvict.score}`);
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(id: string): void {
    const index = this.accessOrder.indexOf(id);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(id);
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate priority for a cache entry
   */
  private calculatePriority(result: any): number {
    let priority = 0.5; // Base priority

    // Boost for faster completions
    if (result.latency < 200) {priority += 0.2;}
    else if (result.latency < 500) {priority += 0.1;}

    // Boost for certain models
    if (result.model.includes('sonnet')) {priority += 0.2;}
    else if (result.model.includes('haiku')) {priority += 0.1;}

    // Boost for multi-line completions
    const lineCount = result.completions[0]?.insertText.toString().split('\n').length || 1;
    if (lineCount > 1) {priority += 0.1;}

    return Math.min(priority, 1.0);
  }

  /**
   * Estimate memory size of completions
   */
  private estimateSize(completions: monaco.languages.InlineCompletion[]): number {
    let size = 0;

    for (const completion of completions) {
      // Estimate string size (2 bytes per character in JavaScript)
      const text = completion.insertText.toString();
      size += text.length * 2;

      // Add overhead for object structure
      size += 100; // Rough estimate for object overhead
    }

    return size;
  }

  /**
   * Estimate total memory usage
   */
  estimateMemoryUsage(): number {
    return this.currentMemory;
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    let cleaned = 0;

    for (const [id, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.remove(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[PrefetchCache] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    hitRate: number;
    memoryUsageMB: number;
    avgEntrySize: number;
    oldestEntry: number;
  } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    let oldestEntry = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
    }

    return {
      ...this.stats,
      hitRate,
      memoryUsageMB: this.currentMemory / (1024 * 1024),
      avgEntrySize: this.stats.entryCount > 0
        ? this.currentMemory / this.stats.entryCount
        : 0,
      oldestEntry: Date.now() - oldestEntry,
    };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentMemory = 0;
    this.stats.entryCount = 0;
    this.stats.totalSize = 0;
    logger.debug('[PrefetchCache] Cleared all entries');
  }

  /**
   * Get top accessed entries
   */
  getTopEntries(count: number = 10): Array<{
    id: string;
    accessCount: number;
    priority: number;
    model: string;
    age: number;
  }> {
    return Array.from(this.cache.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, count)
      .map(([id, entry]) => ({
        id,
        accessCount: entry.accessCount,
        priority: entry.priority,
        model: entry.model,
        age: Date.now() - entry.timestamp,
      }));
  }

  /**
   * Optimize cache by removing low-value entries
   */
  optimize(): void {
    const entries = Array.from(this.cache.entries());

    // Calculate value score for each entry
    const scored = entries.map(([id, entry]) => {
      const ageScore = 1 / (1 + (Date.now() - entry.lastAccessed) / 3600000);
      const accessScore = Math.log(entry.accessCount + 1) / 10;
      const priorityScore = entry.priority;
      const sizeScore = 1 / (1 + entry.size / 10000);

      const value = (ageScore + accessScore + priorityScore + sizeScore) / 4;

      return { id, value, size: entry.size };
    });

    // Sort by value
    scored.sort((a, b) => b.value - a.value);

    // Keep top 80% by value
    const keepCount = Math.floor(scored.length * 0.8);
    const toRemove = scored.slice(keepCount);

    let removed = 0;
    for (const item of toRemove) {
      this.remove(item.id);
      removed++;
    }

    if (removed > 0) {
      logger.debug(`[PrefetchCache] Optimized: removed ${removed} low-value entries`);
    }
  }

  /**
   * Export cache metrics for analysis
   */
  exportMetrics(): {
    entries: Array<{
      id: string;
      accessCount: number;
      priority: number;
      size: number;
      age: number;
      model: string;
    }>;
    summary: {
      totalEntries: number;
      totalMemoryMB: number;
      avgAccessCount: number;
      avgPriority: number;
      hitRate: number;
    };
  } {
    const entries = Array.from(this.cache.entries()).map(([id, entry]) => ({
      id,
      accessCount: entry.accessCount,
      priority: entry.priority,
      size: entry.size,
      age: Date.now() - entry.timestamp,
      model: entry.model,
    }));

    const avgAccessCount = entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length || 0;
    const avgPriority = entries.reduce((sum, e) => sum + e.priority, 0) / entries.length || 0;

    return {
      entries,
      summary: {
        totalEntries: entries.length,
        totalMemoryMB: this.currentMemory / (1024 * 1024),
        avgAccessCount,
        avgPriority,
        hitRate: this.getStats().hitRate,
      },
    };
  }
}