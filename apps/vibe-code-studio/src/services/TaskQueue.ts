/**
 * TaskQueue - Priority-based background task queue
 * Manages task execution with priority ordering and concurrency control
 */
import {
  BackgroundTask,
  TaskExecutor,
  TaskFilter,
  TaskNotification,
  TaskPriority,
  TaskQueueOptions,
  TaskStats,
  TaskStatus,
  TaskType,
} from '@vibetech/types/tasks';

import { logger } from '../services/Logger';

const DEFAULT_OPTIONS: TaskQueueOptions = {
  maxConcurrentTasks: 3,
  maxQueueSize: 100,
  enablePersistence: true,
  retryFailedTasks: true,
  maxRetries: 3,
};

export class TaskQueue {
  private tasks: Map<string, BackgroundTask> = new Map();
  private executors: Map<TaskType, TaskExecutor> = new Map();
  private runningTasks: Set<string> = new Set();
  private listeners: Set<(notification: TaskNotification) => void> = new Set();
  private options: TaskQueueOptions;
  private processingInterval: NodeJS.Timeout | null = null;
  private taskHistory: BackgroundTask[] = [];

  constructor(options: Partial<TaskQueueOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (this.options.enablePersistence) {
      this.loadFromStorage();
    }

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Register a task executor for a specific task type
   */
  registerExecutor(type: TaskType, executor: TaskExecutor): void {
    this.executors.set(type, executor);
  }

  /**
   * Add a task to the queue
   */
  addTask(
    type: TaskType,
    name: string,
    options: {
      description?: string;
      priority?: TaskPriority;
      cancelable?: boolean;
      pausable?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    if (this.tasks.size >= this.options.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    const task: BackgroundTask = {
      id: this.generateId(),
      type,
      name,
      ...(options.description ? { description: options.description } : {}),
      priority: options.priority ?? TaskPriority.NORMAL,
      status: TaskStatus.QUEUED,
      progress: { current: 0, total: 100, percentage: 0 },
      createdAt: new Date(),
      cancelable: options.cancelable ?? true,
      pausable: options.pausable ?? true,
      retryCount: 0,
      maxRetries: this.options.maxRetries,
      ...(options.metadata ? { metadata: options.metadata } : {}),
    };

    this.tasks.set(task.id, task);
    this.notify({
      taskId: task.id,
      taskName: task.name,
      type: 'started',
      message: `Task "${task.name}" queued`,
      timestamp: new Date(),
      showToast: false,
    });

    this.persistState();
    return task.id;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) { return false; }

    if (!task.cancelable) {
      throw new Error('Task is not cancelable');
    }

    if (task.status === TaskStatus.RUNNING) {
      const executor = this.executors.get(task.type);
      if (executor?.cancel) {
        await executor.cancel(task);
      }
      this.runningTasks.delete(taskId);
    }

    task.status = TaskStatus.CANCELED;
    task.completedAt = new Date();

    this.notify({
      taskId: task.id,
      taskName: task.name,
      type: 'canceled',
      message: `Task "${task.name}" was canceled`,
      timestamp: new Date(),
      showToast: true,
    });

    this.persistState();
    this.moveToHistory(task);
    return true;
  }

  /**
   * Pause a running task
   */
  async pauseTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== TaskStatus.RUNNING) { return false; }

    if (!task.pausable) {
      throw new Error('Task is not pausable');
    }

    const executor = this.executors.get(task.type);
    if (executor?.pause) {
      await executor.pause(task);
    }

    task.status = TaskStatus.PAUSED;
    this.runningTasks.delete(taskId);

    this.notify({
      taskId: task.id,
      taskName: task.name,
      type: 'progress',
      message: `Task "${task.name}" paused`,
      timestamp: new Date(),
      showToast: false,
    });

    this.persistState();
    return true;
  }

  /**
   * Resume a paused task
   */
  async resumeTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== TaskStatus.PAUSED) { return false; }

    task.status = TaskStatus.QUEUED;

    this.notify({
      taskId: task.id,
      taskName: task.name,
      type: 'progress',
      message: `Task "${task.name}" resumed`,
      timestamp: new Date(),
      showToast: false,
    });

    this.persistState();
    return true;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks (with optional filter)
   */
  getTasks(filter?: TaskFilter): BackgroundTask[] {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status) {
        tasks = tasks.filter((t) => filter.status!.includes(t.status));
      }
      if (filter.type) {
        tasks = tasks.filter((t) => filter.type!.includes(t.type));
      }
      if (filter.priority) {
        tasks = tasks.filter((t) => filter.priority!.includes(t.priority));
      }
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.name.toLowerCase().includes(term) ||
            t.description?.toLowerCase().includes(term)
        );
      }
    }

    return tasks;
  }

  /**
   * Get queue statistics
   */
  getStats(): TaskStats {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = [...this.taskHistory, ...tasks.filter(t => t.status === TaskStatus.COMPLETED)];

    const completionTimes = completedTasks
      .filter((t) => t.startedAt && t.completedAt)
      .map((t) => t.completedAt!.getTime() - t.startedAt!.getTime());

    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    return {
      total: tasks.length,
      queued: tasks.filter((t) => t.status === TaskStatus.QUEUED).length,
      running: tasks.filter((t) => t.status === TaskStatus.RUNNING).length,
      completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter((t) => t.status === TaskStatus.FAILED).length,
      canceled: tasks.filter((t) => t.status === TaskStatus.CANCELED).length,
      averageCompletionTime,
    };
  }

  /**
   * Subscribe to task notifications
   */
  subscribe(listener: (notification: TaskNotification) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): void {
    const completedIds: string[] = [];

    this.tasks.forEach((task, id) => {
      if (task.status === TaskStatus.COMPLETED) {
        this.moveToHistory(task);
        completedIds.push(id);
      }
    });

    completedIds.forEach((id) => this.tasks.delete(id));
    this.persistState();
  }

  /**
   * Clear all tasks
   */
  clearAll(): void {
    this.tasks.forEach((task) => {
      if (task.status === TaskStatus.RUNNING) {
        this.cancelTask(task.id);
      }
    });
    this.tasks.clear();
    this.persistState();
  }

  /**
   * Get task history
   */
  getHistory(limit: number = 50): BackgroundTask[] {
    return this.taskHistory.slice(0, limit);
  }

  /**
   * Destroy the queue
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.clearAll();
    this.listeners.clear();
  }

  // --- Private Methods ---

  private startProcessing(): void {
    // Process queue every 500ms
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 500);
  }

  private async processQueue(): Promise<void> {
    // Check if we can run more tasks
    if (this.runningTasks.size >= this.options.maxConcurrentTasks) {
      return;
    }

    // Get next task by priority
    const nextTask = this.getNextTask();
    if (!nextTask) { return; }

    // Execute task
    await this.executeTask(nextTask);
  }

  private getNextTask(): BackgroundTask | null {
    const queuedTasks = Array.from(this.tasks.values())
      .filter((t) => t.status === TaskStatus.QUEUED)
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation time (earlier first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return queuedTasks[0] || null;
  }

  private async executeTask(task: BackgroundTask): Promise<void> {
    const executor = this.executors.get(task.type);
    if (!executor) {
      task.status = TaskStatus.FAILED;
      task.result = {
        success: false,
        error: `No executor registered for task type: ${task.type}`,
      };
      this.moveToHistory(task);
      return;
    }

    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();
    this.runningTasks.add(task.id);

    this.notify({
      taskId: task.id,
      taskName: task.name,
      type: 'started',
      message: `Task "${task.name}" started`,
      timestamp: new Date(),
      showToast: false,
    });

    try {
      const result = await executor.execute(task, (progress) => {
        task.progress = progress;
        this.notify({
          taskId: task.id,
          taskName: task.name,
          type: 'progress',
          message: progress.message || `${progress.percentage}% complete`,
          timestamp: new Date(),
          showToast: false,
        });
        this.persistState();
      });

      task.result = result;
      task.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
      task.completedAt = new Date();

      this.notify({
        taskId: task.id,
        taskName: task.name,
        type: result.success ? 'completed' : 'failed',
        message: result.success
          ? `Task "${task.name}" completed successfully`
          : `Task "${task.name}" failed: ${result.error}`,
        timestamp: new Date(),
        showToast: true,
      });

      this.runningTasks.delete(task.id);
      this.moveToHistory(task);
      this.persistState();
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      task.completedAt = new Date();

      // Retry if enabled and under max retries
      if (
        this.options.retryFailedTasks &&
        task.retryCount < task.maxRetries
      ) {
        task.retryCount++;
        task.status = TaskStatus.QUEUED;
        delete task.startedAt;
        delete task.completedAt;

        this.notify({
          taskId: task.id,
          taskName: task.name,
          type: 'progress',
          message: `Task "${task.name}" failed, retrying (${task.retryCount}/${task.maxRetries})`,
          timestamp: new Date(),
          showToast: false,
        });
      } else {
        this.notify({
          taskId: task.id,
          taskName: task.name,
          type: 'failed',
          message: `Task "${task.name}" failed: ${task.result.error}`,
          timestamp: new Date(),
          showToast: true,
        });

        this.moveToHistory(task);
      }

      this.runningTasks.delete(task.id);
      this.persistState();
    }
  }

  private notify(notification: TaskNotification): void {
    this.listeners.forEach((listener) => listener(notification));
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private moveToHistory(task: BackgroundTask): void {
    this.taskHistory.unshift(task);
    if (this.taskHistory.length > 100) {
      this.taskHistory = this.taskHistory.slice(0, 100);
    }
    this.tasks.delete(task.id);
  }

  private persistState(): void {
    if (!this.options.enablePersistence) { return; }

    try {
      const state = {
        tasks: Array.from(this.tasks.entries()),
        history: this.taskHistory.slice(0, 50),
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('deepcode_task_queue', JSON.stringify(state));
    } catch (error) {
      logger.error('Failed to persist task queue state:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('deepcode_task_queue');
      if (!stored) { return; }

      const state = JSON.parse(stored);

      // Restore tasks
      state.tasks?.forEach(([id, task]: [string, any]) => {
        // Convert date strings back to Date objects
        task.createdAt = new Date(task.createdAt);
        if (task.startedAt) { task.startedAt = new Date(task.startedAt); }
        if (task.completedAt) { task.completedAt = new Date(task.completedAt); }

        // Reset running tasks to queued on reload
        if (task.status === TaskStatus.RUNNING) {
          task.status = TaskStatus.QUEUED;
          delete task.startedAt;
        }

        this.tasks.set(id, task);
      });

      // Restore history
      if (state.history) {
        this.taskHistory = state.history.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
      }
    } catch (error) {
      logger.error('Failed to load task queue state:', error);
    }
  }
}
