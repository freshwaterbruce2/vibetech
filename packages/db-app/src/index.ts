import { getDatabasePath } from '@vibetech/shared-config';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface AppDatabaseConfig {
    path?: string;
    readOnly?: boolean;
    verbose?: boolean;
}

export class AppDatabase {
    private db: Database.Database;
    private static instance: AppDatabase | null = null;

    constructor(config: AppDatabaseConfig = {}) {
        const dbPath = config.path || getDatabasePath('app');

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
        // Enable WAL mode for better concurrency
        this.db.pragma('journal_mode = WAL');

        // Optimize for Windows SSD
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = -64000'); // 64MB cache
        this.db.pragma('temp_store = MEMORY');
        this.db.pragma('mmap_size = 30000000000'); // 30GB

        // Enable foreign keys
        this.db.pragma('foreign_keys = ON');
    }

    public static getInstance(config?: AppDatabaseConfig): AppDatabase {
        if (!AppDatabase.instance) {
            AppDatabase.instance = new AppDatabase(config);
        } else if (config) {
            // Warn if trying to reinitialize with different config
            console.warn('[AppDatabase] getInstance() called with config but instance already exists. Config ignored. Use close() first to reinitialize.');
        }
        return AppDatabase.instance;
    }

    public static resetInstance(): void {
        if (AppDatabase.instance) {
            AppDatabase.instance.close();
        }
    }

    public getDatabase(): Database.Database {
        return this.db;
    }

    public backup(destination: string): void {
        this.db.backup(destination);
    }

    public vacuum(): void {
        this.db.exec('VACUUM');
    }

    public analyze(): void {
        this.db.exec('ANALYZE');
    }

    public checkpoint(): void {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
    }

    public close(): void {
        if (this.db.open) {
            this.db.close();
        }
        // Always clear the instance, even if db was already closed
        AppDatabase.instance = null;
    }
}

export default AppDatabase;
