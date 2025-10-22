/**
 * AgentHookSystem - Lifecycle hooks for agent execution
 * Provides pre/post/error hooks for agent lifecycle management
 */
import { logger } from '../services/Logger';

export type HookFunction = (context: any) => Promise<boolean | void> | boolean | void;

export interface HookExecutionResult {
  shouldContinue: boolean;
  error?: Error;
  errors?: Error[];
}

export interface AgentHookSystemConfig {
  continueOnError?: boolean;
}

export class AgentHookSystem {
  private preHooks: Map<string, HookFunction[]> = new Map();
  private postHooks: Map<string, HookFunction[]> = new Map();
  private errorHooks: Map<string, HookFunction[]> = new Map();
  private globalPreHooks: HookFunction[] = [];
  private globalPostHooks: HookFunction[] = [];
  private globalErrorHooks: HookFunction[] = [];
  private config: AgentHookSystemConfig;

  constructor(config: AgentHookSystemConfig = {}) {
    this.config = {
      continueOnError: false,
      ...config
    };
  }

  /**
   * Register pre-execution hook
   */
  registerPreHook(agentId: string, hook: HookFunction): void {
    if (!this.preHooks.has(agentId)) {
      this.preHooks.set(agentId, []);
    }
    this.preHooks.get(agentId)!.push(hook);
  }

  /**
   * Register post-execution hook
   */
  registerPostHook(agentId: string, hook: HookFunction): void {
    if (!this.postHooks.has(agentId)) {
      this.postHooks.set(agentId, []);
    }
    this.postHooks.get(agentId)!.push(hook);
  }

  /**
   * Register error hook
   */
  registerErrorHook(agentId: string, hook: HookFunction): void {
    if (!this.errorHooks.has(agentId)) {
      this.errorHooks.set(agentId, []);
    }
    this.errorHooks.get(agentId)!.push(hook);
  }

  /**
   * Register global pre-hook (runs for all agents)
   */
  registerGlobalPreHook(hook: HookFunction): void {
    this.globalPreHooks.push(hook);
  }

  /**
   * Register global post-hook (runs for all agents)
   */
  registerGlobalPostHook(hook: HookFunction): void {
    this.globalPostHooks.push(hook);
  }

  /**
   * Register global error hook (runs for all agents)
   */
  registerGlobalErrorHook(hook: HookFunction): void {
    this.globalErrorHooks.push(hook);
  }

  /**
   * Get pre-hooks for agent (includes global hooks)
   */
  getPreHooks(agentId: string): HookFunction[] {
    const agentHooks = this.preHooks.get(agentId) || [];
    return [...this.globalPreHooks, ...agentHooks];
  }

  /**
   * Get post-hooks for agent (includes global hooks)
   */
  getPostHooks(agentId: string): HookFunction[] {
    const agentHooks = this.postHooks.get(agentId) || [];
    return [...this.globalPostHooks, ...agentHooks];
  }

  /**
   * Get error hooks for agent (includes global hooks)
   */
  getErrorHooks(agentId: string): HookFunction[] {
    const agentHooks = this.errorHooks.get(agentId) || [];
    return [...this.globalErrorHooks, ...agentHooks];
  }

  /**
   * Execute pre-hooks
   */
  async executePreHooks(agentId: string, context: any): Promise<HookExecutionResult> {
    const hooks = this.getPreHooks(agentId);
    return this.executeHooks(hooks, context);
  }

  /**
   * Execute post-hooks
   */
  async executePostHooks(agentId: string, context: any): Promise<HookExecutionResult> {
    const hooks = this.getPostHooks(agentId);
    return this.executeHooks(hooks, context);
  }

  /**
   * Execute error hooks
   */
  async executeErrorHooks(agentId: string, error: Error, context: any): Promise<HookExecutionResult> {
    const hooks = this.getErrorHooks(agentId);
    const errorContext = { ...context, error };
    return this.executeHooks(hooks, errorContext);
  }

  /**
   * Execute hook chain
   */
  private async executeHooks(hooks: HookFunction[], context: any): Promise<HookExecutionResult> {
    const errors: Error[] = [];

    for (const hook of hooks) {
      try {
        const result = await hook(context);

        // If hook returns false, stop execution
        if (result === false) {
          return {
            shouldContinue: false
          };
        }
      } catch (error) {
        errors.push(error as Error);

        // If not configured to continue on error, stop immediately
        if (!this.config.continueOnError) {
          return {
            shouldContinue: false,
            error: error as Error
          };
        }
      }
    }

    return {
      shouldContinue: true,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Unregister specific pre-hook
   */
  unregisterPreHook(agentId: string, hook: HookFunction): void {
    const hooks = this.preHooks.get(agentId);
    if (hooks) {
      const index = hooks.indexOf(hook);
      if (index !== -1) {
        hooks.splice(index, 1);
      }
    }
  }

  /**
   * Unregister specific post-hook
   */
  unregisterPostHook(agentId: string, hook: HookFunction): void {
    const hooks = this.postHooks.get(agentId);
    if (hooks) {
      const index = hooks.indexOf(hook);
      if (index !== -1) {
        hooks.splice(index, 1);
      }
    }
  }

  /**
   * Unregister specific error hook
   */
  unregisterErrorHook(agentId: string, hook: HookFunction): void {
    const hooks = this.errorHooks.get(agentId);
    if (hooks) {
      const index = hooks.indexOf(hook);
      if (index !== -1) {
        hooks.splice(index, 1);
      }
    }
  }

  /**
   * Clear all hooks for agent
   */
  clearHooks(agentId: string): void {
    this.preHooks.delete(agentId);
    this.postHooks.delete(agentId);
    this.errorHooks.delete(agentId);
  }

  /**
   * Clear all global hooks
   */
  clearGlobalHooks(): void {
    this.globalPreHooks = [];
    this.globalPostHooks = [];
    this.globalErrorHooks = [];
  }

  /**
   * Create validation hook
   */
  createValidationHook(validator: (context: any) => boolean): HookFunction {
    return async (context: any) => {
      const isValid = validator(context);
      if (!isValid) {
        return false;
      }
      return true;
    };
  }

  /**
   * Create logging hook
   */
  createLoggingHook(logger: (message: string, context: any) => void): HookFunction {
    return async (context: any) => {
      const message = `Agent ${context.agentId} executed`;
      logger(message, context);
      return true;
    };
  }

  /**
   * Create timing hook
   */
  createTimingHook(): HookFunction {
    return async (context: any) => {
      context.startTime = performance.now();
      return true;
    };
  }

  /**
   * Create resource cleanup hook
   */
  createCleanupHook(cleanup: (context: any) => Promise<void>): HookFunction {
    return async (context: any) => {
      try {
        await cleanup(context);
        return true;
      } catch (error) {
        logger.error('Cleanup failed:', error);
        return true; // Continue even if cleanup fails
      }
    };
  }

  /**
   * Create retry hook
   */
  createRetryHook(maxRetries: number = 3): HookFunction {
    return async (context: any) => {
      if (!context.retryCount) {
        context.retryCount = 0;
      }

      if (context.error && context.retryCount < maxRetries) {
        context.retryCount++;
        context.shouldRetry = true;
        return true;
      }

      context.shouldRetry = false;
      return true;
    };
  }

  /**
   * Create notification hook
   */
  createNotificationHook(notify: (context: any) => void): HookFunction {
    return async (context: any) => {
      notify(context);
      return true;
    };
  }

  /**
   * Create rate limiting hook
   */
  createRateLimitHook(maxRequestsPerMinute: number): HookFunction {
    const timestamps: number[] = [];

    return async (context: any) => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      // Remove old timestamps
      while (timestamps.length > 0 && timestamps[0] < oneMinuteAgo) {
        timestamps.shift();
      }

      // Check rate limit
      if (timestamps.length >= maxRequestsPerMinute) {
        context.rateLimitExceeded = true;
        return false;
      }

      timestamps.push(now);
      return true;
    };
  }

  /**
   * Create caching hook
   */
  createCachingHook(cache: Map<string, any>): HookFunction {
    return async (context: any) => {
      const cacheKey = `${context.agentId}:${JSON.stringify(context.task)}`;

      // Check cache on pre-execution
      if (cache.has(cacheKey)) {
        context.cachedResult = cache.get(cacheKey);
        context.fromCache = true;
        return false; // Skip execution, use cached result
      }

      // Store result on post-execution
      if (context.result) {
        cache.set(cacheKey, context.result);
      }

      return true;
    };
  }
}
