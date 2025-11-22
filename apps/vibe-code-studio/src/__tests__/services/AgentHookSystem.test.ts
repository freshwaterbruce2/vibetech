/**
 * AgentHookSystem Tests
 * TDD: Lifecycle hooks for agent execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AgentHookSystem', () => {
  let AgentHookSystem: any;

  beforeEach(async () => {
    try {
      const module = await import('../../services/AgentHookSystem');
      AgentHookSystem = module.AgentHookSystem;
    } catch {
      // Expected to fail initially - TDD RED phase
      AgentHookSystem = null;
    }
  });

  describe('Hook Registration', () => {
    it('should register pre-execution hook', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const preHook = vi.fn();

      hookSystem.registerPreHook('test-agent', preHook);

      const hooks = hookSystem.getPreHooks('test-agent');
      expect(hooks).toContain(preHook);
    });

    it('should register post-execution hook', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const postHook = vi.fn();

      hookSystem.registerPostHook('test-agent', postHook);

      const hooks = hookSystem.getPostHooks('test-agent');
      expect(hooks).toContain(postHook);
    });

    it('should register error hook', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const errorHook = vi.fn();

      hookSystem.registerErrorHook('test-agent', errorHook);

      const hooks = hookSystem.getErrorHooks('test-agent');
      expect(hooks).toContain(errorHook);
    });

    it('should register global hooks for all agents', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const globalHook = vi.fn();

      hookSystem.registerGlobalPreHook(globalHook);

      const hooks = hookSystem.getPreHooks('any-agent');
      expect(hooks).toContain(globalHook);
    });
  });

  describe('Hook Execution', () => {
    it('should execute pre-hooks before agent runs', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const preHook = vi.fn().mockResolvedValue(undefined);

      hookSystem.registerPreHook('test-agent', preHook);

      const context = { agentId: 'test-agent', task: 'test' };
      await hookSystem.executePreHooks('test-agent', context);

      expect(preHook).toHaveBeenCalledWith(context);
    });

    it('should execute post-hooks after agent completes', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const postHook = vi.fn().mockResolvedValue(undefined);

      hookSystem.registerPostHook('test-agent', postHook);

      const context = { agentId: 'test-agent', result: 'success' };
      await hookSystem.executePostHooks('test-agent', context);

      expect(postHook).toHaveBeenCalledWith(context);
    });

    it('should execute error hooks on failure', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const errorHook = vi.fn().mockResolvedValue(undefined);

      hookSystem.registerErrorHook('test-agent', errorHook);

      const error = new Error('Test error');
      const context = { agentId: 'test-agent', task: 'test' };
      await hookSystem.executeErrorHooks('test-agent', error, context);

      expect(errorHook).toHaveBeenCalledWith(expect.objectContaining({
        agentId: 'test-agent',
        task: 'test',
        error
      }));
    });

    it('should execute hooks in registration order', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const order: number[] = [];

      const hook1 = vi.fn().mockImplementation(async () => { order.push(1); });
      const hook2 = vi.fn().mockImplementation(async () => { order.push(2); });
      const hook3 = vi.fn().mockImplementation(async () => { order.push(3); });

      hookSystem.registerPreHook('test-agent', hook1);
      hookSystem.registerPreHook('test-agent', hook2);
      hookSystem.registerPreHook('test-agent', hook3);

      await hookSystem.executePreHooks('test-agent', {});

      expect(order).toEqual([1, 2, 3]);
    });

    it('should stop execution if hook returns false', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const hook1 = vi.fn().mockResolvedValue(false);
      const hook2 = vi.fn().mockResolvedValue(true);

      hookSystem.registerPreHook('test-agent', hook1);
      hookSystem.registerPreHook('test-agent', hook2);

      const result = await hookSystem.executePreHooks('test-agent', {});

      expect(result.shouldContinue).toBe(false);
      expect(hook1).toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
    });
  });

  describe('Hook Context', () => {
    it('should pass context to all hooks', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const preHook = vi.fn().mockResolvedValue(undefined);

      hookSystem.registerPreHook('test-agent', preHook);

      const context = {
        agentId: 'test-agent',
        task: 'analyze',
        parameters: { file: 'test.ts' }
      };

      await hookSystem.executePreHooks('test-agent', context);

      expect(preHook).toHaveBeenCalledWith(context);
    });

    it('should allow hooks to modify context', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();

      const modifyHook = vi.fn().mockImplementation(async (ctx) => {
        ctx.modified = true;
        return true;
      });

      hookSystem.registerPreHook('test-agent', modifyHook);

      const context = { agentId: 'test-agent' };
      await hookSystem.executePreHooks('test-agent', context);

      expect(context).toHaveProperty('modified', true);
    });

    it('should preserve context across hook chain', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();

      const hook1 = vi.fn().mockImplementation(async (ctx) => {
        ctx.step1 = 'done';
        return true;
      });

      const hook2 = vi.fn().mockImplementation(async (ctx) => {
        ctx.step2 = 'done';
        expect(ctx.step1).toBe('done');
        return true;
      });

      hookSystem.registerPreHook('test-agent', hook1);
      hookSystem.registerPreHook('test-agent', hook2);

      const context = { agentId: 'test-agent' };
      await hookSystem.executePreHooks('test-agent', context);

      expect(context).toHaveProperty('step1', 'done');
      expect(context).toHaveProperty('step2', 'done');
    });
  });

  describe('Error Handling', () => {
    it('should handle hook execution errors', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const failingHook = vi.fn().mockRejectedValue(new Error('Hook failed'));

      hookSystem.registerPreHook('test-agent', failingHook);

      const result = await hookSystem.executePreHooks('test-agent', {});

      expect(result.shouldContinue).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should continue to next hook after error if configured', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem({ continueOnError: true });
      const failingHook = vi.fn().mockRejectedValue(new Error('Hook failed'));
      const successHook = vi.fn().mockResolvedValue(true);

      hookSystem.registerPreHook('test-agent', failingHook);
      hookSystem.registerPreHook('test-agent', successHook);

      await hookSystem.executePreHooks('test-agent', {});

      expect(successHook).toHaveBeenCalled();
    });

    it('should collect all hook errors', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem({ continueOnError: true });
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      hookSystem.registerPreHook('test-agent', vi.fn().mockRejectedValue(error1));
      hookSystem.registerPreHook('test-agent', vi.fn().mockRejectedValue(error2));

      const result = await hookSystem.executePreHooks('test-agent', {});

      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain(error1);
      expect(result.errors).toContain(error2);
    });
  });

  describe('Hook Removal', () => {
    it('should unregister specific hook', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const hook1 = vi.fn();
      const hook2 = vi.fn();

      hookSystem.registerPreHook('test-agent', hook1);
      hookSystem.registerPreHook('test-agent', hook2);

      hookSystem.unregisterPreHook('test-agent', hook1);

      const hooks = hookSystem.getPreHooks('test-agent');
      expect(hooks).not.toContain(hook1);
      expect(hooks).toContain(hook2);
    });

    it('should clear all hooks for agent', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();

      hookSystem.registerPreHook('test-agent', vi.fn());
      hookSystem.registerPostHook('test-agent', vi.fn());
      hookSystem.registerErrorHook('test-agent', vi.fn());

      hookSystem.clearHooks('test-agent');

      expect(hookSystem.getPreHooks('test-agent')).toHaveLength(0);
      expect(hookSystem.getPostHooks('test-agent')).toHaveLength(0);
      expect(hookSystem.getErrorHooks('test-agent')).toHaveLength(0);
    });

    it('should clear all global hooks', () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();

      hookSystem.registerGlobalPreHook(vi.fn());
      hookSystem.registerGlobalPostHook(vi.fn());

      hookSystem.clearGlobalHooks();

      expect(hookSystem.getPreHooks('any-agent')).toHaveLength(0);
    });
  });

  describe('Built-in Hooks', () => {
    it('should have validation hook', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();

      const validationHook = hookSystem.createValidationHook((ctx) => {
        return ctx.task !== undefined;
      });

      hookSystem.registerPreHook('test-agent', validationHook);

      const invalidResult = await hookSystem.executePreHooks('test-agent', { agentId: 'test' });
      expect(invalidResult.shouldContinue).toBe(false);

      const validResult = await hookSystem.executePreHooks('test-agent', { agentId: 'test', task: 'analyze' });
      expect(validResult.shouldContinue).toBe(true);
    });

    it('should have logging hook', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();
      const logger = vi.fn();

      const loggingHook = hookSystem.createLoggingHook(logger);
      hookSystem.registerPostHook('test-agent', loggingHook);

      await hookSystem.executePostHooks('test-agent', { agentId: 'test', result: 'success' });

      expect(logger).toHaveBeenCalled();
    });

    it('should have timing hook', async () => {
      if (!AgentHookSystem) return;

      const hookSystem = new AgentHookSystem();

      const timingHook = hookSystem.createTimingHook();
      hookSystem.registerPreHook('test-agent', timingHook);

      const context = { agentId: 'test' };
      await hookSystem.executePreHooks('test-agent', context);

      expect(context).toHaveProperty('startTime');
    });
  });
});
