/**
 * Database Handler - Main Process Only
 * Handles all database operations using better-sqlite3
 * This file MUST only run in the main process (Node.js)
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let db: Database.Database | null = null;

/**
 * Get the database path
 */
function getDatabasePath(): string {
  // Use D: drive for databases alongside learning system
  const dbDir = 'D:\\databases';
  
  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, 'database.db');
}

/**
 * Initialize the database connection
 */
export function initializeDatabase(): { success: boolean; error?: string } {
  try {
    const dbPath = getDatabasePath();

    // Ensure the directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database connection
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Create tables if they don't exist
    createTables();

    console.log('[Database] Initialized at:', dbPath);
    return { success: true };
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create database tables
 */
function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      workspace_path TEXT NOT NULL,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      model_used TEXT NOT NULL,
      tokens_used INTEGER,
      workspace_context TEXT
    );
  `);

  // Code snippets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      usage_count INTEGER DEFAULT 0,
      last_used DATETIME
    );
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Analytics events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Strategy patterns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS strategy_patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      complexity INTEGER,
      learning_type TEXT,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Execute a query
 */
export function executeQuery(sql: string, params: any[] = []): { success: boolean; data?: any; error?: string } {
  try {
    if (!db) {
      initializeDatabase();
    }

    const stmt = db!.prepare(sql);

    // Check if it's a SELECT query
    if (sql.trim().toLowerCase().startsWith('select')) {
      const data = stmt.all(...params);
      return { success: true, data };
    } else {
      const result = stmt.run(...params);
      return { success: true, data: result };
    }
  } catch (error) {
    console.error('[Database] Query failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] Connection closed');
  }
}
