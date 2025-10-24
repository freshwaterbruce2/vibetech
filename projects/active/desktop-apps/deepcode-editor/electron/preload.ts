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
    getPath: (name) => {
      // Get application paths (userData, documents, etc.)
      return ipcRenderer.sendSync('app:getPath', name);
    },
    getVersion: () => ipcRenderer.sendSync('app:getVersion'),
    quit: () => ipcRenderer.send('app:quit'),
  },

  // Dialog methods
  dialog: {
    openFolder: async (options) => {
      return await ipcRenderer.invoke('dialog:openFolder', options);
    },
    openFile: async (options) => {
      return await ipcRenderer.invoke('dialog:openFile', options);
    },
    saveFile: async (options) => {
      return await ipcRenderer.invoke('dialog:saveFile', options);
    },
    showMessage: async (options) => {
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
    isMaximized: () => ipcRenderer.sendSync('window:isMaximized'),
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
});

// Add type definitions for TypeScript
window.electron = window.electron || {};