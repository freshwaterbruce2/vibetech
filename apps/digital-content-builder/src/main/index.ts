import { app, BrowserWindow, ipcMain } from 'electron';
import 'dotenv/config';
import log from 'electron-log';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './database';
import { registerAiProxy } from './api-proxy';
import { registerExportHandlers } from './export';
import { registerProjectIpc } from './projects-ipc';
import { registerBrandIpc } from './brand-ipc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let databaseReady = false;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    initDatabase();
    databaseReady = true;
  } catch (err) {
    log.error('Failed to initialize database', err);
  }
  await createWindow();
  // Register IPC handlers after app ready
  registerAiProxy();
  registerExportHandlers();
  registerProjectIpc();
  registerBrandIpc();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Placeholder IPC - will be implemented in the API proxy task
ipcMain.handle('health:ping', async () => {
  return { ok: true, ts: Date.now(), db: databaseReady, hasKey: Boolean(process.env.DEEPSEEK_API_KEY) };
});
