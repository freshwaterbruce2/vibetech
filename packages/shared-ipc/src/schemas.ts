import { z } from 'zod';

// Message types enum
export enum IPCMessageType {
    // Connection lifecycle
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    PING = 'ping',
    PONG = 'pong',

    // NOVA -> Deepcode
    OPEN_FILE = 'open_file',
    OPEN_PROJECT = 'open_project',
    GET_GIT_STATUS = 'get_git_status',
    GET_FILE_INSIGHTS = 'get_file_insights',

    // Deepcode -> NOVA
    FILE_CHANGED = 'file_changed',
    PROJECT_OPENED = 'project_opened',
    GIT_STATUS_UPDATE = 'git_status_update',

    // Bidirectional
    LEARNING_EVENT = 'learning_event',
    ERROR = 'error',
    ACK = 'ack',
}

// Base message schema
export const baseMessageSchema = z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(IPCMessageType),
    timestamp: z.number(),
    sender: z.enum(['nova', 'deepcode']),
    version: z.string().default('1.0.0'),
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
    source: z.enum(['nova', 'deepcode']),
});

export const errorPayloadSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
});

// Full message schemas
export const openFileMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.OPEN_FILE),
    payload: openFilePayloadSchema,
});

export const openProjectMessageSchema = baseMessageSchema.extend({
    type: z.literal(IPCMessageType.OPEN_PROJECT),
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
        messageId: z.string().uuid(),
    }),
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
]);

// TypeScript types
export type BaseMessage = z.infer<typeof baseMessageSchema>;
export type OpenFilePayload = z.infer<typeof openFilePayloadSchema>;
export type OpenProjectPayload = z.infer<typeof openProjectPayloadSchema>;
export type GitStatusPayload = z.infer<typeof gitStatusPayloadSchema>;
export type LearningEventPayload = z.infer<typeof learningEventPayloadSchema>;
export type ErrorPayload = z.infer<typeof errorPayloadSchema>;

export type OpenFileMessage = z.infer<typeof openFileMessageSchema>;
export type OpenProjectMessage = z.infer<typeof openProjectMessageSchema>;
export type GitStatusMessage = z.infer<typeof gitStatusMessageSchema>;
export type GitStatusUpdateMessage = z.infer<typeof gitStatusUpdateMessageSchema>;
export type LearningEventMessage = z.infer<typeof learningEventMessageSchema>;
export type ErrorMessage = z.infer<typeof errorMessageSchema>;
export type AckMessage = z.infer<typeof ackMessageSchema>;

export type IPCMessage = z.infer<typeof ipcMessageSchema>;
