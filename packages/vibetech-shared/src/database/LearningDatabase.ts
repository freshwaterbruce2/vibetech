/**
 * Learning Database Service
 *
 * TypeScript/JavaScript interface for D:\databases\database.db (unified)
 * Works with both NOVA Agent (Rust backend) and Vibe Code Studio (Electron)
 */

import type { LearningMistake, KnowledgeEntry } from '../types';
import type { MistakeFilter, KnowledgeFilter, SnippetFilter } from './schemas';

export interface LearningDatabaseInterface {
  /**
   * Get mistakes with optional filtering
   */
  getMistakes(filter?: MistakeFilter): Promise<LearningMistake[]>;

  /**
   * Add a new mistake to the learning database
   */
  addMistake(mistake: Omit<LearningMistake, 'id' | 'created_at'>): Promise<number>;

  /**
   * Mark a mistake as resolved
   */
  resolveMistake(id: number): Promise<void>;

  /**
   * Search for similar mistakes by keyword
   */
  searchSimilarMistakes(keyword: string): Promise<LearningMistake[]>;

  /**
   * Get knowledge entries with optional filtering
   */
  getKnowledge(filter?: KnowledgeFilter): Promise<KnowledgeEntry[]>;

  /**
   * Add a new knowledge entry
   */
  addKnowledge(knowledge: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<number>;

  /**
   * Get code snippets with optional filtering
   */
  getSnippets(filter?: SnippetFilter): Promise<any[]>;

  /**
   * Add a new code snippet
   */
  addSnippet(snippet: any): Promise<number>;
}

/**
 * Base Learning Database implementation
 * Platform-specific implementations should extend this
 */
export abstract class LearningDatabase implements LearningDatabaseInterface {
  protected dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  abstract getMistakes(filter?: MistakeFilter): Promise<LearningMistake[]>;
  abstract addMistake(mistake: Omit<LearningMistake, 'id' | 'created_at'>): Promise<number>;
  abstract resolveMistake(id: number): Promise<void>;
  abstract searchSimilarMistakes(keyword: string): Promise<LearningMistake[]>;
  abstract getKnowledge(filter?: KnowledgeFilter): Promise<KnowledgeEntry[]>;
  abstract addKnowledge(knowledge: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<number>;
  abstract getSnippets(filter?: SnippetFilter): Promise<any[]>;
  abstract addSnippet(snippet: any): Promise<number>;

  /**
   * Get database path
   */
  getPath(): string {
    return this.dbPath;
  }
}

/**
 * Cross-app pattern utilities
 */
export interface CrossAppPattern {
  id?: number;
  pattern_type: string;
  source_app: 'nova' | 'vibe';
  target_app: 'nova' | 'vibe';
  pattern_data: string;
  success_rate: number;
  usage_count: number;
}

export class CrossAppPatternTracker {
  /**
   * Record a successful pattern transfer between apps
   */
  static async recordPattern(
    db: LearningDatabaseInterface,
    pattern: Omit<CrossAppPattern, 'id' | 'usage_count'>
  ): Promise<void> {
    // Implementation depends on the platform
    // This is a placeholder for the interface
  }

  /**
   * Get patterns that worked well from one app to suggest for another
   */
  static async getSuggestedPatterns(
    db: LearningDatabaseInterface,
    targetApp: 'nova' | 'vibe',
    minSuccessRate = 0.7
  ): Promise<CrossAppPattern[]> {
    // Implementation depends on the platform
    return [];
  }
}
