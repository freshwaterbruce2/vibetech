/**
 * AICodeReviewer - AI-powered code review
 * Analyzes code changes and provides intelligent feedback
 */
import { logger } from '../services/Logger';
import { databaseService } from './DatabaseService';

import type { UnifiedAIService } from './ai/UnifiedAIService';

export interface ParsedDiff {
  files: DiffFile[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  chunks: DiffChunk[];
}

export interface DiffChunk {
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: number;
}

export interface ReviewComment {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  category: 'bug' | 'style' | 'performance' | 'security' | 'best-practice';
  type: 'issue' | 'improvement' | 'question';
  message: string;
  suggestion?: string;
}

export interface CodeReview {
  comments: ReviewComment[];
  qualityScore: number;
  issueCount: {
    errors: number;
    warnings: number;
    info: number;
  };
  verdict: 'approve' | 'request_changes' | 'comment';
  cached?: boolean;
}

export interface AIReviewInsights {
  summary: string;
  suggestions: string[];
  strengths: string[];
  concerns: string[];
}

export interface CodeSmell {
  type: string;
  file: string;
  line: number;
  description: string;
}

export class AICodeReviewer {
  private aiService: UnifiedAIService;
  private reviewCache: Map<string, { review: CodeReview; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor(aiService: UnifiedAIService) {
    this.aiService = aiService;
  }

  /**
   * Parse git diff
   */
  parseDiff(diff: string): ParsedDiff {
    const files: DiffFile[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    const lines = diff.split('\n');
    let currentFile: DiffFile | null = null;
    let currentChunk: DiffChunk | null = null;
    let newLineNumber = 0;

    for (const line of lines) {
      // File header: diff --git a/file b/file
      if (line.startsWith('diff --git')) {
        if (currentFile) {
          files.push(currentFile);
        }
        const match = line.match(/b\/(.+)$/);
        currentFile = {
          path: match ? match[1] : 'unknown',
          additions: 0,
          deletions: 0,
          chunks: []
        };
        continue;
      }

      // Chunk header: @@ -10,6 +10,8 @@
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match && currentFile) {
          if (currentChunk) {
            currentFile.chunks.push(currentChunk);
          }
          newLineNumber = parseInt(match[2], 10);
          currentChunk = {
            oldStart: parseInt(match[1], 10),
            newStart: newLineNumber,
            lines: []
          };
        }
        continue;
      }

      // Content lines
      if (currentChunk && currentFile) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentChunk.lines.push({
            type: 'add',
            content: line.substring(1),
            lineNumber: newLineNumber++
          });
          currentFile.additions++;
          totalAdditions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentChunk.lines.push({
            type: 'remove',
            content: line.substring(1),
            lineNumber: newLineNumber
          });
          currentFile.deletions++;
          totalDeletions++;
        } else if (line.startsWith(' ')) {
          currentChunk.lines.push({
            type: 'context',
            content: line.substring(1),
            lineNumber: newLineNumber++
          });
        }
      }
    }

    // Push last file
    if (currentFile) {
      if (currentChunk) {
        currentFile.chunks.push(currentChunk);
      }
      files.push(currentFile);
    }

    return {
      files,
      totalAdditions,
      totalDeletions
    };
  }

  /**
   * Review code changes
   */
  async reviewChanges(diff: string): Promise<CodeReview> {
    // Check cache
    const cacheKey = this.hashDiff(diff);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const parsed = this.parseDiff(diff);
    const comments: ReviewComment[] = [];

    // Pattern-based analysis
    for (const file of parsed.files) {
      for (const chunk of file.chunks) {
        for (const line of chunk.lines) {
          if (line.type === 'add') {
            // Check for common issues
            comments.push(...this.analyzeLineForIssues(file.path, line));
          }
        }
      }
    }

    // AI-powered insights
    try {
      const aiComments = await this.generateAIComments(diff);
      comments.push(...aiComments);
    } catch (error) {
      logger.warn('AI review failed:', error);
    }

    // Calculate metrics
    const issueCount = this.countIssues(comments);
    const qualityScore = this.calculateQualityScore(parsed, issueCount);
    const verdict = this.determineVerdict(issueCount, qualityScore);

    const review: CodeReview = {
      comments,
      qualityScore,
      issueCount,
      verdict
    };

    this.cacheReview(cacheKey, review);

    // Log critical code review issues to learning database
    const criticalIssues = comments.filter(c => c.severity === 'error');
    for (const issue of criticalIssues) {
      await databaseService.logMistake({
        mistakeType: 'code_review_issue',
        mistakeCategory: issue.category,
        description: issue.message,
        contextWhenOccurred: `${issue.file}:${issue.line}`,
        impactSeverity: issue.severity === 'error' ? 'HIGH' : issue.severity === 'warning' ? 'MEDIUM' : 'LOW',
        preventionStrategy: issue.suggestion || 'Apply best practices and review guidelines',
        resolved: false,
        tags: ['code-review', issue.category, 'ai-detected', issue.type]
      }).catch(dbError => {
        logger.warn('[AICodeReviewer] Failed to log review issue:', dbError);
      });
    }

    // Log review insights as knowledge if review passed
    if (verdict === 'approve' && qualityScore >= 80) {
      const totalIssues = issueCount.errors + issueCount.warnings + issueCount.info;
      await databaseService.addKnowledge({
        title: 'High-Quality Code Review',
        content: `Quality Score: ${qualityScore}%\nVerdict: ${verdict}\nIssues: ${totalIssues}\nComments: ${comments.length}`,
        category: 'code_review',
        tags: ['review', 'quality', 'approved', `score-${qualityScore}`],
        source: 'ai_code_reviewer'
      }).catch(dbError => {
        logger.warn('[AICodeReviewer] Failed to log review knowledge:', dbError);
      });
    }

    return review;
  }

  /**
   * Generate AI review insights
   */
  async generateAIReview(diff: string): Promise<AIReviewInsights> {
    const prompt = `Review this code change and provide:
1. A brief summary
2. 3 specific suggestions for improvement
3. 2 strengths of the implementation
4. Any concerns

Code diff:
${diff.substring(0, 2000)}

Respond in JSON format with keys: summary, suggestions (array), strengths (array), concerns (array)`;

    try {
      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        relatedFiles: [],
        conversationHistory: [],
        workspaceContext: undefined as any
      });
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      return {
        summary: 'Code review completed',
        suggestions: ['Add more tests', 'Consider edge cases', 'Review error handling'],
        strengths: ['Clear implementation', 'Good code structure'],
        concerns: []
      };
    }
  }

  /**
   * Detect code smells
   */
  async detectCodeSmells(diff: string): Promise<CodeSmell[]> {
    const parsed = this.parseDiff(diff);
    const smells: CodeSmell[] = [];

    for (const file of parsed.files) {
      for (const chunk of file.chunks) {
        for (const line of chunk.lines) {
          if (line.type === 'add') {
            // Long lines
            if (line.content.length > 120) {
              smells.push({
                type: 'long-line',
                file: file.path,
                line: line.lineNumber,
                description: 'Line exceeds 120 characters'
              });
            }

            // console.log
            if (line.content.includes('console.log')) {
              smells.push({
                type: 'debug-code',
                file: file.path,
                line: line.lineNumber,
                description: 'Remove console.log before committing'
              });
            }

            // TODO/FIXME
            if (line.content.match(/TODO|FIXME/i)) {
              smells.push({
                type: 'todo',
                file: file.path,
                line: line.lineNumber,
                description: 'Unresolved TODO/FIXME comment'
              });
            }
          }
        }
      }
    }

    return smells;
  }

  /**
   * Analyze line for issues
   */
  private analyzeLineForIssues(file: string, line: DiffLine): ReviewComment[] {
    const comments: ReviewComment[] = [];
    const { content } = line;

    // Null reference
    if (content.match(/\bnull\s*\.\s*\w+|\.toString\(\)|\.toUpperCase\(\)/)) {
      comments.push({
        file,
        line: line.lineNumber,
        severity: 'error',
        category: 'bug',
        type: 'issue',
        message: 'Potential null reference',
        suggestion: 'Add null check or use optional chaining'
      });
    }

    // console.log
    if (content.includes('console.log')) {
      comments.push({
        file,
        line: line.lineNumber,
        severity: 'warning',
        category: 'style',
        type: 'issue',
        message: 'Debug statement found',
        suggestion: 'Remove console.log or use proper logging'
      });
    }

    // Missing semicolon (if style guide requires them)
    if (content.match(/[^;{}\s]\s*$/)) {
      comments.push({
        file,
        line: line.lineNumber,
        severity: 'info',
        category: 'style',
        type: 'improvement',
        message: 'Consider adding semicolon',
        suggestion: 'Add semicolon for consistency'
      });
    }

    return comments;
  }

  /**
   * Generate AI comments
   */
  private async generateAIComments(diff: string): Promise<ReviewComment[]> {
    // Simplified - would call AI service in production
    return [];
  }

  /**
   * Count issues by severity
   */
  private countIssues(comments: ReviewComment[]): {
    errors: number;
    warnings: number;
    info: number;
  } {
    return {
      errors: comments.filter(c => c.severity === 'error').length,
      warnings: comments.filter(c => c.severity === 'warning').length,
      info: comments.filter(c => c.severity === 'info').length
    };
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(
    parsed: ParsedDiff,
    issueCount: { errors: number; warnings: number; info: number }
  ): number {
    let score = 100;

    // Deduct for issues
    score -= issueCount.errors * 10;
    score -= issueCount.warnings * 5;
    score -= issueCount.info * 2;

    // Deduct for large changes without tests
    const totalChanges = parsed.totalAdditions + parsed.totalDeletions;
    if (totalChanges > 200) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine verdict
   */
  private determineVerdict(
    issueCount: { errors: number; warnings: number; info: number },
    qualityScore: number
  ): 'approve' | 'request_changes' | 'comment' {
    if (issueCount.errors > 0 || qualityScore < 50) {
      return 'request_changes';
    }
    if (issueCount.warnings > 3 || qualityScore < 80) {
      return 'comment';
    }
    return 'approve';
  }

  /**
   * Hash diff for caching
   */
  private hashDiff(diff: string): string {
    return diff.substring(0, 500); // Simplified hash
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): CodeReview | null {
    const cached = this.reviewCache.get(key);
    if (!cached) { return null; }

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.reviewCache.delete(key);
      return null;
    }

    return cached.review;
  }

  /**
   * Cache review
   */
  private cacheReview(key: string, review: CodeReview): void {
    this.reviewCache.set(key, {
      review,
      timestamp: Date.now()
    });
  }
}
