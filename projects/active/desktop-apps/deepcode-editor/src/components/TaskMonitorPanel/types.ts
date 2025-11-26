/**
 * TaskMonitorPanel Types
 * Type definitions for the Task Monitor Panel component
 */
import type { BackgroundTask, TaskStats, TaskStatus, TaskType } from '@vibetech/types/tasks';

export interface TaskMonitorPanelProps {
  tasks: BackgroundTask[];
  stats: TaskStats;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  history?: BackgroundTask[];
}

export type TaskFilter = 'all' | 'running' | 'queued' | 'completed';

export type { BackgroundTask, TaskStats, TaskStatus, TaskType };
