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
    TaskStartedMessage,
    TaskStoppedMessage,
    TaskProgressMessage,
    TaskActivityMessage,
    TaskInsightsMessage,
    ContextUpdateMessage,
    FileChangedMessage,
    TaskStartedPayload,
    TaskStoppedPayload,
    TaskProgressPayload,
    TaskActivityPayload,
    TaskInsightsPayload,
    ContextUpdatePayload,
    FileChangedPayload,
    AppSource,
} from './schemas.js';

type Sender = AppSource;

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

// Task lifecycle message creators
export const createTaskStartedMessage = (
    source: Sender,
    payload: TaskStartedPayload
): TaskStartedMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.TASK_STARTED,
    payload,
});

export const createTaskStoppedMessage = (
    source: Sender,
    payload: TaskStoppedPayload
): TaskStoppedMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.TASK_STOPPED,
    payload,
});

export const createTaskProgressMessage = (
    source: Sender,
    payload: TaskProgressPayload
): TaskProgressMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.TASK_PROGRESS,
    payload,
});

export const createTaskActivityMessage = (
    source: Sender,
    payload: TaskActivityPayload
): TaskActivityMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.TASK_ACTIVITY,
    payload,
});

export const createTaskInsightsMessage = (
    source: Sender,
    payload: TaskInsightsPayload
): TaskInsightsMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.TASK_INSIGHTS,
    payload,
});

export const createContextUpdateMessage = (
    source: Sender,
    payload: ContextUpdatePayload
): ContextUpdateMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.CONTEXT_UPDATE,
    payload,
});

export const createFileChangedMessage = (
    source: Sender,
    payload: FileChangedPayload
): FileChangedMessage => ({
    ...createBaseMessage(source),
    type: IPCMessageType.FILE_CHANGED,
    payload,
});
