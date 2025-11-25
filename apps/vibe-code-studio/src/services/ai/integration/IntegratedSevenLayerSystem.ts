/**
 * Integrated 7-Layer System
 *
 * Main coordinator for the 7-layer processing system with monorepo and learning integration
 * Uses modular components for specific functionality
 *
 * Maximum 360 lines - delegates to specialized modules
 */

import { AgentTask } from '@nova/types';
import { MonorepoOptimizer } from './MonorepoOptimizer';
import { LearningDatabaseIntegration } from './LearningDatabaseIntegration';
import { LayerExecutor, LayerConfig, LayerExecutionResult } from './LayerExecutor';
import { pluginRegistry } from '../plugin-system/PluginRegistry';
import { logger } from '../../Logger';

export interface IntegratedLayer extends LayerConfig {
  monorepoOptimization?: boolean;
  learningIntegration?: boolean;
}

export interface IntegratedResult {
  originalTask: AgentTask;
  layerResults: LayerExecutionResult[];
  multiTaskQueue: AgentTask[];
  editOperations: any[];
  reviews: any[];
  amendments: any[];
  successProbability: number;
  executionTime: number;
  monorepoContext: EnrichedMonorepoContext;
  learningUpdates: LearningUpdate[];
}

export interface EnrichedMonorepoContext {
  monorepoRoot: string;
  activeProjects: string[];
  dependencies: Map<string, string[]>;
  learningInsights: any[];
  historicalPatterns: any[];
}

export interface LearningUpdate {
  type: string;
  content: string;
  timestamp: number;
}

export class IntegratedSevenLayerSystem {
  private readonly layers: IntegratedLayer[] = [
    {
      id: 1,
      name: 'Context & Repository Analysis',
      purpose: 'Understand monorepo structure, dependencies, and learning history',
      multiTaskCapability: true,
      multiEditCapability: false,
      reviewPerspectives: ['completeness', 'relevance', 'history'],
      atomicOperations: ['scan_monorepo', 'query_learning_db', 'analyze_dependencies'],
      monorepoOptimization: true,
      learningIntegration: true
    },
    {
      id: 2,
      name: 'Multi-Task Problem Decomposition',
      purpose: 'Break down into parallel tasks with dependency analysis',
      multiTaskCapability: true,
      multiEditCapability: true,
      reviewPerspectives: ['dependencies', 'parallelism', 'complexity'],
      atomicOperations: ['identify_tasks', 'map_dependencies', 'allocate_resources'],
      monorepoOptimization: true,
      learningIntegration: false
    },
    {
      id: 3,
      name: 'Resource & Tool Orchestration',
      purpose: 'Coordinate tools across monorepo with learning from past usage',
      multiTaskCapability: true,
      multiEditCapability: true,
      reviewPerspectives: ['availability', 'efficiency', 'compatibility'],
      atomicOperations: ['allocate_tools', 'setup_environment', 'prepare_workspace'],
      monorepoOptimization: false,
      learningIntegration: true
    },
    {
      id: 4,
      name: 'Multi-Edit Strategy Formation',
      purpose: 'Plan coordinated edits across multiple files and projects',
      multiTaskCapability: true,
      multiEditCapability: true,
      reviewPerspectives: ['consistency', 'impact', 'reversibility'],
      atomicOperations: ['plan_edits', 'validate_changes', 'prepare_rollback'],
      monorepoOptimization: true,
      learningIntegration: true
    },
    {
      id: 5,
      name: 'Atomic Implementation Execution',
      purpose: 'Execute changes atomically with transaction support',
      multiTaskCapability: true,
      multiEditCapability: true,
      reviewPerspectives: ['atomicity', 'integrity', 'performance'],
      atomicOperations: ['begin_transaction', 'apply_changes', 'verify_integrity', 'commit_or_rollback'],
      monorepoOptimization: false,
      learningIntegration: false
    },
    {
      id: 6,
      name: 'Multi-Review Optimization',
      purpose: 'Review from multiple perspectives with learning feedback',
      multiTaskCapability: true,
      multiEditCapability: false,
      reviewPerspectives: ['functionality', 'performance', 'security', 'maintainability', 'monorepo-compatibility'],
      atomicOperations: ['run_reviews', 'aggregate_feedback', 'prioritize_issues'],
      monorepoOptimization: true,
      learningIntegration: true
    },
    {
      id: 7,
      name: 'Validation, Amendment & Learning',
      purpose: 'Validate results, apply amendments, update learning system',
      multiTaskCapability: true,
      multiEditCapability: true,
      reviewPerspectives: ['completeness', 'correctness', 'learning-value'],
      atomicOperations: ['validate_all', 'generate_amendments', 'apply_amendments', 'update_learning_db'],
      monorepoOptimization: false,
      learningIntegration: true
    }
  ];

  private readonly monorepoOptimizer: MonorepoOptimizer;
  private readonly learningDb: LearningDatabaseIntegration;
  private readonly layerExecutor: LayerExecutor;

  constructor(
    fileSystemService?: any,
    config?: {
      monorepoRoot?: string;
      enableLearning?: boolean;
      enableMonorepoOptimization?: boolean;
    }
  ) {
    // Initialize modules
    this.monorepoOptimizer = new MonorepoOptimizer({
      root: config?.monorepoRoot || 'C:\\dev'
    });

    this.learningDb = new LearningDatabaseIntegration();
    this.layerExecutor = new LayerExecutor();

    // Connect to learning database if enabled
    if (config?.enableLearning ?? true) {
      this.learningDb.connect().catch(error => {
        logger.error('[IntegratedSystem] Failed to connect learning DB:', error);
      });
    }

    // Scan monorepo if enabled and fileSystemService provided
    if ((config?.enableMonorepoOptimization ?? true) && fileSystemService) {
      this.monorepoOptimizer.scanMonorepo(fileSystemService).catch(error => {
        logger.error('[IntegratedSystem] Failed to scan monorepo:', error);
      });
    }

    logger.info('[IntegratedSystem] Initialized with 7 layers');
  }

  /**
   * Process a task through the integrated 7-layer system
   */
  async processWithMaxProbability(
    task: AgentTask,
    context?: any
  ): Promise<IntegratedResult> {
    const startTime = Date.now();
    const results: LayerExecutionResult[] = [];
    const multiTaskQueue: AgentTask[] = [task];
    const editOperations: any[] = [];
    const reviews: any[] = [];
    const amendments: any[] = [];

    logger.info(`[IntegratedSystem] Processing task: ${task.title}`);

    // Pre-process: Enrich with monorepo and learning context
    const enrichedContext = await this.enrichContext(task, context);

    // Notify system start
    await pluginRegistry.executeCapability('onSystemStart', task, enrichedContext);

    // Process through each layer
    for (const layer of this.layers) {
      logger.debug(`[IntegratedSystem] Layer ${layer.id}: ${layer.name} - Starting`);

      // Execute layer with all integrated capabilities
      const layerResult = await this.layerExecutor.executeLayer(
        layer,
        multiTaskQueue,
        enrichedContext,
        results
      );

      results.push(layerResult);

      // Handle multi-task generation
      if (layer.multiTaskCapability && layerResult.generatedTasks) {
        multiTaskQueue.push(...layerResult.generatedTasks);
        logger.debug(`[IntegratedSystem] Layer ${layer.id} generated ${layerResult.generatedTasks.length} tasks`);
      }

      // Handle multi-edit operations
      if (layer.multiEditCapability && layerResult.editOperations) {
        editOperations.push(...layerResult.editOperations);
      }

      // Collect reviews
      if (layerResult.reviews) {
        reviews.push(...layerResult.reviews);
      }

      // Collect amendments
      if (layerResult.amendments) {
        amendments.push(...layerResult.amendments);
      }

      // Update learning system after each layer
      if (layer.learningIntegration) {
        await this.updateLearningSystem(layer, layerResult, task);
      }
    }

    // Calculate success probability
    const successProbability = await this.calculateSuccessProbability(
      results,
      editOperations,
      reviews,
      amendments
    );

    const executionTime = Date.now() - startTime;

    logger.info(`[IntegratedSystem] Completed in ${executionTime}ms with ${Math.round(successProbability * 100)}% success probability`);

    // Notify system complete
    await pluginRegistry.executeCapability('onSystemComplete', task, results);

    return {
      originalTask: task,
      layerResults: results,
      multiTaskQueue,
      editOperations,
      reviews,
      amendments,
      successProbability,
      executionTime,
      monorepoContext: enrichedContext,
      learningUpdates: this.extractLearningUpdates(results)
    };
  }

  /**
   * Enrich context with monorepo and learning information
   */
  private async enrichContext(
    task: AgentTask,
    context?: any
  ): Promise<EnrichedMonorepoContext> {
    const enriched: EnrichedMonorepoContext = {
      monorepoRoot: 'C:\\dev',
      activeProjects: [],
      dependencies: new Map(),
      learningInsights: [],
      historicalPatterns: [],
      ...context
    };

    // Get monorepo information
    const monorepoStats = this.monorepoOptimizer.getStats();
    enriched.activeProjects = Array.from({ length: monorepoStats.totalProjects }, (_, i) => `project-${i + 1}`);

    // Query learning database
    const insights = await this.learningDb.queryLearningDatabase({
      task,
      maxResults: 5
    });
    enriched.learningInsights = insights;

    logger.debug(`[IntegratedSystem] Context enriched with ${insights.length} learning insights`);

    return enriched;
  }

  /**
   * Update learning system with layer results
   */
  private async updateLearningSystem(
    layer: IntegratedLayer,
    result: LayerExecutionResult,
    task: AgentTask
  ): Promise<void> {
    if (!result.success) {
      // Record failure
      await this.learningDb.recordMistake(
        task,
        result.error || new Error('Layer execution failed'),
        { layerId: layer.id, layerName: layer.name }
      );
    } else if (result.insights.length > 0) {
      // Store successful pattern
      await this.learningDb.storeSuccessfulPattern(
        task,
        { insights: result.insights },
        { layerId: layer.id, layerName: layer.name }
      );
    }
  }

  /**
   * Calculate success probability
   */
  private async calculateSuccessProbability(
    results: LayerExecutionResult[],
    edits: any[],
    reviews: any[],
    amendments: any[]
  ): Promise<number> {
    let probability = 1.0;

    // Factor in layer success rate
    const successfulLayers = results.filter(r => r.success).length;
    probability *= (successfulLayers / results.length);

    // Factor in edit success rate (assume 90% if edits exist)
    if (edits.length > 0) {
      probability *= 0.9;
    }

    // Factor in review scores
    if (reviews.length > 0) {
      const avgScore = reviews.reduce((sum, r) => sum + (r.score || 0.5), 0) / reviews.length;
      probability *= avgScore;
    }

    // Factor in amendments (reduce probability if many amendments needed)
    if (amendments.length > 0) {
      probability *= Math.max(0.7, 1 - (amendments.length * 0.05));
    }

    // Learning boost
    const learningStats = await this.learningDb.getStats();
    if (learningStats.totalPatterns > 0) {
      probability *= 1.1;
    }

    return Math.min(probability, 1.0);
  }

  /**
   * Extract learning updates from results
   */
  private extractLearningUpdates(results: LayerExecutionResult[]): LearningUpdate[] {
    return results.flatMap(r =>
      r.insights.map(insight => ({
        type: 'insight',
        content: insight,
        timestamp: Date.now()
      }))
    );
  }

  /**
   * Get system statistics
   */
  async getStats(): Promise<{
    layerCount: number;
    monorepoStats: any;
    learningStats: any;
    executorHistory: number;
  }> {
    return {
      layerCount: this.layers.length,
      monorepoStats: this.monorepoOptimizer.getStats(),
      learningStats: await this.learningDb.getStats(),
      executorHistory: this.layerExecutor.getHistory().length
    };
  }
}
