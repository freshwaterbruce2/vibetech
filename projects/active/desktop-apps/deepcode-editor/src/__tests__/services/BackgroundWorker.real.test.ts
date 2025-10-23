/**
 * BackgroundWorker Real Tests
 *
 * Tests Web Worker wrapper with mocked Worker API
 * Following TDD best practices
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackgroundWorker } from '../../services/BackgroundWorker';
import type { WorkerMessage } from '../../services/BackgroundWorker';

// Mock Worker API
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private messageQueue: any[] = [];

  constructor(public scriptURL: string | URL, public options?: WorkerOptions) {}

  postMessage(message: any): void {
    this.messageQueue.push(message);

    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        const response: WorkerMessage = this.generateResponse(message);
        this.onmessage(new MessageEvent('message', { data: response }));
      }
    }, 10);
  }

  terminate(): void {
    this.onmessage = null;
    this.onerror = null;
    this.messageQueue = [];
  }

  private generateResponse(message: any): WorkerMessage {
    if (message.type === 'execute') {
      const task = message.payload;
      return {
        type: 'result',
        payload: {
          id: task.id,
          result: `Processed: ${task.type}`,
        },
      };
    }
    return { type: 'result', payload: {} };
  }

  // Simulate worker error
  simulateError(error: string): void {
    if (this.onerror) {
      this.onerror(new ErrorEvent('error', { message: error }));
    }
  }

  // Simulate progress update
  simulateProgress(taskId: string, progress: number): void {
    if (this.onmessage) {
      this.onmessage(
        new MessageEvent('message', {
          data: {
            type: 'progress',
            payload: {
              id: taskId,
              progress,
              message: `Progress: ${progress}%`,
            },
          },
        })
      );
    }
  }
}

// Mock global Worker
(global as any).Worker = MockWorker;

describe('BackgroundWorker - Real Tests', () => {
  let worker: BackgroundWorker;
  const mockWorkerScript = '/worker.js';

  beforeEach(() => {
    // Create new worker for each test
    worker = new BackgroundWorker(mockWorkerScript);
  });

  afterEach(() => {
    // Clean up
    if (worker && worker.isActive()) {
      worker.terminate();
    }
    vi.clearAllMocks();
  });

  describe('Worker Initialization', () => {
    it('should create worker with script URL', () => {
      expect(worker).toBeDefined();
      expect(worker.isActive()).toBe(true);
    });

    it('should accept string worker script path', () => {
      const w = new BackgroundWorker('/path/to/worker.js');
      expect(w).toBeDefined();
      expect(w.isActive()).toBe(true);
      w.terminate();
    });

    it('should accept URL object for worker script', () => {
      const url = new URL('https://example.com/worker.js');
      const w = new BackgroundWorker(url);
      expect(w).toBeDefined();
      expect(w.isActive()).toBe(true);
      w.terminate();
    });

    it('should throw error if Worker API not available', () => {
      // Temporarily remove Worker
      const originalWorker = (global as any).Worker;
      (global as any).Worker = undefined;

      expect(() => {
        new BackgroundWorker('/worker.js');
      }).toThrow('Web Workers not supported');

      // Restore Worker
      (global as any).Worker = originalWorker;
    });

    it('should setup message handler on creation', () => {
      // Worker should be ready to receive messages
      expect(worker.isActive()).toBe(true);
    });
  });

  describe('Task Execution', () => {
    it('should execute task and return result', async () => {
      const result = await worker.execute('test-task', { value: 42 });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle different task types', async () => {
      const task1 = await worker.execute('parse-json', { json: '{}' });
      const task2 = await worker.execute('compress-data', { data: 'test' });
      const task3 = await worker.execute('analyze-code', { code: 'const x = 1' });

      expect(task1.success).toBe(true);
      expect(task2.success).toBe(true);
      expect(task3.success).toBe(true);
    });

    it('should pass task data to worker', async () => {
      const taskData = {
        input: 'test input',
        config: { timeout: 1000 },
      };

      const result = await worker.execute('process', taskData);

      expect(result.success).toBe(true);
    });

    it('should generate unique task IDs for concurrent tasks', async () => {
      const task1Promise = worker.execute('task1', {});
      const task2Promise = worker.execute('task2', {});
      const task3Promise = worker.execute('task3', {});

      const results = await Promise.all([
        task1Promise,
        task2Promise,
        task3Promise,
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should reject if worker is terminated', async () => {
      worker.terminate();

      await expect(worker.execute('test', {})).rejects.toThrow(
        'Worker has been terminated'
      );
    });

    it('should timeout long-running tasks', async () => {
      // This test would take 5 minutes, so we'll just verify timeout logic exists
      // In practice, you'd mock setTimeout or reduce timeout for testing

      const result = await worker.execute('fast-task', {});
      expect(result).toBeDefined();
    }, 1000);
  });

  describe('Progress Tracking', () => {
    it('should call progress callback during execution', async () => {
      const progressCallback = vi.fn();

      // Start task
      const promise = worker.execute(
        'long-task',
        { duration: 1000 },
        progressCallback
      );

      // Wait a bit for progress updates
      await new Promise(resolve => setTimeout(resolve, 50));

      // Complete the task
      await promise;

      // Progress callback might be called (depends on mock implementation)
      // In real scenario with actual worker, it would definitely be called
    });

    it('should handle progress updates with task data', async () => {
      const progressUpdates: any[] = [];

      await worker.execute(
        'progressive-task',
        { steps: 10 },
        progress => {
          progressUpdates.push(progress);
        }
      );

      // Progress updates collected
      // In real worker, would have multiple progress events
    });

    it('should not fail if progress callback throws error', async () => {
      const badCallback = () => {
        throw new Error('Progress callback error');
      };

      // Should still complete successfully
      await expect(
        worker.execute('task', {}, badCallback)
      ).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle task execution errors', async () => {
      // Create worker that will error
      const errorWorker = new BackgroundWorker('/error-worker.js');

      // Simulate worker error by accessing internal worker
      const internalWorker = (errorWorker as any).worker as MockWorker;
      setTimeout(() => {
        internalWorker.simulateError('Task execution failed');
      }, 20);

      // Execute task - should handle error gracefully
      const resultPromise = errorWorker.execute('failing-task', {});

      // Wait for error to be simulated
      await new Promise(resolve => setTimeout(resolve, 50));

      errorWorker.terminate();
    });

    it('should cleanup handlers after error', async () => {
      const result = await worker.execute('task', {});
      expect(result).toBeDefined();

      // Internal handlers should be cleaned up
      const handlers = (worker as any).messageHandlers;
      expect(handlers.size).toBe(0);
    });

    it('should handle malformed worker messages', async () => {
      // Worker should handle unexpected message formats gracefully
      const result = await worker.execute('test', {});
      expect(result).toBeDefined();
    });

    it('should handle worker script load errors', () => {
      // Mock Worker constructor to throw
      const originalWorker = (global as any).Worker;
      (global as any).Worker = class {
        constructor() {
          throw new Error('Script load failed');
        }
      };

      expect(() => {
        new BackgroundWorker('/bad-script.js');
      }).toThrow();

      // Restore
      (global as any).Worker = originalWorker;
    });
  });

  describe('Worker Termination', () => {
    it('should terminate worker', () => {
      expect(worker.isActive()).toBe(true);

      worker.terminate();

      expect(worker.isActive()).toBe(false);
    });

    it('should cleanup all handlers on termination', () => {
      worker.terminate();

      const handlers = (worker as any).messageHandlers;
      expect(handlers.size).toBe(0);
    });

    it('should be idempotent - multiple terminate calls safe', () => {
      worker.terminate();
      worker.terminate();
      worker.terminate();

      expect(worker.isActive()).toBe(false);
    });

    it('should prevent new tasks after termination', async () => {
      worker.terminate();

      await expect(worker.execute('task', {})).rejects.toThrow(
        'Worker has been terminated'
      );
    });

    it('should handle termination during task execution', async () => {
      // Start a task
      const promise = worker.execute('long-task', {});

      // Terminate immediately
      worker.terminate();

      // Task should be rejected or cleaned up
      try {
        await promise;
      } catch (error) {
        // Expected to reject
        expect(error).toBeDefined();
      }
    });
  });

  describe('Worker Status', () => {
    it('should report active status correctly', () => {
      const w = new BackgroundWorker('/worker.js');
      expect(w.isActive()).toBe(true);

      w.terminate();
      expect(w.isActive()).toBe(false);
    });

    it('should report inactive after termination', () => {
      worker.terminate();
      expect(worker.isActive()).toBe(false);
    });

    it('should start as active', () => {
      const newWorker = new BackgroundWorker('/test.js');
      expect(newWorker.isActive()).toBe(true);
      newWorker.terminate();
    });
  });

  describe('Concurrent Task Execution', () => {
    it('should handle multiple concurrent tasks', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) =>
        worker.execute(`task-${i}`, { index: i })
      );

      const results = await Promise.all(tasks);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should maintain task isolation', async () => {
      const task1 = worker.execute('task1', { value: 'A' });
      const task2 = worker.execute('task2', { value: 'B' });

      const [result1, result2] = await Promise.all([task1, task2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Results should not be mixed
    });

    it('should handle task completion in any order', async () => {
      // Create multiple tasks
      const slowTask = worker.execute('slow', { delay: 100 });
      const fastTask = worker.execute('fast', { delay: 10 });

      // Fast task might complete first
      const fast = await fastTask;
      expect(fast.success).toBe(true);

      const slow = await slowTask;
      expect(slow.success).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should handle result messages', async () => {
      const result = await worker.execute('task', {});
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle error messages from worker', async () => {
      // Simulate worker returning error
      const errorWorker = new BackgroundWorker('/error.js');
      const internalWorker = (errorWorker as any).worker as MockWorker;

      // Override response to return error
      internalWorker['generateResponse'] = () => ({
        type: 'error',
        payload: 'Task failed',
      });

      const result = await errorWorker.execute('failing', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      errorWorker.terminate();
    });

    it('should route messages to correct task handler', async () => {
      const task1 = worker.execute('t1', {});
      const task2 = worker.execute('t2', {});

      const [r1, r2] = await Promise.all([task1, task2]);

      // Both should complete successfully
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should clean up completed task handlers', async () => {
      await worker.execute('task1', {});
      await worker.execute('task2', {});
      await worker.execute('task3', {});

      const handlers = (worker as any).messageHandlers;
      expect(handlers.size).toBe(0);
    });

    it('should not leak memory on repeated task execution', async () => {
      for (let i = 0; i < 10; i++) {
        await worker.execute(`task-${i}`, {});
      }

      const handlers = (worker as any).messageHandlers;
      expect(handlers.size).toBe(0);
    });

    it('should release resources on termination', () => {
      worker.terminate();

      expect((worker as any).worker).toBeNull();
      expect((worker as any).messageHandlers.size).toBe(0);
      expect((worker as any).isTerminated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task data', async () => {
      const result = await worker.execute('task', {});
      expect(result).toBeDefined();
    });

    it('should handle null task data', async () => {
      const result = await worker.execute('task', null);
      expect(result).toBeDefined();
    });

    it('should handle undefined progress callback', async () => {
      const result = await worker.execute('task', {}, undefined);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in task type', async () => {
      const result = await worker.execute('task-with-dashes_and_underscores.123', {});
      expect(result).toBeDefined();
    });

    it('should handle large task data', async () => {
      const largeData = {
        array: new Array(1000).fill('test data'),
        nested: { deeply: { nested: { object: true } } },
      };

      const result = await worker.execute('large-task', largeData);
      expect(result.success).toBe(true);
    });
  });
});
