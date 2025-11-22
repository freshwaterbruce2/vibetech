import { describe, it, expect, beforeEach } from 'vitest';
import { ContextService, CodeContext } from '../../services/ContextService';
import { EditorFile, WorkspaceContext } from '../../types';

describe('ContextService', () => {
  let contextService: ContextService;

  beforeEach(() => {
    contextService = new ContextService();
  });

  const createMockFile = (path: string, name?: string, content?: string): EditorFile => ({
    path,
    name: name || path.split('/').pop() || 'file',
    content: content || `// Content of ${path}`,
    language: path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : 'javascript',
    isDirty: false,
    lastModified: new Date()
  });

  const createMockWorkspaceContext = (): WorkspaceContext => ({
    rootPath: '/test/workspace',
    totalFiles: 25,
    languages: ['typescript', 'javascript', 'css'],
    testFiles: 5,
    projectStructure: {
      packageJson: { name: 'test-project', version: '1.0.0' }
    },
    dependencies: {},
    exports: {},
    symbols: {},
    lastIndexed: new Date(),
    summary: 'Test workspace with 25 files across 3 languages. Primary languages: typescript, javascript, css. 5 test files detected.'
  });

  describe('addRecentFile', () => {
    it('should add file to recent files list', () => {
      const file = createMockFile('/test/file1.ts', 'file1.ts');
      
      contextService.addRecentFile(file);
      const recentFiles = contextService.getRecentFiles();
      
      expect(recentFiles).toHaveLength(1);
      expect(recentFiles[0]).toEqual(file);
    });

    it('should add files to beginning of list', () => {
      const file1 = createMockFile('/test/file1.ts', 'file1.ts');
      const file2 = createMockFile('/test/file2.ts', 'file2.ts');
      
      contextService.addRecentFile(file1);
      contextService.addRecentFile(file2);
      
      const recentFiles = contextService.getRecentFiles();
      expect(recentFiles[0]).toEqual(file2);
      expect(recentFiles[1]).toEqual(file1);
    });

    it('should remove duplicate files', () => {
      const file1 = createMockFile('/test/file1.ts', 'file1.ts');
      const file2 = createMockFile('/test/file2.ts', 'file2.ts');
      const file1Updated = createMockFile('/test/file1.ts', 'file1.ts', 'updated content');
      
      contextService.addRecentFile(file1);
      contextService.addRecentFile(file2);
      contextService.addRecentFile(file1Updated);
      
      const recentFiles = contextService.getRecentFiles();
      expect(recentFiles).toHaveLength(2);
      expect(recentFiles[0]).toEqual(file1Updated);
      expect(recentFiles[1]).toEqual(file2);
    });

    it('should maintain maximum of 10 recent files', () => {
      // Add 15 files
      for (let i = 0; i < 15; i++) {
        const file = createMockFile(`/test/file${i}.ts`, `file${i}.ts`);
        contextService.addRecentFile(file);
      }
      
      const recentFiles = contextService.getRecentFiles();
      expect(recentFiles).toHaveLength(10);
      
      // Should contain files 14, 13, 12... 5 (newest 10)
      expect(recentFiles[0].name).toBe('file14.ts');
      expect(recentFiles[9].name).toBe('file5.ts');
    });
  });

  describe('getRecentFiles', () => {
    it('should return empty array initially', () => {
      const recentFiles = contextService.getRecentFiles();
      expect(recentFiles).toEqual([]);
    });

    it('should return copy of recent files array', () => {
      const file = createMockFile('/test/file.ts', 'file.ts');
      contextService.addRecentFile(file);
      
      const recentFiles1 = contextService.getRecentFiles();
      const recentFiles2 = contextService.getRecentFiles();
      
      expect(recentFiles1).not.toBe(recentFiles2); // Different array instances
      expect(recentFiles1).toEqual(recentFiles2); // But same content
    });
  });

  describe('buildCodeContext', () => {
    const mockFile1 = createMockFile('/test/src/App.tsx', 'App.tsx');
    const mockFile2 = createMockFile('/test/src/utils/helper.ts', 'helper.ts');
    const mockFile3 = createMockFile('/test/src/components/Button.tsx', 'Button.tsx');

    beforeEach(() => {
      contextService.addRecentFile(mockFile1);
      contextService.addRecentFile(mockFile2);
    });

    it('should build context with no current file', () => {
      const openFiles = [mockFile1, mockFile2];
      const context = contextService.buildCodeContext(null, openFiles);
      
      expect(context.currentFile).toBeUndefined();
      expect(context.openFiles).toEqual(openFiles);
      expect(context.recentFiles).toHaveLength(2);
      expect(context.relatedFiles).toEqual([]);
    });

    it('should build context with current file', () => {
      const openFiles = [mockFile1, mockFile2, mockFile3];
      const context = contextService.buildCodeContext(mockFile1, openFiles);
      
      expect(context.currentFile).toEqual(mockFile1);
      expect(context.openFiles).toEqual(openFiles);
      expect(context.recentFiles).toHaveLength(2);
    });

    it('should include workspace context', () => {
      const workspaceContext = createMockWorkspaceContext();
      const context = contextService.buildCodeContext(mockFile1, [mockFile1], workspaceContext);
      
      expect(context.workspaceContext).toEqual(workspaceContext);
    });

    it('should get related files from callback', () => {
      const mockRelatedFiles = [
        { path: '/test/related1.ts', content: 'related content 1', relevance: 0.9, reason: 'imports' },
        { path: '/test/related2.ts', content: 'related content 2', relevance: 0.8, reason: 'same directory' }
      ];
      
      const getFileContext = () => mockRelatedFiles;
      const context = contextService.buildCodeContext(mockFile1, [mockFile1], undefined, getFileContext);
      
      expect(context.relatedFiles).toEqual(mockRelatedFiles);
    });

    it('should limit related files to 5', () => {
      const mockRelatedFiles = Array.from({ length: 10 }, (_, i) => ({
        path: `/test/related${i}.ts`,
        content: `content ${i}`,
        relevance: 1 - i * 0.1,
        reason: 'related'
      }));
      
      const getFileContext = () => mockRelatedFiles;
      const context = contextService.buildCodeContext(mockFile1, [mockFile1], undefined, getFileContext);
      
      expect(context.relatedFiles).toHaveLength(5);
    });
  });

  describe('summarizeContext', () => {
    it('should summarize context with no current file', () => {
      const context: CodeContext = {
        openFiles: [createMockFile('/test/file1.ts'), createMockFile('/test/file2.ts')],
        recentFiles: [],
        relatedFiles: []
      };
      
      const summary = contextService.summarizeContext(context);
      expect(summary).toContain('Open files: file1.ts, file2.ts');
    });

    it('should summarize context with current file', () => {
      const currentFile = createMockFile('/test/App.tsx', 'App.tsx');
      const context: CodeContext = {
        currentFile,
        openFiles: [currentFile, createMockFile('/test/helper.ts')],
        recentFiles: [],
        relatedFiles: []
      };
      
      const summary = contextService.summarizeContext(context);
      expect(summary).toContain('Current file: App.tsx (typescript)');
      expect(summary).toContain('Open files: helper.ts');
    });

    it('should include selected code information', () => {
      const currentFile = createMockFile('/test/App.tsx', 'App.tsx');
      const context: CodeContext = {
        currentFile,
        openFiles: [currentFile],
        recentFiles: [],
        relatedFiles: [],
        selectedCode: {
          code: 'const test = 1;',
          startLine: 10,
          endLine: 12
        }
      };
      
      const summary = contextService.summarizeContext(context);
      expect(summary).toContain('Selected code: Lines 10-12');
    });

    it('should include workspace information', () => {
      const workspaceContext = createMockWorkspaceContext();
      const context: CodeContext = {
        openFiles: [],
        recentFiles: [],
        relatedFiles: [],
        workspaceContext
      };
      
      const summary = contextService.summarizeContext(context);
      expect(summary).toContain('Workspace: 25 files, Languages: typescript, javascript, css');
    });

    it('should include related files information', () => {
      const context: CodeContext = {
        openFiles: [],
        recentFiles: [],
        relatedFiles: [
          { path: '/test/related.ts', content: '', relevance: 0.9, reason: 'imports' },
          { path: '/test/helper.ts', content: '', relevance: 0.8, reason: 'same directory' }
        ]
      };
      
      const summary = contextService.summarizeContext(context);
      expect(summary).toContain('Related: /test/related.ts (imports), /test/helper.ts (same directory)');
    });
  });

  describe('getContextWindow', () => {
    it('should return empty string for empty context', () => {
      const context: CodeContext = {
        openFiles: [],
        recentFiles: [],
        relatedFiles: []
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toBe('');
    });

    it('should include current file content', () => {
      const currentFile = createMockFile('/test/App.tsx', 'App.tsx', 'const App = () => <div>Hello</div>;');
      const context: CodeContext = {
        currentFile,
        openFiles: [currentFile],
        recentFiles: [],
        relatedFiles: []
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toContain('=== Current File: App.tsx ===');
      expect(window).toContain('const App = () => <div>Hello</div>;');
    });

    it('should include related files', () => {
      const context: CodeContext = {
        openFiles: [],
        recentFiles: [],
        relatedFiles: [
          { 
            path: '/test/helper.ts', 
            content: 'export const helper = () => "help";', 
            relevance: 0.9, 
            reason: 'imports' 
          }
        ]
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toContain('=== Related: /test/helper.ts (imports) ===');
      expect(window).toContain('export const helper = () => "help";');
    });

    it('should include workspace summary', () => {
      const workspaceContext = createMockWorkspaceContext();
      const context: CodeContext = {
        openFiles: [],
        recentFiles: [],
        relatedFiles: [],
        workspaceContext
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toContain('=== Workspace Summary ===');
      expect(window).toContain('Test workspace with 25 files');
    });

    it('should respect token limits', () => {
      const longContent = 'a'.repeat(20000); // Very long content
      const currentFile = createMockFile('/test/App.tsx', 'App.tsx', longContent);
      const context: CodeContext = {
        currentFile,
        openFiles: [currentFile],
        recentFiles: [],
        relatedFiles: [
          { path: '/test/helper.ts', content: 'b'.repeat(10000), relevance: 0.9, reason: 'imports' }
        ]
      };
      
      const window = contextService.getContextWindow(context, 1000); // Small token limit
      
      // Should include current file but not related file due to token limit
      expect(window).toContain('=== Current File: App.tsx ===');
      expect(window).not.toContain('=== Related: /test/helper.ts');
    });

    it('should extract relevant code with selection', () => {
      const fileContent = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
      const currentFile = createMockFile('/test/App.tsx', 'App.tsx', fileContent);
      const context: CodeContext = {
        currentFile,
        openFiles: [currentFile],
        recentFiles: [],
        relatedFiles: [],
        selectedCode: {
          code: 'line 50\nline 51\nline 52',
          startLine: 49,
          endLine: 51
        }
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toContain('line 40'); // Should include context before selection
      expect(window).toContain('line 50'); // Selection
      expect(window).toContain('line 60'); // Should include context after selection  
    });
  });

  describe('clearCache', () => {
    it('should clear internal cache', () => {
      // Add some files to establish state
      contextService.addRecentFile(createMockFile('/test/file.ts'));
      
      // Clear cache (this clears internal cache, not recent files)
      contextService.clearCache();
      
      // Recent files should still be there (clearCache only clears internal context cache)
      expect(contextService.getRecentFiles()).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no extension', () => {
      const file = createMockFile('/test/Dockerfile', 'Dockerfile');
      contextService.addRecentFile(file);
      
      const context = contextService.buildCodeContext(file, [file]);
      const summary = contextService.summarizeContext(context);
      
      expect(summary).toContain('Dockerfile');
    });

    it('should handle very long file paths', () => {
      const longPath = '/very/long/path/' + 'directory/'.repeat(20) + 'file.ts';
      const file = createMockFile(longPath, 'file.ts');
      
      contextService.addRecentFile(file);
      const context = contextService.buildCodeContext(file, [file]);
      
      expect(context.currentFile?.path).toBe(longPath);
    });

    it('should handle empty file content', () => {
      const file = createMockFile('/test/empty.ts', 'empty.ts', '');
      const context: CodeContext = {
        currentFile: file,
        openFiles: [file],
        recentFiles: [],
        relatedFiles: []
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toContain('=== Current File: empty.ts ===');
    });

    it('should handle selected code at file boundaries', () => {
      const fileContent = 'line 1\nline 2\nline 3';
      const currentFile = createMockFile('/test/App.tsx', 'App.tsx', fileContent);
      const context: CodeContext = {
        currentFile,
        openFiles: [currentFile],
        recentFiles: [],
        relatedFiles: [],
        selectedCode: {
          code: 'line 1',
          startLine: 0,
          endLine: 0
        }
      };
      
      const window = contextService.getContextWindow(context);
      expect(window).toContain('line 1');
      expect(window).toContain('line 2'); // Should include some context
    });
  });

  describe('Integration', () => {
    it('should work with complete workflow', () => {
      // Setup files
      const files = [
        createMockFile('/project/src/App.tsx', 'App.tsx', 'import { helper } from "./utils/helper";'),
        createMockFile('/project/src/utils/helper.ts', 'helper.ts', 'export const helper = () => "help";'),
        createMockFile('/project/src/components/Button.tsx', 'Button.tsx', 'export const Button = () => <button>Click</button>;')
      ];
      
      // Add to recent files
      files.forEach(file => contextService.addRecentFile(file));
      
      // Build context with related files
      const mockRelatedFiles = [
        { path: '/project/src/utils/helper.ts', content: files[1].content!, relevance: 0.9, reason: 'direct import' }
      ];
      
      const getFileContext = () => mockRelatedFiles;
      const workspaceContext = createMockWorkspaceContext();
      
      const context = contextService.buildCodeContext(
        files[0], // Current file: App.tsx
        files, // All open files
        workspaceContext,
        getFileContext
      );
      
      // Verify context
      expect(context.currentFile).toEqual(files[0]);
      expect(context.openFiles).toEqual(files);
      expect(context.recentFiles).toHaveLength(3);
      expect(context.relatedFiles).toEqual(mockRelatedFiles);
      expect(context.workspaceContext).toEqual(workspaceContext);
      
      // Generate summary
      const summary = contextService.summarizeContext(context);
      expect(summary).toContain('Current file: App.tsx (typescript)');
      expect(summary).toContain('Workspace: 25 files');
      expect(summary).toContain('Related: /project/src/utils/helper.ts (direct import)');
      
      // Generate context window
      const window = contextService.getContextWindow(context);
      expect(window).toContain('=== Current File: App.tsx ===');
      expect(window).toContain('import { helper }');
      expect(window).toContain('=== Related: /project/src/utils/helper.ts (direct import) ===');
      expect(window).toContain('=== Workspace Summary ===');
    });
  });
});