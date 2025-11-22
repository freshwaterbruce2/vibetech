/**
 * Comprehensive tests for FileSystemService
 * Coverage target: 90%+ for file operations and path utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileSystemService } from '../../services/FileSystemService';

// Mock ElectronService
vi.mock('../../services/ElectronService', () => ({
  ElectronService: vi.fn().mockImplementation(() => ({
    isElectron: vi.fn().mockReturnValue(false), // FIX: isElectron() is a function, not a property
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readDirectory: vi.fn(),
    createDirectory: vi.fn().mockResolvedValue(undefined), // FIX: Add missing createDirectory mock
  })),
}));

// Mock Tauri imports
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readDir: vi.fn(),
}));

describe('FileSystemService', () => {
  let service: FileSystemService;

  beforeEach(() => {
    // Reset window.__TAURI__ for each test
    delete (global as any).window;
    (global as any).window = {};
    service = new FileSystemService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with demo files', () => {
      expect(service).toBeDefined();
    });

    it('should have demo files pre-populated', async () => {
      const demoReadme = await service.readFile(
        '/home/freshbruce/deepcode-editor/demo-workspace/README.md'
      );
      expect(demoReadme).toBeTruthy();
      expect(demoReadme).toContain('Demo Workspace');
    });

    it('should have demo index.js file', async () => {
      const demoIndex = await service.readFile(
        '/home/freshbruce/deepcode-editor/demo-workspace/index.js'
      );
      expect(demoIndex).toBeTruthy();
      expect(demoIndex).toContain('TodoApp');
    });

    it('should have demo styles.css file', async () => {
      const demoStyles = await service.readFile(
        '/home/freshbruce/deepcode-editor/demo-workspace/styles.css'
      );
      expect(demoStyles).toBeTruthy();
      expect(demoStyles).toContain('.todo-app');
    });

    it('should have demo utils.js file', async () => {
      const demoUtils = await service.readFile(
        '/home/freshbruce/deepcode-editor/demo-workspace/utils.js'
      );
      expect(demoUtils).toBeTruthy();
      expect(demoUtils).toContain('formatDate');
    });
  });

  describe('readFile', () => {
    it('should read an existing file', async () => {
      const content = await service.readFile(
        '/home/freshbruce/deepcode-editor/demo-workspace/README.md'
      );
      expect(content).toBeTruthy();
      expect(typeof content).toBe('string');
    });

    it('should return empty string for non-existent file', async () => {
      const content = await service.readFile('/nonexistent.txt');
      expect(content).toBe('');
    });

    it('should read file with special characters', async () => {
      await service.writeFile('/test file with spaces.txt', 'content');
      const content = await service.readFile('/test file with spaces.txt');
      expect(content).toBe('content');
    });
  });

  describe('writeFile', () => {
    it('should write a new file', async () => {
      const path = '/test.txt';
      const content = 'Hello, World!';

      await service.writeFile(path, content);
      const readContent = await service.readFile(path);

      expect(readContent).toBe(content);
    });

    it('should overwrite existing file', async () => {
      const path = '/test.txt';

      await service.writeFile(path, 'original content');
      await service.writeFile(path, 'new content');

      const readContent = await service.readFile(path);
      expect(readContent).toBe('new content');
    });

    it('should write empty file', async () => {
      const path = '/empty.txt';
      await service.writeFile(path, '');

      const readContent = await service.readFile(path);
      expect(readContent).toBe('');
    });

    it('should write file with unicode characters', async () => {
      const path = '/unicode.txt';
      const content = 'Hello 世界 🌍 ñoño';

      await service.writeFile(path, content);
      const readContent = await service.readFile(path);

      expect(readContent).toBe(content);
    });

    it('should write large file', async () => {
      const path = '/large.txt';
      const content = 'x'.repeat(10000);

      await service.writeFile(path, content);
      const readContent = await service.readFile(path);

      expect(readContent.length).toBe(10000);
    });
  });

  describe('createFile', () => {
    it('should create a new file with content', async () => {
      const path = '/new-file.txt';
      const content = 'Initial content';

      await service.createFile(path, content);
      const readContent = await service.readFile(path);

      expect(readContent).toBe(content);
    });

    it('should create a new file without content', async () => {
      const path = '/empty-new.txt';

      await service.createFile(path);
      const readContent = await service.readFile(path);

      expect(readContent).toBe('');
    });

    it('should throw error if file already exists', async () => {
      const path = '/existing.txt';

      await service.createFile(path, 'content');

      await expect(service.createFile(path, 'new content')).rejects.toThrow(
        'File already exists'
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const path = '/to-delete.txt';

      await service.createFile(path, 'content');
      await service.deleteFile(path);

      const exists = await service.exists(path);
      expect(exists).toBe(false);
    });

    it('should throw error if file does not exist', async () => {
      await expect(service.deleteFile('/nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should delete multiple files independently', async () => {
      await service.createFile('/file1.txt', 'content1');
      await service.createFile('/file2.txt', 'content2');

      await service.deleteFile('/file1.txt');

      expect(await service.exists('/file1.txt')).toBe(false);
      expect(await service.exists('/file2.txt')).toBe(true);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory without errors', async () => {
      await expect(service.createDirectory('/new-dir')).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      await expect(service.createDirectory('/parent/child/grandchild')).resolves.not.toThrow();
    });

    it('should handle existing directories gracefully', async () => {
      const path = '/existing-directory';
      await service.createDirectory(path);
      // Creating again should not throw
      await expect(service.createDirectory(path)).resolves.not.toThrow();
    });

    it('should create multi-level nested directories recursively', async () => {
      const deepPath = '/level1/level2/level3/level4/level5';
      await expect(service.createDirectory(deepPath)).resolves.not.toThrow();
    });

    it('should handle Windows-style path separators', async () => {
      const windowsPath = 'C:\\tests\\unit\\services';
      await expect(service.createDirectory(windowsPath)).resolves.not.toThrow();
    });

    it('should handle Unix-style path separators', async () => {
      const unixPath = '/tests/unit/services';
      await expect(service.createDirectory(unixPath)).resolves.not.toThrow();
    });
  });

  describe('writeFile - Auto Parent Directory Creation', () => {
    it('should auto-create parent directory when writing file to non-existent path', async () => {
      const filePath = '/auto-created/parent/directory/test-file.ts';
      const content = '// Test file content';

      // This should not throw even though the parent directories don't exist
      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();

      // Verify file was created and content is correct
      const readContent = await service.readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should handle nested paths with Windows separators', async () => {
      const filePath = 'C:\\dev\\projects\\test\\app-lock.test.ts';
      const content = 'describe("test", () => {})';

      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();
      const readContent = await service.readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should handle nested paths with Unix separators', async () => {
      const filePath = '/home/user/projects/test/app-lock.test.ts';
      const content = 'describe("test", () => {})';

      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();
      const readContent = await service.readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should handle deeply nested directory structures (5+ levels)', async () => {
      const filePath = '/tests/unit/services/specialized-agents/multi-agent/review.test.ts';
      const content = 'export const test = true;';

      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();
      const readContent = await service.readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should work when parent directory already exists', async () => {
      const parentDir = '/existing-parent-dir';
      const filePath = '/existing-parent-dir/new-file.txt';
      const content = 'content in existing directory';

      // Create parent directory first
      await service.createDirectory(parentDir);

      // Writing file should still work without errors
      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();
      const readContent = await service.readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should handle file paths with no parent directory (root level)', async () => {
      const filePath = '/root-level-file.txt';
      const content = 'root level content';

      // Should work even with no parent directory to create
      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();
      const readContent = await service.readFile(filePath);
      expect(readContent).toBe(content);
    });

    it('should handle mixed path separators gracefully', async () => {
      const filePath = '/tests\\unit/services\\file.test.ts';
      const content = 'test content';

      // Should handle mixed separators without errors
      await expect(service.writeFile(filePath, content)).resolves.not.toThrow();
    });
  });

  describe('listDirectory', () => {
    it('should list demo workspace directory', async () => {
      const items = await service.listDirectory(
        '/home/freshbruce/deepcode-editor/demo-workspace'
      );

      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);

      const readme = items.find(item => item.name === 'README.md');
      expect(readme).toBeDefined();
      expect(readme?.type).toBe('file');
    });

    it('should return file details with size and modified date', async () => {
      const items = await service.listDirectory(
        '/home/freshbruce/deepcode-editor/demo-workspace'
      );

      const firstItem = items[0];
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('path');
      expect(firstItem).toHaveProperty('type');
      expect(firstItem).toHaveProperty('size');
      expect(firstItem).toHaveProperty('modified');
    });

    it('should return empty array for non-demo directory in web mode', async () => {
      const items = await service.listDirectory('/some/other/path');
      expect(items).toEqual([]);
    });

    it('should list all 4 demo files', async () => {
      const items = await service.listDirectory(
        '/home/freshbruce/deepcode-editor/demo-workspace'
      );

      expect(items.length).toBe(4);

      const fileNames = items.map(item => item.name);
      expect(fileNames).toContain('README.md');
      expect(fileNames).toContain('index.js');
      expect(fileNames).toContain('styles.css');
      expect(fileNames).toContain('utils.js');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await service.createFile('/exists-test.txt', 'content');
      const exists = await service.exists('/exists-test.txt');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const exists = await service.exists('/does-not-exist.txt');
      expect(exists).toBe(false);
    });

    it('should return true for demo files', async () => {
      const exists = await service.exists(
        '/home/freshbruce/deepcode-editor/demo-workspace/README.md'
      );
      expect(exists).toBe(true);
    });
  });

  describe('isDirectory', () => {
    it('should return true for path without extension', async () => {
      const isDir = await service.isDirectory('/some/directory');
      expect(isDir).toBe(true);
    });

    it('should return false for path with extension', async () => {
      const isDir = await service.isDirectory('/some/file.txt');
      expect(isDir).toBe(false);
    });

    it('should return false for files with multiple dots', async () => {
      const isDir = await service.isDirectory('/file.test.js');
      expect(isDir).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should return file stats with size', async () => {
      const path = '/stats-test.txt';
      const content = 'Hello World';

      await service.createFile(path, content);
      const stats = await service.getFileStats(path);

      expect(stats.size).toBe(content.length);
      expect(stats).toHaveProperty('created');
      expect(stats).toHaveProperty('modified');
      expect(stats).toHaveProperty('isDirectory');
    });

    it('should indicate if path is directory', async () => {
      const stats = await service.getFileStats('/directory');
      expect(stats.isDirectory).toBe(true);
    });

    it('should indicate if path is file', async () => {
      const stats = await service.getFileStats('/file.txt');
      expect(stats.isDirectory).toBe(false);
    });

    it('should return zero size for empty file', async () => {
      await service.createFile('/empty-stats.txt', '');
      const stats = await service.getFileStats('/empty-stats.txt');
      expect(stats.size).toBe(0);
    });
  });

  describe('path utilities', () => {
    describe('joinPath', () => {
      it('should join multiple path segments', () => {
        const result = service.joinPath('a', 'b', 'c');
        expect(result).toBe('a/b/c');
      });

      it('should handle paths with slashes', () => {
        const result = service.joinPath('/root/', '/middle/', '/end');
        expect(result).toBe('/root/middle/end');
      });

      it('should remove duplicate slashes', () => {
        const result = service.joinPath('a//b', 'c///d');
        expect(result).toBe('a/b/c/d');
      });

      it('should join empty segments', () => {
        const result = service.joinPath('a', '', 'b');
        expect(result).toBe('a/b');
      });

      it('should join single segment', () => {
        const result = service.joinPath('single');
        expect(result).toBe('single');
      });
    });

    describe('dirname', () => {
      it('should return directory name', () => {
        const result = service.dirname('/path/to/file.txt');
        expect(result).toBe('/path/to');
      });

      it('should handle root directory', () => {
        const result = service.dirname('/file.txt');
        expect(result).toBe('/');
      });

      it('should handle path without slash', () => {
        const result = service.dirname('file.txt');
        expect(result).toBe('.');
      });

      it('should handle nested directories', () => {
        const result = service.dirname('/a/b/c/d/e/file.txt');
        expect(result).toBe('/a/b/c/d/e');
      });

      it('should handle directory path', () => {
        const result = service.dirname('/path/to/directory');
        expect(result).toBe('/path/to');
      });
    });

    describe('basename', () => {
      it('should return filename', () => {
        const result = service.basename('/path/to/file.txt');
        expect(result).toBe('file.txt');
      });

      it('should handle root file', () => {
        const result = service.basename('/file.txt');
        expect(result).toBe('file.txt');
      });

      it('should handle path without slash', () => {
        const result = service.basename('file.txt');
        expect(result).toBe('file.txt');
      });

      it('should handle directory name', () => {
        const result = service.basename('/path/to/directory');
        expect(result).toBe('directory');
      });

      it('should handle files with multiple extensions', () => {
        const result = service.basename('/path/to/file.test.js');
        expect(result).toBe('file.test.js');
      });
    });

    describe('isAbsolute', () => {
      it('should return true for absolute path', () => {
        expect(service.isAbsolute('/absolute/path')).toBe(true);
      });

      it('should return false for relative path', () => {
        expect(service.isAbsolute('relative/path')).toBe(false);
      });

      it('should return true for root', () => {
        expect(service.isAbsolute('/')).toBe(true);
      });

      it('should return false for current directory', () => {
        expect(service.isAbsolute('.')).toBe(false);
      });

      it('should return false for parent directory', () => {
        expect(service.isAbsolute('..')).toBe(false);
      });
    });

    describe('relative', () => {
      it('should calculate relative path between two paths', () => {
        const result = service.relative('/a/b/c', '/a/b/d');
        expect(result).toBe('../d');
      });

      it('should handle same directory', () => {
        const result = service.relative('/a/b', '/a/b');
        expect(result).toBe('.');
      });

      it('should handle nested target', () => {
        const result = service.relative('/a/b', '/a/b/c/d');
        expect(result).toBe('c/d');
      });

      it('should handle parent directory', () => {
        const result = service.relative('/a/b/c', '/a');
        expect(result).toBe('../..');
      });

      it('should handle completely different paths', () => {
        const result = service.relative('/a/b/c', '/x/y/z');
        expect(result).toBe('../../../x/y/z');
      });

      it('should throw error for non-absolute from path', () => {
        expect(() => service.relative('relative', '/absolute')).toThrow(
          'Both paths must be absolute'
        );
      });

      it('should throw error for non-absolute to path', () => {
        expect(() => service.relative('/absolute', 'relative')).toThrow(
          'Both paths must be absolute'
        );
      });

      it('should handle paths with no common prefix', () => {
        const result = service.relative('/a', '/b');
        expect(result).toBe('../b');
      });
    });
  });

  describe('getDirectoryStructure', () => {
    it('should return directory structure with children', async () => {
      const structure = await service.getDirectoryStructure(
        '/home/freshbruce/deepcode-editor/demo-workspace'
      );

      expect(structure).toHaveProperty('name');
      expect(structure).toHaveProperty('path');
      expect(structure).toHaveProperty('type');
      expect(structure).toHaveProperty('children');
      expect(structure.type).toBe('directory');
      expect(Array.isArray(structure.children)).toBe(true);
    });

    it('should include file items in children', async () => {
      const structure = await service.getDirectoryStructure(
        '/home/freshbruce/deepcode-editor/demo-workspace'
      );

      expect(structure.children).toBeDefined();
      if (structure.children) {
        expect(structure.children.length).toBeGreaterThan(0);
      }
    });

    it('should have correct directory name', async () => {
      const structure = await service.getDirectoryStructure(
        '/home/freshbruce/deepcode-editor/demo-workspace'
      );

      expect(structure.name).toBe('demo-workspace');
    });
  });

  describe('getFileInfo', () => {
    it('should return complete file information', async () => {
      const path = '/info-test.txt';
      await service.createFile(path, 'test content');

      const info = await service.getFileInfo(path);

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('path');
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('size');
      expect(info).toHaveProperty('created');
      expect(info).toHaveProperty('modified');
      expect(info).toHaveProperty('isDirectory');
    });

    it('should correctly identify file type', async () => {
      const filePath = '/test-file.txt';
      await service.createFile(filePath, 'content');

      const info = await service.getFileInfo(filePath);
      expect(info.type).toBe('file');
    });

    it('should correctly identify directory type', async () => {
      const info = await service.getFileInfo('/test-directory');
      expect(info.type).toBe('directory');
    });

    it('should extract correct basename', async () => {
      const info = await service.getFileInfo('/path/to/myfile.txt');
      expect(info.name).toBe('myfile.txt');
    });

    it('should include correct path', async () => {
      const path = '/specific/path.txt';
      const info = await service.getFileInfo(path);
      expect(info.path).toBe(path);
    });
  });

  describe('edge cases', () => {
    it('should handle very long filenames', async () => {
      const longName = 'a'.repeat(255);
      const path = `/${longName}.txt`;

      await service.writeFile(path, 'content');
      const content = await service.readFile(path);

      expect(content).toBe('content');
    });

    it('should handle paths with special characters', async () => {
      const path = '/test-file_with-special.chars.txt';

      await service.writeFile(path, 'content');
      const content = await service.readFile(path);

      expect(content).toBe('content');
    });

    it('should handle multiple slashes in path', async () => {
      const result = service.joinPath('a//b', 'c///d');
      expect(result).toBe('a/b/c/d');
    });

    it('should handle empty content writes', async () => {
      await service.writeFile('/empty.txt', '');
      const stats = await service.getFileStats('/empty.txt');
      expect(stats.size).toBe(0);
    });

    it('should handle reading non-UTF8 content gracefully', async () => {
      const path = '/binary-looking.txt';
      await service.writeFile(path, String.fromCharCode(0, 1, 2, 255));
      const content = await service.readFile(path);
      expect(content).toBeDefined();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent reads', async () => {
      const path = '/concurrent-read.txt';
      await service.writeFile(path, 'content');

      const reads = await Promise.all([
        service.readFile(path),
        service.readFile(path),
        service.readFile(path),
      ]);

      reads.forEach(content => expect(content).toBe('content'));
    });

    it('should handle concurrent writes', async () => {
      const writes = await Promise.all([
        service.writeFile('/file1.txt', 'content1'),
        service.writeFile('/file2.txt', 'content2'),
        service.writeFile('/file3.txt', 'content3'),
      ]);

      expect(writes).toBeDefined();

      const content1 = await service.readFile('/file1.txt');
      const content2 = await service.readFile('/file2.txt');
      const content3 = await service.readFile('/file3.txt');

      expect(content1).toBe('content1');
      expect(content2).toBe('content2');
      expect(content3).toBe('content3');
    });

    it('should handle mixed read/write operations', async () => {
      await service.writeFile('/mixed.txt', 'initial');

      const operations = await Promise.all([
        service.readFile('/mixed.txt'),
        service.writeFile('/mixed.txt', 'updated'),
        service.readFile('/mixed.txt'),
      ]);

      expect(operations[0]).toBeDefined();
      expect(operations[2]).toBe('updated');
    });
  });
});
