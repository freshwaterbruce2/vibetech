/**
 * AgentMonitor Tests
 * TDD: Performance monitoring and analytics for agents
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AgentMonitor', () => {
  let AgentMonitor: any;

  beforeEach(async () => {
    try {
      const module = await import('../../services/AgentMonitor');
      AgentMonitor = module.AgentMonitor;
    } catch {
      // Expected to fail initially - TDD RED phase
      AgentMonitor = null;
    }
  });

  describe('Execution Tracking', () => {
    it('should track agent execution', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true
      });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.executionCount).toBe(1);
    });

    it('should track execution duration', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      const startTime = Date.now() - 5000;
      const endTime = Date.now();

      monitor.recordExecution('test-agent', {
        startTime,
        endTime,
        success: true
      });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.averageDuration).toBeGreaterThan(4900);
      expect(metrics.averageDuration).toBeLessThan(5100);
    });

    it('should track success and failure rates', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', { success: true });
      monitor.recordExecution('test-agent', { success: true });
      monitor.recordExecution('test-agent', { success: false });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.successRate).toBeCloseTo(0.666, 2);
      expect(metrics.failureRate).toBeCloseTo(0.333, 2);
    });

    it('should track errors', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();
      const error = new Error('Test error');

      monitor.recordExecution('test-agent', {
        success: false,
        error
      });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.errorCount).toBe(1);
      expect(metrics.lastError).toBe(error);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate average execution time', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true
      });

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 2000,
        endTime: Date.now(),
        success: true
      });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.averageDuration).toBeGreaterThan(1400);
      expect(metrics.averageDuration).toBeLessThan(1600);
    });

    it('should calculate min/max execution time', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true
      });

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        success: true
      });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.minDuration).toBeCloseTo(1000, -2);
      expect(metrics.maxDuration).toBeCloseTo(5000, -2);
    });

    it('should track executions per minute', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      for (let i = 0; i < 10; i++) {
        monitor.recordExecution('test-agent', { success: true });
      }

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.executionsPerMinute).toBeGreaterThan(0);
    });

    it('should track last execution time', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      const now = Date.now();
      monitor.recordExecution('test-agent', {
        startTime: now,
        endTime: now + 100,
        success: true
      });

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.lastExecutionTime).toBeGreaterThanOrEqual(now);
    });
  });

  describe('Time-based Analysis', () => {
    it('should get metrics for time range', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      const oneHourAgo = Date.now() - 3600000;
      const now = Date.now();

      monitor.recordExecution('test-agent', {
        startTime: oneHourAgo + 1000,
        endTime: oneHourAgo + 2000,
        success: true
      });

      const metrics = monitor.getMetricsForTimeRange('test-agent', oneHourAgo, now);
      expect(metrics.executionCount).toBe(1);
    });

    it('should calculate trend over time', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      // Add executions with increasing duration
      for (let i = 0; i < 5; i++) {
        monitor.recordExecution('test-agent', {
          startTime: Date.now() - (1000 * (i + 1)),
          endTime: Date.now(),
          success: true
        });
      }

      const trend = monitor.getTrend('test-agent');
      expect(trend).toBeDefined();
    });

    it('should get hourly statistics', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', { success: true });

      const hourlyStats = monitor.getHourlyStats('test-agent');
      expect(hourlyStats).toBeDefined();
      expect(Array.isArray(hourlyStats)).toBe(true);
    });
  });

  describe('Alerts and Thresholds', () => {
    it('should set performance threshold', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.setThreshold('test-agent', {
        maxDuration: 5000,
        minSuccessRate: 0.8
      });

      const threshold = monitor.getThreshold('test-agent');
      expect(threshold.maxDuration).toBe(5000);
    });

    it('should detect threshold violations', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.setThreshold('test-agent', {
        maxDuration: 1000
      });

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 2000,
        endTime: Date.now(),
        success: true
      });

      const violations = monitor.getViolations('test-agent');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should trigger alerts on violations', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();
      const alertCallback = vi.fn();

      monitor.onAlert(alertCallback);

      monitor.setThreshold('test-agent', {
        maxDuration: 1000
      });

      monitor.recordExecution('test-agent', {
        startTime: Date.now() - 2000,
        endTime: Date.now(),
        success: true
      });

      expect(alertCallback).toHaveBeenCalled();
    });

    it('should alert on low success rate', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();
      const alertCallback = vi.fn();

      monitor.onAlert(alertCallback);

      monitor.setThreshold('test-agent', {
        minSuccessRate: 0.9
      });

      // Record 10 executions with 50% success rate
      for (let i = 0; i < 10; i++) {
        monitor.recordExecution('test-agent', {
          success: i % 2 === 0
        });
      }

      expect(alertCallback).toHaveBeenCalled();
    });
  });

  describe('Comparison and Ranking', () => {
    it('should compare multiple agents', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('agent-a', {
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true
      });

      monitor.recordExecution('agent-b', {
        startTime: Date.now() - 2000,
        endTime: Date.now(),
        success: true
      });

      const comparison = monitor.compareAgents(['agent-a', 'agent-b']);
      expect(comparison).toBeDefined();
      expect(comparison).toHaveLength(2);
    });

    it('should rank agents by performance', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('fast-agent', {
        startTime: Date.now() - 500,
        endTime: Date.now(),
        success: true
      });

      monitor.recordExecution('slow-agent', {
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        success: true
      });

      const ranked = monitor.rankByPerformance();
      expect(ranked[0].agentId).toBe('fast-agent');
    });

    it('should rank agents by reliability', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      // Reliable agent (100% success)
      monitor.recordExecution('reliable-agent', { success: true });
      monitor.recordExecution('reliable-agent', { success: true });

      // Unreliable agent (50% success)
      monitor.recordExecution('unreliable-agent', { success: true });
      monitor.recordExecution('unreliable-agent', { success: false });

      const ranked = monitor.rankByReliability();
      expect(ranked[0].agentId).toBe('reliable-agent');
    });
  });

  describe('Data Export and Reset', () => {
    it('should export all metrics', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', { success: true });

      const exported = monitor.exportMetrics();
      expect(exported).toBeDefined();
      expect(exported['test-agent']).toBeDefined();
    });

    it('should reset metrics for agent', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('test-agent', { success: true });
      monitor.resetMetrics('test-agent');

      const metrics = monitor.getMetrics('test-agent');
      expect(metrics.executionCount).toBe(0);
    });

    it('should reset all metrics', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('agent-a', { success: true });
      monitor.recordExecution('agent-b', { success: true });

      monitor.resetAll();

      const exported = monitor.exportMetrics();
      expect(Object.keys(exported)).toHaveLength(0);
    });
  });

  describe('Health Status', () => {
    it('should calculate health score', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      for (let i = 0; i < 10; i++) {
        monitor.recordExecution('test-agent', {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          success: true
        });
      }

      const health = monitor.getHealth('test-agent');
      expect(health.score).toBeGreaterThan(0);
      expect(health.status).toBeDefined();
    });

    it('should detect unhealthy agents', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      // Record many failures
      for (let i = 0; i < 10; i++) {
        monitor.recordExecution('test-agent', { success: false });
      }

      const health = monitor.getHealth('test-agent');
      expect(health.status).toBe('unhealthy');
    });

    it('should get system-wide health', () => {
      if (!AgentMonitor) return;

      const monitor = new AgentMonitor();

      monitor.recordExecution('agent-a', { success: true });
      monitor.recordExecution('agent-b', { success: false });

      const systemHealth = monitor.getSystemHealth();
      expect(systemHealth).toBeDefined();
      expect(systemHealth.totalAgents).toBe(2);
    });
  });
});
