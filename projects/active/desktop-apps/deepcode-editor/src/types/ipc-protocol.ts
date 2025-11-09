/**
 * IPC Protocol Types
 *
 * Shared types for IPC communication between NOVA Agent and Vibe Code Studio
 */

export type IPCMessageType =
  | 'ping'
  | 'pong'
  | 'file:open'
  | 'file:opened'
  | 'file:close'
  | 'learning:sync'
  | 'project:update'
  | 'notification'
  | 'command:execute'
  | 'health:check'
  | 'status';

export interface IPCMessage<T = any> {
  type: IPCMessageType;
  payload: T;
  timestamp: number;
  id?: string;
}

export interface FileOpenPayload {
  path: string;
  line?: number;
  column?: number;
}

export interface LearningUpdatePayload {
  id: string;
  content: string;
  timestamp: number;
  category?: string;
  tags?: string[];
}

export interface ProjectUpdatePayload {
  projectId: string;
  projectName: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: number;
  details?: any;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface ContextUpdatePayload {
  workspaceRoot?: string;
  openFiles?: string[];
  activeFile?: string;
}

export interface ActivitySyncPayload {
  activity: string;
  timestamp: number;
  metadata?: any;
}
