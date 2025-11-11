import { v4 as uuidv4 } from 'uuid';
import {
    IPCMessageType,
    BaseMessage,
    OpenFileMessage,
    OpenProjectMessage,
    GitStatusUpdateMessage,
    LearningEventMessage,
    ErrorMessage,
    AckMessage,
    OpenFilePayload,
    OpenProjectPayload,
    GitStatusPayload,
    LearningEventPayload,
    ErrorPayload,
} from './schemas.js';

type Sender = 'nova' | 'vibe';

const createBaseMessage = (source: Sender): BaseMessage => ({
    messageId: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: IPCMessageType.CONNECT, // placeholder, overwritten by caller
    timestamp: Date.now(),
    source,
    version: '1.0.0',
    id: uuidv4(), // legacy compatibility
});

export const createOpenFileMessage = (
    source: Sender,
    payload: OpenFilePayload
): OpenFileMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.FILE_OPEN,
    payload,
});

export const createOpenProjectMessage = (
    source: Sender,
    payload: OpenProjectPayload
): OpenProjectMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.PROJECT_OPEN,
    payload,
});

export const createGitStatusUpdateMessage = (
    source: Sender,
    payload: GitStatusPayload
): GitStatusUpdateMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.GIT_STATUS_UPDATE,
    payload,
});

export const createLearningEventMessage = (
    source: Sender,
    payload: LearningEventPayload
): LearningEventMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.LEARNING_EVENT,
    payload,
});

export const createErrorMessage = (
    source: Sender,
    payload: ErrorPayload
): ErrorMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.ERROR,
    payload,
});

export const createAckMessage = (
    source: Sender,
    messageId: string
): AckMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.ACK,
    payload: { messageId },
});
