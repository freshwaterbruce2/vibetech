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

type Sender = 'nova' | 'deepcode';

const createBaseMessage = (sender: Sender): BaseMessage => ({
    id: uuidv4(),
    type: IPCMessageType.CONNECT, // placeholder
    timestamp: Date.now(),
    sender,
    version: '1.0.0',
});

export const createOpenFileMessage = (
    sender: Sender,
    payload: OpenFilePayload
): OpenFileMessage => ({
    ...createBaseMessage(sender),
    type: IPCMessageType.OPEN_FILE,
    payload,
});

export const createOpenProjectMessage = (
    sender: Sender,
    payload: OpenProjectPayload
): OpenProjectMessage => ({
    ...createBaseMessage(sender),
    type: IPCMessageType.OPEN_PROJECT,
    payload,
});

export const createGitStatusUpdateMessage = (
    sender: Sender,
    payload: GitStatusPayload
): GitStatusUpdateMessage => ({
    ...createBaseMessage(sender),
    type: IPCMessageType.GIT_STATUS_UPDATE,
    payload,
});

export const createLearningEventMessage = (
    sender: Sender,
    payload: LearningEventPayload
): LearningEventMessage => ({
    ...createBaseMessage(sender),
    type: IPCMessageType.LEARNING_EVENT,
    payload,
});

export const createErrorMessage = (
    sender: Sender,
    payload: ErrorPayload
): ErrorMessage => ({
    ...createBaseMessage(sender),
    type: IPCMessageType.ERROR,
    payload,
});

export const createAckMessage = (
    sender: Sender,
    messageId: string
): AckMessage => ({
    ...createBaseMessage(sender),
    type: IPCMessageType.ACK,
    payload: { messageId },
});
