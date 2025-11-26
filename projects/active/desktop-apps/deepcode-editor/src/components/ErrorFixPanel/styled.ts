/**
 * ErrorFixPanel Styled Components
 */
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 0;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  &:focus {
    outline: 2px solid rgba(139, 92, 246, 0.5);
    outline-offset: 2px;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.05);
`;

export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${vibeTheme.colors.text};
  font-size: 16px;
  font-weight: 600;
  flex: 1;
`;

export const CloseHint = styled.span`
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: ${vibeTheme.colors.textSecondary};
  font-style: italic;
`;

export const CloseButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  font-weight: 600;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
    color: #ef4444;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const ErrorSection = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

export const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const ErrorBadge = styled.span<{ $severity: string }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: ${props =>
    props.$severity === 'error' ? 'rgba(239, 68, 68, 0.15)' :
    props.$severity === 'warning' ? 'rgba(245, 158, 11, 0.15)' :
    'rgba(59, 130, 246, 0.15)'};
  color: ${props =>
    props.$severity === 'error' ? '#ef4444' :
    props.$severity === 'warning' ? '#f59e0b' :
    '#3b82f6'};
`;

export const ErrorCode = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  font-family: 'JetBrains Mono', monospace;
`;

export const ErrorMessage = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
`;

export const ErrorLocation = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
`;

export const LoadingSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
`;

export const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const LoadingText = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 14px;
`;

export const ErrorMessageSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
`;

export const ErrorIcon = styled.div`
  color: #ef4444;
  flex-shrink: 0;
`;

export const ErrorText = styled.div`
  flex: 1;
  color: ${vibeTheme.colors.text};
  font-size: 14px;
`;

export const RetryButton = styled.button`
  padding: 6px 14px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.3);
  }
`;

export const FixSection = styled.div`
  padding: 20px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 13px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

export const SuggestionsHeader = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
`;

export const SuggestionCard = styled.div<{ $isSelected: boolean }>`
  background: ${props => props.$isSelected
    ? 'rgba(139, 92, 246, 0.15)'
    : 'rgba(139, 92, 246, 0.05)'};
  border: 2px solid ${props => props.$isSelected
    ? 'rgba(139, 92, 246, 0.5)'
    : 'rgba(139, 92, 246, 0.2)'};
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(139, 92, 246, 0.4);
  }
`;

export const SuggestionButton = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
  }

  &.selected {
    background: rgba(139, 92, 246, 0.05);
  }
`;

export const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const SuggestionTitle = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 15px;
  font-weight: 600;
`;

export const ConfidenceBadge = styled.span<{ $confidence: string }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: ${props =>
    props.$confidence === 'high' ? 'rgba(16, 185, 129, 0.15)' :
    props.$confidence === 'medium' ? 'rgba(245, 158, 11, 0.15)' :
    'rgba(239, 68, 68, 0.15)'};
  color: ${props =>
    props.$confidence === 'high' ? '#10b981' :
    props.$confidence === 'medium' ? '#f59e0b' :
    '#ef4444'};
`;

export const SuggestionDescription = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 13px;
  line-height: 1.5;
`;

export const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
    color: ${vibeTheme.colors.text};
  }
`;

export const CodePreview = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
`;

export const CodeBlock = styled.div`
  pre {
    margin: 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: ${vibeTheme.colors.textSecondary};
    overflow-x: auto;
  }

  code {
    white-space: pre;
  }
`;

export const DiffLabel = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  margin-top: 12px;

  &:first-child {
    margin-top: 0;
  }
`;

export const DiffBefore = styled.pre`
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: ${vibeTheme.colors.textSecondary};
  overflow-x: auto;
  margin: 0;
`;

export const DiffAfter = styled.pre`
  background: rgba(16, 185, 129, 0.1);
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #10b981;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: ${vibeTheme.colors.textSecondary};
  overflow-x: auto;
  margin: 0;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.03);
`;

export const ApplyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: rgba(139, 92, 246, 0.2);
    color: ${vibeTheme.colors.textSecondary};
    cursor: not-allowed;
    transform: none;
  }
`;
