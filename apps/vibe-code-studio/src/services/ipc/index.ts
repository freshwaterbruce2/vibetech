/**
 * IPC Module Exports
 *
 * Modular IPC system for Vibe Code Studio
 */

export { IPCConnectionManager } from './IPCConnectionManager';
export type { ConnectionStatus, ConnectionOptions } from './IPCConnectionManager';
export { IPCMessageQueue } from './IPCMessageQueue';
export type { QueuedMessage } from './IPCMessageQueue';
export { IPCCommandHandler } from './IPCCommandHandler';
export type { PendingCommand } from './IPCCommandHandler';

// Re-export all types for convenience
export type {
  IPCClientOptions,
  IPCClientEvents,
  CommandTarget,
  CommandRequestOptions,
  OutgoingIPCMessage,
} from './types';
