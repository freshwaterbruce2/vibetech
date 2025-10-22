/**
 * Monitoring Configuration Types
 * Types for workspace monitoring configuration
 */

export interface MonitoringConfig {
  workspacePath: string;
  excludePaths: string[];
  includePatterns?: string[];
  debounceMs: number;
  maxEventsPerSecond: number;
}

export interface WatcherStatus {
  isRunning: boolean;
  watchedPaths: number;
  eventsPerSecond: number;
  lastEventTime: number | null;
  errors: string[];
}

export interface GitRepoInfo {
  path: string;
  currentBranch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    timestamp: number;
  };
}

export interface DevelopmentServer {
  name: string;
  pid: number;
  port: number;
  type: 'vite' | 'webpack' | 'tauri' | 'next' | 'cargo' | 'python' | 'node' | 'other';
  project: string;
  uptime: number;
  isHealthy: boolean;
}
