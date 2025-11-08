/**
 * IPC Client Service for Vibe Code Studio
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
 * - Modern WebSocket API
 * - TypeScript for type safety
 * - Event-driven architecture
 * - Resilient connection management
 */

import EventEmitter from 'events';
import type { IPCMessage, IPCMessageType } from '@vibetech/shared/ipc-protocol';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface IPCClientOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  messageQueueMax?: number;
}

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
  'command:execute': (payload: any) => void;
  'health:check': (payload: any) => void;
}

declare interface IPCClient {
  on<K extends keyof IPCClientEvents>(
    event: K,
    listener: IPCClientEvents[K]
  ): this;
  emit<K extends keyof IPCClientEvents>(
    event: K,
    ...args: Parameters<IPCClientEvents[K]>
  ): boolean;
  off<K extends keyof IPCClientEvents>(
    event: K,
    listener: IPCClientEvents[K]
  ): this;
}

class IPCClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private messageQueue: IPCMessage[] = [];
  private lastPingTime: number = 0;

  private options: Required<IPCClientOptions>;

  constructor(options: IPCClientOptions = {}) {
    super();
    this.options = {
      url: options.url || 'ws://localhost:5004',
      reconnectInterval: options.reconnectInterval || 2000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      pingInterval: options.pingInterval || 30000,
      messageQueueMax: options.messageQueueMax || 100
    };
  }

  /**
   * Connect to IPC Bridge
   */
  public connect(): void {
    if (this.status === 'connecting' || this.status === 'connected') {
      console.log('[IPC] Already connected or connecting');
      return;
    }

    this.setStatus('connecting');
    console.log(`[IPC] Connecting to ${this.options.url}...`);

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onmessage = (event) => this.handleMessage(event);
    } catch (error) {
      console.error('[IPC] WebSocket connection failed:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from IPC Bridge
   */
  public disconnect(): void {
    console.log('[IPC] Disconnecting...');

    // Prevent auto-reconnect
    this.reconnectAttempts = this.options.maxReconnectAttempts;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Send IPC message
   */
  public send(message: IPCMessage): boolean {
    if (this.status !== 'connected' || !this.ws) {
      console.warn('[IPC] Not connected, queueing message:', message.type);
      this.queueMessage(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      console.log('[IPC] ✓ Sent message:', message.type);
      return true;
    } catch (error) {
      console.error('[IPC] Failed to send message:', error);
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
      type: 'file:open' as IPCMessageType,
      payload: { path, line, column },
      timestamp: Date.now()
    });
  }

  /**
   * Send learning sync notification
   */
  public sendLearningSync(data: any): boolean {
    return this.send({
      type: 'learning:sync' as IPCMessageType,
      payload: data,
      timestamp: Date.now()
    });
  }

  /**
   * Send project update notification
   */
  public sendProjectUpdate(data: any): boolean {
    return this.send({
      type: 'project:update' as IPCMessageType,
      payload: data,
      timestamp: Date.now()
    });
  }

  /**
   * Send notification
   */
  public sendNotification(title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): boolean {
    return this.send({
      type: 'notification' as IPCMessageType,
      payload: { title, message, type },
      timestamp: Date.now()
    });
  }

  /**
   * Get connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get time since last ping (in milliseconds)
   */
  public getTimeSinceLastPing(): number | null {
    if (!this.lastPingTime) return null;
    return Date.now() - this.lastPingTime;
  }

  /**
   * Get queued message count
   */
  public getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  // Private Methods

  private handleOpen(): void {
    console.log('[IPC] ✓ Connected to IPC Bridge');
    this.reconnectAttempts = 0;
    this.setStatus('connected');
    this.startPing();
    this.flushMessageQueue();
  }

  private handleClose(event: CloseEvent): void {
    console.log(`[IPC] Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
    this.stopPing();
    this.setStatus('disconnected');

    // Don't reconnect if it was a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('[IPC] WebSocket error:', error);
    this.setStatus('error');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: IPCMessage = JSON.parse(event.data);

      // Update last ping time for any received message
      this.lastPingTime = Date.now();

      // Handle ping/pong
      if (message.type === 'ping') {
        this.send({
          type: 'pong' as IPCMessageType,
          payload: {},
          timestamp: Date.now()
        });
        return;
      }

      if (message.type === 'pong') {
        this.emit('pong', message.timestamp);
        return;
      }

      // Emit generic message event
      this.emit('message', message);

      // Emit specific message type event
      if (message.type) {
        this.emit(message.type as keyof IPCClientEvents, message.payload);
      }

      console.log('[IPC] Received message:', message.type);
    } catch (error) {
      console.error('[IPC] Failed to parse message:', error);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;

    this.status = status;
    this.emit('status', status);
    console.log(`[IPC] Status changed: ${status}`);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('[IPC] Max reconnect attempts reached');
      return;
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(`[IPC] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.options.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.status === 'connected') {
        this.send({
          type: 'ping' as IPCMessageType,
          payload: {},
          timestamp: Date.now()
        });
      }
    }, this.options.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private queueMessage(message: IPCMessage): void {
    // Prevent queue from growing too large
    if (this.messageQueue.length >= this.options.messageQueueMax) {
      console.warn('[IPC] Message queue full, dropping oldest message');
      this.messageQueue.shift();
    }

    this.messageQueue.push(message);
    console.log(`[IPC] Queued message (${this.messageQueue.length} in queue)`);
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`[IPC] Flushing ${this.messageQueue.length} queued messages...`);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      this.send(message);
    }
  }
}

// Singleton instance
export const ipcClient = new IPCClient();

// Auto-connect on module load (optional)
if (typeof window !== 'undefined') {
  // Wait a bit for app to initialize
  setTimeout(() => {
    console.log('[IPC] Auto-connecting to IPC Bridge...');
    ipcClient.connect();
  }, 1000);
}

export default IPCClient;
