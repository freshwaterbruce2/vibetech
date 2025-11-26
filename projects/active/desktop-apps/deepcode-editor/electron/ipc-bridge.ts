/**
 * IPC Bridge - WebSocket Server for Nova Agent Integration
 * 
 * Enables bidirectional communication between DeepCode Editor (Electron) 
 * and Nova Agent (Tauri) for cross-app commands, file operations, and
 * learning data synchronization.
 * 
 * Protocol: WebSocket on port 5004
 * Message format: JSON with Zod-validated schemas from @vibetech/shared-ipc
 */

import { WebSocketServer, WebSocket } from 'ws';
import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// IPC Message Types (matching shared-ipc schemas)
export enum IPCMessageType {
    // Connection lifecycle
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    PING = 'ping',
    PONG = 'pong',

    // File operations
    FILE_OPEN = 'file:open',
    FILE_OPENED = 'file:opened',
    FILE_CLOSE = 'file:close',

    // Learning + project updates
    LEARNING_SYNC = 'learning:sync',
    LEARNING_EVENT = 'learning_event',
    PROJECT_UPDATE = 'project:update',
    PROJECT_OPEN = 'project:open',
    NOTIFICATION = 'notification',

    // Context updates
    CONTEXT_UPDATE = 'context:update',
    ACTIVITY_SYNC = 'activity:sync',

    // Command routing
    COMMAND_REQUEST = 'command_request',
    COMMAND_EXECUTE = 'command_execute',
    COMMAND_RESULT = 'command_result',
    COMMAND_RESPONSE = 'command_response',

    // Error/ack
    ERROR = 'error',
    ACK = 'ack',
}

interface IPCMessage {
    messageId: string;
    type: IPCMessageType | string;
    timestamp: number;
    source: 'nova' | 'vibe' | 'bridge' | 'desktop-commander-v3';
    target?: 'nova' | 'vibe' | 'bridge' | 'desktop-commander-v3';
    payload?: Record<string, unknown>;
    correlationId?: string;
}

interface ConnectedClient {
    ws: WebSocket;
    id: string;
    source: string;
    connectedAt: number;
    messageCount: number;
    lastPing?: number;
}

interface BridgeStats {
    startedAt: number;
    totalConnections: number;
    totalDisconnections: number;
    totalMessages: number;
    messagesByType: Record<string, number>;
}

class IPCBridge {
    private wss: WebSocketServer | null = null;
    private clients: Map<string, ConnectedClient> = new Map();
    private mainWindow: BrowserWindow | null = null;
    private stats: BridgeStats = {
        startedAt: Date.now(),
        totalConnections: 0,
        totalDisconnections: 0,
        totalMessages: 0,
        messagesByType: {},
    };
    private pingInterval: NodeJS.Timeout | null = null;

    /**
     * Initialize the WebSocket server
     */
    start(port: number = 5004, window: BrowserWindow): void {
        this.mainWindow = window;

        try {
            this.wss = new WebSocketServer({ port });
            console.log(`[IPC Bridge] WebSocket server started on port ${port}`);

            this.wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            this.wss.on('error', (error) => {
                console.error('[IPC Bridge] Server error:', error);
            });

            // Start ping interval for connection health
            this.pingInterval = setInterval(() => {
                this.pingClients();
            }, 30000); // Ping every 30 seconds

            // Register IPC handlers for renderer -> main -> Nova communication
            this.registerElectronIpcHandlers();

        } catch (error) {
            console.error('[IPC Bridge] Failed to start server:', error);
        }
    }

    /**
     * Handle new WebSocket connection
     */
    private handleConnection(ws: WebSocket, req: any): void {
        const clientId = uuidv4();
        const clientIp = req.socket.remoteAddress;

        console.log(`[IPC Bridge] New connection from ${clientIp}, assigned ID: ${clientId}`);

        const client: ConnectedClient = {
            ws,
            id: clientId,
            source: 'unknown',
            connectedAt: Date.now(),
            messageCount: 0,
        };

        this.clients.set(clientId, client);
        this.stats.totalConnections++;

        // Send connection acknowledgment
        this.sendToClient(clientId, {
            messageId: uuidv4(),
            type: IPCMessageType.CONNECT,
            timestamp: Date.now(),
            source: 'vibe',
            payload: {
                clientId,
                serverVersion: '1.0.0',
                capabilities: ['file:open', 'learning:sync', 'command:execute', 'context:update'],
            },
        });

        ws.on('message', (data) => {
            this.handleMessage(clientId, data);
        });

        ws.on('close', () => {
            this.handleDisconnection(clientId);
        });

        ws.on('error', (error) => {
            console.error(`[IPC Bridge] Client ${clientId} error:`, error);
        });

        ws.on('pong', () => {
            const client = this.clients.get(clientId);
            if (client) {
                client.lastPing = Date.now();
            }
        });
    }

    /**
     * Handle incoming WebSocket message
     */
    private handleMessage(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        try {
            const message: IPCMessage = JSON.parse(data.toString());
            client.messageCount++;
            this.stats.totalMessages++;
            this.stats.messagesByType[message.type] = (this.stats.messagesByType[message.type] || 0) + 1;

            // Update client source if provided
            if (message.source && message.source !== 'unknown') {
                client.source = message.source;
            }

            console.log(`[IPC Bridge] Received ${message.type} from ${client.source} (${clientId})`);

            // Route message based on type
            switch (message.type) {
                case IPCMessageType.PING:
                    this.handlePing(clientId, message);
                    break;

                case IPCMessageType.FILE_OPEN:
                    this.handleFileOpen(clientId, message);
                    break;

                case IPCMessageType.LEARNING_SYNC:
                case IPCMessageType.LEARNING_EVENT:
                    this.handleLearningEvent(clientId, message);
                    break;

                case IPCMessageType.CONTEXT_UPDATE:
                    this.handleContextUpdate(clientId, message);
                    break;

                case IPCMessageType.ACTIVITY_SYNC:
                    this.handleActivitySync(clientId, message);
                    break;

                case IPCMessageType.COMMAND_REQUEST:
                case IPCMessageType.COMMAND_EXECUTE:
                    this.handleCommandRequest(clientId, message);
                    break;

                case IPCMessageType.COMMAND_RESULT:
                case IPCMessageType.COMMAND_RESPONSE:
                    this.handleCommandResult(clientId, message);
                    break;

                case IPCMessageType.PROJECT_OPEN:
                    this.handleProjectOpen(clientId, message);
                    break;

                default:
                    // Forward unknown messages to renderer for handling
                    this.forwardToRenderer('ipc:message', message);
            }

            // Send ACK for all messages
            this.sendToClient(clientId, {
                messageId: uuidv4(),
                type: IPCMessageType.ACK,
                timestamp: Date.now(),
                source: 'vibe',
                correlationId: message.messageId,
                payload: { messageId: message.messageId },
            });

        } catch (error) {
            console.error(`[IPC Bridge] Failed to parse message from ${clientId}:`, error);
            this.sendError(clientId, 'PARSE_ERROR', 'Failed to parse message');
        }
    }

    /**
     * Handle ping/pong for connection health
     */
    private handlePing(clientId: string, message: IPCMessage): void {
        this.sendToClient(clientId, {
            messageId: uuidv4(),
            type: IPCMessageType.PONG,
            timestamp: Date.now(),
            source: 'vibe',
            correlationId: message.messageId,
        });
    }

    /**
     * Handle file open request from Nova
     */
    private handleFileOpen(clientId: string, message: IPCMessage): void {
        const payload = message.payload as { filePath: string; line?: number; column?: number };

        if (!payload?.filePath) {
            this.sendError(clientId, 'INVALID_PAYLOAD', 'filePath is required');
            return;
        }

        console.log(`[IPC Bridge] Opening file: ${payload.filePath} at line ${payload.line || 1}`);

        // Forward to renderer to open in Monaco editor
        this.forwardToRenderer('ipc:file-open', {
            filePath: payload.filePath,
            line: payload.line || 1,
            column: payload.column || 1,
        });

        // Send confirmation
        this.sendToClient(clientId, {
            messageId: uuidv4(),
            type: IPCMessageType.FILE_OPENED,
            timestamp: Date.now(),
            source: 'vibe',
            correlationId: message.messageId,
            payload: { filePath: payload.filePath, success: true },
        });
    }

    /**
     * Handle learning event from Nova
     */
    private handleLearningEvent(clientId: string, message: IPCMessage): void {
        // Forward learning events to renderer for UI updates
        this.forwardToRenderer('ipc:learning-event', message.payload);

        // Broadcast to other connected clients (e.g., desktop-commander)
        this.broadcastExcept(clientId, message);
    }

    /**
     * Handle context update from Nova
     */
    private handleContextUpdate(clientId: string, message: IPCMessage): void {
        // Forward context updates to renderer
        this.forwardToRenderer('ipc:context-update', message.payload);
    }

    /**
     * Handle activity sync from Nova
     */
    private handleActivitySync(clientId: string, message: IPCMessage): void {
        // Forward activity data to renderer for analytics display
        this.forwardToRenderer('ipc:activity-sync', message.payload);
    }

    /**
     * Handle command request (e.g., @vibe commands from Nova)
     */
    private handleCommandRequest(clientId: string, message: IPCMessage): void {
        const payload = message.payload as { text: string; target?: string; context?: Record<string, unknown> };

        if (!payload?.text) {
            this.sendError(clientId, 'INVALID_PAYLOAD', 'Command text is required');
            return;
        }

        console.log(`[IPC Bridge] Command request: ${payload.text}`);

        // Forward to renderer for AI processing
        this.forwardToRenderer('ipc:command-request', {
            commandId: message.messageId,
            text: payload.text,
            context: payload.context,
            source: message.source,
        });
    }

    /**
     * Handle command result (response from Nova)
     */
    private handleCommandResult(clientId: string, message: IPCMessage): void {
        // Forward result to renderer
        this.forwardToRenderer('ipc:command-result', message.payload);
    }

    /**
     * Handle project open request
     */
    private handleProjectOpen(clientId: string, message: IPCMessage): void {
        const payload = message.payload as { projectPath: string };

        if (!payload?.projectPath) {
            this.sendError(clientId, 'INVALID_PAYLOAD', 'projectPath is required');
            return;
        }

        // Forward to renderer to update file explorer
        this.forwardToRenderer('ipc:project-open', { projectPath: payload.projectPath });
    }

    /**
     * Handle client disconnection
     */
    private handleDisconnection(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            console.log(`[IPC Bridge] Client ${client.source} (${clientId}) disconnected`);
            this.clients.delete(clientId);
            this.stats.totalDisconnections++;

            // Notify renderer of disconnection
            this.forwardToRenderer('ipc:client-disconnected', {
                clientId,
                source: client.source,
            });
        }
    }

    /**
     * Ping all clients to check connection health
     */
    private pingClients(): void {
        const now = Date.now();
        const timeout = 60000; // 60 seconds timeout

        for (const [clientId, client] of this.clients) {
            if (client.lastPing && now - client.lastPing > timeout) {
                console.log(`[IPC Bridge] Client ${clientId} timed out, closing connection`);
                client.ws.terminate();
                this.clients.delete(clientId);
                continue;
            }

            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.ping();
            }
        }
    }

    /**
     * Send message to specific client
     */
    private sendToClient(clientId: string, message: IPCMessage): void {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Send error message to client
     */
    private sendError(clientId: string, code: string, message: string): void {
        this.sendToClient(clientId, {
            messageId: uuidv4(),
            type: IPCMessageType.ERROR,
            timestamp: Date.now(),
            source: 'vibe',
            payload: { code, message },
        });
    }

    /**
     * Broadcast message to all clients except sender
     */
    private broadcastExcept(excludeClientId: string, message: IPCMessage): void {
        for (const [clientId, client] of this.clients) {
            if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        }
    }

    /**
     * Broadcast message to all clients
     */
    broadcast(message: IPCMessage): void {
        for (const [_, client] of this.clients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        }
    }

    /**
     * Send message to Nova Agent specifically
     */
    sendToNova(message: Omit<IPCMessage, 'source'>): void {
        const fullMessage: IPCMessage = {
            ...message,
            source: 'vibe',
            target: 'nova',
        };

        for (const [_, client] of this.clients) {
            if (client.source === 'nova' && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(fullMessage));
                return;
            }
        }

        console.warn('[IPC Bridge] No Nova client connected to send message');
    }

    /**
     * Forward message to Electron renderer process
     */
    private forwardToRenderer(channel: string, data: any): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    /**
     * Register Electron IPC handlers for renderer -> Nova communication
     */
    private registerElectronIpcHandlers(): void {
        // Send command to Nova
        ipcMain.handle('nova:sendCommand', async (event, command: string, context?: Record<string, unknown>) => {
            const message: IPCMessage = {
                messageId: uuidv4(),
                type: IPCMessageType.COMMAND_REQUEST,
                timestamp: Date.now(),
                source: 'vibe',
                target: 'nova',
                payload: { text: command, context },
            };

            this.sendToNova(message);
            return { success: true, messageId: message.messageId };
        });

        // Send file opened notification to Nova
        ipcMain.handle('nova:fileOpened', async (event, filePath: string, content?: string) => {
            const message: IPCMessage = {
                messageId: uuidv4(),
                type: IPCMessageType.FILE_OPENED,
                timestamp: Date.now(),
                source: 'vibe',
                target: 'nova',
                payload: { filePath, hasContent: !!content },
            };

            this.sendToNova(message);
            return { success: true };
        });

        // Send learning event to Nova
        ipcMain.handle('nova:sendLearningEvent', async (event, eventType: string, data: Record<string, unknown>) => {
            const message: IPCMessage = {
                messageId: uuidv4(),
                type: IPCMessageType.LEARNING_EVENT,
                timestamp: Date.now(),
                source: 'vibe',
                target: 'nova',
                payload: { eventType, data, source: 'vibe' },
            };

            this.sendToNova(message);
            return { success: true };
        });

        // Get bridge stats
        ipcMain.handle('ipc:getStats', async () => {
            return {
                ...this.stats,
                uptime: Date.now() - this.stats.startedAt,
                activeConnections: this.clients.size,
                clients: Array.from(this.clients.values()).map(c => ({
                    id: c.id,
                    source: c.source,
                    connectedAt: c.connectedAt,
                    messageCount: c.messageCount,
                })),
            };
        });

        // Check if Nova is connected
        ipcMain.handle('ipc:isNovaConnected', async () => {
            for (const [_, client] of this.clients) {
                if (client.source === 'nova' && client.ws.readyState === WebSocket.OPEN) {
                    return true;
                }
            }
            return false;
        });
    }

    /**
     * Stop the WebSocket server
     */
    stop(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        // Close all client connections
        for (const [_, client] of this.clients) {
            client.ws.close(1000, 'Server shutting down');
        }
        this.clients.clear();

        if (this.wss) {
            this.wss.close();
            this.wss = null;
            console.log('[IPC Bridge] WebSocket server stopped');
        }
    }

    /**
     * Get current stats
     */
    getStats(): BridgeStats & { activeConnections: number } {
        return {
            ...this.stats,
            activeConnections: this.clients.size,
        };
    }
}

// Export singleton instance
export const ipcBridge = new IPCBridge();
export default ipcBridge;
