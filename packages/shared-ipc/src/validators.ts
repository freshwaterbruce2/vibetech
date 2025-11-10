import { ipcMessageSchema, IPCMessage } from './schemas.js';

export class ValidationError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const validateIPCMessage = (data: unknown): IPCMessage => {
    const result = ipcMessageSchema.safeParse(data);

    if (!result.success) {
        throw new ValidationError(
            'Invalid IPC message format',
            result.error.format()
        );
    }

    return result.data;
};

export const isValidIPCMessage = (data: unknown): data is IPCMessage => {
    return ipcMessageSchema.safeParse(data).success;
};
