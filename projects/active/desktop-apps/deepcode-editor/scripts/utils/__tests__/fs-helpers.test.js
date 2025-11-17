/**
 * Tests for file system utilities
 */

const { describe, it, expect, beforeEach, afterEach } = require('vitest');
const fs = require('fs');
const path = require('path');
const {
  ensureDirectory,
  ensureDirectories,
  getFileSizes,
  getTotalSize,
  formatBytes,
  cleanDirectory,
  cleanDirectories,
} = require('../fs-helpers');

const TEST_DIR = path.join(__dirname, 'test-temp');

describe('File System Utilities', () => {
  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('ensureDirectory', () => {
    it('should create a directory if it does not exist', async () => {
      const testPath = path.join(TEST_DIR, 'new-dir');
      await ensureDirectory(testPath);
      expect(fs.existsSync(testPath)).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const testPath = path.join(TEST_DIR, 'existing-dir');
      await ensureDirectory(testPath);
      await expect(ensureDirectory(testPath)).resolves.not.toThrow();
    });
  });

  describe('ensureDirectories', () => {
    it('should create multiple directories', async () => {
      const dir1 = path.join(TEST_DIR, 'dir1');
      const dir2 = path.join(TEST_DIR, 'dir2');
      await ensureDirectories(dir1, dir2);
      expect(fs.existsSync(dir1)).toBe(true);
      expect(fs.existsSync(dir2)).toBe(true);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 2)).toBe('1.50 KB');
    });
  });

  describe('cleanDirectory', () => {
    it('should remove an existing directory', () => {
      const testPath = path.join(TEST_DIR, 'to-clean');
      fs.mkdirSync(testPath, { recursive: true });
      expect(fs.existsSync(testPath)).toBe(true);
      
      const result = cleanDirectory(testPath);
      expect(result).toBe(true);
      expect(fs.existsSync(testPath)).toBe(false);
    });

    it('should return false if directory does not exist', () => {
      const testPath = path.join(TEST_DIR, 'non-existent');
      const result = cleanDirectory(testPath);
      expect(result).toBe(false);
    });
  });

  describe('cleanDirectories', () => {
    it('should clean multiple directories', () => {
      const dir1 = path.join(TEST_DIR, 'clean1');
      const dir2 = path.join(TEST_DIR, 'clean2');
      fs.mkdirSync(dir1, { recursive: true });
      fs.mkdirSync(dir2, { recursive: true });
      
      const cleaned = cleanDirectories(dir1, dir2);
      expect(cleaned).toHaveLength(2);
      expect(fs.existsSync(dir1)).toBe(false);
      expect(fs.existsSync(dir2)).toBe(false);
    });
  });

  describe('getFileSizes and getTotalSize', () => {
    it('should calculate file sizes recursively', () => {
      const testPath = path.join(TEST_DIR, 'size-test');
      fs.mkdirSync(testPath, { recursive: true });
      fs.writeFileSync(path.join(testPath, 'file1.txt'), 'hello');
      fs.writeFileSync(path.join(testPath, 'file2.txt'), 'world');
      
      const sizes = getFileSizes(testPath);
      expect(Object.keys(sizes)).toHaveLength(2);
      
      const totalSize = getTotalSize(sizes);
      expect(totalSize).toBe(10); // 'hello' + 'world' = 5 + 5
    });
  });
});
