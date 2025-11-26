/**
 * Editor State Hook
 * Manages editor state including completion stats, find/replace, and inline edit
 */
import { useCallback, useRef, useState } from 'react';

import type { editor } from 'monaco-editor';

import { trackCompletionAction } from '../../services/ai/completionTracker';
import type { CompletionStats, CursorPosition, FindMatchState, PrefetchStats, PrefetchStatus } from './types';

interface UseEditorStateOptions {
  onSaveFile?: () => void;
}

export function useEditorState(options: UseEditorStateOptions = {}) {
  const { onSaveFile } = options;

  // Editor reference
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // AI state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showAiStatus, setShowAiStatus] = useState(false);
  const [hasActiveCompletion, setHasActiveCompletion] = useState(false);

  // Cursor position
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });

  // Find/Replace state
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findMatches, setFindMatches] = useState<FindMatchState>({ current: 0, total: 0 });

  // Completion stats
  const [showCompletionStats, setShowCompletionStats] = useState(false);
  const [completionStats, setCompletionStats] = useState<CompletionStats>({
    totalSuggestions: 0,
    accepted: 0,
    rejected: 0,
    avgLatency: 0,
  });

  // Prefetch stats
  const [prefetchStats, setPrefetchStats] = useState<PrefetchStats>({
    cacheSize: 0,
    queueSize: 0,
    activeCount: 0,
    hitRate: 0,
    avgLatency: 0,
    memoryUsageMB: 0,
  });
  const [prefetchStatus, setPrefetchStatus] = useState<PrefetchStatus>('idle');

  // Inline edit state
  const [inlineEditOpen, setInlineEditOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');

  // Track completion acceptance
  const trackAcceptance = useCallback(() => {
    trackCompletionAction(true);
    setCompletionStats((prev) => ({
      ...prev,
      accepted: prev.accepted + 1,
    }));
    setHasActiveCompletion(false);
  }, []);

  // Track completion rejection
  const trackRejection = useCallback(() => {
    trackCompletionAction(false);
    setCompletionStats((prev) => ({
      ...prev,
      rejected: prev.rejected + 1,
    }));
    setHasActiveCompletion(false);
  }, []);

  // Update completion stats
  const updateCompletionStats = useCallback((stats: Partial<CompletionStats>) => {
    setCompletionStats((prev) => ({ ...prev, ...stats }));
  }, []);

  // Update prefetch stats
  const updatePrefetchStats = useCallback((stats: Partial<PrefetchStats>) => {
    setPrefetchStats((prev) => ({ ...prev, ...stats }));
  }, []);

  // Toggle completion stats overlay
  const toggleCompletionStats = useCallback(() => {
    setShowCompletionStats((prev) => !prev);
  }, []);

  // Open find/replace
  const openFindReplace = useCallback(() => {
    setFindReplaceOpen(true);
  }, []);

  // Close find/replace
  const closeFindReplace = useCallback(() => {
    setFindReplaceOpen(false);
    // Clear decorations
    if (editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
    setFindMatches({ current: 0, total: 0 });
  }, []);

  // Open inline edit
  const openInlineEdit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (selection && !selection.isEmpty()) {
      const model = editor.getModel();
      if (model) {
        const selectedText = model.getValueInRange(selection);
        setSelectedCode(selectedText);
        setInlineEditOpen(true);
      }
    }
  }, []);

  // Close inline edit
  const closeInlineEdit = useCallback(() => {
    setInlineEditOpen(false);
    setSelectedCode('');
  }, []);

  // Save file handler
  const handleSave = useCallback(() => {
    onSaveFile?.();
  }, [onSaveFile]);

  // Close all panels
  const closeAllPanels = useCallback(() => {
    if (findReplaceOpen) {
      closeFindReplace();
    }
    if (inlineEditOpen) {
      closeInlineEdit();
    }
  }, [findReplaceOpen, inlineEditOpen, closeFindReplace, closeInlineEdit]);

  return {
    // Refs
    editorRef,
    monacoRef,
    decorationsRef,

    // AI state
    aiSuggestion,
    setAiSuggestion,
    showAiStatus,
    setShowAiStatus,
    hasActiveCompletion,
    setHasActiveCompletion,

    // Cursor
    cursorPosition,
    setCursorPosition,

    // Find/Replace
    findReplaceOpen,
    setFindReplaceOpen,
    findMatches,
    setFindMatches,
    openFindReplace,
    closeFindReplace,

    // Completion stats
    showCompletionStats,
    completionStats,
    setCompletionStats,
    toggleCompletionStats,
    trackAcceptance,
    trackRejection,
    updateCompletionStats,

    // Prefetch stats
    prefetchStats,
    setPrefetchStats,
    prefetchStatus,
    setPrefetchStatus,
    updatePrefetchStats,

    // Inline edit
    inlineEditOpen,
    selectedCode,
    setSelectedCode,
    openInlineEdit,
    closeInlineEdit,

    // Actions
    handleSave,
    closeAllPanels,
  };
}
