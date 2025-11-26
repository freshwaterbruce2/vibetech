import { z } from 'zod';

// Message sources/targets
export const appSourceSchema = z.enum(['nova', 'vibe', 'bridge', 'deepcode', 'desktop-commander-v3']);
export type AppSource = z.infer<typeof appSourceSchema>;

// Message types enum
export enum IPCMessageType {
    // Connection lifecycle
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    PING = 'ping',
    PONG = 'pong',
    IDENTIFY = 'identify',

    // File operations
    FILE_OPEN = 'file:open',
    FILE_OPENED = 'file:opened',
    FILE_CLOSE = 'file:close',
    FILE_CHANGED = 'file:changed',

    // Learning + project updates
    LEARNING_SYNC = 'learning:sync',
    LEARNING_EVENT = 'learning_event',
    PROJECT_UPDATE = 'project:update',
    PROJECT_OPEN = 'project:open',
    CONTEXT_UPDATE = 'context:update',
    NOTIFICATION = 'notification',

    // Task lifecycle (Agent Mode)
    TASK_STARTED = 'task_started',
    TASK_STOPPED = 'task_stopped',
    TASK_PROGRESS = 'task_progress',
    TASK_ACTIVITY = 'task_activity',
    TASK_INSIGHTS = 'task_insights_ready',

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

// Task lifecycle payloads (Agent Mode)
export const taskStartedPayloadSchema = z.object({
    task_id: z.string().min(1, 'task_id is required'),
    task_type: z.string().min(1, 'task_type is required'),
    title: z.string().min(1, 'title is required'),
    context: z.record(z.any()).optional(),
});

export const taskStoppedPayloadSchema = z.object({
    task_id: z.string().min(1, 'task_id is required'),
    status: z.enum(['completed', 'paused', 'abandoned', 'error']),
    duration_minutes: z.number().nonnegative().optional(),
    result: z
        .object({
            success: z.boolean(),
            output: z.string().optional(),
            error: z.string().optional(),
        })
        .optional(),
});

export const taskProgressPayloadSchema = z.object({
    task_id: z.string().min(1, 'task_id is required'),
    progress: z.number().min(0).max(100),
    current_step: z.string().optional(),
    steps_completed: z.number().int().nonnegative().optional(),
    total_steps: z.number().int().positive().optional(),
});

export const taskActivityPayloadSchema = z.object({
    task_id: z.string().min(1, 'task_id is required'),
    activity_type: z.enum(['code_edit', 'file_open', 'git_commit', 'test_run', 'command_execute']),
    details: z.record(z.any()).optional(),
});

export const taskInsightsPayloadSchema = z.object({
    task_id: z.string().min(1, 'task_id is required'),
    insights: z.record(z.any()),
});

// Context update payload
export const contextUpdatePayloadSchema = z.object({
    workspaceRoot: z.string().optional(),
    openFiles: z.array(z.string()).optional(),
    currentFile: z.string().optional(),
    cursorPosition: z
        .object({
            line: z.number().int().nonnegative(),
            column: z.number().int().nonnegative(),
        })
        .optional(),
    selection: z
        .object({
            start: z.object({ line: z.number(), column: z.number() }),
            end: z.object({ line: z.number(), column: z.number() }),
        })
        .optional(),
    diagnostics: z
        .array(
            z.object({
                file: z.string(),
                message: z.string(),
                severity: z.string(),
                line: z.number(),
            })
        )
        .optional(),
});

// File changed payload
export const fileChangedPayloadSchema = z.object({
    filePath: z.string().min(1, 'filePath is required'),
    changeType: z.enum(['created', 'modified', 'deleted']),
    content: z.string().optional(),
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

// Task lifecycle message schemas
export const taskStartedMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.TASK_STARTED),
    payload: taskStartedPayloadSchema,
});

export const taskStoppedMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.TASK_STOPPED),
    payload: taskStoppedPayloadSchema,
});

export const taskProgressMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.TASK_PROGRESS),
    payload: taskProgressPayloadSchema,
});

export const taskActivityMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.TASK_ACTIVITY),
    payload: taskActivityPayloadSchema,
});

export const taskInsightsMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.TASK_INSIGHTS),
    payload: taskInsightsPayloadSchema,
});

// Context and file change message schemas
export const contextUpdateMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.CONTEXT_UPDATE),
    payload: contextUpdatePayloadSchema,
});

export const fileChangedMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.FILE_CHANGED),
    payload: fileChangedPayloadSchema,
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
    taskStartedMessageSchema,
    taskStoppedMessageSchema,
    taskProgressMessageSchema,
    taskActivityMessageSchema,
    taskInsightsMessageSchema,
    contextUpdateMessageSchema,
    fileChangedMessageSchema,
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

// Task payload types
export type TaskStartedPayload = z.infer<typeof taskStartedPayloadSchema>;
export type TaskStoppedPayload = z.infer<typeof taskStoppedPayloadSchema>;
export type TaskProgressPayload = z.infer<typeof taskProgressPayloadSchema>;
export type TaskActivityPayload = z.infer<typeof taskActivityPayloadSchema>;
export type TaskInsightsPayload = z.infer<typeof taskInsightsPayloadSchema>;
export type ContextUpdatePayload = z.infer<typeof contextUpdatePayloadSchema>;
export type FileChangedPayload = z.infer<typeof fileChangedPayloadSchema>;

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

// Task message types
export type TaskStartedMessage = z.infer<typeof taskStartedMessageSchema>;
export type TaskStoppedMessage = z.infer<typeof taskStoppedMessageSchema>;
export type TaskProgressMessage = z.infer<typeof taskProgressMessageSchema>;
export type TaskActivityMessage = z.infer<typeof taskActivityMessageSchema>;
export type TaskInsightsMessage = z.infer<typeof taskInsightsMessageSchema>;
export type ContextUpdateMessage = z.infer<typeof contextUpdateMessageSchema>;
export type FileChangedMessage = z.infer<typeof fileChangedMessageSchema>;

export type IPCMessage = z.infer<typeof ipcMessageSchema>;
