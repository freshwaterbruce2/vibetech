import { useCallback, useState } from 'react';

import { logger } from '../../../services/Logger';
import { EditorService } from '../services/EditorService';
import { CursorPosition, EditorState, Selection } from '../types';

const initialState: EditorState = {
  activeFile: null,
  openFiles: [],
  cursorPosition: { line: 1, column: 1 },
  selections: [],
};

export function useEditorState() {
  const [state, setState] = useState<EditorState>(initialState);
  const editorService = EditorService.getInstance();

  const openFile = useCallback(
    async (path: string) => {
      try {
        const existingFile = state.openFiles.find((f) => f.path === path);

        if (existingFile) {
          setState((prev) => ({ ...prev, activeFile: existingFile }));
          return;
        }

        const file = await editorService.loadFile(path);
        setState((prev) => ({
          ...prev,
          openFiles: [...prev.openFiles, file],
          activeFile: file,
        }));
      } catch (error) {
        logger.error('Failed to open file:', error);
      }
    },
    [state.openFiles, editorService]
  );

  const closeFile = useCallback((path: string) => {
    setState((prev) => {
      const newOpenFiles = prev.openFiles.filter((f) => f.path !== path);
      const newActiveFile =
        prev.activeFile?.path === path
          ? newOpenFiles[newOpenFiles.length - 1] || null
          : prev.activeFile;

      return {
        ...prev,
        openFiles: newOpenFiles,
        activeFile: newActiveFile,
      };
    });
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setState((prev) => ({
      ...prev,
      openFiles: prev.openFiles.map((file) =>
        file.path === path ? { ...file, content, isModified: true } : file
      ),
      activeFile:
        prev.activeFile?.path === path
          ? { ...prev.activeFile, content, isModified: true }
          : prev.activeFile,
    }));
  }, []);

  const saveFile = useCallback(
    async (path: string) => {
      const file = state.openFiles.find((f) => f.path === path);
      if (!file) {
        return;
      }

      try {
        await editorService.saveFile(file);
        setState((prev) => ({
          ...prev,
          openFiles: prev.openFiles.map((f) => (f.path === path ? { ...f, isModified: false } : f)),
          activeFile:
            prev.activeFile?.path === path
              ? { ...prev.activeFile, isModified: false }
              : prev.activeFile,
        }));
      } catch (error) {
        logger.error('Failed to save file:', error);
      }
    },
    [state.openFiles, editorService]
  );

  const setCursorPosition = useCallback((position: CursorPosition) => {
    setState((prev) => ({ ...prev, cursorPosition: position }));
  }, []);

  const setSelection = useCallback((selection: Selection) => {
    setState((prev) => ({ ...prev, selections: [selection] }));
  }, []);

  return {
    state,
    actions: {
      openFile,
      closeFile,
      updateFileContent,
      saveFile,
      setCursorPosition,
      setSelection,
    },
  };
}
