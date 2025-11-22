/**
 * Command Router for IPC Bridge
 *
 * Handles @nova and @vibe commands between apps
 * Routes commands to appropriate destination and manages responses
 */

export class CommandRouter {
    constructor() {
        this.pendingCommands = new Map(); // commandId => { resolve, reject, timeout, createdAt, target, origin }
        this.commandTimeout = 30000; // 30 seconds default
    }

    /**
     * Check if message is a command (starts with @nova or @vibe)
     */
    isCommand(message) {
        if (message.type !== 'command_request') return false;

        const text = message.payload?.text || '';
        const explicitTarget = message.payload?.target;

        const validTargets = ['nova', 'vibe', 'desktop-commander-v3'];

        if (explicitTarget && validTargets.includes(explicitTarget)) {
            return text.length > 0;
        }

        return validTargets.some(target => text.startsWith(`@${target} `));
    }

    /**
     * Parse command from message
     */
    parseCommand(message) {
        const rawText = message.payload?.text || '';
        const explicitTarget = message.payload?.target;
        const trimmed = rawText.trim();

        if (!trimmed) {
            return null;
        }

        let target = explicitTarget;
        let commandText = trimmed;

        // Extract target from leading @ mention when explicit target not provided
        if (!target) {
            const targetMatch = trimmed.match(/^@(nova|vibe|desktop-commander-v3)\s+(.+)/i);
            if (!targetMatch) {
                return null;
            }

            target = targetMatch[1].toLowerCase();
            commandText = targetMatch[2];
        }

        if (target !== 'nova' && target !== 'vibe' && target !== 'desktop-commander-v3') {
            return null;
        }

        // Parse command and arguments
        const parts = commandText.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return null;
        }

        const command = parts[0];
        const args = parts.slice(1);

        return {
            target, // 'nova' or 'vibe'
            command, // e.g., 'open', 'analyze', 'create'
            args, // array of arguments
            text: commandText.trim(), // full command text
            originalMessage: message,
            timeoutMs: message.timeoutMs || message.payload?.timeout || this.commandTimeout,
        };
    }

    /**
     * Route command to target app
     * Returns a promise that resolves with the response
     */
    async routeCommand(parsedCommand, clients, senderClientId) {
        const { target, command, args, text, originalMessage, timeoutMs } = parsedCommand;

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
            source: 'bridge',
            target,
            payload: {
                commandId,
                command,
                args,
                text,
                originalSender: senderClientId,
                originalSource: originalMessage.source,
                originalMessageId: originalMessage.messageId,
            },
            timestamp: Date.now(),
            messageId: commandId,
            correlationId: originalMessage.messageId,
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
            }, Math.max(1000, Math.min(timeoutMs || this.commandTimeout, 120000)));

            this.pendingCommands.set(commandId, {
                resolve,
                reject,
                timeout,
                createdAt: Date.now(),
                target,
                origin: {
                    clientId: senderClientId,
                    source: originalMessage.source,
                    messageId: originalMessage.messageId,
                },
                commandId,
            });
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
            pending.resolve({
                result: result ?? null,
                target: pending.target,
                commandId,
            });
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
            type: 'command_result',
            source: 'bridge',
            payload: {
                commandId,
                success,
                result: result || null,
                error: error || null,
            },
            timestamp: Date.now(),
            messageId: `resp-${commandId}`,
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
            if (now - pending.createdAt > this.commandTimeout * 2) {
                clearTimeout(pending.timeout);
                pending.reject?.(new Error('Command cleanup timeout'));
                this.pendingCommands.delete(commandId);
            }
        }
    }
}
