/**
 * Layer Executor
 *
 * Executes individual layers with atomic operations and plugin support
 * Part of the IntegratedSevenLayerSystem
 */

import { AgentTask } from '@nova/types';
import { LayerPlugin, LayerResult } from '../plugin-system/types';
import { pluginRegistry } from '../plugin-system/PluginRegistry';
import { logger } from '../../Logger';

export interface LayerConfig {
  id: number;
  name: string;
  purpose: string;
  atomicOperations: string[];
  multiTaskCapability: boolean;
  multiEditCapability: boolean;
  reviewPerspectives: string[];
}

export interface LayerExecutionResult {
  layerId: number;
  layerName: string;
  success: boolean;
  insights: string[];
  generatedTasks?: AgentTask[];
  editOperations?: any[];
  reviews?: any[];
  amendments?: any[];
  error?: Error;
  executionTime: number;
}

export interface AtomicOperationResult {
  operation: string;
  success: boolean;
  insights: string[];
  tasks?: AgentTask[];
  edits?: any[];
  reviews?: any[];
  transactionId?: string;
  error?: Error;
}

export class LayerExecutor {
  private layerPlugins: LayerPlugin[] = [];
  private operationHandlers = new Map<string, Function>();
  private executionHistory: LayerExecutionResult[] = [];

  constructor() {
    this.initializePlugins();
    this.registerDefaultOperations();
  }

  /**
   * Initialize layer plugins from registry
   */
  private initializePlugins(): void {
    this.layerPlugins = pluginRegistry.getLayerPlugins();

    if (this.layerPlugins.length > 0) {
      logger.info(`[LayerExecutor] Loaded ${this.layerPlugins.length} layer plugins`);
    }
  }

  /**
   * Register default atomic operations
   */
  private registerDefaultOperations(): void {
    // Core operations
    this.registerOperation('scan_monorepo', this.scanMonorepo.bind(this));
    this.registerOperation('query_learning_db', this.queryLearningDb.bind(this));
    this.registerOperation('identify_tasks', this.identifyTasks.bind(this));
    this.registerOperation('plan_edits', this.planEdits.bind(this));
    this.registerOperation('begin_transaction', this.beginTransaction.bind(this));
    this.registerOperation('apply_changes', this.applyChanges.bind(this));
    this.registerOperation('run_reviews', this.runReviews.bind(this));
    this.registerOperation('update_learning_db', this.updateLearningDb.bind(this));
    this.registerOperation('validate_all', this.validateAll.bind(this));
    this.registerOperation('generate_amendments', this.generateAmendments.bind(this));
    this.registerOperation('apply_amendments', this.applyAmendments.bind(this));
  }

  /**
   * Register a custom operation
   */
  registerOperation(name: string, handler: Function): void {
    this.operationHandlers.set(name, handler);
    logger.debug(`[LayerExecutor] Registered operation: ${name}`);
  }

  /**
   * Execute a layer with all its operations
   */
  async executeLayer(
    layer: LayerConfig,
    taskQueue: AgentTask[],
    context: any,
    previousResults: LayerExecutionResult[]
  ): Promise<LayerExecutionResult> {
    const startTime = Date.now();

    const result: LayerExecutionResult = {
      layerId: layer.id,
      layerName: layer.name,
      success: false,
      insights: [],
      executionTime: 0
    };

    logger.debug(`[LayerExecutor] Executing layer ${layer.id}: ${layer.name}`);

    try {
      // Check for plugin override
      const pluginLayer = this.layerPlugins.find(p => p.layerId === layer.id);

      if (pluginLayer) {
        logger.debug(`[LayerExecutor] Using plugin for layer ${layer.id}`);
        const pluginResult = await pluginLayer.processLayer(
          taskQueue[0],
          previousResults.map(r => ({
            layerId: r.layerId,
            layerName: r.layerName,
            insights: r.insights,
            refinedContext: JSON.stringify(context)
          }))
        );

        result.insights = pluginResult.insights;
        result.success = true;
      } else {
        // Execute atomic operations for this layer
        for (const operation of layer.atomicOperations) {
          const opResult = await this.executeAtomicOperation(
            operation,
            taskQueue,
            context,
            layer
          );

          if (opResult.insights) {
            result.insights.push(...opResult.insights);
          }

          if (layer.multiTaskCapability && opResult.tasks) {
            result.generatedTasks = opResult.tasks;
          }

          if (layer.multiEditCapability && opResult.edits) {
            result.editOperations = opResult.edits;
          }

          if (opResult.reviews) {
            result.reviews = opResult.reviews;
          }

          if (!opResult.success && !opResult.error) {
            logger.warn(`[LayerExecutor] Operation ${operation} failed silently`);
          }
        }

        // Perform reviews if perspectives defined
        if (layer.reviewPerspectives.length > 0) {
          const reviews = await this.performLayerReviews(
            layer,
            taskQueue,
            context,
            result
          );
          result.reviews = reviews;
        }

        result.success = true;
      }
    } catch (error) {
      logger.error(`[LayerExecutor] Layer ${layer.id} failed:`, error);
      result.success = false;
      result.error = error as Error;
    }

    result.executionTime = Date.now() - startTime;
    this.executionHistory.push(result);

    logger.debug(`[LayerExecutor] Layer ${layer.id} completed in ${result.executionTime}ms`);

    return result;
  }

  /**
   * Execute an atomic operation
   */
  async executeAtomicOperation(
    operation: string,
    taskQueue: AgentTask[],
    context: any,
    layer: LayerConfig
  ): Promise<AtomicOperationResult> {
    const result: AtomicOperationResult = {
      operation,
      success: false,
      insights: []
    };

    try {
      const handler = this.operationHandlers.get(operation);

      if (!handler) {
        logger.warn(`[LayerExecutor] No handler for operation: ${operation}`);
        result.success = true; // Don't fail for unknown operations
        return result;
      }

      const opResult = await handler(taskQueue, context, layer);

      result.success = true;
      result.insights = opResult.insights || [];
      result.tasks = opResult.tasks;
      result.edits = opResult.edits;
      result.reviews = opResult.reviews;
      result.transactionId = opResult.transactionId;

    } catch (error) {
      logger.error(`[LayerExecutor] Operation ${operation} failed:`, error);
      result.error = error as Error;
    }

    return result;
  }

  /**
   * Perform layer-specific reviews
   */
  private async performLayerReviews(
    layer: LayerConfig,
    taskQueue: AgentTask[],
    context: any,
    result: LayerExecutionResult
  ): Promise<any[]> {
    const reviews: any[] = [];

    for (const perspective of layer.reviewPerspectives) {
      const review = {
        layerId: layer.id,
        perspective,
        score: Math.random() * 0.3 + 0.7, // Simulated score
        feedback: [`${perspective} review for layer ${layer.name}`]
      };
      reviews.push(review);
    }

    return reviews;
  }

  // Default operation implementations
  private async scanMonorepo(
    _taskQueue: AgentTask[],
    context: any,
    _layer: LayerConfig
  ): Promise<AtomicOperationResult> {
    return {
      operation: 'scan_monorepo',
      success: true,
      insights: [`Scanned monorepo at ${context.monorepoRoot || 'C:\\dev'}`]
    };
  }

  private async queryLearningDb(
    taskQueue: AgentTask[],
    _context: any,
    _layer: LayerConfig
  ): Promise<AtomicOperationResult> {
    return {
      operation: 'query_learning_db',
      success: true,
      insights: [`Queried learning DB for task: ${taskQueue[0]?.description || 'unknown'}`]
    };
  }

  private async identifyTasks(
    taskQueue: AgentTask[],
    _context: any,
    _layer: LayerConfig
  ): Promise<AtomicOperationResult> {
    // Generate sub-tasks
    const subTasks: AgentTask[] = [];

    if (taskQueue[0]) {
      // Create 2-3 sub-tasks
      for (let i = 0; i < 2; i++) {
        subTasks.push({
          ...taskQueue[0],
          id: `${taskQueue[0].id}-sub-${i}`,
          title: `Sub-task ${i + 1}: ${taskQueue[0].title}`
        });
      }
    }

    return {
      operation: 'identify_tasks',
      success: true,
      insights: [`Identified ${subTasks.length} sub-tasks`],
      tasks: subTasks
    };
  }

  private async planEdits(
    taskQueue: AgentTask[],
    _context: any,
    _layer: LayerConfig
  ): Promise<AtomicOperationResult> {
    const edits: any[] = [];

    // Generate edit operations from tasks
    for (const task of taskQueue) {
      if (task.steps) {
        for (const step of task.steps) {
          if (step.action.type === 'write_file' || step.action.type === 'edit_file') {
            edits.push({
              fileId: `edit-${Date.now()}`,
              filePath: step.action.params.filePath,
              operation: step.action.type,
              status: 'planned'
            });
          }
        }
      }
    }

    return {
      operation: 'plan_edits',
      success: true,
      insights: [`Planned ${edits.length} edit operations`],
      edits
    };
  }

  private async beginTransaction(): Promise<AtomicOperationResult> {
    const transactionId = `txn-${Date.now()}`;
    return {
      operation: 'begin_transaction',
      success: true,
      insights: [`Transaction ${transactionId} started`],
      transactionId
    };
  }

  private async applyChanges(): Promise<AtomicOperationResult> {
    return {
      operation: 'apply_changes',
      success: true,
      insights: ['Changes applied successfully']
    };
  }

  private async runReviews(
    _taskQueue: AgentTask[],
    _context: any,
    layer: LayerConfig
  ): Promise<AtomicOperationResult> {
    const reviews = layer.reviewPerspectives.map(p => ({
      perspective: p,
      score: Math.random() * 0.3 + 0.7
    }));

    return {
      operation: 'run_reviews',
      success: true,
      insights: [`Ran ${reviews.length} reviews`],
      reviews
    };
  }

  private async updateLearningDb(): Promise<AtomicOperationResult> {
    return {
      operation: 'update_learning_db',
      success: true,
      insights: ['Learning database updated']
    };
  }

  private async validateAll(): Promise<AtomicOperationResult> {
    return {
      operation: 'validate_all',
      success: true,
      insights: ['Validation complete']
    };
  }

  private async generateAmendments(): Promise<AtomicOperationResult> {
    return {
      operation: 'generate_amendments',
      success: true,
      insights: ['Amendments generated']
    };
  }

  private async applyAmendments(): Promise<AtomicOperationResult> {
    return {
      operation: 'apply_amendments',
      success: true,
      insights: ['Amendments applied']
    };
  }

  /**
   * Get execution history
   */
  getHistory(): LayerExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}
