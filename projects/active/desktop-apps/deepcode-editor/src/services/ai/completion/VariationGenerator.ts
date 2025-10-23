/**
 * Variation Generator
 * Generates multiple completion variations for user navigation
 *
 * October 2025 - Extracted from monolithic InlineCompletionProvider
 * Implements Cursor/Copilot pattern with Alt+] / Alt+[ navigation
 */

// This file needs runtime monaco for new monaco.Range()
import * as monaco from 'monaco-editor';
import { v4 as uuidv4 } from 'uuid';
import { getAnalyticsInstance } from '../CompletionAnalytics';
import type {
  CodeContext,
  CompletionVariation,
  VariationConfig,
} from './types';
import type { CompletionLatency, VariationType } from '../../../types/analytics';

const DEFAULT_CONFIG: VariationConfig = {
  maxVariations: 3,
  generateSingleLine: true,
  generateConservative: true,
  generateTwoLine: true,
};

export class VariationGenerator {
  private config: VariationConfig;
  private analytics = getAnalyticsInstance();

  constructor(config: Partial<VariationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate multiple completion variations
   * Monaco Editor automatically handles Alt+] / Alt+[ navigation
   */
  generate(
    primaryCompletion: string,
    position: monaco.Position,
    context: CodeContext,
    latency: CompletionLatency
  ): monaco.languages.InlineCompletion[] {
    const variations: monaco.languages.InlineCompletion[] = [];
    const baseRange = new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column
    );

    // Variation 1: Full completion (primary)
    const fullId = uuidv4();
    this.trackVariation(fullId, 'full', context, primaryCompletion.length, latency);
    variations.push(
      this.createVariation(fullId, primaryCompletion, baseRange, 'full', context)
    );

    // Variation 2: Single line only (if multi-line)
    if (this.config.generateSingleLine && primaryCompletion.includes('\n')) {
      const singleLine = primaryCompletion.split('\n')[0];
      if (singleLine && singleLine !== primaryCompletion) {
        const singleLineId = uuidv4();
        this.trackVariation(singleLineId, 'single-line', context, singleLine.length, latency);
        variations.push(
          this.createVariation(singleLineId, singleLine, baseRange, 'single-line', context)
        );
      }
    }

    // Variation 3: Conservative (first statement only)
    if (this.config.generateConservative) {
      const conservative = this.extractConservative(primaryCompletion);
      if (conservative && conservative !== primaryCompletion &&
          !variations.some(v => v.insertText === conservative)) {
        const conservativeId = uuidv4();
        this.trackVariation(conservativeId, 'conservative', context, conservative.length, latency);
        variations.push(
          this.createVariation(conservativeId, conservative, baseRange, 'conservative', context)
        );
      }
    }

    // Variation 4: Two-line (if multi-line with 3+ lines)
    if (this.config.generateTwoLine) {
      const twoLine = this.extractTwoLine(primaryCompletion);
      if (twoLine && !variations.some(v => v.insertText === twoLine)) {
        const twoLineId = uuidv4();
        this.trackVariation(twoLineId, 'two-line', context, twoLine.length, latency);
        variations.push(
          this.createVariation(twoLineId, twoLine, baseRange, 'two-line', context)
        );
      }
    }

    // Return up to maxVariations
    return variations.slice(0, this.config.maxVariations);
  }

  /**
   * Extract conservative completion (first statement only)
   */
  private extractConservative(text: string): string | null {
    // Split by semicolon or closing brace for conservative completion
    const conservativeMatch = text.match(/^[^;{}]+[;{}]?/);
    if (conservativeMatch) {
      return conservativeMatch[0].trim();
    }
    return null;
  }

  /**
   * Extract two-line completion
   */
  private extractTwoLine(text: string): string | null {
    const lines = text.split('\n');
    if (lines.length >= 3) {
      return lines.slice(0, 2).join('\n');
    }
    return null;
  }

  /**
   * Create a completion variation with analytics command
   */
  private createVariation(
    id: string,
    text: string,
    range: monaco.Range,
    type: VariationType,
    context: CodeContext
  ): monaco.languages.InlineCompletion {
    return {
      insertText: text,
      range,
      command: {
        id: 'inline-completion-accepted',
        title: `Track ${type} completion acceptance`,
        arguments: [id, type, context.language],
      },
    };
  }

  /**
   * Track variation shown to user (analytics)
   */
  private trackVariation(
    id: string,
    type: VariationType,
    context: CodeContext,
    length: number,
    latency: CompletionLatency
  ): void {
    const fileType = context.filePath.split('.').pop() || context.language;
    this.analytics.trackCompletionShown(
      id,
      type,
      context.language,
      length,
      latency,
      fileType
    );
  }

  /**
   * Update generator configuration
   */
  setConfig(config: Partial<VariationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VariationConfig {
    return { ...this.config };
  }
}
