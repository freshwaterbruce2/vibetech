/**
 * Edit Operation Manager
 *
 * Manages file edit operations including batching, parallel execution, and rollback
 * Part of the modular MultiTaskOrchestrator system
 */

import { AgentTask, AgentStep } from '@nova/types';
import { EditOperation } from '../plugin-system/types';
import { logger } from '../../Logger';

export interface EditBatch {
  id: string;
  edits: EditOperation[];
  maxParallelEdits: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  appliedEdits: EditOperation[];
  failedEdits: EditOperation[];
}

export class EditOperationManager {
  private editQueue: EditOperation[] = [];
  private activeBatches = new Map<string, EditBatch>();
  private editHistory = new Map<string, EditOperation[]>();
  private readonly maxParallelEdits: number;

  constructor(maxParallelEdits = 10) {
    this.maxParallelEdits = maxParallelEdits;
  }

  /**
   * Extract edit operations from a task
   */
  async extractEditsFromTask(task: AgentTask): Promise<EditOperation[]> {
    const edits: EditOperation[] = [];

    if (!task.steps) return edits;

    for (const step of task.steps) {
      if (step.type === 'file_operation' || step.type === 'code_change') {
        const edit = this.createEditOperation(step);
        if (edit) edits.push(edit);
      }
    }

    return edits;
  }

  /**
   * Create an edit operation from a step
   */
  private createEditOperation(step: AgentStep): EditOperation | null {
    const metadata = step.metadata;
    if (!metadata?.filePath) return null;

    return {
      fileId: `file-${Date.now()}-${Math.random()}`,
      filePath: metadata.filePath,
      operations: [{
        type: metadata.operationType || 'update',
        content: metadata.content || '',
        oldContent: metadata.oldContent,
        position: metadata.position
      }],
      status: 'pending'
    };
  }

  /**
   * Execute edits with multi-edit capability
   */
  async executeWithMultiEdit(
    tasks: AgentTask[],
    fileSystemService?: any
  ): Promise<EditOperation[]> {
    const allEdits: EditOperation[] = [];

    // Collect all edits from tasks
    for (const task of tasks) {
      const edits = await this.extractEditsFromTask(task);
      allEdits.push(...edits);
    }

    // Create and execute batches
    const batches = this.createEditBatches(allEdits);

    for (const batch of batches) {
      await this.executeBatch(batch, fileSystemService);
    }

    return allEdits;
  }

  /**
   * Create batches for parallel execution
   */
  private createEditBatches(edits: EditOperation[]): EditBatch[] {
    const batches: EditBatch[] = [];

    for (let i = 0; i < edits.length; i += this.maxParallelEdits) {
      const batchEdits = edits.slice(i, i + this.maxParallelEdits);

      const batch: EditBatch = {
        id: `batch-${Date.now()}-${i}`,
        edits: batchEdits,
        maxParallelEdits: this.maxParallelEdits,
        status: 'pending',
        appliedEdits: [],
        failedEdits: []
      };

      batches.push(batch);
      this.activeBatches.set(batch.id, batch);
    }

    return batches;
  }

  /**
   * Execute a batch of edits in parallel
   */
  async executeBatch(
    batch: EditBatch,
    fileSystemService?: any
  ): Promise<void> {
    batch.status = 'executing';

    const promises = batch.edits.map(edit =>
      this.applyEdit(edit, fileSystemService)
        .then(() => {
          batch.appliedEdits.push(edit);
          edit.status = 'applied';
        })
        .catch(error => {
          batch.failedEdits.push(edit);
          edit.status = 'reverted';
          logger.error(`[EditOperationManager] Failed to apply edit to ${edit.filePath}:`, error);
        })
    );

    await Promise.allSettled(promises);

    batch.status = batch.failedEdits.length === 0 ? 'completed' : 'failed';
  }

  /**
   * Apply a single edit operation
   */
  private async applyEdit(
    edit: EditOperation,
    fileSystemService?: any
  ): Promise<void> {
    if (!fileSystemService) {
      logger.warn('[EditOperationManager] No file system service provided, skipping edit');
      return;
    }

    for (const op of edit.operations) {
      switch (op.type) {
        case 'create':
          await fileSystemService.createFile(edit.filePath, op.content);
          break;
        case 'update':
          await fileSystemService.updateFile(edit.filePath, op.content);
          break;
        case 'delete':
          await fileSystemService.deleteFile(edit.filePath);
          break;
        case 'rename':
          await fileSystemService.renameFile(edit.filePath, op.content);
          break;
      }
    }

    // Store in history for potential rollback
    this.addToHistory(edit.filePath, edit);
  }

  /**
   * Revert an edit operation
   */
  async revertEdit(edit: EditOperation, fileSystemService?: any): Promise<void> {
    if (!fileSystemService) return;

    for (const op of edit.operations) {
      try {
        switch (op.type) {
          case 'create':
            // Delete the created file
            await fileSystemService.deleteFile(edit.filePath);
            break;
          case 'update':
            // Restore old content if available
            if (op.oldContent !== undefined) {
              await fileSystemService.updateFile(edit.filePath, op.oldContent);
            }
            break;
          case 'delete':
            // Re-create the deleted file if we have the content
            if (op.oldContent) {
              await fileSystemService.createFile(edit.filePath, op.oldContent);
            }
            break;
          case 'rename':
            // Rename back if we have the old name
            if (op.oldContent) {
              await fileSystemService.renameFile(op.content, edit.filePath);
            }
            break;
        }
      } catch (error) {
        logger.error(`[EditOperationManager] Failed to revert ${op.type} on ${edit.filePath}:`, error);
      }
    }

    edit.status = 'reverted';
  }

  /**
   * Rollback all edits for a batch
   */
  async rollbackBatch(batchId: string, fileSystemService?: any): Promise<void> {
    const batch = this.activeBatches.get(batchId);
    if (!batch) return;

    // Revert in reverse order
    for (let i = batch.appliedEdits.length - 1; i >= 0; i--) {
      await this.revertEdit(batch.appliedEdits[i], fileSystemService);
    }
  }

  /**
   * Add edit to history
   */
  private addToHistory(filePath: string, edit: EditOperation): void {
    if (!this.editHistory.has(filePath)) {
      this.editHistory.set(filePath, []);
    }
    this.editHistory.get(filePath)!.push(edit);
  }

  /**
   * Get edit history for a file
   */
  getFileHistory(filePath: string): EditOperation[] {
    return this.editHistory.get(filePath) || [];
  }

  /**
   * Clear all edit history
   */
  clearHistory(): void {
    this.editHistory.clear();
    this.activeBatches.clear();
    this.editQueue = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    queuedEdits: number;
    activeBatches: number;
    filesWithHistory: number;
  } {
    return {
      queuedEdits: this.editQueue.length,
      activeBatches: this.activeBatches.size,
      filesWithHistory: this.editHistory.size
    };
  }
}