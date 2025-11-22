/**
 * Code Analysis Web Worker - 2025 Pattern
 *
 * Offloads heavy code analysis tasks to a separate thread
 *
 * Features:
 * - Syntax analysis
 * - Code complexity calculation
 * - Find references
 * - Code formatting
 * - Linting
 */

interface AnalysisOptions {
  symbol?: string;
  rules?: string[];
  maxLineLength?: number;
}

interface AnalysisRequest {
  id: string;
  type: 'analyze' | 'format' | 'lint' | 'findReferences' | 'calculateComplexity';
  code: string;
  language: string;
  options?: AnalysisOptions;
}

interface CodeMetrics {
  lines: number;
  characters: number;
  functions: number;
  classes: number;
  imports: number;
  exports: number;
  comments: number;
  complexity: number;
}

interface LintIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

interface Reference {
  line: number;
  column: number;
  text: string;
}

type AnalysisResult = CodeMetrics | string | LintIssue[] | Reference[] | number;

interface AnalysisResponse {
  id: string;
  type: string;
  result: AnalysisResult | null;
  error?: string;
}

// Syntax analysis
function analyzeCode(code: string, language: string): CodeMetrics {
  // Simple analysis - in production, use proper AST parser
  const lines = code.split('\n');
  const metrics = {
    lines: lines.length,
    characters: code.length,
    functions: 0,
    classes: 0,
    imports: 0,
    exports: 0,
    comments: 0,
    complexity: 0,
  };

  // Basic pattern matching for TypeScript/JavaScript
  if (['typescript', 'javascript'].includes(language)) {
    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.match(/^import\s/)) {
        metrics.imports++;
      }
      if (trimmed.match(/^export\s/)) {
        metrics.exports++;
      }
      if (trimmed.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/)) {
        metrics.functions++;
      }
      if (trimmed.match(/class\s+\w+/)) {
        metrics.classes++;
      }
      if (trimmed.match(/^\/\/|^\/\*|\*\//)) {
        metrics.comments++;
      }

      // Simple complexity: count if/else/for/while/switch
      const complexityMatches = trimmed.match(/\b(if|else|for|while|switch|case|catch)\b/g);
      if (complexityMatches) {
        metrics.complexity += complexityMatches.length;
      }
    });
  }

  return metrics;
}

// Code formatting
function formatCode(code: string, language: string): string {
  // Simple formatter - in production, use Prettier API
  if (['typescript', 'javascript'].includes(language)) {
    const lines = code.split('\n');
    let indentLevel = 0;
    const formatted: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push('');
        return;
      }

      // Decrease indent for closing braces
      if (trimmed.match(/^[}\]]/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indent
      formatted.push('  '.repeat(indentLevel) + trimmed);

      // Increase indent for opening braces
      if (trimmed.match(/[{[]$/)) {
        indentLevel++;
      }
    });

    return formatted.join('\n');
  }

  return code;
}

// Simple linting
function lintCode(code: string, language: string): LintIssue[] {
  const issues: LintIssue[] = [];

  if (['typescript', 'javascript'].includes(language)) {
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for console.log
      const consoleMatch = line.match(/console\.(log|error|warn)/);
      if (consoleMatch) {
        issues.push({
          line: index + 1,
          column: consoleMatch.index || 0,
          severity: 'warning',
          message: 'Remove console statement',
          rule: 'no-console',
        });
      }

      // Check for debugger
      if (line.includes('debugger')) {
        issues.push({
          line: index + 1,
          column: line.indexOf('debugger'),
          severity: 'error',
          message: 'Remove debugger statement',
          rule: 'no-debugger',
        });
      }

      // Check for TODO comments
      const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK)/);
      if (todoMatch) {
        issues.push({
          line: index + 1,
          column: todoMatch.index || 0,
          severity: 'info',
          message: `${todoMatch[1]} comment found`,
          rule: 'no-todo',
        });
      }

      // Check line length
      if (line.length > 100) {
        issues.push({
          line: index + 1,
          column: 100,
          severity: 'warning',
          message: 'Line too long (max 100 characters)',
          rule: 'max-line-length',
        });
      }
    });
  }

  return issues;
}

// Find references
function findReferences(code: string, symbol: string): Reference[] {
  const references: Reference[] = [];

  const lines = code.split('\n');
  const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'g');

  lines.forEach((line, index) => {
    let match;
    while ((match = symbolRegex.exec(line)) !== null) {
      references.push({
        line: index + 1,
        column: match.index,
        text: line.trim(),
      });
    }
  });

  return references;
}

// Calculate cyclomatic complexity
function calculateComplexity(code: string): number {
  // McCabe cyclomatic complexity
  let complexity = 1; // Base complexity

  // Count decision points
  const decisionPoints = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?\s*[^:]+:/g, // Ternary operator
    /&&/g,
    /\|\|/g,
    /\?\?/g, // Nullish coalescing
  ];

  decisionPoints.forEach((pattern) => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

// Message handler
self.addEventListener('message', (event: MessageEvent<AnalysisRequest>) => {
  const { id, type, code, language, options } = event.data;

  try {
    let result: AnalysisResult;

    switch (type) {
      case 'analyze':
        result = analyzeCode(code, language);
        break;

      case 'format':
        result = formatCode(code, language);
        break;

      case 'lint':
        result = lintCode(code, language);
        break;

      case 'findReferences':
        result = findReferences(code, options?.symbol || '');
        break;

      case 'calculateComplexity':
        result = calculateComplexity(code);
        break;

      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    const response: AnalysisResponse = {
      id,
      type,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: AnalysisResponse = {
      id,
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
});

// Export for TypeScript
export {};
