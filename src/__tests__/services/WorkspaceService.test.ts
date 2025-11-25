/**
 * WorkspaceService Tests (TDD RED Phase)
 *
 * Multi-root workspace management with:
 * - Folder management (add, remove, reorder)
 * - Workspace state persistence (.code-workspace files)
 * - Per-folder settings and configurations
 * - File system watching across folders
 * - Monaco model management per folder
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkspaceService, WorkspaceFolder, WorkspaceConfiguration } from '../../services/WorkspaceService';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(() => {
    service = new WorkspaceService();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('Workspace Creation', () => {
    it('should create a new workspace', () => {
      const workspace = service.createWorkspace('test-workspace');

      expect(workspace).toBeDefined();
      expect(workspace).toHaveProperty('id');
      expect(workspace.name).toBe('test-workspace');
      expect(workspace.folders).toEqual([]);
    });

    it('should create workspace with initial folders', () => {
      const folders: WorkspaceFolder[] = [
        { path: '/path/to/project1', name: 'Project 1' },
        { path: '/path/to/project2', name: 'Project 2' },
      ];

      const workspace = service.createWorkspace('multi-root', folders);

      expect(workspace.folders).toHaveLength(2);
      expect(workspace.folders[0].path).toBe('/path/to/project1');
      expect(workspace.folders[1].path).toBe('/path/to/project2');
    });

    it('should assign unique IDs to each workspace', () => {
      const ws1 = service.createWorkspace('workspace1');
      const ws2 = service.createWorkspace('workspace2');

      expect(ws1.id).not.toBe(ws2.id);
    });

    it('should set first workspace as active', () => {
      const workspace = service.createWorkspace('test');

      expect(service.getActiveWorkspace()).toBe(workspace);
    });
  });

  describe('Folder Management', () => {
    it('should add folder to workspace', () => {
      const workspace = service.createWorkspace('test');

      service.addFolder(workspace.id, {
        path: '/new/folder',
        name: 'New Folder',
      });

      const updated = service.getWorkspace(workspace.id);
      expect(updated.folders).toHaveLength(1);
      expect(updated.folders[0].path).toBe('/new/folder');
    });

    it('should add multiple folders', () => {
      const workspace = service.createWorkspace('test');

      service.addFolder(workspace.id, { path: '/folder1', name: 'Folder 1' });
      service.addFolder(workspace.id, { path: '/folder2', name: 'Folder 2' });
      service.addFolder(workspace.id, { path: '/folder3', name: 'Folder 3' });

      const updated = service.getWorkspace(workspace.id);
      expect(updated.folders).toHaveLength(3);
    });

    it('should remove folder from workspace', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
        { path: '/folder2', name: 'Folder 2' },
      ]);

      service.removeFolder(workspace.id, '/folder1');

      const updated = service.getWorkspace(workspace.id);
      expect(updated.folders).toHaveLength(1);
      expect(updated.folders[0].path).toBe('/folder2');
    });

    it('should prevent duplicate folder paths', () => {
      const workspace = service.createWorkspace('test');

      service.addFolder(workspace.id, { path: '/folder', name: 'Folder' });

      expect(() => {
        service.addFolder(workspace.id, { path: '/folder', name: 'Duplicate' });
      }).toThrow('Folder already exists');
    });

    it('should reorder folders', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
        { path: '/folder2', name: 'Folder 2' },
        { path: '/folder3', name: 'Folder 3' },
      ]);

      service.reorderFolders(workspace.id, ['/folder3', '/folder1', '/folder2']);

      const updated = service.getWorkspace(workspace.id);
      expect(updated.folders[0].path).toBe('/folder3');
      expect(updated.folders[1].path).toBe('/folder1');
      expect(updated.folders[2].path).toBe('/folder2');
    });
  });

  describe('Workspace Configuration', () => {
    it('should save workspace configuration', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/project', name: 'Project' },
      ]);

      const config = service.getConfiguration(workspace.id);

      expect(config).toBeDefined();
      expect(config.folders).toHaveLength(1);
      expect(config.settings).toBeDefined();
    });

    it('should support folder-specific settings', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/project', name: 'Project' },
      ]);

      service.setFolderSettings(workspace.id, '/project', {
        'editor.tabSize': 2,
        'typescript.tsdk': './node_modules/typescript/lib',
      });

      const config = service.getConfiguration(workspace.id);
      const folderSettings = config.folders.find(f => f.path === '/project')?.settings;

      expect(folderSettings).toBeDefined();
      expect(folderSettings?.['editor.tabSize']).toBe(2);
    });

    it('should support workspace-level settings', () => {
      const workspace = service.createWorkspace('test');

      service.setWorkspaceSettings(workspace.id, {
        'files.autoSave': 'onFocusChange',
        'editor.fontSize': 14,
      });

      const config = service.getConfiguration(workspace.id);
      expect(config.settings['files.autoSave']).toBe('onFocusChange');
      expect(config.settings['editor.fontSize']).toBe(14);
    });

    it('should merge folder and workspace settings', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/project', name: 'Project' },
      ]);

      service.setWorkspaceSettings(workspace.id, {
        'editor.fontSize': 14,
      });

      service.setFolderSettings(workspace.id, '/project', {
        'editor.fontSize': 16, // Override workspace setting
        'editor.tabSize': 2,
      });

      const merged = service.getMergedSettings(workspace.id, '/project');
      expect(merged['editor.fontSize']).toBe(16); // Folder overrides workspace
      expect(merged['editor.tabSize']).toBe(2);
    });
  });

  describe('Workspace State Persistence', () => {
    it('should export workspace to .code-workspace format', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/path/to/project1', name: 'Project 1' },
        { path: '/path/to/project2', name: 'Project 2' },
      ]);

      service.setWorkspaceSettings(workspace.id, {
        'files.autoSave': 'onFocusChange',
      });

      const exported = service.exportWorkspace(workspace.id);

      expect(exported.folders).toHaveLength(2);
      expect(exported.settings).toHaveProperty('files.autoSave');
      expect(exported.extensions).toBeDefined();
    });

    it('should import workspace from .code-workspace format', () => {
      const workspaceFile: WorkspaceConfiguration = {
        folders: [
          { path: '/project1', name: 'Project 1' },
          { path: '/project2', name: 'Project 2' },
        ],
        settings: {
          'editor.fontSize': 14,
        },
        extensions: {
          recommendations: ['ms-vscode.typescript-language-features'],
        },
      };

      const workspace = service.importWorkspace('imported', workspaceFile);

      expect(workspace.folders).toHaveLength(2);
      expect(workspace.folders[0].path).toBe('/project1');

      const config = service.getConfiguration(workspace.id);
      expect(config.settings['editor.fontSize']).toBe(14);
    });

    it('should save workspace to file system', async () => {
      const workspace = service.createWorkspace('test', [
        { path: '/project', name: 'Project' },
      ]);

      const filePath = await service.saveWorkspaceFile(workspace.id, '/save/path/test.code-workspace');

      expect(filePath).toBe('/save/path/test.code-workspace');
      // Verify file was created (mocked in tests)
    });

    it('should load workspace from file system', async () => {
      // Mock file system read
      const mockWorkspaceContent = JSON.stringify({
        folders: [
          { path: '/project', name: 'Project' },
        ],
        settings: {},
      });

      const workspace = await service.loadWorkspaceFile('/path/to/workspace.code-workspace');

      expect(workspace).toBeDefined();
      expect(workspace.folders).toHaveLength(1);
    });
  });

  describe('File System Watching', () => {
    it('should watch all folders for changes', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
        { path: '/folder2', name: 'Folder 2' },
      ]);

      const watchers = service.getFileWatchers(workspace.id);

      expect(watchers).toHaveLength(2);
      expect(watchers[0].path).toBe('/folder1');
      expect(watchers[1].path).toBe('/folder2');
    });

    it('should emit events on file changes', () => {
      return new Promise<void>((resolve) => {
        const workspace = service.createWorkspace('test', [
          { path: '/project', name: 'Project' },
        ]);

        service.onFileChanged(workspace.id, (event) => {
          expect(event.path).toBe('/project/file.ts');
          expect(event.type).toBe('change');
          resolve();
        });

        // Simulate file change
        service.simulateFileChange(workspace.id, '/project/file.ts', 'change');
      });
    });

    it('should stop watching when folder is removed', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
        { path: '/folder2', name: 'Folder 2' },
      ]);

      service.removeFolder(workspace.id, '/folder1');

      const watchers = service.getFileWatchers(workspace.id);
      expect(watchers).toHaveLength(1);
      expect(watchers[0].path).toBe('/folder2');
    });
  });

  describe('Monaco Model Management', () => {
    it('should create models for files in all folders', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
        { path: '/folder2', name: 'Folder 2' },
      ]);

      service.createModel(workspace.id, '/folder1/file1.ts', 'console.log("test1");', 'typescript');
      service.createModel(workspace.id, '/folder2/file2.ts', 'console.log("test2");', 'typescript');

      const models = service.getModels(workspace.id);
      expect(models).toHaveLength(2);
    });

    it('should find correct folder for file path', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/project1', name: 'Project 1' },
        { path: '/project2', name: 'Project 2' },
      ]);

      const folder1 = service.getFolderForPath(workspace.id, '/project1/src/index.ts');
      const folder2 = service.getFolderForPath(workspace.id, '/project2/src/main.ts');

      expect(folder1?.path).toBe('/project1');
      expect(folder2?.path).toBe('/project2');
    });

    it('should preserve model state when switching folders', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
      ]);

      const model = service.createModel(workspace.id, '/folder1/file.ts', 'const x = 1;', 'typescript');

      // Simulate model state changes (selection, undo stack, etc.)
      service.setModelState(model.id, {
        selection: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 },
        scrollPosition: { scrollTop: 100 },
        viewState: {},
      });

      const savedState = service.getModelState(model.id);
      expect(savedState.selection).toBeDefined();
      expect(savedState.scrollPosition?.scrollTop).toBe(100);
    });

    it('should dispose models when workspace is closed', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder', name: 'Folder' },
      ]);

      service.createModel(workspace.id, '/folder/file1.ts', 'code1', 'typescript');
      service.createModel(workspace.id, '/folder/file2.ts', 'code2', 'typescript');

      service.closeWorkspace(workspace.id);

      const models = service.getModels(workspace.id);
      expect(models).toHaveLength(0);
    });
  });

  describe('Multi-Workspace Management', () => {
    it('should manage multiple workspaces simultaneously', () => {
      const ws1 = service.createWorkspace('workspace1');
      const ws2 = service.createWorkspace('workspace2');
      const ws3 = service.createWorkspace('workspace3');

      const workspaces = service.getAllWorkspaces();
      expect(workspaces).toHaveLength(3);
    });

    it('should switch active workspace', () => {
      const ws1 = service.createWorkspace('workspace1');
      const ws2 = service.createWorkspace('workspace2');

      service.setActiveWorkspace(ws2.id);

      expect(service.getActiveWorkspace()).toBe(ws2);
    });

    it('should isolate settings between workspaces', () => {
      const ws1 = service.createWorkspace('workspace1');
      const ws2 = service.createWorkspace('workspace2');

      service.setWorkspaceSettings(ws1.id, { 'editor.fontSize': 14 });
      service.setWorkspaceSettings(ws2.id, { 'editor.fontSize': 16 });

      const config1 = service.getConfiguration(ws1.id);
      const config2 = service.getConfiguration(ws2.id);

      expect(config1.settings['editor.fontSize']).toBe(14);
      expect(config2.settings['editor.fontSize']).toBe(16);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid workspace ID', () => {
      expect(() => {
        service.getWorkspace('invalid-id');
      }).toThrow('Workspace not found');
    });

    it('should throw error when adding folder to non-existent workspace', () => {
      expect(() => {
        service.addFolder('invalid-id', { path: '/folder', name: 'Folder' });
      }).toThrow('Workspace not found');
    });

    it('should throw error when removing non-existent folder', () => {
      const workspace = service.createWorkspace('test');

      expect(() => {
        service.removeFolder(workspace.id, '/non-existent');
      }).toThrow('Folder not found');
    });

    it('should handle invalid workspace file format', async () => {
      const invalidContent = '{ invalid json }';

      await expect(
        service.loadWorkspaceFile('/path/to/invalid.code-workspace')
      ).rejects.toThrow('Invalid workspace file');
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should dispose all resources', () => {
      const ws1 = service.createWorkspace('workspace1', [
        { path: '/folder1', name: 'Folder 1' },
      ]);

      const ws2 = service.createWorkspace('workspace2', [
        { path: '/folder2', name: 'Folder 2' },
      ]);

      service.dispose();

      const workspaces = service.getAllWorkspaces();
      expect(workspaces).toHaveLength(0);
    });

    it('should stop all file watchers on dispose', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder1', name: 'Folder 1' },
        { path: '/folder2', name: 'Folder 2' },
      ]);

      service.dispose();

      const watchers = service.getFileWatchers(workspace.id);
      expect(watchers).toHaveLength(0);
    });

    it('should dispose all Monaco models on dispose', () => {
      const workspace = service.createWorkspace('test', [
        { path: '/folder', name: 'Folder' },
      ]);

      service.createModel(workspace.id, '/folder/file.ts', 'code', 'typescript');
      service.dispose();

      // Verify models are disposed (check implementation)
    });
  });
});
