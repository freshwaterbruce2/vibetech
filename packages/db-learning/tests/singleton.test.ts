import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LearningDatabase } from '../src/index.js';

describe('LearningDatabase Singleton Pattern', () => {
  beforeEach(() => {
    // Reset singleton between tests
    LearningDatabase.resetInstance();
  });

  afterEach(() => {
    // Clean up
    LearningDatabase.resetInstance();
  });

  it('should create a single instance', () => {
    const instance1 = LearningDatabase.getInstance();
    const instance2 = LearningDatabase.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should warn when called with config after instance exists', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // First call creates instance
    LearningDatabase.getInstance({ path: ':memory:' });

    // Second call with different config should warn
    LearningDatabase.getInstance({ path: 'different.db', verbose: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('getInstance() called with config but instance already exists')
    );

    consoleSpy.mockRestore();
  });

  it('should not warn when called without config after instance exists', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // First call creates instance
    LearningDatabase.getInstance({ path: ':memory:' });

    // Second call without config should not warn
    LearningDatabase.getInstance();

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should allow reinitialization after reset', () => {
    const instance1 = LearningDatabase.getInstance({ path: ':memory:' });

    LearningDatabase.resetInstance();

    const instance2 = LearningDatabase.getInstance({ path: ':memory:' });

    expect(instance1).not.toBe(instance2);
  });

  it('should clear instance even if database is already closed', () => {
    const instance1 = LearningDatabase.getInstance({ path: ':memory:' });

    // Close database manually
    instance1.close();

    // Reset should still work
    LearningDatabase.resetInstance();

    // Should be able to create new instance
    const instance2 = LearningDatabase.getInstance({ path: ':memory:' });

    expect(instance2).toBeDefined();
    expect(instance2).not.toBe(instance1);
  });

  it('should handle double close gracefully', () => {
    const instance = LearningDatabase.getInstance({ path: ':memory:' });

    // Close twice should not throw
    expect(() => {
      instance.close();
      instance.close();
    }).not.toThrow();
  });
});
