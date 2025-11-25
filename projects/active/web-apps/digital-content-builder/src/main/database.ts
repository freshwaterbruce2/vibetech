import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

export type AppDatabase = {
  db: Database.Database;
  filePath: string;
};

export function initDatabase(): AppDatabase {
  const userDataDir = app.getPath('userData');
  const dbDir = path.join(userDataDir, 'digital-content-builder');
  const dbFile = path.join(dbDir, 'database.sqlite');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbFile);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Projects
  db.prepare(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      metadata TEXT,
      template_id TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      is_favorite INTEGER DEFAULT 0
    )
  `).run();

  // Templates
  db.prepare(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      type TEXT,
      content TEXT,
      preview_url TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at INTEGER
    )
  `).run();

  // Brand voices
  db.prepare(`
    CREATE TABLE IF NOT EXISTS brand_voices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tone TEXT,
      sample_content TEXT,
      ai_profile TEXT,
      created_at INTEGER
    )
  `).run();

  // Exports
  db.prepare(`
    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      format TEXT,
      file_path TEXT,
      exported_at INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `).run();

  // Version history (lightweight)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS project_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      content TEXT,
      created_at INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `).run();

  return { db, filePath: dbFile };
}
