/**
 * ProactiveDebugger - AI-powered proactive debugging
 * Predicts and prevents errors before they occur
 */
import { logger } from '../services/Logger';
import { databaseService } from './DatabaseService';

import type { UnifiedAIService } from './ai/UnifiedAIService';
import type { DetectedError } from './ErrorDetector';

export interface ErrorAnalysis {
  error: DetectedError;
  context: string;
  insights: string[];
  preventiveActions: string[];
  severityScore: number;
  relatedDocs: string[];
  codeExamples: CodeExample[];
  analysisTime: number;
  cached?: boolean;
}

export interface CodeExample {
  title: string;
  code: string;
  description: string;
}

export interface PredictedError {
  message: string;
  line: number;
  column: number;
  category: 'null-reference' | 'type-mismatch' | 'async-await' | 'promise-handling' | 'other';
  confidence: number;
  suggestion: string;
}

export interface ErrorPattern {
  pattern: string;
  occurrences: number;
  errorType: string;
  commonCause: string;
}

export interface DebuggerMetrics {
  totalAnalyses: number;
  averageTime: number;
  cacheHitRate: number;
  patternDetections: number;
}

export interface ProactiveDebuggerOptions {
  maxHistorySize?: number;
  cacheTimeout?: number; // milliseconds
}

export class ProactiveDebugger {
  private aiService: UnifiedAIService;
  private options: Required<ProactiveDebuggerOptions>;
  private errorHistory: ErrorAnalysis[] = [];
  private analysisCache: Map<string, { analysis: ErrorAnalysis; timestamp: number }> = new Map();
  private metrics: DebuggerMetrics = {
    totalAnalyses: 0,
    averageTime: 0,
    cacheHitRate: 0,
    patternDetections: 0
  };

  constructor(aiService: UnifiedAIService, options: ProactiveDebuggerOptions = {}) {
    this.aiService = aiService;
    this.options = {
      maxHistorySize: options.maxHistorySize || 100,
      cacheTimeout: options.cacheTimeout || 300000 // 5 minutes
    };
  }

  /**
   * Analyze an error with AI insights
   */
  async analyzeError(error: DetectedError, codeContext: string): Promise<ErrorAnalysis> {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(error, codeContext);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.updateMetrics(0, true);
      return { ...cached, cached: true };
    }

    // Build analysis
    const analysis: ErrorAnalysis = {
      error,
      context: codeContext,
      insights: await this.generateInsights(error, codeContext),
      preventiveActions: this.generatePreventiveActions(error),
      severityScore: this.calculateSeverity(error),
      relatedDocs: this.findRelatedDocs(error),
      codeExamples: this.generateCodeExamples(error),
      analysisTime: 0
    };

    analysis.analysisTime = performance.now() - startTime;

    // Cache and store
    this.cacheAnalysis(cacheKey, analysis);
    this.addToHistory(analysis);
    this.updateMetrics(analysis.analysisTime, false);

    return analysis;
  }

  /**
   * Predict potential errors from code
   */
  async predictErrors(code: string, file: string): Promise<PredictedError[]> {
    const predictions: PredictedError[] = [];

    // Pattern-based predictions
    predictions.push(...this.detectNullReferences(code));
    predictions.push(...this.detectAsyncIssues(code));
    predictions.push(...this.detectTypeMismatches(code));

    // AI-powered predictions
    try {
      const aiPredictions = await this.aiPredictErrors(code);
      predictions.push(...aiPredictions);
    } catch (error) {
      logger.warn('AI prediction failed:', error);
    }

    // Log predicted errors as potential bugs
    if (predictions.length > 0) {
      for (const prediction of predictions) {
        await databaseService.logMistake({
          mistakeType: 'potential_bug',
          mistakeCategory: 'proactive_analysis',
          description: prediction.message,
          contextWhenOccurred: `File: ${file}, Line: ${prediction.line}, Column: ${prediction.column}`,
          rootCauseAnalysis: `Predicted ${prediction.category} issue with ${Math.round(prediction.confidence * 100)}% confidence`,
          impactSeverity: prediction.confidence > 0.8 ? 'HIGH' : prediction.confidence > 0.5 ? 'MEDIUM' : 'LOW',
          preventionStrategy: prediction.suggestion,
          resolved: false,
          tags: ['proactive', 'potential', prediction.category, `confidence-${Math.round(prediction.confidence * 100)}`]
        }).catch(dbError => {
          logger.warn('[ProactiveDebugger] Failed to log predicted error:', dbError);
        });
      }
    }

    return predictions;
  }

  /**
   * Detect error patterns across history
   */
  detectPatterns(): ErrorPattern[] {
    const patterns: Map<string, ErrorPattern> = new Map();

    // Group by error message pattern
    for (const analysis of this.errorHistory) {
      const {error} = analysis;
      const patternKey = this.extractPattern(error.message);

      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, {
          pattern: patternKey,
          occurrences: 0,
          errorType: error.type,
          commonCause: this.inferCommonCause(error)
        });
      }

      const pattern = patterns.get(patternKey)!;
      pattern.occurrences++;
    }

    // Filter patterns with multiple occurrences
    const result = Array.from(patterns.values())
      .filter(p => p.occurrences >= 2)
      .sort((a, b) => b.occurrences - a.occurrences);

    this.metrics.patternDetections = result.length;

    return result;
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorAnalysis[] {
    return [...this.errorHistory];
  }

  /**
   * Get errors by file
   */
  getErrorsByFile(file: string): ErrorAnalysis[] {
    return this.errorHistory.filter(a => a.error.file === file);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.analysisCache.clear();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): DebuggerMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate AI insights
   */
  private async generateInsights(error: DetectedError, code: string): Promise<string[]> {
    try {
      const prompt = `Analyze this ${error.type} error and provide 3 concise insights:
Error: ${error.message}
Code context: ${code.substring(0, 500)}

Provide insights as a JSON array of strings.`;

      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        relatedFiles: [],
        conversationHistory: [],
        workspaceContext: undefined as any
      });

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response.content);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 3);
        }
      } catch {
        // Fallback: split by newlines
        return response.content.split('\n')
          .filter(line => line.trim())
          .slice(0, 3);
      }
    } catch (error) {
      logger.warn('Failed to generate AI insights:', error);
    }

    return [
      'This error occurs when accessing a property that doesn\'t exist',
      'Check the type definition and ensure all properties are declared',
      'Use TypeScript strict mode to catch these errors earlier'
    ];
  }

  /**
   * Generate preventive actions
   */
  private generatePreventiveActions(error: DetectedError): string[] {
    const actions: string[] = [];

    if (error.type === 'typescript') {
      actions.push('Enable TypeScript strict mode');
      actions.push('Use interface or type definitions');
      actions.push('Add proper type annotations');
    }

    if (error.message.includes('null') || error.message.includes('undefined')) {
      actions.push('Use optional chaining (?.)');
      actions.push('Add null checks');
      actions.push('Use nullish coalescing (??)');
      actions.push('Enable strictNullChecks in tsconfig.json');
    }

    if (error.message.includes('async') || error.message.includes('Promise')) {
      actions.push('Always await async functions');
      actions.push('Use try-catch for async errors');
      actions.push('Handle promise rejections');
    }

    return actions.length > 0 ? actions : ['Review code logic', 'Add tests', 'Use linting tools'];
  }

  /**
   * Calculate severity score (1-10)
   */
  private calculateSeverity(error: DetectedError): number {
    let score = 5; // Base score

    // Adjust by severity
    if (error.severity === 'error') {score += 3;}
    if (error.severity === 'warning') {score += 1;}

    // Adjust by keywords
    if (error.message.includes('cannot') || error.message.includes('undefined')) {score += 2;}
    if (error.message.includes('null')) {score += 1;}
    if (error.message.includes('syntax')) {score += 2;}

    return Math.min(10, Math.max(1, score));
  }

  /**
   * Find related documentation
   */
  private findRelatedDocs(error: DetectedError): string[] {
    const docs: string[] = [];

    if (error.code?.startsWith('TS')) {
      docs.push(`https://typescript-tv.com/errors/${error.code}`);
    }

    if (error.type === 'typescript') {
      docs.push('https://www.typescriptlang.org/docs/');
    }

    if (error.message.includes('Promise')) {
      docs.push('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise');
    }

    return docs;
  }

  /**
   * Generate code examples
   */
  private generateCodeExamples(error: DetectedError): CodeExample[] {
    const examples: CodeExample[] = [];

    if (error.message.includes('Property') && error.message.includes('does not exist')) {
      examples.push({
        title: 'Define the property',
        code: `interface Bar {\n  foo: string;\n}`,
        description: 'Add the missing property to your interface'
      });

      examples.push({
        title: 'Use optional chaining',
        code: `const value = bar?.foo ?? 'default';`,
        description: 'Safely access the property with optional chaining'
      });
    }

    return examples;
  }

  /**
   * Detect null references
   */
  private detectNullReferences(code: string): PredictedError[] {
    const predictions: PredictedError[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: variable.property without null check
      if (line.match(/(\w+)\.\w+/) && !line.includes('?.') && !line.includes('if')) {
        predictions.push({
          message: 'Potential null reference',
          line: i + 1,
          column: 0,
          category: 'null-reference',
          confidence: 0.6,
          suggestion: 'Add null check or use optional chaining'
        });
      }
    }

    return predictions;
  }

  /**
   * Detect async issues
   */
  private detectAsyncIssues(code: string): PredictedError[] {
    const predictions: PredictedError[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Async function without await
      if (line.includes('async') && !code.includes('await')) {
        predictions.push({
          message: 'Async function might not be using await',
          line: i + 1,
          column: 0,
          category: 'async-await',
          confidence: 0.7,
          suggestion: 'Use await for async operations'
        });
      }
    }

    return predictions;
  }

  /**
   * Detect type mismatches
   */
  private detectTypeMismatches(code: string): PredictedError[] {
    // Simplified - would use TypeScript compiler API in production
    return [];
  }

  /**
   * AI-powered error prediction
   */
  private async aiPredictErrors(code: string): Promise<PredictedError[]> {
    // Placeholder - would call AI service in production
    return [];
  }

  /**
   * Extract error pattern
   */
  private extractPattern(message: string): string {
    // Remove specific names and keep the pattern
    return message
      .replace(/'[^']+'/g, '<name>')
      .replace(/\d+/g, '<num>')
      .trim();
  }

  /**
   * Infer common cause
   */
  private inferCommonCause(error: DetectedError): string {
    if (error.message.includes('does not exist')) {
      return 'Missing property definition';
    }
    if (error.message.includes('undefined')) {
      return 'Variable not initialized';
    }
    if (error.message.includes('null')) {
      return 'Null reference';
    }
    return 'Unknown';
  }

  /**
   * Cache key generation
   */
  private getCacheKey(error: DetectedError, code: string): string {
    return `${error.type}:${error.message}:${code.substring(0, 100)}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): ErrorAnalysis | null {
    const cached = this.analysisCache.get(key);
    if (!cached) {return null;}

    // Check if expired
    if (Date.now() - cached.timestamp > this.options.cacheTimeout) {
      this.analysisCache.delete(key);
      return null;
    }

    return cached.analysis;
  }

  /**
   * Cache analysis
   */
  private cacheAnalysis(key: string, analysis: ErrorAnalysis): void {
    this.analysisCache.set(key, {
      analysis,
      timestamp: Date.now()
    });
  }

  /**
   * Add to history
   */
  private addToHistory(analysis: ErrorAnalysis): void {
    this.errorHistory.push(analysis);

    // Maintain max size
    if (this.errorHistory.length > this.options.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(analysisTime: number, cacheHit: boolean): void {
    this.metrics.totalAnalyses++;

    if (!cacheHit) {
      const total = this.metrics.averageTime * (this.metrics.totalAnalyses - 1);
      this.metrics.averageTime = (total + analysisTime) / this.metrics.totalAnalyses;
    }

    const cacheHits = Math.round(this.metrics.cacheHitRate * (this.metrics.totalAnalyses - 1));
    this.metrics.cacheHitRate = (cacheHits + (cacheHit ? 1 : 0)) / this.metrics.totalAnalyses;
  }
}
