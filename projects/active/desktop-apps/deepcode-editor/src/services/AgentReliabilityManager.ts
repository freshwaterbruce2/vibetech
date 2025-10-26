/**
 * Agent Reliability Manager - Enhanced error handling, recovery, and system reliability
 */
import { EventEmitter } from '../utils/EventEmitter';
import { logger } from '../utils/logger';

import { AgentContext, AgentResponse,BaseSpecializedAgent } from './specialized-agents/BaseSpecializedAgent';

export interface AgentHealthStatus {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastResponseTime: number;
  errorRate: number;
  consecutiveFailures: number;
  lastHealthCheck: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  type: 'timeout' | 'memory_leak' | 'high_error_rate' | 'resource_exhaustion' | 'dependency_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  firstOccurred: Date;
  lastOccurred: Date;
  occurrenceCount: number;
  autoResolve: boolean;
}

export interface RecoveryStrategy {
  type: 'retry' | 'circuit_breaker' | 'fallback' | 'restart' | 'load_balance';
  condition: (error: Error, context: any) => boolean;
  execute: (agent: BaseSpecializedAgent, request: string, context: AgentContext) => Promise<AgentResponse>;
  maxAttempts: number;
  backoffMs: number;
}

export interface ReliabilityMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Recovery
}

/**
 * Comprehensive reliability management system for multi-agent coordination
 */
export class AgentReliabilityManager extends EventEmitter {
  private healthStatuses: Map<string, AgentHealthStatus> = new Map();
  private recoveryStrategies: RecoveryStrategy[] = [];
  private failureHistory: Map<string, Array<{
    timestamp: Date;
    error: string;
    context: any;
    recovered: boolean;
    recoveryTime?: number;
  }>> = new Map();
  private circuitBreakers: Map<string, {
    isOpen: boolean;
    failureCount: number;
    lastFailureTime: Date;
    halfOpenTime?: Date;
  }> = new Map();
  private reliabilityMetrics: Map<string, ReliabilityMetrics> = new Map();
  private startTime = Date.now();

  // Health check configuration
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor() {
    super();
    this.initializeRecoveryStrategies();
    this.startHealthMonitoring();
  }

  /**
   * Initialize built-in recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Retry strategy for transient failures
    this.recoveryStrategies.push({
      type: 'retry',
      condition: (error: Error) => {
        return error.message.includes('timeout') || 
               error.message.includes('network') ||
               error.message.includes('temporary');
      },
      execute: async (agent: BaseSpecializedAgent, request: string, context: AgentContext) => {
        // Simple retry with exponential backoff
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            if (attempt > 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            return await agent.process(request, context);
          } catch (error) {
            lastError = error as Error;
            logger.warn(`Retry attempt ${attempt} failed for agent ${agent.getName()}: ${error}`);
          }
        }
        throw lastError;
      },
      maxAttempts: 3,
      backoffMs: 1000
    });

    // Circuit breaker for repeated failures
    this.recoveryStrategies.push({
      type: 'circuit_breaker',
      condition: (error: Error) => {
        return error.message.includes('service unavailable') ||
               error.message.includes('connection refused');
      },
      execute: async (agent: BaseSpecializedAgent, request: string, context: AgentContext) => {
        const agentId = agent.getName();
        const breaker = this.circuitBreakers.get(agentId);
        
        if (breaker?.isOpen) {
          if (breaker.halfOpenTime && Date.now() > breaker.halfOpenTime.getTime()) {
            // Half-open state: try one request
            try {
              const response = await agent.process(request, context);
              this.resetCircuitBreaker(agentId);
              return response;
            } catch (error) {
              this.openCircuitBreaker(agentId);
              throw new Error(`Circuit breaker open for agent ${agentId}: ${error}`);
            }
          } else {
            throw new Error(`Circuit breaker open for agent ${agentId}`);
          }
        }

        return await agent.process(request, context);
      },
      maxAttempts: 1,
      backoffMs: 0
    });

    // Fallback strategy using simplified request
    this.recoveryStrategies.push({
      type: 'fallback',
      condition: (error: Error) => {
        return error.message.includes('complexity') ||
               error.message.includes('resource');
      },
      execute: async (agent: BaseSpecializedAgent, request: string, context: AgentContext) => {
        // Simplify the request and context
        const simplifiedRequest = this.simplifyRequest(request);
        const simplifiedContext = this.simplifyContext(context);
        
        logger.info(`Using fallback strategy for agent ${agent.getName()}`);
        
        try {
          const response = await agent.process(simplifiedRequest, simplifiedContext);
          return {
            ...response,
            content: `[Simplified Response] ${response.content}`,
            confidence: Math.max(0.3, response.confidence - 0.2)
          };
        } catch (error) {
          // Ultimate fallback: return a basic response
          return {
            content: `I apologize, but I'm experiencing technical difficulties. Please try a simpler request or contact support.`,
            confidence: 0.2,
            reasoning: 'Fallback response due to agent failure'
          };
        }
      },
      maxAttempts: 1,
      backoffMs: 0
    });
  }

  /**
   * Execute agent request with comprehensive error handling and recovery
   */
  async executeWithReliability(
    agent: BaseSpecializedAgent,
    request: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const agentId = agent.getName();
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen(agentId)) {
        throw new Error(`Circuit breaker open for agent ${agentId}`);
      }

      // Update health status
      this.updateHealthStatus(agentId, 'attempting');

      // Execute request
      const response = await agent.process(request, context);
      
      // Record success
      this.recordSuccess(agentId, Date.now() - startTime);
      this.resetConsecutiveFailures(agentId);

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorObj = error as Error;

      // Record failure
      this.recordFailure(agentId, errorObj, context, processingTime);

      // Try recovery strategies
      for (const strategy of this.recoveryStrategies) {
        if (strategy.condition(errorObj, context)) {
          try {
            logger.info(`Applying ${strategy.type} recovery strategy for agent ${agentId}`);
            const recoveredResponse = await strategy.execute(agent, request, context);
            
            // Record recovery success
            this.recordRecovery(agentId, strategy.type, Date.now() - startTime);
            
            return recoveredResponse;
          } catch (recoveryError) {
            logger.warn(`Recovery strategy ${strategy.type} failed for agent ${agentId}: ${recoveryError}`);
          }
        }
      }

      // Update circuit breaker
      this.updateCircuitBreaker(agentId, errorObj);

      // Update health status
      this.updateHealthStatus(agentId, 'failed', errorObj);

      // If all recovery strategies failed, throw the original error
      throw errorObj;
    }
  }

  /**
   * Record successful agent execution
   */
  private recordSuccess(agentId: string, responseTime: number): void {
    const metrics = this.getOrCreateMetrics(agentId);
    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (metrics.totalRequests - 1)) + responseTime
    ) / metrics.totalRequests;

    this.reliabilityMetrics.set(agentId, metrics);
  }

  /**
   * Record failed agent execution
   */
  private recordFailure(agentId: string, error: Error, context: any, _responseTime: number): void {
    const metrics = this.getOrCreateMetrics(agentId);
    metrics.totalRequests++;
    metrics.failedRequests++;

    // Record in failure history
    if (!this.failureHistory.has(agentId)) {
      this.failureHistory.set(agentId, []);
    }

    const history = this.failureHistory.get(agentId)!;
    history.push({
      timestamp: new Date(),
      error: error.message,
      context,
      recovered: false
    });

    // Keep only recent failures (last 100)
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.reliabilityMetrics.set(agentId, metrics);
    
    // Update health status
    const health = this.healthStatuses.get(agentId);
    if (health) {
      health.consecutiveFailures++;
      health.errorRate = metrics.failedRequests / metrics.totalRequests;
    }
  }

  /**
   * Record successful recovery
   */
  private recordRecovery(agentId: string, strategyType: string, totalTime: number): void {
    const history = this.failureHistory.get(agentId);
    if (history && history.length > 0) {
      const lastFailure = history[history.length - 1];
      if (lastFailure) {
        lastFailure.recovered = true;
        lastFailure.recoveryTime = totalTime;
      }
    }

    logger.info(`Successfully recovered agent ${agentId} using ${strategyType} strategy in ${totalTime}ms`);
    
    this.emit('agentRecovered', {
      agentId,
      strategy: strategyType,
      recoveryTime: totalTime
    });
  }

  /**
   * Update health status for an agent
   */
  private updateHealthStatus(agentId: string, event: 'attempting' | 'failed', error?: Error): void {
    if (!this.healthStatuses.has(agentId)) {
      this.healthStatuses.set(agentId, {
        agentId,
        status: 'healthy',
        lastResponseTime: 0,
        errorRate: 0,
        consecutiveFailures: 0,
        lastHealthCheck: new Date(),
        issues: []
      });
    }

    const health = this.healthStatuses.get(agentId)!;
    health.lastHealthCheck = new Date();

    if (event === 'failed' && error) {
      health.consecutiveFailures++;
      
      // Determine health status
      if (health.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        health.status = 'unhealthy';
      } else if (health.errorRate > 0.2) {
        health.status = 'degraded';
      }

      // Add health issue
      const issueType = this.categorizeError(error);
      this.addHealthIssue(health, issueType, error.message);
    }

    this.emit('healthStatusUpdated', { agentId, health });
  }

  /**
   * Add or update health issue
   */
  private addHealthIssue(health: AgentHealthStatus, type: HealthIssue['type'], description: string): void {
    const existingIssue = health.issues.find(issue => issue.type === type);
    
    if (existingIssue) {
      existingIssue.lastOccurred = new Date();
      existingIssue.occurrenceCount++;
    } else {
      health.issues.push({
        type,
        severity: this.getSeverityForIssueType(type),
        description,
        firstOccurred: new Date(),
        lastOccurred: new Date(),
        occurrenceCount: 1,
        autoResolve: this.canAutoResolve(type)
      });
    }
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerOpen(agentId: string): boolean {
    const breaker = this.circuitBreakers.get(agentId);
    return breaker?.isOpen || false;
  }

  private updateCircuitBreaker(agentId: string, _error: Error): void {
    if (!this.circuitBreakers.has(agentId)) {
      this.circuitBreakers.set(agentId, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: new Date()
      });
    }

    const breaker = this.circuitBreakers.get(agentId)!;
    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.openCircuitBreaker(agentId);
    }
  }

  private openCircuitBreaker(agentId: string): void {
    const breaker = this.circuitBreakers.get(agentId);
    if (breaker) {
      breaker.isOpen = true;
      breaker.halfOpenTime = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT);
      
      logger.warn(`Circuit breaker opened for agent ${agentId}`);
      this.emit('circuitBreakerOpened', { agentId });
    }
  }

  private resetCircuitBreaker(agentId: string): void {
    const breaker = this.circuitBreakers.get(agentId);
    if (breaker) {
      breaker.isOpen = false;
      breaker.failureCount = 0;
      delete breaker.halfOpenTime;
      
      logger.info(`Circuit breaker reset for agent ${agentId}`);
      this.emit('circuitBreakerReset', { agentId });
    }
  }

  private resetConsecutiveFailures(agentId: string): void {
    const health = this.healthStatuses.get(agentId);
    if (health) {
      health.consecutiveFailures = 0;
      if (health.status === 'unhealthy' || health.status === 'degraded') {
        health.status = 'healthy';
      }
    }
  }

  /**
   * Utility methods
   */
  private getOrCreateMetrics(agentId: string): ReliabilityMetrics {
    if (!this.reliabilityMetrics.has(agentId)) {
      this.reliabilityMetrics.set(agentId, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        uptime: 1.0,
        mtbf: 0,
        mttr: 0
      });
    }
    return this.reliabilityMetrics.get(agentId)!;
  }

  private categorizeError(error: Error): HealthIssue['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) {return 'timeout';}
    if (message.includes('memory') || message.includes('heap')) {return 'memory_leak';}
    if (message.includes('resource') || message.includes('limit')) {return 'resource_exhaustion';}
    if (message.includes('connection') || message.includes('network')) {return 'dependency_failure';}
    
    return 'high_error_rate';
  }

  private getSeverityForIssueType(type: HealthIssue['type']): HealthIssue['severity'] {
    switch (type) {
      case 'memory_leak':
      case 'resource_exhaustion':
        return 'critical';
      case 'timeout':
      case 'dependency_failure':
        return 'high';
      case 'high_error_rate':
        return 'medium';
      default:
        return 'low';
    }
  }

  private canAutoResolve(type: HealthIssue['type']): boolean {
    return ['timeout', 'dependency_failure'].includes(type);
  }

  private simplifyRequest(request: string): string {
    // Simplify complex requests for fallback
    return request.length > 500 ? `${request.substring(0, 500)  }...` : request;
  }

  private simplifyContext(context: AgentContext): AgentContext {
    // Remove complex context for fallback
    return {
      ...(context.currentFile && { currentFile: context.currentFile }),
      ...(context.workspaceRoot && { workspaceRoot: context.workspaceRoot }),
      // Remove heavy context like sessionHistory, relatedFiles, etc.
    };
  }

  /**
   * Health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthChecks();
      this.calculateReliabilityMetrics();
      this.cleanupOldData();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private performHealthChecks(): void {
    for (const [agentId, health] of this.healthStatuses.entries()) {
      // Auto-resolve issues that can be resolved
      health.issues = health.issues.filter(issue => {
        if (issue.autoResolve && 
            Date.now() - issue.lastOccurred.getTime() > 5 * 60 * 1000) { // 5 minutes
          logger.info(`Auto-resolved issue ${issue.type} for agent ${agentId}`);
          return false;
        }
        return true;
      });

      // Update health status based on current conditions
      if (health.issues.length === 0 && health.consecutiveFailures === 0) {
        health.status = 'healthy';
      }
    }
  }

  private calculateReliabilityMetrics(): void {
    const _uptime = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours

    for (const [agentId, metrics] of this.reliabilityMetrics.entries()) {
      const history = this.failureHistory.get(agentId) || [];
      
      // Calculate MTBF (Mean Time Between Failures)
      if (history.length > 1) {
        const intervals = [];
        for (let i = 1; i < history.length; i++) {
          const current = history[i];
          const previous = history[i-1];
          if (current && previous) {
            intervals.push(current.timestamp.getTime() - previous.timestamp.getTime());
          }
        }
        metrics.mtbf = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / 1000 / 60; // minutes
      }

      // Calculate MTTR (Mean Time To Recovery)
      const recoveredFailures = history.filter(f => f.recovered && f.recoveryTime);
      if (recoveredFailures.length > 0) {
        metrics.mttr = recoveredFailures.reduce((sum, f) => sum + (f.recoveryTime || 0), 0) / recoveredFailures.length / 1000; // seconds
      }

      // Update uptime
      metrics.uptime = metrics.totalRequests > 0 ? metrics.successfulRequests / metrics.totalRequests : 1.0;
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    // Clean up failure history
    for (const [agentId, history] of this.failureHistory.entries()) {
      const filteredHistory = history.filter(f => f.timestamp.getTime() > cutoffTime);
      this.failureHistory.set(agentId, filteredHistory);
    }

    // Clean up old health issues
    for (const health of this.healthStatuses.values()) {
      health.issues = health.issues.filter(issue => 
        issue.lastOccurred.getTime() > cutoffTime
      );
    }
  }

  /**
   * Public interface methods
   */
  getAgentHealth(agentId: string): AgentHealthStatus | undefined {
    return this.healthStatuses.get(agentId);
  }

  getAllAgentHealth(): Map<string, AgentHealthStatus> {
    return new Map(this.healthStatuses);
  }

  getReliabilityMetrics(agentId: string): ReliabilityMetrics | undefined {
    return this.reliabilityMetrics.get(agentId);
  }

  getSystemReliabilityReport(): {
    totalAgents: number;
    healthyAgents: number;
    degradedAgents: number;
    unhealthyAgents: number;
    overallUptime: number;
    totalFailures: number;
    avgMTBF: number;
    avgMTTR: number;
  } {
    const agents = Array.from(this.healthStatuses.values());
    const metrics = Array.from(this.reliabilityMetrics.values());

    return {
      totalAgents: agents.length,
      healthyAgents: agents.filter(a => a.status === 'healthy').length,
      degradedAgents: agents.filter(a => a.status === 'degraded').length,
      unhealthyAgents: agents.filter(a => a.status === 'unhealthy').length,
      overallUptime: metrics.reduce((sum, m) => sum + m.uptime, 0) / Math.max(metrics.length, 1),
      totalFailures: metrics.reduce((sum, m) => sum + m.failedRequests, 0),
      avgMTBF: metrics.reduce((sum, m) => sum + m.mtbf, 0) / Math.max(metrics.length, 1),
      avgMTTR: metrics.reduce((sum, m) => sum + m.mttr, 0) / Math.max(metrics.length, 1)
    };
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    logger.info(`Added custom recovery strategy: ${strategy.type}`);
  }

  /**
   * Force health check for specific agent
   */
  async forceHealthCheck(agentId: string): Promise<AgentHealthStatus> {
    // Perform immediate health check
    this.performHealthChecks();
    return this.getAgentHealth(agentId) || {
      agentId,
      status: 'offline',
      lastResponseTime: 0,
      errorRate: 1,
      consecutiveFailures: 999,
      lastHealthCheck: new Date(),
      issues: []
    };
  }

  /**
   * Reset all reliability data
   */
  reset(): void {
    this.healthStatuses.clear();
    this.failureHistory.clear();
    this.circuitBreakers.clear();
    this.reliabilityMetrics.clear();
    this.startTime = Date.now();
  }
}