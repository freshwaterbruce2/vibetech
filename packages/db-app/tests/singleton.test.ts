import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppDatabase } from '../src/index.js';

describe('AppDatabase Singleton Pattern', () => {
  beforeEach(() => {
    // Reset singleton between tests
    AppDatabase.resetInstance();
  });

  afterEach(() => {
    // Clean up
    AppDatabase.resetInstance();
  });

  it('should create a single instance', () => {
    const instance1 = AppDatabase.getInstance();
    const instance2 = AppDatabase.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should warn when called with config after instance exists', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // First call creates instance
    AppDatabase.getInstance({ path: ':memory:' });

    // Second call with different config should warn
    AppDatabase.getInstance({ path: 'different.db', verbose: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('getInstance() called with config but instance already exists')
    );

    consoleSpy.mockRestore();
  });

  it('should not warn when called without config after instance exists', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // First call creates instance
    AppDatabase.getInstance({ path: ':memory:' });

    // Second call without config should not warn
    AppDatabase.getInstance();

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should allow reinitialization after reset', () => {
    const instance1 = AppDatabase.getInstance({ path: ':memory:' });

    AppDatabase.resetInstance();

    const instance2 = AppDatabase.getInstance({ path: ':memory:' });

    expect(instance1).not.toBe(instance2);
  });

  it('should clear instance even if database is already closed', () => {
    const instance1 = AppDatabase.getInstance({ path: ':memory:' });

    // Close database manually
    instance1.close();

    // Reset should still work
    AppDatabase.resetInstance();

    // Should be able to create new instance
    const instance2 = AppDatabase.getInstance({ path: ':memory:' });

    expect(instance2).toBeDefined();
    expect(instance2).not.toBe(instance1);
  });

  it('should handle double close gracefully', () => {
    const instance = AppDatabase.getInstance({ path: ':memory:' });

    // Close twice should not throw
    expect(() => {
      instance.close();
      instance.close();
    }).not.toThrow();
  });
});
