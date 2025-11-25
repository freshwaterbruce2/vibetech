/**
 * Review Engine
 *
 * Performs multi-perspective code reviews with pluggable review strategies
 * Part of the modular MultiTaskOrchestrator system
 */

import { AgentTask } from '@nova/types';
import { EditOperation, ReviewResult, Amendment } from '../plugin-system/types';
import { pluginRegistry } from '../plugin-system/PluginRegistry';
import { logger } from '../../Logger';

export interface ReviewPerspective {
  name: string;
  weight: number;
  minScore: number;
  enabled: boolean;
}

export interface ReviewConfig {
  perspectives: ReviewPerspective[];
  parallelReviews: boolean;
  aggregationStrategy: 'average' | 'weighted' | 'minimum' | 'consensus';
  failureThreshold: number;
}

export class ReviewEngine {
  private defaultPerspectives: ReviewPerspective[] = [
    { name: 'functionality', weight: 0.25, minScore: 0.7, enabled: true },
    { name: 'performance', weight: 0.20, minScore: 0.6, enabled: true },
    { name: 'security', weight: 0.20, minScore: 0.8, enabled: true },
    { name: 'maintainability', weight: 0.15, minScore: 0.6, enabled: true },
    { name: 'testing', weight: 0.10, minScore: 0.5, enabled: true },
    { name: 'documentation', weight: 0.05, minScore: 0.5, enabled: true },
    { name: 'best-practices', weight: 0.05, minScore: 0.6, enabled: true },
  ];

  private config: ReviewConfig;

  constructor(config?: Partial<ReviewConfig>) {
    this.config = {
      perspectives: config?.perspectives || this.defaultPerspectives,
      parallelReviews: config?.parallelReviews ?? true,
      aggregationStrategy: config?.aggregationStrategy || 'weighted',
      failureThreshold: config?.failureThreshold || 0.5,
    };
  }

  /**
   * Perform multi-perspective review
   */
  async performMultiReview(
    tasks: AgentTask[],
    edits: EditOperation[]
  ): Promise<ReviewResult[]> {
    const reviews: ReviewResult[] = [];

    // Check for review plugins first
    const reviewPlugins = pluginRegistry.getReviewPlugins();

    if (reviewPlugins.length > 0) {
      // Use plugin-based reviews
      logger.debug(`[ReviewEngine] Using ${reviewPlugins.length} review plugins`);

      for (const plugin of reviewPlugins) {
        for (const task of tasks) {
          const review = await plugin.performReview(task, edits);
          reviews.push(review);
        }
      }
    }

    // Always add built-in perspective reviews
    const enabledPerspectives = this.config.perspectives.filter(p => p.enabled);

    if (this.config.parallelReviews) {
      // Parallel review execution
      const reviewPromises: Promise<ReviewResult>[] = [];

      for (const task of tasks) {
        for (const perspective of enabledPerspectives) {
          reviewPromises.push(
            this.reviewFromPerspective(task, edits, perspective)
          );
        }
      }

      const perspectiveReviews = await Promise.all(reviewPromises);
      reviews.push(...perspectiveReviews);
    } else {
      // Sequential review execution
      for (const task of tasks) {
        for (const perspective of enabledPerspectives) {
          const review = await this.reviewFromPerspective(task, edits, perspective);
          reviews.push(review);
        }
      }
    }

    return reviews;
  }

  /**
   * Review from a specific perspective
   */
  private async reviewFromPerspective(
    task: AgentTask,
    edits: EditOperation[],
    perspective: ReviewPerspective
  ): Promise<ReviewResult> {
    const score = await this.calculatePerspectiveScore(
      task,
      edits,
      perspective.name
    );

    const review: ReviewResult = {
      perspective: perspective.name,
      taskId: task.id,
      score,
      feedback: this.generateFeedback(perspective.name, score, perspective.minScore),
      requiredAmendments: [],
    };

    // Generate amendments if score is below threshold
    if (score < perspective.minScore) {
      review.requiredAmendments = await this.suggestAmendments(
        perspective.name,
        task,
        score,
        edits
      );
    }

    return review;
  }

  /**
   * Calculate score for a specific perspective
   */
  private async calculatePerspectiveScore(
    task: AgentTask,
    edits: EditOperation[],
    perspective: string
  ): Promise<number> {
    // Base implementation - can be enhanced with AI analysis
    switch (perspective) {
      case 'functionality':
        return this.reviewFunctionality(task, edits);
      case 'performance':
        return this.reviewPerformance(task, edits);
      case 'security':
        return this.reviewSecurity(task, edits);
      case 'maintainability':
        return this.reviewMaintainability(task, edits);
      case 'testing':
        return this.reviewTesting(task, edits);
      case 'documentation':
        return this.reviewDocumentation(task, edits);
      case 'best-practices':
        return this.reviewBestPractices(task, edits);
      default:
        return 0.5; // Default neutral score
    }
  }

  /**
   * Generate feedback based on review results
   */
  private generateFeedback(
    perspective: string,
    score: number,
    minScore: number
  ): string[] {
    const feedback: string[] = [];

    if (score >= minScore) {
      feedback.push(`✅ ${perspective} review passed (${Math.round(score * 100)}%)`);
    } else {
      feedback.push(`⚠️ ${perspective} review needs improvement (${Math.round(score * 100)}% < ${Math.round(minScore * 100)}% required)`);
    }

    // Add specific feedback based on perspective
    if (perspective === 'security' && score < minScore) {
      feedback.push('Consider adding input validation and sanitization');
    }
    if (perspective === 'performance' && score < minScore) {
      feedback.push('Look for optimization opportunities in loops and data structures');
    }
    if (perspective === 'testing' && score < minScore) {
      feedback.push('Add unit tests for new functionality');
    }

    return feedback;
  }

  /**
   * Suggest amendments based on review
   */
  private async suggestAmendments(
    perspective: string,
    task: AgentTask,
    score: number,
    edits: EditOperation[]
  ): Promise<Amendment[]> {
    const amendments: Amendment[] = [];

    if (score < 0.5) {
      amendments.push({
        id: `amend-${Date.now()}-${perspective}`,
        type: perspective === 'documentation' ? 'documentation' :
              perspective === 'testing' ? 'enhancement' :
              'fix',
        description: `Improve ${perspective} issues found in review`,
        changes: this.generateAmendmentChanges(perspective, edits),
        atomic: true,
        dependencies: []
      });
    }

    return amendments;
  }

  /**
   * Generate specific changes for amendments
   */
  private generateAmendmentChanges(
    perspective: string,
    edits: EditOperation[]
  ): EditOperation[] {
    // Create fix operations based on perspective
    // This would be enhanced with actual fix generation logic
    return edits.map(edit => ({
      ...edit,
      fileId: `amend-${edit.fileId}`,
      operations: edit.operations.map(op => ({
        ...op,
        content: op.content ? `/* ${perspective} fix */\n${op.content}` : op.content
      }))
    }));
  }

  /**
   * Aggregate review scores
   */
  aggregateScores(reviews: ReviewResult[]): number {
    if (reviews.length === 0) return 0;

    switch (this.config.aggregationStrategy) {
      case 'average':
        return reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

      case 'weighted':
        let weightedSum = 0;
        let totalWeight = 0;
        for (const review of reviews) {
          const perspective = this.config.perspectives.find(
            p => p.name === review.perspective
          );
          const weight = perspective?.weight || 1;
          weightedSum += review.score * weight;
          totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;

      case 'minimum':
        return Math.min(...reviews.map(r => r.score));

      case 'consensus':
        // Consensus requires majority above threshold
        const aboveThreshold = reviews.filter(
          r => r.score >= this.config.failureThreshold
        ).length;
        return aboveThreshold / reviews.length;

      default:
        return 0;
    }
  }

  // Review implementation methods (simplified for modular structure)
  private reviewFunctionality(task: AgentTask, _edits: EditOperation[]): number {
    // Check if task steps completed successfully
    const completedSteps = task.steps.filter(s => s.status === 'completed').length;
    return task.steps.length > 0 ? completedSteps / task.steps.length : 0.5;
  }

  private reviewPerformance(_task: AgentTask, edits: EditOperation[]): number {
    // Simple heuristic based on edit count
    return Math.max(0.9 - (edits.length * 0.02), 0.3);
  }

  private reviewSecurity(_task: AgentTask, edits: EditOperation[]): number {
    // Check for potentially unsafe operations
    const unsafeOps = edits.filter(e =>
      e.operations.some(op => op.type === 'delete')
    ).length;
    return Math.max(0.8 - (unsafeOps * 0.1), 0.3);
  }

  private reviewMaintainability(_task: AgentTask, edits: EditOperation[]): number {
    // Based on file organization
    const uniqueFiles = new Set(edits.map(e => e.filePath)).size;
    return uniqueFiles <= 5 ? 0.9 : Math.max(0.9 - ((uniqueFiles - 5) * 0.05), 0.5);
  }

  private reviewTesting(task: AgentTask, _edits: EditOperation[]): number {
    // Check if tests were included
    const hasTests = task.steps.some(s =>
      s.action.type === 'run_tests' || s.title.toLowerCase().includes('test')
    );
    return hasTests ? 0.8 : 0.4;
  }

  private reviewDocumentation(task: AgentTask, _edits: EditOperation[]): number {
    // Check for documentation steps
    const hasDocs = task.steps.some(s =>
      s.title.toLowerCase().includes('doc') ||
      s.description.toLowerCase().includes('document')
    );
    return hasDocs ? 0.7 : 0.5;
  }

  private reviewBestPractices(_task: AgentTask, _edits: EditOperation[]): number {
    // Baseline score - would be enhanced with actual analysis
    return 0.75;
  }
}