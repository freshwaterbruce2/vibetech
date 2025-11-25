/**
 * IPC Client Type Definitions
 *
 * Centralized type definitions for IPC communication
 */

import {
  CommandExecutePayload,
  CommandResultPayload,
  IPCMessage,
  IPCMessageType,
  AppSource,
} from '@vibetech/shared-ipc';
import type { ConnectionStatus } from './IPCConnectionManager';

// Re-export for convenience
export type { ConnectionStatus };

/**
 * IPC Client configuration options
 */
export interface IPCClientOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  messageQueueMax?: number;
  commandTimeoutMs?: number;
}

/**
 * IPC Client event handlers
 */
export interface IPCClientEvents {
  status: (status: ConnectionStatus) => void;
  message: (message: IPCMessage) => void;
  pong: (timestamp: number) => void;
  'file:open': (payload: any) => void;
  'file:opened': (payload: any) => void;
  'file:close': (payload: any) => void;
  'learning:sync': (payload: any) => void;
  'project:update': (payload: any) => void;
  'notification': (payload: any) => void;
  [IPCMessageType.COMMAND_EXECUTE]: (payload: CommandExecutePayload) => void;
  [IPCMessageType.COMMAND_RESULT]: (payload: CommandResultPayload) => void;
  'health:check': (payload: any) => void;
}

/**
 * Valid command targets (exclude 'bridge')
 */
export type CommandTarget = Exclude<AppSource, 'bridge'>;

/**
 * Options for command requests
 */
export interface CommandRequestOptions {
  target?: CommandTarget;
  timeoutMs?: number;
  metadata?: Record<string, any>;
  context?: Record<string, any>;
  messageId?: string;
  correlationId?: string;
}

/**
 * Outgoing IPC message format
 */
export interface OutgoingIPCMessage<T = any> {
  type: IPCMessageType | string;
  payload: T;
  timestamp?: number;
  messageId?: string;
  target?: CommandTarget | 'bridge';
  timeoutMs?: number;
  correlationId?: string;
  metadata?: Record<string, any>;
  source?: AppSource;
}
