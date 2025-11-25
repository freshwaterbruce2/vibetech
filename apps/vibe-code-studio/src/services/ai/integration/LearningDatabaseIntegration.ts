/**
 * Learning Database Integration
 *
 * Manages connections and operations with D:\ learning databases
 * Provides pattern recognition and knowledge storage capabilities
 */

import { AgentTask } from '@nova/types';
import { DatabasePlugin } from '../plugin-system/types';
import { pluginRegistry } from '../plugin-system/PluginRegistry';
import { logger } from '../../Logger';

export interface LearningPattern {
  id: string;
  pattern: string;
  context: string;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
  metadata: Record<string, any>;
}

export interface LearningInsight {
  source: 'pattern' | 'mistake' | 'knowledge';
  content: string;
  relevance: number;
  timestamp: Date;
}

export interface LearningQuery {
  task?: AgentTask;
  description?: string;
  context?: Record<string, any>;
  maxResults?: number;
  minRelevance?: number;
}

export interface LearningUpdate {
  type: 'success' | 'failure' | 'insight';
  task: AgentTask;
  outcome: any;
  metadata?: Record<string, any>;
}

export class LearningDatabaseIntegration {
  private readonly dbPaths = {
    learning: 'D:\\databases\\agent_learning.db',
    activity: 'D:\\databases\\nova_activity.db'
  };

  private patterns = new Map<string, LearningPattern>();
  private insights = new Map<string, LearningInsight[]>();
  private databasePlugins: DatabasePlugin[] = [];
  private isConnected = false;

  constructor() {
    logger.debug('[LearningDB] Initialized with paths:', this.dbPaths);
    this.initializePlugins();
  }

  /**
   * Initialize database plugins
   */
  private async initializePlugins(): Promise<void> {
    this.databasePlugins = pluginRegistry.getDatabasePlugins();

    if (this.databasePlugins.length > 0) {
      logger.info(`[LearningDB] Found ${this.databasePlugins.length} database plugins`);

      for (const plugin of this.databasePlugins) {
        try {
          await plugin.connect();
        } catch (error) {
          logger.error(`[LearningDB] Failed to connect plugin ${plugin.id}:`, error);
        }
      }
    }
  }

  /**
   * Connect to learning databases
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      // In a real implementation, this would connect to SQLite databases
      // For now, we'll simulate with in-memory storage
      logger.info('[LearningDB] Connecting to learning databases...');

      // Load initial patterns (simulated)
      await this.loadInitialPatterns();

      this.isConnected = true;
      logger.info('[LearningDB] Successfully connected to learning databases');
    } catch (error) {
      logger.error('[LearningDB] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Query learning database for insights
   */
  async queryLearningDatabase(
    query: LearningQuery
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Query patterns
    if (query.task || query.description) {
      const patterns = await this.queryPatterns(query);
      insights.push(...patterns.map(p => ({
        source: 'pattern' as const,
        content: `Pattern: ${p.pattern} (success rate: ${p.successRate}%)`,
        relevance: this.calculateRelevance(p, query),
        timestamp: p.lastUsed
      })));
    }

    // Query from plugins
    for (const plugin of this.databasePlugins) {
      try {
        const pluginPatterns = await plugin.queryPatterns({
          problemDescription: query.description || query.task?.description || '',
          actionType: query.task?.steps?.[0]?.action.type,
          context: query.context,
          maxResults: query.maxResults
        });

        insights.push(...pluginPatterns.map(p => ({
          source: 'pattern' as const,
          content: `${plugin.name}: ${p.description}`,
          relevance: p.successRate / 100,
          timestamp: new Date()
        })));
      } catch (error) {
        logger.debug(`[LearningDB] Plugin ${plugin.id} query failed:`, error);
      }
    }

    // Sort by relevance and limit results
    insights.sort((a, b) => b.relevance - a.relevance);

    if (query.maxResults) {
      return insights.slice(0, query.maxResults);
    }

    if (query.minRelevance) {
      return insights.filter(i => i.relevance >= query.minRelevance);
    }

    return insights;
  }

  /**
   * Query patterns from memory
   */
  private async queryPatterns(query: LearningQuery): Promise<LearningPattern[]> {
    const results: LearningPattern[] = [];
    const searchText = query.description || query.task?.description || '';

    for (const pattern of this.patterns.values()) {
      if (this.matchesQuery(pattern, searchText, query.context)) {
        results.push(pattern);
      }
    }

    return results;
  }

  /**
   * Check if pattern matches query
   */
  private matchesQuery(
    pattern: LearningPattern,
    searchText: string,
    context?: Record<string, any>
  ): boolean {
    // Simple text matching
    if (searchText && !pattern.pattern.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    // Context matching
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (pattern.metadata[key] && pattern.metadata[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(
    pattern: LearningPattern,
    query: LearningQuery
  ): number {
    let relevance = pattern.successRate / 100;

    // Boost for recent usage
    const daysSinceUse = (Date.now() - pattern.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUse < 7) {
      relevance *= 1.2;
    } else if (daysSinceUse > 30) {
      relevance *= 0.8;
    }

    // Boost for high usage count
    if (pattern.usageCount > 10) {
      relevance *= 1.1;
    }

    return Math.min(relevance, 1.0);
  }

  /**
   * Store successful pattern
   */
  async storeSuccessfulPattern(
    task: AgentTask,
    outcome: any,
    context?: Record<string, any>
  ): Promise<void> {
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pattern: LearningPattern = {
      id: patternId,
      pattern: task.description,
      context: JSON.stringify(context || {}),
      successRate: 100,
      usageCount: 1,
      lastUsed: new Date(),
      metadata: context || {}
    };

    this.patterns.set(patternId, pattern);

    // Store in plugins
    for (const plugin of this.databasePlugins) {
      try {
        await plugin.storePattern({
          id: patternId,
          description: task.description,
          actionType: task.steps?.[0]?.action.type || 'unknown',
          successRate: 100,
          usageCount: 1,
          context: context || {}
        });
      } catch (error) {
        logger.debug(`[LearningDB] Failed to store in plugin ${plugin.id}:`, error);
      }
    }

    logger.debug(`[LearningDB] Stored successful pattern: ${patternId}`);
  }

  /**
   * Record a mistake for learning
   */
  async recordMistake(
    task: AgentTask,
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    const mistakeId = `mistake_${Date.now()}`;

    const insight: LearningInsight = {
      source: 'mistake',
      content: `Failed: ${task.description} - Error: ${error.message}`,
      relevance: 0.9, // Mistakes are highly relevant for learning
      timestamp: new Date()
    };

    if (!this.insights.has(task.id)) {
      this.insights.set(task.id, []);
    }
    this.insights.get(task.id)!.push(insight);

    logger.debug(`[LearningDB] Recorded mistake: ${mistakeId}`);
  }

  /**
   * Update learning from task execution
   */
  async updateLearning(update: LearningUpdate): Promise<void> {
    switch (update.type) {
      case 'success':
        await this.storeSuccessfulPattern(
          update.task,
          update.outcome,
          update.metadata
        );
        break;

      case 'failure':
        await this.recordMistake(
          update.task,
          update.outcome,
          update.metadata
        );
        break;

      case 'insight':
        const insight: LearningInsight = {
          source: 'knowledge',
          content: update.outcome,
          relevance: 0.7,
          timestamp: new Date()
        };

        if (!this.insights.has(update.task.id)) {
          this.insights.set(update.task.id, []);
        }
        this.insights.get(update.task.id)!.push(insight);
        break;
    }
  }

  /**
   * Load initial patterns (simulated)
   */
  private async loadInitialPatterns(): Promise<void> {
    // Simulated patterns for common tasks
    const initialPatterns: LearningPattern[] = [
      {
        id: 'pattern_react_component',
        pattern: 'create react component',
        context: 'React development',
        successRate: 95,
        usageCount: 50,
        lastUsed: new Date(),
        metadata: { framework: 'React', type: 'component' }
      },
      {
        id: 'pattern_test_generation',
        pattern: 'generate unit tests',
        context: 'Testing',
        successRate: 88,
        usageCount: 30,
        lastUsed: new Date(Date.now() - 86400000), // 1 day ago
        metadata: { type: 'testing', tool: 'jest' }
      },
      {
        id: 'pattern_refactoring',
        pattern: 'refactor code for performance',
        context: 'Optimization',
        successRate: 82,
        usageCount: 15,
        lastUsed: new Date(Date.now() - 604800000), // 1 week ago
        metadata: { type: 'refactoring', focus: 'performance' }
      }
    ];

    for (const pattern of initialPatterns) {
      this.patterns.set(pattern.id, pattern);
    }

    logger.debug(`[LearningDB] Loaded ${initialPatterns.length} initial patterns`);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalPatterns: number;
    averageSuccessRate: number;
    totalInsights: number;
    pluginCount: number;
  }> {
    let totalSuccessRate = 0;
    let totalInsights = 0;

    for (const pattern of this.patterns.values()) {
      totalSuccessRate += pattern.successRate;
    }

    for (const insightList of this.insights.values()) {
      totalInsights += insightList.length;
    }

    return {
      totalPatterns: this.patterns.size,
      averageSuccessRate: this.patterns.size > 0
        ? totalSuccessRate / this.patterns.size
        : 0,
      totalInsights,
      pluginCount: this.databasePlugins.length
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.patterns.clear();
    this.insights.clear();
  }
}
