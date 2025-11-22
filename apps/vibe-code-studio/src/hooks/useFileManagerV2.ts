import { useCallback } from 'react';

import { FileSystemService } from '../services/FileSystemService';
import { logger } from '../services/Logger';
import { useEditorStore, useFileActions } from '../stores/useEditorStore';
import { EditorFile } from '../types';

/**
 * File Manager Hook V2 - Migrated to Zustand
 *
 * This is a drop-in replacement for the original useFileManager hook
 * but uses Zustand store instead of local state
 */

export interface UseFileManagerReturn {
  currentFile: EditorFile | null;
  openFiles: EditorFile[];
  handleOpenFile: (filePath: string) => Promise<void>;
  handleCloseFile: (filePath: string) => void;
  handleFileChange: (content: string) => void;
  handleSaveFile: () => Promise<void>;
  setCurrentFile: (file: EditorFile | null) => void;
}

export interface UseFileManagerProps {
  fileSystemService: FileSystemService;
  onSaveSuccess?: (fileName: string) => void;
  onSaveError?: (fileName: string, error: Error) => void;
}

function getLanguageFromExtension(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    cmake: 'cmake',
    toml: 'toml',
    ini: 'ini',
    conf: 'conf',
    txt: 'plaintext',
  };

  return languageMap[ext || ''] || 'plaintext';
}

export function useFileManager({
  fileSystemService,
  onSaveSuccess,
  onSaveError,
}: UseFileManagerProps): UseFileManagerReturn {
  // Get state from Zustand store
  const currentFile = useEditorStore((state) => state.currentFile);
  const openFiles = useEditorStore((state) => state.openFiles);
  const { openFile, closeFile, updateFile, setCurrentFile } = useFileActions();
  const { showNotification } = useEditorStore((state) => state.actions);

  const handleOpenFile = useCallback(
    async (filePath: string) => {
      try {
        // Check if already open
        const existingFile = openFiles.find((f) => f.path === filePath);
        if (existingFile) {
          setCurrentFile(existingFile);
          return;
        }

        // Read file content
        const content = await fileSystemService.readFile(filePath);
        const file: EditorFile = {
          id: filePath,
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          content,
          language: getLanguageFromExtension(filePath),
          isModified: false,
        };

        // Open file using store action
        openFile(file);
      } catch (error) {
        logger.error('Failed to open file:', error);
        showNotification({
          type: 'error',
          title: 'Failed to open file',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [fileSystemService, openFiles, openFile, setCurrentFile, showNotification]
  );

  const handleCloseFile = useCallback(
    (filePath: string) => {
      // Check if file has unsaved changes
      const file = openFiles.find((f) => f.path === filePath);
      if (file?.isModified) {
        const confirmed = window.confirm(`File "${file.name}" has unsaved changes. Close anyway?`);
        if (!confirmed) {
          return;
        }
      }

      closeFile(filePath);
    },
    [openFiles, closeFile]
  );

  const handleFileChange = useCallback(
    (content: string) => {
      if (currentFile) {
        updateFile(currentFile.id, {
          content,
          isModified: true,
        });
      }
    },
    [currentFile, updateFile]
  );

  const handleSaveFile = useCallback(async () => {
    if (!currentFile) {
      return;
    }

    try {
      // Save to file system
      await fileSystemService.writeFile(currentFile.path, currentFile.content);

      // Update store
      updateFile(currentFile.id, { isModified: false });

      // Success callback
      onSaveSuccess?.(currentFile.name);

      // Show notification
      showNotification({
        type: 'success',
        title: 'File Saved',
        message: `${currentFile.name} saved successfully`,
      });
    } catch (error) {
      logger.error('Failed to save file:', error);
      onSaveError?.(currentFile.name, error as Error);

      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: `Failed to save ${currentFile.name}: ${error}`,
      });

      throw error;
    }
  }, [currentFile, fileSystemService, updateFile, onSaveSuccess, onSaveError, showNotification]);

  return {
    currentFile,
    openFiles,
    handleOpenFile,
    handleCloseFile,
    handleFileChange,
    handleSaveFile,
    setCurrentFile,
  };
}

// Migration helper - same API as original hook
export const useFileManagerMigrated = useFileManager;
