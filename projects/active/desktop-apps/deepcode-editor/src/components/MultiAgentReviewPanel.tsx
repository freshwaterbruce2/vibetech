import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Info,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import styled from 'styled-components';

import { CodeReviewResult, ReviewIssue } from '../services/ai/MultiAgentReview';
import { vibeTheme } from '../styles/theme';

const PanelContainer = styled(motion.div)`
  background: ${vibeTheme.colors.primary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.medium};
  overflow: hidden;
  margin: ${vibeTheme.spacing.md} 0;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.lg};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
`;

const ConsensusBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
`;

const ConsensusScore = styled.div<{ $consensus: number }>`
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  background: ${(props) => {
    if (props.$consensus > 0.8) {
      return 'rgba(34, 197, 94, 0.2)';
    }
    if (props.$consensus > 0.6) {
      return 'rgba(251, 191, 36, 0.2)';
    }
    return 'rgba(239, 68, 68, 0.2)';
  }};
  color: ${(props) => {
    if (props.$consensus > 0.8) {
      return '#22c55e';
    }
    if (props.$consensus > 0.6) {
      return '#fbbf24';
    }
    return '#ef4444';
  }};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const ReviewContainer = styled.div`
  padding: ${vibeTheme.spacing.md};
`;

const AgentReview = styled.div`
  margin-bottom: ${vibeTheme.spacing.md};
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: ${vibeTheme.borderRadius.small};
  overflow: hidden;
`;

const AgentHeader = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  cursor: pointer;
  transition: background ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
`;

const AgentIcon = styled.div<{ $role: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => {
    switch (props.$role) {
      case 'security':
        return 'rgba(139, 92, 246, 0.2)';
      case 'performance':
        return 'rgba(0, 212, 255, 0.2)';
      case 'style':
        return 'rgba(251, 191, 36, 0.2)';
      case 'architecture':
        return 'rgba(34, 197, 94, 0.2)';
      default:
        return 'rgba(100, 100, 100, 0.2)';
    }
  }};
  border-radius: ${vibeTheme.borderRadius.small};

  svg {
    width: 18px;
    height: 18px;
    color: ${(props) => {
      switch (props.$role) {
        case 'security':
          return vibeTheme.colors.purple;
        case 'performance':
          return vibeTheme.colors.cyan;
        case 'style':
          return '#fbbf24';
        case 'architecture':
          return '#22c55e';
        default:
          return vibeTheme.colors.text;
      }
    }};
  }
`;

const AgentName = styled.div`
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
`;

const IssueCount = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
`;

const AgentContent = styled(motion.div)`
  padding: ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.primary};
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing.sm};
`;

const Issue = styled.div<{ $severity: 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm};
  background: ${(props) => {
    switch (props.$severity) {
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warning':
        return 'rgba(251, 191, 36, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
    }
  }};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
`;

const IssueIcon = styled.div<{ $severity: 'error' | 'warning' | 'info' }>`
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
    color: ${(props) => {
      switch (props.$severity) {
        case 'error':
          return '#ef4444';
        case 'warning':
          return '#fbbf24';
        case 'info':
          return '#3b82f6';
      }
    }};
  }
`;

const IssueContent = styled.div`
  flex: 1;
`;

const IssueMessage = styled.div`
  color: ${vibeTheme.colors.text};
  margin-bottom: ${vibeTheme.spacing.xs};
`;

const IssueLocation = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.xs};
`;

const SuggestionsSection = styled.div`
  margin-top: ${vibeTheme.spacing.md};
  padding: ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-radius: ${vibeTheme.borderRadius.small};
`;

const SuggestionTitle = styled.h4`
  margin: 0 0 ${vibeTheme.spacing.sm} 0;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.purple};
`;

const SuggestionList = styled.ul`
  margin: 0;
  padding-left: ${vibeTheme.spacing.md};
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};

  li {
    margin-bottom: ${vibeTheme.spacing.xs};
  }
`;

interface MultiAgentReviewPanelProps {
  reviews: CodeReviewResult[];
  consensus: {
    criticalIssues: ReviewIssue[];
    warnings: ReviewIssue[];
    suggestions: string[];
    consensus: number;
  };
  onClose?: () => void;
}

export const MultiAgentReviewPanel: React.FC<MultiAgentReviewPanelProps> = ({
  reviews,
  consensus,
  onClose: _onClose,
}) => {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const getAgentIcon = (agentId: string) => {
    if (agentId.includes('security')) {
      return <Shield />;
    }
    if (agentId.includes('performance')) {
      return <Zap />;
    }
    if (agentId.includes('style')) {
      return <Code />;
    }
    if (agentId.includes('architecture')) {
      return <Layers />;
    }
    return <Code />;
  };

  const getAgentRole = (agentId: string): string => {
    if (agentId.includes('security')) {
      return 'security';
    }
    if (agentId.includes('performance')) {
      return 'performance';
    }
    if (agentId.includes('style')) {
      return 'style';
    }
    if (agentId.includes('architecture')) {
      return 'architecture';
    }
    return 'general';
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertTriangle />;
      case 'warning':
        return <AlertCircle />;
      case 'info':
        return <Info />;
    }
  };

  const totalIssues = consensus.criticalIssues.length + consensus.warnings.length;

  return (
    <PanelContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <PanelHeader>
        <Title>
          <CheckCircle />
          Multi-Agent Code Review
        </Title>
        <ConsensusBar>
          <ConsensusScore $consensus={consensus.consensus}>
            {Math.round(consensus.consensus * 100)}% Consensus
          </ConsensusScore>
          <div
            style={{
              color: vibeTheme.colors.textSecondary,
              fontSize: vibeTheme.typography.fontSize.sm,
            }}
          >
            {totalIssues} issues found
          </div>
        </ConsensusBar>
      </PanelHeader>

      <ReviewContainer>
        {reviews.map((review) => {
          const isExpanded = expandedAgents.has(review.agentId);
          const role = getAgentRole(review.agentId);

          return (
            <AgentReview key={review.agentId}>
              <AgentHeader $collapsed={!isExpanded} onClick={() => toggleAgent(review.agentId)}>
                <AgentInfo>
                  <AgentIcon $role={role}>{getAgentIcon(review.agentId)}</AgentIcon>
                  <AgentName>
                    {review.agentId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </AgentName>
                </AgentInfo>
                <IssueCount>
                  <span>{review.issues.length} issues</span>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </IssueCount>
              </AgentHeader>

              <AnimatePresence>
                {isExpanded && (
                  <AgentContent
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IssueList>
                      {review.issues.map((issue, index) => (
                        <Issue key={index} $severity={review.severity}>
                          <IssueIcon $severity={review.severity}>
                            {getSeverityIcon(review.severity)}
                          </IssueIcon>
                          <IssueContent>
                            <IssueMessage>{issue.message}</IssueMessage>
                            {issue.line && (
                              <IssueLocation>
                                Line {issue.line}
                                {issue.column && `, Column ${issue.column}`}
                              </IssueLocation>
                            )}
                          </IssueContent>
                        </Issue>
                      ))}
                    </IssueList>

                    {review.suggestions.length > 0 && (
                      <SuggestionsSection>
                        <SuggestionTitle>Suggestions</SuggestionTitle>
                        <SuggestionList>
                          {review.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </SuggestionList>
                      </SuggestionsSection>
                    )}
                  </AgentContent>
                )}
              </AnimatePresence>
            </AgentReview>
          );
        })}

        {consensus.suggestions.length > 0 && (
          <SuggestionsSection style={{ marginTop: vibeTheme.spacing.lg }}>
            <SuggestionTitle>Overall Recommendations</SuggestionTitle>
            <SuggestionList>
              {consensus.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </SuggestionList>
          </SuggestionsSection>
        )}
      </ReviewContainer>
    </PanelContainer>
  );
};

export default MultiAgentReviewPanel;
