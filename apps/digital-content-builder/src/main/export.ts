import { app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { initDatabase } from './database';
import { BrowserWindow } from 'electron';

function ensureExportDir(): string {
  const dir = path.join(app.getPath('userData'), 'digital-content-builder', 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFileAtomic(filePath: string, data: string): void {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, data, 'utf-8');
  fs.renameSync(tmp, filePath);
}

export function registerExportHandlers(): void {
  const { db } = initDatabase() as { db: Database.Database };
  const dir = ensureExportDir();

  ipcMain.handle('export:html', async (_evt, args: { projectId?: string; content: string; name?: string }) => {
    const name = `${args?.name || 'export'  }.html`;
    const filePath = path.join(dir, name);
    writeFileAtomic(filePath, args.content);
    db.prepare(
      'INSERT INTO exports (id, project_id, format, file_path, exported_at) VALUES (?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      args.projectId ?? null,
      'html',
      filePath,
      Date.now()
    );
    return { filePath };
  });

  ipcMain.handle('export:markdown', async (_evt, args: { projectId?: string; content: string; name?: string }) => {
    const name = `${args?.name || 'export'  }.md`;
    const filePath = path.join(dir, name);
    writeFileAtomic(filePath, args.content);
    db.prepare(
      'INSERT INTO exports (id, project_id, format, file_path, exported_at) VALUES (?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      args.projectId ?? null,
      'md',
      filePath,
      Date.now()
    );
    return { filePath };
  });

  ipcMain.handle('export:json', async (_evt, args: { projectId?: string; data: any; name?: string }) => {
    const name = `${args?.name || 'export'  }.json`;
    const filePath = path.join(dir, name);
    writeFileAtomic(filePath, JSON.stringify(args.data, null, 2));
    db.prepare(
      'INSERT INTO exports (id, project_id, format, file_path, exported_at) VALUES (?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      args.projectId ?? null,
      'json',
      filePath,
      Date.now()
    );
    return { filePath };
  });

  ipcMain.handle('export:pdf', async (_evt, args: { projectId?: string; html: string; name?: string }) => {
    const name = `${args?.name || 'export'  }.pdf`;
    const filePath = path.join(dir, name);
    // Create an offscreen window to render HTML and print to PDF
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true
      }
    });
    try {
      const dataUrl = `data:text/html;charset=utf-8,${  encodeURIComponent(args.html ?? '<!doctype html><html></html>')}`;
      await win.loadURL(dataUrl);
      const pdfBuffer = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { marginType: 1 }
      });
      fs.writeFileSync(filePath, pdfBuffer);
      db.prepare(
        'INSERT INTO exports (id, project_id, format, file_path, exported_at) VALUES (?, ?, ?, ?, ?)'
      ).run(
        crypto.randomUUID(),
        args.projectId ?? null,
        'pdf',
        filePath,
        Date.now()
      );
      return { filePath };
    } finally {
      win.destroy();
    }
  });
}
