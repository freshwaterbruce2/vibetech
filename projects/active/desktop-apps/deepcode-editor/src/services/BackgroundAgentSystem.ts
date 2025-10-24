/**
 * BackgroundAgentSystem - Non-blocking agent execution
 * Runs agents in background without blocking UI
 *
 * Integrates with ExecutionEngine to run real agent tasks
 */
import { logger } from '../services/Logger';

import { EventEmitter } from '../utils/EventEmitter';
import type { ExecutionEngine, ExecutionCallbacks } from './ai/ExecutionEngine';
import type { TaskPlanner } from './ai/TaskPlanner';
import type { AgentTask } from '../types';

export interface BackgroundTask {
  id: string;
  agentId: string;
  userRequest: string; // Original user request
  workspaceRoot: string; // Workspace root for the task
  parameters: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: AgentTask; // Completed agent task
  error?: Error;
  startTime?: number;
  endTime?: number;
  progress?: number; // 0-100
  currentStep?: number; // Current step being executed
  totalSteps?: number; // Total steps in the plan
  stepDescription?: string; // Description of current step
}

export interface BackgroundTaskOptions {
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export class BackgroundAgentSystem extends EventEmitter {
  private tasks: Map<string, BackgroundTask> = new Map();
  private queue: Array<{ task: BackgroundTask; options: BackgroundTaskOptions }> = [];
  private running: Set<string> = new Set();
  private maxConcurrent: number;
  private abortControllers: Map<string, AbortController> = new Map(); // For cancellation

  constructor(
    private executionEngine: ExecutionEngine,
    private taskPlanner: TaskPlanner,
    maxConcurrent: number = 3
  ) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Submit task for background execution
   */
  submit(
    agentId: string,
    userRequest: string,
    workspaceRoot: string,
    parameters: any = {},
    options: BackgroundTaskOptions = {}
  ): string {
    const task: BackgroundTask = {
      id: `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      userRequest,
      workspaceRoot,
      parameters,
      status: 'pending',
      progress: 0,
      currentStep: 0,
      totalSteps: 0
    };

    this.tasks.set(task.id, task);
    this.queue.push({ task, options });

    // Sort by priority
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.options.priority || 'normal'] - priorityOrder[a.options.priority || 'normal'];
    });

    this.processQueue();
    this.emit('submitted', task);

    return task.id;
  }

  /**
   * Get task status
   */
  getTask(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get running tasks
   */
  getRunningTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'running');
  }

  /**
   * Cancel task
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'pending') {
      task.status = 'cancelled';
      this.queue = this.queue.filter(q => q.task.id !== taskId);
      this.emit('cancelled', task);
      return true;
    }

    if (task.status === 'running') {
      task.status = 'cancelled';
      this.running.delete(taskId);
      this.emit('cancelled', task);
      this.processQueue();
      return true;
    }

    return false;
  }

  /**
   * Wait for task completion
   */
  async waitFor(taskId: string, timeout?: number): Promise<BackgroundTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return task;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = timeout ? setTimeout(() => {
        reject(new Error('Task timeout'));
      }, timeout) : null;

      const onComplete = (completedTask: BackgroundTask) => {
        if (completedTask.id === taskId) {
          if (timeoutId) clearTimeout(timeoutId);
          this.off('completed', onComplete);
          this.off('failed', onFailed);
          this.off('cancelled', onCancelled);
          resolve(completedTask);
        }
      };

      const onFailed = (failedTask: BackgroundTask) => {
        if (failedTask.id === taskId) {
          if (timeoutId) clearTimeout(timeoutId);
          this.off('completed', onComplete);
          this.off('failed', onFailed);
          this.off('cancelled', onCancelled);
          resolve(failedTask);
        }
      };

      const onCancelled = (cancelledTask: BackgroundTask) => {
        if (cancelledTask.id === taskId) {
          if (timeoutId) clearTimeout(timeoutId);
          this.off('completed', onComplete);
          this.off('failed', onFailed);
          this.off('cancelled', onCancelled);
          resolve(cancelledTask);
        }
      };

      this.on('completed', onComplete);
      this.on('failed', onFailed);
      this.on('cancelled', onCancelled);
    });
  }

  /**
   * Process queue
   */
  private processQueue(): void {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.executeTask(next.task, next.options);
      }
    }
  }

  /**
   * Execute task with real agent execution
   */
  private async executeTask(task: BackgroundTask, options: BackgroundTaskOptions): Promise<void> {
    task.status = 'running';
    task.startTime = Date.now();
    this.running.add(task.id);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.abortControllers.set(task.id, abortController);

    this.emit('started', task);

    try {
      // Step 1: Plan the task
      logger.debug(`[BackgroundAgent] Planning task: ${task.userRequest}`);
      task.stepDescription = 'Planning task...';
      task.progress = 5;
      this.emit('progress', task);

      const planResponse = await this.taskPlanner.planTask({
        userRequest: task.userRequest,
        context: {
          workspaceRoot: task.workspaceRoot,
          openFiles: task.parameters.files || [],
          ...(task.parameters.context || {})
        }
      });

      // Check if cancelled during planning
      const taskInMap = this.tasks.get(task.id);
      if (taskInMap && taskInMap.status === 'cancelled') {
        throw new Error('Task cancelled during planning');
      }

      // Update total steps
      task.totalSteps = planResponse.task.steps.length;
      task.progress = 10;
      this.emit('progress', task);

      // Step 2: Execute the task with callbacks
      logger.debug(`[BackgroundAgent] Executing ${task.totalSteps} steps`);

      const callbacks: ExecutionCallbacks = {
        onStepStart: (step) => {
          task.currentStep = (task.currentStep || 0) + 1;
          task.stepDescription = step.description;
          this.emit('stepStart', task, step);
        },
        onStepComplete: (step, result) => {
          const progress = 10 + ((task.currentStep || 0) / (task.totalSteps || 1)) * 85;
          task.progress = Math.min(95, progress);
          this.emit('stepComplete', task, step, result);
          this.emit('progress', task);
        },
        onStepError: (step, error) => {
          logger.error(`[BackgroundAgent] Step error:`, error);
          this.emit('stepError', task, step, error);
        },
        onTaskProgress: (completedSteps, totalSteps) => {
          task.currentStep = completedSteps;
          task.totalSteps = totalSteps;
          const progress = 10 + (completedSteps / totalSteps) * 85;
          task.progress = Math.min(95, progress);
          this.emit('progress', task);
        },
        onTaskComplete: (completedTask) => {
          logger.debug(`[BackgroundAgent] Task completed successfully`);
        },
        onTaskError: (failedTask, error) => {
          logger.error(`[BackgroundAgent] Task error:`, error);
        }
      };

      const executedTask = await this.executionEngine.executeTask(planResponse.task, callbacks);

      // Check if cancelled during execution
      const currentTask = this.tasks.get(task.id);
      if (currentTask && currentTask.status === 'cancelled') {
        throw new Error('Task cancelled during execution');
      }

      // Success!
      task.status = 'completed';
      task.endTime = Date.now();
      task.progress = 100;
      task.result = executedTask;
      this.emit('completed', task);

    } catch (error) {
      // Check if the task was cancelled
      const currentTask = this.tasks.get(task.id);
      if (currentTask && currentTask.status === 'cancelled') {
        // Don't mark as failed if it was cancelled
        task.endTime = Date.now();
        this.emit('cancelled', task);
      } else {
        task.status = 'failed';
        task.endTime = Date.now();
        task.error = error as Error;
        this.emit('failed', task);

        // Retry if configured
        if (options.retryOnFailure && (!options.maxRetries || (task.currentStep || 0) < options.maxRetries)) {
          logger.debug(`[BackgroundAgent] Retrying task (attempt ${(task.currentStep || 0) + 1})`);
          task.status = 'pending';
          task.currentStep = (task.currentStep || 0) + 1;
          this.queue.unshift({ task, options });
        }
      }
    } finally {
      this.running.delete(task.id);
      this.abortControllers.delete(task.id);
      this.processQueue();
    }
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): void {
    Array.from(this.tasks.entries()).forEach(([id, task]) => {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(id);
      }
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };
  }
}
