import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { initDatabase } from './database';

export function registerProjectIpc(): void {
  const { db } = initDatabase() as { db: Database.Database };

  ipcMain.handle('project:save', async (_evt, args: { id?: string; name: string; type: string; content: string; favorite?: boolean }) => {
    const now = Date.now();
    const id = args.id ?? crypto.randomUUID();
    db.prepare(`
      INSERT INTO projects (id, name, type, content, metadata, template_id, created_at, updated_at, is_favorite)
      VALUES (@id, @name, @type, @content, @metadata, @template_id, @created_at, @updated_at, @is_favorite)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, type=excluded.type, content=excluded.content, updated_at=excluded.updated_at, is_favorite=excluded.is_favorite
    `).run({
      id,
      name: args.name,
      type: args.type,
      content: args.content,
      metadata: null,
      template_id: null,
      created_at: now,
      updated_at: now,
      is_favorite: args.favorite ? 1 : 0
    });
    db.prepare(`
      INSERT INTO project_versions (id, project_id, content, created_at) VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, args.content, now);
    return { id, updatedAt: now };
  });

  ipcMain.handle('project:list', async () => {
    const rows = db.prepare(`SELECT id, name, type, updated_at as updatedAt, is_favorite as isFavorite FROM projects ORDER BY updated_at DESC LIMIT 100`).all();
    return rows;
  });
}
