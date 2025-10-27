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
 * Table names match DatabaseService expectations (deepcode_* prefix)
 */
function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Chat history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deepcode_chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      workspace_path TEXT,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      model_used TEXT,
      tokens_used INTEGER,
      workspace_context TEXT
    );
  `);

  // Code snippets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deepcode_code_snippets (
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
    CREATE TABLE IF NOT EXISTS deepcode_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deepcode_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Strategy memory table (migrated from localStorage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS deepcode_strategy_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_hash TEXT UNIQUE NOT NULL,
      pattern_data TEXT NOT NULL,
      success_rate REAL DEFAULT 0.0,
      usage_count INTEGER DEFAULT 0,
      last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_workspace ON deepcode_chat_history(workspace_path);
    CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON deepcode_chat_history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_strategy_hash ON deepcode_strategy_memory(pattern_hash);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON deepcode_analytics(event_type);
  `);
}

/**
 * Execute a query
 */
export function executeQuery(sql: string, params: any[] = []): { success: boolean; rows?: any[]; error?: string } {
  try {
    if (!db) {
      initializeDatabase();
    }

    const stmt = db!.prepare(sql);

    // Check if it's a SELECT query
    if (sql.trim().toLowerCase().startsWith('select')) {
      const rows = stmt.all(...params);
      return { success: true, rows };
    } else {
      const result = stmt.run(...params);
      return { success: true, rows: [] };
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
