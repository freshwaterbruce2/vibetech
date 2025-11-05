// Type definitions for Electron API exposed through preload script
// This matches the contextBridge.exposeInMainWorld('electron', {...}) in preload.ts

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
    showMessage?: (options: any) => Promise<any>;
  };

  // File system methods
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    exists: (filePath: string) => Promise<{ success: boolean; exists: boolean }>;
    readDir: (dirPath: string) => Promise<{ success: boolean; items?: any[]; error?: string }>;
    createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    remove: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
    rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
    stat: (targetPath: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
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

  // Secure storage operations for API keys
  storage: {
    get: (key: string) => Promise<{ success: boolean; value?: any; error?: string }>;
    set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    remove: (key: string) => Promise<{ success: boolean; error?: string }>;
    keys: () => Promise<{ success: boolean; keys?: string[]; error?: string }>;
  };

  // Database operations (IPC-based for better-sqlite3)
  db: {
    query: (sql: string, params?: any[]) => Promise<{
      success: boolean;
      data?: any;
      lastID?: number;
      changes?: number;
      error?: string;
    }>;
    initialize: () => Promise<{ success: boolean; error?: string }>;
  };

  // Get platform info
  getPlatform: () => Promise<{
    success: boolean;
    platform?: string;
    arch?: string;
    version?: string;
    electron?: string;
    node?: string;
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
