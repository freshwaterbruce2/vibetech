/**
 * Mistake Tracker
 *
 * Tracks and categorizes mistakes across applications and platforms
 */

import type { LearningMistake } from '../types';

export interface MistakeStats {
  total: number;
  byPlatform: Record<string, number>;
  byApp: Record<string, number>;
  bySeverity: Record<string, number>;
  resolved: number;
  unresolved: number;
  mostCommon: Array<{ pattern: string; count: number }>;
}

export class MistakeTracker {
  /**
   * Generate statistics from mistake history
   */
  static generateStats(mistakes: LearningMistake[]): MistakeStats {
    const stats: MistakeStats = {
      total: mistakes.length,
      byPlatform: {},
      byApp: {},
      bySeverity: {},
      resolved: 0,
      unresolved: 0,
      mostCommon: [],
    };

    const patternCounts: Map<string, number> = new Map();

    for (const mistake of mistakes) {
      // Count by app
      const app = mistake.app_source || 'unknown';
      stats.byApp[app] = (stats.byApp[app] || 0) + 1;

      // Count by severity
      const severity = mistake.impact_severity || 'medium';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // Track pattern frequency
      const pattern = this.extractPattern(mistake.description);
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }

    // Get most common patterns
    stats.mostCommon = Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Check if a mistake is likely to recur based on history
   */
  static assessRecurrenceRisk(
    newMistake: Omit<LearningMistake, 'id' | 'created_at'>,
    history: LearningMistake[]
  ): { risk: 'low' | 'medium' | 'high'; similarCount: number } {
    let similarCount = 0;

    for (const mistake of history) {
      if (this.areSimilar(newMistake.description, mistake.description)) {
        similarCount++;
      }
    }

    let risk: 'low' | 'medium' | 'high' = 'low';
    if (similarCount >= 5) {
      risk = 'high';
    } else if (similarCount >= 2) {
      risk = 'medium';
    }

    return { risk, similarCount };
  }

  /**
   * Get prevention suggestions based on similar past mistakes
   */
  static getPreventionSuggestions(
    description: string,
    history: LearningMistake[]
  ): string[] {
    const suggestions: string[] = [];

    for (const mistake of history) {
      if (this.areSimilar(description, mistake.description) && mistake.prevention_strategy) {
        suggestions.push(mistake.prevention_strategy);
      }
    }

    // Return unique suggestions
    return Array.from(new Set(suggestions)).slice(0, 5);
  }

  /**
   * Categorize mistake by platform based on description
   */
  static categorizePlatform(mistake: LearningMistake): 'desktop' | 'web' | 'mobile' | 'python' | 'general' {
    const desc = mistake.description.toLowerCase();
    const context = mistake.context?.toLowerCase() || '';

    if (desc.includes('electron') || desc.includes('tauri') || context.includes('desktop')) {
      return 'desktop';
    }
    if (desc.includes('browser') || desc.includes('dom') || context.includes('web')) {
      return 'web';
    }
    if (desc.includes('mobile') || desc.includes('android') || desc.includes('ios')) {
      return 'mobile';
    }
    if (desc.includes('python') || desc.includes('.py') || context.includes('python')) {
      return 'python';
    }

    return 'general';
  }

  /**
   * Extract a pattern from mistake description
   */
  private static extractPattern(description: string): string {
    // This is simplified - production would use more sophisticated NLP
    const keywords = [
      'undefined', 'null', 'async', 'promise', 'type', 'import',
      'error', 'performance', 'security', 'database', 'api'
    ];

    const lower = description.toLowerCase();
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return keyword;
      }
    }

    return 'other';
  }

  /**
   * Check if two descriptions are similar
   */
  private static areSimilar(desc1: string, desc2: string): boolean {
    const words1 = new Set(desc1.toLowerCase().split(/\W+/));
    const words2 = new Set(desc2.toLowerCase().split(/\W+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const minSize = Math.min(words1.size, words2.size);

    // Similar if they share > 50% of words
    return intersection.size / minSize > 0.5;
  }
}
