/**
 * TaskHistoryService
 *
 * Manages task history persistence using IndexedDB.
 * Stores completed tasks for future reference, search, and re-execution.
 */
import { logger } from '../services/Logger';

import type { AgentTask } from '../types';

const DB_NAME = 'VibeCodeStudio_AgentMode';
const DB_VERSION = 1;
const STORE_NAME = 'taskHistory';
const MAX_HISTORY_SIZE = 100; // Keep last 100 tasks

export interface TaskHistoryEntry {
  task: AgentTask;
  timestamp: Date;
  executionTimeMs?: number;
  success: boolean;
  error?: string;
}

export interface TaskHistoryFilter {
  startDate?: Date;
  endDate?: Date;
  status?: AgentTask['status'];
  searchQuery?: string;
  limit?: number;
}

export class TaskHistoryService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'task.id',
          });

          // Create indexes for efficient querying
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('status', 'task.status', { unique: false });
          objectStore.createIndex('success', 'success', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureDB(): Promise<IDBDatabase> {
    await this.initPromise;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save a task to history
   */
  async saveTask(entry: TaskHistoryEntry): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Convert Date to ISO string for storage
      const storageEntry = {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      };

      const request = store.put(storageEntry);

      request.onsuccess = () => {
        // Clean up old entries if history exceeds max size
        this.cleanupOldEntries().catch(console.error);
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to save task:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all tasks from history
   */
  async getAllTasks(): Promise<TaskHistoryEntry[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      // Get all entries sorted by timestamp (newest first)
      const request = index.openCursor(null, 'prev');
      const entries: TaskHistoryEntry[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          // Convert ISO string back to Date
          entries.push({
            ...entry,
            timestamp: new Date(entry.timestamp),
          });
          cursor.continue();
        } else {
          resolve(entries);
        }
      };

      request.onerror = () => {
        logger.error('Failed to get all tasks:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get tasks with filters
   */
  async getFilteredTasks(filter: TaskHistoryFilter): Promise<TaskHistoryEntry[]> {
    let tasks = await this.getAllTasks();

    // Apply filters
    if (filter.startDate) {
      tasks = tasks.filter((t) => t.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      tasks = tasks.filter((t) => t.timestamp <= filter.endDate!);
    }

    if (filter.status) {
      tasks = tasks.filter((t) => t.task.status === filter.status);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.task.title.toLowerCase().includes(query) ||
          t.task.description.toLowerCase().includes(query) ||
          t.task.userRequest?.toLowerCase().includes(query)
      );
    }

    // Apply limit
    if (filter.limit && filter.limit > 0) {
      tasks = tasks.slice(0, filter.limit);
    }

    return tasks;
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(taskId: string): Promise<TaskHistoryEntry | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(taskId);

      request.onsuccess = () => {
        if (request.result) {
          const entry = request.result;
          resolve({
            ...entry,
            timestamp: new Date(entry.timestamp),
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        logger.error('Failed to get task by ID:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a task from history
   */
  async deleteTask(taskId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(taskId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('Failed to delete task:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all task history
   */
  async clearAllTasks(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('Failed to clear tasks:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get task statistics
   */
  async getStatistics(): Promise<{
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
  }> {
    const tasks = await this.getAllTasks();

    const totalTasks = tasks.length;
    const successfulTasks = tasks.filter((t) => t.success).length;
    const failedTasks = totalTasks - successfulTasks;

    const executionTimes = tasks
      .filter((t) => t.executionTimeMs !== undefined)
      .map((t) => t.executionTimeMs!);

    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
        : 0;

    return {
      totalTasks,
      successfulTasks,
      failedTasks,
      averageExecutionTime,
    };
  }

  /**
   * Clean up old entries to maintain max history size
   */
  private async cleanupOldEntries(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      // Get all entries sorted by timestamp (oldest first)
      const request = index.openCursor(null, 'next');
      const entriesToDelete: string[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          count++;
          // Mark old entries for deletion if we exceed max size
          if (count > MAX_HISTORY_SIZE) {
            entriesToDelete.push(cursor.value.task.id);
          }
          cursor.continue();
        } else {
          // Delete marked entries
          entriesToDelete.forEach((id) => {
            store.delete(id);
          });
          resolve();
        }
      };

      request.onerror = () => {
        logger.error('Failed to cleanup old entries:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Export task history as JSON
   */
  async exportHistory(): Promise<string> {
    const tasks = await this.getAllTasks();
    return JSON.stringify(tasks, null, 2);
  }

  /**
   * Import task history from JSON
   */
  async importHistory(jsonData: string): Promise<void> {
    const entries: TaskHistoryEntry[] = JSON.parse(jsonData);

    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      const total = entries.length;

      entries.forEach((entry) => {
        const storageEntry = {
          ...entry,
          timestamp:
            typeof entry.timestamp === 'string'
              ? entry.timestamp
              : entry.timestamp.toISOString(),
        };

        const request = store.put(storageEntry);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => {
          logger.error('Failed to import entry:', request.error);
          reject(request.error);
        };
      });
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
