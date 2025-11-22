/**
 * Comprehensive Test Suite for SearchService
 * Tests file searching, text replacement, pattern matching, and export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService, SearchOptions, ReplaceOptions } from '../../services/SearchService';

describe('SearchService - Comprehensive Tests', () => {
  let searchService: SearchService;
  let mockFileSystemService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock FileSystemService
    mockFileSystemService = {
      readFile: vi.fn(),
      writeFile: vi.fn(),
    };

    searchService = new SearchService(mockFileSystemService);
  });

  const defaultOptions: SearchOptions = {
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includeFiles: '',
    excludeFiles: '',
  };

  describe('Initialization', () => {
    it('should create SearchService instance', () => {
      expect(searchService).toBeDefined();
      expect(searchService).toBeInstanceOf(SearchService);
    });

    it('should accept fileSystemService in constructor', () => {
      const service = new SearchService(mockFileSystemService);
      expect(service).toBeDefined();
    });
  });

  describe('searchInFiles - Multi-file Search', () => {
    it('should search across multiple files', async () => {
      mockFileSystemService.readFile
        .mockResolvedValueOnce('const foo = 1;')
        .mockResolvedValueOnce('const bar = 2;')
        .mockResolvedValueOnce('const foo = 3;');

      const files = ['/test/file1.ts', '/test/file2.ts', '/test/file3.ts'];
      const results = await searchService.searchInFiles('foo', files, defaultOptions);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['/test/file1.ts']).toBeDefined();
      expect(results['/test/file3.ts']).toBeDefined();
      expect(results['/test/file2.ts']).toBeUndefined();
    });

    it('should return empty results for empty search text', async () => {
      const files = ['/test/file1.ts'];
      const results = await searchService.searchInFiles('', files, defaultOptions);

      expect(results).toEqual({});
      expect(mockFileSystemService.readFile).not.toHaveBeenCalled();
    });

    it('should return empty results for whitespace-only search text', async () => {
      const files = ['/test/file1.ts'];
      const results = await searchService.searchInFiles('   ', files, defaultOptions);

      expect(results).toEqual({});
    });

    it('should handle files that fail to read', async () => {
      mockFileSystemService.readFile
        .mockResolvedValueOnce('const foo = 1;')
        .mockRejectedValueOnce(new Error('File read error'))
        .mockResolvedValueOnce('const foo = 3;');

      // searchInFile logs with console.error, not console.warn
      // But searchInFiles catches the error and logs with console.warn
      // Actually, searchInFile catches and returns empty array, so no warn is called
      // Just verify the results are correct

      const files = ['/test/file1.ts', '/test/file2.ts', '/test/file3.ts'];
      const results = await searchService.searchInFiles('foo', files, defaultOptions);

      // File2 fails to read, so only file1 and file3 have results
      expect(Object.keys(results)).toHaveLength(2);
      expect(results['/test/file1.ts']).toBeDefined();
      expect(results['/test/file3.ts']).toBeDefined();
    });

    it('should filter files by extension automatically', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');

      const files = [
        '/test/file.ts',
        '/test/image.png',
        '/test/script.js',
        '/test/binary.exe',
      ];

      const results = await searchService.searchInFiles('foo', files, defaultOptions);

      // Only .ts and .js files should be searched
      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchInFile - Single File Search', () => {
    it('should find single match in file', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        file: '/test/file.ts',
        line: 1,
        column: 7,
        match: 'foo',
        text: 'const foo = 1;',
      });
    });

    it('should find multiple matches on same line', async () => {
      mockFileSystemService.readFile.mockResolvedValue('foo bar foo');

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(2);
      expect(results[0].column).toBe(1);
      expect(results[1].column).toBe(9);
    });

    it('should find matches across multiple lines', async () => {
      const content = 'const foo = 1;\nconst bar = 2;\nconst foo = 3;';
      mockFileSystemService.readFile.mockResolvedValue(content);

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(2);
      expect(results[0].line).toBe(1);
      expect(results[1].line).toBe(3);
    });

    it('should return empty array for file with no matches', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const bar = 1;');

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(0);
    });

    it('should return empty array for empty file', async () => {
      mockFileSystemService.readFile.mockResolvedValue('');

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(0);
    });

    it('should return empty array for null/undefined file content', async () => {
      mockFileSystemService.readFile.mockResolvedValue(null);

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(0);
    });

    it('should include before and after context', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results[0].before).toBe('const ');
      expect(results[0].after).toBe(' = 1;');
    });

    it('should handle regex patterns correctly', async () => {
      mockFileSystemService.readFile.mockResolvedValue('test123\ntest456\nabc789');

      const pattern = /test\d+/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(2);
      expect(results[0].match).toBe('test123');
      expect(results[1].match).toBe('test456');
    });

    it('should handle file read errors', async () => {
      mockFileSystemService.readFile.mockRejectedValue(new Error('Read error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should reset regex lastIndex for global patterns', async () => {
      mockFileSystemService.readFile.mockResolvedValue('foo\nfoo');

      const pattern = /foo/gi;
      const results = await searchService.searchInFile('/test/file.ts', pattern, defaultOptions);

      expect(results).toHaveLength(2);
    });
  });

  describe('replaceInFiles - Multi-file Replace', () => {
    it('should replace text in multiple files', async () => {
      mockFileSystemService.readFile
        .mockResolvedValueOnce('const foo = 1;')
        .mockResolvedValueOnce('const foo = 2;');

      mockFileSystemService.writeFile.mockResolvedValue(undefined);

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };
      const files = ['/test/file1.ts', '/test/file2.ts'];

      const results = await searchService.replaceInFiles('foo', 'bar', files, replaceOptions);

      expect(results).toHaveLength(2);
      expect(results[0].replacements).toBe(1);
      expect(results[1].replacements).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should not write files in dry run mode', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: true };
      const files = ['/test/file.ts'];

      await searchService.replaceInFiles('foo', 'bar', files, replaceOptions);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    it('should return empty array for empty search text', async () => {
      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };
      const files = ['/test/file.ts'];

      const results = await searchService.replaceInFiles('', 'bar', files, replaceOptions);

      expect(results).toEqual([]);
    });

    it('should handle files with no matches', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const bar = 1;');

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };
      const files = ['/test/file.ts'];

      const results = await searchService.replaceInFiles('foo', 'baz', files, replaceOptions);

      expect(results[0].replacements).toBe(0);
      expect(results[0].success).toBe(true);
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file write errors', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');
      mockFileSystemService.writeFile.mockRejectedValue(new Error('Write error'));

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };
      const files = ['/test/file.ts'];

      const results = await searchService.replaceInFiles('foo', 'bar', files, replaceOptions);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Write error');
    });

    it('should handle file read errors', async () => {
      mockFileSystemService.readFile.mockRejectedValue(new Error('Read error'));

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };
      const files = ['/test/file.ts'];

      const results = await searchService.replaceInFiles('foo', 'bar', files, replaceOptions);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('replaceInFile - Single File Replace', () => {
    it('should replace text in file', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');
      mockFileSystemService.writeFile.mockResolvedValue(undefined);

      const pattern = /foo/gi;
      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };

      const result = await searchService.replaceInFile('/test/file.ts', pattern, 'bar', replaceOptions);

      expect(result.replacements).toBe(1);
      expect(result.success).toBe(true);
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/file.ts',
        'const bar = 1;'
      );
    });

    it('should replace multiple occurrences', async () => {
      mockFileSystemService.readFile.mockResolvedValue('foo foo foo');
      mockFileSystemService.writeFile.mockResolvedValue(undefined);

      const pattern = /foo/gi;
      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };

      const result = await searchService.replaceInFile('/test/file.ts', pattern, 'bar', replaceOptions);

      expect(result.replacements).toBe(3);
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/file.ts',
        'bar bar bar'
      );
    });

    it('should handle empty file content', async () => {
      mockFileSystemService.readFile.mockResolvedValue('');

      const pattern = /foo/gi;
      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };

      const result = await searchService.replaceInFile('/test/file.ts', pattern, 'bar', replaceOptions);

      expect(result.replacements).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should not write if no replacements made', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const bar = 1;');

      const pattern = /foo/gi;
      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };

      await searchService.replaceInFile('/test/file.ts', pattern, 'baz', replaceOptions);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('searchAndReplace - Combined Operation', () => {
    it('should search and replace in single operation', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');
      mockFileSystemService.writeFile.mockResolvedValue(undefined);

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: false };
      const files = ['/test/file.ts'];

      const result = await searchService.searchAndReplace('foo', 'bar', files, replaceOptions);

      expect(result.searchResults['/test/file.ts']).toBeDefined();
      expect(result.replaceResults).toHaveLength(1);
      expect(result.replaceResults[0].replacements).toBe(1);
    });

    it('should provide preview in dry run mode', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');

      const replaceOptions: ReplaceOptions = { ...defaultOptions, dryRun: true };
      const files = ['/test/file.ts'];

      const result = await searchService.searchAndReplace('foo', 'bar', files, replaceOptions);

      expect(result.searchResults['/test/file.ts']).toBeDefined();
      expect(result.replaceResults[0].replacements).toBe(1);
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('filterFiles - File Filtering', () => {
    it('should include only text files by default', async () => {
      mockFileSystemService.readFile.mockResolvedValue('content');

      const files = [
        '/test/file.ts',
        '/test/image.png',
        '/test/script.js',
        '/test/binary.exe',
        '/test/doc.txt',
      ];

      await searchService.searchInFiles('test', files, defaultOptions);

      // Only .ts, .js, and .txt should be searched
      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(3);
    });

    it('should filter by include pattern', async () => {
      mockFileSystemService.readFile.mockResolvedValue('content');

      const files = ['/test/file1.ts', '/test/file2.js', '/test/file3.ts'];
      const options: SearchOptions = { ...defaultOptions, includeFiles: '*.ts' };

      await searchService.searchInFiles('test', files, options);

      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(2);
    });

    it('should filter by exclude pattern', async () => {
      mockFileSystemService.readFile.mockResolvedValue('content');

      const files = ['/test/file1.ts', '/test/file2.spec.ts', '/test/file3.ts'];
      const options: SearchOptions = { ...defaultOptions, excludeFiles: '*.spec.ts' };

      await searchService.searchInFiles('test', files, options);

      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(2);
    });

    it('should support multiple include patterns', async () => {
      mockFileSystemService.readFile.mockResolvedValue('content');

      const files = [
        '/test/file.ts',
        '/test/script.js',
        '/test/style.css',
        '/test/doc.md',
      ];
      const options: SearchOptions = { ...defaultOptions, includeFiles: '*.ts,*.js' };

      await searchService.searchInFiles('test', files, options);

      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(2);
    });

    it('should support multiple exclude patterns', async () => {
      mockFileSystemService.readFile.mockResolvedValue('content');

      const files = [
        '/test/file.ts',
        '/test/file.spec.ts',
        '/test/file.test.ts',
        '/test/app.ts',
      ];
      const options: SearchOptions = { ...defaultOptions, excludeFiles: '*.spec.ts,*.test.ts' };

      await searchService.searchInFiles('test', files, options);

      expect(mockFileSystemService.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('createSearchPattern - Pattern Creation', () => {
    it('should create case-insensitive pattern by default', async () => {
      mockFileSystemService.readFile.mockResolvedValue('Foo FOO foo');

      const files = ['/test/file.ts'];
      const results = await searchService.searchInFiles('foo', files, defaultOptions);

      expect(results['/test/file.ts']).toHaveLength(3);
    });

    it('should create case-sensitive pattern when specified', async () => {
      mockFileSystemService.readFile.mockResolvedValue('Foo FOO foo');

      const files = ['/test/file.ts'];
      const options: SearchOptions = { ...defaultOptions, caseSensitive: true };
      const results = await searchService.searchInFiles('foo', files, options);

      expect(results['/test/file.ts']).toHaveLength(1);
    });

    it('should create whole word pattern when specified', async () => {
      mockFileSystemService.readFile.mockResolvedValue('foo foobar food');

      const files = ['/test/file.ts'];
      const options: SearchOptions = { ...defaultOptions, wholeWord: true };
      const results = await searchService.searchInFiles('foo', files, options);

      expect(results['/test/file.ts']).toHaveLength(1);
    });

    it('should support regex patterns', async () => {
      mockFileSystemService.readFile.mockResolvedValue('test123 test456 abc789');

      const files = ['/test/file.ts'];
      const options: SearchOptions = { ...defaultOptions, regex: true };
      const results = await searchService.searchInFiles('test\\d+', files, options);

      expect(results['/test/file.ts']).toHaveLength(2);
    });

    it('should escape special characters in literal search', async () => {
      mockFileSystemService.readFile.mockResolvedValue('test.txt');

      const files = ['/test/file.ts'];
      const results = await searchService.searchInFiles('.', files, defaultOptions);

      expect(results['/test/file.ts']).toHaveLength(1);
    });

    it('should handle invalid regex gracefully', async () => {
      mockFileSystemService.readFile.mockResolvedValue('test(foo');

      const files = ['/test/file.ts'];
      const options: SearchOptions = { ...defaultOptions, regex: true };
      const results = await searchService.searchInFiles('test(', files, options);

      // Should fall back to literal search
      expect(results['/test/file.ts']).toBeDefined();
    });
  });

  describe('getSearchStats - Statistics', () => {
    it('should calculate search statistics', () => {
      const results = {
        '/test/file1.ts': [
          { file: '/test/file1.ts', line: 1, column: 1, text: 'foo', match: 'foo', before: '', after: '' },
          { file: '/test/file1.ts', line: 2, column: 1, text: 'foo', match: 'foo', before: '', after: '' },
        ],
        '/test/file2.ts': [
          { file: '/test/file2.ts', line: 1, column: 1, text: 'foo', match: 'foo', before: '', after: '' },
        ],
      };

      const stats = searchService.getSearchStats(results);

      expect(stats.totalMatches).toBe(3);
      expect(stats.fileCount).toBe(2);
      expect(stats.filesWithMatches).toEqual(['/test/file1.ts', '/test/file2.ts']);
    });

    it('should handle empty results', () => {
      const stats = searchService.getSearchStats({});

      expect(stats.totalMatches).toBe(0);
      expect(stats.fileCount).toBe(0);
      expect(stats.filesWithMatches).toEqual([]);
    });
  });

  describe('formatResults - Result Formatting', () => {
    it('should format search results as text', () => {
      const results = {
        '/test/file.ts': [
          { file: '/test/file.ts', line: 1, column: 7, text: 'const foo = 1;', match: 'foo', before: 'const ', after: ' = 1;' },
        ],
      };

      const formatted = searchService.formatResults(results);

      expect(formatted).toContain('Found 1 matches in 1 files');
      expect(formatted).toContain('/test/file.ts');
      expect(formatted).toContain('Line 1, Column 7');
    });

    it('should handle multiple files and matches', () => {
      const results = {
        '/test/file1.ts': [
          { file: '/test/file1.ts', line: 1, column: 1, text: 'foo', match: 'foo', before: '', after: '' },
        ],
        '/test/file2.ts': [
          { file: '/test/file2.ts', line: 1, column: 1, text: 'foo', match: 'foo', before: '', after: '' },
        ],
      };

      const formatted = searchService.formatResults(results);

      expect(formatted).toContain('Found 2 matches in 2 files');
    });
  });

  describe('exportResults - Export Functionality', () => {
    const mockResults = {
      '/test/file.ts': [
        { file: '/test/file.ts', line: 1, column: 7, text: 'const foo = 1;', match: 'foo', before: 'const ', after: ' = 1;' },
      ],
    };

    it('should export as JSON', () => {
      const exported = searchService.exportResults(mockResults, 'json');
      const parsed = JSON.parse(exported);

      expect(parsed['/test/file.ts']).toBeDefined();
      expect(parsed['/test/file.ts'][0].match).toBe('foo');
    });

    it('should export as CSV', () => {
      const exported = searchService.exportResults(mockResults, 'csv');

      expect(exported).toContain('File,Line,Column,Text,Match');
      expect(exported).toContain('"/test/file.ts",1,7');
    });

    it('should export as text', () => {
      const exported = searchService.exportResults(mockResults, 'txt');

      expect(exported).toContain('Found 1 matches in 1 files');
      expect(exported).toContain('/test/file.ts');
    });

    it('should handle CSV with quotes in content', () => {
      const results = {
        '/test/file.ts': [
          { file: '/test/file.ts', line: 1, column: 1, text: 'const "test" = 1;', match: 'test', before: '', after: '' },
        ],
      };

      const exported = searchService.exportResults(results, 'csv');

      expect(exported).toContain('""test""');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        searchService.exportResults(mockResults, 'xml' as any);
      }).toThrow('Unsupported format: xml');
    });

    it('should default to JSON format', () => {
      const exported = searchService.exportResults(mockResults);
      const parsed = JSON.parse(exported);

      expect(parsed).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long lines', async () => {
      const longLine = 'a'.repeat(10000) + 'foo' + 'b'.repeat(10000);
      mockFileSystemService.readFile.mockResolvedValue(longLine);

      const files = ['/test/file.ts'];
      const results = await searchService.searchInFiles('foo', files, defaultOptions);

      expect(results['/test/file.ts']).toHaveLength(1);
    });

    it('should handle files with many lines', async () => {
      const content = Array(10000).fill('line').join('\n') + '\nfoo';
      mockFileSystemService.readFile.mockResolvedValue(content);

      const files = ['/test/file.ts'];
      const results = await searchService.searchInFiles('foo', files, defaultOptions);

      expect(results['/test/file.ts']).toHaveLength(1);
      expect(results['/test/file.ts'][0].line).toBe(10001);
    });

    it('should handle special characters in search text', async () => {
      mockFileSystemService.readFile.mockResolvedValue('function test() {}');

      const files = ['/test/file.ts'];
      const results = await searchService.searchInFiles('()', files, defaultOptions);

      expect(results['/test/file.ts']).toHaveLength(1);
    });

    it('should handle unicode characters', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const emoji = "🚀";');

      const files = ['/test/file.ts'];
      const results = await searchService.searchInFiles('🚀', files, defaultOptions);

      expect(results['/test/file.ts']).toHaveLength(1);
    });

    it('should handle empty file list', async () => {
      const results = await searchService.searchInFiles('foo', [], defaultOptions);

      expect(results).toEqual({});
    });

    it('should handle concurrent searches', async () => {
      mockFileSystemService.readFile.mockResolvedValue('const foo = 1;');

      const files = ['/test/file1.ts', '/test/file2.ts', '/test/file3.ts'];

      const [results1, results2] = await Promise.all([
        searchService.searchInFiles('foo', files, defaultOptions),
        searchService.searchInFiles('foo', files, defaultOptions),
      ]);

      expect(Object.keys(results1)).toHaveLength(3);
      expect(Object.keys(results2)).toHaveLength(3);
    });
  });
});
