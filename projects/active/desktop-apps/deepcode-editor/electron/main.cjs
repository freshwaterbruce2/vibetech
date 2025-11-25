/**
 * Electron Main Process
 * DeepCode Editor - Migrated from Tauri to Electron
 *
 * Architecture: Cursor/VS Code style (Electron + Monaco Editor)
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Keep a global reference to prevent garbage collection
let mainWindow = null;

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
      preload: path.join(__dirname, 'preload.cjs'),
      // Monaco Editor requires web workers
      webviewTag: false,
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
  createWindow();

  // macOS: Re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
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
    return { success: false, error: error.message };
  }
});

// Write file
ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
  }
});

// Create directory
ipcMain.handle('fs:createDir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
  }
});

// Rename/move file
ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
  }
});

/**
 * IPC Handlers - Dialog Operations
 */

// Open file dialog
ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      ...options,
    });
    return { success: true, canceled: result.canceled, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open folder dialog
ipcMain.handle('dialog:openFolder', async (event, options = {}) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      ...options,
    });
    return { success: true, canceled: result.canceled, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      ...options,
    });
    return { success: true, canceled: result.canceled, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
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
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      code: error.code || 1,
    };
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
    return { success: false, error: error.message };
  }
});

// Open external URL
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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

console.log('[Electron] Main process initialized');
console.log('[Electron] Mode:', isDev ? 'development' : 'production');
console.log('[Electron] Platform:', process.platform);
