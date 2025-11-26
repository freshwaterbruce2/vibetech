/**
 * IPC Message Types
 *
 * Standard message format for communication between applications
 */

export type IPCMessageType =
  | 'file_open'
  | 'context_update'
  | 'activity_sync'
  | 'learning_update'
  | 'mistake_logged'
  | 'knowledge_added'
  | 'project_switch'
  | 'deep_work_start'
  | 'deep_work_end'
  | 'ping'
  | 'pong';

export interface IPCMessage<T = any> {
  type: IPCMessageType;
  payload: T;
  timestamp: number;
  source: 'nova' | 'vibe';
  messageId: string;
}

export interface FileOpenPayload {
  filePath: string;
  projectPath?: string;
  lineNumber?: number;
  context?: string;
}

export interface ContextUpdatePayload {
  currentFile?: string;
  workspaceRoot?: string;
  projectType?: string;
  gitBranch?: string;
  recentFiles?: string[];
}

export interface ActivitySyncPayload {
  events: {
    type: string;
    timestamp: number;
    data?: any;
  }[];
}

export interface LearningUpdatePayload {
  mistakes?: any[];
  knowledge?: any[];
  patterns?: any[];
}

export interface ProjectSwitchPayload {
  projectId: string;
  projectName: string;
  projectPath: string;
}

export interface DeepWorkPayload {
  sessionId: string;
  startTime: number;
  endTime?: number;
  focusScore?: number;
}

/**
 * Create a new IPC message
 */
export function createIPCMessage<T = any>(
  type: IPCMessageType,
  payload: T,
  source: 'nova' | 'vibe'
): IPCMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source,
    messageId: `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Validate an IPC message
 */
export function isValidIPCMessage(message: any): message is IPCMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.type === 'string' &&
    message.payload !== undefined &&
    typeof message.timestamp === 'number' &&
    (message.source === 'nova' || message.source === 'vibe') &&
    typeof message.messageId === 'string'
  );
}
