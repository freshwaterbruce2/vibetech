/**
 * BackgroundWorker - Web Worker wrapper for CPU-intensive tasks
 * Provides a clean API for offloading work to background threads
 */
import { logger } from '../services/Logger';
import { TaskProgress,TaskResult } from '@vibetech/types/tasks';

export interface WorkerMessage {
  type: 'execute' | 'progress' | 'result' | 'error' | 'terminate';
  payload?: any;
}

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
}

export class BackgroundWorker {
  private worker: Worker | null = null;
  private messageHandlers: Map<string, (message: WorkerMessage) => void> = new Map();
  private isTerminated: boolean = false;

  constructor(workerScript: string | URL) {
    try {
      this.worker = new Worker(workerScript, { type: 'module' });
      this.setupMessageHandler();
    } catch (error) {
      logger.error('Failed to create worker:', error);
      throw new Error('Web Workers not supported or worker script not found');
    }
  }

  /**
   * Execute a task in the background worker
   */
  async execute<T = any>(
    taskType: string,
    data: any,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<TaskResult> {
    if (this.isTerminated) {
      throw new Error('Worker has been terminated');
    }

    return new Promise((resolve, reject) => {
      const taskId = this.generateId();

      // Set up message handler for this task
      const handleMessage = (message: WorkerMessage) => {
        switch (message.type) {
          case 'progress':
            if (onProgress && message.payload) {
              onProgress(message.payload);
            }
            break;

          case 'result':
            this.messageHandlers.delete(taskId);
            resolve({
              success: true,
              data: message.payload,
            });
            break;

          case 'error':
            this.messageHandlers.delete(taskId);
            resolve({
              success: false,
              error: message.payload || 'Unknown worker error',
            });
            break;
        }
      };

      this.messageHandlers.set(taskId, handleMessage);

      // Send task to worker
      const task: WorkerTask = { id: taskId, type: taskType, data };
      this.postMessage({ type: 'execute', payload: task });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.messageHandlers.has(taskId)) {
          this.messageHandlers.delete(taskId);
          reject(new Error('Task execution timeout'));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker && !this.isTerminated) {
      this.worker.terminate();
      this.worker = null;
      this.isTerminated = true;
      this.messageHandlers.clear();
    }
  }

  /**
   * Check if worker is active
   */
  isActive(): boolean {
    return this.worker !== null && !this.isTerminated;
  }

  // --- Private Methods ---

  private setupMessageHandler(): void {
    if (!this.worker) {return;}

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      // Find handler by task ID (if available)
      if (message.payload?.id) {
        const handler = this.messageHandlers.get(message.payload.id);
        if (handler) {
          handler(message);
        }
      }
    };

    this.worker.onerror = (error: ErrorEvent) => {
      logger.error('Worker error:', error);

      // Notify all pending handlers
      this.messageHandlers.forEach((handler) => {
        handler({
          type: 'error',
          payload: error.message || 'Worker error',
        });
      });

      this.messageHandlers.clear();
    };
  }

  private postMessage(message: WorkerMessage): void {
    if (this.worker && !this.isTerminated) {
      this.worker.postMessage(message);
    }
  }

  private generateId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * BackgroundWorkerPool - Manages multiple workers for parallel execution
 */
export class BackgroundWorkerPool {
  private workers: BackgroundWorker[] = [];
  private availableWorkers: BackgroundWorker[] = [];
  private workerScript: string | URL;
  private poolSize: number;

  constructor(workerScript: string | URL, poolSize: number = 3) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.initializePool();
  }

  /**
   * Execute a task using an available worker from the pool
   */
  async execute<T = any>(
    taskType: string,
    data: any,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<TaskResult> {
    const worker = await this.getAvailableWorker();

    try {
      const result = await worker.execute<T>(taskType, data, onProgress);
      this.releaseWorker(worker);
      return result;
    } catch (error) {
      this.releaseWorker(worker);
      throw error;
    }
  }

  /**
   * Terminate all workers in the pool
   */
  terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
    };
  }

  // --- Private Methods ---

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new BackgroundWorker(this.workerScript);
        this.workers.push(worker);
        this.availableWorkers.push(worker);
      } catch (error) {
        logger.error(`Failed to create worker ${i}:`, error);
      }
    }
  }

  private async getAvailableWorker(): Promise<BackgroundWorker> {
    // Wait for an available worker
    while (this.availableWorkers.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const worker = this.availableWorkers.shift();
    if (!worker) {
      throw new Error('No workers available');
    }

    return worker;
  }

  private releaseWorker(worker: BackgroundWorker): void {
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }
  }
}
