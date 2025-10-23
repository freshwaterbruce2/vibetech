/**
 * Code Quality Analyzer Service
 *
 * Analyzes code quality metrics:
 * - Cyclomatic complexity
 * - Lines of code
 * - Code smells
 * - Documentation coverage
 * - Maintainability index
 */
import { logger } from '../services/Logger';

import { FileSystemService } from './FileSystemService';

export interface QualityIssue {
  type: 'code-smell' | 'complexity' | 'documentation' | 'style';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface FileQuality {
  filePath: string;
  language: string;
  linesOfCode: number;
  commentLines: number;
  complexity: number;
  quality: number; // 0-100 score
  maintainability: 'low' | 'medium' | 'high';
  issues: QualityIssue[];
}

export interface QualityReport {
  totalFiles: number;
  totalLinesOfCode: number;
  averageQuality: number;
  averageComplexity: number;
  filesWithIssues: number;
  fileReports: FileQuality[];
}

export class CodeQualityAnalyzer {
  private fileSystemService: FileSystemService;

  constructor(fileSystemService: FileSystemService) {
    this.fileSystemService = fileSystemService;
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string, code: string): Promise<FileQuality> {
    const language = this.detectLanguage(filePath);
    const lines = code.split('\n');

    // Calculate metrics
    const linesOfCode = this.countCodeLines(lines);
    const commentLines = this.countCommentLines(lines);
    const complexity = this.calculateComplexity(code, language);
    const issues = this.detectIssues(code, language, filePath);

    // Calculate quality score (0-100)
    const quality = this.calculateQualityScore(complexity, issues, linesOfCode, commentLines);
    const maintainability = this.getMaintainabilityRating(quality);

    return {
      filePath,
      language,
      linesOfCode,
      commentLines,
      complexity,
      quality,
      maintainability,
      issues,
    };
  }

  /**
   * Analyze entire project
   */
  async analyzeProject(rootPath: string): Promise<QualityReport> {
    // Get all files from the FileSystemService's in-memory map
    const tree = await this.fileSystemService.getDirectoryStructure(rootPath);
    const files = this.flattenFileTree(tree);

    // Filter code files only
    const codeFiles = files.filter(f => this.isCodeFile(f));

    const fileReports: FileQuality[] = [];

    for (const filePath of codeFiles) {
      try {
        const content = await this.fileSystemService.readFile(filePath);
        const report = await this.analyzeFile(filePath, content);
        fileReports.push(report);
      } catch (error) {
        logger.warn(`Failed to analyze ${filePath}:`, error);
      }
    }

    // Calculate project metrics
    const totalFiles = fileReports.length;
    const totalLinesOfCode = fileReports.reduce((sum, r) => sum + r.linesOfCode, 0);
    const averageQuality = totalFiles > 0
      ? fileReports.reduce((sum, r) => sum + r.quality, 0) / totalFiles
      : 0;
    const averageComplexity = totalFiles > 0
      ? fileReports.reduce((sum, r) => sum + r.complexity, 0) / totalFiles
      : 0;
    const filesWithIssues = fileReports.filter(r => r.issues.length > 0).length;

    return {
      totalFiles,
      totalLinesOfCode,
      averageQuality,
      averageComplexity,
      filesWithIssues,
      fileReports,
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateComplexity(code: string, language: string): number {
    let complexity = 1; // Base complexity

    // Count decision points (if, else, for, while, case, catch, &&, ||)
    const decisionPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    for (const pattern of decisionPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Detect code issues
   */
  private detectIssues(code: string, language: string, filePath: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for var usage (JavaScript/TypeScript)
    if (language === 'javascript' || language === 'typescript') {
      const varMatches = code.match(/\bvar\s+/g);
      if (varMatches && varMatches.length > 0) {
        issues.push({
          type: 'code-smell',
          severity: 'warning',
          message: `Found ${varMatches.length} usage(s) of 'var'. Use 'const' or 'let' instead.`,
          suggestion: 'Replace var with const for constants or let for variables',
        });
      }

      // Check for eval() usage
      const evalMatches = code.match(/eval\s*\(/g);
      if (evalMatches && evalMatches.length > 0) {
        issues.push({
          type: 'code-smell',
          severity: 'error',
          message: `eval() usage detected ${evalMatches.length} time(s). This is a security risk and performance issue.`,
          suggestion: 'Refactor to avoid eval()',
        });
      }

      // Check for deeply nested loops
      const nestedLoopPattern = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g;
      if (nestedLoopPattern.test(code)) {
        issues.push({
          type: 'complexity',
          severity: 'warning',
          message: 'Deeply nested loops detected',
          suggestion: 'Consider refactoring into separate functions',
        });
      }
    }

    // Check for missing documentation
    const functions = code.match(/function\s+\w+\s*\(/g) || [];
    const docComments = code.match(/\/\*\*[\s\S]*?\*\//g) || [];

    if (functions.length > 0 && docComments.length === 0) {
      issues.push({
        type: 'documentation',
        severity: 'warning',
        message: 'No documentation comments found',
        suggestion: 'Add JSDoc comments to functions',
      });
    }

    // Check for very long functions
    const functionBodies = code.match(/function\s+\w+[^{]*{[\s\S]*?}(?=\s*(?:function|$))/g) || [];
    for (const body of functionBodies) {
      const lines = body.split('\n').length;
      if (lines > 50) {
        issues.push({
          type: 'code-smell',
          severity: 'warning',
          message: `Function is too long (${lines} lines)`,
          suggestion: 'Break down into smaller functions (recommended: < 50 lines)',
        });
      }
    }

    return issues;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    complexity: number,
    issues: QualityIssue[],
    linesOfCode: number,
    commentLines: number
  ): number {
    let score = 100;

    // Penalize based on complexity
    if (complexity > 20) score -= 30;
    else if (complexity > 10) score -= 20;
    else if (complexity > 5) score -= 10;

    // Penalize based on issues
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    score -= errorCount * 20; // Errors are severe
    score -= warningCount * 5;

    // Reward documentation
    if (linesOfCode > 0) {
      const docRatio = commentLines / (linesOfCode + commentLines);
      if (docRatio > 0.2) score += 10; // Good documentation
      else if (docRatio < 0.05 && linesOfCode > 10) score -= 10; // Poor documentation
    } else {
      // Empty files get neutral score
      score = 75;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count actual code lines (exclude comments and blank lines)
   */
  private countCodeLines(lines: string[]): number {
    let count = 0;
    let inMultiLineComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed.length === 0) continue;

      // Handle multi-line comments
      if (trimmed.startsWith('/*')) {
        inMultiLineComment = true;
      }
      if (trimmed.endsWith('*/')) {
        inMultiLineComment = false;
        continue;
      }
      if (inMultiLineComment) continue;

      // Skip single-line comments
      if (trimmed.startsWith('//')) continue;

      count++;
    }

    return count;
  }

  /**
   * Count comment lines
   */
  private countCommentLines(lines: string[]): number {
    let count = 0;
    let inMultiLineComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed.length === 0) continue;

      if (trimmed.startsWith('/*')) {
        inMultiLineComment = true;
        count++;
        if (trimmed.endsWith('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }

      if (inMultiLineComment) {
        count++;
        if (trimmed.endsWith('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('//')) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get complexity rating
   */
  getComplexityRating(complexity: number): string {
    if (complexity <= 5) return 'simple';
    if (complexity <= 10) return 'moderate';
    if (complexity <= 20) return 'complex';
    return 'very-complex';
  }

  /**
   * Get maintainability rating
   */
  getMaintainabilityRating(qualityScore: number): 'low' | 'medium' | 'high' {
    if (qualityScore >= 70) return 'high';
    if (qualityScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'json': 'json',
    };
    return langMap[ext || ''] || 'unknown';
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'];
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  /**
   * Flatten file tree to array of file paths
   */
  private flattenFileTree(tree: any): string[] {
    const files: string[] = [];

    const traverse = (node: any) => {
      if (node.type === 'file') {
        files.push(node.path);
      } else if (node.type === 'directory' && node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(tree);
    return files;
  }
}
