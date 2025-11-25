/**
 * IPC Message Queue
 *
 * Manages offline message queueing when WebSocket is disconnected:
 * - Queue messages when offline
 * - Flush queue when connection restored
 * - Prevent queue overflow with max size limit
 * - FIFO message ordering
 */

import { logger } from '../Logger';

export interface QueuedMessage {
  data: string;
  timestamp: number;
}

export class IPCMessageQueue {
  private queue: QueuedMessage[] = [];

  constructor(private maxQueueSize: number = 100) {}

  /**
   * Add message to queue
   */
  public enqueue(data: string): void {
    // Prevent queue from growing too large
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn('[IPC MessageQueue] Queue full, dropping oldest message');
      this.queue.shift();
    }

    this.queue.push({
      data,
      timestamp: Date.now(),
    });

    logger.debug(`[IPC MessageQueue] Queued message (${this.queue.length} in queue)`);
  }

  /**
   * Get all messages and clear queue
   */
  public flush(): QueuedMessage[] {
    if (this.queue.length === 0) return [];

    logger.debug(`[IPC MessageQueue] Flushing ${this.queue.length} messages...`);

    const messages = [...this.queue];
    this.queue = [];
    return messages;
  }

  /**
   * Get queue size
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Clear all queued messages
   */
  public clear(): void {
    this.queue = [];
    logger.debug('[IPC MessageQueue] Queue cleared');
  }

  /**
   * Check if queue is empty
   */
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Check if queue is full
   */
  public isFull(): boolean {
    return this.queue.length >= this.maxQueueSize;
  }
}
