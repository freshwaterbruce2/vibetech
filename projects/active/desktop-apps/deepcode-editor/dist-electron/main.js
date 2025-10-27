"use strict";
/**
 * Electron Main Process
 * DeepCode Editor - Migrated from Tauri to Electron
 *
 * Architecture: Cursor/VS Code style (Electron + Monaco Editor)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const dbHandler = __importStar(require("./database-handler"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Keep a global reference to prevent garbage collection
let mainWindow = null;
// Development or production mode
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5174';
/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'DeepCode Editor',
        backgroundColor: '#1e1e1e', // VS Code dark theme
        webPreferences: {
            nodeIntegration: false, // Security: disable Node.js in renderer
            contextIsolation: true, // Security: isolate context
            sandbox: false, // Allow access to Node.js APIs via preload
            preload: path.join(__dirname, '../preload/index.mjs'),
            // Monaco Editor requires web workers
            webviewTag: false,
        },
        show: true, // Show window immediately to debug visibility issues
    });
    // Show window when ready to prevent white flash
    mainWindow.once('ready-to-show', () => {
        console.log('[Electron] Window ready to show');
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus(); // Force focus on the window
            if (isDev) {
                mainWindow.webContents.openDevTools();
            }
        }
    });
    // Fallback: Force show after 3 seconds if not already visible
    setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.log('[Electron] Forcing window to show (fallback)');
            mainWindow.show();
            mainWindow.focus();
        }
    }, 3000);
    // Handle loading errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[Electron] Failed to load:', errorCode, errorDescription);
    });
    // Log when page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Electron] Page loaded successfully');
    });
    // Load the app
    if (isDev) {
        if (mainWindow) {
            mainWindow.loadURL(VITE_DEV_SERVER_URL);
        }
    }
    else {
        // In production, load from the dist folder
        // Use app.getAppPath() for proper ASAR support
        const appPath = electron_1.app.getAppPath();
        // Try multiple possible paths for the index.html
        let indexPath = path.join(appPath, 'resources', 'app', 'dist', 'index.html');
        if (!require('fs').existsSync(indexPath)) {
            indexPath = path.join(appPath, 'dist', 'index.html');
        }
        console.log('[Electron] Loading from:', indexPath);
        console.log('[Electron] File exists:', require('fs').existsSync(indexPath));
        if (mainWindow) {
            mainWindow.loadFile(indexPath);
        }
    }
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
}
/**
 * Configure Content Security Policy
 * This is the recommended approach for Electron apps (vs meta tags in HTML)
 */
function setupCSP() {
    electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    [
                        "default-src 'self'",
                        "script-src 'self' 'unsafe-eval'", // Monaco Editor needs unsafe-eval for AMD loader
                        "style-src 'self' 'unsafe-inline'", // styled-components needs unsafe-inline
                        "img-src 'self' data: blob: https:",
                        "font-src 'self' data: https://r2cdn.perplexity.ai",
                        "connect-src 'self' http://localhost:* ws://localhost:* http://ipc.localhost ipc: https://ipc.localhost https://api.deepseek.com https://api.openai.com https://api.anthropic.com wss: ws: tauri:",
                        "media-src 'self' blob:",
                        "worker-src 'self' blob: data:", // Monaco Editor web workers
                        "child-src 'self' blob:",
                        "object-src 'none'",
                        "base-uri 'self'",
                        "form-action 'self'",
                        "frame-ancestors 'none'"
                    ].join('; ')
                ]
            }
        });
    });
    console.log('[Electron] Content Security Policy configured');
}
/**
 * App lifecycle events
 */
electron_1.app.whenReady().then(() => {
    // Configure CSP before creating windows
    setupCSP();
    // Initialize database
    const dbInit = dbHandler.initializeDatabase();
    if (!dbInit.success) {
        console.error('[Electron] Database initialization failed:', dbInit.error);
    }
    createWindow();
    // macOS: Re-create window when dock icon clicked
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed (except macOS)
electron_1.app.on('window-all-closed', () => {
    dbHandler.closeDatabase();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
/**
 * IPC Handlers - File System Operations
 */
// Read file
electron_1.ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Write file
electron_1.ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Read directory
electron_1.ipcMain.handle('fs:readDir', async (event, dirPath) => {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const items = entries.map(entry => ({
            name: entry.name,
            path: path.join(dirPath, entry.name),
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
        }));
        return { success: true, items };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Create directory
electron_1.ipcMain.handle('fs:createDir', async (event, dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Delete file/directory
electron_1.ipcMain.handle('fs:remove', async (event, targetPath) => {
    try {
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
            await fs.rm(targetPath, { recursive: true, force: true });
        }
        else {
            await fs.unlink(targetPath);
        }
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Rename/move file
electron_1.ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
    try {
        await fs.rename(oldPath, newPath);
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Check if path exists
electron_1.ipcMain.handle('fs:exists', async (event, targetPath) => {
    try {
        await fs.access(targetPath);
        return { success: true, exists: true };
    }
    catch (error) {
        return { success: true, exists: false };
    }
});
// Get file stats
electron_1.ipcMain.handle('fs:stat', async (event, targetPath) => {
    try {
        const stats = await fs.stat(targetPath);
        return {
            success: true,
            stats: {
                size: stats.size,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                created: stats.birthtime,
                modified: stats.mtime,
            },
        };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
/**
 * IPC Handlers - Dialog Operations
 */
// Open file dialog
electron_1.ipcMain.handle('dialog:openFile', async (event, options = {}) => {
    try {
        if (!mainWindow)
            throw new Error('Main window not available');
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
            ...options,
        });
        return { success: true, canceled: result.canceled, filePaths: result.filePaths };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Open folder dialog
electron_1.ipcMain.handle('dialog:openFolder', async (event, options = {}) => {
    try {
        if (!mainWindow)
            throw new Error('Main window not available');
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            ...options,
        });
        return { success: true, canceled: result.canceled, filePaths: result.filePaths };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Save file dialog
electron_1.ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
    try {
        if (!mainWindow)
            throw new Error('Main window not available');
        const result = await electron_1.dialog.showSaveDialog(mainWindow, {
            filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
            ...options,
        });
        return { success: true, canceled: result.canceled, filePath: result.filePath };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
/**
 * IPC Handlers - Shell Operations (for Agent Mode)
 */
// Execute shell command
electron_1.ipcMain.handle('shell:execute', async (event, command, cwd) => {
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: cwd || process.cwd(),
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });
        return {
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            code: 0,
        };
    }
    catch (error) {
        return {
            success: false,
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            code: error.code || 1,
        };
    }
});
/**
 * IPC Handlers - Secure Storage Operations for API Keys
 */
// Secure storage file path
const getSecureStoragePath = () => {
    const userDataPath = electron_1.app.getPath('userData');
    return path.join(userDataPath, 'secure-storage.json');
};
// Initialize secure storage file if it doesn't exist
const initSecureStorage = async () => {
    const storagePath = getSecureStoragePath();
    try {
        await fs.access(storagePath);
    }
    catch {
        // File doesn't exist, create it
        await fs.writeFile(storagePath, JSON.stringify({}), 'utf-8');
    }
};
// Get secure storage data
electron_1.ipcMain.handle('storage:get', async (event, key) => {
    try {
        await initSecureStorage();
        const storagePath = getSecureStoragePath();
        const data = await fs.readFile(storagePath, 'utf-8');
        const storage = JSON.parse(data);
        return { success: true, value: storage[key] || null };
    }
    catch (error) {
        console.error('[Electron] Failed to get storage:', error);
        return { success: false, error: error.message };
    }
});
// Set secure storage data
electron_1.ipcMain.handle('storage:set', async (event, key, value) => {
    try {
        await initSecureStorage();
        const storagePath = getSecureStoragePath();
        const data = await fs.readFile(storagePath, 'utf-8');
        const storage = JSON.parse(data);
        storage[key] = value;
        await fs.writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf-8');
        return { success: true };
    }
    catch (error) {
        console.error('[Electron] Failed to set storage:', error);
        return { success: false, error: error.message };
    }
});
// Remove secure storage data
electron_1.ipcMain.handle('storage:remove', async (event, key) => {
    try {
        await initSecureStorage();
        const storagePath = getSecureStoragePath();
        const data = await fs.readFile(storagePath, 'utf-8');
        const storage = JSON.parse(data);
        delete storage[key];
        await fs.writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf-8');
        return { success: true };
    }
    catch (error) {
        console.error('[Electron] Failed to remove storage:', error);
        return { success: false, error: error.message };
    }
});
// Get all storage keys
electron_1.ipcMain.handle('storage:keys', async () => {
    try {
        await initSecureStorage();
        const storagePath = getSecureStoragePath();
        const data = await fs.readFile(storagePath, 'utf-8');
        const storage = JSON.parse(data);
        return { success: true, keys: Object.keys(storage) };
    }
    catch (error) {
        console.error('[Electron] Failed to get storage keys:', error);
        return { success: false, error: error.message };
    }
});
/**
 * IPC Handlers - System Operations
 */
// Get app path
electron_1.ipcMain.handle('app:getPath', async (event, name) => {
    try {
        const appPath = electron_1.app.getPath(name);
        return { success: true, path: appPath };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Open external URL
electron_1.ipcMain.handle('shell:openExternal', async (event, url) => {
    try {
        await electron_1.shell.openExternal(url);
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
// Get platform info
electron_1.ipcMain.handle('app:getPlatform', async () => {
    return {
        success: true,
        platform: process.platform,
        arch: process.arch,
        version: electron_1.app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
    };
});
// Get app version
electron_1.ipcMain.handle('app:getVersion', async () => {
    return electron_1.app.getVersion();
});
// Check if window is maximized
electron_1.ipcMain.handle('window:isMaximized', async () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});
console.log('[Electron] Main process initialized');
console.log('[Electron] Mode:', isDev ? 'development' : 'production');
console.log('[Electron] Platform:', process.platform);
/**
 * IPC Handlers - Database Operations
 */
// Execute database query
electron_1.ipcMain.handle('db:query', async (event, sql, params = []) => {
    try {
        const result = dbHandler.executeQuery(sql, params);
        return result;
    }
    catch (error) {
        console.error('[Electron] Database query error:', error);
        return { success: false, error: error.message };
    }
});
// Initialize database
electron_1.ipcMain.handle('db:initialize', async () => {
    try {
        const result = dbHandler.initializeDatabase();
        return result;
    }
    catch (error) {
        console.error('[Electron] Database init error:', error);
        return { success: false, error: error.message };
    }
});
