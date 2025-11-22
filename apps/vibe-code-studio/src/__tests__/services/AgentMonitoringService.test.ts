/**
 * AgentMonitoringService Tests
 * Integration tests for AgentMonitor + AgentHookSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentMonitoringService } from '../../services/AgentMonitoringService';
import { AgentHookSystem } from '../../services/AgentHookSystem';
import { AgentMonitor } from '../../services/AgentMonitor';

describe('AgentMonitoringService', () => {
  let hookSystem: AgentHookSystem;
  let monitor: AgentMonitor;
  let service: AgentMonitoringService;

  beforeEach(() => {
    hookSystem = new AgentHookSystem();
    monitor = new AgentMonitor();
    service = new AgentMonitoringService(hookSystem, monitor);
  });

  it('should initialize without errors', () => {
    expect(() => service.initialize()).not.toThrow();
  });

  it('should track successful execution via hooks', async () => {
    service.initialize();

    const context = {
      agentId: 'test-agent',
      task: 'do-something'
    };

    // Simulate full lifecycle
    await hookSystem.executePreHooks('test-agent', context);
    
    // Simulate work...
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await hookSystem.executePostHooks('test-agent', context);

    const metrics = monitor.getMetrics('test-agent');
    expect(metrics.executionCount).toBe(1);
    expect(metrics.successRate).toBe(1);
    expect(metrics.averageDuration).toBeGreaterThan(0);
  });

  it('should track failed execution via hooks', async () => {
    service.initialize();

    const context = {
      agentId: 'test-agent',
      task: 'fail-something'
    };

    // Simulate lifecycle
    await hookSystem.executePreHooks('test-agent', context);
    
    const error = new Error('Task failed');
    await hookSystem.executeErrorHooks('test-agent', error, context);

    const metrics = monitor.getMetrics('test-agent');
    expect(metrics.executionCount).toBe(1);
    expect(metrics.successRate).toBe(0);
    expect(metrics.failureRate).toBe(1);
    expect(metrics.errorCount).toBe(1);
  });

  it('should handle missing start time gracefully', async () => {
    service.initialize();

    // Skip pre-hook to simulate missing start time
    const context = {
      agentId: 'test-agent',
      // startTime missing
    };

    await hookSystem.executePostHooks('test-agent', context);

    // Should not record if critical data is missing (or logic in service handles it)
    // The service logic currently checks: if (!context.agentId || !context.startTime) return;
    
    const metrics = monitor.getMetrics('test-agent');
    expect(metrics.executionCount).toBe(0);
  });

  it('should auto-generate start time in error hook if missing', async () => {
    service.initialize();

    // Skip pre-hook
    const context = {
      agentId: 'test-agent',
      // startTime missing
    };

    const error = new Error('Fast fail');
    await hookSystem.executeErrorHooks('test-agent', error, context);

    const metrics = monitor.getMetrics('test-agent');
    expect(metrics.executionCount).toBe(1);
    expect(metrics.failureRate).toBe(1);
  });
});
