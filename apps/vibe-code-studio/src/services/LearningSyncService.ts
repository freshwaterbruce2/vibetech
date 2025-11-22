/**
 * Learning Sync Service (Vibe Code Studio)
 *
 * Bridges Vibe's learning system with IPC Bridge for real-time sync to NOVA
 *
 * Features:
 * - Automatic sync when learning data changes
 * - Debounced sync to prevent flooding
 * - Error handling and retry logic
 * - Integration with IPC Store
 *
 * Usage:
 * - Call sync methods after logging to database
 * - Automatic batching and debouncing
 */

import { ipcClient } from './IPCClient';
import { logger } from './Logger';

export interface LearningDataPayload {
  id: string;
  type: 'mistake' | 'knowledge' | 'pattern';
  content: string;
  category?: string;
  tags?: string[];
  timestamp: number;
  metadata?: Record<string, any>;
}

class LearningSyncServiceClass {
  private syncQueue: LearningDataPayload[] = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private readonly SYNC_DEBOUNCE_MS = 1000; // Batch sync every 1 second
  private readonly MAX_QUEUE_SIZE = 50;

  /**
   * Queue learning data for sync to NOVA
   */
  public queueSync(data: LearningDataPayload): void {
    // Prevent queue from growing too large
    if (this.syncQueue.length >= this.MAX_QUEUE_SIZE) {
      logger.warn('[LearningSyncService] Queue full, syncing immediately');
      this.flush();
    }

    this.syncQueue.push(data);
    logger.debug(`[LearningSyncService] Queued learning data: ${data.type} (queue size: ${this.syncQueue.length})`);

    // Debounce sync
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.flush();
    }, this.SYNC_DEBOUNCE_MS);
  }

  /**
   * Sync a single learning item immediately
   */
  public async syncImmediate(data: LearningDataPayload): Promise<boolean> {
    try {
      if (!ipcClient.isConnected()) {
        logger.warn('[LearningSyncService] Not connected, queueing for later');
        this.queueSync(data);
        return false;
      }

      logger.debug('[LearningSyncService] Syncing learning data:', data.type);
      const success = ipcClient.sendLearningSync(data);

      if (success) {
        logger.info('[LearningSyncService] ✓ Learning data synced to NOVA');
        return true;
      } else {
        logger.error('[LearningSyncService] ✗ Sync failed');
        return false;
      }
    } catch (error) {
      logger.error('[LearningSyncService] Error syncing:', error);
      return false;
    }
  }

  /**
   * Flush queued learning data
   */
  public async flush(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    logger.info(`[LearningSyncService] Flushing ${this.syncQueue.length} items...`);

    const items = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of items) {
      await this.syncImmediate(item);
      // Small delay between items to prevent flooding
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Sync mistake to NOVA
   */
  public async syncMistake(
    mistakeId: number,
    description: string,
    mistakeType: string,
    severity: string,
    rootCause?: string,
    prevention?: string,
    tags?: string[]
  ): Promise<void> {
    const payload: LearningDataPayload = {
      id: `vibe-mistake-${mistakeId}`,
      type: 'mistake',
      content: description,
      category: mistakeType,
      tags: tags || [severity, 'mistake'],
      timestamp: Date.now(),
      metadata: {
        mistakeId,
        rootCause,
        prevention,
        severity,
        source: 'vibe'
      }
    };

    this.queueSync(payload);
    logger.info(`[LearningSyncService] Queued mistake sync: ${description.substring(0, 50)}...`);
  }

  /**
   * Sync knowledge entry to NOVA
   */
  public async syncKnowledge(
    knowledgeId: number,
    title: string,
    content: string,
    category?: string,
    tags?: string[]
  ): Promise<void> {
    const payload: LearningDataPayload = {
      id: `vibe-knowledge-${knowledgeId}`,
      type: 'knowledge',
      content: `${title}: ${content}`,
      category: category || 'general',
      tags: tags || [],
      timestamp: Date.now(),
      metadata: {
        knowledgeId,
        title,
        category,
        source: 'vibe'
      }
    };

    this.queueSync(payload);
    logger.info(`[LearningSyncService] Queued knowledge sync: ${title}`);
  }

  /**
   * Sync pattern to NOVA
   */
  public async syncPattern(
    pattern: string,
    frequency: number,
    successRate: number,
    context?: string[]
  ): Promise<void> {
    const payload: LearningDataPayload = {
      id: `vibe-pattern-${Date.now()}`,
      type: 'pattern',
      content: `Pattern: ${pattern} (${frequency} occurrences, ${Math.round(successRate * 100)}% success)`,
      category: 'pattern',
      tags: ['pattern', 'learning'],
      timestamp: Date.now(),
      metadata: {
        pattern,
        frequency,
        successRate,
        context: context?.slice(0, 3),
        source: 'vibe'
      }
    };

    this.queueSync(payload);
    logger.info(`[LearningSyncService] Queued pattern sync: ${pattern}`);
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): { queueSize: number; isConnected: boolean } {
    return {
      queueSize: this.syncQueue.length,
      isConnected: ipcClient.isConnected()
    };
  }

  /**
   * Clear sync queue
   */
  public clearQueue(): void {
    this.syncQueue = [];
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    logger.info('[LearningSyncService] Queue cleared');
  }
}

// Singleton instance
export const LearningSyncService = new LearningSyncServiceClass();

/**
 * Enhanced DatabaseService wrapper that adds IPC sync
 *
 * Usage: Wrap existing DatabaseService.logMistake() and addKnowledge() calls
 */
export class DatabaseServiceWithSync {
  constructor(private databaseService: any) {}

  /**
   * Log mistake with automatic IPC sync
   */
  async logMistake(mistake: any): Promise<number> {
    // Log to database first
    const mistakeId = await this.databaseService.logMistake(mistake);

    // Then sync to NOVA via IPC
    LearningSyncService.syncMistake(
      mistakeId,
      mistake.description,
      mistake.mistakeType,
      mistake.impactSeverity,
      mistake.rootCauseAnalysis,
      mistake.preventionStrategy,
      mistake.tags
    );

    return mistakeId;
  }

  /**
   * Add knowledge with automatic IPC sync
   */
  async addKnowledge(knowledge: any): Promise<number> {
    // Add to database first
    const knowledgeId = await this.databaseService.addKnowledge(knowledge);

    // Then sync to NOVA via IPC
    LearningSyncService.syncKnowledge(
      knowledgeId,
      knowledge.title,
      knowledge.content,
      knowledge.category,
      knowledge.tags
    );

    return knowledgeId;
  }

  // Proxy all other methods to original database service
  getMistakes(...args: any[]) {
    return this.databaseService.getMistakes(...args);
  }

  getKnowledge(...args: any[]) {
    return this.databaseService.getKnowledge(...args);
  }

  updateMistake(...args: any[]) {
    return this.databaseService.updateMistake(...args);
  }

  // Add other methods as needed
}

export default LearningSyncService;
