import {
    IPCMessageType,
    createOpenFileMessage,
    createTaskActivityMessage,
    createTaskStartedMessage,
    createTaskStoppedMessage,
    type AppSource,
    type FileChangedPayload,
    type OpenFilePayload,
    type TaskActivityPayload,
    type TaskStartedPayload,
    type TaskStoppedPayload,
} from '@vibetech/shared-ipc';
import { logger } from './Logger';

type MessageHandler = (msg: any) => void;

const SOURCE: AppSource = 'deepcode';
const DEFAULT_TARGET: AppSource = 'nova';

async function send(message: Record<string, unknown>) {
    if (!(window as any).ipcBridge?.send) {
        logger.warn('[IpcBridge] ipcBridge not available on window');
        return;
    }

    try {
        await (window as any).ipcBridge.send(message);
    } catch (err) {
        logger.error('[IpcBridge] Failed to send message', err);
    }
}

function withTarget<T extends { target?: string }>(msg: T, target?: string): T {
    return { ...msg, target: target ?? DEFAULT_TARGET };
}

export const IpcBridge = {
    sendTaskStarted(
        taskId: string,
        taskType: string,
        title: string,
        context?: TaskStartedPayload['context'],
        target?: string,
    ) {
        const msg = createTaskStartedMessage(SOURCE, {
            task_id: taskId,
            task_type: taskType,
            title,
            context,
        } satisfies TaskStartedPayload);
        return send(withTarget(msg, target));
    },

    sendTaskStopped(
        taskId: string,
        status: TaskStoppedPayload['status'],
        durationMinutes?: number,
        result?: TaskStoppedPayload['result'],
        target?: string,
    ) {
        const msg = createTaskStoppedMessage(SOURCE, {
            task_id: taskId,
            status,
            duration_minutes: durationMinutes,
            result,
        } satisfies TaskStoppedPayload);
        return send(withTarget(msg, target));
    },

    sendTaskActivity(payload: TaskActivityPayload, target?: string) {
        const msg = createTaskActivityMessage(SOURCE, payload);
        return send(withTarget(msg, target));
    },

    sendFileOpen(payload: OpenFilePayload, target?: string) {
        const msg = createOpenFileMessage(SOURCE, payload);
        return send(withTarget(msg, target));
    },

    sendFileChanged(payload: FileChangedPayload, target?: string) {
        // No helper exists in shared-ipc for file_changed; craft manually
        const msg = {
            type: IPCMessageType.FILE_CHANGED,
            source: SOURCE,
            timestamp: Date.now(),
            messageId: `${SOURCE}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            payload,
            target: target ?? DEFAULT_TARGET,
            version: '1.0.0',
        };
        return send(msg);
    },

    sendCommandRequest(text: string, target?: string, metadata?: Record<string, unknown>) {
        const msg = {
            type: IPCMessageType.COMMAND_REQUEST,
            source: SOURCE,
            timestamp: Date.now(),
            messageId: `${SOURCE}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            payload: {
                text,
                target: target ?? DEFAULT_TARGET,
                metadata,
            },
            target: target ?? DEFAULT_TARGET,
            version: '1.0.0',
        };
        return send(msg);
    },

    onMessage(handler: MessageHandler) {
        if (!(window as any).ipcBridge?.onMessage) {
            logger.warn('[IpcBridge] ipcBridge.onMessage not available');
            return () => { };
        }
        return (window as any).ipcBridge.onMessage(handler);
    },

    onStatusChange(handler: (status: any) => void) {
        if (!(window as any).ipcBridge?.onStatusChange) {
            logger.warn('[IpcBridge] ipcBridge.onStatusChange not available');
            return () => { };
        }
        return (window as any).ipcBridge.onStatusChange(handler);
    },

    async getStatus(): Promise<any> {
        if (!(window as any).ipcBridge?.getStatus) {
            return { connected: false };
        }
        try {
            return await (window as any).ipcBridge.getStatus();
        } catch (err) {
            logger.warn('[IpcBridge] getStatus failed', err);
            return { connected: false, error: String(err) };
        }
    },
};

export default IpcBridge;
