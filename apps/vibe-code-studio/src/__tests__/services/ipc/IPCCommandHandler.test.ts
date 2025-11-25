/**
 * IPCCommandHandler Tests
 *
 * Tests for command request/response pattern
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IPCCommandHandler } from '../../../services/ipc/IPCCommandHandler';

describe('IPCCommandHandler', () => {
  let handler: IPCCommandHandler;

  beforeEach(() => {
    handler = new IPCCommandHandler(1000);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    handler.clear();
  });

  describe('Command Registration', () => {
    it('should register command and return promise', () => {
      const promise = handler.registerCommand('cmd-1', 1000);
      expect(promise).toBeInstanceOf(Promise);
      expect(handler.getPendingCount()).toBe(1);
    });

    it('should handle multiple pending commands', () => {
      handler.registerCommand('cmd-1', 1000);
      handler.registerCommand('cmd-2', 1000);
      handler.registerCommand('cmd-3', 1000);

      expect(handler.getPendingCount()).toBe(3);
    });
  });

  describe('Command Results', () => {
    it('should resolve on successful result', async () => {
      const promise = handler.registerCommand('cmd-1', 1000);

      const result = { commandId: 'cmd-1', success: true, result: 'data' };
      handler.handleResult('cmd-1', result);

      await expect(promise).resolves.toEqual(result);
      expect(handler.getPendingCount()).toBe(0);
    });

    it('should handle multiple results', async () => {
      const promise1 = handler.registerCommand('cmd-1', 1000);
      const promise2 = handler.registerCommand('cmd-2', 1000);

      const result1 = { commandId: 'cmd-1', success: true, result: 'data1' };
      const result2 = { commandId: 'cmd-2', success: true, result: 'data2' };

      handler.handleResult('cmd-1', result1);
      handler.handleResult('cmd-2', result2);

      await expect(promise1).resolves.toEqual(result1);
      await expect(promise2).resolves.toEqual(result2);
      expect(handler.getPendingCount()).toBe(0);
    });

    it('should return false for unknown command ID', () => {
      const result = handler.handleResult('unknown', { commandId: 'unknown', success: true });
      expect(result).toBe(false);
    });
  });

  describe('Timeouts', () => {
    it('should reject on timeout', async () => {
      const promise = handler.registerCommand('cmd-1', 500);

      vi.advanceTimersByTime(600);

      await expect(promise).rejects.toThrow('Command request timed out after 500ms');
      expect(handler.getPendingCount()).toBe(0);
    });

    it('should not timeout if result received in time', async () => {
      const promise = handler.registerCommand('cmd-1', 1000);

      vi.advanceTimersByTime(500);

      const result = { commandId: 'cmd-1', success: true, result: 'data' };
      handler.handleResult('cmd-1', result);

      await expect(promise).resolves.toEqual(result);
    });
  });

  describe('Rejection', () => {
    it('should reject command with error', async () => {
      const promise = handler.registerCommand('cmd-1', 1000);

      const error = new Error('Command failed');
      handler.rejectCommand('cmd-1', error);

      await expect(promise).rejects.toThrow('Command failed');
      expect(handler.getPendingCount()).toBe(0);
    });

    it('should reject all pending commands', async () => {
      const promise1 = handler.registerCommand('cmd-1', 1000);
      const promise2 = handler.registerCommand('cmd-2', 1000);
      const promise3 = handler.registerCommand('cmd-3', 1000);

      const error = new Error('Disconnected');
      handler.rejectAll(error);

      await expect(promise1).rejects.toThrow('Disconnected');
      await expect(promise2).rejects.toThrow('Disconnected');
      await expect(promise3).rejects.toThrow('Disconnected');
      expect(handler.getPendingCount()).toBe(0);
    });
  });

  describe('Clear', () => {
    it('should clear all pending commands', () => {
      handler.registerCommand('cmd-1', 1000);
      handler.registerCommand('cmd-2', 1000);

      handler.clear();

      expect(handler.getPendingCount()).toBe(0);
    });
  });

  describe('Pending Count', () => {
    it('should track pending count correctly', () => {
      expect(handler.getPendingCount()).toBe(0);

      handler.registerCommand('cmd-1', 1000);
      expect(handler.getPendingCount()).toBe(1);

      handler.registerCommand('cmd-2', 1000);
      expect(handler.getPendingCount()).toBe(2);

      handler.handleResult('cmd-1', { commandId: 'cmd-1', success: true });
      expect(handler.getPendingCount()).toBe(1);

      handler.clear();
      expect(handler.getPendingCount()).toBe(0);
    });
  });
});
