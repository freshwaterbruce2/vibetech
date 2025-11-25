/**
 * Amendment Processor
 *
 * Handles atomic amendments with transaction support and rollback capabilities
 * Part of the modular MultiTaskOrchestrator system
 */

import { Amendment, EditOperation } from '../plugin-system/types';
import { logger } from '../../Logger';

export interface Transaction {
  id: string;
  amendments: Amendment[];
  status: 'pending' | 'in_progress' | 'committed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  changes: EditOperation[];
  rollbackStack: Array<() => Promise<void>>;
}

export class AmendmentProcessor {
  private transactions = new Map<string, Transaction>();
  private activeTransaction: Transaction | null = null;
  private amendmentHistory: Amendment[] = [];
  private readonly atomicBatchSize: number;
  private readonly enableRollback: boolean;

  constructor(config?: { atomicBatchSize?: number; enableRollback?: boolean }) {
    this.atomicBatchSize = config?.atomicBatchSize || 3;
    this.enableRollback = config?.enableRollback ?? true;
  }

  /**
   * Generate amendments based on review results
   */
  async generateAmendments(reviews: any[]): Promise<Amendment[]> {
    const amendments: Amendment[] = [];

    for (const review of reviews) {
      if (review.requiredAmendments) {
        amendments.push(...review.requiredAmendments);
      }
    }

    return this.groupAtomicAmendments(amendments);
  }

  /**
   * Group related amendments for atomic execution
   */
  private groupAtomicAmendments(amendments: Amendment[]): Amendment[] {
    const grouped: Amendment[] = [];
    const processed = new Set<string>();

    for (const amendment of amendments) {
      if (processed.has(amendment.id)) continue;

      // Find related amendments based on dependencies
      const related = amendments.filter(a =>
        a.dependencies.includes(amendment.id) ||
        amendment.dependencies.includes(a.id)
      );

      if (related.length > 0) {
        // Create atomic group
        const atomicAmendment: Amendment = {
          id: `atomic-${Date.now()}`,
          type: amendment.type,
          description: `Atomic group: ${amendment.description}`,
          changes: [
            ...amendment.changes,
            ...related.flatMap(a => a.changes)
          ],
          atomic: true,
          dependencies: []
        };

        grouped.push(atomicAmendment);
        processed.add(amendment.id);
        related.forEach(a => processed.add(a.id));
      } else {
        grouped.push(amendment);
        processed.add(amendment.id);
      }
    }

    return grouped;
  }

  /**
   * Apply amendments atomically
   */
  async applyAtomicAmendments(
    amendments: Amendment[],
    editManager?: any
  ): Promise<void> {
    for (const amendment of amendments) {
      if (amendment.atomic) {
        await this.executeInTransaction(amendment, editManager);
      } else {
        await this.applyAmendment(amendment, editManager);
      }

      this.amendmentHistory.push(amendment);
    }
  }

  /**
   * Execute amendment in a transaction
   */
  private async executeInTransaction(
    amendment: Amendment,
    editManager?: any
  ): Promise<void> {
    const transaction = await this.beginTransaction(amendment);

    try {
      for (const change of amendment.changes) {
        await this.applyChange(change, editManager, transaction);
      }

      await this.commitTransaction(transaction);
    } catch (error) {
      logger.error(`[AmendmentProcessor] Transaction ${transaction.id} failed:`, error);
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Apply a single amendment
   */
  private async applyAmendment(
    amendment: Amendment,
    editManager?: any
  ): Promise<void> {
    for (const change of amendment.changes) {
      await this.applyChange(change, editManager, null);
    }
  }

  /**
   * Apply a change operation
   */
  private async applyChange(
    change: EditOperation,
    editManager?: any,
    transaction: Transaction | null
  ): Promise<void> {
    if (editManager) {
      // Use edit manager to apply change
      await editManager.applyEdit(change);
    }

    // Add to transaction if applicable
    if (transaction) {
      transaction.changes.push(change);

      // Add rollback function
      if (this.enableRollback) {
        transaction.rollbackStack.push(async () => {
          if (editManager) {
            await editManager.revertEdit(change);
          }
        });
      }
    }
  }

  /**
   * Begin a new transaction
   */
  async beginTransaction(amendment?: Amendment): Promise<Transaction> {
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      amendments: amendment ? [amendment] : [],
      status: 'in_progress',
      startTime: new Date(),
      changes: [],
      rollbackStack: []
    };

    this.transactions.set(transaction.id, transaction);
    this.activeTransaction = transaction;

    logger.debug(`[AmendmentProcessor] Transaction ${transaction.id} started`);
    return transaction;
  }

  /**
   * Commit current transaction
   */
  async commitTransaction(transaction: Transaction): Promise<void> {
    if (transaction.status !== 'in_progress') {
      throw new Error(`Cannot commit transaction in ${transaction.status} state`);
    }

    transaction.status = 'committed';
    transaction.endTime = new Date();

    if (this.activeTransaction?.id === transaction.id) {
      this.activeTransaction = null;
    }

    logger.debug(`[AmendmentProcessor] Transaction ${transaction.id} committed`);
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transaction: Transaction): Promise<void> {
    if (!this.enableRollback) {
      logger.warn('[AmendmentProcessor] Rollback is disabled');
      return;
    }

    if (transaction.status === 'rolled_back') {
      logger.warn(`[AmendmentProcessor] Transaction ${transaction.id} already rolled back`);
      return;
    }

    logger.debug(`[AmendmentProcessor] Rolling back transaction ${transaction.id}`);

    // Execute rollback functions in reverse order
    for (let i = transaction.rollbackStack.length - 1; i >= 0; i--) {
      try {
        await transaction.rollbackStack[i]();
      } catch (error) {
        logger.error(`[AmendmentProcessor] Rollback step ${i} failed:`, error);
      }
    }

    transaction.status = 'rolled_back';
    transaction.endTime = new Date();

    if (this.activeTransaction?.id === transaction.id) {
      this.activeTransaction = null;
    }

    logger.debug(`[AmendmentProcessor] Transaction ${transaction.id} rolled back`);
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Get amendment history
   */
  getHistory(): Amendment[] {
    return [...this.amendmentHistory];
  }

  /**
   * Clear all history and transactions
   */
  clear(): void {
    this.transactions.clear();
    this.activeTransaction = null;
    this.amendmentHistory = [];
  }

  /**
   * Get processor statistics
   */
  getStats(): {
    totalTransactions: number;
    committedTransactions: number;
    rolledBackTransactions: number;
    totalAmendments: number;
  } {
    let committed = 0;
    let rolledBack = 0;

    for (const transaction of this.transactions.values()) {
      if (transaction.status === 'committed') committed++;
      if (transaction.status === 'rolled_back') rolledBack++;
    }

    return {
      totalTransactions: this.transactions.size,
      committedTransactions: committed,
      rolledBackTransactions: rolledBack,
      totalAmendments: this.amendmentHistory.length
    };
  }
}
