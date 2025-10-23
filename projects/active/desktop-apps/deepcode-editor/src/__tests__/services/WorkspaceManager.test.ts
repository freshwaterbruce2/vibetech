/**
 * WorkspaceManager Service Tests
 *
 * Tests workspace folder selection, persistence, and management
 * using Test-Driven Development (TDD) methodology
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceManager } from '../../services/WorkspaceManager';

// Mock Tauri APIs
const mockOpenDialog = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockReadDir = vi.fn();

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: any[]) => mockOpenDialog(...args),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: (...args: any[]) => mockReadFile(...args),
  writeTextFile: (...args: any[]) => mockWriteFile(...args),
  readDir: (...args: any[]) => mockReadDir(...args),
  exists: vi.fn(() => Promise.resolve(true)),
}));

describe('WorkspaceManager', () => {
  let workspaceManager: WorkspaceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); // Clear before instantiation
    workspaceManager = new WorkspaceManager();
  });

  describe('selectWorkspaceFolder', () => {
    it('should open folder selection dialog', async () => {
      mockOpenDialog.mockResolvedValue('C:\\test\\workspace');

      const result = await workspaceManager.selectWorkspaceFolder();

      expect(mockOpenDialog).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
        title: 'Select Workspace Folder',
      });
      expect(result).toBe('C:\\test\\workspace');
    });

    it('should return null if user cancels dialog', async () => {
      mockOpenDialog.mockResolvedValue(null);

      const result = await workspaceManager.selectWorkspaceFolder();

      expect(result).toBeNull();
    });

    it('should store selected folder in localStorage', async () => {
      const testPath = 'C:\\test\\workspace';
      mockOpenDialog.mockResolvedValue(testPath);

      await workspaceManager.selectWorkspaceFolder();

      const stored = localStorage.getItem('workspace_current');
      expect(stored).toBe(testPath);
    });

    it('should add selected folder to recent workspaces', async () => {
      const testPath = 'C:\\test\\workspace';
      mockOpenDialog.mockResolvedValue(testPath);

      await workspaceManager.selectWorkspaceFolder();

      const recent = JSON.parse(localStorage.getItem('workspace_recent') || '[]');
      expect(recent).toContain(testPath);
    });

    it('should emit workspace-changed event', async () => {
      const testPath = 'C:\\test\\workspace';
      mockOpenDialog.mockResolvedValue(testPath);

      const eventListener = vi.fn();
      window.addEventListener('workspace-changed', eventListener);

      await workspaceManager.selectWorkspaceFolder();

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('workspace-changed', eventListener);
    });
  });

  describe('getCurrentWorkspace', () => {
    it('should return null if no workspace selected', () => {
      const result = workspaceManager.getCurrentWorkspace();
      expect(result).toBeNull();
    });

    it('should return current workspace path', async () => {
      const testPath = 'C:\\test\\workspace';
      mockOpenDialog.mockResolvedValue(testPath);

      await workspaceManager.selectWorkspaceFolder();
      const result = workspaceManager.getCurrentWorkspace();

      expect(result).toBe(testPath);
    });

    it('should restore workspace from localStorage on init', () => {
      const testPath = 'C:\\test\\workspace';
      localStorage.setItem('workspace_current', testPath);

      const newManager = new WorkspaceManager();
      const result = newManager.getCurrentWorkspace();

      expect(result).toBe(testPath);
    });
  });

  describe('getRecentWorkspaces', () => {
    it('should return empty array if no recent workspaces', () => {
      const result = workspaceManager.getRecentWorkspaces();
      expect(result).toEqual([]);
    });

    it('should return recent workspaces list', async () => {
      const paths = ['C:\\test\\workspace1', 'C:\\test\\workspace2'];

      for (const path of paths) {
        mockOpenDialog.mockResolvedValue(path);
        await workspaceManager.selectWorkspaceFolder();
      }

      const result = workspaceManager.getRecentWorkspaces();
      // Most recent first
      expect(result).toEqual(['C:\\test\\workspace2', 'C:\\test\\workspace1']);
    });

    it('should limit recent workspaces to 5', async () => {
      const paths = Array.from({ length: 7 }, (_, i) => `C:\\test\\workspace${i}`);

      for (const path of paths) {
        mockOpenDialog.mockResolvedValue(path);
        await workspaceManager.selectWorkspaceFolder();
      }

      const result = workspaceManager.getRecentWorkspaces();
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(paths[6]); // Most recent first
    });
  });

  describe('switchWorkspace', () => {
    it('should switch to a different workspace', async () => {
      const testPath = 'C:\\test\\workspace2';

      await workspaceManager.switchWorkspace(testPath);

      const current = workspaceManager.getCurrentWorkspace();
      expect(current).toBe(testPath);
    });

    it('should emit workspace-changed event on switch', async () => {
      const eventListener = vi.fn();
      window.addEventListener('workspace-changed', eventListener);

      await workspaceManager.switchWorkspace('C:\\test\\workspace2');

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('workspace-changed', eventListener);
    });
  });

  describe('closeWorkspace', () => {
    it('should clear current workspace', async () => {
      mockOpenDialog.mockResolvedValue('C:\\test\\workspace');
      await workspaceManager.selectWorkspaceFolder();

      workspaceManager.closeWorkspace();

      const current = workspaceManager.getCurrentWorkspace();
      expect(current).toBeNull();
    });

    it('should emit workspace-changed event', () => {
      const eventListener = vi.fn();
      window.addEventListener('workspace-changed', eventListener);

      workspaceManager.closeWorkspace();

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('workspace-changed', eventListener);
    });
  });

  describe('getWorkspaceName', () => {
    it('should return folder name from path', async () => {
      mockOpenDialog.mockResolvedValue('C:\\test\\my-project');
      await workspaceManager.selectWorkspaceFolder();

      const name = workspaceManager.getWorkspaceName();
      expect(name).toBe('my-project');
    });

    it('should return null if no workspace', () => {
      const name = workspaceManager.getWorkspaceName();
      expect(name).toBeNull();
    });
  });
});
