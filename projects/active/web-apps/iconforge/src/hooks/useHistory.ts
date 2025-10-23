import { useState, useCallback, useRef } from 'react';
import { Canvas } from 'fabric';

interface HistoryState {
  canvasJson: string;
}

const MAX_HISTORY = 30;

export function useHistory(canvas: Canvas | null) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const saveState = useCallback(() => {
    if (!canvas || isUndoRedoRef.current) return;

    const canvasJson = JSON.stringify(canvas.toJSON());

    setHistory((prev) => {
      // Remove all states after current index
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new state
      newHistory.push({ canvasJson });

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        setCurrentIndex(MAX_HISTORY - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }

      return newHistory;
    });
  }, [canvas, currentIndex]);

  const undo = useCallback(() => {
    if (!canvas || !canUndo) return false;

    isUndoRedoRef.current = true;

    const newIndex = currentIndex - 1;
    const state = history[newIndex];

    if (state) {
      canvas.clear();
      canvas.loadFromJSON(JSON.parse(state.canvasJson), () => {
        canvas.renderAll();
        setCurrentIndex(newIndex);
        isUndoRedoRef.current = false;
      });
      return true;
    }

    isUndoRedoRef.current = false;
    return false;
  }, [canvas, canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canvas || !canRedo) return false;

    isUndoRedoRef.current = true;

    const newIndex = currentIndex + 1;
    const state = history[newIndex];

    if (state) {
      canvas.clear();
      canvas.loadFromJSON(JSON.parse(state.canvasJson), () => {
        canvas.renderAll();
        setCurrentIndex(newIndex);
        isUndoRedoRef.current = false;
      });
      return true;
    }

    isUndoRedoRef.current = false;
    return false;
  }, [canvas, canRedo, currentIndex, history]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    historySize: history.length,
  };
}
