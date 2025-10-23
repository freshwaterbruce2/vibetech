/**
 * Activity Monitoring Types
 * Types for file system, git, and process activity monitoring
 */

export type FileEventType = 'create' | 'modify' | 'delete' | 'rename';

export interface FileEvent {
  id?: number;
  path: string;
  eventType: FileEventType;
  timestamp: number;
  project?: string | null;
  oldPath?: string | null; // For rename events
}

export type GitEventType = 'commit' | 'checkout' | 'merge' | 'pull' | 'push' | 'branch-create' | 'branch-delete';

export interface GitEvent {
  id?: number;
  repoPath: string;
  eventType: GitEventType;
  branch: string | null;
  commitHash?: string | null;
  message?: string | null;
  author?: string | null;
  timestamp: number;
}

export type ProcessEventType = 'start' | 'stop' | 'crash';

export interface ProcessEvent {
  id?: number;
  name: string;
  pid: number;
  eventType: ProcessEventType;
  port?: number | null;
  commandLine?: string | null;
  project?: string | null;
  timestamp: number;
}

export interface Activity {
  fileEvents: FileEvent[];
  gitEvents: GitEvent[];
  processEvents: ProcessEvent[];
}

export interface ActivityFilter {
  startTime?: number;
  endTime?: number;
  projects?: string[];
  eventTypes?: string[];
  searchQuery?: string;
}
