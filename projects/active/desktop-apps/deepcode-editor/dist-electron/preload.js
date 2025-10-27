"use strict";
/**
 * Electron Preload Script
 * Provides secure API access to renderer process
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electron', {
    isElectron: true,
    // App methods
    app: {
        getPath: async (name) => {
            // Get application paths (userData, documents, etc.)
            return await electron_1.ipcRenderer.invoke('app:getPath', name);
        },
        getVersion: async () => await electron_1.ipcRenderer.invoke('app:getVersion'),
        quit: () => electron_1.ipcRenderer.send('app:quit'),
    },
    // Dialog methods
    dialog: {
        openFolder: async (options) => {
            return await electron_1.ipcRenderer.invoke('dialog:openFolder', options);
        },
        openFile: async (options) => {
            return await electron_1.ipcRenderer.invoke('dialog:openFile', options);
        },
        saveFile: async (options) => {
            return await electron_1.ipcRenderer.invoke('dialog:saveFile', options);
        },
        showMessage: async (options) => {
            return await electron_1.ipcRenderer.invoke('dialog:showMessage', options);
        },
    },
    // File system methods
    fs: {
        readFile: async (filePath) => {
            return await electron_1.ipcRenderer.invoke('fs:readFile', filePath);
        },
        writeFile: async (filePath, content) => {
            return await electron_1.ipcRenderer.invoke('fs:writeFile', filePath, content);
        },
        exists: async (filePath) => {
            return await electron_1.ipcRenderer.invoke('fs:exists', filePath);
        },
        readDir: async (dirPath) => {
            return await electron_1.ipcRenderer.invoke('fs:readDir', dirPath);
        },
        createDir: async (dirPath) => {
            return await electron_1.ipcRenderer.invoke('fs:createDir', dirPath);
        },
        remove: async (targetPath) => {
            return await electron_1.ipcRenderer.invoke('fs:remove', targetPath);
        },
        rename: async (oldPath, newPath) => {
            return await electron_1.ipcRenderer.invoke('fs:rename', oldPath, newPath);
        },
        stat: async (targetPath) => {
            return await electron_1.ipcRenderer.invoke('fs:stat', targetPath);
        },
    },
    // Window methods
    window: {
        minimize: () => electron_1.ipcRenderer.send('window:minimize'),
        maximize: () => electron_1.ipcRenderer.send('window:maximize'),
        close: () => electron_1.ipcRenderer.send('window:close'),
        isMaximized: async () => await electron_1.ipcRenderer.invoke('window:isMaximized'),
    },
    // Platform information
    platform: {
        os: process.platform,
        arch: process.arch,
        version: process.version,
        homedir: node_os_1.default.homedir(),
        pathSeparator: node_path_1.default.sep,
    },
    // Shell operations
    shell: {
        execute: async (command, cwd) => {
            return await electron_1.ipcRenderer.invoke('shell:execute', command, cwd);
        },
        openExternal: async (url) => {
            return await electron_1.ipcRenderer.invoke('shell:openExternal', url);
        },
    },
    // Secure storage operations for API keys
    storage: {
        get: async (key) => {
            return await electron_1.ipcRenderer.invoke('storage:get', key);
        },
        set: async (key, value) => {
            return await electron_1.ipcRenderer.invoke('storage:set', key, value);
        },
        remove: async (key) => {
            return await electron_1.ipcRenderer.invoke('storage:remove', key);
        },
        keys: async () => {
            return await electron_1.ipcRenderer.invoke('storage:keys');
        },
    },
    // Database operations
    db: {
        query: async (sql, params = []) => {
            return await electron_1.ipcRenderer.invoke('db:query', sql, params);
        },
        initialize: async () => {
            return await electron_1.ipcRenderer.invoke('db:initialize');
        },
    },
    // Get platform info
    getPlatform: async () => {
        return await electron_1.ipcRenderer.invoke('app:getPlatform');
    },
    // IPC communication
    ipc: {
        send: (channel, data) => {
            const validChannels = ['toMain'];
            if (validChannels.includes(channel)) {
                electron_1.ipcRenderer.send(channel, data);
            }
        },
        on: (channel, func) => {
            const validChannels = ['fromMain'];
            if (validChannels.includes(channel)) {
                electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        once: (channel, func) => {
            const validChannels = ['fromMain'];
            if (validChannels.includes(channel)) {
                electron_1.ipcRenderer.once(channel, (event, ...args) => func(...args));
            }
        },
        removeAllListeners: (channel) => {
            const validChannels = ['fromMain'];
            if (validChannels.includes(channel)) {
                electron_1.ipcRenderer.removeAllListeners(channel);
            }
        },
    },
});
// Type definitions added via global declaration above
