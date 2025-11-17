/**
 * Tests for shared utility modules
 */

const { describe, it, expect } = require('vitest');
const { log, logWithTimestamp, logError, logSuccess, logWarning, logInfo, colors } = require('../logger');

describe('Logger Utilities', () => {
  it('should have all color codes defined', () => {
    expect(colors).toBeDefined();
    expect(colors.reset).toBeDefined();
    expect(colors.red).toBeDefined();
    expect(colors.green).toBeDefined();
    expect(colors.yellow).toBeDefined();
    expect(colors.blue).toBeDefined();
    expect(colors.cyan).toBeDefined();
    expect(colors.info).toBeDefined();
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
  });

  it('should export all logging functions', () => {
    expect(typeof log).toBe('function');
    expect(typeof logWithTimestamp).toBe('function');
    expect(typeof logError).toBe('function');
    expect(typeof logSuccess).toBe('function');
    expect(typeof logWarning).toBe('function');
    expect(typeof logInfo).toBe('function');
  });

  it('should log messages without throwing', () => {
    expect(() => log('test message')).not.toThrow();
    expect(() => logInfo('info message')).not.toThrow();
    expect(() => logSuccess('success message')).not.toThrow();
    expect(() => logWarning('warning message')).not.toThrow();
    expect(() => logError('error message')).not.toThrow();
    expect(() => logWithTimestamp('timestamped message')).not.toThrow();
  });
});
