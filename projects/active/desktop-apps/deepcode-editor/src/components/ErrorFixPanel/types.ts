/**
 * ErrorFixPanel Types
 */
import type { FixSuggestion, GeneratedFix } from '../../services/AutoFixService';
import type { DetectedError } from '../../services/ErrorDetector';

export interface ErrorFixPanelProps {
  error: DetectedError | null;
  fix: GeneratedFix | null;
  isLoading?: boolean;
  errorMessage?: string;
  showDiff?: boolean;
  onApplyFix: (suggestion: FixSuggestion) => void;
  onDismiss: () => void;
  onRetry?: () => void;
}

export interface ErrorFixPanelState {
  selectedSuggestionId: string | null;
  expandedSuggestions: Set<string>;
}

// Re-export service types for convenience
export type { FixSuggestion, GeneratedFix, DetectedError };
