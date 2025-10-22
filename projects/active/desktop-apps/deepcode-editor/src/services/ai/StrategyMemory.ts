/**
 * StrategyMemory Service - Phase 5
 *
 * Persists successful ReAct cycles and strategies across sessions.
 * Enables the agent to learn from past experiences and reuse proven approaches.
 *
 * Storage: localStorage for web compatibility (can be upgraded to database later)
 * Learning: Tracks usage counts and success rates for each pattern
 *
 * @see Phase 4: ReActExecutor for cycle generation
 */
import { logger } from '../../services/Logger';

import {
  StrategyPattern,
  StrategyQuery,
  StrategyMatch,
  StrategyMemoryStats,
  ReActCycle,
  ActionType,
  AgentStep,
} from '../../types';

const STORAGE_KEY = 'deepcode_strategy_memory';
const MAX_PATTERNS = 500; // Prevent unlimited growth

export class StrategyMemory {
  private patterns: Map<string, StrategyPattern> = new Map();
  private storageAvailable: boolean = true;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Store a successful pattern from a ReAct cycle
   */
  async storeSuccessfulPattern(
    step: AgentStep,
    cycle: ReActCycle,
    context?: {
      taskType?: string;
      fileExtension?: string;
      workspaceType?: string;
    }
  ): Promise<void> {
    if (!cycle.observation.success) {
      logger.debug('[StrategyMemory] Skipping failed cycle - only storing successes');
      return;
    }

    const problemSignature = this.generateSignature(
      step.description,
      step.action.type,
      context
    );

    // Check if pattern already exists
    const existingPattern = this.patterns.get(problemSignature);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      existingPattern.lastUsedAt = new Date();
      existingPattern.lastSuccessAt = new Date();
      existingPattern.successRate = this.calculateSuccessRate(
        existingPattern.usageCount,
        existingPattern.usageCount // All stored patterns are successes
      );
      existingPattern.confidence = Math.min(
        100,
        existingPattern.confidence + 5 // Increase confidence with repeated success
      );

      logger.debug(`[StrategyMemory] Updated existing pattern: ${problemSignature}`);
      logger.debug(`[StrategyMemory]   Usage count: ${existingPattern.usageCount}`);
      logger.debug(`[StrategyMemory]   Confidence: ${existingPattern.confidence}%`);
    } else {
      // Create new pattern
      const newPattern: StrategyPattern = {
        id: this.generateId(),
        problemSignature,
        problemDescription: step.description,
        actionType: step.action.type,
        successfulApproach: cycle.thought.approach,
        context: context || {},
        reActCycle: cycle,
        confidence: cycle.thought.confidence,
        usageCount: 1,
        successRate: 100, // First success
        createdAt: new Date(),
        lastUsedAt: new Date(),
        lastSuccessAt: new Date(),
      };

      this.patterns.set(problemSignature, newPattern);

      logger.debug(`[StrategyMemory] ✅ Stored new pattern: ${problemSignature}`);
      logger.debug(`[StrategyMemory]   Approach: ${newPattern.successfulApproach}`);
      logger.debug(`[StrategyMemory]   Confidence: ${newPattern.confidence}%`);
    }

    // Enforce max patterns limit (remove oldest, least used)
    if (this.patterns.size > MAX_PATTERNS) {
      this.pruneOldPatterns();
    }

    this.saveToStorage();
  }

  /**
   * Query for relevant patterns based on problem description and context
   */
  async queryPatterns(query: StrategyQuery): Promise<StrategyMatch[]> {
    const matches: StrategyMatch[] = [];

    for (const pattern of this.patterns.values()) {
      const relevanceScore = this.calculateRelevance(pattern, query);

      if (relevanceScore > 30) { // Threshold for relevance
        matches.push({
          pattern,
          relevanceScore,
          reason: this.explainRelevance(pattern, query, relevanceScore),
        });
      }
    }

    // Sort by relevance score (highest first)
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    const maxResults = query.maxResults || 5;
    const topMatches = matches.slice(0, maxResults);

    if (topMatches.length > 0) {
      logger.debug(`[StrategyMemory] 🔍 Found ${topMatches.length} relevant pattern(s)`);
      topMatches.forEach((match, i) => {
        logger.debug(`[StrategyMemory]   ${i + 1}. ${match.pattern.problemDescription}`);
        logger.debug(`[StrategyMemory]      Relevance: ${match.relevanceScore}%`);
        logger.debug(`[StrategyMemory]      Approach: ${match.pattern.successfulApproach}`);
      });
    } else {
      logger.debug('[StrategyMemory] No relevant patterns found');
    }

    return topMatches;
  }

  /**
   * Record that a pattern was attempted (for success rate tracking)
   */
  async recordPatternUsage(
    patternId: string,
    success: boolean
  ): Promise<void> {
    for (const pattern of this.patterns.values()) {
      if (pattern.id === patternId) {
        pattern.usageCount++;
        pattern.lastUsedAt = new Date();

        if (success) {
          pattern.lastSuccessAt = new Date();
        }

        // Recalculate success rate
        const successCount = Math.round((pattern.successRate / 100) * (pattern.usageCount - 1));
        const newSuccessCount = success ? successCount + 1 : successCount;
        pattern.successRate = this.calculateSuccessRate(newSuccessCount, pattern.usageCount);

        // Adjust confidence based on success
        if (success) {
          pattern.confidence = Math.min(100, pattern.confidence + 3);
        } else {
          pattern.confidence = Math.max(0, pattern.confidence - 5);
        }

        logger.debug(`[StrategyMemory] 📊 Updated pattern usage: ${pattern.problemDescription}`);
        logger.debug(`[StrategyMemory]    Success: ${success}, Rate: ${pattern.successRate}%`);

        this.saveToStorage();
        return;
      }
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): StrategyMemoryStats {
    const patterns = Array.from(this.patterns.values());

    if (patterns.length === 0) {
      return {
        totalPatterns: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        averageSuccessRate: 0,
      };
    }

    const totalSuccesses = patterns.reduce((sum, p) => {
      return sum + Math.round((p.successRate / 100) * p.usageCount);
    }, 0);

    const totalUsages = patterns.reduce((sum, p) => sum + p.usageCount, 0);
    const totalFailures = totalUsages - totalSuccesses;

    const averageSuccessRate =
      patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;

    const mostUsed = patterns.reduce((max, p) =>
      p.usageCount > (max?.usageCount || 0) ? p : max
    );

    const oldest = patterns.reduce((old, p) =>
      new Date(p.createdAt) < new Date(old?.createdAt || new Date()) ? p : old
    );

    const newest = patterns.reduce((newP, p) =>
      new Date(p.createdAt) > new Date(newP?.createdAt || 0) ? p : newP
    );

    return {
      totalPatterns: patterns.length,
      totalSuccesses,
      totalFailures,
      averageSuccessRate,
      mostUsedPattern: mostUsed,
      oldestPattern: oldest,
      newestPattern: newest,
    };
  }

  /**
   * Clear all stored patterns (for testing or reset)
   */
  clearAll(): void {
    this.patterns.clear();
    this.saveToStorage();
    logger.debug('[StrategyMemory] 🗑️ All patterns cleared');
  }

  /**
   * Export patterns as JSON (for backup or migration)
   */
  exportPatterns(): string {
    const patterns = Array.from(this.patterns.values());
    return JSON.stringify(patterns, null, 2);
  }

  /**
   * Import patterns from JSON
   */
  importPatterns(json: string): void {
    try {
      const patterns = JSON.parse(json) as StrategyPattern[];
      this.patterns.clear();

      for (const pattern of patterns) {
        // Restore Date objects
        pattern.createdAt = new Date(pattern.createdAt);
        pattern.lastUsedAt = new Date(pattern.lastUsedAt);
        if (pattern.lastSuccessAt) {
          pattern.lastSuccessAt = new Date(pattern.lastSuccessAt);
        }

        this.patterns.set(pattern.problemSignature, pattern);
      }

      this.saveToStorage();
      logger.debug(`[StrategyMemory] ✅ Imported ${patterns.length} patterns`);
    } catch (error) {
      logger.error('[StrategyMemory] ❌ Failed to import patterns:', error);
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Generate a unique signature for a problem
   */
  private generateSignature(
    description: string,
    actionType: ActionType,
    context?: {
      taskType?: string;
      fileExtension?: string;
      workspaceType?: string;
    }
  ): string {
    const normalized = description.toLowerCase().trim();
    const parts = [
      actionType,
      normalized.substring(0, 50), // Limit description length
      context?.taskType || '',
      context?.fileExtension || '',
    ];

    return parts.filter(Boolean).join('::');
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Calculate relevance score between a pattern and a query
   */
  private calculateRelevance(
    pattern: StrategyPattern,
    query: StrategyQuery
  ): number {
    let score = 0;

    // Action type match (high weight)
    if (query.actionType && pattern.actionType === query.actionType) {
      score += 40;
    }

    // Description similarity (moderate weight)
    const descSimilarity = this.calculateStringSimilarity(
      pattern.problemDescription.toLowerCase(),
      query.problemDescription.toLowerCase()
    );
    score += descSimilarity * 30;

    // Context matches (moderate weight)
    if (query.context) {
      if (query.context.taskType && pattern.context.taskType === query.context.taskType) {
        score += 15;
      }
      if (query.context.fileExtension && pattern.context.fileExtension === query.context.fileExtension) {
        score += 10;
      }
      if (query.context.errorType && pattern.context.errorType === query.context.errorType) {
        score += 15;
      }
    }

    // Success rate bonus (patterns that work more often score higher)
    score += (pattern.successRate / 100) * 10;

    // Recency bonus (recently used patterns get a small boost)
    const daysSinceUse = (Date.now() - new Date(pattern.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUse < 7) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Simple string similarity using Jaccard index
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Explain why a pattern is relevant
   */
  private explainRelevance(
    pattern: StrategyPattern,
    query: StrategyQuery,
    score: number
  ): string {
    const reasons: string[] = [];

    if (query.actionType === pattern.actionType) {
      reasons.push('Same action type');
    }

    if (query.context?.taskType === pattern.context.taskType) {
      reasons.push('Same task type');
    }

    if (query.context?.fileExtension === pattern.context.fileExtension) {
      reasons.push(`Same file type (${pattern.context.fileExtension})`);
    }

    if (pattern.successRate > 80) {
      reasons.push('High success rate');
    }

    if (pattern.usageCount > 3) {
      reasons.push('Proven pattern');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Similar problem description';
  }

  /**
   * Calculate success rate percentage
   */
  private calculateSuccessRate(successCount: number, totalCount: number): number {
    return totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;
  }

  /**
   * Remove oldest, least-used patterns when limit exceeded
   */
  private pruneOldPatterns(): void {
    const patterns = Array.from(this.patterns.values());

    // Sort by score: lower = more likely to prune
    // Score = usageCount * successRate * recencyBonus
    patterns.sort((a, b) => {
      const scoreA = a.usageCount * (a.successRate / 100) *
        (1 + 1 / (1 + (Date.now() - new Date(a.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24)));
      const scoreB = b.usageCount * (b.successRate / 100) *
        (1 + 1 / (1 + (Date.now() - new Date(b.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24)));

      return scoreA - scoreB; // Ascending (lowest scores first)
    });

    // Remove bottom 10%
    const removeCount = Math.ceil(patterns.length * 0.1);
    const toRemove = patterns.slice(0, removeCount);

    for (const pattern of toRemove) {
      this.patterns.delete(pattern.problemSignature);
    }

    logger.debug(`[StrategyMemory] Pruned ${removeCount} old patterns`);
  }

  /**
   * Load patterns from localStorage
   */
  private loadFromStorage(): void {
    if (!this.isStorageAvailable()) {
      logger.warn('[StrategyMemory] localStorage not available, using in-memory only');
      this.storageAvailable = false;
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const patterns = JSON.parse(stored) as StrategyPattern[];

        for (const pattern of patterns) {
          // Restore Date objects
          pattern.createdAt = new Date(pattern.createdAt);
          pattern.lastUsedAt = new Date(pattern.lastUsedAt);
          if (pattern.lastSuccessAt) {
            pattern.lastSuccessAt = new Date(pattern.lastSuccessAt);
          }

          this.patterns.set(pattern.problemSignature, pattern);
        }

        logger.debug(`[StrategyMemory] ✅ Loaded ${patterns.length} patterns from storage`);
      }
    } catch (error) {
      logger.error('[StrategyMemory] Failed to load from storage:', error);
    }
  }

  /**
   * Save patterns to localStorage
   */
  private saveToStorage(): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      const patterns = Array.from(this.patterns.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
    } catch (error) {
      logger.error('[StrategyMemory] Failed to save to storage:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
