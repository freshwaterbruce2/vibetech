/**
 * IPC Command Handler
 *
 * Manages command request/response pattern for cross-app communication:
 * - Promise-based command execution
 * - Timeout handling for commands
 * - Pending command tracking
 * - Error propagation
 */

import { CommandResultPayload } from '@vibetech/shared-ipc';
import { logger } from '../Logger';

export interface PendingCommand {
  resolve: (payload: CommandResultPayload) => void;
  reject: (error: Error) => void;
  timeout: number;
}

export class IPCCommandHandler {
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private readonly defaultTimeoutMs: number;

  constructor(defaultTimeoutMs: number = 30000) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Register a command request and return a promise that resolves when result is received
   */
  public registerCommand(
    commandId: string,
    timeoutMs?: number
  ): Promise<CommandResultPayload> {
    const timeout = Math.max(1000, timeoutMs ?? this.defaultTimeoutMs);

    return new Promise<CommandResultPayload>((resolve, reject) => {
      const timeoutHandle = window.setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error(`Command request timed out after ${timeout}ms`));
      }, timeout);

      this.pendingCommands.set(commandId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });
    });
  }

  /**
   * Handle incoming command result
   */
  public handleResult(commandId: string, payload: CommandResultPayload): boolean {
    const pending = this.pendingCommands.get(commandId);

    if (!pending) {
      logger.warn(`[IPC CommandHandler] No pending command found for ID: ${commandId}`);
      return false;
    }

    clearTimeout(pending.timeout);
    this.pendingCommands.delete(commandId);
    pending.resolve(payload);

    return true;
  }

  /**
   * Reject a pending command with an error
   */
  public rejectCommand(commandId: string, error: Error): boolean {
    const pending = this.pendingCommands.get(commandId);

    if (!pending) {
      return false;
    }

    clearTimeout(pending.timeout);
    this.pendingCommands.delete(commandId);
    pending.reject(error);

    return true;
  }

  /**
   * Reject all pending commands (used on disconnect)
   */
  public rejectAll(error: Error): void {
    for (const [commandId, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
      this.pendingCommands.delete(commandId);
      logger.warn(`[IPC CommandHandler] Pending command rejected (${commandId}): ${error.message}`);
    }
  }

  /**
   * Get count of pending commands
   */
  public getPendingCount(): number {
    return this.pendingCommands.size;
  }

  /**
   * Clear all pending commands without rejection
   */
  public clear(): void {
    for (const [, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
    }
    this.pendingCommands.clear();
  }
}
