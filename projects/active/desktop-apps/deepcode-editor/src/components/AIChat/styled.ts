/**
 * AIChat Styled Components
 * All styled-components for the AI Chat UI
 */
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

import { vibeTheme } from '../../styles/theme';
import type { StepStatus } from '../../types';
import type { ChatMode } from './types';

// ============================================================================
// Animations
// ============================================================================

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// ============================================================================
// Layout Components
// ============================================================================

export const ChatContainer = styled.div<{ $width: number; $mode: ChatMode }>`
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
            case 'agent': return 'linear-gradient(180deg, rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.2))';
            case 'composer': return 'linear-gradient(180deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.2))';
            default: return vibeTheme.gradients.border;
        }
    }};
    opacity: ${props => props.$mode !== 'chat' ? 1 : 0.6};
  }
`;

export const ResizeHandle = styled.div<{ $isResizing: boolean }>`
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

// ============================================================================
// Header Components
// ============================================================================

export const ChatHeader = styled.div`
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

export const ModeSwitcher = styled.div`
  display: flex;
  gap: 4px;
  background: rgba(139, 92, 246, 0.1);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
`;

export const ModeButton = styled(motion.button) <{ $active: boolean }>`
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

export const ModeDescription = styled(motion.div)`
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

export const CloseButton = styled(motion.button)`
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

// ============================================================================
// Message Components
// ============================================================================

export const MessagesContainer = styled.div`
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

export const Message = styled(motion.div) <{ role: 'user' | 'assistant' }>`
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

export const MessageIcon = styled.div<{ role: 'user' | 'assistant' }>`
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

export const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MessageActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${Message}:hover & {
    opacity: 1;
  }
`;

export const ActionButton = styled(motion.button)`
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

export const MessageTime = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textMuted};
  margin-top: ${vibeTheme.spacing.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

export const ReasoningContent = styled.details`
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

// ============================================================================
// Input Components
// ============================================================================

export const InputContainer = styled.div`
  padding: ${vibeTheme.spacing.md};
  border-top: 2px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
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

export const InputWrapper = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.sm};
  align-items: flex-end;
`;

export const TextInput = styled.textarea`
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

export const SendButton = styled(motion.button) <{ disabled: boolean }>`
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

export const TypingIndicator = styled.div`
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

// ============================================================================
// Quick Actions
// ============================================================================

export const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${vibeTheme.spacing.xs};
  margin-bottom: ${vibeTheme.spacing.sm};
`;

export const QuickActionButton = styled(motion.button)`
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

// ============================================================================
// Agent Step Components
// ============================================================================

export const AgentStepsList = styled.div`
  margin-top: ${vibeTheme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing.xs};
`;

export const CompactStepCard = styled(motion.div) <{ $status: StepStatus }>`
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

export const StepHeaderCompact = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  margin-bottom: 4px;
`;

export const StepIconCompact = styled.div<{ $status: StepStatus }>`
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

export const StepTitleCompact = styled.div`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
  flex: 1;
`;

export const StepDescriptionCompact = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.4;
  margin-left: 28px;
`;

export const TaskProgressBar = styled.div`
  margin-top: ${vibeTheme.spacing.sm};
  background: rgba(100, 116, 139, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  height: 4px;
  overflow: hidden;
`;

export const TaskProgressFill = styled(motion.div) <{ $progress: number }>`
  height: 100%;
  background: ${vibeTheme.gradients.primary};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

// ============================================================================
// Approval Components
// ============================================================================

export const ApprovalPromptCompact = styled(motion.div)`
  margin-top: ${vibeTheme.spacing.xs};
  padding: ${vibeTheme.spacing.sm};
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
  border-radius: ${vibeTheme.borderRadius.small};
`;

export const ApprovalButton = styled(motion.button) <{ $variant: 'approve' | 'reject' }>`
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
