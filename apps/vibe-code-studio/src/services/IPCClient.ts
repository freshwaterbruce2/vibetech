/**
 * IPC Client Service for Vibe Code Studio
 *
 * Refactored modular architecture with extracted components:
 * - IPCConnectionManager: WebSocket connection lifecycle
 * - IPCMessageQueue: Offline message queueing
 * - IPCCommandHandler: Command request/response pattern
 *
 * Features:
 * - WebSocket connection to IPC Bridge (ws://localhost:5004)
 * - Auto-reconnect with exponential backoff
 * - Message queue for offline messages
 * - Event emitter for message handling
 * - Ping/pong health checks
 * - TypeScript typed message handling
 *
 * Based on 2025 Best Practices:
 * - Modular architecture with separation of concerns
 * - EventEmitter for consistent event handling
 * - TypeScript for type safety
 * - Resilient connection management
 */

import {
  CommandRequestPayload,
  IPCMessage,
  IPCMessageType,
} from '@vibetech/shared-ipc';
import { EventEmitter } from '../utils/EventEmitter';
import { logger } from './Logger';
import {
  IPCConnectionManager,
  IPCMessageQueue,
  IPCCommandHandler,
} from './ipc';
import type {
  ConnectionStatus,
  IPCClientOptions,
  IPCClientEvents,
  CommandTarget,
  CommandRequestOptions,
  OutgoingIPCMessage,
} from './ipc/types';

// Re-export types for consumers
export type {
  ConnectionStatus,
  IPCClientOptions,
  IPCClientEvents,
  CommandTarget,
  CommandRequestOptions,
  OutgoingIPCMessage,
};

class IPCClient extends EventEmitter {
  private connectionManager: IPCConnectionManager;
  private messageQueue: IPCMessageQueue;
  private commandHandler: IPCCommandHandler;
  private options: Required<IPCClientOptions>;

  constructor(options: IPCClientOptions = {}) {
    super();

    this.options = {
      url: options.url || 'ws://localhost:5004',
      reconnectInterval: options.reconnectInterval || 2000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      pingInterval: options.pingInterval || 30000,
      messageQueueMax: options.messageQueueMax || 100,
      commandTimeoutMs: options.commandTimeoutMs || 30000,
    };

    // Initialize components
    this.connectionManager = new IPCConnectionManager({
      url: this.options.url,
      reconnectInterval: this.options.reconnectInterval,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      pingInterval: this.options.pingInterval,
    });

    this.messageQueue = new IPCMessageQueue(this.options.messageQueueMax);
    this.commandHandler = new IPCCommandHandler(this.options.commandTimeoutMs);

    // Set up event forwarding
    this.setupEventListeners();
  }

  /**
   * Set up event listeners from connection manager
   */
  private setupEventListeners(): void {
    // Forward connection status changes
    this.connectionManager.on('status', (status: ConnectionStatus) => {
      this.emit('status', status);
      logger.info(`[IPC] Status changed: ${status}`);
    });

    // Handle connection established
    this.connectionManager.on('connected', () => {
      logger.info('[IPC] ✓ Connected to IPC Bridge');
      this.flushMessageQueue();
    });

    // Handle disconnection
    this.connectionManager.on('disconnected', () => {
      logger.info('[IPC] Disconnected from IPC Bridge');
      this.commandHandler.rejectAll(new Error('IPC Bridge disconnected'));
    });

    // Handle errors
    this.connectionManager.on('error', (error: Event) => {
      logger.error('[IPC] Connection error:', error);
      this.commandHandler.rejectAll(new Error('IPC Bridge encountered an error'));
    });

    // Handle incoming messages
    this.connectionManager.on('message', (data: string) => {
      this.handleMessage(data);
    });

    // Handle ping requests (send pong)
    this.connectionManager.on('ping', () => {
      this.send({
        type: IPCMessageType.PONG,
        payload: {},
        timestamp: Date.now(),
        messageId: this.generateMessageId('vibe'),
      });
    });
  }

  /**
   * Connect to IPC Bridge
   */
  public connect(): void {
    this.connectionManager.connect();
  }

  /**
   * Disconnect from IPC Bridge
   */
  public disconnect(): void {
    this.connectionManager.disconnect();
  }

  /**
   * Send IPC message
   */
  public send(message: OutgoingIPCMessage): boolean {
    if (!this.connectionManager.isConnected()) {
      logger.warn('[IPC] Not connected, queueing message:', message.type);
      this.queueMessage(message);
      return false;
    }

    try {
      // Add required fields for IPC Bridge
      const fullMessage: OutgoingIPCMessage = {
        ...message,
        source: 'vibe', // Identify as Vibe Code Studio
        timestamp: message.timestamp ?? Date.now(),
        messageId: message.messageId ?? this.generateMessageId('vibe'),
      };

      const sent = this.connectionManager.send(JSON.stringify(fullMessage));

      if (sent) {
        logger.debug('[IPC] ✓ Sent message:', message.type);
      } else {
        logger.warn('[IPC] Failed to send, queueing:', message.type);
        this.queueMessage(message);
      }

      return sent;
    } catch (error) {
      logger.error('[IPC] Failed to send message:', error);
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Send file open request
   */
  public sendFileOpenRequest(
    path: string,
    line?: number,
    column?: number
  ): boolean {
    return this.send({
      type: IPCMessageType.FILE_OPEN,
      payload: { path, line, column },
      timestamp: Date.now(),
      messageId: this.generateMessageId('vibe'),
    });
  }

  /**
   * Send learning sync notification
   */
  public sendLearningSync(data: any): boolean {
    return this.send({
      type: IPCMessageType.LEARNING_SYNC,
      payload: data,
      timestamp: Date.now(),
      messageId: this.generateMessageId('vibe'),
    });
  }

  /**
   * Send project update notification
   */
  public sendProjectUpdate(data: any): boolean {
    return this.send({
      type: IPCMessageType.PROJECT_UPDATE,
      payload: data,
      timestamp: Date.now(),
      messageId: this.generateMessageId('vibe'),
    });
  }

  /**
   * Send notification
   */
  public sendNotification(title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): boolean {
    return this.send({
      type: IPCMessageType.NOTIFICATION,
      payload: { title, message, type },
      timestamp: Date.now(),
      messageId: this.generateMessageId('vibe'),
    });
  }

  /**
   * Send cross-app command request to NOVA Agent (Phase 3.2)
   */
  public async sendCommandRequest(
    text: string,
    options: CommandRequestOptions = {}
  ): Promise<CommandResultPayload> {
    if (!this.isConnected()) {
      throw new Error('IPC Bridge is not connected');
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Command text cannot be empty');
    }

    const target: CommandTarget = options.target ?? 'nova';
    const commandId = options.messageId ?? this.generateMessageId('cmd');
    const timeoutMs = Math.max(1000, options.timeoutMs ?? this.options.commandTimeoutMs);

    const payload: CommandRequestPayload = {
      text: trimmedText,
      target,
      context: options.context,
      metadata: options.metadata,
    };

    const message: OutgoingIPCMessage<CommandRequestPayload> = {
      type: IPCMessageType.COMMAND_REQUEST,
      payload,
      timestamp: Date.now(),
      messageId: commandId,
      target,
      timeoutMs,
      ...(options.correlationId && { correlationId: options.correlationId }),
    };

    // Register command with handler
    const resultPromise = this.commandHandler.registerCommand(commandId, timeoutMs);

    // Send the command message
    const sent = this.send(message);
    if (!sent) {
      logger.warn('[IPC] Command request queued (connection pending)');
    }

    return resultPromise;
  }

  /**
   * Get connection status
   */
  public getStatus(): ConnectionStatus {
    return this.connectionManager.getStatus();
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  /**
   * Get time since last ping (in milliseconds)
   */
  public getTimeSinceLastPing(): number | null {
    return this.connectionManager.getTimeSinceLastPing();
  }

  /**
   * Get queued message count
   */
  public getQueuedMessageCount(): number {
    return this.messageQueue.size();
  }

  // Private Methods

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as any;

      // Handle pong
      if (message.type === 'pong' || message.type === IPCMessageType.PONG) {
        const timestamp = message.payload?.timestamp || message.timestamp || Date.now();
        this.emit('pong', timestamp);
        return;
      }

      // Handle command result
      if (message.type === IPCMessageType.COMMAND_RESULT) {
        const payload = message.payload as CommandResultPayload;
        const commandId = payload?.commandId;
        if (commandId) {
          this.commandHandler.handleResult(commandId, payload);
        }
      }

      // Emit generic message event
      this.emit('message', message);

      // Emit specific message type event
      if (message.type) {
        this.emit(message.type as keyof IPCClientEvents, message.payload);
      }

      logger.debug('[IPC] Received message:', message.type);
    } catch (error) {
      logger.error('[IPC] Failed to parse message:', error);
    }
  }

  private queueMessage(message: OutgoingIPCMessage): void {
    this.messageQueue.enqueue(JSON.stringify({
      ...message,
      source: 'vibe',
      timestamp: message.timestamp ?? Date.now(),
      messageId: message.messageId ?? this.generateMessageId('vibe'),
    }));
  }

  private flushMessageQueue(): void {
    const messages = this.messageQueue.flush();

    if (messages.length === 0) return;

    logger.debug(`[IPC] Flushing ${messages.length} queued messages...`);

    for (const { data } of messages) {
      this.connectionManager.send(data);
    }
  }

  private generateMessageId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const ipcClient = new IPCClient();

// Auto-connect on module load (optional)
if (typeof window !== 'undefined') {
  // Wait a bit for app to initialize
  setTimeout(() => {
    logger.info('[IPC] Auto-connecting to IPC Bridge...');
    ipcClient.connect();
  }, 1000);
}

export default IPCClient;
