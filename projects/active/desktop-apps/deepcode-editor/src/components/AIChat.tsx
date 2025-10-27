import React, { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bot, CheckCircle2, Copy, FileEdit, Loader2, Play, Send, Shield,ThumbsDown, ThumbsUp, User, X, XCircle, Zap } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';
import { AgentStep, AgentTask, AIMessage, ApprovalRequest,StepStatus } from '../types';

import SecureMessageContent from './SecureMessageContent';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const ChatContainer = styled.div<{ $width: number; $mode: ChatMode }>`
  width: ${props => props.$width}px;
  background: ${props => {
    switch (props.$mode) {
      case 'agent': return 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(26, 26, 46, 1) 100%)';
      case 'composer': return 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(26, 26, 46, 1) 100%)';
      default: return vibeTheme.colors.secondary;
    }
  }};
  border-left: 2px solid ${props => {
    switch (props.$mode) {
      case 'agent': return 'rgba(139, 92, 246, 0.4)';
      case 'composer': return 'rgba(59, 130, 246, 0.4)';
      default: return 'rgba(139, 92, 246, 0.2)';
    }
  }};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: ${props => {
    switch (props.$mode) {
      case 'agent': return '0 0 40px rgba(139, 92, 246, 0.1)';
      case 'composer': return '0 0 40px rgba(59, 130, 246, 0.1)';
      default: return 'none';
    }
  }};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: ${props => {
      switch (props.$mode) {
        case 'agent': return vibeTheme.colors.cyan;
        case 'composer': return vibeTheme.colors.orange;
        case 'chat': return vibeTheme.colors.purple;
        default: return vibeTheme.colors.purple;
      }
    }};
    opacity: ${props => props.$mode !== 'chat' ? 1 : 0.6};
  }
`;

const ResizeHandle = styled.div<{ $isResizing: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  z-index: 10;
  background: ${props => props.$isResizing ? 'rgba(139, 92, 246, 0.3)' : 'transparent'};
  transition: background 0.2s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
  }

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 40px;
    background: ${props => props.$isResizing ? vibeTheme.colors.purple : 'rgba(139, 92, 246, 0.5)'};
    border-radius: 2px;
    opacity: ${props => props.$isResizing ? 1 : 0};
    transition: opacity 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.md};
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  border-bottom: 2px solid rgba(139, 92, 246, 0.2);
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }

  svg {
    color: ${vibeTheme.colors.cyan};
    filter: drop-shadow(0 0 4px ${vibeTheme.colors.cyan}50);
  }
`;

const ModeSwitcher = styled.div`
  display: flex;
  gap: 4px;
  background: rgba(139, 92, 246, 0.1);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
`;

const ModeButton = styled(motion.button)<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? vibeTheme.colors.purple : 'transparent'};
  color: ${props => props.$active ? 'white' : vibeTheme.colors.textSecondary};
  position: relative;

  &:hover {
    background: ${props => props.$active ? vibeTheme.colors.purple : 'rgba(139, 92, 246, 0.2)'};
    color: ${props => props.$active ? 'white' : vibeTheme.colors.text};
  }
`;

const ModeDescription = styled(motion.div)`
  padding: ${vibeTheme.spacing.sm};
  margin: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: rgba(139, 92, 246, 0.1);
  border-left: 3px solid ${vibeTheme.colors.purple};
  border-radius: 4px;
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.5;

  strong {
    color: ${vibeTheme.colors.text};
    display: block;
    margin-bottom: 4px;
  }
`;

const CloseButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing.sm};
  margin-left: auto;
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: ${vibeTheme.colors.error};
    transform: scale(1.05);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${vibeTheme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing.md};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${vibeTheme.colors.primary};
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: ${vibeTheme.borderRadius.small};

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
`;

const Message = styled(motion.div)<{ role: 'user' | 'assistant' }>`
  display: flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing.sm};
  max-width: 100%;
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.medium};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.05);
  }
`;

const MessageIcon = styled.div<{ role: 'user' | 'assistant' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) =>
    props.role === 'user' ? vibeTheme.gradients.primary : vibeTheme.gradients.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: ${vibeTheme.shadows.small};
  border: 2px solid
    ${(props) => (props.role === 'user' ? vibeTheme.colors.cyan : vibeTheme.colors.purple)};

  svg {
    color: ${vibeTheme.colors.text};
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
  }
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

// Removed MessageText styled component - now using SecureMessageContent

const MessageActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${Message}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textMuted};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    color: ${vibeTheme.colors.cyan};
    transform: scale(1.1);
  }
`;

const MessageTime = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textMuted};
  margin-top: ${vibeTheme.spacing.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const ReasoningContent = styled.details`
  margin-top: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm};
  background: rgba(139, 92, 246, 0.1);
  border-radius: ${vibeTheme.borderRadius.small};
  border: 1px solid rgba(139, 92, 246, 0.2);

  summary {
    cursor: pointer;
    color: ${vibeTheme.colors.purple};
    font-size: ${vibeTheme.typography.fontSize.sm};
    font-weight: ${vibeTheme.typography.fontWeight.medium};
    margin-bottom: ${vibeTheme.spacing.xs};

    &:hover {
      color: ${vibeTheme.colors.cyan};
    }
  }

  pre {
    margin: 0;
    padding: ${vibeTheme.spacing.sm};
    background: rgba(26, 26, 46, 0.5);
    border-radius: ${vibeTheme.borderRadius.small};
    overflow-x: auto;
    font-size: ${vibeTheme.typography.fontSize.xs};
    line-height: 1.5;
  }
`;

const InputContainer = styled.div`
  padding: ${vibeTheme.spacing.md};
  border-top: 2px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(
    135deg,
    rgba(26, 26, 46, 0.95) 0%,
    rgba(31, 31, 51, 0.95) 100%
  );
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.sm};
  align-items: flex-end;
`;

const TextInput = styled.textarea`
  flex: 1;
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.sm};
  resize: none;
  min-height: 40px;
  max-height: 120px;
  font-family: ${vibeTheme.typography.fontFamily.primary};
  backdrop-filter: blur(10px);
  transition: all ${vibeTheme.animation.duration.normal} ease;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
    background: rgba(26, 26, 46, 1);
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
    transform: scale(1.02);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const SendButton = styled(motion.button)<{ disabled: boolean }>`
  background: ${(props) =>
    props.disabled ? 'rgba(139, 92, 246, 0.2)' : vibeTheme.gradients.primary};
  border: 2px solid ${(props) => (props.disabled ? 'rgba(139, 92, 246, 0.1)' : 'transparent')};
  color: ${(props) => (props.disabled ? vibeTheme.colors.textMuted : vibeTheme.colors.text)};
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.medium};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transition: all ${vibeTheme.animation.duration.normal} ease;
  box-shadow: ${(props) => (props.disabled ? 'none' : vibeTheme.shadows.small)};

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow:
      ${vibeTheme.shadows.medium},
      0 0 16px rgba(139, 92, 246, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm} 0;
  color: ${vibeTheme.colors.cyan};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-style: italic;

  &::after {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${vibeTheme.colors.cyan};
    animation: ${pulse} 1.4s infinite;
    box-shadow: 0 0 8px ${vibeTheme.colors.cyan};
  }
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${vibeTheme.spacing.xs};
  margin-bottom: ${vibeTheme.spacing.sm};
`;

const QuickActionButton = styled(motion.button)`
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.textSecondary};
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  transition: all ${vibeTheme.animation.duration.fast} ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: ${vibeTheme.colors.cyan};
    color: ${vibeTheme.colors.text};
    transform: translateY(-1px);
    box-shadow: ${vibeTheme.shadows.small};
  }
`;

// Compact Agent Step Visualization
const AgentStepsList = styled.div`
  margin-top: ${vibeTheme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing.xs};
`;

const CompactStepCard = styled(motion.div)<{ $status: StepStatus }>`
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  background: ${props => {
    switch (props.$status) {
      case 'in_progress': return 'rgba(139, 92, 246, 0.1)';
      case 'completed': return 'rgba(34, 197, 94, 0.1)';
      case 'failed': return 'rgba(239, 68, 68, 0.1)';
      case 'awaiting_approval': return 'rgba(251, 191, 36, 0.1)';
      default: return 'rgba(100, 116, 139, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'in_progress': return vibeTheme.colors.purple;
      case 'completed': return vibeTheme.colors.success;
      case 'failed': return vibeTheme.colors.error;
      case 'awaiting_approval': return '#fbbf24';
      default: return 'rgba(100, 116, 139, 0.2)';
    }
  }};
`;

const StepHeaderCompact = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  margin-bottom: 4px;
`;

const StepIconCompact = styled.div<{ $status: StepStatus }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${props => {
    switch (props.$status) {
      case 'in_progress': return vibeTheme.colors.purple;
      case 'completed': return vibeTheme.colors.success;
      case 'failed': return vibeTheme.colors.error;
      case 'awaiting_approval': return '#fbbf24';
      default: return vibeTheme.colors.textMuted;
    }
  }};
`;

const StepTitleCompact = styled.div`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
  flex: 1;
`;

const StepDescriptionCompact = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.4;
  margin-left: 28px;
`;

const TaskProgressBar = styled.div`
  margin-top: ${vibeTheme.spacing.sm};
  background: rgba(100, 116, 139, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  height: 4px;
  overflow: hidden;
`;

const TaskProgressFill = styled(motion.div)<{ $progress: number }>`
  height: 100%;
  background: ${vibeTheme.gradients.primary};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

const ApprovalPromptCompact = styled(motion.div)`
  margin-top: ${vibeTheme.spacing.xs};
  padding: ${vibeTheme.spacing.sm};
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
  border-radius: ${vibeTheme.borderRadius.small};
`;

const ApprovalButton = styled(motion.button)<{ $variant: 'approve' | 'reject' }>`
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: ${props => props.$variant === 'approve' ? vibeTheme.colors.success : vibeTheme.colors.error};
  color: white;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

export type ChatMode = 'chat' | 'agent' | 'composer';

// Memoized step card component to improve rendering performance
interface MemoizedStepCardProps {
  step: AgentStep;
  pendingApproval: ApprovalRequest | null | undefined;
  getStepIcon: (status: StepStatus) => React.ReactElement;
  handleApproval?: (stepId: string, approved: boolean) => void;
}

const MemoizedStepCard = memo<MemoizedStepCardProps>(
  ({ step, pendingApproval, getStepIcon, handleApproval }) => {
    // Helper to render step result
    const renderStepResult = () => {
      if (step.status !== 'completed' || !step.result?.data) {
        return null;
      }

      const {data} = step.result;
      
      // Type guard to ensure data is an object with the expected properties
      if (!data || typeof data !== 'object') {
        return null;
      }
      
      const typedData = data as {
        generatedCode?: string;
        content?: string;
        filePath?: string;
        isSynthesis?: boolean;
      };
      
      const isSynthesis = typedData.isSynthesis === true;

      return (
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            borderLeft: '3px solid rgba(139, 92, 246, 0.5)',
          }}
        >
          {/* Display AI Review/Synthesis */}
          {typedData.generatedCode && (
            <div>
              <div
                style={{
                  marginBottom: '8px',
                  fontWeight: 700,
                  fontSize: isSynthesis ? '14px' : '13px',
                  color: isSynthesis ? '#a78bfa' : '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSynthesis ? '✨ Comprehensive Review Summary' : '🤖 AI Review'}
                {isSynthesis && (
                  <span
                    style={{
                      background: 'rgba(139, 92, 246, 0.3)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    AUTO-GENERATED
                  </span>
                )}
              </div>
              <div
                data-testid="synthesis-content"
                style={{
                  fontSize: isSynthesis ? '13px' : '12px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  background: isSynthesis
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(139, 92, 246, 0.1)',
                  padding: isSynthesis ? '12px' : '10px',
                  borderRadius: '4px',
                  border: isSynthesis
                    ? '2px solid rgba(139, 92, 246, 0.5)'
                    : '1px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: isSynthesis
                    ? '0 4px 16px rgba(139, 92, 246, 0.2)'
                    : 'none',
                  maxHeight: isSynthesis ? '600px' : '300px',
                  overflow: 'auto',
                }}
              >
                {typedData.generatedCode}
              </div>
            </div>
          )}

          {/* Display file content (collapsed by default) */}
          {typedData.content && !typedData.generatedCode && (
            <details style={{ marginTop: '8px' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                📄 File Content ({typedData.filePath || 'file'})
              </summary>
              <pre
                style={{
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  marginTop: '6px',
                }}
              >
                {typeof typedData.content === 'string'
                  ? typedData.content.slice(0, 2000)
                  : JSON.stringify(typedData.content).slice(0, 2000)}
                {(typeof typedData.content === 'string' ? typedData.content : JSON.stringify(typedData.content))
                  .length > 2000 && '\n... (truncated)'}
              </pre>
            </details>
          )}
        </div>
      );
    };

    return (
      <CompactStepCard
        key={step.id}
        $status={step.status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        data-testid="step-card"
        data-status={step.status}
      >
        <StepHeaderCompact>
          <StepIconCompact $status={step.status} data-testid="step-status" data-status={step.status}>
            {getStepIcon(step.status)}
          </StepIconCompact>
          <StepTitleCompact>{step.title}</StepTitleCompact>
        </StepHeaderCompact>
        {step.description && (
          <StepDescriptionCompact>{step.description}</StepDescriptionCompact>
        )}

        {/* Show step results if completed */}
        {renderStepResult()}

        {/* Show approval prompt if this step is pending approval */}
        {pendingApproval && pendingApproval.stepId === step.id && handleApproval && (
          <ApprovalPromptCompact initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', color: vibeTheme.colors.text }}>
              <strong>Approval Required</strong>
              <div style={{ marginTop: '4px' }}>
                Risk: {pendingApproval.impact.riskLevel} | Affected: {pendingApproval.impact.filesAffected.length}{' '}
                files
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ApprovalButton onClick={() => handleApproval(step.id, true)} $variant="approve">
                Approve
              </ApprovalButton>
              <ApprovalButton onClick={() => handleApproval(step.id, false)} $variant="reject">
                Reject
              </ApprovalButton>
            </div>
          </ApprovalPromptCompact>
        )}
      </CompactStepCard>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if step status, result, or pending approval changed
    return (
      prevProps.step.id === nextProps.step.id &&
      prevProps.step.status === nextProps.step.status &&
      prevProps.step.result === nextProps.step.result &&
      prevProps.pendingApproval?.stepId === nextProps.pendingApproval?.stepId
    );
  }
);

MemoizedStepCard.displayName = 'MemoizedStepCard';

interface AIChatProps {
  messages: AIMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  showReasoningProcess?: boolean | undefined;
  currentModel?: string | undefined;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  // Agent mode integration
  taskPlanner?: any; // TaskPlanner instance
  executionEngine?: any; // ExecutionEngine instance
  workspaceContext?: {
    workspaceRoot: string;
    currentFile?: string;
    openFiles: string[];
    recentFiles: string[];
  };
  // Message management for Agent Mode
  onAddMessage?: (message: AIMessage) => void;
  onUpdateMessage?: (messageId: string, updater: (msg: AIMessage) => AIMessage) => void;
  // Callbacks for agent actions
  onFileChanged?: (filePath: string, action: 'created' | 'modified' | 'deleted') => void;
  onTaskComplete?: (task: AgentTask) => void;
  onTaskError?: (task: AgentTask, error: Error) => void;
  onApprovalRequired?: (step: AgentStep, request: ApprovalRequest) => Promise<boolean>;
  // Task execution tracking
  onTaskStart?: (task: AgentTask) => void;
  onStepStart?: (step: AgentStep, stepIndex: number) => void;
  onStepComplete?: (step: AgentStep) => void;
  onTaskCompleteCallback?: (task: AgentTask) => void;
}

const MIN_WIDTH = 380;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 380;

const AIChat: React.FC<AIChatProps> = ({
  messages,
  onSendMessage,
  onClose,
  showReasoningProcess = false,
  currentModel = 'deepseek-chat',
  mode: externalMode,
  onModeChange,
  taskPlanner,
  executionEngine,
  workspaceContext,
  onAddMessage,
  onUpdateMessage,
  onFileChanged,
  onTaskComplete,
  onTaskError,
  onApprovalRequired,
  // Task execution tracking - unused but kept for API compatibility
  onTaskStart: _onTaskStart,
  onStepStart: _onStepStart,
  onStepComplete: _onStepComplete,
  onTaskCompleteCallback: _onTaskCompleteCallback,
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mode state - controlled or uncontrolled
  const [internalMode, setInternalMode] = useState<ChatMode>('chat');
  const mode = externalMode || internalMode;
  const handleModeChange = (newMode: ChatMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
    // Auto-expand width for agent/composer modes
    if (newMode === 'agent' || newMode === 'composer') {
      setWidth(Math.max(width, 600)); // Expand to at least 600px for agent/composer
    }
  };

  // Resize functionality
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('aiChatWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(width);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
  };

  useEffect(() => {
    if (!isResizing) {return;}

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX; // Subtract because we're dragging from right edge
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth.current + deltaX));
      setWidth(newWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      localStorage.setItem('aiChatWidth', width.toString());
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, width]);

  // Save width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('aiChatWidth', width.toString());
  }, [width]);

  const getModeDescription = (mode: ChatMode) => {
    switch (mode) {
      case 'chat':
        return {
          title: 'Chat Mode',
          description: 'Have conversations with AI, ask questions, get code explanations, and receive instant coding assistance.',
        };
      case 'agent':
        return {
          title: 'Agent Mode',
          description: 'Let AI autonomously plan and execute complex multi-step tasks. Perfect for implementing features, refactoring code, or generating complete components.',
        };
      case 'composer':
        return {
          title: 'Composer Mode',
          description: 'AI-powered multi-file editing. Make coordinated changes across multiple files with intelligent context awareness.',
        };
    }
  };

  const getQuickActions = () => {
    // Mode-specific actions
    if (mode === 'agent') {
      return [
        'Create a new feature',
        'Refactor this component',
        'Add error handling',
        'Generate test suite',
        'Implement authentication',
        'Setup API integration',
      ];
    }

    if (mode === 'composer') {
      return [
        'Update all imports',
        'Rename component',
        'Move files to new structure',
        'Add types across files',
        'Refactor shared logic',
        'Update dependencies',
      ];
    }

    // Chat mode - model-specific actions
    switch (currentModel) {
      case 'deepseek-coder':
        return [
          'Generate REST API',
          'Create React component',
          'Implement algorithm',
          'Design pattern example',
          'Refactor to TypeScript',
          'Add error handling',
        ];
      case 'deepseek-reasoner':
        return [
          'Debug this issue',
          'Analyze complexity',
          'Compare approaches',
          'Design system architecture',
          'Explain the logic',
          'Find edge cases',
        ];
      default: // deepseek-chat
        return [
          'Explain this code',
          'Generate function',
          'Add comments',
          'Fix bugs',
          'Optimize code',
          'Write tests',
        ];
    }
  };

  const quickActions = getQuickActions();
  const modeInfo = getModeDescription(mode);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const messageText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // Agent mode: Plan and execute task
      if (mode === 'agent' && taskPlanner && executionEngine && workspaceContext) {
        await handleAgentTask(messageText);
      } else {
        // Regular chat mode
        await onSendMessage(messageText);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleAgentTask = async (userRequest: string) => {
    if (!taskPlanner || !executionEngine || !workspaceContext) {
      logger.error('Agent mode requires taskPlanner, executionEngine, and workspaceContext');
      return;
    }

    try {
      // Set workspace context for ExecutionEngine so it can resolve paths correctly
      executionEngine.setTaskContext(userRequest, workspaceContext.workspaceRoot);
      logger.debug('[AIChat] Set task context with workspace root:', workspaceContext.workspaceRoot);

      // Plan the task
      const planResponse = await taskPlanner.planTask({
        userRequest,
        context: workspaceContext,
        options: {
          maxSteps: 10,
          requireApprovalForAll: false,
          allowDestructiveActions: true,
        },
      });

      // Create a message with the agent task
      const agentMessageId = Date.now().toString();
      const agentMessage: AIMessage = {
        id: agentMessageId,
        role: 'assistant',
        content: `**Agent Task**: ${planResponse.task.title}\n\n${planResponse.task.description}\n\nPlanning complete. Ready to execute ${planResponse.task.steps.length} steps.`,
        timestamp: new Date(),
        agentTask: {
          task: planResponse.task,
        },
      };

      // Add the message to show initial task plan
      if (onAddMessage) {
        onAddMessage(agentMessage);
        logger.debug('[AIChat] Added agent message with task plan');
      } else {
        logger.warn('[AIChat] onAddMessage not provided, agent task will not be visible');
      }

      // Execute the task with callbacks
      const callbacks = {
        onStepStart: (step: AgentStep) => {
          logger.debug('[AIChat] Step started:', step.title);
          // Update message to show current step
          if (onUpdateMessage) {
            onUpdateMessage(agentMessageId, (msg) => {
              if (!msg.agentTask) {return msg;}
              return {
                ...msg,
                agentTask: {
                  ...msg.agentTask,
                  currentStep: step,
                },
              };
            });
          }
        },
        onStepComplete: (step: AgentStep, result: any) => {
          logger.debug('[AIChat] Step completed:', step.title, result);
          // Update message to reflect completed step
          if (onUpdateMessage) {
            onUpdateMessage(agentMessageId, (msg) => {
              // The step object passed in should already have the updated status and result
              // Just trigger a re-render by updating the message
              return { ...msg };
            });
          }
        },
        onStepError: (step: AgentStep, error: Error) => {
          logger.error('[AIChat] Step failed:', step.title, error);
          // Update message to show error
          if (onUpdateMessage) {
            onUpdateMessage(agentMessageId, (msg) => ({ ...msg }));
          }
        },
        onFileChanged: (filePath: string, action: 'created' | 'modified' | 'deleted') => {
          logger.debug('[AIChat] File changed:', filePath, action);
          if (onFileChanged) {
            onFileChanged(filePath, action);
          }
        },
        onStepApprovalRequired: async (step: AgentStep, request: ApprovalRequest) => {
          if (onApprovalRequired) {
            return await onApprovalRequired(step, request);
          }
          return true; // Default approve
        },
        onTaskComplete: (task: AgentTask) => {
          if (onTaskComplete) {
            onTaskComplete(task);
          }
        },
        onTaskError: (task: AgentTask, error: Error) => {
          if (onTaskError) {
            onTaskError(task, error);
          }
        },
      };

      await executionEngine.executeTask(planResponse.task, callbacks);
    } catch (error) {
      logger.error('Agent task failed:', error);
      // TODO: Show error message
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show a toast notification here
  };

  // Removed formatMessage function - now using SecureMessageContent component

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render icon for step status
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'in_progress':
        return <Loader2 size={16} className="animate-spin" />;
      case 'completed':
        return <CheckCircle2 size={16} />;
      case 'failed':
        return <XCircle size={16} />;
      case 'awaiting_approval':
        return <Shield size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  // Render compact agent task visualization
  const renderAgentTask = (message: AIMessage) => {
    if (!message.agentTask) {return null;}

    const { task, pendingApproval } = message.agentTask;
    const completedSteps = task.steps.filter(s => s.status === 'completed').length;
    const progress = (completedSteps / task.steps.length) * 100;

    return (
      <div data-testid="agent-task">
        <TaskProgressBar>
          <TaskProgressFill
            $progress={progress}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </TaskProgressBar>
        <AgentStepsList>
          {task.steps.map((step) => (
            <MemoizedStepCard
              key={step.id}
              step={step}
              pendingApproval={pendingApproval}
              getStepIcon={getStepIcon}
              handleApproval={(stepId: string, approved: boolean) => {
                // TODO: Handle approval/rejection properly
                logger.debug(approved ? 'Approved step:' : 'Rejected step:', stepId);
              }}
            />
          ))}
        </AgentStepsList>
      </div>
    );
  };

  return (
    <ChatContainer $width={width} $mode={mode}>
      <ResizeHandle $isResizing={isResizing} onMouseDown={handleResizeStart} />
      <ChatHeader>
        {mode === 'chat' && <Zap size={16} />}
        {mode === 'agent' && <Play size={16} />}
        {mode === 'composer' && <FileEdit size={16} />}
        {mode === 'chat' ? 'AI Assistant' : mode === 'agent' ? 'Agent Mode' : 'Composer Mode'}
        <ModeSwitcher>
          <ModeButton
            $active={mode === 'chat'}
            onClick={() => handleModeChange('chat')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Chat Mode: Conversational AI assistance"
            data-testid="mode-chat"
            className={mode === 'chat' ? 'active' : ''}
          >
            Chat
          </ModeButton>
          <ModeButton
            $active={mode === 'agent'}
            onClick={() => handleModeChange('agent')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Agent Mode: Autonomous task execution"
            data-testid="mode-agent"
            className={mode === 'agent' ? 'active' : ''}
          >
            Agent
          </ModeButton>
          <ModeButton
            $active={mode === 'composer'}
            onClick={() => handleModeChange('composer')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Composer Mode: Multi-file editing"
          >
            Composer
          </ModeButton>
        </ModeSwitcher>
        <CloseButton
          onClick={onClose}
          title="Close AI Chat"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={16} />
        </CloseButton>
      </ChatHeader>

      {/* Mode Description */}
      <ModeDescription
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        key={mode}
      >
        <strong>{modeInfo.title}</strong>
        {modeInfo.description}
      </ModeDescription>

      <MessagesContainer>
        {messages.map((message) => (
          <Message
            key={message.id}
            role={message.role === 'system' ? 'assistant' : message.role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageIcon role={message.role === 'system' ? 'assistant' : message.role}>
              {message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </MessageIcon>
            <MessageContent>
              <SecureMessageContent
                content={message.content}
                role={message.role === 'system' ? 'assistant' : message.role}
              />

              {/* Render agent task steps if present */}
              {message.agentTask && renderAgentTask(message)}

              {showReasoningProcess &&
                message.reasoning_content &&
                message.role === 'assistant' && (
                  <ReasoningContent>
                    <summary>🧠 View Reasoning Process</summary>
                    <SecureMessageContent
                      content={message.reasoning_content}
                      role="assistant"
                    />
                  </ReasoningContent>
                )}
              <MessageActions>
                <ActionButton
                  onClick={() => copyToClipboard(message.content)}
                  title="Copy message"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Copy size={12} />
                </ActionButton>
                {message.role === 'assistant' && (
                  <>
                    <ActionButton
                      title="Good response"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsUp size={12} />
                    </ActionButton>
                    <ActionButton
                      title="Poor response"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsDown size={12} />
                    </ActionButton>
                  </>
                )}
              </MessageActions>
              <MessageTime>{formatTime(message.timestamp)}</MessageTime>
            </MessageContent>
          </Message>
        ))}

        {isTyping && (
          <Message role="assistant">
            <MessageIcon role="assistant">
              <Bot size={12} />
            </MessageIcon>
            <MessageContent>
              <TypingIndicator>AI is thinking...</TypingIndicator>
            </MessageContent>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <QuickActions>
          {quickActions.map((action) => (
            <QuickActionButton
              key={action}
              onClick={() => handleQuickAction(action)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {action}
            </QuickActionButton>
          ))}
        </QuickActions>

        <InputWrapper>
          <TextInput
            ref={inputRef}
            id="ai-chat-input"
            name="aiChatMessage"
            aria-label="AI chat message input"
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI about your code..."
            disabled={isTyping}
          />
          <SendButton
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            title="Send message (Enter)"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={16} />
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </ChatContainer>
  );
};

export default AIChat;
