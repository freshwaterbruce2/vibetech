/**
 * Type definitions for Electron Preload contextBridge API
 */

export interface ElectronAPI {
    isElectron: boolean;

    app: {
        getPath: (name: 'home' | 'appData' | 'userData' | 'temp' | 'exe' | 'desktop' | 'documents' | 'downloads') => Promise<string>;
        getVersion: () => Promise<string>;
        quit: () => void;
    };

    dialog: {
        openFolder: (options?: {
            title?: string;
            defaultPath?: string;
            buttonLabel?: string;
        }) => Promise<{ canceled: boolean; filePaths: string[] }>;
        openFile: (options?: {
            title?: string;
            defaultPath?: string;
            buttonLabel?: string;
            filters?: Array<{ name: string; extensions: string[] }>;
            properties?: Array<'openFile' | 'multiSelections'>;
        }) => Promise<{ canceled: boolean; filePaths: string[] }>;
        saveFile: (options?: {
            title?: string;
            defaultPath?: string;
            buttonLabel?: string;
            filters?: Array<{ name: string; extensions: string[] }>;
        }) => Promise<{ canceled: boolean; filePath?: string }>;
        showMessage: (options: {
            type?: 'none' | 'info' | 'error' | 'question' | 'warning';
            title?: string;
            message: string;
            detail?: string;
            buttons?: string[];
        }) => Promise<{ response: number }>;
    };

    fs: {
        readFile: (filePath: string) => Promise<string>;
        writeFile: (filePath: string, content: string) => Promise<void>;
        exists: (filePath: string) => Promise<boolean>;
        readDir: (dirPath: string) => Promise<string[]>;
        createDir: (dirPath: string) => Promise<void>;
        remove: (targetPath: string) => Promise<void>;
        rename: (oldPath: string, newPath: string) => Promise<void>;
        stat: (targetPath: string) => Promise<{ isFile: boolean; isDirectory: boolean; size: number; mtime: Date }>;
    };

    terminal: {
        execute: (command: string, cwd?: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
    };

    shell: {
        openExternal: (url: string) => Promise<void>;
    };

    path: {
        join: (...paths: string[]) => string;
        basename: (path: string) => string;
        dirname: (path: string) => string;
        extname: (path: string) => string;
    };

    storage: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
        delete: (key: string) => Promise<void>;
    };

    database: {
        query: (sql: string, params?: unknown[]) => Promise<{ success: boolean; rows?: unknown[]; error?: string }>;
    };

    ipc: {
        send: (command: string, payload?: unknown) => void;
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (channel: string, callback: (data: unknown) => void) => void;
        removeAllListeners: (channel: string) => void;
    };
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { };
