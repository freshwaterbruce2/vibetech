/**
 * Background Task Queue Types
 */

export enum TaskStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum TaskType {
  CODE_ANALYSIS = 'code_analysis',
  FILE_INDEXING = 'file_indexing',
  AI_COMPLETION = 'ai_completion',
  MULTI_FILE_EDIT = 'multi_file_edit',
  GIT_OPERATION = 'git_operation',
  BUILD = 'build',
  TEST = 'test',
  CUSTOM = 'custom',
}

export interface TaskProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  logs?: string[];
}

export interface BackgroundTask {
  id: string;
  type: TaskType;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: TaskProgress;
  result?: TaskResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelable: boolean;
  pausable: boolean;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface TaskQueueOptions {
  maxConcurrentTasks: number;
  maxQueueSize: number;
  enablePersistence: boolean;
  retryFailedTasks: boolean;
  maxRetries: number;
}

export interface TaskExecutor {
  execute: (task: BackgroundTask, onProgress: (progress: TaskProgress) => void) => Promise<TaskResult>;
  cancel?: (task: BackgroundTask) => Promise<void>;
  pause?: (task: BackgroundTask) => Promise<void>;
  resume?: (task: BackgroundTask) => Promise<void>;
}

export interface TaskNotification {
  taskId: string;
  taskName: string;
  type: 'started' | 'progress' | 'completed' | 'failed' | 'canceled';
  message: string;
  timestamp: Date;
  showToast?: boolean;
}

export interface TaskFilter {
  status?: TaskStatus[];
  type?: TaskType[];
  priority?: TaskPriority[];
  searchTerm?: string;
}

export interface TaskStats {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  canceled: number;
  averageCompletionTime: number;
}
