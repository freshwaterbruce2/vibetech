import Database from 'better-sqlite3';
import { getDatabasePath } from '@vibetech/shared-config';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface LearningDatabaseConfig {
  path?: string;
  readOnly?: boolean;
  verbose?: boolean;
}

export interface MistakeEntry {
  id?: number;
  timestamp: string;
  platform: string;
  category: string;
  description: string;
  fix: string;
  severity: string;
  source: 'nova' | 'deepcode';
}

export interface KnowledgeEntry {
  id?: number;
  timestamp: string;
  category: string;
  content: string;
  tags: string;
  source: 'nova' | 'deepcode';
}

export class LearningDatabase {
  private db: Database.Database;
  private static instance: LearningDatabase | null = null;

  constructor(config: LearningDatabaseConfig = {}) {
    const dbPath = config.path || getDatabasePath('learning');

    // Ensure directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath, {
      readonly: config.readOnly || false,
      verbose: config.verbose ? console.log : undefined,
    });

    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Enable WAL mode for append-only performance
    this.db.pragma('journal_mode = WAL');

    // Optimize for append-heavy workload
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -32000'); // 32MB cache
    this.db.pragma('temp_store = MEMORY');

    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mistakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        platform TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        fix TEXT NOT NULL,
        severity TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('nova', 'deepcode')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('nova', 'deepcode')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_mistakes_timestamp ON mistakes(timestamp);
      CREATE INDEX IF NOT EXISTS idx_mistakes_source ON mistakes(source);
      CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
      CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge(source);
    `);
  }

  public static getInstance(config?: LearningDatabaseConfig): LearningDatabase {
    if (!LearningDatabase.instance) {
      LearningDatabase.instance = new LearningDatabase(config);
    } else if (config) {
      // Warn if trying to reinitialize with different config
      console.warn('[LearningDatabase] getInstance() called with config but instance already exists. Config ignored. Use close() first to reinitialize.');
    }
    return LearningDatabase.instance;
  }

  public static resetInstance(): void {
    if (LearningDatabase.instance) {
      LearningDatabase.instance.close();
    }
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  // Append-only writes
  public logMistake(mistake: MistakeEntry): number {
    const stmt = this.db.prepare(`
      INSERT INTO mistakes (timestamp, platform, category, description, fix, severity, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      mistake.timestamp,
      mistake.platform,
      mistake.category,
      mistake.description,
      mistake.fix,
      mistake.severity,
      mistake.source
    );
    return result.lastInsertRowid as number;
  }

  public addKnowledge(knowledge: KnowledgeEntry): number {
    const stmt = this.db.prepare(`
      INSERT INTO knowledge (timestamp, category, content, tags, source)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      knowledge.timestamp,
      knowledge.category,
      knowledge.content,
      knowledge.tags,
      knowledge.source
    );
    return result.lastInsertRowid as number;
  }

  public getMistakes(filters?: { source?: string; platform?: string }): MistakeEntry[] {
    let query = 'SELECT * FROM mistakes';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    if (filters?.platform) {
      conditions.push('platform = ?');
      params.push(filters.platform);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as MistakeEntry[];
  }

  public getKnowledge(filters?: { source?: string; category?: string }): KnowledgeEntry[] {
    let query = 'SELECT * FROM knowledge';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    if (filters?.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as KnowledgeEntry[];
  }

  public backup(destination: string): void {
    this.db.backup(destination);
  }

  public vacuum(): void {
    this.db.exec('VACUUM');
  }

  public checkpoint(): void {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
  }

  public close(): void {
    if (this.db.open) {
      this.db.close();
    }
    // Always clear the instance, even if db was already closed
    LearningDatabase.instance = null;
  }
}

export default LearningDatabase;
