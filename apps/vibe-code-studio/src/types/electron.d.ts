// Type definitions for Electron API exposed through preload script
// This matches the actual implementation in electron/preload.ts

interface ElectronAPI {
  isElectron: boolean;

  // App methods
  app: {
    getPath: (name: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    getVersion: () => Promise<string>;
    quit: () => void;
  };

  // Dialog methods
  dialog: {
    openFolder: (options?: any) => Promise<{ success: boolean; canceled: boolean; filePaths: string[] }>;
    openFile: (options?: any) => Promise<{ success: boolean; canceled: boolean; filePaths: string[] }>;
    saveFile: (options?: any) => Promise<{ success: boolean; canceled: boolean; filePath?: string }>;
    showMessage: (options?: any) => Promise<any>;
  };

  // File system methods
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    exists: (filePath: string) => Promise<{ success: boolean; exists: boolean }>;
    readDir: (dirPath: string) => Promise<{
      success: boolean;
      items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>;
      error?: string;
    }>;
    createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    remove: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
    rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
    stat: (targetPath: string) => Promise<{
      success: boolean;
      stats?: {
        size: number;
        isFile: boolean;
        isDirectory: boolean;
        created: Date;
        modified: Date;
      };
      error?: string;
    }>;
  };

  // Window methods
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
  };

  // Platform information
  platform: {
    os: string;
    arch: string;
    version: string;
    homedir: string;
    pathSeparator: string;
  };

  // Shell operations
  shell: {
    execute: (command: string, cwd?: string) => Promise<{
      success: boolean;
      stdout: string;
      stderr: string;
      code: number;
    }>;
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  };

  // Secure storage operations
  storage: {
    get: (key: string) => Promise<{ success: boolean; value?: any; error?: string }>;
    set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    remove: (key: string) => Promise<{ success: boolean; error?: string }>;
    keys: () => Promise<{ success: boolean; keys?: string[]; error?: string }>;
  };

  // Database operations
  db: {
    query: (sql: string, params?: any[]) => Promise<{ success: boolean; rows?: any[]; error?: string }>;
    initialize: () => Promise<{ success: boolean; error?: string }>;
  };

  // Learning adapter
  learning: {
    run: (
      command: 'error_prevention' | 'performance_optimize' | 'pattern_recognition' | 'batch_optimize',
      payload: any,
      options?: { timeoutMs?: number; pythonPath?: string; moduleOverride?: string }
    ) => Promise<{ success: boolean; result?: any; error?: string; durationMs?: number }>;
  };

  // Get platform info
  getPlatform: () => Promise<{
    success: boolean;
    platform: string;
    arch: string;
    version: string;
    electron: string;
    node: string;
  }>;

  // IPC communication
  ipc: {
    send: (channel: string, data: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    once: (channel: string, func: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
