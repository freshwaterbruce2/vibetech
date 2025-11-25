/**
 * AgentMonitor - Performance monitoring and analytics for agents
 */

export interface ExecutionRecord {
  startTime?: number;
  endTime?: number;
  success: boolean;
  error?: Error;
  duration?: number;
}

export interface AgentMetrics {
  executionCount: number;
  successRate: number;
  failureRate: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  lastError?: Error;
  executionsPerMinute: number;
  lastExecutionTime?: number;
}

export interface Threshold {
  maxDuration?: number;
  minSuccessRate?: number;
}

export interface Violation {
  type: 'duration' | 'successRate';
  value: number;
  threshold: number;
  timestamp: number;
}

export interface HealthStatus {
  score: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
}

export interface SystemHealth {
  totalAgents: number;
  healthyAgents: number;
  degradedAgents: number;
  unhealthyAgents: number;
  overallScore: number;
}

export class AgentMonitor {
  private executions: Map<string, ExecutionRecord[]> = new Map();
  private thresholds: Map<string, Threshold> = new Map();
  private violations: Map<string, Violation[]> = new Map();
  private alertCallbacks: Array<(agentId: string, violation: Violation) => void> = [];

  recordExecution(agentId: string, record: ExecutionRecord): void {
    if (!this.executions.has(agentId)) {
      this.executions.set(agentId, []);
    }

    // Calculate duration if start/end times provided
    if (record.startTime && record.endTime) {
      record.duration = record.endTime - record.startTime;
    }

    this.executions.get(agentId)!.push({
      ...record,
      startTime: record.startTime || Date.now()
    });

    // Check thresholds
    this.checkThresholds(agentId, record);
  }

  getMetrics(agentId: string): AgentMetrics {
    const records = this.executions.get(agentId) || [];

    if (records.length === 0) {
      return {
        executionCount: 0,
        successRate: 0,
        failureRate: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        errorCount: 0,
        executionsPerMinute: 0
      };
    }

    const successes = records.filter(r => r.success).length;
    const failures = records.filter(r => !r.success).length;
    const durations = records.filter(r => r.duration !== undefined).map(r => r.duration!);
    const errors = records.filter(r => r.error);

    const firstTime = records[0].startTime || Date.now();
    const lastTime = records[records.length - 1].startTime || Date.now();
    const minutesElapsed = (lastTime - firstTime) / 60000 || 1;

    return {
      executionCount: records.length,
      successRate: successes / records.length,
      failureRate: failures / records.length,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      errorCount: errors.length,
      lastError: errors[errors.length - 1]?.error,
      executionsPerMinute: records.length / minutesElapsed,
      lastExecutionTime: lastTime
    };
  }

  getMetricsForTimeRange(agentId: string, startTime: number, endTime: number): AgentMetrics {
    const allRecords = this.executions.get(agentId) || [];
    const filteredRecords = allRecords.filter(r => {
      const time = r.startTime || Date.now();
      return time >= startTime && time <= endTime;
    });

    // Temporarily override records for calculation
    const originalRecords = this.executions.get(agentId);
    this.executions.set(agentId, filteredRecords);
    const metrics = this.getMetrics(agentId);
    this.executions.set(agentId, originalRecords || []);

    return metrics;
  }

  getTrend(agentId: string): { direction: 'improving' | 'stable' | 'degrading'; change: number } {
    const records = this.executions.get(agentId) || [];
    if (records.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    const durations = records.filter(r => r.duration).map(r => r.duration!);
    const mid = Math.floor(durations.length / 2);
    const firstHalf = durations.slice(0, mid);
    const secondHalf = durations.slice(mid);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (Math.abs(change) < 5) {return { direction: 'stable', change };}
    return {
      direction: change > 0 ? 'degrading' : 'improving',
      change: Math.abs(change)
    };
  }

  getHourlyStats(agentId: string): Array<{ hour: number; count: number; avgDuration: number }> {
    const records = this.executions.get(agentId) || [];
    const hourlyData: Map<number, ExecutionRecord[]> = new Map();

    records.forEach(record => {
      const hour = new Date(record.startTime || Date.now()).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(record);
    });

    return Array.from(hourlyData.entries()).map(([hour, recs]) => ({
      hour,
      count: recs.length,
      avgDuration: recs.filter(r => r.duration).reduce((sum, r) => sum + r.duration!, 0) / recs.length || 0
    }));
  }

  setThreshold(agentId: string, threshold: Threshold): void {
    this.thresholds.set(agentId, threshold);
  }

  getThreshold(agentId: string): Threshold {
    return this.thresholds.get(agentId) || {};
  }

  getViolations(agentId: string): Violation[] {
    return this.violations.get(agentId) || [];
  }

  private checkThresholds(agentId: string, record: ExecutionRecord): void {
    const threshold = this.thresholds.get(agentId);
    if (!threshold) {return;}

    const violations: Violation[] = [];

    // Check duration threshold
    if (threshold.maxDuration && record.duration && record.duration > threshold.maxDuration) {
      violations.push({
        type: 'duration',
        value: record.duration,
        threshold: threshold.maxDuration,
        timestamp: Date.now()
      });
    }

    // Check success rate threshold
    if (threshold.minSuccessRate) {
      const metrics = this.getMetrics(agentId);
      if (metrics.successRate < threshold.minSuccessRate && metrics.executionCount >= 5) {
        violations.push({
          type: 'successRate',
          value: metrics.successRate,
          threshold: threshold.minSuccessRate,
          timestamp: Date.now()
        });
      }
    }

    // Store and alert
    if (violations.length > 0) {
      if (!this.violations.has(agentId)) {
        this.violations.set(agentId, []);
      }
      this.violations.get(agentId)!.push(...violations);

      // Trigger alerts
      violations.forEach(violation => {
        this.alertCallbacks.forEach(callback => callback(agentId, violation));
      });
    }
  }

  onAlert(callback: (agentId: string, violation: Violation) => void): void {
    this.alertCallbacks.push(callback);
  }

  compareAgents(agentIds: string[]): Array<{ agentId: string; metrics: AgentMetrics }> {
    return agentIds.map(agentId => ({
      agentId,
      metrics: this.getMetrics(agentId)
    }));
  }

  rankByPerformance(): Array<{ agentId: string; avgDuration: number }> {
    const agents = Array.from(this.executions.keys());
    return agents
      .map(agentId => ({
        agentId,
        avgDuration: this.getMetrics(agentId).averageDuration
      }))
      .sort((a, b) => a.avgDuration - b.avgDuration);
  }

  rankByReliability(): Array<{ agentId: string; successRate: number }> {
    const agents = Array.from(this.executions.keys());
    return agents
      .map(agentId => ({
        agentId,
        successRate: this.getMetrics(agentId).successRate
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  exportMetrics(): Record<string, AgentMetrics> {
    const result: Record<string, AgentMetrics> = {};
    Array.from(this.executions.keys()).forEach(agentId => {
      result[agentId] = this.getMetrics(agentId);
    });
    return result;
  }

  resetMetrics(agentId: string): void {
    this.executions.delete(agentId);
    this.violations.delete(agentId);
  }

  resetAll(): void {
    this.executions.clear();
    this.thresholds.clear();
    this.violations.clear();
  }

  getHealth(agentId: string): HealthStatus {
    const metrics = this.getMetrics(agentId);
    const issues: string[] = [];
    let score = 100;

    // Deduct for low success rate
    if (metrics.successRate < 0.8) {
      score -= (0.8 - metrics.successRate) * 100;
      issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    }

    // Deduct for high error rate
    if (metrics.errorCount > metrics.executionCount * 0.2) {
      score -= 20;
      issues.push(`High error rate: ${metrics.errorCount} errors`);
    }

    // Deduct for violations
    const violations = this.getViolations(agentId);
    if (violations.length > 0) {
      score -= violations.length * 5;
      issues.push(`${violations.length} threshold violations`);
    }

    score = Math.max(0, Math.min(100, score));

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (score >= 80) {status = 'healthy';}
    else if (score >= 50) {status = 'degraded';}
    else {status = 'unhealthy';}

    return { score, status, issues };
  }

  getSystemHealth(): SystemHealth {
    const agents = Array.from(this.executions.keys());
    const healthStatuses = agents.map(agentId => this.getHealth(agentId));

    return {
      totalAgents: agents.length,
      healthyAgents: healthStatuses.filter(h => h.status === 'healthy').length,
      degradedAgents: healthStatuses.filter(h => h.status === 'degraded').length,
      unhealthyAgents: healthStatuses.filter(h => h.status === 'unhealthy').length,
      overallScore: healthStatuses.reduce((sum, h) => sum + h.score, 0) / agents.length || 0
    };
  }
}
