/**
 * IPC Connection Manager
 *
 * Handles WebSocket connection lifecycle:
 * - Connection establishment
 * - Automatic reconnection with exponential backoff
 * - Ping/pong health checks
 * - Connection status tracking
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { logger } from '../Logger';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionOptions {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
}

export class IPCConnectionManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private lastPingTime: number = 0;

  constructor(private options: ConnectionOptions) {
    super();
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.status === 'connecting' || this.status === 'connected') {
      logger.debug('[IPC ConnectionManager] Already connected or connecting');
      return;
    }

    this.setStatus('connecting');
    logger.info(`[IPC ConnectionManager] Connecting to ${this.options.url}...`);

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onmessage = (event) => this.handleMessage(event);
    } catch (error) {
      logger.error('[IPC ConnectionManager] WebSocket connection failed:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    logger.info('[IPC ConnectionManager] Disconnecting...');

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
   * Send raw message through WebSocket
   */
  public send(data: string): boolean {
    if (this.status !== 'connected' || !this.ws) {
      return false;
    }

    try {
      this.ws.send(data);
      return true;
    } catch (error) {
      logger.error('[IPC ConnectionManager] Failed to send:', error);
      return false;
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get time since last ping (in milliseconds)
   */
  public getTimeSinceLastPing(): number | null {
    if (!this.lastPingTime) return null;
    return Date.now() - this.lastPingTime;
  }

  // Private Methods

  private handleOpen(): void {
    logger.info('[IPC ConnectionManager] ✓ Connected');
    this.reconnectAttempts = 0;
    this.setStatus('connected');
    this.startPing();
    this.emit('connected');
  }

  private handleClose(event: CloseEvent): void {
    logger.info(`[IPC ConnectionManager] Disconnected (code: ${event.code})`);
    this.stopPing();
    this.setStatus('disconnected');
    this.emit('disconnected', event);

    // Don't reconnect if it was a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    logger.error('[IPC ConnectionManager] WebSocket error:', error);
    this.setStatus('error');
    this.emit('error', error);
  }

  private handleMessage(event: MessageEvent): void {
    // Update last ping time for any received message
    this.lastPingTime = Date.now();
    this.emit('message', event.data);
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;

    this.status = status;
    this.emit('status', status);
    logger.info(`[IPC ConnectionManager] Status changed: ${status}`);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      logger.warn('[IPC ConnectionManager] Max reconnect attempts reached');
      return;
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000
    );

    logger.info(
      `[IPC ConnectionManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.options.maxReconnectAttempts})`
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.pingTimer = window.setInterval(() => {
      if (this.status === 'connected') {
        this.emit('ping');
      }
    }, this.options.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
