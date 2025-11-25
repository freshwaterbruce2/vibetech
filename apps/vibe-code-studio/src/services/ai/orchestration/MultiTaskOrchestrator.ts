/**
 * Multi-Task Orchestrator
 *
 * Coordinates parallel task execution with multi-edit and multi-review capabilities
 * Uses modular components for edit management, review, and amendments
 *
 * Maximum 360 lines - delegates to specialized modules
 */

import { AgentTask } from '@nova/types';
import { SevenLayerPromptArchitecture } from '../SevenLayerPromptArchitecture';
import { TaskPlanner } from '../TaskPlanner';
import { ExecutionEngine } from '../ExecutionEngine';
import { EditOperationManager } from './EditOperationManager';
import { ReviewEngine } from './ReviewEngine';
import { AmendmentProcessor } from './AmendmentProcessor';
import { pluginRegistry } from '../plugin-system/PluginRegistry';
import { logger } from '../../Logger';

export interface TaskBatch {
  id: string;
  tasks: AgentTask[];
  status: 'pending' | 'executing' | 'reviewing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  executionResults: Map<string, any>;
  reviewScore?: number;
  error?: string;
}

export interface OrchestratorConfig {
  maxParallelTasks: number;
  maxParallelEdits: number;
  enableReview: boolean;
  enableAmendments: boolean;
  enableRollback: boolean;
  atomicBatchSize: number;
}

export class MultiTaskOrchestrator {
  private readonly sevenLayer: SevenLayerPromptArchitecture;
  private readonly taskPlanner: TaskPlanner;
  private readonly executionEngine: ExecutionEngine;
  private readonly editManager: EditOperationManager;
  private readonly reviewEngine: ReviewEngine;
  private readonly amendmentProcessor: AmendmentProcessor;

  private readonly config: OrchestratorConfig;
  private activeBatches = new Map<string, TaskBatch>();

  constructor(
    sevenLayer: SevenLayerPromptArchitecture,
    taskPlanner: TaskPlanner,
    executionEngine: ExecutionEngine,
    config?: Partial<OrchestratorConfig>
  ) {
    this.sevenLayer = sevenLayer;
    this.taskPlanner = taskPlanner;
    this.executionEngine = executionEngine;

    this.config = {
      maxParallelTasks: config?.maxParallelTasks ||
        Number(import.meta.env.VITE_MAX_PARALLEL_TASKS) || 5,
      maxParallelEdits: config?.maxParallelEdits ||
        Number(import.meta.env.VITE_MAX_PARALLEL_EDITS) || 10,
      enableReview: config?.enableReview ?? true,
      enableAmendments: config?.enableAmendments ?? true,
      enableRollback: config?.enableRollback ??
        import.meta.env.VITE_ENABLE_ROLLBACK === 'true',
      atomicBatchSize: config?.atomicBatchSize ||
        Number(import.meta.env.VITE_ATOMIC_BATCH_SIZE) || 3,
    };

    // Initialize modules with config
    this.editManager = new EditOperationManager(this.config.maxParallelEdits);
    this.reviewEngine = new ReviewEngine({
      parallelReviews: true,
      aggregationStrategy: 'weighted',
      failureThreshold: 0.6
    });
    this.amendmentProcessor = new AmendmentProcessor({
      atomicBatchSize: this.config.atomicBatchSize,
      enableRollback: this.config.enableRollback
    });

    logger.info('[MultiTaskOrchestrator] Initialized with config:', this.config);
  }

  /**
   * Execute multiple tasks in parallel with full orchestration
   */
  async executeMultiTask(tasks: AgentTask[]): Promise<TaskBatch> {
    const batchId = `batch-${Date.now()}`;
    const batch: TaskBatch = {
      id: batchId,
      tasks,
      status: 'pending',
      startTime: new Date(),
      executionResults: new Map()
    };

    this.activeBatches.set(batchId, batch);

    try {
      // Notify orchestrator plugins
      await pluginRegistry.executeCapability('onBatchStart', batch);

      // Phase 1: Process through 7-layer architecture
      logger.info(`[MultiTaskOrchestrator] Phase 1: Processing ${tasks.length} tasks through 7-layer architecture`);
      batch.status = 'executing';
      const processedTasks = await this.processTasksInParallel(tasks);

      // Phase 2: Execute with multi-edit capability
      logger.info('[MultiTaskOrchestrator] Phase 2: Executing with multi-edit capability');
      const edits = await this.editManager.executeWithMultiEdit(processedTasks);

      // Phase 3: Multi-perspective review (if enabled)
      if (this.config.enableReview) {
        logger.info('[MultiTaskOrchestrator] Phase 3: Performing multi-perspective review');
        batch.status = 'reviewing';
        const reviews = await this.reviewEngine.performMultiReview(processedTasks, edits);

        // Calculate overall score
        batch.reviewScore = this.reviewEngine.aggregateScores(reviews);
        logger.info(`[MultiTaskOrchestrator] Review score: ${Math.round(batch.reviewScore * 100)}%`);

        // Phase 4: Generate and apply amendments (if enabled)
        if (this.config.enableAmendments && batch.reviewScore < 0.8) {
          logger.info('[MultiTaskOrchestrator] Phase 4: Applying amendments');
          const amendments = await this.amendmentProcessor.generateAmendments(reviews);
          await this.amendmentProcessor.applyAtomicAmendments(amendments, this.editManager);
        }
      }

      batch.status = 'completed';
      batch.endTime = new Date();

      // Notify completion
      await pluginRegistry.executeCapability('onBatchComplete', batch);

      logger.info(`[MultiTaskOrchestrator] Batch ${batchId} completed successfully in ${
        (batch.endTime.getTime() - batch.startTime.getTime()) / 1000
      }s`);

      return batch;

    } catch (error) {
      batch.status = 'failed';
      batch.error = error instanceof Error ? error.message : 'Unknown error';
      batch.endTime = new Date();

      logger.error(`[MultiTaskOrchestrator] Batch ${batchId} failed:`, error);

      // Attempt rollback if enabled
      if (this.config.enableRollback) {
        await this.rollbackBatch(batchId);
      }

      // Notify error
      await pluginRegistry.executeCapability('onBatchError', batch, error);

      throw error;
    }
  }

  /**
   * Process tasks in parallel through 7-layer architecture
   */
  private async processTasksInParallel(tasks: AgentTask[]): Promise<AgentTask[]> {
    const chunks = this.createTaskChunks(tasks);
    const processedTasks: AgentTask[] = [];

    for (const chunk of chunks) {
      const promises = chunk.map(task => this.sevenLayer.processTask(task));
      const results = await Promise.all(promises);

      // Convert layered plans back to tasks
      for (const plan of results) {
        const chunkedTasks = this.sevenLayer.chunkByLayers(plan, 5);
        processedTasks.push(...chunkedTasks);
      }
    }

    return processedTasks;
  }

  /**
   * Create task chunks based on max parallel limit
   */
  private createTaskChunks(tasks: AgentTask[]): AgentTask[][] {
    const chunks: AgentTask[][] = [];

    for (let i = 0; i < tasks.length; i += this.config.maxParallelTasks) {
      chunks.push(tasks.slice(i, i + this.config.maxParallelTasks));
    }

    return chunks;
  }

  /**
   * Rollback a batch of changes
   */
  private async rollbackBatch(batchId: string): Promise<void> {
    const batch = this.activeBatches.get(batchId);
    if (!batch) return;

    logger.info(`[MultiTaskOrchestrator] Rolling back batch ${batchId}`);

    try {
      // Rollback edits
      await this.editManager.rollbackBatch(batchId);

      // Clear amendment history for this batch
      this.amendmentProcessor.clear();

      logger.info(`[MultiTaskOrchestrator] Batch ${batchId} rolled back successfully`);
    } catch (error) {
      logger.error(`[MultiTaskOrchestrator] Rollback failed for batch ${batchId}:`, error);
    }
  }

  /**
   * Execute a single task (compatibility method)
   */
  async executeSingleTask(task: AgentTask): Promise<any> {
    return this.executeMultiTask([task]);
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId: string): TaskBatch | undefined {
    return this.activeBatches.get(batchId);
  }

  /**
   * Get active batches
   */
  getActiveBatches(): TaskBatch[] {
    return Array.from(this.activeBatches.values());
  }

  /**
   * Cancel a batch
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const batch = this.activeBatches.get(batchId);
    if (!batch || batch.status === 'completed') return false;

    batch.status = 'failed';
    batch.error = 'Cancelled by user';
    batch.endTime = new Date();

    if (this.config.enableRollback) {
      await this.rollbackBatch(batchId);
    }

    return true;
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    activeBatches: number;
    completedBatches: number;
    failedBatches: number;
    editStats: any;
    amendmentStats: any;
  } {
    let completed = 0;
    let failed = 0;

    for (const batch of this.activeBatches.values()) {
      if (batch.status === 'completed') completed++;
      if (batch.status === 'failed') failed++;
    }

    return {
      activeBatches: this.activeBatches.size,
      completedBatches: completed,
      failedBatches: failed,
      editStats: this.editManager.getStats(),
      amendmentStats: this.amendmentProcessor.getStats()
    };
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.activeBatches.clear();
    this.editManager.clearHistory();
    this.amendmentProcessor.clear();
  }
}
