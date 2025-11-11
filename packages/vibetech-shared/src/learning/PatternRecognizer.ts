/**
 * Pattern Recognizer
 *
 * Identifies patterns in code, mistakes, and successful strategies
 * across both NOVA Agent and Vibe Code Studio
 */

import type { LearningMistake, KnowledgeEntry } from '../types';

export interface RecognizedPattern {
  type: 'mistake' | 'success' | 'optimization';
  pattern: string;
  frequency: number;
  contexts: string[];
  platforms: Array<'desktop' | 'web' | 'mobile' | 'python'>;
  apps: Array<'nova' | 'vibe'>;
  confidence: number;
}

export class PatternRecognizer {
  /**
   * Analyze mistakes to identify recurring patterns
   */
  static analyzeMistakePatterns(mistakes: LearningMistake[]): RecognizedPattern[] {
    const patterns: Map<string, RecognizedPattern> = new Map();

    for (const mistake of mistakes) {
      // Extract pattern from mistake type and description
      const patternKey = this.extractPatternKey(mistake.description);

      if (patterns.has(patternKey)) {
        const pattern = patterns.get(patternKey)!;
        pattern.frequency++;
        if (mistake.context) {
          pattern.contexts.push(mistake.context);
        }
      } else {
        patterns.set(patternKey, {
          type: 'mistake',
          pattern: patternKey,
          frequency: 1,
          contexts: mistake.context ? [mistake.context] : [],
          platforms: [],
          apps: [mistake.app_source || 'nova'],
          confidence: 0.5,
        });
      }
    }

    // Calculate confidence based on frequency
    const result = Array.from(patterns.values());
    result.forEach(pattern => {
      pattern.confidence = Math.min(0.9, 0.5 + (pattern.frequency * 0.1));
    });

    return result.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Find similar patterns across apps
   */
  static findCrossAppPatterns(
    novaData: { mistakes: LearningMistake[]; knowledge: KnowledgeEntry[] },
    vibeData: { mistakes: LearningMistake[]; knowledge: KnowledgeEntry[] }
  ): RecognizedPattern[] {
    const novaPatterns = this.analyzeMistakePatterns(novaData.mistakes);
    const vibePatterns = this.analyzeMistakePatterns(vibeData.mistakes);

    const crossAppPatterns: RecognizedPattern[] = [];

    // Find patterns that appear in both apps
    for (const novaPattern of novaPatterns) {
      for (const vibePattern of vibePatterns) {
        const similarity = this.calculateSimilarity(novaPattern.pattern, vibePattern.pattern);

        if (similarity > 0.7) {
          crossAppPatterns.push({
            type: novaPattern.type,
            pattern: novaPattern.pattern,
            frequency: novaPattern.frequency + vibePattern.frequency,
            contexts: [...novaPattern.contexts, ...vibePattern.contexts],
            platforms: [],
            apps: ['nova', 'vibe'],
            confidence: Math.min(0.95, (novaPattern.confidence + vibePattern.confidence) / 2 + 0.2),
          });
        }
      }
    }

    return crossAppPatterns;
  }

  /**
   * Get platform-specific patterns
   */
  static getPlatformPatterns(
    mistakes: LearningMistake[],
    platform: 'desktop' | 'web' | 'mobile' | 'python'
  ): RecognizedPattern[] {
    // Filter mistakes by platform (if available)
    const platformMistakes = mistakes; // Would filter by platform in real implementation

    const patterns = this.analyzeMistakePatterns(platformMistakes);

    // Tag with platform
    patterns.forEach(pattern => {
      pattern.platforms = [platform];
    });

    return patterns;
  }

  /**
   * Extract a pattern key from mistake description
   */
  private static extractPatternKey(description: string): string {
    // Simple extraction - in production, this would use NLP
    const lower = description.toLowerCase();

    // Common patterns
    if (lower.includes('undefined') || lower.includes('null')) {
      return 'null-undefined-access';
    }
    if (lower.includes('async') || lower.includes('promise')) {
      return 'async-handling';
    }
    if (lower.includes('type') || lower.includes('typescript')) {
      return 'type-error';
    }
    if (lower.includes('import') || lower.includes('module')) {
      return 'import-error';
    }
    if (lower.includes('performance') || lower.includes('slow')) {
      return 'performance-issue';
    }

    // Default to first few words
    return description.split(' ').slice(0, 3).join('-').toLowerCase();
  }

  /**
   * Calculate similarity between two pattern strings
   */
  private static calculateSimilarity(a: string, b: string): number {
    // Simple Jaccard similarity for now
    const setA = new Set(a.toLowerCase().split(/[\s-]+/));
    const setB = new Set(b.toLowerCase().split(/[\s-]+/));

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }
}
