/**
 * Tests for useEditorStore - Zustand state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '../../stores/useEditorStore';
import { EditorFile } from '../../types';

describe('useEditorStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.actions.closeFile(result.current.openFiles[0]?.id || '');
      result.current.actions.clearNotifications();
    });
  });

  describe('file management', () => {
    it('should open a file', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: 'console.log("test");',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file);
      });

      expect(result.current.openFiles).toHaveLength(1);
      expect(result.current.currentFile?.id).toBe('file1');
    });

    it('should not duplicate files when opening same file twice', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file);
        result.current.actions.openFile(file);
      });

      expect(result.current.openFiles).toHaveLength(1);
    });

    it('should close a file', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file);
        result.current.actions.closeFile('file1');
      });

      expect(result.current.openFiles).toHaveLength(0);
      expect(result.current.currentFile).toBeNull();
    });

    it('should update current file when closing current file with others open', () => {
      const { result } = renderHook(() => useEditorStore());

      const file1: EditorFile = {
        id: 'file1',
        name: 'test1.ts',
        path: '/test1.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      const file2: EditorFile = {
        id: 'file2',
        name: 'test2.ts',
        path: '/test2.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file1);
        result.current.actions.openFile(file2);
        result.current.actions.closeFile('file2');
      });

      expect(result.current.currentFile?.id).toBe('file1');
    });

    it('should update file content', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: 'old content',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file);
        result.current.actions.updateFile('file1', { content: 'new content', isModified: true });
      });

      expect(result.current.currentFile?.content).toBe('new content');
      expect(result.current.currentFile?.isModified).toBe(true);
    });

    it('should set current file', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.setCurrentFile(file);
      });

      expect(result.current.currentFile?.id).toBe('file1');
    });

    it('should update recent files when opening a file', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file);
      });

      expect(result.current.recentFiles).toContain('/test.ts');
    });

    it('should limit recent files to 10', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        for (let i = 0; i < 15; i++) {
          const file: EditorFile = {
            id: `file${i}`,
            name: `test${i}.ts`,
            path: `/test${i}.ts`,
            content: '',
            language: 'typescript',
            isModified: false,
          };
          result.current.actions.openFile(file);
        }
      });

      expect(result.current.recentFiles.length).toBeLessThanOrEqual(10);
    });
  });

  describe('settings management', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.updateSettings({ fontSize: 16, theme: 'light' });
      });

      expect(result.current.settings.fontSize).toBe(16);
      expect(result.current.settings.theme).toBe('light');
    });

    it('should reset settings to default', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.updateSettings({ fontSize: 20 });
        result.current.actions.resetSettings();
      });

      expect(result.current.settings.fontSize).toBe(14); // Default
    });
  });

  describe('UI state management', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useEditorStore());

      const initial = result.current.sidebarOpen;

      act(() => {
        result.current.actions.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(!initial);
    });

    it('should toggle AI chat', () => {
      const { result } = renderHook(() => useEditorStore());

      const initial = result.current.aiChatOpen;

      act(() => {
        result.current.actions.toggleAIChat();
      });

      expect(result.current.aiChatOpen).toBe(!initial);
    });

    it('should toggle settings', () => {
      const { result } = renderHook(() => useEditorStore());

      const initial = result.current.settingsOpen;

      act(() => {
        result.current.actions.toggleSettings();
      });

      expect(result.current.settingsOpen).toBe(!initial);
    });

    it('should toggle command palette', () => {
      const { result } = renderHook(() => useEditorStore());

      const initial = result.current.commandPaletteOpen;

      act(() => {
        result.current.actions.toggleCommandPalette();
      });

      expect(result.current.commandPaletteOpen).toBe(!initial);
    });
  });

  describe('workspace management', () => {
    it('should set workspace folder', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.setWorkspaceFolder('/path/to/workspace');
      });

      expect(result.current.workspaceFolder).toBe('/path/to/workspace');
    });

    it('should set indexing state', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.setIndexing(true, 50);
      });

      expect(result.current.isIndexing).toBe(true);
      expect(result.current.indexingProgress).toBe(50);
    });
  });

  describe('notifications', () => {
    it('should show notification', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.showNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('success');
    });

    it('should remove notification', () => {
      const { result } = renderHook(() => useEditorStore());

      let notificationId: string;

      act(() => {
        result.current.actions.showNotification({
          type: 'info',
          title: 'Info',
          message: 'Test',
        });
        notificationId = result.current.notifications[0].id;
      });

      act(() => {
        result.current.actions.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.showNotification({
          type: 'info',
          title: 'Info 1',
          message: 'Test 1',
        });
        result.current.actions.showNotification({
          type: 'info',
          title: 'Info 2',
          message: 'Test 2',
        });
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);

      act(() => {
        result.current.actions.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('computed values', () => {
    it('should compute hasUnsavedChanges', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: 'content',
        language: 'typescript',
        isModified: true,
      };

      act(() => {
        result.current.actions.openFile(file);
      });

      expect(result.current.computed.hasUnsavedChanges()).toBe(true);
    });

    it('should compute modifiedFiles', () => {
      const { result } = renderHook(() => useEditorStore());

      const file1: EditorFile = {
        id: 'file1',
        name: 'test1.ts',
        path: '/test1.ts',
        content: '',
        language: 'typescript',
        isModified: true,
      };

      const file2: EditorFile = {
        id: 'file2',
        name: 'test2.ts',
        path: '/test2.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file1);
        result.current.actions.openFile(file2);
      });

      expect(result.current.computed.modifiedFiles()).toHaveLength(1);
      expect(result.current.computed.modifiedFiles()[0].id).toBe('file1');
    });

    it('should compute activeFileName', () => {
      const { result } = renderHook(() => useEditorStore());

      const file: EditorFile = {
        id: 'file1',
        name: 'test.ts',
        path: '/test.ts',
        content: '',
        language: 'typescript',
        isModified: false,
      };

      act(() => {
        result.current.actions.openFile(file);
      });

      expect(result.current.computed.activeFileName()).toBe('test.ts');
    });

    it('should compute totalNotifications', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.actions.showNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        });
        result.current.actions.showNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        });
      });

      expect(result.current.computed.totalNotifications()).toBe(2);
    });
  });
});
