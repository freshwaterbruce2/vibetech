"use strict";
/**
 * Database Handler - Main Process Only
 * Handles all database operations using better-sqlite3
 * This file MUST only run in the main process (Node.js)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.executeQuery = executeQuery;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let db = null;
/**
 * Get the database path
 */
function getDatabasePath() {
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
function initializeDatabase() {
    try {
        const dbPath = getDatabasePath();
        // Ensure the directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Open database connection
        db = new better_sqlite3_1.default(dbPath);
        // Enable WAL mode for better concurrency
        db.pragma('journal_mode = WAL');
        // Create tables if they don't exist
        createTables();
        console.log('[Database] Initialized at:', dbPath);
        return { success: true };
    }
    catch (error) {
        console.error('[Database] Initialization failed:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Create database tables
 * Table names match DatabaseService expectations (deepcode_* prefix)
 */
function createTables() {
    if (!db)
        throw new Error('Database not initialized');
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
function executeQuery(sql, params = []) {
    try {
        if (!db) {
            initializeDatabase();
        }
        const stmt = db.prepare(sql);
        // Check if it's a SELECT query
        if (sql.trim().toLowerCase().startsWith('select')) {
            const rows = stmt.all(...params);
            return { success: true, rows };
        }
        else {
            const result = stmt.run(...params);
            return { success: true, rows: [] };
        }
    }
    catch (error) {
        console.error('[Database] Query failed:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Close the database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Connection closed');
    }
}
