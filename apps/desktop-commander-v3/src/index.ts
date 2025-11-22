import { IPCClient } from './IPCClient';
import { CommandExecutor } from './CommandExecutor';
import { logger } from './Logger';
import { IPCMessageType, CommandResultPayload } from '@vibetech/shared-ipc';

const executor = new CommandExecutor();

const client = new IPCClient('ws://localhost:5004', async (payload, messageId) => {
    try {
        logger.debug('Processing command request:', payload);
        const result = await executor.execute(payload);
        
        // Send success response
        client.send({
            type: IPCMessageType.COMMAND_RESULT,
            payload: {
                commandId: messageId, // Correlate with request
                success: true,
                result: result
            } as CommandResultPayload,
            timestamp: Date.now(),
            messageId: `res-${Date.now()}`,
            source: 'desktop-commander-v3' // redundant but safe
        });
        
    } catch (error) {
        // Send error response
        client.send({
            type: IPCMessageType.COMMAND_RESULT,
            payload: {
                commandId: messageId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            } as CommandResultPayload,
            timestamp: Date.now(),
            messageId: `err-${Date.now()}`
        });
    }
});

logger.info('Starting Desktop Commander V3 MCP Server...');
client.connect();

// Handle shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down...');
    process.exit(0);
});
