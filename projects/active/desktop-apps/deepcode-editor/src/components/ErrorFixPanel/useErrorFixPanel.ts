/**
 * useErrorFixPanel Hook
 * State and logic for the ErrorFixPanel component
 */
import { useCallback, useEffect, useState } from 'react';

import type { FixSuggestion, GeneratedFix } from '../../services/AutoFixService';

interface UseErrorFixPanelOptions {
  fix: GeneratedFix | null;
  onApplyFix: (suggestion: FixSuggestion) => void;
  onDismiss: () => void;
}

export function useErrorFixPanel(options: UseErrorFixPanelOptions) {
  const { fix, onApplyFix, onDismiss } = options;

  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onDismiss]);

  const selectedSuggestion = fix?.suggestions.find(s => s.id === selectedSuggestionId) ?? null;

  const handleSelectSuggestion = useCallback((suggestionId: string) => {
    setSelectedSuggestionId(suggestionId);
  }, []);

  const handleApplyClick = useCallback(() => {
    if (selectedSuggestion) {
      onApplyFix(selectedSuggestion);
    }
  }, [selectedSuggestion, onApplyFix]);

  const toggleExpanded = useCallback((suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(suggestionId)) {
        newExpanded.delete(suggestionId);
      } else {
        newExpanded.add(suggestionId);
      }
      return newExpanded;
    });
  }, []);

  const isExpanded = useCallback((suggestionId: string) => {
    return expandedSuggestions.has(suggestionId);
  }, [expandedSuggestions]);

  return {
    // State
    selectedSuggestionId,
    selectedSuggestion,
    expandedSuggestions,

    // Actions
    handleSelectSuggestion,
    handleApplyClick,
    toggleExpanded,
    isExpanded,
  };
}
