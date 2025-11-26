/**
 * ErrorFixPanel Component
 * Display detected errors and AI-generated fix suggestions
 */
import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Info, X } from 'lucide-react';

import type { ErrorFixPanelProps } from './types';
import {
  Actions,
  ApplyButton,
  CloseButton,
  CloseHint,
  CodeBlock,
  CodePreview,
  ConfidenceBadge,
  Container,
  DiffAfter,
  DiffBefore,
  DiffLabel,
  ErrorBadge,
  ErrorCode,
  ErrorHeader,
  ErrorIcon,
  ErrorLocation,
  ErrorMessage,
  ErrorMessageSection,
  ErrorSection,
  ErrorText,
  ExpandButton,
  FixSection,
  Header,
  HeaderTitle,
  LoadingSection,
  LoadingSpinner,
  LoadingText,
  RetryButton,
  SectionHeader,
  SuggestionButton,
  SuggestionCard,
  SuggestionDescription,
  SuggestionHeader,
  SuggestionsHeader,
  SuggestionTitle,
} from './styled';
import { useErrorFixPanel } from './useErrorFixPanel';

export const ErrorFixPanel: React.FC<ErrorFixPanelProps> = ({
  error,
  fix,
  isLoading = false,
  errorMessage,
  showDiff = false,
  onApplyFix,
  onDismiss,
  onRetry,
}) => {
  const {
    selectedSuggestionId,
    selectedSuggestion,
    handleSelectSuggestion,
    handleApplyClick,
    toggleExpanded,
    isExpanded,
  } = useErrorFixPanel({ fix, onApplyFix, onDismiss });

  // Don't render if no error
  if (!error) {
    return null;
  }

  return (
    <Container
      aria-label="error fix panel"
      tabIndex={0}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <Header>
        <HeaderTitle>
          <AlertCircle size={18} />
          <span>Error Fix Assistant</span>
          <CloseHint>(Press ESC or click X to close)</CloseHint>
        </HeaderTitle>
        <CloseButton
          onClick={onDismiss}
          aria-label="dismiss"
          title="Close (ESC)"
        >
          <X size={20} />
        </CloseButton>
      </Header>

      {/* Error Information */}
      <ErrorSection>
        <ErrorHeader>
          <ErrorBadge $severity={error.severity}>
            {error.type.toUpperCase()}
          </ErrorBadge>
          {error.code && <ErrorCode>{error.code}</ErrorCode>}
        </ErrorHeader>

        <ErrorMessage>{error.message}</ErrorMessage>

        <ErrorLocation>
          {error.file} • line {error.line}:{error.column}
        </ErrorLocation>
      </ErrorSection>

      {/* Loading State */}
      {isLoading && (
        <LoadingSection>
          <LoadingSpinner />
          <LoadingText>Generating fixes...</LoadingText>
        </LoadingSection>
      )}

      {/* Error Message */}
      {errorMessage && !isLoading && (
        <ErrorMessageSection>
          <ErrorIcon>
            <AlertCircle size={18} />
          </ErrorIcon>
          <ErrorText>{errorMessage}</ErrorText>
          {onRetry && (
            <RetryButton onClick={onRetry} aria-label="retry">
              Retry
            </RetryButton>
          )}
        </ErrorMessageSection>
      )}

      {/* Fix Suggestions */}
      {fix && !isLoading && (
        <FixSection>
          <SectionHeader>
            <Info size={16} />
            <span>{fix.explanation}</span>
          </SectionHeader>

          <SuggestionsHeader>
            {fix.suggestions.length} Suggestion{fix.suggestions.length !== 1 ? 's' : ''}
          </SuggestionsHeader>

          <AnimatePresence>
            {fix.suggestions.map((suggestion) => {
              const isSelected = selectedSuggestionId === suggestion.id;
              const expanded = isExpanded(suggestion.id);

              return (
                <SuggestionCard
                  key={suggestion.id}
                  $isSelected={isSelected}
                  as={motion.div}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SuggestionButton
                    onClick={() => handleSelectSuggestion(suggestion.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSelectSuggestion(suggestion.id);
                      }
                    }}
                    className={isSelected ? 'selected active' : ''}
                    role="button"
                    tabIndex={0}
                  >
                    <SuggestionHeader>
                      <SuggestionTitle>{suggestion.title}</SuggestionTitle>
                      <ConfidenceBadge $confidence={suggestion.confidence}>
                        {suggestion.confidence}
                      </ConfidenceBadge>
                    </SuggestionHeader>

                    <SuggestionDescription>
                      {suggestion.description}
                    </SuggestionDescription>
                  </SuggestionButton>

                  {/* Expandable Code Preview */}
                  <ExpandButton
                    onClick={() => toggleExpanded(suggestion.id)}
                    aria-label={expanded ? "collapse" : "expand"}
                  >
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span>{expanded ? 'Hide' : 'Show'} code</span>
                  </ExpandButton>

                  {expanded && (
                    <CodePreview>
                      {showDiff ? (
                        <>
                          <DiffLabel>Before</DiffLabel>
                          <DiffBefore>{fix.context}</DiffBefore>
                          <DiffLabel>After</DiffLabel>
                          <DiffAfter>{suggestion.code}</DiffAfter>
                        </>
                      ) : (
                        <CodeBlock>
                          <pre><code>{suggestion.code}</code></pre>
                        </CodeBlock>
                      )}
                    </CodePreview>
                  )}
                </SuggestionCard>
              );
            })}
          </AnimatePresence>
        </FixSection>
      )}

      {/* Actions */}
      {fix && !isLoading && (
        <Actions>
          <ApplyButton
            onClick={handleApplyClick}
            disabled={!selectedSuggestion}
            aria-label="apply"
          >
            <CheckCircle2 size={16} />
            <span>Apply Fix</span>
          </ApplyButton>
        </Actions>
      )}
    </Container>
  );
};

// Export all types and modules
export * from './types';
export * from './styled';
export { useErrorFixPanel } from './useErrorFixPanel';
export default ErrorFixPanel;
