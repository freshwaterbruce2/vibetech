/**
 * AgentMonitoringService
 * Integrates AgentMonitor with AgentHookSystem to automatically track agent performance
 */

import { AgentMonitor } from './AgentMonitor';
import { AgentHookSystem } from './AgentHookSystem';
import { logger } from './Logger';

export class AgentMonitoringService {
  private monitor: AgentMonitor;
  private hookSystem: AgentHookSystem;
  private isInitialized: boolean = false;

  constructor(hookSystem: AgentHookSystem, monitor?: AgentMonitor) {
    this.hookSystem = hookSystem;
    this.monitor = monitor || new AgentMonitor();
  }

  /**
   * Initialize monitoring hooks
   */
  initialize(): void {
    if (this.isInitialized) {
      logger.warn('AgentMonitoringService already initialized');
      return;
    }

    this.registerHooks();
    this.isInitialized = true;
    logger.info('AgentMonitoringService initialized');
  }

  /**
   * Get the underlying monitor instance
   */
  getMonitor(): AgentMonitor {
    return this.monitor;
  }

  private registerHooks(): void {
    // Pre-execution hook: Record start time
    this.hookSystem.registerGlobalPreHook(async (context: any) => {
      if (!context.agentId) return;
      
      // Store start time in context if not already present
      if (!context.startTime) {
        context.startTime = Date.now();
      }
    });

    // Post-execution hook: Record success
    this.hookSystem.registerGlobalPostHook(async (context: any) => {
      if (!context.agentId || !context.startTime) return;

      const endTime = Date.now();
      
      this.monitor.recordExecution(context.agentId, {
        startTime: context.startTime,
        endTime,
        success: true,
        // Result size could be interesting metric if available
        // resultSize: context.result ? JSON.stringify(context.result).length : 0
      });
    });

    // Error hook: Record failure
    this.hookSystem.registerGlobalErrorHook(async (context: any) => {
      if (!context.agentId) return;

      const endTime = Date.now();
      const startTime = context.startTime || (endTime - 1000); // Fallback if start time missing
      
      this.monitor.recordExecution(context.agentId, {
        startTime,
        endTime,
        success: false,
        error: context.error || new Error('Unknown error'),
      });
    });
  }

  /**
   * Dispose service and unregister hooks
   * Note: AgentHookSystem doesn't currently support unregistering global hooks easily by reference
   * so we might need to enhance AgentHookSystem if full cleanup is required.
   * For now, this is a singleton service so cleanup is less critical.
   */
  dispose(): void {
    // Implementation depends on if we need to detach hooks dynamically
  }
}
