/**
 * TaskPersistence Service
 * 
 * Provides task state persistence and resumption capabilities for long-running Agent Mode tasks
 */
import { logger } from '../../services/Logger';
import { AgentStep,AgentTask } from '../../types';
import { FileSystemService } from '../FileSystemService';

export interface PersistedTask {
  id: string;
  originalTask: AgentTask;
  currentStepIndex: number;
  completedSteps: AgentStep[];
  timestamp: Date;
  metadata: {
    userRequest: string;
    workspaceRoot: string;
    totalSteps: number;
    completedStepsCount: number;
  };
}

export class TaskPersistence {
  private static readonly TASK_STORAGE_KEY = 'deepcode_agent_tasks';
  private static readonly MAX_PERSISTED_TASKS = 10;

  constructor(private fileSystemService?: FileSystemService) {}

  /**
   * Saves a task's current state for later resumption
   */
  async saveTaskState(task: AgentTask, currentStepIndex: number, userRequest: string, workspaceRoot: string): Promise<void> {
    try {
      const persistedTask: PersistedTask = {
        id: task.id,
        originalTask: { ...task },
        currentStepIndex,
        completedSteps: task.steps.filter(step => step.status === 'completed'),
        timestamp: new Date(),
        metadata: {
          userRequest,
          workspaceRoot,
          totalSteps: task.steps.length,
          completedStepsCount: task.steps.filter(step => step.status === 'completed').length,
        },
      };

      // Store in localStorage for web mode, file system for Tauri
      if (this.fileSystemService && window.electron?.isElectron) {
        await this.saveToFileSystem(persistedTask);
      } else {
        await this.saveToLocalStorage(persistedTask);
      }

      logger.debug(`[TaskPersistence] Saved task state: ${task.title} (${persistedTask.metadata.completedStepsCount}/${persistedTask.metadata.totalSteps} steps completed)`);
    } catch (error) {
      logger.error('[TaskPersistence] Failed to save task state:', error);
    }
  }

  /**
   * Retrieves all persisted tasks
   */
  async getPersistedTasks(): Promise<PersistedTask[]> {
    try {
      if (this.fileSystemService && window.electron?.isElectron) {
        return await this.loadFromFileSystem();
      } else {
        return await this.loadFromLocalStorage();
      }
    } catch (error) {
      logger.error('[TaskPersistence] Failed to load persisted tasks:', error);
      return [];
    }
  }

  /**
   * Retrieves a specific persisted task
   */
  async getPersistedTask(taskId: string): Promise<PersistedTask | null> {
    const tasks = await this.getPersistedTasks();
    return tasks.find(task => task.id === taskId) || null;
  }

  /**
   * Removes a persisted task (called when task completes or is cancelled)
   */
  async removePersistedTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getPersistedTasks();
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      
      if (this.fileSystemService && window.electron?.isElectron) {
        await this.saveAllToFileSystem(filteredTasks);
      } else {
        await this.saveAllToLocalStorage(filteredTasks);
      }

      logger.debug(`[TaskPersistence] Removed persisted task: ${taskId}`);
    } catch (error) {
      logger.error('[TaskPersistence] Failed to remove persisted task:', error);
    }
  }

  /**
   * Clears old persisted tasks (keeps only recent ones)
   */
  async cleanupOldTasks(): Promise<void> {
    try {
      const tasks = await this.getPersistedTasks();
      
      // Sort by timestamp (newest first) and keep only the most recent ones
      const sortedTasks = tasks
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, TaskPersistence.MAX_PERSISTED_TASKS);

      if (this.fileSystemService && window.electron?.isElectron) {
        await this.saveAllToFileSystem(sortedTasks);
      } else {
        await this.saveAllToLocalStorage(sortedTasks);
      }

      logger.debug(`[TaskPersistence] Cleaned up old tasks, kept ${sortedTasks.length} recent tasks`);
    } catch (error) {
      logger.error('[TaskPersistence] Failed to cleanup old tasks:', error);
    }
  }

  // ================== Private Methods ==================

  private async saveToLocalStorage(task: PersistedTask): Promise<void> {
    const existingTasks = await this.loadFromLocalStorage();
    const updatedTasks = existingTasks.filter(t => t.id !== task.id);
    updatedTasks.push(task);
    
    localStorage.setItem(TaskPersistence.TASK_STORAGE_KEY, JSON.stringify(updatedTasks));
  }

  private async loadFromLocalStorage(): Promise<PersistedTask[]> {
    const stored = localStorage.getItem(TaskPersistence.TASK_STORAGE_KEY);
    if (!stored) {return [];}
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private async saveAllToLocalStorage(tasks: PersistedTask[]): Promise<void> {
    localStorage.setItem(TaskPersistence.TASK_STORAGE_KEY, JSON.stringify(tasks));
  }

  private async saveToFileSystem(task: PersistedTask): Promise<void> {
    if (!this.fileSystemService) {throw new Error('FileSystemService not available');}
    
    const tasksDir = '.deepcode/agent-tasks';
    const taskFile = `${tasksDir}/${task.id}.json`;
    
    // Ensure directory exists
    try {
      await this.fileSystemService.createDirectory(tasksDir);
    } catch {
      // Directory might already exist
    }
    
    await this.fileSystemService.writeFile(taskFile, JSON.stringify(task, null, 2));
  }

  private async loadFromFileSystem(): Promise<PersistedTask[]> {
    if (!this.fileSystemService) {throw new Error('FileSystemService not available');}
    
    const tasksDir = '.deepcode/agent-tasks';
    
    try {
      const files = await this.fileSystemService.listDirectory(tasksDir);
      const tasks: PersistedTask[] = [];
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const content = await this.fileSystemService.readFile(`${tasksDir}/${file.name}`);
            const task = JSON.parse(content);
            tasks.push(task);
          } catch (error) {
            logger.warn(`[TaskPersistence] Failed to load task file ${file.name}:`, error);
          }
        }
      }
      
      return tasks;
    } catch (error) {
      // Directory doesn't exist or other error
      return [];
    }
  }

  private async saveAllToFileSystem(tasks: PersistedTask[]): Promise<void> {
    if (!this.fileSystemService) {throw new Error('FileSystemService not available');}
    
    const tasksDir = '.deepcode/agent-tasks';
    
    // Clear existing files
    try {
      const files = await this.fileSystemService.listDirectory(tasksDir);
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          await this.fileSystemService.deleteFile(`${tasksDir}/${file.name}`);
        }
      }
    } catch {
      // Directory might not exist
    }
    
    // Save new tasks
    for (const task of tasks) {
      await this.saveToFileSystem(task);
    }
  }
}