/**
 * IPC Bridge WebSocket Server
 *
 * Facilitates real-time communication between NOVA Agent and Vibe Code Studio
 * Runs on port 5004
 */

import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 5004;

class IPCBridgeServer {
    constructor(port) {
        this.port = port;
        this.wss = null;
        this.clients = new Map(); // clientId => { ws, source, lastSeen }
        this.messageLog = []; // Keep last 100 messages for debugging
        this.stats = {
            totalMessages: 0,
            messagesByType: {},
            clientConnections: 0,
            clientDisconnections: 0
        };
    }

    start() {
        this.wss = new WebSocketServer({ port: this.port });

        console.log(`\n🌉 IPC Bridge Server starting on port ${this.port}...`);

        this.wss.on('connection', (ws, req) => {
            const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const clientIp = req.socket.remoteAddress;

            console.log(`\n✅ New connection: ${clientId} from ${clientIp}`);
            this.stats.clientConnections++;

            // Store client info
            this.clients.set(clientId, {
                ws,
                source: null, // Will be determined from first message
                lastSeen: Date.now(),
                messageCount: 0
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                clientId,
                timestamp: Date.now(),
                message: 'Connected to IPC Bridge'
            }));

            ws.on('message', (data) => {
                this.handleMessage(clientId, data.toString());
            });

            ws.on('close', () => {
                console.log(`\n❌ Client disconnected: ${clientId}`);
                this.stats.clientDisconnections++;
                this.clients.delete(clientId);
                this.broadcastStats();
            });

            ws.on('error', (error) => {
                console.error(`\n⚠️  Client error (${clientId}):`, error.message);
            });

            // Send stats to new client
            this.sendStats(clientId);
        });

        this.wss.on('error', (error) => {
            console.error('\n❌ WebSocket server error:', error);
        });

        console.log(`\n✅ IPC Bridge Server listening on ws://localhost:${this.port}`);
        console.log(`\nReady to bridge NOVA Agent ↔ Vibe Code Studio\n`);

        // Periodic stats broadcast
        setInterval(() => {
            this.broadcastStats();
        }, 30000); // Every 30 seconds
    }

    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.lastSeen = Date.now();
        client.messageCount++;

        try {
            const message = JSON.parse(data);

            // Validate message structure
            if (!this.isValidMessage(message)) {
                console.warn(`\n⚠️  Invalid message from ${clientId}:`, message);
                return;
            }

            // Update client source if not set
            if (!client.source && message.source) {
                client.source = message.source;
                console.log(`\n📱 ${clientId} identified as: ${message.source.toUpperCase()}`);
            }

            // Log message
            const logEntry = {
                timestamp: Date.now(),
                clientId,
                source: message.source,
                type: message.type,
                messageId: message.messageId
            };

            this.messageLog.push(logEntry);
            if (this.messageLog.length > 100) {
                this.messageLog.shift();
            }

            // Update stats
            this.stats.totalMessages++;
            this.stats.messagesByType[message.type] = (this.stats.messagesByType[message.type] || 0) + 1;

            console.log(`\n📨 [${message.source}] ${message.type} → broadcasting to other clients`);

            // Broadcast to all other clients (except sender)
            this.broadcast(message, clientId);

        } catch (error) {
            console.error(`\n❌ Failed to parse message from ${clientId}:`, error.message);
        }
    }

    isValidMessage(message) {
        return (
            typeof message === 'object' &&
            message !== null &&
            typeof message.type === 'string' &&
            message.payload !== undefined &&
            typeof message.timestamp === 'number' &&
            (message.source === 'nova' || message.source === 'vibe') &&
            typeof message.messageId === 'string'
        );
    }

    broadcast(message, senderClientId) {
        let sentCount = 0;

        for (const [clientId, client] of this.clients.entries()) {
            // Don't send back to sender
            if (clientId === senderClientId) continue;

            // Don't send to clients with same source
            if (client.source === message.source) continue;

            if (client.ws.readyState === 1) { // WebSocket.OPEN
                try {
                    client.ws.send(JSON.stringify(message));
                    sentCount++;
                } catch (error) {
                    console.error(`\n⚠️  Failed to send to ${clientId}:`, error.message);
                }
            }
        }

        if (sentCount > 0) {
            console.log(`   ✓ Broadcasted to ${sentCount} client(s)`);
        }
    }

    broadcastStats() {
        const stats = this.getStats();
        const statsMessage = {
            type: 'bridge_stats',
            payload: stats,
            timestamp: Date.now(),
            source: 'bridge',
            messageId: `bridge-${Date.now()}`
        };

        for (const [clientId, client] of this.clients.entries()) {
            if (client.ws.readyState === 1) {
                try {
                    client.ws.send(JSON.stringify(statsMessage));
                } catch (error) {
                    // Ignore errors for stats broadcast
                }
            }
        }
    }

    sendStats(clientId) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== 1) return;

        const stats = this.getStats();
        const statsMessage = {
            type: 'bridge_stats',
            payload: stats,
            timestamp: Date.now(),
            source: 'bridge',
            messageId: `bridge-${Date.now()}`
        };

        try {
            client.ws.send(JSON.stringify(statsMessage));
        } catch (error) {
            // Ignore errors
        }
    }

    getStats() {
        const activeClients = [];
        for (const [clientId, client] of this.clients.entries()) {
            activeClients.push({
                id: clientId,
                source: client.source || 'unknown',
                messageCount: client.messageCount,
                connected: Date.now() - (client.lastSeen - client.messageCount * 100) // Rough estimate
            });
        }

        return {
            server: {
                uptime: process.uptime(),
                port: this.port
            },
            connections: {
                active: this.clients.size,
                total: this.stats.clientConnections,
                disconnections: this.stats.clientDisconnections
            },
            messages: {
                total: this.stats.totalMessages,
                byType: this.stats.messagesByType,
                recentCount: this.messageLog.length
            },
            clients: activeClients
        };
    }
}

// Start the server
const server = new IPCBridgeServer(PORT);
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down IPC Bridge Server...');
    if (server.wss) {
        server.wss.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down IPC Bridge Server...');
    if (server.wss) {
        server.wss.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
