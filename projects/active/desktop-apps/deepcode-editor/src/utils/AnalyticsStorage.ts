/**
 * Analytics Storage Layer (IndexedDB)
 * Efficient storage for completion analytics with automatic pruning
 *
 * Based on 2025 best practices:
 * - Batched writes (80ms vs 2s for 1k items)
 * - Automatic data pruning (30 days, 10k events max)
 * - Indexed queries for fast filtering
 * - Privacy-first (100% local storage)
 */
import { logger } from '../services/Logger';

import type {
  CompletionEvent,
  SessionMetrics,
  AnalyticsConfig,
} from '../types/analytics';

const DB_NAME = 'DeepCodeAnalytics';
const DB_VERSION = 1;
const EVENTS_STORE = 'completionEvents';
const SESSIONS_STORE = 'sessionMetrics';

/**
 * Analytics Storage using IndexedDB
 */
export class AnalyticsStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  /**
   * Initialize IndexedDB
   */
  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.debug('✅ Analytics IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create completionEvents store
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const eventsStore = db.createObjectStore(EVENTS_STORE, {
            keyPath: 'id',
          });

          // Indexes for efficient queries
          eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventsStore.createIndex('language', 'language', { unique: false });
          eventsStore.createIndex('sessionId', 'sessionId', { unique: false });
          eventsStore.createIndex('eventType', 'eventType', { unique: false });
          eventsStore.createIndex('completionId', 'completionId', { unique: false });
        }

        // Create sessionMetrics store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
            keyPath: 'sessionId',
          });

          sessionsStore.createIndex('startTime', 'startTime', { unique: false });
          sessionsStore.createIndex('endTime', 'endTime', { unique: false });
        }

        logger.debug('📊 Analytics database schema created');
      };
    });
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Add events in batch (optimized)
   * Uses single transaction for all events (~80ms for 1k items)
   */
  async addEventsBatch(events: CompletionEvent[]): Promise<void> {
    await this.ensureInitialized();

    if (!this.db || events.length === 0) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);

      // Add all events in single transaction
      for (const event of events) {
        store.add(event);
      }

      transaction.oncomplete = () => {
        logger.debug(`✅ Batch added ${events.length} analytics events`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error('Failed to add events batch:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Add single event
   */
  async addEvent(event: CompletionEvent): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.add(event);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('Failed to add event:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get events by date range
   */
  async getEventsByDateRange(startTime: number, endTime: number): Promise<CompletionEvent[]> {
    await this.ensureInitialized();

    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startTime, endTime);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logger.error('Failed to get events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get events by language
   */
  async getEventsByLanguage(language: string): Promise<CompletionEvent[]> {
    await this.ensureInitialized();

    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('language');
      const request = index.getAll(language);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logger.error('Failed to get events by language:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all events (for export)
   */
  async getAllEvents(): Promise<CompletionEvent[]> {
    await this.ensureInitialized();

    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logger.error('Failed to get all events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Count total events
   */
  async getEventCount(): Promise<number> {
    await this.ensureInitialized();

    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logger.error('Failed to count events:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save session metrics
   */
  async saveSessionMetrics(metrics: SessionMetrics): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.put(metrics); // put = upsert

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('Failed to save session metrics:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(sessionId: string): Promise<SessionMetrics | null> {
    await this.ensureInitialized();

    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        logger.error('Failed to get session metrics:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Prune old data (automatic cleanup)
   * Keeps last 30 days or 10k events (whichever is less)
   */
  async pruneOldData(config: AnalyticsConfig): Promise<number> {
    await this.ensureInitialized();

    if (!this.db) return 0;

    const cutoffTime = Date.now() - config.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    // Delete old events
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        logger.debug(`🗑️ Pruned ${deletedCount} old events`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error('Failed to prune old data:', transaction.error);
        reject(transaction.error);
      };
    });

    // Check total count and delete oldest if over limit
    const totalCount = await this.getEventCount();
    if (totalCount > config.maxEvents) {
      const excess = totalCount - config.maxEvents;
      await this.deleteOldestEvents(excess);
      deletedCount += excess;
    }

    return deletedCount;
  }

  /**
   * Delete oldest events
   */
  private async deleteOldestEvents(count: number): Promise<void> {
    if (!this.db || count <= 0) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor();

      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && deleted < count) {
          cursor.delete();
          deleted++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        logger.debug(`🗑️ Deleted ${deleted} oldest events`);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE, SESSIONS_STORE], 'readwrite');

      transaction.objectStore(EVENTS_STORE).clear();
      transaction.objectStore(SESSIONS_STORE).clear();

      transaction.oncomplete = () => {
        logger.debug('🗑️ All analytics data cleared');
        resolve();
      };

      transaction.onerror = () => {
        logger.error('Failed to clear data:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ eventCount: number; sessionCount: number }> {
    await this.ensureInitialized();

    if (!this.db) return { eventCount: 0, sessionCount: 0 };

    const eventCount = await this.getEventCount();

    const sessionCount = await new Promise<number>((resolve) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    return { eventCount, sessionCount };
  }
}
