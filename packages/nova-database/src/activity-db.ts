/**
 * Activity Database Service
 * Manages file, git, and process activity events using better-sqlite3
 */

import Database from 'better-sqlite3';
import type { FileEvent, GitEvent, ProcessEvent, ActivityFilter } from '@nova/types';
import { resolve } from 'path';

const DB_PATH = process.env.NOVA_ACTIVITY_DB_PATH || 'D:\\databases\\nova_activity.db';

export class ActivityDatabase {
  private db: Database.Database;

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(resolve(dbPath));
    this.initSchema();
  }

  private initSchema() {
    // File events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('create', 'modify', 'delete', 'rename')),
        timestamp INTEGER NOT NULL,
        project TEXT,
        old_path TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_file_events_timestamp ON file_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_file_events_project ON file_events(project);
    `);

    // Git events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS git_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_path TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('commit', 'checkout', 'merge', 'pull', 'push', 'branch-create', 'branch-delete')),
        branch TEXT,
        commit_hash TEXT,
        message TEXT,
        author TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_git_events_timestamp ON git_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_git_events_repo ON git_events(repo_path);
    `);

    // Process events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS process_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        pid INTEGER NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('start', 'stop', 'crash')),
        port INTEGER,
        command_line TEXT,
        project TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_process_events_timestamp ON process_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_process_events_project ON process_events(project);
    `);
  }

  // File Events
  insertFileEvent(event: FileEvent): number {
    const stmt = this.db.prepare(`
      INSERT INTO file_events (path, event_type, timestamp, project, old_path)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.path,
      event.eventType,
      event.timestamp,
      event.project || null,
      event.oldPath || null
    );
    return Number(result.lastInsertRowid);
  }

  getFileEvents(filter: ActivityFilter = {}): FileEvent[] {
    let query = 'SELECT * FROM file_events WHERE 1=1';
    const params: any[] = [];

    if (filter.startTime) {
      query += ' AND timestamp >= ?';
      params.push(filter.startTime);
    }
    if (filter.endTime) {
      query += ' AND timestamp <= ?';
      params.push(filter.endTime);
    }
    if (filter.projects && filter.projects.length > 0) {
      query += ` AND project IN (${  filter.projects.map(() => '?').join(',')  })`;
      params.push(...filter.projects);
    }
    if (filter.searchQuery) {
      query += ' AND path LIKE ?';
      params.push(`%${filter.searchQuery}%`);
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      path: row.path,
      eventType: row.event_type,
      timestamp: row.timestamp,
      project: row.project,
      oldPath: row.old_path
    }));
  }

  // Git Events
  insertGitEvent(event: GitEvent): number {
    const stmt = this.db.prepare(`
      INSERT INTO git_events (repo_path, event_type, branch, commit_hash, message, author, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.repoPath,
      event.eventType,
      event.branch || null,
      event.commitHash || null,
      event.message || null,
      event.author || null,
      event.timestamp
    );
    return Number(result.lastInsertRowid);
  }

  getGitEvents(filter: ActivityFilter = {}): GitEvent[] {
    let query = 'SELECT * FROM git_events WHERE 1=1';
    const params: any[] = [];

    if (filter.startTime) {
      query += ' AND timestamp >= ?';
      params.push(filter.startTime);
    }
    if (filter.endTime) {
      query += ' AND timestamp <= ?';
      params.push(filter.endTime);
    }

    query += ' ORDER BY timestamp DESC LIMIT 500';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      repoPath: row.repo_path,
      eventType: row.event_type,
      branch: row.branch,
      commitHash: row.commit_hash,
      message: row.message,
      author: row.author,
      timestamp: row.timestamp
    }));
  }

  // Process Events
  insertProcessEvent(event: ProcessEvent): number {
    const stmt = this.db.prepare(`
      INSERT INTO process_events (name, pid, event_type, port, command_line, project, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.name,
      event.pid,
      event.eventType,
      event.port || null,
      event.commandLine || null,
      event.project || null,
      event.timestamp
    );
    return Number(result.lastInsertRowid);
  }

  getProcessEvents(filter: ActivityFilter = {}): ProcessEvent[] {
    let query = 'SELECT * FROM process_events WHERE 1=1';
    const params: any[] = [];

    if (filter.startTime) {
      query += ' AND timestamp >= ?';
      params.push(filter.startTime);
    }
    if (filter.endTime) {
      query += ' AND timestamp <= ?';
      params.push(filter.endTime);
    }
    if (filter.projects && filter.projects.length > 0) {
      query += ` AND project IN (${  filter.projects.map(() => '?').join(',')  })`;
      params.push(...filter.projects);
    }

    query += ' ORDER BY timestamp DESC LIMIT 500';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      pid: row.pid,
      eventType: row.event_type,
      port: row.port,
      commandLine: row.command_line,
      project: row.project,
      timestamp: row.timestamp
    }));
  }

  // Cleanup old events (retention policy)
  cleanupOldEvents(daysToKeep = 30) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    this.db.prepare('DELETE FROM file_events WHERE timestamp < ?').run(cutoffTime);
    this.db.prepare('DELETE FROM git_events WHERE timestamp < ?').run(cutoffTime);
    this.db.prepare('DELETE FROM process_events WHERE timestamp < ?').run(cutoffTime);
  }

  // Statistics
  getActivityStats() {
    const fileCount = this.db.prepare('SELECT COUNT(*) as count FROM file_events').get() as { count: number };
    const gitCount = this.db.prepare('SELECT COUNT(*) as count FROM git_events').get() as { count: number };
    const processCount = this.db.prepare('SELECT COUNT(*) as count FROM process_events').get() as { count: number };

    return {
      totalFileEvents: fileCount.count,
      totalGitEvents: gitCount.count,
      totalProcessEvents: processCount.count,
      totalEvents: fileCount.count + gitCount.count + processCount.count
    };
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
let activityDb: ActivityDatabase | null = null;

export function getActivityDatabase(): ActivityDatabase {
  if (!activityDb) {
    activityDb = new ActivityDatabase();
  }
  return activityDb;
}
