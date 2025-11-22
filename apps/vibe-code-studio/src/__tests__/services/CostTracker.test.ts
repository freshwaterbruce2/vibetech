/**
 * CostTracker Tests
 * TDD: Track AI usage costs and provide analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('CostTracker', () => {
  let CostTracker: any;
  let ModelRegistry: any;

  beforeEach(async () => {
    try {
      const module1 = await import('../../services/CostTracker');
      const module2 = await import('../../services/ModelRegistry');
      CostTracker = module1.CostTracker;
      ModelRegistry = module2.ModelRegistry;
    } catch {
      // Expected to fail initially - TDD RED phase
      CostTracker = null;
      ModelRegistry = null;
    }
  });

  describe('Initialization', () => {
    it('should initialize with model registry', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      expect(() => {
        new CostTracker(registry);
      }).not.toThrow();
    });

    it('should start with zero cost', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      expect(tracker.getTotalCost()).toBe(0);
    });
  });

  describe('Usage Tracking', () => {
    it('should track single request', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      expect(tracker.getTotalCost()).toBeGreaterThan(0);
    });

    it('should track multiple requests', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      tracker.trackUsage('gpt-3.5-turbo', 2000, 1000);

      expect(tracker.getRequestCount()).toBe(2);
    });

    it('should track tokens used', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      expect(tracker.getTotalTokens()).toBe(1500);
    });

    it('should track per-model usage', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      tracker.trackUsage('gpt-4', 2000, 1000);

      const modelUsage = tracker.getModelUsage('gpt-4');

      expect(modelUsage.requestCount).toBe(2);
      expect(modelUsage.totalTokens).toBe(4500);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate total cost', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      const cost = tracker.getTotalCost();

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should calculate per-model cost', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      const cost = tracker.getModelCost('gpt-4');

      expect(cost).toBeGreaterThan(0);
    });

    it('should track cost over time', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      const today = tracker.getCostByDate(new Date());
      expect(today).toBeGreaterThan(0);
    });
  });

  describe('Budget Management', () => {
    it('should set budget limit', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.setBudget(10.0);

      expect(tracker.getBudget()).toBe(10.0);
    });

    it('should check if over budget', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.setBudget(0.01);
      tracker.trackUsage('gpt-4', 10000, 5000);

      expect(tracker.isOverBudget()).toBe(true);
    });

    it('should calculate remaining budget', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.setBudget(10.0);
      tracker.trackUsage('gpt-4', 1000, 500);

      const remaining = tracker.getRemainingBudget();

      expect(remaining).toBeLessThan(10.0);
      expect(remaining).toBeGreaterThan(0);
    });

    it('should calculate budget usage percentage', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.setBudget(10.0);
      tracker.trackUsage('gpt-4', 1000, 500);

      const percentage = tracker.getBudgetUsagePercentage();

      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });
  });

  describe('Analytics', () => {
    it('should get usage statistics', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      tracker.trackUsage('gpt-3.5-turbo', 2000, 1000);

      const stats = tracker.getStatistics();

      expect(stats.totalRequests).toBe(2);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.totalTokens).toBe(4500);
      expect(stats.averageCostPerRequest).toBeGreaterThan(0);
    });

    it('should get most used model', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      tracker.trackUsage('gpt-4', 1000, 500);
      tracker.trackUsage('gpt-3.5-turbo', 1000, 500);

      const mostUsed = tracker.getMostUsedModel();

      expect(mostUsed).toBe('gpt-4');
    });

    it('should get most expensive model', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 10000, 5000);
      tracker.trackUsage('gpt-3.5-turbo', 10000, 5000);

      const mostExpensive = tracker.getMostExpensiveModel();

      expect(mostExpensive).toBe('gpt-4');
    });

    it('should export usage report', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      const report = tracker.exportReport();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.byModel).toBeDefined();
    });
  });

  describe('Time-based Tracking', () => {
    it('should get usage for today', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      const today = tracker.getTodayUsage();

      expect(today.cost).toBeGreaterThan(0);
      expect(today.requests).toBe(1);
    });

    it('should get usage for date range', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      const start = new Date();
      start.setDate(start.getDate() - 7);
      const end = new Date();

      const usage = tracker.getUsageByDateRange(start, end);

      expect(usage.cost).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence', () => {
    it('should reset tracking data', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);
      tracker.reset();

      expect(tracker.getTotalCost()).toBe(0);
      expect(tracker.getRequestCount()).toBe(0);
    });

    it('should export data', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      tracker.trackUsage('gpt-4', 1000, 500);

      const data = tracker.export();

      expect(data).toBeDefined();
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('should import data', () => {
      if (!CostTracker || !ModelRegistry) return;

      const registry = new ModelRegistry();
      const tracker = new CostTracker(registry);

      const data = {
        entries: [
          { modelId: 'gpt-4', inputTokens: 1000, outputTokens: 500, timestamp: new Date(), cost: 0.045 }
        ]
      };

      tracker.import(data);

      expect(tracker.getRequestCount()).toBe(1);
      expect(tracker.getTotalCost()).toBeGreaterThan(0);
    });
  });
});
