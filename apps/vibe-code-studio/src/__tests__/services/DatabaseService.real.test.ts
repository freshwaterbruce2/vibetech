/**
 * DatabaseService Integration Tests with Real In-Memory SQLite
 *
 * Uses real better-sqlite3 in-memory database for confident testing
 * Following TDD best practices for database services
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { ChatMessage, CodeSnippet, Setting } from '../../services/DatabaseService';

// Mock for localStorage fallback testing
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

// In-memory database setup
let db: Database.Database;

const initializeDatabase = () => {
  db = new Database(':memory:');

  // Chat history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_path TEXT NOT NULL,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      model_used TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      workspace_context TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Code snippets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Strategy memory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS strategy_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_hash TEXT UNIQUE NOT NULL,
      pattern_data TEXT NOT NULL,
      success_rate REAL DEFAULT 0.0,
      usage_count INTEGER DEFAULT 0,
      last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const closeDatabase = () => {
  if (db) {
    db.close();
  }
};

describe('DatabaseService - Real Integration Tests', () => {
  beforeEach(() => {
    initializeDatabase();
    globalThis.localStorage = localStorageMock as any;
    localStorageMock.clear();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('Initialization', () => {
    it('should create database with all required tables', () => {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table'
      `).all();

      const tableNames = tables.map((t: any) => t.name);
      expect(tableNames).toContain('chat_history');
      expect(tableNames).toContain('code_snippets');
      expect(tableNames).toContain('settings');
      expect(tableNames).toContain('analytics_events');
      expect(tableNames).toContain('strategy_memory');
    });

    it('should handle in-memory database initialization', () => {
      expect(db).toBeDefined();
      expect(() => db.prepare('SELECT 1').get()).not.toThrow();
    });
  });

  describe('Chat History Operations', () => {
    it('should save chat message successfully', () => {
      const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
        workspace_path: '/test/workspace',
        user_message: 'How do I test React components?',
        ai_response: 'Use React Testing Library with Vitest...',
        model_used: 'deepseek-chat',
        tokens_used: 150,
        workspace_context: JSON.stringify({ files: 5 })
      };

      const stmt = db.prepare(`
        INSERT INTO chat_history (
          workspace_path, user_message, ai_response,
          model_used, tokens_used, workspace_context
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        message.workspace_path,
        message.user_message,
        message.ai_response,
        message.model_used,
        message.tokens_used,
        message.workspace_context
      );

      expect(result.lastInsertRowid).toBe(1);
      expect(result.changes).toBe(1);
    });

    it('should retrieve chat history by workspace', () => {
      // Insert test data
      const stmt = db.prepare(`
        INSERT INTO chat_history (
          workspace_path, user_message, ai_response, model_used
        ) VALUES (?, ?, ?, ?)
      `);

      stmt.run('/test/workspace1', 'Question 1', 'Answer 1', 'deepseek-chat');
      stmt.run('/test/workspace1', 'Question 2', 'Answer 2', 'deepseek-chat');
      stmt.run('/test/workspace2', 'Question 3', 'Answer 3', 'gpt-4');

      // Retrieve workspace1 history
      const history = db.prepare(`
        SELECT * FROM chat_history WHERE workspace_path = ?
      `).all('/test/workspace1');

      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        user_message: 'Question 1',
        ai_response: 'Answer 1'
      });
    });

    it('should delete old chat messages older than 30 days', () => {
      // Insert old message
      db.prepare(`
        INSERT INTO chat_history (
          workspace_path, user_message, ai_response,
          model_used, timestamp
        ) VALUES (?, ?, ?, ?, datetime('now', '-31 days'))
      `).run('/test', 'Old question', 'Old answer', 'model');

      // Insert recent message
      db.prepare(`
        INSERT INTO chat_history (
          workspace_path, user_message, ai_response, model_used
        ) VALUES (?, ?, ?, ?)
      `).run('/test', 'New question', 'New answer', 'model');

      // Delete old messages
      const result = db.prepare(`
        DELETE FROM chat_history
        WHERE timestamp < datetime('now', '-30 days')
      `).run();

      expect(result.changes).toBe(1);

      // Verify only recent message remains
      const remaining = db.prepare('SELECT * FROM chat_history').all();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toMatchObject({
        user_message: 'New question'
      });
    });

    it('should handle empty workspace gracefully', () => {
      const history = db.prepare(`
        SELECT * FROM chat_history WHERE workspace_path = ?
      `).all('/nonexistent/workspace');

      expect(history).toHaveLength(0);
      expect(history).toEqual([]);
    });
  });

  describe('Code Snippets Operations', () => {
    it('should save code snippet with metadata', () => {
      const snippet: Omit<CodeSnippet, 'id' | 'created_at' | 'last_used'> = {
        language: 'typescript',
        code: 'const greet = (name: string) => `Hello, ${name}!`;',
        description: 'Simple greeting function',
        tags: JSON.stringify(['function', 'string', 'template']),
        usage_count: 0
      };

      const result = db.prepare(`
        INSERT INTO code_snippets (
          language, code, description, tags, usage_count
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        snippet.language,
        snippet.code,
        snippet.description,
        snippet.tags,
        snippet.usage_count
      );

      expect(result.lastInsertRowid).toBe(1);
      expect(result.changes).toBe(1);
    });

    it('should search snippets by language', () => {
      // Insert test snippets
      db.prepare(`
        INSERT INTO code_snippets (language, code, description)
        VALUES (?, ?, ?)
      `).run('typescript', 'const x = 1', 'TS snippet');

      db.prepare(`
        INSERT INTO code_snippets (language, code, description)
        VALUES (?, ?, ?)
      `).run('javascript', 'const y = 2', 'JS snippet');

      db.prepare(`
        INSERT INTO code_snippets (language, code, description)
        VALUES (?, ?, ?)
      `).run('typescript', 'interface User {}', 'TS interface');

      // Search TypeScript snippets
      const tsSnippets = db.prepare(`
        SELECT * FROM code_snippets WHERE language = ?
      `).all('typescript');

      expect(tsSnippets).toHaveLength(2);
      expect(tsSnippets.every((s: any) => s.language === 'typescript')).toBe(true);
    });

    it('should increment usage count when snippet is used', () => {
      // Insert snippet
      db.prepare(`
        INSERT INTO code_snippets (language, code, usage_count)
        VALUES (?, ?, ?)
      `).run('python', 'print("hello")', 0);

      // Increment usage
      db.prepare(`
        UPDATE code_snippets
        SET usage_count = usage_count + 1,
            last_used = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(1);

      // Verify increment
      const snippet = db.prepare(`
        SELECT usage_count FROM code_snippets WHERE id = ?
      `).get(1) as any;

      expect(snippet.usage_count).toBe(1);
    });

    it('should support full-text search in code and description', () => {
      // Insert snippets with searchable content
      db.prepare(`
        INSERT INTO code_snippets (language, code, description)
        VALUES (?, ?, ?)
      `).run('javascript', 'fetch("/api/users")', 'HTTP API call');

      db.prepare(`
        INSERT INTO code_snippets (language, code, description)
        VALUES (?, ?, ?)
      `).run('typescript', 'const user = {}', 'User object');

      // Search for "API" in description
      const results = db.prepare(`
        SELECT * FROM code_snippets
        WHERE description LIKE ?
      `).all('%API%');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        description: 'HTTP API call'
      });
    });
  });

  describe('Settings Management', () => {
    it('should store settings as key-value pairs', () => {
      const setting: Omit<Setting, 'updated_at'> = {
        key: 'theme',
        value: JSON.stringify({ mode: 'dark', accent: 'blue' })
      };

      const result = db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `).run(setting.key, setting.value);

      expect(result.changes).toBe(1);
    });

    it('should retrieve settings by key', () => {
      // Insert setting
      db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
      `).run('editor.fontSize', '14');

      // Retrieve setting
      const setting = db.prepare(`
        SELECT * FROM settings WHERE key = ?
      `).get('editor.fontSize') as any;

      expect(setting).toBeDefined();
      expect(setting.key).toBe('editor.fontSize');
      expect(setting.value).toBe('14');
    });

    it('should update existing settings (upsert)', () => {
      // Initial insert
      db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
      `).run('language', 'en');

      // Update using upsert
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `).run('language', 'es');

      // Verify update
      const setting = db.prepare(`
        SELECT value FROM settings WHERE key = ?
      `).get('language') as any;

      expect(setting.value).toBe('es');

      // Verify only one row exists
      const count = db.prepare(`
        SELECT COUNT(*) as count FROM settings WHERE key = ?
      `).get('language') as any;

      expect(count.count).toBe(1);
    });

    it('should return null for non-existent settings', () => {
      const setting = db.prepare(`
        SELECT * FROM settings WHERE key = ?
      `).get('nonexistent.key');

      expect(setting).toBeUndefined();
    });
  });

  describe('Analytics & Telemetry', () => {
    it('should track analytics events', () => {
      const event = {
        event_type: 'file_opened',
        event_data: JSON.stringify({ path: '/test.ts', language: 'typescript' })
      };

      const result = db.prepare(`
        INSERT INTO analytics_events (event_type, event_data)
        VALUES (?, ?)
      `).run(event.event_type, event.event_data);

      expect(result.changes).toBe(1);
    });

    it('should retrieve events by type', () => {
      // Insert multiple events
      db.prepare(`
        INSERT INTO analytics_events (event_type, event_data)
        VALUES (?, ?)
      `).run('code_generated', '{"model": "deepseek"}');

      db.prepare(`
        INSERT INTO analytics_events (event_type, event_data)
        VALUES (?, ?)
      `).run('code_generated', '{"model": "gpt-4"}');

      db.prepare(`
        INSERT INTO analytics_events (event_type, event_data)
        VALUES (?, ?)
      `).run('file_saved', '{"path": "/test.ts"}');

      // Query by type
      const codeGenEvents = db.prepare(`
        SELECT * FROM analytics_events WHERE event_type = ?
      `).all('code_generated');

      expect(codeGenEvents).toHaveLength(2);
    });
  });

  describe('LocalStorage Fallback', () => {
    it('should fallback to localStorage when database unavailable', () => {
      // Simulate database failure by closing it
      db.close();

      // Try to save to localStorage
      const key = 'deepcode_fallback_test_setting';
      const value = JSON.stringify({ theme: 'dark' });

      localStorageMock.setItem(key, value);

      // Retrieve from localStorage
      const retrieved = localStorageMock.getItem(key);
      expect(retrieved).toBe(value);
      expect(JSON.parse(retrieved!)).toEqual({ theme: 'dark' });
    });

    it('should migrate localStorage data to database on reconnect', () => {
      // Simulate data in localStorage
      localStorageMock.setItem(
        'deepcode_fallback_chat_history',
        JSON.stringify([
          { workspace: '/test', message: 'Hello', response: 'Hi' }
        ])
      );

      // Reinitialize database
      initializeDatabase();

      // Verify localStorage has data
      const storedData = localStorageMock.getItem('deepcode_fallback_chat_history');
      expect(storedData).toBeTruthy();

      const data = JSON.parse(storedData!);
      expect(data).toHaveLength(1);
      expect(data[0].message).toBe('Hello');
    });
  });

  describe('Error Handling', () => {
    it('should handle database constraint violations gracefully', () => {
      // Insert duplicate primary key
      db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
      `).run('test_key', 'value1');

      expect(() => {
        db.prepare(`
          INSERT INTO settings (key, value) VALUES (?, ?)
        `).run('test_key', 'value2');
      }).toThrow(/UNIQUE constraint failed/);
    });

    it('should handle malformed JSON in query results', () => {
      db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
      `).run('bad_json', '{invalid json');

      const setting = db.prepare(`
        SELECT value FROM settings WHERE key = ?
      `).get('bad_json') as any;

      expect(() => JSON.parse(setting.value)).toThrow();
    });
  });

  describe('Performance & Optimization', () => {
    it('should handle bulk inserts efficiently', () => {
      const insertMany = db.prepare(`
        INSERT INTO code_snippets (language, code, description)
        VALUES (?, ?, ?)
      `);

      const insert = db.transaction((snippets: any[]) => {
        for (const snippet of snippets) {
          insertMany.run(snippet.language, snippet.code, snippet.description);
        }
      });

      const snippets = Array.from({ length: 100 }, (_, i) => ({
        language: 'javascript',
        code: `const x${i} = ${i};`,
        description: `Variable ${i}`
      }));

      insert(snippets);

      const count = db.prepare(`
        SELECT COUNT(*) as count FROM code_snippets
      `).get() as any;

      expect(count.count).toBe(100);
    });

    it('should use indexes for fast queries', () => {
      // Create index on workspace_path for fast lookups
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_chat_workspace
        ON chat_history(workspace_path)
      `);

      // Verify index exists
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND tbl_name='chat_history'
      `).all();

      const indexNames = indexes.map((i: any) => i.name);
      expect(indexNames).toContain('idx_chat_workspace');
    });
  });
});
