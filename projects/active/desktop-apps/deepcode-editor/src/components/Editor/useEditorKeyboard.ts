/**
 * Editor Keyboard Hook
 * Handles keyboard shortcuts for the editor
 */
import { useCallback } from 'react';

import { useHotkeys } from 'react-hotkeys-hook';
import type { editor } from 'monaco-editor';

interface UseEditorKeyboardOptions {
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  monacoRef: React.MutableRefObject<typeof import('monaco-editor') | null>;
  onSave?: () => void;
  onOpenFindReplace?: () => void;
  onToggleStats?: () => void;
  onOpenInlineEdit?: () => void;
  onCloseAllPanels?: () => void;
}

export function useEditorKeyboard(options: UseEditorKeyboardOptions) {
  const {
    editorRef,
    monacoRef,
    onSave,
    onOpenFindReplace,
    onToggleStats,
    onOpenInlineEdit,
    onCloseAllPanels,
  } = options;

  // Toggle comment on current line
  const toggleComment = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;

    const edits: { range: import('monaco-editor').IRange; text: string }[] = [];

    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
      const lineContent = model.getLineContent(lineNum);
      const trimmed = lineContent.trimStart();
      const indent = lineContent.length - trimmed.length;

      if (trimmed.startsWith('//')) {
        // Remove comment
        const commentIndex = lineContent.indexOf('//');
        const hasSpace = lineContent[commentIndex + 2] === ' ';
        edits.push({
          range: {
            startLineNumber: lineNum,
            startColumn: commentIndex + 1,
            endLineNumber: lineNum,
            endColumn: commentIndex + 3 + (hasSpace ? 1 : 0),
          },
          text: '',
        });
      } else if (trimmed.length > 0) {
        // Add comment
        edits.push({
          range: {
            startLineNumber: lineNum,
            startColumn: indent + 1,
            endLineNumber: lineNum,
            endColumn: indent + 1,
          },
          text: '// ',
        });
      }
    }

    if (edits.length > 0) {
      editor.executeEdits('toggle-comment', edits);
    }
  }, [editorRef, monacoRef]);

  // Duplicate current line
  const duplicateLine = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    const line = selection.startLineNumber;
    const lineContent = model.getLineContent(line);

    editor.executeEdits('duplicate-line', [
      {
        range: {
          startLineNumber: line,
          startColumn: model.getLineMaxColumn(line),
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
        },
        text: '\n' + lineContent,
      },
    ]);

    // Move cursor to duplicated line
    editor.setPosition({ lineNumber: line + 1, column: selection.startColumn });
  }, [editorRef]);

  // Move line up
  const moveLineUp = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    const line = selection.startLineNumber;
    if (line <= 1) return;

    const currentLine = model.getLineContent(line);
    const prevLine = model.getLineContent(line - 1);

    editor.executeEdits('move-line-up', [
      {
        range: {
          startLineNumber: line - 1,
          startColumn: 1,
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
        },
        text: currentLine + '\n' + prevLine,
      },
    ]);

    editor.setPosition({ lineNumber: line - 1, column: selection.startColumn });
  }, [editorRef]);

  // Move line down
  const moveLineDown = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    const line = selection.startLineNumber;
    if (line >= model.getLineCount()) return;

    const currentLine = model.getLineContent(line);
    const nextLine = model.getLineContent(line + 1);

    editor.executeEdits('move-line-down', [
      {
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line + 1,
          endColumn: model.getLineMaxColumn(line + 1),
        },
        text: nextLine + '\n' + currentLine,
      },
    ]);

    editor.setPosition({ lineNumber: line + 1, column: selection.startColumn });
  }, [editorRef]);

  // Register keyboard shortcuts
  useHotkeys('ctrl+s, meta+s', (e) => {
    e.preventDefault();
    onSave?.();
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+/, meta+/', (e) => {
    e.preventDefault();
    toggleComment();
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+d, meta+d', (e) => {
    e.preventDefault();
    duplicateLine();
  }, { enableOnFormTags: true });

  useHotkeys('alt+up', (e) => {
    e.preventDefault();
    moveLineUp();
  }, { enableOnFormTags: true });

  useHotkeys('alt+down', (e) => {
    e.preventDefault();
    moveLineDown();
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+f, meta+f', (e) => {
    e.preventDefault();
    onOpenFindReplace?.();
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+h, meta+h', (e) => {
    e.preventDefault();
    onOpenFindReplace?.();
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    onOpenInlineEdit?.();
  }, { enableOnFormTags: true });

  useHotkeys('escape', () => {
    onCloseAllPanels?.();
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+shift+s, meta+shift+s', (e) => {
    e.preventDefault();
    onToggleStats?.();
  }, { enableOnFormTags: true });

  return {
    toggleComment,
    duplicateLine,
    moveLineUp,
    moveLineDown,
  };
}
