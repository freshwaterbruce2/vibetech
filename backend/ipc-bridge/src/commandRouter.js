/**
 * Command Router for IPC Bridge
 *
 * Handles @nova and @vibe commands between apps
 * Routes commands to appropriate destination and manages responses
 */

export class CommandRouter {
    constructor() {
        this.pendingCommands = new Map(); // commandId => { resolve, reject, timeout }
        this.commandTimeout = 30000; // 30 seconds
    }

    /**
     * Check if message is a command (starts with @nova or @vibe)
     */
    isCommand(message) {
        if (message.type !== 'command_request') return false;

        const text = message.payload?.text || '';
        return text.startsWith('@nova ') || text.startsWith('@vibe ');
    }

    /**
     * Parse command from message
     */
    parseCommand(message) {
        const text = message.payload?.text || '';

        // Extract target (@nova or @vibe)
        const targetMatch = text.match(/^@(nova|vibe)\s+(.+)/);
        if (!targetMatch) {
            return null;
        }

        const [, target, commandText] = targetMatch;

        // Parse command and arguments
        const parts = commandText.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        return {
            target, // 'nova' or 'vibe'
            command, // e.g., 'open', 'analyze', 'create'
            args, // array of arguments
            text: commandText.trim(), // full command text
            originalMessage: message
        };
    }

    /**
     * Route command to target app
     * Returns a promise that resolves with the response
     */
    async routeCommand(parsedCommand, clients, senderClientId) {
        const { target, command, args, text, originalMessage } = parsedCommand;

        // Find target client(s)
        const targetClients = Array.from(clients.entries())
            .filter(([clientId, client]) => {
                return client.source === target && clientId !== senderClientId;
            });

        if (targetClients.length === 0) {
            throw new Error(`No ${target} clients connected`);
        }

        // Create command request message
        const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const commandMessage = {
            type: 'command_execute',
            source: originalMessage.source,
            target,
            payload: {
                commandId,
                command,
                args,
                text,
                originalSender: senderClientId
            },
            timestamp: Date.now(),
            messageId: commandId
        };

        // Send to target client(s)
        const sent = [];
        for (const [clientId, client] of targetClients) {
            if (client.ws.readyState === 1) { // WebSocket.OPEN
                try {
                    client.ws.send(JSON.stringify(commandMessage));
                    sent.push(clientId);
                } catch (error) {
                    console.error(`Failed to send command to ${clientId}:`, error.message);
                }
            }
        }

        if (sent.length === 0) {
            throw new Error(`Failed to send command to ${target}`);
        }

        // Wait for response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingCommands.delete(commandId);
                reject(new Error(`Command timeout: ${target} ${command}`));
            }, this.commandTimeout);

            this.pendingCommands.set(commandId, { resolve, reject, timeout });
        });
    }

    /**
     * Handle command response from target app
     */
    handleCommandResponse(message) {
        const { commandId, success, result, error } = message.payload || {};

        const pending = this.pendingCommands.get(commandId);
        if (!pending) {
            console.warn(`Received response for unknown command: ${commandId}`);
            return false;
        }

        // Clear timeout
        clearTimeout(pending.timeout);
        this.pendingCommands.delete(commandId);

        // Resolve or reject
        if (success) {
            pending.resolve(result);
        } else {
            pending.reject(new Error(error || 'Command failed'));
        }

        return true;
    }

    /**
     * Send command response back to original sender
     */
    sendCommandResponse(clients, originalSenderClientId, commandId, success, result, error) {
        const client = clients.get(originalSenderClientId);
        if (!client || client.ws.readyState !== 1) {
            console.warn(`Cannot send response to disconnected client: ${originalSenderClientId}`);
            return;
        }

        const responseMessage = {
            type: 'command_response',
            source: 'bridge',
            payload: {
                commandId,
                success,
                result: result || null,
                error: error || null
            },
            timestamp: Date.now(),
            messageId: `resp-${commandId}`
        };

        try {
            client.ws.send(JSON.stringify(responseMessage));
        } catch (error) {
            console.error(`Failed to send command response:`, error.message);
        }
    }

    /**
     * Get command statistics
     */
    getStats() {
        return {
            pendingCommands: this.pendingCommands.size,
            commandTimeout: this.commandTimeout
        };
    }

    /**
     * Cleanup timed out commands
     */
    cleanup() {
        const now = Date.now();
        for (const [commandId, pending] of this.pendingCommands.entries()) {
            // If timeout has passed, clean up
            // (timeout handler will have already rejected the promise)
        }
    }
}
