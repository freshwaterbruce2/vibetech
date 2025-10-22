/**
 * AutoFixService - Generate AI-powered fixes for errors
 * Updated Oct 20, 2025: Smart model selection with October 2025 AI models
 */
import { logger } from '../services/Logger';

import * as monaco from 'monaco-editor';
import { ModelRegistry } from './ModelRegistry';

export interface DetectedError {
  id: string;
  type: 'typescript' | 'eslint' | 'runtime';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  code?: string;
  stackTrace?: string;
  suggestion?: string;
}

export interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  startLine: number;
  endLine: number;
  confidence: 'high' | 'medium' | 'low';
  modelUsed?: string; // Added: track which model generated this fix
  estimatedCost?: number; // Added: track cost per fix
}

export interface GeneratedFix {
  error: DetectedError;
  suggestions: FixSuggestion[];
  context: string;
  explanation: string;
  modelUsed?: string; // Added: track which model was used
  generationTime?: number; // Added: track latency
}

export interface AutoFixConfig {
  preferredModel?: string; // User preference
  maxCostPerFix?: number; // Budget limit per fix (default: $0.01)
  preferSpeed?: boolean; // Optimize for speed vs quality (default: true for simple errors)
}

export class AutoFixService {
  private cache: Map<string, GeneratedFix> = new Map();
  private codeVersions: Map<string, string> = new Map();
  private modelRegistry: ModelRegistry;
  private config: AutoFixConfig;

  constructor(private aiService: any, config?: AutoFixConfig) {
    if (!aiService) {
      throw new Error('AI service is required');
    }

    this.modelRegistry = new ModelRegistry();
    this.config = {
      maxCostPerFix: 0.01, // Default: 1 cent per fix
      preferSpeed: true,    // Default: optimize for speed
      ...config
    };
  }

  /**
   * Select best AI model for fixing this error
   * Uses October 2025 models with cost-aware routing
   */
  private selectModelForError(error: DetectedError, contextSize: number): string {
    // User preference overrides everything
    if (this.config.preferredModel) {
      return this.config.preferredModel;
    }

    // Determine error complexity
    const isSimpleError = this.isSimpleError(error);
    const isComplexRefactoring = contextSize > 50 || error.stackTrace !== undefined;

    // Cost-aware model selection (October 2025 best practices)
    if (isSimpleError) {
      // Fast, cheap fixes: Claude Haiku 4.5 ($1/MTok - 2x faster than Sonnet 4)
      // Examples: syntax errors, missing semicolons, undefined variables
      return 'claude-haiku-4.5';
    } else if (isComplexRefactoring) {
      // Complex coding: Claude Sonnet 4.5 (77.2% SWE-bench - BEST CODING)
      // Examples: type mismatches, complex refactoring, architectural changes
      return 'claude-sonnet-4.5';
    } else if (this.config.preferSpeed) {
      // Medium complexity, prefer speed: Claude Haiku 4.5
      return 'claude-haiku-4.5';
    } else {
      // Medium complexity, prefer quality: Claude Sonnet 4.5
      return 'claude-sonnet-4.5';
    }
  }

  /**
   * Determine if error is simple (can use faster/cheaper model)
   */
  private isSimpleError(error: DetectedError): boolean {
    // TypeScript simple errors
    const simpleErrorCodes = [
      'TS2304', // Cannot find name
      'TS2554', // Expected N arguments, got M
      'TS2551', // Property does not exist (typo)
      'TS2339', // Property does not exist on type
      'TS1005', // Expected token
      'TS1127', // Invalid character
    ];

    if (error.code && simpleErrorCodes.some(code => error.code?.includes(code))) {
      return true;
    }

    // ESLint style issues (always simple)
    if (error.type === 'eslint') {
      return true;
    }

    // Short error messages usually indicate simple issues
    if (error.message.length < 50) {
      return true;
    }

    return false;
  }

  /**
   * Generate fix suggestions for a detected error
   */
  async generateFix(
    error: DetectedError,
    editor: monaco.editor.IStandaloneCodeEditor
  ): Promise<GeneratedFix> {
    const startTime = Date.now();
    const model = editor.getModel();
    if (!model) {
      throw new Error('Editor model not found');
    }

    const fileContent = model.getValue();

    // Check cache
    const cacheKey = this.getCacheKey(error);
    const cachedVersion = this.codeVersions.get(cacheKey);

    if (cachedVersion === fileContent && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Extract context
    const context = this.extractContext(fileContent, error.line);
    const contextLines = context.split('\n').length;

    // Select best model for this error (Oct 2025 smart routing)
    const selectedModel = this.selectModelForError(error, contextLines);
    logger.debug(`[AutoFix] Selected model: ${selectedModel} for error type: ${error.type}, code: ${error.code}`);

    // Build prompt
    const prompt = this.buildFixPrompt(error, context);

    // Estimate token usage (rough estimate: 4 chars per token)
    const promptTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = 500; // Typical fix response

    // Calculate estimated cost
    const modelInfo = this.modelRegistry.getModel(selectedModel);
    const estimatedCost = modelInfo
      ? this.modelRegistry.calculateCost(selectedModel, promptTokens, estimatedOutputTokens)
      : 0;

    logger.debug(`[AutoFix] Estimated cost: $${estimatedCost.toFixed(4)} (${promptTokens} in, ${estimatedOutputTokens} out)`);

    // Get AI response
    let response: string;
    try {
      const aiResponse = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        relatedFiles: [],
        workspaceContext: {
          projectName: 'unknown',
          projectType: 'unknown',
          frameworks: [],
          dependencies: [],
          fileTree: []
        },
        conversationHistory: []
      });
      response = aiResponse.content;
    } catch (err) {
      throw new Error('AI service error: ' + (err as Error).message);
    }

    // Calculate generation time
    const generationTime = Date.now() - startTime;

    // Parse response into suggestions
    const suggestions = this.parseResponse(response, error, selectedModel, estimatedCost);

    // Build explanation
    const explanation = this.extractExplanation(response);

    const fix: GeneratedFix = {
      error,
      suggestions,
      context,
      explanation,
      modelUsed: selectedModel,
      generationTime
    };

    logger.debug(`[AutoFix] Generated ${suggestions.length} suggestions in ${generationTime}ms using ${selectedModel}`);

    // Cache the result
    this.cache.set(cacheKey, fix);
    this.codeVersions.set(cacheKey, fileContent);

    return fix;
  }

  /**
   * Extract code context around the error
   */
  private extractContext(fileContent: string, errorLine: number, contextLines: number = 10): string {
    const lines = fileContent.split('\n');
    const startLine = Math.max(0, errorLine - contextLines);
    const endLine = Math.min(lines.length, errorLine + contextLines);

    return lines.slice(startLine, endLine).join('\n');
  }

  /**
   * Format error type for display (handles special cases like typescript → TypeScript)
   */
  private formatErrorType(type: string): string {
    const typeMap: Record<string, string> = {
      'typescript': 'TypeScript',
      'eslint': 'ESLint',
      'runtime': 'Runtime'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Build prompt for AI fix generation
   */
  private buildFixPrompt(error: DetectedError, context: string): string {
    const errorTypeCapitalized = this.formatErrorType(error.type);
    let prompt = `You are an expert code fixer. Analyze this ${errorTypeCapitalized} error and suggest fixes.\n\n`;

    prompt += `Error Type: ${errorTypeCapitalized}\n`;
    prompt += `Severity: ${error.severity}\n`;
    prompt += `Message: ${error.message}\n`;
    if (error.code) {
      prompt += `Error Code: ${error.code}\n`;
    }
    prompt += `Location: line ${error.line}, column ${error.column}\n\n`;

    if (error.stackTrace) {
      prompt += `stack trace:\n${error.stackTrace}\n\n`;
    }

    prompt += `Code Context:\n\`\`\`typescript\n${context}\n\`\`\`\n\n`;

    prompt += `Please provide:\n`;
    prompt += `1. Multiple fix suggestions (if applicable)\n`;
    prompt += `2. Fixed code in code blocks\n`;
    prompt += `3. Brief explanation of each fix\n\n`;

    prompt += `Format your response with numbered suggestions and code blocks.`;

    return prompt;
  }

  /**
   * Parse AI response into fix suggestions
   * Updated Oct 20, 2025: Track model used and cost per suggestion
   */
  private parseResponse(
    response: string,
    error: DetectedError,
    modelUsed: string,
    estimatedCost: number
  ): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    // Extract all code blocks
    const codeBlockRegex = /```(?:typescript|javascript|tsx|jsx|ts|js)?\n?([\s\S]*?)```/g;
    const matches = Array.from(response.matchAll(codeBlockRegex));

    if (matches.length === 0) {
      // No code blocks found, but we should still return something
      return [{
        id: `fix-${error.id}-1`,
        title: 'AI Suggestion',
        description: 'AI-generated fix suggestion',
        code: response.trim(),
        startLine: error.line,
        endLine: error.line,
        confidence: 'low',
        modelUsed,
        estimatedCost
      }];
    }

    // Cost per suggestion (divide total by number of suggestions)
    const costPerSuggestion = estimatedCost / matches.length;

    // Parse suggestions from response
    matches.forEach((match, index) => {
      const code = match[1].trim();
      const confidence = this.determineConfidence(index, error);

      // Try to extract title from text before code block
      const beforeCode = response.substring(0, match.index).split('\n').pop() || '';
      const title = this.extractTitle(beforeCode, index + 1);

      suggestions.push({
        id: `fix-${error.id}-${index + 1}`,
        title,
        description: this.extractDescription(response, match.index, code),
        code,
        startLine: error.line,
        endLine: error.line,
        confidence,
        modelUsed,
        estimatedCost: costPerSuggestion
      });
    });

    return suggestions;
  }

  /**
   * Determine confidence level for a suggestion
   */
  private determineConfidence(index: number, error: DetectedError): 'high' | 'medium' | 'low' {
    // First suggestion usually has highest confidence
    if (index === 0) {
      // High confidence for simple/common errors
      if (error.code?.includes('TS2304') || // Cannot find name
          error.code?.includes('TS2345') || // Argument type mismatch
          error.code?.includes('TS2322') || // Type mismatch
          error.code?.includes('semi')) {     // Missing semicolon
        return 'high';
      }

      if (error.type === 'typescript' || error.type === 'eslint') {
        return 'medium';
      }
    }

    // Later suggestions or runtime errors have lower confidence
    return index === 1 ? 'medium' : 'low';
  }

  /**
   * Extract title from text before code block
   */
  private extractTitle(text: string, suggestionNumber: number): string {
    // Look for numbered items or headings
    const numbered = text.match(/\d+\.\s*(.+)/);
    if (numbered) {
      return numbered[1].trim();
    }

    // Look for "Fix:" or "Solution:" prefixes
    const prefixed = text.match(/(?:Fix|Solution|Approach):\s*(.+)/i);
    if (prefixed) {
      return prefixed[1].trim();
    }

    // Default
    return `Fix Suggestion ${suggestionNumber}`;
  }

  /**
   * Extract description from surrounding text
   */
  private extractDescription(response: string, codeBlockStart: number, code: string): string {
    // Get text before code block (last 200 chars)
    const beforeCode = response.substring(Math.max(0, codeBlockStart - 200), codeBlockStart);
    const lines = beforeCode.split('\n').filter(l => l.trim().length > 0);

    if (lines.length > 0) {
      return lines[lines.length - 1].trim();
    }

    return 'Apply this fix to resolve the error';
  }

  /**
   * Extract explanation from AI response
   */
  private extractExplanation(response: string): string {
    // Try to get text before first code block
    const firstCodeBlock = response.indexOf('```');
    if (firstCodeBlock > 0) {
      const explanation = response.substring(0, firstCodeBlock).trim();
      if (explanation.length > 20) {
        return explanation;
      }
    }

    // Try to get text after last code block
    const lastCodeBlock = response.lastIndexOf('```');
    if (lastCodeBlock > 0) {
      const afterLast = response.indexOf('\n', lastCodeBlock + 3);
      if (afterLast > 0) {
        const explanation = response.substring(afterLast).trim();
        if (explanation.length > 20) {
          return explanation;
        }
      }
    }

    // Default explanation
    return 'AI-generated fix based on error analysis';
  }

  /**
   * Generate cache key for error
   */
  private getCacheKey(error: DetectedError): string {
    return `${error.file}:${error.line}:${error.column}:${error.message}`;
  }
}
