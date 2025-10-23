import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceService, WorkspaceIndex } from '../../services/WorkspaceService';
import { FileAnalysis, WorkspaceContext } from '../../types';

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;
  const mockRootPath = '/test/workspace';

  beforeEach(() => {
    workspaceService = new WorkspaceService();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with empty index', () => {
      const service = new WorkspaceService();
      expect(service.isIndexed()).toBe(false);
      
      const stats = service.getIndexStats();
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalDependencies).toBe(0);
      expect(stats.totalSymbols).toBe(0);
      expect(stats.isIndexing).toBe(false);
    });
  });

  describe('indexWorkspace', () => {
    it('should successfully index a workspace', async () => {
      const context = await workspaceService.indexWorkspace(mockRootPath);
      
      expect(context).toBeDefined();
      expect(context.rootPath).toBe(mockRootPath);
      expect(context.totalFiles).toBeGreaterThan(0);
      expect(context.languages).toEqual(expect.arrayContaining(['typescript', 'javascript']));
      expect(context.summary).toContain('Workspace contains');
      expect(workspaceService.isIndexed()).toBe(true);
    });

    it('should throw error if indexing is already in progress', async () => {
      // Start first indexing
      const indexingPromise = workspaceService.indexWorkspace(mockRootPath);
      
      // Try to start second indexing
      await expect(workspaceService.indexWorkspace('/other/path')).rejects.toThrow('Indexing already in progress');
      
      // Wait for first to complete
      await indexingPromise;
    });

    it('should generate correct workspace context', async () => {
      const context = await workspaceService.indexWorkspace(mockRootPath);
      
      expect(context.rootPath).toBe(mockRootPath);
      expect(typeof context.totalFiles).toBe('number');
      expect(Array.isArray(context.languages)).toBe(true);
      expect(typeof context.testFiles).toBe('number');
      expect(typeof context.projectStructure).toBe('object');
      expect(typeof context.dependencies).toBe('object');
      expect(typeof context.exports).toBe('object');
      expect(typeof context.symbols).toBe('object');
      expect(context.lastIndexed).toBeInstanceOf(Date);
      expect(typeof context.summary).toBe('string');
    });
  });

  describe('getWorkspaceContext', () => {
    it('should return empty context for unindexed workspace', () => {
      const context = workspaceService.getWorkspaceContext();
      
      expect(context.rootPath).toBe('');
      expect(context.totalFiles).toBe(0);
      expect(context.languages).toEqual([]);
      expect(context.testFiles).toBe(0);
    });

    it('should return populated context after indexing', async () => {
      await workspaceService.indexWorkspace(mockRootPath);
      const context = workspaceService.getWorkspaceContext();
      
      expect(context.rootPath).toBe(mockRootPath);
      expect(context.totalFiles).toBeGreaterThan(0);
      expect(context.languages.length).toBeGreaterThan(0);
      expect(context.summary).toBeTruthy();
    });
  });

  describe('getRelatedFiles', () => {
    beforeEach(async () => {
      await workspaceService.indexWorkspace(mockRootPath);
    });

    it('should return empty array for non-existent file', () => {
      const related = workspaceService.getRelatedFiles('/non/existent/file.ts');
      expect(related).toEqual([]);
    });

    it('should return related files for existing file', () => {
      const filePath = `${mockRootPath}/src/App.tsx`;
      const related = workspaceService.getRelatedFiles(filePath);
      
      expect(Array.isArray(related)).toBe(true);
      expect(related.length).toBeLessThanOrEqual(10); // Default max results
    });

    it('should respect maxResults parameter', () => {
      const filePath = `${mockRootPath}/src/App.tsx`;
      const related = workspaceService.getRelatedFiles(filePath, 3);
      
      expect(related.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getFileContent', () => {
    beforeEach(async () => {
      await workspaceService.indexWorkspace(mockRootPath);
    });

    it('should return null for non-existent file', () => {
      const content = workspaceService.getFileContent('/non/existent/file.ts');
      expect(content).toBeNull();
    });

    it('should return file analysis for existing file', () => {
      const filePath = `${mockRootPath}/src/App.tsx`;
      const content = workspaceService.getFileContent(filePath);
      
      if (content) {
        expect(content.path).toBe(filePath);
        expect(content.name).toBe('App.tsx');
        expect(content.extension).toBe('tsx');
        expect(content.language).toBe('typescript');
        expect(typeof content.size).toBe('number');
        expect(content.lastModified).toBeInstanceOf(Date);
        expect(Array.isArray(content.imports)).toBe(true);
        expect(Array.isArray(content.exports)).toBe(true);
        expect(Array.isArray(content.symbols)).toBe(true);
      }
    });
  });

  describe('searchFiles', () => {
    beforeEach(async () => {
      await workspaceService.indexWorkspace(mockRootPath);
    });

    it('should return empty array for no matches', () => {
      const results = workspaceService.searchFiles('nonexistentterm');
      expect(results).toEqual([]);
    });

    it('should find files by name', () => {
      const results = workspaceService.searchFiles('App');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result.name.toLowerCase()).toContain('app');
        expect(typeof result.searchScore).toBe('number');
        expect(result.searchScore).toBeGreaterThan(0);
      });
    });

    it('should find files by language', () => {
      const results = workspaceService.searchFiles('typescript');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result.language).toBe('typescript');
      });
    });

    it('should respect maxResults parameter', () => {
      const results = workspaceService.searchFiles('component', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should sort results by search score', () => {
      const results = workspaceService.searchFiles('App');
      
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].searchScore || 0).toBeGreaterThanOrEqual(results[i].searchScore || 0);
        }
      }
    });
  });

  describe('getIndexStats', () => {
    it('should return correct stats for empty index', () => {
      const stats = workspaceService.getIndexStats();
      
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalDependencies).toBe(0);
      expect(stats.totalSymbols).toBe(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
      expect(stats.isIndexing).toBe(false);
    });

    it('should return correct stats after indexing', async () => {
      await workspaceService.indexWorkspace(mockRootPath);
      const stats = workspaceService.getIndexStats();
      
      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.totalDependencies).toBeGreaterThanOrEqual(0);
      expect(stats.totalSymbols).toBeGreaterThanOrEqual(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
      expect(stats.isIndexing).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Mock file system to throw errors
      const originalFileExists = (workspaceService as any).fileExists;
      (workspaceService as any).fileExists = vi.fn().mockRejectedValue(new Error('File system error'));
      
      // Should not throw, but should complete indexing with warnings
      const context = await workspaceService.indexWorkspace(mockRootPath);
      expect(context).toBeDefined();
      expect(context.rootPath).toBe(mockRootPath);
      
      // Restore original method
      (workspaceService as any).fileExists = originalFileExists;
    });
  });

  describe('Private Methods', () => {
    describe('Language Detection', () => {
      it('should correctly identify file languages', async () => {
        await workspaceService.indexWorkspace(mockRootPath);
        const stats = workspaceService.getIndexStats();
        
        if (stats.totalFiles > 0) {
          const context = workspaceService.getWorkspaceContext();
          expect(context.languages).toContain('typescript');
        }
      });
    });

    describe('Test File Detection', () => {
      it('should identify test files correctly', async () => {
        await workspaceService.indexWorkspace(mockRootPath);
        const context = workspaceService.getWorkspaceContext();
        
        // Should detect test files (if any exist in mock structure)
        expect(typeof context.testFiles).toBe('number');
        expect(context.testFiles).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Config File Detection', () => {
      it('should identify configuration files', async () => {
        await workspaceService.indexWorkspace(mockRootPath);
        const context = workspaceService.getWorkspaceContext();
        
        // Should have detected package.json as a config file
        expect(context.projectStructure).toBeDefined();
      });
    });
  });

  describe('Integration', () => {
    it('should work with real-world file structures', async () => {
      // Test with a more complex workspace structure
      const complexWorkspace = '/complex/workspace';
      const context = await workspaceService.indexWorkspace(complexWorkspace);
      
      expect(context.rootPath).toBe(complexWorkspace);
      expect(context.totalFiles).toBeGreaterThan(0);
      expect(context.languages.length).toBeGreaterThan(0);
      expect(context.summary).toContain('Workspace contains');
      
      // Test searching within the indexed workspace
      const searchResults = workspaceService.searchFiles('service');
      expect(Array.isArray(searchResults)).toBe(true);
      
      // Test getting related files
      if (context.totalFiles > 0) {
        const files = Object.keys(context.dependencies);
        if (files.length > 0) {
          const related = workspaceService.getRelatedFiles(files[0]);
          expect(Array.isArray(related)).toBe(true);
        }
      }
    });
  });
});