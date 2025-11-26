/**
 * IPC Bridge Client for DeepCode Editor
 * Connects to the central backend/ipc-bridge server (ws://127.0.0.1:5004)
 *
 * Architecture:
 * - One server: backend/ipc-bridge on port 5004
 * - Two desktop clients: DeepCode Editor (Electron) + Nova Agent (Tauri)
 * - Shared: WebSocket message protocol + D:\databases\agent_learning.db
 */

import { BrowserWindow, ipcMain } from 'electron';
import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import {
    IPCMessageType,
    isValidIPCMessage,
    type IPCMessage,
    type AppSource,
} from '@vibetech/shared-ipc';

const IPC_URL = 'ws://127.0.0.1:5004';
const SOURCE: AppSource = 'deepcode';

// Reconnection configuration
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;

let ws: WebSocket | null = null;
let mainWindow: BrowserWindow | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isIntentionallyClosed = false;
const connectionState: { connected: boolean; lastConnectedAt?: number; lastError?: string } = {
    connected: false,
};

const forwardToRenderer = (channel: string, data: unknown) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
};

/**
 * Attempt to reconnect to the IPC bridge with exponential backoff
 */
function scheduleReconnect() {
    if (isIntentionallyClosed) return;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('[DeepCode IPC] Max reconnect attempts reached, giving up');
        return;
    }

    const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts);
    reconnectAttempts++;

    console.log(
        `[DeepCode IPC] Scheduling reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`,
    );

    reconnectTimeout = setTimeout(() => {
        if (mainWindow && !isIntentionallyClosed) {
            connectToServer();
        }
    }, delay);
}

/**
 * Connect to the IPC bridge server
 */
function connectToServer() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    try {
        ws = new WebSocket(IPC_URL);

        ws.on('open', () => {
            console.log('[DeepCode IPC] Connected to bridge', IPC_URL);
            reconnectAttempts = 0; // Reset on successful connection
            connectionState.connected = true;
            connectionState.lastConnectedAt = Date.now();
            connectionState.lastError = undefined;

            // Send identification message using shared protocol
            const identifyMsg = {
                type: IPCMessageType.IDENTIFY,
                source: SOURCE,
                payload: {
                    name: 'DeepCode Editor',
                    version: '1.0.0',
                    capabilities: ['file-editing', 'code-analysis', 'agent-mode', 'task-management'],
                },
                timestamp: Date.now(),
                messageId: randomUUID(),
                version: '1.0.0',
            };
            ws?.send(JSON.stringify(identifyMsg));

            forwardToRenderer('ipc-bridge:status', { connected: true });
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(String(data));

                // Validate message using shared schema
                if (!isValidIPCMessage(msg)) {
                    console.warn('[DeepCode IPC] Received invalid message format, forwarding anyway');
                }

                // Forward all messages to renderer
                forwardToRenderer('ipc-bridge:message', msg);

                // Handle specific message types in main process if needed
                handleIncomingMessage(msg as IPCMessage);
            } catch (e) {
                console.error('[DeepCode IPC] Failed to parse message', e);
            }
        });

        ws.on('close', (code, reason) => {
            console.log('[DeepCode IPC] Disconnected from bridge', code, reason.toString());
            ws = null;
            connectionState.connected = false;

            forwardToRenderer('ipc-bridge:status', { connected: false });

            // Attempt reconnection
            scheduleReconnect();
        });

        ws.on('error', (err) => {
            console.error('[DeepCode IPC] WebSocket error', err.message);
            connectionState.lastError = err.message;
            // Error will be followed by close event, which triggers reconnect
        });
    } catch (err) {
        console.error('[DeepCode IPC] Failed to create WebSocket', err);
        connectionState.lastError = (err as Error).message;
        scheduleReconnect();
    }
}

/**
 * Handle incoming messages that need main process action
 */
function handleIncomingMessage(msg: IPCMessage) {
    switch (msg.type) {
        case IPCMessageType.FILE_OPEN:
            forwardToRenderer('ipc:file-open', msg.payload);
            break;
        case IPCMessageType.COMMAND_REQUEST:
            forwardToRenderer('ipc:command-request', {
                commandId: msg.messageId,
                text: (msg.payload as any)?.text,
                context: (msg.payload as any)?.context,
                source: msg.source,
            });
            break;
        case IPCMessageType.COMMAND_RESULT:
        case IPCMessageType.COMMAND_RESPONSE:
            forwardToRenderer('ipc:command-result', msg.payload);
            break;
        case IPCMessageType.LEARNING_SYNC:
        case IPCMessageType.LEARNING_EVENT:
            forwardToRenderer('ipc:learning-event', msg.payload);
            break;
        case IPCMessageType.CONTEXT_UPDATE:
            forwardToRenderer('ipc:context-update', msg.payload);
            break;
        case IPCMessageType.FILE_CHANGED:
            forwardToRenderer('ipc:file-changed', msg.payload);
            break;
        case IPCMessageType.TASK_STARTED:
        case IPCMessageType.TASK_STOPPED:
        case IPCMessageType.TASK_PROGRESS:
        case IPCMessageType.TASK_ACTIVITY:
        case IPCMessageType.TASK_INSIGHTS:
            forwardToRenderer('ipc:task-event', msg);
            break;
        default:
            break;
    }
}

/**
 * Start the IPC bridge client
 */
export function startIpcBridge(window: BrowserWindow) {
    mainWindow = window;
    isIntentionallyClosed = false;
    reconnectAttempts = 0;

    // Connect to the server
    connectToServer();

    // Handle send requests from renderer
    ipcMain.handle('ipc-bridge:send', (_event, message: Record<string, unknown>) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('[DeepCode IPC] Cannot send, socket not open');
            return { success: false, error: 'Not connected to IPC bridge' };
        }

        const withDefaults = {
            timestamp: Date.now(),
            messageId: (message['messageId'] as string) ?? randomUUID(),
            source: SOURCE,
            version: '1.0.0',
            ...message,
        };

        try {
            ws.send(JSON.stringify(withDefaults));
            return { success: true, messageId: withDefaults.messageId };
        } catch (err) {
            console.error('[DeepCode IPC] Failed to send message', err);
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('ipc-bridge:getStatus', () => ({
        ...connectionState,
        reconnectAttempts,
        url: IPC_URL,
    }));

    // Handle connection status queries
    ipcMain.handle('ipc-bridge:isConnected', () => {
        return ws !== null && ws.readyState === WebSocket.OPEN;
    });

    // Handle manual reconnect requests
    ipcMain.handle('ipc-bridge:reconnect', () => {
        if (ws) {
            ws.close();
            ws = null;
        }
        reconnectAttempts = 0;
        isIntentionallyClosed = false;
        connectToServer();
        return { success: true };
    });

    // Back-compat Nova helpers for renderer
    ipcMain.handle('nova:sendCommand', (_event, command: string, context?: Record<string, unknown>) => {
        const ok = sendMessage(IPCMessageType.COMMAND_REQUEST, { text: command, context }, 'nova');
        return { success: ok };
    });

    ipcMain.handle('nova:fileOpened', (_event, filePath: string, content?: string) => {
        const ok = sendMessage(
            IPCMessageType.FILE_OPENED,
            { filePath, hasContent: Boolean(content) },
            'nova',
        );
        return { success: ok };
    });

    ipcMain.handle('nova:sendLearningEvent', (_event, eventType: string, data: Record<string, unknown>) => {
        const ok = sendMessage(
            IPCMessageType.LEARNING_EVENT,
            { eventType, data, source: SOURCE },
            'nova',
        );
        return { success: ok };
    });

    ipcMain.handle('ipc:getStats', () => ({
        ...connectionState,
        reconnectAttempts,
        url: IPC_URL,
    }));

    ipcMain.handle('ipc:isNovaConnected', () => ws !== null && ws.readyState === WebSocket.OPEN);
}

/**
 * Stop the IPC bridge client
 */
export function stopIpcBridge() {
    isIntentionallyClosed = true;

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (ws) {
        ws.close(1000, 'DeepCode Editor closing');
        ws = null;
    }

    // Remove IPC handlers
    ipcMain.removeHandler('ipc-bridge:send');
    ipcMain.removeHandler('ipc-bridge:getStatus');
    ipcMain.removeHandler('ipc-bridge:isConnected');
    ipcMain.removeHandler('ipc-bridge:reconnect');
    ipcMain.removeHandler('nova:sendCommand');
    ipcMain.removeHandler('nova:fileOpened');
    ipcMain.removeHandler('nova:sendLearningEvent');
    ipcMain.removeHandler('ipc:getStats');
    ipcMain.removeHandler('ipc:isNovaConnected');

    console.log('[DeepCode IPC] Bridge client stopped');
}

/**
 * Send a message to the IPC bridge (for use from main process)
 */
export function sendMessage(type: string, payload: unknown, target?: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('[DeepCode IPC] Cannot send, socket not open');
        return false;
    }

    const message = {
        type,
        source: SOURCE,
        payload,
        target,
        timestamp: Date.now(),
        messageId: randomUUID(),
        version: '1.0.0',
    };

    ws.send(JSON.stringify(message));
    return true;
}

/**
 * Check if connected to the IPC bridge
 */
export function isConnected(): boolean {
    return ws !== null && ws.readyState === WebSocket.OPEN;
}
