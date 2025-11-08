/**
 * IPC Protocol Definitions
 *
 * Shared message types and interfaces for NOVA Agent ↔ Vibe Code Studio communication
 * via IPC Bridge WebSocket server
 */

export type AppSource = 'nova' | 'vibe';

export type MessageType =
  | 'file:open'
  | 'file:opened'
  | 'file:close'
  | 'learning:sync'
  | 'learning:updated'
  | 'project:update'
  | 'project:updated'
  | 'notification:show'
  | 'command:execute'
  | 'command:result'
  | 'health:ping'
  | 'health:pong'
  | 'bridge_stats';

export interface IPCMessage<T = any> {
  type: MessageType;
  payload: T;
  timestamp: number;
  source: AppSource;
  messageId: string;
  // Optional correlation ID for request/response pairs
  correlationId?: string;
}

// ==================== File Operations ====================

export interface FileOpenPayload {
  path: string;
  line?: number;
  column?: number;
  focus?: boolean;
}

export interface FileOpenedPayload {
  path: string;
  success: boolean;
  error?: string;
}

export interface FileClosePayload {
  path: string;
}

// ==================== Learning Data ====================

export interface LearningDataPayload {
  type: 'mistake' | 'knowledge' | 'insight';
  id: string;
  data: any; // Flexible structure for different learning types
  timestamp: number;
}

export interface LearningSyncPayload {
  items: LearningDataPayload[];
  lastSyncTimestamp: number;
}

export interface LearningUpdatedPayload {
  success: boolean;
  itemsAdded: number;
  error?: string;
}

// ==================== Project Management ====================

export interface ProjectPayload {
  id: string;
  name: string;
  path: string;
  status: 'active' | 'planning' | 'archived';
  language?: string;
  framework?: string;
}

export interface ProjectUpdatePayload {
  project: ProjectPayload;
  action: 'created' | 'updated' | 'deleted' | 'activated';
}

export interface ProjectUpdatedPayload {
  success: boolean;
  projectId: string;
  error?: string;
}

// ==================== Notifications ====================

export interface NotificationPayload {
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // milliseconds
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string; // Command to execute
}

// ==================== Command Execution ====================

export interface CommandPayload {
  command: string;
  args?: Record<string, any>;
  timeout?: number; // milliseconds
}

export interface CommandResultPayload {
  command: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number; // milliseconds
}

// ==================== Health Check ====================

export interface HealthPingPayload {
  timestamp: number;
}

export interface HealthPongPayload {
  timestamp: number;
  latency: number; // milliseconds
}

// ==================== Bridge Statistics ====================

export interface BridgeStatsPayload {
  server: {
    uptime: number;
    port: number;
  };
  connections: {
    active: number;
    total: number;
    disconnections: number;
  };
  messages: {
    total: number;
    byType: Record<string, number>;
    recentCount: number;
  };
  clients: {
    id: string;
    source: string;
    messageCount: number;
    connected: number;
  }[];
}

// ==================== Utility Functions ====================

/**
 * Create a new IPC message
 */
export function createIPCMessage<T>(
  type: MessageType,
  payload: T,
  source: AppSource,
  correlationId?: string
): IPCMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source,
    messageId: generateMessageId(source),
    ...(correlationId && { correlationId }),
  };
}

/**
 * Generate unique message ID
 */
function generateMessageId(source: AppSource): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${source}-${timestamp}-${random}`;
}

/**
 * Validate IPC message structure
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

/**
 * Type guards for specific message types
 */
export function isFileOpenMessage(message: IPCMessage): message is IPCMessage<FileOpenPayload> {
  return message.type === 'file:open' && typeof message.payload.path === 'string';
}

export function isLearningSync Message(message: IPCMessage): message is IPCMessage<LearningSyncPayload> {
  return message.type === 'learning:sync' && Array.isArray(message.payload.items);
}

export function isProjectUpdateMessage(message: IPCMessage): message is IPCMessage<ProjectUpdatePayload> {
  return message.type === 'project:update' && typeof message.payload.project === 'object';
}

export function isNotificationMessage(message: IPCMessage): message is IPCMessage<NotificationPayload> {
  return message.type === 'notification:show' && typeof message.payload.title === 'string';
}

export function isCommandMessage(message: IPCMessage): message is IPCMessage<CommandPayload> {
  return message.type === 'command:execute' && typeof message.payload.command === 'string';
}
