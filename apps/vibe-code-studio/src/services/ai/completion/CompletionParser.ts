/**
 * Completion Parser
 * Extracts clean completion text from AI responses
 *
 * October 2025 - Extracted from monolithic InlineCompletionProvider
 * Handles multi-line completions (2025 best practice)
 */

import type { CodeContext, ParserConfig } from './types';

const DEFAULT_CONFIG: ParserConfig = {
  maxCompletionLength: 500,
  maxCompletionLines: 10,
  stripPrefix: true,
};

export class CompletionParser {
  private config: ParserConfig;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse AI response to extract clean completion
   * Enhanced for multi-line completions (2025 best practice)
   *
   * @param aiResponse - Raw AI response text
   * @param context - Code context for prefix stripping
   * @returns Cleaned completion text or null if invalid
   */
  parse(aiResponse: string, context: CodeContext): string | null {
    // Remove any markdown code blocks
    let cleaned = aiResponse.replace(/```[\w]*\n?/g, '').trim();

    // Strip prefix if enabled and AI echoed it back
    if (this.config.stripPrefix && cleaned.startsWith(context.currentLine)) {
      cleaned = cleaned.substring(context.currentLine.length);
    }

    // Validate completion
    if (!this.isValidCompletion(cleaned)) {
      return null;
    }

    return cleaned;
  }

  /**
   * Validate completion against configuration limits
   */
  private isValidCompletion(text: string): boolean {
    if (text.length === 0) {
      return false;
    }

    if (text.length > this.config.maxCompletionLength) {
      return false;
    }

    const lineCount = text.split('\n').length;
    if (lineCount > this.config.maxCompletionLines) {
      return false;
    }

    return true;
  }

  /**
   * Update parser configuration
   */
  setConfig(config: Partial<ParserConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ParserConfig {
    return { ...this.config };
  }
}
