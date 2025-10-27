/**
 * Agent Performance Optimizer - Enhances agent response times and resource usage
 */
import { EventEmitter } from '../utils/EventEmitter';
import { logger } from '../utils/logger';

import { AgentResponse, BaseSpecializedAgent, PerformanceMetrics } from './specialized-agents/BaseSpecializedAgent';

export interface PerformanceProfile {
  agentId: string;
  avgResponseTime: number;
  successRate: number;
  memoryUsage: number;
  cacheHitRate: number;
  tokenEfficiency: number;
  workloadScore: number;
}

export interface OptimizationStrategy {
  type: 'cache' | 'batch' | 'parallel' | 'throttle' | 'preload' | 'compress';
  description: string;
  expectedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

export interface PerformanceAlert {
  agentId: string;
  type: 'slow_response' | 'high_memory' | 'low_cache_hit' | 'high_error_rate';
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
}

/**
 * Advanced performance optimization system for multi-agent coordination
 */
export class AgentPerformanceOptimizer extends EventEmitter {
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private agentProfiles: Map<string, PerformanceProfile> = new Map();
  private requestQueue: Map<string, Array<{
    request: string;
    context: any;
    timestamp: Date;
    priority: number;
  }>> = new Map();
  private responseCache: Map<string, {
    response: AgentResponse;
    timestamp: Date;
    hits: number;
  }> = new Map();
  private optimizationStrategies: Map<string, OptimizationStrategy[]> = new Map();
  private performanceAlerts: PerformanceAlert[] = [];

  // Performance thresholds
  private readonly THRESHOLDS = {
    SLOW_RESPONSE: 5000, // 5 seconds
    HIGH_MEMORY: 100 * 1024 * 1024, // 100MB
    LOW_CACHE_HIT: 0.3, // 30%
    HIGH_ERROR_RATE: 0.1 // 10%
  };

  constructor() {
    super();
    this.startPerformanceMonitoring();
  }

  /**
   * Record performance metrics for an agent
   */
  recordPerformance(agentId: string, metrics: PerformanceMetrics): void {
    if (!this.performanceHistory.has(agentId)) {
      this.performanceHistory.set(agentId, []);
    }

    const history = this.performanceHistory.get(agentId)!;
    history.push(metrics);

    // Keep only recent metrics (last 100)
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // Update agent profile
    this.updateAgentProfile(agentId);
    
    // Check for performance issues
    this.checkPerformanceThresholds(agentId, metrics);
  }

  /**
   * Update agent performance profile
   */
  private updateAgentProfile(agentId: string): void {
    const history = this.performanceHistory.get(agentId);
    if (!history || history.length === 0) {return;}

    const recent = history.slice(-20); // Last 20 interactions
    
    const profile: PerformanceProfile = {
      agentId,
      avgResponseTime: recent.reduce((sum, m) => sum + m.processingTime, 0) / recent.length,
      successRate: 1.0, // This would come from success tracking
      memoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      cacheHitRate: recent.reduce((sum, m) => sum + m.cacheHits, 0) / 
                   Math.max(1, recent.reduce((sum, m) => sum + m.cacheHits + m.apiCalls, 0)),
      tokenEfficiency: recent.reduce((sum, m) => sum + (m.tokenCount || 0), 0) / recent.length,
      workloadScore: this.calculateWorkloadScore(agentId, recent)
    };

    this.agentProfiles.set(agentId, profile);
    
    // Generate optimization strategies
    this.generateOptimizationStrategies(agentId, profile);

    this.emit('profileUpdated', { agentId, profile });
  }

  /**
   * Calculate workload score based on recent activity
   */
  private calculateWorkloadScore(_agentId: string, metrics: PerformanceMetrics[]): number {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Count recent requests (approximate based on metrics)
    const recentActivity = metrics.filter((_, index) => {
      // Assume metrics are recorded chronologically
      const estimatedTime = now - (metrics.length - index) * 60000; // 1 min intervals
      return (now - estimatedTime) < oneHour;
    }).length;

    return Math.min(recentActivity / 60, 1.0); // Normalize to 0-1
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(agentId: string, metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    if (metrics.processingTime > this.THRESHOLDS.SLOW_RESPONSE) {
      alerts.push({
        agentId,
        type: 'slow_response',
        severity: metrics.processingTime > this.THRESHOLDS.SLOW_RESPONSE * 2 ? 'critical' : 'warning',
        message: `Agent response time exceeded threshold: ${metrics.processingTime}ms`,
        threshold: this.THRESHOLDS.SLOW_RESPONSE,
        currentValue: metrics.processingTime,
        timestamp: new Date()
      });
    }

    if (metrics.memoryUsage > this.THRESHOLDS.HIGH_MEMORY) {
      alerts.push({
        agentId,
        type: 'high_memory',
        severity: metrics.memoryUsage > this.THRESHOLDS.HIGH_MEMORY * 2 ? 'critical' : 'warning',
        message: `Agent memory usage exceeded threshold: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`,
        threshold: this.THRESHOLDS.HIGH_MEMORY,
        currentValue: metrics.memoryUsage,
        timestamp: new Date()
      });
    }

    const profile = this.agentProfiles.get(agentId);
    if (profile && profile.cacheHitRate < this.THRESHOLDS.LOW_CACHE_HIT) {
      alerts.push({
        agentId,
        type: 'low_cache_hit',
        severity: 'warning',
        message: `Agent cache hit rate below threshold: ${Math.round(profile.cacheHitRate * 100)}%`,
        threshold: this.THRESHOLDS.LOW_CACHE_HIT,
        currentValue: profile.cacheHitRate,
        timestamp: new Date()
      });
    }

    // Store alerts
    this.performanceAlerts.push(...alerts);
    
    // Keep only recent alerts (last 100)
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts = this.performanceAlerts.slice(-100);
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('performanceAlert', alert);
      logger.warn(`Performance Alert [${alert.agentId}]: ${alert.message}`);
    });
  }

  /**
   * Generate optimization strategies for an agent
   */
  private generateOptimizationStrategies(agentId: string, profile: PerformanceProfile): void {
    const strategies: OptimizationStrategy[] = [];

    // Cache optimization
    if (profile.cacheHitRate < 0.5) {
      strategies.push({
        type: 'cache',
        description: 'Implement intelligent caching for similar requests',
        expectedImprovement: (0.5 - profile.cacheHitRate) * 0.8,
        priority: 'high'
      });
    }

    // Response time optimization
    if (profile.avgResponseTime > 3000) {
      strategies.push({
        type: 'parallel',
        description: 'Use parallel processing for independent operations',
        expectedImprovement: 0.3,
        priority: 'high'
      });
    }

    // Memory optimization
    if (profile.memoryUsage > 50 * 1024 * 1024) { // 50MB
      strategies.push({
        type: 'compress',
        description: 'Implement response compression and memory cleanup',
        expectedImprovement: 0.4,
        priority: 'medium'
      });
    }

    // Workload balancing
    if (profile.workloadScore > 0.8) {
      strategies.push({
        type: 'throttle',
        description: 'Implement request throttling and queue management',
        expectedImprovement: 0.2,
        priority: 'medium'
      });
    }

    // Token efficiency
    if (profile.tokenEfficiency > 1000) { // High token usage
      strategies.push({
        type: 'compress',
        description: 'Optimize prompts and reduce token consumption',
        expectedImprovement: 0.25,
        priority: 'low'
      });
    }

    this.optimizationStrategies.set(agentId, strategies);
  }

  /**
   * Optimize agent request based on current performance profile
   */
  async optimizeRequest(
    agentId: string, 
    request: string, 
    context: any,
    agent: BaseSpecializedAgent
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const profile = this.agentProfiles.get(agentId);

    try {
      // Apply optimization strategies
      const optimizedRequest = await this.applyOptimizations(agentId, request, context, profile);
      
      // Execute request with monitoring
      const response = await this.executeWithMonitoring(agent, optimizedRequest.request, optimizedRequest.context);
      
      // Record performance
      const processingTime = Date.now() - startTime;
      this.recordPerformance(agentId, {
        processingTime,
        memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
        apiCalls: 1,
        cacheHits: optimizedRequest.fromCache ? 1 : 0,
        tokenCount: response.content.length / 4 // Rough estimate
      });

      return response;

    } catch (error) {
      // Record failed performance
      this.recordPerformance(agentId, {
        processingTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
        apiCalls: 1,
        cacheHits: 0,
        tokenCount: 0
      });

      throw error;
    }
  }

  /**
   * Apply optimization strategies to a request
   */
  private async applyOptimizations(
    agentId: string,
    request: string,
    context: any,
    profile?: PerformanceProfile
  ): Promise<{ request: string; context: any; fromCache: boolean }> {
    let optimizedRequest = request;
    const optimizedContext = { ...context };
    let fromCache = false;

    // Cache optimization
    const cacheKey = this.generateCacheKey(agentId, request, context);
    const cachedResponse = this.responseCache.get(cacheKey);
    
    if (cachedResponse && this.isCacheValid(cachedResponse)) {
      // Update cache hit count
      cachedResponse.hits++;
      fromCache = true;
      return { request: optimizedRequest, context: optimizedContext, fromCache };
    }

    // Request compression/optimization
    if (profile && profile.tokenEfficiency > 800) {
      optimizedRequest = this.compressRequest(request);
    }

    // Context enrichment based on performance
    if (profile && profile.cacheHitRate > 0.7) {
      // Add cache-friendly context
      optimizedContext._cacheOptimized = true;
    }

    return { request: optimizedRequest, context: optimizedContext, fromCache };
  }

  /**
   * Execute request with performance monitoring
   */
  private async executeWithMonitoring(
    agent: BaseSpecializedAgent,
    request: string,
    context: any
  ): Promise<AgentResponse> {
    const memoryBefore = process.memoryUsage?.()?.heapUsed || 0;
    
    try {
      const response = await agent.process(request, context);
      
      // Cache successful responses
      const cacheKey = this.generateCacheKey(agent.getName(), request, context);
      this.responseCache.set(cacheKey, {
        response,
        timestamp: new Date(),
        hits: 0
      });

      // Clean up old cache entries
      this.cleanupCache();

      return response;

    } finally {
      const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;
      const memoryDelta = memoryAfter - memoryBefore;
      
      if (memoryDelta > 10 * 1024 * 1024) { // 10MB increase
        logger.warn(`High memory usage detected for agent ${agent.getName()}: ${Math.round(memoryDelta / 1024 / 1024)}MB`);
      }
    }
  }

  /**
   * Batch process multiple requests for efficiency
   */
  async batchProcess(
    requests: Array<{
      agentId: string;
      agent: BaseSpecializedAgent;
      request: string;
      context: any;
    }>
  ): Promise<Map<string, AgentResponse>> {
    const results = new Map<string, AgentResponse>();

    // Group by agent for batch processing
    const agentGroups = new Map<string, typeof requests>();
    requests.forEach(req => {
      if (!agentGroups.has(req.agentId)) {
        agentGroups.set(req.agentId, []);
      }
      agentGroups.get(req.agentId)!.push(req);
    });

    // Process each agent's requests
    const promises = Array.from(agentGroups.entries()).map(async ([agentId, agentRequests]) => {
      const batchResults = await Promise.allSettled(
        agentRequests.map(async (req, index) => {
          const requestId = `${agentId}_${index}`;
          try {
            const response = await this.optimizeRequest(req.agentId, req.request, req.context, req.agent);
            return { requestId, response };
          } catch (error) {
            logger.error(`Batch request failed for ${requestId}:`, error);
            return { requestId, error };
          }
        })
      );

      return batchResults;
    });

    const allResults = await Promise.all(promises);
    
    // Collect results
    allResults.flat().forEach(result => {
      if (result.status === 'fulfilled' && result.value.response) {
        results.set(result.value.requestId, result.value.response);
      }
    });

    return results;
  }

  /**
   * Utility methods
   */
  private generateCacheKey(agentId: string, request: string, context: any): string {
    const contextKey = [
      context.currentFile,
      context.selectedText?.substring(0, 100),
      context.projectType
    ].filter(Boolean).join('|');
    
    return `${agentId}:${request.substring(0, 200)}:${contextKey}`.replace(/\s+/g, '_');
  }

  private isCacheValid(cachedEntry: { timestamp: Date }): boolean {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    return (Date.now() - cachedEntry.timestamp.getTime()) < maxAge;
  }

  private compressRequest(request: string): string {
    // Simple request compression - remove redundant words
    return request
      .replace(/\b(please|kindly|could you|would you)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanupCache(): void {
    if (this.responseCache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.responseCache.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Keep newest 500 entries
      entries.slice(0, entries.length - 500).forEach(([key]) => {
        this.responseCache.delete(key);
      });
    }
  }

  private startPerformanceMonitoring(): void {
    // Monitor system performance every 30 seconds
    setInterval(() => {
      this.emit('performanceUpdate', {
        cacheSize: this.responseCache.size,
        totalProfiles: this.agentProfiles.size,
        recentAlerts: this.performanceAlerts.filter(a => 
          Date.now() - a.timestamp.getTime() < 5 * 60 * 1000
        ).length
      });
    }, 30000);
  }

  /**
   * Public interface methods
   */
  getAgentProfile(agentId: string): PerformanceProfile | undefined {
    return this.agentProfiles.get(agentId);
  }

  getOptimizationStrategies(agentId: string): OptimizationStrategy[] {
    return this.optimizationStrategies.get(agentId) || [];
  }

  getRecentAlerts(agentId?: string): PerformanceAlert[] {
    const recent = this.performanceAlerts.filter(a => 
      Date.now() - a.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );
    
    return agentId ? recent.filter(a => a.agentId === agentId) : recent;
  }

  getPerformanceReport(): {
    totalAgents: number;
    avgResponseTime: number;
    cacheEfficiency: number;
    memoryUsage: number;
    activeAlerts: number;
  } {
    const profiles = Array.from(this.agentProfiles.values());
    
    return {
      totalAgents: profiles.length,
      avgResponseTime: profiles.reduce((sum, p) => sum + p.avgResponseTime, 0) / Math.max(profiles.length, 1),
      cacheEfficiency: profiles.reduce((sum, p) => sum + p.cacheHitRate, 0) / Math.max(profiles.length, 1),
      memoryUsage: profiles.reduce((sum, p) => sum + p.memoryUsage, 0),
      activeAlerts: this.getRecentAlerts().length
    };
  }

  /**
   * Reset performance data for testing
   */
  reset(): void {
    this.performanceHistory.clear();
    this.agentProfiles.clear();
    this.requestQueue.clear();
    this.responseCache.clear();
    this.optimizationStrategies.clear();
    this.performanceAlerts = [];
  }
}