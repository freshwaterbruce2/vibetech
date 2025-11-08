/**
 * WebSocket Bridge
 *
 * Real-time communication bridge between NOVA Agent and Vibe Code Studio
 * Uses WebSocket on port 5004 for bidirectional messaging
 */

import type { IPCMessage, IPCMessageType } from './messages';
import { isValidIPCMessage } from './messages';

export type MessageHandler = (message: IPCMessage) => void | Promise<void>;

export interface WebSocketBridgeConfig {
  port: number;
  host?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketBridge {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketBridgeConfig>;
  private handlers: Map<IPCMessageType, Set<MessageHandler>> = new Map();
  private globalHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private connected = false;
  private appSource: 'nova' | 'vibe';

  constructor(appSource: 'nova' | 'vibe', config: Partial<WebSocketBridgeConfig> = {}) {
    this.appSource = appSource;
    this.config = {
      port: config.port || 5004,
      host: config.host || 'localhost',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
    };
  }

  /**
   * Connect to the WebSocket bridge
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      const url = `ws://${this.config.host}:${this.config.port}`;
      console.log(`[WebSocketBridge] Connecting to ${url}...`);

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WebSocketBridge] Connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocketBridge] Error:', error);
          if (!this.connected) {
            reject(error);
          }
        };

        this.ws.onclose = () => {
          console.log('[WebSocketBridge] Disconnected');
          this.connected = false;
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[WebSocketBridge] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket bridge
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message through the bridge
   */
  send(message: IPCMessage): void {
    if (!this.isConnected()) {
      console.warn('[WebSocketBridge] Not connected, message not sent:', message.type);
      return;
    }

    try {
      const json = JSON.stringify(message);
      this.ws!.send(json);
    } catch (error) {
      console.error('[WebSocketBridge] Failed to send message:', error);
    }
  }

  /**
   * Register a handler for a specific message type
   */
  on(type: IPCMessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  /**
   * Register a global handler for all messages
   */
  onAny(handler: MessageHandler): void {
    this.globalHandlers.add(handler);
  }

  /**
   * Unregister a handler
   */
  off(type: IPCMessageType, handler: MessageHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  /**
   * Unregister a global handler
   */
  offAny(handler: MessageHandler): void {
    this.globalHandlers.delete(handler);
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      if (!isValidIPCMessage(message)) {
        console.warn('[WebSocketBridge] Invalid message received:', message);
        return;
      }

      // Don't process messages from ourselves
      if (message.source === this.appSource) {
        return;
      }

      console.log(`[WebSocketBridge] Received ${message.type} from ${message.source}`);

      // Call type-specific handlers
      const typeHandlers = this.handlers.get(message.type);
      if (typeHandlers) {
        for (const handler of typeHandlers) {
          try {
            await handler(message);
          } catch (error) {
            console.error(`[WebSocketBridge] Handler error for ${message.type}:`, error);
          }
        }
      }

      // Call global handlers
      for (const handler of this.globalHandlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error('[WebSocketBridge] Global handler error:', error);
        }
      }
    } catch (error) {
      console.error('[WebSocketBridge] Failed to parse message:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocketBridge] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocketBridge] Reconnecting in ${this.config.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocketBridge] Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }
}
