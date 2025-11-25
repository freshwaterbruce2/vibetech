/**
 * Electron Preload Script
 * Provides secure API access to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import path from 'node:path';
import type { ElectronAPI } from './preload.d';

// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object
try {
  console.log('[Preload] Attempting to expose electron API via contextBridge...');
  const electronAPI: ElectronAPI = {
    isElectron: true,
    app: {
      getPath: async (name: Parameters<ElectronAPI['app']['getPath']>[0]) => {
        return await ipcRenderer.invoke('app:getPath', name);
      },
      getVersion: async () => await ipcRenderer.invoke('app:getVersion'),
      quit: () => ipcRenderer.send('app:quit'),
    },
    dialog: {
      openFolder: async (options?) => {
        return await ipcRenderer.invoke('dialog:openFolder', options);
      },
      openFile: async (options?) => {
        return await ipcRenderer.invoke('dialog:openFile', options);
      },
      saveFile: async (options?) => {
        return await ipcRenderer.invoke('dialog:saveFile', options);
      },
      showMessage: async (options) => {
        return await ipcRenderer.invoke('dialog:showMessage', options);
      },
    },
    fs: {
      readFile: async (filePath: string) => {
        return await ipcRenderer.invoke('fs:readFile', filePath);
      },
      writeFile: async (filePath: string, content: string) => {
        return await ipcRenderer.invoke('fs:writeFile', filePath, content);
      },
      exists: async (filePath: string) => {
        return await ipcRenderer.invoke('fs:exists', filePath);
      },
      readDir: async (dirPath: string) => {
        return await ipcRenderer.invoke('fs:readDir', dirPath);
      },
      createDir: async (dirPath: string) => {
        return await ipcRenderer.invoke('fs:createDir', dirPath);
      },
      remove: async (targetPath: string) => {
        return await ipcRenderer.invoke('fs:remove', targetPath);
      },
      rename: async (oldPath: string, newPath: string) => {
        return await ipcRenderer.invoke('fs:rename', oldPath, newPath);
      },
      stat: async (targetPath: string) => {
        return await ipcRenderer.invoke('fs:stat', targetPath);
      },
    },
    terminal: {
      execute: async (command: string, cwd?: string) => {
        return await ipcRenderer.invoke('terminal:execute', command, cwd);
      },
    },
    shell: {
      openExternal: async (url: string) => {
        return await ipcRenderer.invoke('shell:openExternal', url);
      },
    },
    path: {
      join: (...paths: string[]) => path.join(...paths),
      basename: (p: string) => path.basename(p),
      dirname: (p: string) => path.dirname(p),
      extname: (p: string) => path.extname(p),
    },
    storage: {
      get: async (key: string) => {
        return await ipcRenderer.invoke('storage:get', key);
      },
      set: async (key: string, value: string) => {
        return await ipcRenderer.invoke('storage:set', key, value);
      },
      delete: async (key: string) => {
        return await ipcRenderer.invoke('storage:delete', key);
      },
    },
    database: {
      query: async (sql: string, params?: unknown[]) => {
        return await ipcRenderer.invoke('database:query', sql, params);
      },
    },
    ipc: {
      send: (command: string, payload?: unknown) => {
        ipcRenderer.send('ipc-bridge:command', command, payload);
      },
      invoke: async (channel: string, ...args: unknown[]) => {
        return await ipcRenderer.invoke(channel, ...args);
      },
      on: (channel: string, callback: (data: unknown) => void) => {
        ipcRenderer.on(channel, (_event, data) => callback(data));
      },
      removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
      },
    },
  };

  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('[Preload] ✅ Successfully exposed electron API via contextBridge');
  console.log('[Preload] Note: window.electron is NOT accessible in preload context - this is correct!');
  console.log('[Preload] The renderer process will have access to window.electron');
} catch (error) {
  console.error('[Preload] ❌ FAILED to expose electron API via contextBridge:', error);
  console.error('[Preload] Error stack:', (error as Error).stack);
}
