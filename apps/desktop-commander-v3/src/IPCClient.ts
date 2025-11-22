import WebSocket from 'ws';
import { logger } from './Logger';
import { IPCMessage, IPCMessageType, CommandRequestPayload, CommandResultPayload } from '@vibetech/shared-ipc';

export class IPCClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private shouldReconnect = true;
  private commandHandler: (payload: CommandRequestPayload, messageId: string) => Promise<void>;

  constructor(url: string = 'ws://localhost:5004', commandHandler: (payload: CommandRequestPayload, messageId: string) => Promise<void>) {
    this.url = url;
    this.commandHandler = commandHandler;
  }

  public connect(): void {
    logger.info(`Connecting to IPC Bridge at ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      logger.info('Connected to IPC Bridge');
      this.reconnectAttempts = 0;
      
      // Register as desktop-commander-v3
      // The bridge expects a handshake or just usage of the correct source in messages
      // We'll send a ping to announce ourselves if needed, but usually source is enough
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message: IPCMessage = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        logger.error('Failed to parse IPC message', error);
      }
    });

    this.ws.on('close', () => {
      logger.info('Disconnected from IPC Bridge');
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  }

  private handleMessage(message: IPCMessage): void {
    logger.debug('Received message type:', message.type);

    if (message.type === IPCMessageType.COMMAND_EXECUTE) {
        // Cast payload to CommandRequestPayload (it might be wrapped or slightly different in EXECUTE vs REQUEST)
        // In shared-ipc, COMMAND_EXECUTE usually carries the original request details
        const payload = message.payload as any; // CommandExecutePayload
        
        // Verify it's for us (though Bridge handles routing, double check is good)
        // Actually, if it's routed here, it's for us.
        
        if (payload.command) {
             // This looks like the processed command structure from Vibe/Nova
             // We need to map it to our internal handler
             const requestPayload: CommandRequestPayload = {
                 text: payload.text || payload.command, // Fallback
                 target: 'desktop-commander-v3',
                 context: payload.context,
                 metadata: payload.metadata
             };
             this.commandHandler(requestPayload, message.messageId || 'unknown');
        } else {
             // Raw request
             this.commandHandler(message.payload as CommandRequestPayload, message.messageId || 'unknown');
        }
    }
  }

  public send(message: IPCMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Ensure source is set
      const msgWithSource = { ...message, source: 'desktop-commander-v3' };
      this.ws.send(JSON.stringify(msgWithSource));
      logger.debug('Sent message:', message.type);
    } else {
      logger.warn('Cannot send message: Disconnected');
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached. Exiting.');
      process.exit(1);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    logger.info(`Reconnecting in ${delay}ms...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}
