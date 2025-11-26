/**
 * Electron Main Process
 * DeepCode Editor - Migrated from Tauri to Electron
 *
 * Architecture: Cursor/VS Code style (Electron + Monaco Editor)
 * Integrated with Nova Agent via WebSocket IPC Bridge (port 5004)
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dbHandler from './database-handler';
import { ipcBridge } from './ipc-bridge';

const execAsync = promisify(exec);

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

// Development or production mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5174';

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
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
  } else {
    // In production, load from the dist folder
    // Use app.getAppPath() for proper ASAR support
    const appPath = app.getAppPath();

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
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * App lifecycle events
 */
app.whenReady().then(() => {
  // Initialize database
  const dbInit = dbHandler.initializeDatabase();
  if (!dbInit.success) {
    console.error('[Electron] Database initialization failed:', dbInit.error);
  }

  createWindow();

  // Initialize IPC Bridge for Nova Agent communication
  if (mainWindow) {
    ipcBridge.start(5004, mainWindow);
    console.log('[Electron] IPC Bridge started for Nova Agent integration');
  }

  // macOS: Re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  ipcBridge.stop(); // Stop IPC bridge before quitting
  dbHandler.closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPC Handlers - File System Operations
 */

// Read file
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Write file
ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Read directory
ipcMain.handle('fs:readDir', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = entries.map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    }));
    return { success: true, items };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Create directory
ipcMain.handle('fs:createDir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Delete file/directory
ipcMain.handle('fs:remove', async (event, targetPath) => {
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Rename/move file
ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Check if path exists
ipcMain.handle('fs:exists', async (event, targetPath) => {
  try {
    await fs.access(targetPath);
    return { success: true, exists: true };
  } catch (error) {
    return { success: true, exists: false };
  }
});

// Get file stats
ipcMain.handle('fs:stat', async (event, targetPath) => {
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
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/**
 * IPC Handlers - Dialog Operations
 */

// Open file dialog
ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  try {
    if (!mainWindow) throw new Error('Main window not available');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      ...options,
    });
    return { success: true, canceled: result.canceled, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Open folder dialog
ipcMain.handle('dialog:openFolder', async (event, options = {}) => {
  try {
    if (!mainWindow) throw new Error('Main window not available');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      ...options,
    });
    return { success: true, canceled: result.canceled, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
  try {
    if (!mainWindow) throw new Error('Main window not available');
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      ...options,
    });
    return { success: true, canceled: result.canceled, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/**
 * IPC Handlers - Shell Operations (for Agent Mode)
 */

// Execute shell command
ipcMain.handle('shell:execute', async (event, command, cwd) => {
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
  } catch (error) {
    return {
      success: false,
      stdout: (error as any).stdout || '',
      stderr: (error as any).stderr || (error as Error).message,
      code: (error as any).code || 1,
    };
  }
});

/**
 * IPC Handlers - Secure Storage Operations for API Keys
 */

// Secure storage file path
const getSecureStoragePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'secure-storage.json');
};

// Initialize secure storage file if it doesn't exist
const initSecureStorage = async () => {
  const storagePath = getSecureStoragePath();
  try {
    await fs.access(storagePath);
  } catch {
    // File doesn't exist, create it
    await fs.writeFile(storagePath, JSON.stringify({}), 'utf-8');
  }
};

// Get secure storage data
ipcMain.handle('storage:get', async (event, key) => {
  try {
    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    return { success: true, value: storage[key] || null };
  } catch (error) {
    console.error('[Electron] Failed to get storage:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Set secure storage data
ipcMain.handle('storage:set', async (event, key, value) => {
  try {
    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    storage[key] = value;
    await fs.writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('[Electron] Failed to set storage:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Remove secure storage data
ipcMain.handle('storage:remove', async (event, key) => {
  try {
    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    delete storage[key];
    await fs.writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('[Electron] Failed to remove storage:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get all storage keys
ipcMain.handle('storage:keys', async () => {
  try {
    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    return { success: true, keys: Object.keys(storage) };
  } catch (error) {
    console.error('[Electron] Failed to get storage keys:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * IPC Handlers - System Operations
 */

// Get app path
ipcMain.handle('app:getPath', async (event, name) => {
  try {
    const appPath = app.getPath(name);
    return { success: true, path: appPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Open external URL
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get platform info
ipcMain.handle('app:getPlatform', async () => {
  return {
    success: true,
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
  };
});

// Get app version
ipcMain.handle('app:getVersion', async () => {
  return app.getVersion();
});

// Check if window is maximized
ipcMain.handle('window:isMaximized', async () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

console.log('[Electron] Main process initialized');
console.log('[Electron] Mode:', isDev ? 'development' : 'production');
console.log('[Electron] Platform:', process.platform);

/**
 * IPC Handlers - Database Operations
 */

// Execute database query
ipcMain.handle('db:query', async (event, sql, params = []) => {
  try {
    const result = dbHandler.executeQuery(sql, params);
    return result;
  } catch (error) {
    console.error('[Electron] Database query error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Initialize database
ipcMain.handle('db:initialize', async () => {
  try {
    const result = dbHandler.initializeDatabase();
    return result;
  } catch (error) {
    console.error('[Electron] Database init error:', error);
    return { success: false, error: (error as Error).message };
  }
});
