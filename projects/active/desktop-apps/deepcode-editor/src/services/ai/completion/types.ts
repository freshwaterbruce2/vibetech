/**
 * Shared types for modular completion system
 * October 2025 - Extracted from monolithic InlineCompletionProvider
 */

import * as monaco from 'monaco-editor';
import type { CompletionLatency, VariationType } from '../../../types/analytics';

/**
 * Code context for completion requests
 */
export interface CodeContext {
  prefix: string;
  currentLine: string;
  language: string;
  filePath: string;
  lineNumber: number;
  column: number;
}

/**
 * Completion request configuration
 */
export interface CompletionRequest {
  context: CodeContext;
  model: monaco.editor.ITextModel;
  position: monaco.Position;
  token: monaco.CancellationToken;
}

/**
 * Completion response from AI
 */
export interface CompletionResponse {
  text: string;
  model: string;
  latency: number;
  fromCache: boolean;
  wasStreaming: boolean;
}

/**
 * Completion variation with metadata
 */
export interface CompletionVariation {
  id: string;
  text: string;
  type: VariationType;
  range: monaco.Range;
  latency: CompletionLatency;
}

/**
 * Cache entry structure
 */
export interface CacheEntry {
  completions: monaco.languages.InlineCompletion[];
  timestamp: number;
  hits: number;
}

/**
 * Model selection strategy
 */
export type ModelStrategy = 'fast' | 'balanced' | 'accurate' | 'adaptive';

/**
 * Model configuration
 */
export interface ModelConfig {
  name: string;
  provider: 'anthropic' | 'openai' | 'deepseek' | 'google';
  costPerMToken: number;
  avgLatencyMs: number;
  qualityScore: number; // 0-100
}

/**
 * Completion fetcher options
 */
export interface FetcherOptions {
  streaming: boolean;
  maxTokens: number;
  temperature: number;
  debounceMs: number;
}

/**
 * Parser configuration
 */
export interface ParserConfig {
  maxCompletionLength: number;
  maxCompletionLines: number;
  stripPrefix: boolean;
}

/**
 * Variation generator configuration
 */
export interface VariationConfig {
  maxVariations: number;
  generateSingleLine: boolean;
  generateConservative: boolean;
  generateTwoLine: boolean;
}
