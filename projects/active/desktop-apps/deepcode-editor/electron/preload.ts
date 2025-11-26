/**
 * Electron Preload Script
 * Provides secure API access to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import path from 'node:path';
import os from 'node:os';

// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,

  // App methods
  app: {
    getPath: async (name: 'home' | 'appData' | 'userData' | 'temp' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs') => {
      // Get application paths (userData, documents, etc.)
      return await ipcRenderer.invoke('app:getPath', name);
    },
    getVersion: async (): Promise<string> => await ipcRenderer.invoke('app:getVersion'),
    quit: (): void => ipcRenderer.send('app:quit'),
  },

  // Dialog methods
  dialog: {
    openFolder: async (options: Electron.OpenDialogOptions) => {
      return await ipcRenderer.invoke('dialog:openFolder', options);
    },
    openFile: async (options: Electron.OpenDialogOptions) => {
      interface DialogOpenFileOptions {
        title?: string;
        defaultPath?: string;
        buttonLabel?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'>;
        message?: string;
      }

      interface DialogSaveFileOptions {
        title?: string;
        defaultPath?: string;
        buttonLabel?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
        message?: string;
        nameFieldLabel?: string;
        showsTagField?: boolean;
      }

      interface DialogMessageOptions {
        type?: 'none' | 'info' | 'error' | 'question' | 'warning';
        buttons?: string[];
        defaultId?: number;
        title?: string;
        message: string;
        detail?: string;
        checkboxLabel?: string;
        checkboxChecked?: boolean;
        icon?: string;
        cancelId?: number;
        noLink?: boolean;
        normalizeAccessKeys?: boolean;
      }

            return await ipcRenderer.invoke('dialog:openFile', options);
          },
          saveFile: async (options: DialogSaveFileOptions) => {
            return await ipcRenderer.invoke('dialog:saveFile', options);
          },
          showMessage: async (options: DialogMessageOptions) => {
      return await ipcRenderer.invoke('dialog:showMessage', options);
    },
  },

  // File system methods
  fs: {
    readFile: async (filePath) => {
      return await ipcRenderer.invoke('fs:readFile', filePath);
    },
    writeFile: async (filePath, content) => {
      return await ipcRenderer.invoke('fs:writeFile', filePath, content);
    },
    exists: async (filePath) => {
      return await ipcRenderer.invoke('fs:exists', filePath);
    },
    readDir: async (dirPath) => {
      return await ipcRenderer.invoke('fs:readDir', dirPath);
    },
    createDir: async (dirPath) => {
      return await ipcRenderer.invoke('fs:createDir', dirPath);
    },
    remove: async (targetPath) => {
      return await ipcRenderer.invoke('fs:remove', targetPath);
    },
    rename: async (oldPath, newPath) => {
      return await ipcRenderer.invoke('fs:rename', oldPath, newPath);
    },
    stat: async (targetPath) => {
      return await ipcRenderer.invoke('fs:stat', targetPath);
    },
  },

  // Window methods
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: async () => await ipcRenderer.invoke('window:isMaximized'),
  },

  // Platform information
  platform: {
    os: process.platform,
    arch: process.arch,
    version: process.version,
    homedir: os.homedir(),
    pathSeparator: path.sep,
  },

  // Shell operations
  shell: {
    execute: async (command, cwd) => {
      return await ipcRenderer.invoke('shell:execute', command, cwd);
    },
    openExternal: async (url) => {
      return await ipcRenderer.invoke('shell:openExternal', url);
    },
  },

  // Secure storage operations for API keys
  storage: {
    get: async (key) => {
      return await ipcRenderer.invoke('storage:get', key);
    },
    set: async (key, value) => {
      return await ipcRenderer.invoke('storage:set', key, value);
    },
    remove: async (key) => {
      return await ipcRenderer.invoke('storage:remove', key);
    },
    keys: async () => {
      return await ipcRenderer.invoke('storage:keys');
    },
  },

  // Database operations (local)
  db: {
    query: async (sql: string, params: unknown[] = []) => {
      return await ipcRenderer.invoke('db:query', sql, params);
    },
    initialize: async () => {
      return await ipcRenderer.invoke('db:initialize');
    },
  },

  // Shared Learning Database (D:\databases\agent_learning.db)
  learning: {
    // Record a coding mistake and its correction
    recordMistake: async (mistake: {
      file_path: string;
      error_type: string;
      error_message: string;
      original_code: string;
      corrected_code: string;
      explanation: string;
      language: string;
      context?: string;
      confidence?: number;
    }) => {
      return await ipcRenderer.invoke('learning:recordMistake', mistake);
    },
    // Record learned knowledge/pattern
    recordKnowledge: async (knowledge: {
      category: string;
      topic: string;
      content: string;
      examples?: string;
      metadata?: string;
      relevance_score?: number;
    }) => {
      return await ipcRenderer.invoke('learning:recordKnowledge', knowledge);
    },
    // Find similar mistakes for error correction suggestions
    findSimilarMistakes: async (errorType: string, language: string, limit?: number) => {
      return await ipcRenderer.invoke('learning:findSimilarMistakes', errorType, language, limit);
    },
    // Find relevant knowledge for a topic
    findKnowledge: async (category: string, searchTerm: string, limit?: number) => {
      return await ipcRenderer.invoke('learning:findKnowledge', category, searchTerm, limit);
    },
    // Get learning statistics
    getStats: async () => {
      return await ipcRenderer.invoke('learning:getStats');
    },
    // Export data for Nova sync
    exportForSync: async (since?: string) => {
      return await ipcRenderer.invoke('learning:exportForSync', since);
    },
    // Sync data received from Nova
    syncFromNova: async (mistakes: unknown[], knowledge: unknown[]) => {
      return await ipcRenderer.invoke('learning:syncFromNova', mistakes, knowledge);
    },
  },

  // Get platform info
  getPlatform: async () => {
    return await ipcRenderer.invoke('app:getPlatform');
  },

  // IPC communication
  ipc: {
    send: (channel, data) => {
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once: (channel, func) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    },
  },

  // Nova Agent Integration (IPC Bridge)
  nova: {
    // Send command to Nova Agent
    sendCommand: async (command: string, context?: Record<string, unknown>) => {
      return await ipcRenderer.invoke('nova:sendCommand', command, context);
    },
    // Notify Nova that a file was opened
    notifyFileOpened: async (filePath: string, content?: string) => {
      return await ipcRenderer.invoke('nova:fileOpened', filePath, content);
    },
    // Send learning event to Nova
    sendLearningEvent: async (eventType: string, data: Record<string, unknown>) => {
      return await ipcRenderer.invoke('nova:sendLearningEvent', eventType, data);
    },
    // Check if Nova is connected
    isConnected: async () => {
      return await ipcRenderer.invoke('ipc:isNovaConnected');
    },
    // Get IPC bridge stats
    getStats: async () => {
      return await ipcRenderer.invoke('ipc:getStats');
    },
    // Listen for file open requests from Nova
    onFileOpen: (callback: (data: { filePath: string; line?: number; column?: number }) => void) => {
      ipcRenderer.on('ipc:file-open', (event, data) => callback(data));
    },
    // Listen for command requests from Nova
    onCommandRequest: (callback: (data: { commandId: string; text: string; context?: Record<string, unknown>; source: string }) => void) => {
      ipcRenderer.on('ipc:command-request', (event, data) => callback(data));
    },
    // Listen for context updates from Nova
    onContextUpdate: (callback: (data: Record<string, unknown>) => void) => {
      ipcRenderer.on('ipc:context-update', (event, data) => callback(data));
    },
    // Listen for learning events from Nova
    onLearningEvent: (callback: (data: Record<string, unknown>) => void) => {
      ipcRenderer.on('ipc:learning-event', (event, data) => callback(data));
    },
    // Listen for Nova connection status changes
    onClientDisconnected: (callback: (data: { clientId: string; source: string }) => void) => {
      ipcRenderer.on('ipc:client-disconnected', (event, data) => callback(data));
    },
    // Remove all Nova listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('ipc:file-open');
      ipcRenderer.removeAllListeners('ipc:command-request');
      ipcRenderer.removeAllListeners('ipc:context-update');
      ipcRenderer.removeAllListeners('ipc:learning-event');
      ipcRenderer.removeAllListeners('ipc:client-disconnected');
    },
  },

  // IPC Bridge - Central communication hub (connects to backend/ipc-bridge server)
  ipcBridge: {
    // Send a message to the IPC bridge server
    send: (message: Record<string, unknown>) => ipcRenderer.invoke('ipc-bridge:send', message),

    // Check if connected to the IPC bridge
    isConnected: () => ipcRenderer.invoke('ipc-bridge:isConnected'),

    // Get current connection status details
    getStatus: () => ipcRenderer.invoke('ipc-bridge:getStatus'),

    // Request reconnection to the IPC bridge
    reconnect: () => ipcRenderer.invoke('ipc-bridge:reconnect'),

    // Subscribe to incoming messages from the bridge
    onMessage: (handler: (msg: Record<string, unknown>) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, msg: Record<string, unknown>) => handler(msg);
      ipcRenderer.on('ipc-bridge:message', listener);
      return () => ipcRenderer.removeListener('ipc-bridge:message', listener);
    },

    // Subscribe to connection status changes
    onStatusChange: (handler: (status: { connected: boolean }) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, status: { connected: boolean }) => handler(status);
      ipcRenderer.on('ipc-bridge:status', listener);
      return () => ipcRenderer.removeListener('ipc-bridge:status', listener);
    },

    // Remove all IPC bridge listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('ipc-bridge:message');
      ipcRenderer.removeAllListeners('ipc-bridge:status');
    },
  },
});

// Type definitions added via global declaration above
