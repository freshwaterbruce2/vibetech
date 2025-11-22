/**
 * Streaming Completion Cache
 * Handles progressive display of AI-generated completions
 *
 * Architecture:
 * - Cache partial results as streaming chunks arrive
 * - Trigger Monaco re-fetch when significant progress made
 * - Fall back to complete results if streaming fails
 *
 * Based on 2025 best practices:
 * - Target <100ms to first characters
 * - Progressive updates every 50-100ms
 * - Graceful fallback to non-streaming
 */

export interface StreamingCompletion {
  key: string;
  partialText: string;
  isComplete: boolean;
  timestamp: number;
  lastUpdate: number;
}

export class StreamingCompletionCache {
  private activeStreams: Map<string, StreamingCompletion>;
  private updateCallbacks: Map<string, () => void>;
  private readonly MIN_UPDATE_INTERVAL = 50; // ms between updates (20 FPS)
  private readonly MAX_CACHE_AGE = 5000; // 5 seconds

  constructor() {
    this.activeStreams = new Map();
    this.updateCallbacks = new Map();
  }

  /**
   * Start a new streaming completion
   */
  startStreaming(key: string, onUpdate: () => void): void {
    this.activeStreams.set(key, {
      key,
      partialText: '',
      isComplete: false,
      timestamp: Date.now(),
      lastUpdate: Date.now(),
    });
    this.updateCallbacks.set(key, onUpdate);
  }

  /**
   * Append chunk to streaming completion
   * Triggers update callback if enough time has passed
   */
  appendChunk(key: string, chunk: string): void {
    const stream = this.activeStreams.get(key);
    if (!stream) {return;}

    stream.partialText += chunk;

    const now = Date.now();
    const timeSinceLastUpdate = now - stream.lastUpdate;

    // Trigger update if enough time has passed or if we have a complete line
    if (timeSinceLastUpdate >= this.MIN_UPDATE_INTERVAL || chunk.includes('\n')) {
      stream.lastUpdate = now;
      const callback = this.updateCallbacks.get(key);
      if (callback) {
        // Defer callback to avoid blocking streaming
        setTimeout(callback, 0);
      }
    }
  }

  /**
   * Mark streaming as complete
   */
  completeStreaming(key: string): void {
    const stream = this.activeStreams.get(key);
    if (!stream) {return;}

    stream.isComplete = true;

    // Trigger final update
    const callback = this.updateCallbacks.get(key);
    if (callback) {
      setTimeout(callback, 0);
    }
  }

  /**
   * Get current partial text
   */
  getPartialText(key: string): string | null {
    const stream = this.activeStreams.get(key);
    return stream ? stream.partialText : null;
  }

  /**
   * Check if streaming is complete
   */
  isComplete(key: string): boolean {
    const stream = this.activeStreams.get(key);
    return stream ? stream.isComplete : false;
  }

  /**
   * Check if streaming is active
   */
  isStreaming(key: string): boolean {
    const stream = this.activeStreams.get(key);
    if (!stream) {return false;}

    // Check if stream is stale (older than MAX_CACHE_AGE)
    const age = Date.now() - stream.timestamp;
    return !stream.isComplete && age < this.MAX_CACHE_AGE;
  }

  /**
   * Cancel and remove streaming completion
   */
  cancelStreaming(key: string): void {
    this.activeStreams.delete(key);
    this.updateCallbacks.delete(key);
  }

  /**
   * Clear old/stale streams
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, stream] of this.activeStreams.entries()) {
      const age = now - stream.timestamp;
      if (stream.isComplete || age > this.MAX_CACHE_AGE) {
        this.activeStreams.delete(key);
        this.updateCallbacks.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const streams = Array.from(this.activeStreams.values());
    return {
      totalStreams: streams.length,
      activeStreams: streams.filter(s => !s.isComplete).length,
      completeStreams: streams.filter(s => s.isComplete).length,
      averageLength: streams.length > 0
        ? streams.reduce((sum, s) => sum + s.partialText.length, 0) / streams.length
        : 0,
    };
  }

  /**
   * Clear all streams
   */
  clear(): void {
    this.activeStreams.clear();
    this.updateCallbacks.clear();
  }
}
