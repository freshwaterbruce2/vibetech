/**
 * DatabaseService - Centralized database integration
 *
 * Integrates DeepCode Editor with the centralized D:\databases\database.db
 * following monorepo best practices.
 *
 * Features:
 * - Chat history persistence across sessions
 * - Code snippets library with search
 * - Application settings storage
 * - Analytics and telemetry tracking
 * - Strategy memory migration from localStorage
 *
 * Platform Support:
 * - Electron: Native SQLite via better-sqlite3
 * - Web: In-memory SQLite via sql.js
 * - Graceful fallback to localStorage when database unavailable
 */

import type { StrategyPattern } from '../types';

import { logger } from './Logger';

// Database path configuration - cross-platform with D: drive preference
const getDatabasePath = (): string => {
  // Check if running in Electron
  if (typeof window !== 'undefined' && window.electron?.isElectron) {
    // First check if D: drive is available (Windows only)
    if ((window.electron.platform as any)?.os === 'win32') {
      // Try to use centralized database on D: drive if available
      // This is the preferred location for the monorepo setup
      const centralizedPath = 'D:\\databases\\database.db';

      // Note: We'll attempt to use this path first, but will fall back if it fails
      logger.debug(`[DatabaseService] Attempting to use centralized database at: ${centralizedPath}`);
      return centralizedPath;
    }

    // For non-Windows or if D: drive is not available, use userData path
    const userDataPath = window.electron.app?.getPath('userData') || '';
    const sep = (window.electron.platform as any)?.pathSeparator || '\\';
    return `${userDataPath}${sep}deepcode_database.db`;
  } else if (typeof window !== 'undefined' && window.electron?.platform) {
    // Electron platform API available
    const platform = (window.electron.platform as any).os;
    const {homedir} = (window.electron.platform as any);
    const sep = (window.electron.platform as any).pathSeparator;

    if (platform === 'win32') {
      // Windows: Try D: drive first, then AppData
      const centralizedPath = 'D:\\databases\\database.db';
      logger.debug(`[DatabaseService] Attempting to use centralized database at: ${centralizedPath}`);
      return centralizedPath;
    } else if (platform === 'darwin') {
      // macOS: Use Application Support
      return `${homedir}${sep}Library${sep}Application Support${sep}deepcode-editor${sep}database.db`;
    } else {
      // Linux: Use .local/share
      return `${homedir}${sep}.local${sep}share${sep}deepcode-editor${sep}database.db`;
    }
  } else {
    // Fallback for web environment - use localStorage only
    logger.debug('[DatabaseService] Web environment detected, will use localStorage fallback');
    return '';
  }
};

const DATABASE_PATH = getDatabasePath();
const STORAGE_FALLBACK_PREFIX = 'deepcode_fallback_';

// Interface definitions
export interface ChatMessage {
  id?: number;
  timestamp?: Date;
  workspace_path: string;
  user_message: string;
  ai_response: string;
  model_used: string;
  tokens_used?: number;
  workspace_context?: string; // JSON blob
}

export interface CodeSnippet {
  id?: number;
  language: string;
  code: string;
  description?: string;
  tags?: string; // JSON array
  created_at?: Date;
  usage_count?: number;
  last_used?: Date;
}

export interface Setting {
  key: string;
  value: string; // JSON blob
  updated_at?: Date;
}

export interface AnalyticsEvent {
  id?: number;
  event_type: string;
  event_data?: string; // JSON blob
  timestamp?: Date;
}

export interface StrategyMemoryRecord {
  id?: number;
  pattern_hash: string;
  pattern_data: string; // JSON blob
  success_rate: number;
  usage_count: number;
  last_used?: Date;
  created_at?: Date;
}

/**
 * DatabaseService
 *
 * Provides unified database access with automatic fallback to localStorage.
 * Handles both Electron (native) and web (sql.js) environments.
 */
export class DatabaseService {
  private db: any = null;
  private isElectron: boolean = false;
  private useFallback: boolean = false;
  private useIPC: boolean = false;  // Track if using IPC mode (Electron with better-sqlite3 via main process)
  private initialized: boolean = false;

  constructor() {
    this.isElectron = this.detectElectron();
  }

  /**
   * Initialize database connection and schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('[DatabaseService] Already initialized');
      return;
    }

    try {
      // Try to connect to database
      await this.connect();

      // Create schema if needed
      await this.initializeSchema();

      this.initialized = true;
      logger.debug('[DatabaseService] ✅ Initialized successfully');
    } catch (error) {
      logger.warn('[DatabaseService] Failed to initialize database, falling back to localStorage:', error);
      this.useFallback = true;
      this.initialized = true;
    }
  }

  /**
   * Connect to database (platform-specific)
   */
  private async connect(): Promise<void> {
    if (this.isElectron) {
      // Electron: Use IPC-based database access via main process
      // This is the 2025 security best practice - main process handles better-sqlite3
      try {
        if (!window.electron?.db) {
          throw new Error('Electron database API not available');
        }

        // Initialize database via IPC
        const result = await window.electron.db.initialize();

        if (!result.success) {
          throw new Error(result.error || 'Database initialization failed');
        }

        // Mark as successfully connected (using IPC, not direct db handle)
        this.db = 'ipc'; // Marker to indicate IPC mode
        logger.debug('[DatabaseService] Connected via Electron IPC to database');
      } catch (error) {
        logger.error('[DatabaseService] Failed to connect via IPC:', error);
        logger.warn('[DatabaseService] Falling back to localStorage');
        this.useFallback = true;
      }
    } else {
      // Web: Use sql.js (in-memory) or just localStorage
      if (DATABASE_PATH === '') {
        // Pure localStorage mode for web
        logger.debug('[DatabaseService] Web mode: Using localStorage fallback directly');
        this.useFallback = true;
        return;
      }

      // Web mode: Use localStorage fallback (sql.js not installed)
      logger.debug('[DatabaseService] Web mode: Using localStorage fallback');
      this.useFallback = true;

      /* Commented out sql.js code - not installed
      try {
        const initSqlJs = (await import('sql.js')).default;
        const SQL = await initSqlJs();

        // Try to load existing database from localStorage
        const saved = localStorage.getItem('deepcode_database_blob');
        if (saved) {
          const buffer = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
          this.db = new SQL.Database(buffer);
          logger.debug('[DatabaseService] Loaded existing database from localStorage (Web)');
        } else {
          this.db = new SQL.Database();
          logger.debug('[DatabaseService] Created new in-memory database (Web)');
        }
      } catch (error) {
        logger.warn('[DatabaseService] sql.js not available, using localStorage fallback');
        this.useFallback = true;
      }
      */
    }
  }

  /**
   * Initialize database schema (all tables and indexes)
   */
  private async initializeSchema(): Promise<void> {
    // Skip schema initialization if using fallback mode
    if (this.useFallback) {
      logger.debug('[DatabaseService] Skipping schema initialization in fallback mode');
      return;
    }

    const schema = `
      -- Chat history persistence
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

      -- Code snippets library
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

      -- Application settings
      CREATE TABLE IF NOT EXISTS deepcode_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Analytics and telemetry
      CREATE TABLE IF NOT EXISTS deepcode_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Strategy memory (migrated from localStorage)
      CREATE TABLE IF NOT EXISTS deepcode_strategy_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_hash TEXT UNIQUE NOT NULL,
        pattern_data TEXT NOT NULL,
        success_rate REAL DEFAULT 0.0,
        usage_count INTEGER DEFAULT 0,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_chat_workspace ON deepcode_chat_history(workspace_path);
      CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON deepcode_chat_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_strategy_hash ON deepcode_strategy_memory(pattern_hash);
      CREATE INDEX IF NOT EXISTS idx_analytics_type ON deepcode_analytics(event_type);
    `;

    try {
      if (this.db) {
        // sql.js: Execute all statements
        this.db.run(schema);
        await this.saveToLocalStorage();
        logger.debug('[DatabaseService] Schema initialized successfully');
      } else {
        // Using localStorage fallback, no schema needed
        logger.debug('[DatabaseService] Using localStorage fallback, skipping schema initialization');
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to initialize schema:', error);
      throw error;
    }
  }

  // ============================================
  // CHAT HISTORY METHODS
  // ============================================

  /**
   * Save a chat message to database
   */
  async saveChatMessage(
    workspace: string,
    userMessage: string,
    aiResponse: string,
    model: string,
    tokens?: number,
    context?: any
  ): Promise<number | null> {
    if (this.useFallback) {
      return this.saveChatMessageFallback(workspace, userMessage, aiResponse, model, tokens, context);
    }

    try {
      const sql = `
        INSERT INTO deepcode_chat_history
        (workspace_path, user_message, ai_response, model_used, tokens_used, workspace_context)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const contextJson = context ? JSON.stringify(context) : null;

      if (this.isElectron) {
        // Use IPC for database operations
        const result = await window.electron.db.query(sql, [
          workspace,
          userMessage,
          aiResponse,
          model,
          tokens || null,
          contextJson
        ]);

        if (!result.success) {
          throw new Error(result.error || 'Database operation failed');
        }

        return result.lastID || null;
      } else {
        this.db.run(sql, [workspace, userMessage, aiResponse, model, tokens || null, contextJson]);
        await this.saveToLocalStorage();
        return 1; // sql.js doesn't return lastInsertRowid easily
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to save chat message:', error);
      return null;
    }
  }

  /**
   * Get chat history for a workspace
   */
  async getChatHistory(
    workspace: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    if (this.useFallback) {
      return this.getChatHistoryFallback(workspace, limit, offset);
    }

    try {
      const sql = `
        SELECT * FROM deepcode_chat_history
        WHERE workspace_path = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;

      if (this.isElectron) {
        // Use IPC for database operations
        const result = await window.electron?.db?.query(sql, [workspace, limit, offset]);

        if (!result?.success) {
          throw new Error(result?.error || 'Database operation failed');
        }

        return (result.rows || []).map(this.parseChatMessage);
      } else {
        const result = this.db.exec(sql, [workspace, limit, offset]);
        if (!result[0]) {return [];}

        return result[0].values.map((row: any[]) => ({
          id: row[0],
          timestamp: new Date(row[1]),
          workspace_path: row[2],
          user_message: row[3],
          ai_response: row[4],
          model_used: row[5],
          tokens_used: row[6],
          workspace_context: row[7] ? JSON.parse(row[7]) : undefined,
        }));
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to get chat history:', error);
      return [];
    }
  }

  /**
   * Clear chat history for a workspace
   */
  async clearChatHistory(workspace: string): Promise<void> {
    if (this.useFallback) {
      return this.clearChatHistoryFallback(workspace);
    }

    try {
      const sql = 'DELETE FROM deepcode_chat_history WHERE workspace_path = ?';

      if (this.isElectron) {
        // Use IPC for database operations
        const result = await window.electron?.db?.query(sql, [workspace]);

        if (!result?.success) {
          throw new Error(result?.error || 'Database operation failed');
        }
      } else {
        this.db.run(sql, [workspace]);
      }

      await this.saveToLocalStorage();
      logger.debug(`[DatabaseService] Cleared chat history for ${workspace}`);
    } catch (error) {
      logger.error('[DatabaseService] Failed to clear chat history:', error);
    }
  }

  // ============================================
  // CODE SNIPPETS METHODS
  // ============================================

  /**
   * Save a code snippet
   */
  async saveSnippet(
    language: string,
    code: string,
    description?: string,
    tags?: string[]
  ): Promise<number | null> {
    if (this.useFallback) {
      return this.saveSnippetFallback(language, code, description, tags);
    }

    try {
      const sql = `
        INSERT INTO deepcode_code_snippets (language, code, description, tags)
        VALUES (?, ?, ?, ?)
      `;

      const tagsJson = tags ? JSON.stringify(tags) : null;

      if (this.isElectron) {
        // Use IPC for database operations
        const result = await window.electron?.db?.query(sql, [language, code, description || null, tagsJson]);

        if (!result?.success) {
          throw new Error(result?.error || 'Database operation failed');
        }

        return result.lastID || null;
      } else {
        this.db.run(sql, [language, code, description || null, tagsJson]);
        await this.saveToLocalStorage();
        return 1;
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to save snippet:', error);
      return null;
    }
  }

  /**
   * Search snippets by language and/or query
   */
  async searchSnippets(
    query?: string,
    language?: string,
    limit: number = 50
  ): Promise<CodeSnippet[]> {
    if (this.useFallback) {
      return this.searchSnippetsFallback(query, language, limit);
    }

    try {
      let sql = 'SELECT * FROM deepcode_code_snippets WHERE 1=1';
      const params: any[] = [];

      if (language) {
        sql += ' AND language = ?';
        params.push(language);
      }

      if (query) {
        sql += ' AND (code LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      sql += ' ORDER BY usage_count DESC, created_at DESC LIMIT ?';
      params.push(limit);

      if (this.isElectron) {
        const rows = this.db.prepare(sql).all(...params);
        return rows.map(this.parseSnippet);
      } else {
        const result = this.db.exec(sql, params);
        if (!result[0]) {return [];}

        return result[0].values.map((row: any[]) => ({
          id: row[0],
          language: row[1],
          code: row[2],
          description: row[3],
          tags: row[4] ? JSON.parse(row[4]) : undefined,
          created_at: new Date(row[5]),
          usage_count: row[6],
          last_used: row[7] ? new Date(row[7]) : undefined,
        }));
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to search snippets:', error);
      return [];
    }
  }

  /**
   * Increment snippet usage count
   */
  async incrementSnippetUsage(id: number): Promise<void> {
    if (this.useFallback) {return;}

    try {
      const sql = `
        UPDATE deepcode_code_snippets
        SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      if (this.isElectron) {
        this.db.prepare(sql).run(id);
      } else {
        this.db.run(sql, [id]);
      }

      await this.saveToLocalStorage();
    } catch (error) {
      logger.error('[DatabaseService] Failed to increment snippet usage:', error);
    }
  }

  // ============================================
  // SETTINGS METHODS
  // ============================================

  /**
   * Get a setting value
   */
  async getSetting<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (this.useFallback) {
      return this.getSettingFallback(key, defaultValue);
    }

    try {
      const sql = 'SELECT value FROM deepcode_settings WHERE key = ?';

      if (this.isElectron) {
        const row = this.db.prepare(sql).get(key);
        return row ? JSON.parse(row.value) : defaultValue;
      } else {
        const result = this.db.exec(sql, [key]);
        if (!result[0] || result[0].values.length === 0) {return defaultValue;}
        return JSON.parse(result[0].values[0][0]);
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to get setting:', error);
      return defaultValue;
    }
  }

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: any): Promise<void> {
    if (this.useFallback) {
      return this.setSettingFallback(key, value);
    }

    try {
      const sql = `
        INSERT OR REPLACE INTO deepcode_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;

      const valueJson = JSON.stringify(value);

      if (this.isElectron) {
        this.db.prepare(sql).run(key, valueJson);
      } else {
        this.db.run(sql, [key, valueJson]);
      }

      await this.saveToLocalStorage();
    } catch (error) {
      logger.error('[DatabaseService] Failed to set setting:', error);
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Record<string, any>> {
    if (this.useFallback) {
      return this.getAllSettingsFallback();
    }

    try {
      const sql = 'SELECT key, value FROM deepcode_settings';

      if (this.isElectron) {
        const rows = this.db.prepare(sql).all();
        return rows.reduce((acc: any, row: any) => {
          acc[row.key] = JSON.parse(row.value);
          return acc;
        }, {});
      } else {
        const result = this.db.exec(sql);
        if (!result[0]) {return {};}

        return result[0].values.reduce((acc: any, row: any[]) => {
          acc[row[0]] = JSON.parse(row[1]);
          return acc;
        }, {});
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to get all settings:', error);
      return {};
    }
  }

  // ============================================
  // ANALYTICS METHODS
  // ============================================

  /**
   * Log an analytics event
   */
  async logEvent(eventType: string, eventData?: any): Promise<void> {
    if (this.useFallback) {return;}

    try {
      const sql = `
        INSERT INTO deepcode_analytics (event_type, event_data)
        VALUES (?, ?)
      `;

      const dataJson = eventData ? JSON.stringify(eventData) : null;

      if (this.isElectron) {
        this.db.prepare(sql).run(eventType, dataJson);
      } else {
        this.db.run(sql, [eventType, dataJson]);
      }

      await this.saveToLocalStorage();
    } catch (error) {
      logger.error('[DatabaseService] Failed to log event:', error);
    }
  }

  /**
   * Get analytics events
   */
  async getAnalytics(
    eventType?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 1000
  ): Promise<AnalyticsEvent[]> {
    if (this.useFallback) {return [];}

    try {
      let sql = 'SELECT * FROM deepcode_analytics WHERE 1=1';
      const params: any[] = [];

      if (eventType) {
        sql += ' AND event_type = ?';
        params.push(eventType);
      }

      if (startDate) {
        sql += ' AND timestamp >= ?';
        params.push(startDate.toISOString());
      }

      if (endDate) {
        sql += ' AND timestamp <= ?';
        params.push(endDate.toISOString());
      }

      sql += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      if (this.isElectron) {
        const rows = this.db.prepare(sql).all(...params);
        return rows.map((row: any) => ({
          id: row.id,
          event_type: row.event_type,
          event_data: row.event_data ? JSON.parse(row.event_data) : undefined,
          timestamp: new Date(row.timestamp),
        }));
      } else {
        const result = this.db.exec(sql, params);
        if (!result[0]) {return [];}

        return result[0].values.map((row: any[]) => ({
          id: row[0],
          event_type: row[1],
          event_data: row[2] ? JSON.parse(row[2]) : undefined,
          timestamp: new Date(row[3]),
        }));
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to get analytics:', error);
      return [];
    }
  }

  // ============================================
  // STRATEGY MEMORY METHODS
  // ============================================

  /**
   * Migrate strategy memory from localStorage to database
   */
  async migrateStrategyMemory(): Promise<{ migrated: number; errors: number }> {
    const STORAGE_KEY = 'deepcode_strategy_memory';
    let migrated = 0;
    let errors = 0;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        logger.debug('[DatabaseService] No strategy patterns to migrate');
        return { migrated, errors };
      }

      const patterns = JSON.parse(stored) as StrategyPattern[];
      logger.debug(`[DatabaseService] Migrating ${patterns.length} strategy patterns...`);

      for (const pattern of patterns) {
        try {
          await this.savePattern(pattern);
          migrated++;
        } catch (error) {
          logger.error('[DatabaseService] Failed to migrate pattern:', error);
          errors++;
        }
      }

      // Create backup in localStorage
      localStorage.setItem(`${STORAGE_KEY}_backup_${Date.now()}`, stored);

      logger.debug(`[DatabaseService] ✅ Migration complete: ${migrated} migrated, ${errors} errors`);
      return { migrated, errors };
    } catch (error) {
      logger.error('[DatabaseService] Migration failed:', error);
      return { migrated, errors };
    }
  }

  /**
   * Save a strategy pattern
   */
  async savePattern(pattern: StrategyPattern): Promise<void> {
    if (this.useFallback) {
      return this.savePatternFallback(pattern);
    }

    try {
      const sql = `
        INSERT OR REPLACE INTO deepcode_strategy_memory
        (pattern_hash, pattern_data, success_rate, usage_count, last_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const patternHash = pattern.problemSignature;
      const patternData = JSON.stringify(pattern);

      if (this.isElectron) {
        this.db.prepare(sql).run(
          patternHash,
          patternData,
          pattern.successRate,
          pattern.usageCount,
          pattern.lastUsedAt.toISOString(),
          pattern.createdAt.toISOString()
        );
      } else {
        this.db.run(sql, [
          patternHash,
          patternData,
          pattern.successRate,
          pattern.usageCount,
          pattern.lastUsedAt.toISOString(),
          pattern.createdAt.toISOString(),
        ]);
      }

      await this.saveToLocalStorage();
    } catch (error) {
      logger.error('[DatabaseService] Failed to save pattern:', error);
      throw error;
    }
  }

  /**
   * Query strategy patterns by context
   */
  async queryPatterns(limit: number = 50): Promise<StrategyPattern[]> {
    if (this.useFallback) {
      return this.queryPatternsFallback(limit);
    }

    try {
      const sql = `
        SELECT pattern_data FROM deepcode_strategy_memory
        ORDER BY success_rate DESC, usage_count DESC
        LIMIT ?
      `;

      if (this.isElectron) {
        const rows = this.db.prepare(sql).all(limit);
        return rows.map((row: any) => {
          const pattern = JSON.parse(row.pattern_data);
          // Restore Date objects
          pattern.createdAt = new Date(pattern.createdAt);
          pattern.lastUsedAt = new Date(pattern.lastUsedAt);
          if (pattern.lastSuccessAt) {
            pattern.lastSuccessAt = new Date(pattern.lastSuccessAt);
          }
          return pattern;
        });
      } else {
        const result = this.db.exec(sql, [limit]);
        if (!result[0]) {return [];}

        return result[0].values.map((row: any[]) => {
          const pattern = JSON.parse(row[0]);
          // Restore Date objects
          pattern.createdAt = new Date(pattern.createdAt);
          pattern.lastUsedAt = new Date(pattern.lastUsedAt);
          if (pattern.lastSuccessAt) {
            pattern.lastSuccessAt = new Date(pattern.lastSuccessAt);
          }
          return pattern;
        });
      }
    } catch (error) {
      logger.error('[DatabaseService] Failed to query patterns:', error);
      return [];
    }
  }

  /**
   * Update pattern success rate
   */
  async updatePatternSuccess(patternHash: string, success: boolean): Promise<void> {
    if (this.useFallback) {return;}

    try {
      // Get current pattern
      const sql = 'SELECT pattern_data FROM deepcode_strategy_memory WHERE pattern_hash = ?';

      let pattern: StrategyPattern | null = null;

      if (this.isElectron) {
        const row = this.db.prepare(sql).get(patternHash);
        if (row) {pattern = JSON.parse(row.pattern_data);}
      } else {
        const result = this.db.exec(sql, [patternHash]);
        if (result[0] && result[0].values.length > 0) {
          pattern = JSON.parse(result[0].values[0][0]);
        }
      }

      if (!pattern) {return;}

      // Update success rate
      pattern.usageCount++;
      const successCount = Math.round((pattern.successRate / 100) * (pattern.usageCount - 1));
      const newSuccessCount = success ? successCount + 1 : successCount;
      pattern.successRate = Math.round((newSuccessCount / pattern.usageCount) * 100);

      // Save updated pattern
      await this.savePattern(pattern);
    } catch (error) {
      logger.error('[DatabaseService] Failed to update pattern success:', error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Detect if running in Electron
   */
  private detectElectron(): boolean {
    // Multiple checks for Electron environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for Electron-specific window properties
    if (window.electron?.isElectron) {
      return true;
    }

    // Check for process.type (older Electron versions)
    if (typeof window.process !== 'undefined' && (window.process as any).type === 'renderer') {
      return true;
    }

    // Check for navigator.userAgent containing Electron
    if (navigator?.userAgent?.toLowerCase().includes('electron')) {
      return true;
    }

    return false;
  }

  /**
   * Check if database is using localStorage fallback
   */
  public isUsingFallback(): boolean {
    return this.useFallback;
  }

  /**
   * Get database status information
   */
  public getStatus(): {
    initialized: boolean;
    usingFallback: boolean;
    isElectron: boolean;
    databasePath: string;
  } {
    return {
      initialized: this.initialized,
      usingFallback: this.useFallback,
      isElectron: this.isElectron,
      databasePath: this.useFallback ? 'localStorage' : DATABASE_PATH,
    };
  }

  /**
   * Save database to localStorage (for web mode persistence)
   */
  private async saveToLocalStorage(): Promise<void> {
    if (this.isElectron || !this.db) {return;}

    try {
      const data = this.db.export();
      const base64 = btoa(String.fromCharCode(...data));
      localStorage.setItem('deepcode_database_blob', base64);
    } catch (error) {
      logger.error('[DatabaseService] Failed to save to localStorage:', error);
    }
  }

  /**
   * Parse chat message row
   */
  private parseChatMessage(row: any): ChatMessage {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      workspace_path: row.workspace_path,
      user_message: row.user_message,
      ai_response: row.ai_response,
      model_used: row.model_used,
      tokens_used: row.tokens_used,
      workspace_context: row.workspace_context ? JSON.parse(row.workspace_context) : undefined,
    };
  }

  /**
   * Parse snippet row
   */
  private parseSnippet(row: any): CodeSnippet {
    return {
      id: row.id,
      language: row.language,
      code: row.code,
      description: row.description,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      created_at: new Date(row.created_at),
      usage_count: row.usage_count,
      last_used: row.last_used ? new Date(row.last_used) : undefined,
    };
  }

  // ============================================
  // LOCALSTORAGE FALLBACK METHODS
  // ============================================

  private saveChatMessageFallback(
    workspace: string,
    userMessage: string,
    aiResponse: string,
    model: string,
    tokens?: number,
    context?: any
  ): number {
    const key = `${STORAGE_FALLBACK_PREFIX}chat_${workspace}`;
    const messages = JSON.parse(localStorage.getItem(key) || '[]');

    const newMessage: ChatMessage = {
      id: Date.now(),
      timestamp: new Date(),
      workspace_path: workspace,
      user_message: userMessage,
      ai_response: aiResponse,
      model_used: model,
      tokens_used: tokens,
      workspace_context: context ? JSON.stringify(context) : undefined,
    };

    messages.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messages));

    return newMessage.id!;
  }

  private getChatHistoryFallback(workspace: string, limit: number, offset: number): ChatMessage[] {
    const key = `${STORAGE_FALLBACK_PREFIX}chat_${workspace}`;
    const messages = JSON.parse(localStorage.getItem(key) || '[]');
    return messages.slice(offset, offset + limit);
  }

  private clearChatHistoryFallback(workspace: string): void {
    const key = `${STORAGE_FALLBACK_PREFIX}chat_${workspace}`;
    localStorage.removeItem(key);
  }

  private saveSnippetFallback(
    language: string,
    code: string,
    description?: string,
    tags?: string[]
  ): number {
    const key = `${STORAGE_FALLBACK_PREFIX}snippets`;
    const snippets = JSON.parse(localStorage.getItem(key) || '[]');

    const newSnippet: CodeSnippet = {
      id: Date.now(),
      language,
      code,
      description,
      tags: tags ? JSON.stringify(tags) : undefined,
      created_at: new Date(),
      usage_count: 0,
    };

    snippets.push(newSnippet);
    localStorage.setItem(key, JSON.stringify(snippets));

    return newSnippet.id!;
  }

  private searchSnippetsFallback(query?: string, language?: string, limit?: number): CodeSnippet[] {
    const key = `${STORAGE_FALLBACK_PREFIX}snippets`;
    const snippets = JSON.parse(localStorage.getItem(key) || '[]');

    let filtered = snippets;

    if (language) {
      filtered = filtered.filter((s: CodeSnippet) => s.language === language);
    }

    if (query) {
      filtered = filtered.filter((s: CodeSnippet) =>
        s.code.includes(query) || s.description?.includes(query)
      );
    }

    return filtered.slice(0, limit);
  }

  private getSettingFallback<T>(key: string, defaultValue?: T): T | undefined {
    const storageKey = `${STORAGE_FALLBACK_PREFIX}setting_${key}`;
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : defaultValue;
  }

  private setSettingFallback(key: string, value: any): void {
    const storageKey = `${STORAGE_FALLBACK_PREFIX}setting_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  private getAllSettingsFallback(): Record<string, any> {
    const settings: Record<string, any> = {};
    const prefix = `${STORAGE_FALLBACK_PREFIX}setting_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const settingKey = key.substring(prefix.length);
        settings[settingKey] = JSON.parse(localStorage.getItem(key)!);
      }
    }

    return settings;
  }

  private savePatternFallback(pattern: StrategyPattern): void {
    const key = `${STORAGE_FALLBACK_PREFIX}patterns`;
    const patterns = JSON.parse(localStorage.getItem(key) || '[]');

    // Find and replace or append
    const index = patterns.findIndex((p: StrategyPattern) => p.problemSignature === pattern.problemSignature);
    if (index >= 0) {
      patterns[index] = pattern;
    } else {
      patterns.push(pattern);
    }

    localStorage.setItem(key, JSON.stringify(patterns));
  }

  private queryPatternsFallback(limit: number): StrategyPattern[] {
    const key = `${STORAGE_FALLBACK_PREFIX}patterns`;
    const patterns = JSON.parse(localStorage.getItem(key) || '[]');
    return patterns.slice(0, limit);
  }

  /**
   * Close database connection (cleanup)
   */
  async close(): Promise<void> {
    if (this.db && this.isElectron) {
      this.db.close();
      logger.debug('[DatabaseService] Database connection closed');
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
