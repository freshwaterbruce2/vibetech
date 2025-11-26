/**
 * Shared Learning Database (agent_learning.db on D:\)
 * Mirrors the schema owned by Nova Agent's Rust backend (learning_db.rs).
 */

import Database from 'better-sqlite3';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type {
    AgentKnowledge,
    AgentMistake,
    LearningStats,
    NewAgentKnowledge,
    NewAgentMistake,
} from './shared-database.types';

const SHARED_DB_PATH = 'D:\\databases\\agent_learning.db';

const defaultMistake = (mistake: NewAgentMistake): Required<NewAgentMistake> => ({
    ...mistake,
    identified_at: mistake.identified_at ?? new Date().toISOString(),
    resolved: mistake.resolved ?? false,
});

class SharedDatabaseService {
    private db: Database.Database | null = null;

    initialize(): { success: boolean; error?: string } {
        try {
            const dbDir = dirname(SHARED_DB_PATH);
            if (!existsSync(dbDir)) {
                mkdirSync(dbDir, { recursive: true });
            }

            this.db = new Database(SHARED_DB_PATH);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('busy_timeout = 5000');
            this.ensureSchema();

            console.log('[SharedDB] Connected to shared learning database');
            return { success: true };
        } catch (error) {
            console.error('[SharedDB] Failed to initialize:', error);
            return { success: false, error: (error as Error).message };
        }
    }

    private ensureSchema() {
        if (!this.db) return;

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS agent_mistakes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mistake_type TEXT NOT NULL,
                mistake_category TEXT,
                description TEXT NOT NULL,
                root_cause_analysis TEXT,
                context_when_occurred TEXT,
                impact_severity TEXT NOT NULL,
                prevention_strategy TEXT,
                identified_at TEXT NOT NULL,
                resolved INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_mistakes_description ON agent_mistakes(description);
            CREATE INDEX IF NOT EXISTS idx_mistakes_context ON agent_mistakes(context_when_occurred);
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS agent_knowledge (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                knowledge_type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                applicable_tasks TEXT,
                success_rate_improvement REAL,
                confidence_level REAL,
                tags TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON agent_knowledge(tags);
            CREATE INDEX IF NOT EXISTS idx_knowledge_title ON agent_knowledge(title);
            CREATE INDEX IF NOT EXISTS idx_knowledge_type ON agent_knowledge(knowledge_type);
        `);
    }

    recordMistake(mistake: NewAgentMistake): { success: boolean; id?: number; error?: string } {
        if (!this.db) return { success: false, error: 'Database not initialized' };

        try {
            const normalized = defaultMistake(mistake);
            const stmt = this.db.prepare(`
                INSERT INTO agent_mistakes (
                    mistake_type, mistake_category, description, root_cause_analysis,
                    context_when_occurred, impact_severity, prevention_strategy,
                    identified_at, resolved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                normalized.mistake_type,
                normalized.mistake_category ?? null,
                normalized.description,
                normalized.root_cause_analysis ?? null,
                normalized.context_when_occurred ?? null,
                normalized.impact_severity,
                normalized.prevention_strategy ?? null,
                normalized.identified_at,
                normalized.resolved ? 1 : 0,
            );

            return { success: true, id: Number(result.lastInsertRowid) };
        } catch (error) {
            console.error('[SharedDB] Failed to record mistake:', error);
            return { success: false, error: (error as Error).message };
        }
    }

    recordKnowledge(knowledge: NewAgentKnowledge): { success: boolean; id?: number; error?: string } {
        if (!this.db) return { success: false, error: 'Database not initialized' };

        try {
            const stmt = this.db.prepare(`
                INSERT INTO agent_knowledge (
                    knowledge_type, title, content, applicable_tasks,
                    success_rate_improvement, confidence_level, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                knowledge.knowledge_type,
                knowledge.title,
                knowledge.content,
                knowledge.applicable_tasks ?? null,
                knowledge.success_rate_improvement ?? null,
                knowledge.confidence_level ?? null,
                knowledge.tags ?? null,
            );

            return { success: true, id: Number(result.lastInsertRowid) };
        } catch (error) {
            console.error('[SharedDB] Failed to record knowledge:', error);
            return { success: false, error: (error as Error).message };
        }
    }

    findSimilarMistakes(mistakeType: string, description: string, limit = 5): AgentMistake[] {
        if (!this.db) return [];
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM agent_mistakes
                WHERE mistake_type = ? OR description LIKE ?
                ORDER BY identified_at DESC
                LIMIT ?
            `);
            return stmt.all(mistakeType, `%${description}%`, limit) as AgentMistake[];
        } catch (error) {
            console.error('[SharedDB] Failed to query similar mistakes:', error);
            return [];
        }
    }

    findKnowledge(knowledgeType: string, searchTerm: string, limit = 10): AgentKnowledge[] {
        if (!this.db) return [];
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM agent_knowledge
                WHERE knowledge_type = ? AND (title LIKE ? OR content LIKE ?)
                ORDER BY id DESC
                LIMIT ?
            `);
            const pattern = `%${searchTerm}%`;
            return stmt.all(knowledgeType, pattern, pattern, limit) as AgentKnowledge[];
        } catch (error) {
            console.error('[SharedDB] Failed to query knowledge:', error);
            return [];
        }
    }

    getStats(): LearningStats {
        if (!this.db) {
            return {
                totalMistakes: 0,
                totalKnowledge: 0,
                mistakesByType: {},
                knowledgeByType: {},
                recentMistakes: [],
                recentKnowledge: [],
            };
        }

        try {
            const totalMistakes = (this.db.prepare('SELECT COUNT(*) as count FROM agent_mistakes').get() as any).count;
            const totalKnowledge = (this.db.prepare('SELECT COUNT(*) as count FROM agent_knowledge').get() as any).count;

            const mistakesByType: Record<string, number> = {};
            const knowledgeByType: Record<string, number> = {};

            (this.db
                .prepare('SELECT mistake_type, COUNT(*) as count FROM agent_mistakes GROUP BY mistake_type')
                .all() as any[]).forEach(row => (mistakesByType[row.mistake_type] = row.count));

            (this.db
                .prepare('SELECT knowledge_type, COUNT(*) as count FROM agent_knowledge GROUP BY knowledge_type')
                .all() as any[]).forEach(row => (knowledgeByType[row.knowledge_type] = row.count));

            const recentMistakes = this.db
                .prepare('SELECT * FROM agent_mistakes ORDER BY identified_at DESC LIMIT 10')
                .all() as AgentMistake[];
            const recentKnowledge = this.db
                .prepare('SELECT * FROM agent_knowledge ORDER BY id DESC LIMIT 10')
                .all() as AgentKnowledge[];

            return {
                totalMistakes,
                totalKnowledge,
                mistakesByType,
                knowledgeByType,
                recentMistakes,
                recentKnowledge,
            };
        } catch (error) {
            console.error('[SharedDB] Failed to read stats:', error);
            return {
                totalMistakes: 0,
                totalKnowledge: 0,
                mistakesByType: {},
                knowledgeByType: {},
                recentMistakes: [],
                recentKnowledge: [],
            };
        }
    }

    exportForSync(since?: string): { mistakes: AgentMistake[]; knowledge: AgentKnowledge[] } {
        if (!this.db) return { mistakes: [], knowledge: [] };

        try {
            const timeClause = since ? 'WHERE identified_at > ?' : '';

            const mistakes = since
                ? (this.db
                      .prepare(`SELECT * FROM agent_mistakes ${timeClause} ORDER BY identified_at DESC`)
                      .all(since) as AgentMistake[])
                : (this.db.prepare('SELECT * FROM agent_mistakes ORDER BY identified_at DESC').all() as AgentMistake[]);

            const knowledge = this.db.prepare('SELECT * FROM agent_knowledge ORDER BY id DESC').all() as AgentKnowledge[];

            return { mistakes, knowledge };
        } catch (error) {
            console.error('[SharedDB] Failed to export data:', error);
            return { mistakes: [], knowledge: [] };
        }
    }

    syncFromNova(mistakes: AgentMistake[], knowledge: AgentKnowledge[]): { mistakesAdded: number; knowledgeAdded: number } {
        if (!this.db) return { mistakesAdded: 0, knowledgeAdded: 0 };

        let mistakesAdded = 0;
        let knowledgeAdded = 0;

        const tx = this.db.transaction(() => {
            const hasMistake = this.db!.prepare(
                'SELECT id FROM agent_mistakes WHERE mistake_type = ? AND description = ? AND identified_at = ?',
            );
            const insertMistake = this.db!.prepare(`
                INSERT INTO agent_mistakes (
                    mistake_type, mistake_category, description, root_cause_analysis,
                    context_when_occurred, impact_severity, prevention_strategy,
                    identified_at, resolved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            mistakes.forEach(m => {
                const exists = hasMistake.get(m.mistake_type, m.description, m.identified_at);
                if (!exists) {
                    insertMistake.run(
                        m.mistake_type,
                        m.mistake_category ?? null,
                        m.description,
                        m.root_cause_analysis ?? null,
                        m.context_when_occurred ?? null,
                        m.impact_severity,
                        m.prevention_strategy ?? null,
                        m.identified_at,
                        m.resolved ? 1 : 0,
                    );
                    mistakesAdded++;
                }
            });

            const hasKnowledge = this.db!.prepare(
                'SELECT id FROM agent_knowledge WHERE knowledge_type = ? AND title = ? AND content = ?',
            );
            const insertKnowledge = this.db!.prepare(`
                INSERT INTO agent_knowledge (
                    knowledge_type, title, content, applicable_tasks,
                    success_rate_improvement, confidence_level, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            knowledge.forEach(k => {
                const exists = hasKnowledge.get(k.knowledge_type, k.title, k.content);
                if (!exists) {
                    insertKnowledge.run(
                        k.knowledge_type,
                        k.title,
                        k.content,
                        k.applicable_tasks ?? null,
                        k.success_rate_improvement ?? null,
                        k.confidence_level ?? null,
                        k.tags ?? null,
                    );
                    knowledgeAdded++;
                }
            });
        });

        try {
            tx();
            console.log(`[SharedDB] Synced from Nova: ${mistakesAdded} mistakes, ${knowledgeAdded} knowledge`);
        } catch (error) {
            console.error('[SharedDB] Failed to sync from Nova:', error);
            mistakesAdded = 0;
            knowledgeAdded = 0;
        }

        return { mistakesAdded, knowledgeAdded };
    }

    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('[SharedDB] Closed shared learning database');
        }
    }

    isReady(): boolean {
        return this.db !== null;
    }
}

export const sharedDatabase = new SharedDatabaseService();
export default sharedDatabase;
