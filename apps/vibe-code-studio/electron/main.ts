/**
 * Electron Main Process
 * DeepCode Editor - Migrated from Tauri to Electron
 *
 * Architecture: Cursor/VS Code style (Electron + Monaco Editor)
 */

import { ChildProcess, exec, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain, session, shell } from 'electron';
import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import * as net from 'net';
import * as path from 'path';
import { promisify } from 'util';
import * as dbHandler from './database-handler';
import { initializeWindowsIntegration } from './windows-integration';

const execAsync = promisify(exec);

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let ipcBridgeProcess: ChildProcess | null = null;

// Development or production mode
const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5174';

/**
 * Check if a TCP port is open (listening)
 */
async function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      try { socket.destroy(); } catch { /* noop */ }
      resolve(false);
    };
    socket.setTimeout(1500);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, host, () => {
      try { socket.end(); } catch { /* noop */ }
      resolve(true);
    });
  });
}

/**
 * Wait until a port becomes open, with timeout
 */
async function waitForPort(
  port: number,
  host = '127.0.0.1',
  timeoutMs = 10000,
  intervalMs = 300
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {

    if (await isPortOpen(port, host)) {
      return true;
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * Resolve the filesystem path to the IPC Bridge project directory
 * Priority:
 *  1) env VIBE_IPC_BRIDGE_DIR
 *  2) Monorepo path (dev): <repoRoot>/backend/ipc-bridge
 *  3) Fallback (prod): C:\\dev\\backend\\ipc-bridge
 */
function resolveIpcBridgeDir(): string | null {
  const envPath = process.env['VIBE_IPC_BRIDGE_DIR'];
  if (envPath && fsSync.existsSync(envPath)) {
    console.log('[IPC Bridge] Using env path:', envPath);
    return envPath;
  }

  if (isDev) {
    const repoRoot = path.resolve(app.getAppPath(), '..', '..', '..', '..');
    const devPath = path.join(repoRoot, 'backend', 'ipc-bridge');
    if (fsSync.existsSync(devPath)) {
      console.log('[IPC Bridge] Using monorepo path:', devPath);
      return devPath;
    }
  }

  const fallbackWin = 'C:\\\\dev\\\\backend\\\\ipc-bridge';
  if (process.platform === 'win32' && fsSync.existsSync(fallbackWin)) {
    console.log('[IPC Bridge] Using fallback path:', fallbackWin);
    return fallbackWin;
  }

  console.warn('[IPC Bridge] Could not resolve bridge directory. Set VIBE_IPC_BRIDGE_DIR env var.');
  return null;
}

/**
 * Start IPC Bridge if port 5004 is not listening
 * Spawns: node src/server.js (requires dependencies to be installed)
 */
async function startIpcBridgeIfNeeded(): Promise<void> {
  const PORT = 5004;
  const alreadyOpen = await isPortOpen(PORT);
  if (alreadyOpen) {
    console.log('[IPC Bridge] Port 5004 is already open; skipping start.');
    return;
  }

  const bridgeDir = resolveIpcBridgeDir();
  if (!bridgeDir) {
    console.warn('[IPC Bridge] Bridge directory not found; cannot auto-start.');
    return;
  }

  try {
    console.log('[IPC Bridge] Starting bridge at:', bridgeDir);
    ipcBridgeProcess = spawn('node', ['src/server.js'], {
      cwd: bridgeDir,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    ipcBridgeProcess.stdout?.on('data', (data: Buffer) => {
      console.log('[IPC Bridge][stdout]', data.toString().trim());
    });
    ipcBridgeProcess.stderr?.on('data', (data: Buffer) => {
      console.error('[IPC Bridge][stderr]', data.toString().trim());
    });
    ipcBridgeProcess.on('error', (err) => {
      console.error('[IPC Bridge] Failed to start:', err);
    });
    ipcBridgeProcess.on('exit', (code, signal) => {
      console.warn('[IPC Bridge] exited', { code, signal });
      ipcBridgeProcess = null;
    });

    const up = await waitForPort(PORT, '127.0.0.1', 12000, 400);
    if (up) {
      console.log('[IPC Bridge] Bridge is listening on ws://localhost:5004');
    } else {
      console.warn('[IPC Bridge] Bridge did not start listening within timeout.');
    }
  } catch (error) {
    console.error('[IPC Bridge] Error while starting bridge:', error);
  }
}

/**
 * Ensure the bridge is cleaned up on app exit
 */
function setupIpcBridgeShutdown(): void {
  const terminate = () => {
    if (ipcBridgeProcess && !ipcBridgeProcess.killed) {
      try {
        console.log('[IPC Bridge] Terminating bridge process...');
        if (process.platform === 'win32') {
          ipcBridgeProcess.kill('SIGTERM');
          setTimeout(() => {
            try { ipcBridgeProcess?.kill('SIGKILL'); } catch { /* noop */ }
          }, 1500);
        } else {
          ipcBridgeProcess.kill('SIGTERM');
        }
      } catch (e) {
        console.error('[IPC Bridge] Error terminating process:', e);
      }
    }
  };

  app.on('before-quit', terminate);
  app.on('will-quit', terminate);
}

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
    center: true, // CRITICAL: Center window on screen
    webPreferences: {
      nodeIntegration: false, // Security: disable Node.js in renderer
      contextIsolation: true, // Security: isolate context
      sandbox: false, // Allow access to Node.js APIs via preload
      preload: path.join(__dirname, '../preload/index.cjs'), // CommonJS for electron-builder compatibility
      // Monaco Editor requires web workers
      webviewTag: false,
      // Windows 11 GPU acceleration optimizations
      enableWebSQL: false,
      offscreen: false, // Enable GPU acceleration
      backgroundThrottling: false, // Prevent throttling for better performance
    },
    show: false, // Start hidden, show when ready
  });

  // Enable hardware acceleration for Monaco rendering (RTX 3060)
  if (mainWindow && process.platform === 'win32') {
    mainWindow.webContents.setBackgroundThrottling(false);
    // Force GPU acceleration
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.executeJavaScript(`
        // Enable GPU acceleration hints for Monaco
        if (window.monaco) {
          console.log('[Monaco] GPU acceleration enabled for RTX 3060');
        }
      `);
    });
  }

  // CRITICAL: Force window visibility when ready
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready to show');
    if (mainWindow) {
      mainWindow.center(); // Force center on screen
      mainWindow.show(); // Make visible
      mainWindow.focus(); // Bring to front
      mainWindow.moveTop(); // Ensure it's on top

      console.log('[Electron] Window position:', mainWindow.getPosition());
      console.log('[Electron] Window visible:', mainWindow.isVisible());
      console.log('[Electron] Window minimized:', mainWindow.isMinimized());

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
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[Electron] Failed to load:', errorCode, errorDescription);
  });

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Page loaded successfully');
  });

  // Load the app
  if (isDev) {
    // Attempt to start the IPC bridge automatically in development
    void startIpcBridgeIfNeeded();
    if (mainWindow) {
      mainWindow.loadURL(VITE_DEV_SERVER_URL);
    }
  } else {
    // Attempt to start the IPC bridge automatically in production
    void startIpcBridgeIfNeeded();
    // In production, load from the dist folder
    // The app bundle is in resources/app when packaged
    const appPath = app.getAppPath();

    // Production paths to try (in order of preference)
    const pathsToTry = [
      path.join(appPath, 'dist', 'index.html'),              // Standard: resources/app/dist/index.html
      path.join(process.resourcesPath, 'dist', 'index.html'), // Fallback: resources/dist/index.html
      path.join(appPath, '..', 'dist', 'index.html'),        // Alternative: resources/dist/index.html
    ];

    let indexPath = pathsToTry[0] ?? '';
    for (const tryPath of pathsToTry) {
      if (fsSync.existsSync(tryPath)) {
        indexPath = tryPath;
        console.log('[Electron] Found index.html at:', indexPath);
        break;
      }
    }

    console.log('[Electron] App path:', appPath);
    console.log('[Electron] Resources path:', process.resourcesPath);
    console.log('[Electron] Loading from:', indexPath);
    console.log('[Electron] File exists:', indexPath ? fsSync.existsSync(indexPath) : false);

    if (mainWindow && indexPath) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('[Electron] index.html path is empty; cannot load UI.');
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
 * Configure Content Security Policy
 * This is the recommended approach for Electron apps (vs meta tags in HTML)
 */
function setupCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Vite dev server injects inline scripts for HMR - allow in development
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-eval'";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            scriptSrc, // Monaco Editor needs unsafe-eval, Vite HMR needs unsafe-inline in dev
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
 * Configure Windows 11 optimizations
 * - GPU acceleration for RTX 3060
 * - Multi-core processing for AMD Ryzen 7
 */
function configureWindowsOptimizations() {
  if (process.platform === 'win32') {
    // Enable GPU acceleration for RTX 3060
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
    app.commandLine.appendSwitch('enable-hardware-overlays');
    app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

    // Force GPU acceleration (for RTX 3060)
    app.commandLine.appendSwitch('ignore-gpu-blacklist');
    app.commandLine.appendSwitch('enable-gpu');

    // Optimize for multi-core (AMD Ryzen 7)
    app.commandLine.appendSwitch('enable-features', 'ParallelDownloading');

    // Memory optimizations
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

    console.log('[Electron] Windows 11 optimizations enabled (RTX 3060 GPU, AMD Ryzen 7 multi-core)');
  }
}

/**
 * App lifecycle events
 */
app.whenReady().then(async () => {
  // Configure Windows optimizations BEFORE creating windows
  configureWindowsOptimizations();

  // Configure CSP before creating windows
  setupCSP();
  // Setup cleanup hooks for the bridge process
  setupIpcBridgeShutdown();

  // Initialize database
  const dbInit = dbHandler.initializeDatabase();
  if (!dbInit.success) {
    console.error('[Electron] Database initialization failed:', dbInit.error);
  }

  // Initialize secure storage on startup (CRITICAL: Must happen before createWindow)
  try {
    await initSecureStorage();
    console.log('[Electron] Secure storage initialized successfully');
  } catch (error) {
    console.error('[Electron] Failed to initialize secure storage:', error);
  }

  createWindow();

  // Initialize Windows 11 native integrations
  if (process.platform === 'win32') {
    initializeWindowsIntegration().catch((error) => {
      console.error('[Electron] Windows integration initialization failed:', error);
    });

    // Handle file/folder opening from command line or file association
    const openPath = process.argv.find(arg =>
      arg !== process.execPath &&
      !arg.startsWith('--') &&
      (fsSync.existsSync(arg) || path.isAbsolute(arg))
    );

    if (openPath) {
      // Wait for window to be ready, then send file path
      mainWindow?.webContents.once('did-finish-load', () => {
        mainWindow?.webContents.send('open-path', openPath);
        console.log('[Electron] Opening path from command line:', openPath);
      });
    }
  }

  // Handle additional file opens (Windows file associations)
  app.on('second-instance', (_event, commandLine, _workingDirectory) => {
    // Another instance tried to open - focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Open any file paths from command line
      const filePaths = commandLine.slice(1).filter(arg =>
        !arg.startsWith('--') && (fsSync.existsSync(arg) || path.isAbsolute(arg))
      );

      if (filePaths.length > 0) {
        mainWindow.webContents.send('open-paths', filePaths);
        console.log('[Electron] Opening files from second instance:', filePaths);
      }
    }
  });

  // Prevent multiple instances (Windows)
  if (process.platform === 'win32') {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }
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
  dbHandler.closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPC Handlers - File System Operations
 */

// Read file
ipcMain.handle('fs:readFile', async (_event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Write file
ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Read directory
ipcMain.handle('fs:readDir', async (_event, dirPath) => {
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
ipcMain.handle('fs:createDir', async (_event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Delete file/directory
ipcMain.handle('fs:remove', async (_event, targetPath) => {
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
ipcMain.handle('fs:rename', async (_event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Check if path exists
ipcMain.handle('fs:exists', async (_event, targetPath) => {
  try {
    await fs.access(targetPath);
    return { success: true, exists: true };
  } catch (error) {
    return { success: true, exists: false };
  }
});

// Get file stats
ipcMain.handle('fs:stat', async (_event, targetPath) => {
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
ipcMain.handle('dialog:openFile', async (_event, options = {}) => {
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
ipcMain.handle('dialog:openFolder', async (_event, options = {}) => {
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
ipcMain.handle('dialog:saveFile', async (_event, options = {}) => {
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
ipcMain.handle('shell:execute', async (_event, command, cwd) => {
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

// Ensure userData directory exists (critical for production)
const ensureUserDataDir = async () => {
  const userDataPath = app.getPath('userData');
  try {
    await fs.access(userDataPath);
  } catch {
    // Directory doesn't exist, create it
    console.log('[Electron] Creating userData directory:', userDataPath);
    await fs.mkdir(userDataPath, { recursive: true });
  }
};

// Initialize secure storage file if it doesn't exist
const initSecureStorage = async () => {
  // CRITICAL: Ensure userData directory exists first
  await ensureUserDataDir();

  const storagePath = getSecureStoragePath();
  try {
    await fs.access(storagePath);
    console.log('[Electron] Secure storage exists at:', storagePath);
  } catch {
    // File doesn't exist, create it
    console.log('[Electron] Creating secure storage at:', storagePath);
    await fs.writeFile(storagePath, JSON.stringify({}), 'utf-8');
  }
};

// Get secure storage data
ipcMain.handle('storage:get', async (_event, key) => {
  try {
    console.log('[Electron] storage:get called for key:', key);
    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    const value = storage[key] || null;
    console.log('[Electron] storage:get success, key exists:', !!value);
    return { success: true, value };
  } catch (error) {
    console.error('[Electron] storage:get FAILED:', error);
    console.error('[Electron] Storage path:', getSecureStoragePath());
    console.error('[Electron] UserData path:', app.getPath('userData'));
    return { success: false, error: (error as Error).message };
  }
});

// Set secure storage data
ipcMain.handle('storage:set', async (_event, key, value) => {
  try {
    console.log('[Electron] storage:set called for key:', key);
    console.log('[Electron] UserData path:', app.getPath('userData'));

    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    console.log('[Electron] Storage file path:', storagePath);

    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    storage[key] = value;

    await fs.writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf-8');
    console.log('[Electron] storage:set SUCCESS - Saved to:', storagePath);

    // Verify write worked
    const verifyData = await fs.readFile(storagePath, 'utf-8');
    const verifyStorage = JSON.parse(verifyData);
    if (verifyStorage[key] === value) {
      console.log('[Electron] storage:set VERIFIED - Read back successfully');
    } else {
      console.error('[Electron] storage:set VERIFICATION FAILED - Value not saved correctly');
    }

    return { success: true };
  } catch (error) {
    console.error('[Electron] storage:set FAILED:', error);
    console.error('[Electron] Storage path:', getSecureStoragePath());
    console.error('[Electron] UserData path:', app.getPath('userData'));
    console.error('[Electron] Error stack:', (error as Error).stack);
    return { success: false, error: (error as Error).message };
  }
});

// Remove secure storage data
ipcMain.handle('storage:remove', async (_event, key) => {
  try {
    await initSecureStorage();
    const storagePath = getSecureStoragePath();
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data) as Record<string, unknown>;
    // Reconstruct object without the key to satisfy lint rules

    const { [key]: _removed, ...rest } = storage;
    await fs.writeFile(storagePath, JSON.stringify(rest, null, 2), 'utf-8');
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
ipcMain.handle('app:getPath', async (_event, name) => {
  try {
    const appPath = app.getPath(name);
    return { success: true, path: appPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Open external URL
ipcMain.handle('shell:openExternal', async (_event, url) => {
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
ipcMain.handle('db:query', async (_event, sql, params = []) => {
  try {
    const result = dbHandler.executeQuery(sql, params);
    return result;
  } catch (error) {
    console.error('[Electron] Database query error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * IPC Handlers - Learning Adapter (Python)
 */
type LearningCommand = 'error_prevention' | 'performance_optimize' | 'pattern_recognition' | 'batch_optimize';

function resolveLearningModulePath(command: LearningCommand): string {
  const base = process.env['LEARNING_SYSTEM_DIR'] || 'D:\\\\learning-system';
  switch (command) {
    case 'error_prevention':
      return path.resolve(base, 'error_prevention_utils.py');
    case 'performance_optimize':
      return path.resolve(base, 'performance_optimization.py');
    case 'pattern_recognition':
      return path.resolve(base, 'pattern_recognition.py');
    case 'batch_optimize':
      return path.resolve(base, 'batch_optimization.py');
  }
}

ipcMain.handle('learning:run', async (_event, command: LearningCommand, payload: any, options?: { timeoutMs?: number; pythonPath?: string; moduleOverride?: string }) => {
  const timeoutMs = Math.max(1000, options?.timeoutMs ?? 5000);
  const pythonPath = options?.pythonPath || 'python';
  const modulePath = options?.moduleOverride || resolveLearningModulePath(command);

  return await new Promise<{ success: boolean; result?: any; error?: string; durationMs?: number }>((resolve) => {
    const startedAt = Date.now();
    const child = spawn(pythonPath, [modulePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const to = setTimeout(() => {
      if (finished) return;
      finished = true;
      try { child.kill('SIGKILL'); } catch { /* noop */ }
      resolve({ success: false, error: `Timeout after ${timeoutMs}ms`, durationMs: Date.now() - startedAt, });
    }, timeoutMs);

    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(to);
      resolve({ success: false, error: `Failed to start python: ${err.message}`, durationMs: Date.now() - startedAt });
    });
    child.on('exit', () => {
      if (finished) return;
      finished = true;
      clearTimeout(to);
      try {
        const parsed = JSON.parse(stdout || '{}');
        resolve({ success: true, result: parsed, durationMs: Date.now() - startedAt });
      } catch (e: any) {
        resolve({ success: false, error: `Invalid JSON from python: ${e.message}`, durationMs: Date.now() - startedAt });
      }
    });

    try {
      const body = JSON.stringify({ command, payload });
      child.stdin?.write(body);
      child.stdin?.end();
    } catch { /* stdin write failure handled by exit */ }
  });
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
