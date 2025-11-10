import { z } from 'zod';

// Message sources/targets
export const appSourceSchema = z.enum(['nova', 'vibe', 'bridge']);
export type AppSource = z.infer<typeof appSourceSchema>;

// Message types enum
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

    // Git operations (legacy support)
    GET_GIT_STATUS = 'get_git_status',
    GIT_STATUS_UPDATE = 'git_status_update',

    // Command routing (Phase 3.2)
    COMMAND_REQUEST = 'command_request',
    COMMAND_EXECUTE = 'command_execute',
    COMMAND_RESULT = 'command_result',
    COMMAND_RESPONSE = 'command_response',

    // Bridge telemetry
    BRIDGE_STATS = 'bridge_stats',

    // Error/ack
    ERROR = 'error',
    ACK = 'ack',
}

// Base message schema
export const baseMessageSchema = z.object({
    messageId: z.string().min(1, 'messageId is required'),
    type: z.nativeEnum(IPCMessageType),
    timestamp: z.number(),
    source: appSourceSchema,
    target: appSourceSchema.optional(),
    version: z.string().default('1.0.0'),
    correlationId: z.string().optional(),
    timeoutMs: z.number().int().positive().optional(),
    metadata: z.record(z.any()).optional(),
    id: z.string().uuid().optional(), // Legacy compatibility for older clients
});

// Specific message payloads
export const openFilePayloadSchema = z.object({
    filePath: z.string().min(1, 'File path cannot be empty'),
    line: z.number().optional(),
    column: z.number().optional(),
    context: z.string().optional(),
});

export const openProjectPayloadSchema = z.object({
    projectPath: z.string().min(1, 'Project path cannot be empty'),
    context: z.string().optional(),
});

export const gitStatusPayloadSchema = z.object({
    branch: z.string(),
    modified: z.array(z.string()),
    added: z.array(z.string()),
    deleted: z.array(z.string()),
    untracked: z.array(z.string()),
});

export const learningEventPayloadSchema = z.object({
    eventType: z.enum(['mistake', 'knowledge', 'pattern']),
    data: z.record(z.any()),
    source: appSourceSchema,
});

export const errorPayloadSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
});

export const commandRequestPayloadSchema = z.object({
    text: z.string().min(1, 'Command text cannot be empty'),
    target: appSourceSchema.optional(),
    context: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
});

export const commandExecutePayloadSchema = z.object({
    commandId: z.string().min(1, 'commandId is required'),
    command: z.string().min(1, 'command is required'),
    args: z.array(z.string()).optional(),
    text: z.string().min(1, 'command text is required'),
    originalSender: z.string().min(1),
});

export const commandResultPayloadSchema = z.object({
    commandId: z.string().min(1, 'commandId is required'),
    success: z.boolean(),
    result: z.any().optional(),
    error: z.string().optional(),
    metrics: z
        .object({
            elapsedMs: z.number().nonnegative().optional(),
            startedAt: z.number().optional(),
            finishedAt: z.number().optional(),
        })
        .optional(),
});

export const bridgeStatsPayloadSchema = z.object({
    server: z.object({
        uptime: z.number(),
        port: z.number(),
    }),
    connections: z.object({
        active: z.number().int(),
        total: z.number().int(),
        disconnections: z.number().int(),
    }),
    messages: z.object({
        total: z.number().int(),
        byType: z.record(z.number().int()),
        recentCount: z.number().int(),
    }),
    clients: z.array(
        z.object({
            id: z.string(),
            source: z.string(),
            messageCount: z.number().int(),
            connected: z.number().int(),
        })
    ),
});

// Full message schemas
export const openFileMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.FILE_OPEN),
    payload: openFilePayloadSchema,
});

export const openProjectMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.PROJECT_OPEN),
    payload: openProjectPayloadSchema,
});

export const gitStatusMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.GET_GIT_STATUS),
    payload: z.object({}).optional(),
});

export const gitStatusUpdateMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.GIT_STATUS_UPDATE),
    payload: gitStatusPayloadSchema,
});

export const learningEventMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.LEARNING_EVENT),
    payload: learningEventPayloadSchema,
});

export const errorMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.ERROR),
    payload: errorPayloadSchema,
});

export const ackMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.ACK),
    payload: z.object({
        messageId: z.string().min(1),
    }),
});

export const commandRequestMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.COMMAND_REQUEST),
    timeoutMs: z.number().int().positive().optional(),
    payload: commandRequestPayloadSchema,
});

export const commandExecuteMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.COMMAND_EXECUTE),
    payload: commandExecutePayloadSchema,
});

export const commandResultMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.COMMAND_RESULT),
    payload: commandResultPayloadSchema,
});

export const commandResponseMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.COMMAND_RESPONSE),
    payload: commandResultPayloadSchema.extend({
        targetClientId: z.string().optional(),
    }),
});

export const bridgeStatsMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.BRIDGE_STATS),
    payload: bridgeStatsPayloadSchema,
});

// Union of all message types
export const ipcMessageSchema = z.discriminatedUnion('type', [
    openFileMessageSchema,
    openProjectMessageSchema,
    gitStatusMessageSchema,
    gitStatusUpdateMessageSchema,
    learningEventMessageSchema,
    errorMessageSchema,
    ackMessageSchema,
    commandRequestMessageSchema,
    commandExecuteMessageSchema,
    commandResultMessageSchema,
    commandResponseMessageSchema,
    bridgeStatsMessageSchema,
]);

// TypeScript types
export type BaseMessage = z.infer<typeof baseMessageSchema>;
export type OpenFilePayload = z.infer<typeof openFilePayloadSchema>;
export type OpenProjectPayload = z.infer<typeof openProjectPayloadSchema>;
export type GitStatusPayload = z.infer<typeof gitStatusPayloadSchema>;
export type LearningEventPayload = z.infer<typeof learningEventPayloadSchema>;
export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
export type CommandRequestPayload = z.infer<typeof commandRequestPayloadSchema>;
export type CommandExecutePayload = z.infer<typeof commandExecutePayloadSchema>;
export type CommandResultPayload = z.infer<typeof commandResultPayloadSchema>;
export type BridgeStatsPayload = z.infer<typeof bridgeStatsPayloadSchema>;

export type OpenFileMessage = z.infer<typeof openFileMessageSchema>;
export type OpenProjectMessage = z.infer<typeof openProjectMessageSchema>;
export type GitStatusMessage = z.infer<typeof gitStatusMessageSchema>;
export type GitStatusUpdateMessage = z.infer<typeof gitStatusUpdateMessageSchema>;
export type LearningEventMessage = z.infer<typeof learningEventMessageSchema>;
export type ErrorMessage = z.infer<typeof errorMessageSchema>;
export type AckMessage = z.infer<typeof ackMessageSchema>;
export type CommandRequestMessage = z.infer<typeof commandRequestMessageSchema>;
export type CommandExecuteMessage = z.infer<typeof commandExecuteMessageSchema>;
export type CommandResultMessage = z.infer<typeof commandResultMessageSchema>;
export type CommandResponseMessage = z.infer<typeof commandResponseMessageSchema>;
export type BridgeStatsMessage = z.infer<typeof bridgeStatsMessageSchema>;

export type IPCMessage = z.infer<typeof ipcMessageSchema>;
