/**
 * LRU (Least Recently Used) Cache Implementation
 * Based on 2025 best practices for bounded memory usage
 *
 * Web search finding: Prevent memory leaks in long-running editor sessions
 * by using LRU cache with configurable size limit
 */

export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Get value from cache and mark as recently used
   * @returns value if found, undefined otherwise
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * Set value in cache and evict oldest if over limit
   */
  set(key: K, value: V): void {
    // Delete if exists (will re-add at end)
    this.cache.delete(key);

    // Add to end (most recently used)
    this.cache.set(key, value);

    // Evict oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Get all keys in cache (most recent last)
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in cache (most recent last)
   */
  values(): V[] {
    return Array.from(this.cache.values());
  }
}
