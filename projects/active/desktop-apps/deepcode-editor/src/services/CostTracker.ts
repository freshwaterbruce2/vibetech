/**
 * CostTracker - Track AI usage costs and provide analytics
 */

import type { ModelRegistry } from './ModelRegistry';

export interface UsageEntry {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

export interface ModelUsage {
  requestCount: number;
  totalTokens: number;
  totalCost: number;
}

export interface UsageStatistics {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
}

export interface UsageReport {
  summary: UsageStatistics;
  byModel: Record<string, ModelUsage>;
  timeRange: { start: Date; end: Date };
}

export interface TimeRangeUsage {
  cost: number;
  requests: number;
  tokens: number;
}

export interface ExportData {
  entries: UsageEntry[];
  budget?: number;
}

export class CostTracker {
  private modelRegistry: ModelRegistry;
  private entries: UsageEntry[] = [];
  private budget: number | null = null;

  constructor(modelRegistry: ModelRegistry) {
    this.modelRegistry = modelRegistry;
  }

  /**
   * Track usage for a request
   */
  trackUsage(modelId: string, inputTokens: number, outputTokens: number): void {
    const cost = this.modelRegistry.calculateCost(modelId, inputTokens, outputTokens);

    this.entries.push({
      modelId,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date()
    });
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.entries.reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get request count
   */
  getRequestCount(): number {
    return this.entries.length;
  }

  /**
   * Get total tokens used
   */
  getTotalTokens(): number {
    return this.entries.reduce(
      (sum, entry) => sum + entry.inputTokens + entry.outputTokens,
      0
    );
  }

  /**
   * Get usage for specific model
   */
  getModelUsage(modelId: string): ModelUsage {
    const modelEntries = this.entries.filter(e => e.modelId === modelId);

    return {
      requestCount: modelEntries.length,
      totalTokens: modelEntries.reduce(
        (sum, e) => sum + e.inputTokens + e.outputTokens,
        0
      ),
      totalCost: modelEntries.reduce((sum, e) => sum + e.cost, 0)
    };
  }

  /**
   * Get cost for specific model
   */
  getModelCost(modelId: string): number {
    return this.entries
      .filter(e => e.modelId === modelId)
      .reduce((sum, e) => sum + e.cost, 0);
  }

  /**
   * Get cost by date
   */
  getCostByDate(date: Date): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.entries
      .filter(e => e.timestamp >= startOfDay && e.timestamp <= endOfDay)
      .reduce((sum, e) => sum + e.cost, 0);
  }

  /**
   * Set budget limit
   */
  setBudget(amount: number): void {
    this.budget = amount;
  }

  /**
   * Get budget
   */
  getBudget(): number | null {
    return this.budget;
  }

  /**
   * Check if over budget
   */
  isOverBudget(): boolean {
    if (this.budget === null) return false;
    return this.getTotalCost() > this.budget;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    if (this.budget === null) return Infinity;
    return Math.max(0, this.budget - this.getTotalCost());
  }

  /**
   * Get budget usage percentage
   */
  getBudgetUsagePercentage(): number {
    if (this.budget === null || this.budget === 0) return 0;
    return (this.getTotalCost() / this.budget) * 100;
  }

  /**
   * Get usage statistics
   */
  getStatistics(): UsageStatistics {
    const totalRequests = this.getRequestCount();
    const totalCost = this.getTotalCost();
    const totalTokens = this.getTotalTokens();

    return {
      totalRequests,
      totalCost,
      totalTokens,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0
    };
  }

  /**
   * Get most used model
   */
  getMostUsedModel(): string | null {
    if (this.entries.length === 0) return null;

    const counts: Record<string, number> = {};

    for (const entry of this.entries) {
      counts[entry.modelId] = (counts[entry.modelId] || 0) + 1;
    }

    let maxCount = 0;
    let mostUsed = '';

    for (const [modelId, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = modelId;
      }
    }

    return mostUsed;
  }

  /**
   * Get most expensive model
   */
  getMostExpensiveModel(): string | null {
    if (this.entries.length === 0) return null;

    const costs: Record<string, number> = {};

    for (const entry of this.entries) {
      costs[entry.modelId] = (costs[entry.modelId] || 0) + entry.cost;
    }

    let maxCost = 0;
    let mostExpensive = '';

    for (const [modelId, cost] of Object.entries(costs)) {
      if (cost > maxCost) {
        maxCost = cost;
        mostExpensive = modelId;
      }
    }

    return mostExpensive;
  }

  /**
   * Export usage report
   */
  exportReport(): UsageReport {
    const byModel: Record<string, ModelUsage> = {};
    const uniqueModels = new Set(this.entries.map(e => e.modelId));

    for (const modelId of uniqueModels) {
      byModel[modelId] = this.getModelUsage(modelId);
    }

    const timestamps = this.entries.map(e => e.timestamp);
    const start = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : new Date();
    const end = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : new Date();

    return {
      summary: this.getStatistics(),
      byModel,
      timeRange: { start, end }
    };
  }

  /**
   * Get today's usage
   */
  getTodayUsage(): TimeRangeUsage {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getUsageByDateRange(startOfDay, endOfDay);
  }

  /**
   * Get usage by date range
   */
  getUsageByDateRange(start: Date, end: Date): TimeRangeUsage {
    const rangeEntries = this.entries.filter(
      e => e.timestamp >= start && e.timestamp <= end
    );

    return {
      cost: rangeEntries.reduce((sum, e) => sum + e.cost, 0),
      requests: rangeEntries.length,
      tokens: rangeEntries.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0)
    };
  }

  /**
   * Reset tracking data
   */
  reset(): void {
    this.entries = [];
    this.budget = null;
  }

  /**
   * Export data
   */
  export(): ExportData {
    return {
      entries: [...this.entries],
      budget: this.budget ?? undefined
    };
  }

  /**
   * Import data
   */
  import(data: ExportData): void {
    this.entries = data.entries.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp)
    }));

    if (data.budget !== undefined) {
      this.budget = data.budget;
    }
  }
}
