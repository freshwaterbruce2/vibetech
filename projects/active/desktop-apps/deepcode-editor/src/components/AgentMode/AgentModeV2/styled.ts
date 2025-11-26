/**
 * AgentModeV2 Styled Components
 * All styled-components for the Agent Mode V2 UI
 */
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../../styles/theme';
import type { StepStatus, TaskStatus } from '../../../types';

// ============================================================================
// Layout Components
// ============================================================================

export const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const Container = styled(motion.div)`
  width: 100%;
  max-width: 1400px;
  max-height: 95vh;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 0;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
  border-radius: 16px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(139, 92, 246, 0.5);
  overflow: hidden;
`;

export const MainPanel = styled.div`
  display: flex;
  flex-direction: column;
  border-right: ${vibeTheme.borders.thin};
`;

// ============================================================================
// Header Components
// ============================================================================

export const Header = styled.div`
  padding: 24px 28px;
  border-bottom: ${vibeTheme.borders.thin};
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
`;

export const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    color: ${vibeTheme.colors.purple};
  }
`;

export const Subtitle = styled.div`
  font-size: 14px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.5;
`;

// ============================================================================
// Input Components
// ============================================================================

export const TaskInputSection = styled.div`
  padding: 24px 28px;
  border-bottom: ${vibeTheme.borders.thin};
`;

export const TaskTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px 20px;
  background: ${vibeTheme.colors.surface};
  color: ${vibeTheme.colors.text};
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 15px;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// ============================================================================
// Status Components
// ============================================================================

export const StatusBar = styled.div<{ $status: TaskStatus }>`
  padding: 16px 28px;
  border-bottom: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => {
        switch (props.$status) {
            case 'planning': return 'rgba(59, 130, 246, 0.08)';
            case 'in_progress': return 'rgba(251, 191, 36, 0.08)';
            case 'completed': return `${vibeTheme.colors.success}08`;
            case 'failed': return `${vibeTheme.colors.error}08`;
            default: return 'transparent';
        }
    }};
`;

export const StatusBadge = styled.div<{ $status: TaskStatus }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  background: ${props => {
        switch (props.$status) {
            case 'planning': return `${vibeTheme.colors.cyan}20`;
            case 'in_progress': return 'rgba(251, 191, 36, 0.2)';
            case 'completed': return `${vibeTheme.colors.success}20`;
            case 'failed': return `${vibeTheme.colors.error}20`;
            default: return vibeTheme.colors.surface;
        }
    }};
  color: ${props => {
        switch (props.$status) {
            case 'planning': return vibeTheme.colors.cyan;
            case 'in_progress': return '#fbbf24';
            case 'completed': return vibeTheme.colors.success;
            case 'failed': return vibeTheme.colors.error;
            default: return vibeTheme.colors.text;
        }
    }};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ProgressText = styled.div`
  font-size: 13px;
  color: ${vibeTheme.colors.textSecondary};
`;

// ============================================================================
// Step Components
// ============================================================================

export const StepsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
`;

export const StepCard = styled(motion.div) <{ $status: StepStatus }>`
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid ${props => {
        switch (props.$status) {
            case 'awaiting_approval': return '#fbbf24';
            case 'in_progress': return vibeTheme.colors.purple;
            case 'completed': return vibeTheme.colors.success;
            case 'failed': return vibeTheme.colors.error;
            case 'skipped': return '#fb923c';
            default: return vibeTheme.colors.surface;
        }
    }};
  background: ${props => {
        switch (props.$status) {
            case 'awaiting_approval': return 'rgba(251, 191, 36, 0.08)';
            case 'in_progress': return `${vibeTheme.colors.purple}08`;
            case 'completed': return `${vibeTheme.colors.success}05`;
            case 'failed': return `${vibeTheme.colors.error}05`;
            case 'skipped': return 'rgba(251, 146, 60, 0.08)';
            default: return vibeTheme.colors.surface;
        }
    }};
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

export const StepNumber = styled.div<{ $status: StepStatus }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  background: ${props => {
        switch (props.$status) {
            case 'awaiting_approval': return '#fbbf24';
            case 'in_progress': return vibeTheme.colors.purple;
            case 'completed': return vibeTheme.colors.success;
            case 'failed': return vibeTheme.colors.error;
            case 'skipped': return '#fb923c';
            default: return vibeTheme.colors.surface;
        }
    }};
  color: ${props => props.$status === 'pending' ? vibeTheme.colors.textSecondary : 'white'};
`;

export const StepContent = styled.div`
  flex: 1;
`;

export const StepTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
  color: ${vibeTheme.colors.text};
`;

export const StepDescription = styled.div`
  font-size: 13px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: 8px;
`;

export const StepMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

// ============================================================================
// Approval Components
// ============================================================================

export const ApprovalPrompt = styled(motion.div)`
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
`;

export const ApprovalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #fbbf24;
  margin-bottom: 12px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ApprovalDetails = styled.div`
  font-size: 13px;
  color: ${vibeTheme.colors.text};
  margin-bottom: 12px;
  line-height: 1.6;

  .detail-label {
    font-weight: 600;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

export const ApprovalActions = styled.div`
  display: flex;
  gap: 12px;
`;

// ============================================================================
// Button Components
// ============================================================================

export const Button = styled(motion.button) <{ $variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background: ${props => {
        switch (props.$variant) {
            case 'primary': return vibeTheme.colors.purple;
            case 'danger': return vibeTheme.colors.error;
            case 'success': return vibeTheme.colors.success;
            default: return vibeTheme.colors.surface;
        }
    }};

  color: ${props => {
        switch (props.$variant) {
            case 'primary':
            case 'danger':
            case 'success':
                return 'white';
            default:
                return vibeTheme.colors.text;
        }
    }};

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ============================================================================
// Side Panel Components
// ============================================================================

export const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(139, 92, 246, 0.05);
`;

export const SidePanelSection = styled.div`
  padding: 20px 24px;
  border-bottom: ${vibeTheme.borders.thin};
`;

export const SectionTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};

  svg {
    width: 16px;
    height: 16px;
    color: ${vibeTheme.colors.purple};
  }
`;

export const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;

  .label {
    color: ${vibeTheme.colors.textSecondary};
    font-weight: 500;
    min-width: 80px;
  }

  .value {
    color: ${vibeTheme.colors.text};
    flex: 1;
    word-break: break-word;
  }
`;

export const WarningList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const WarningItem = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${vibeTheme.colors.error}08;
  border-left: 3px solid ${vibeTheme.colors.error};
  font-size: 12px;
  color: ${vibeTheme.colors.text};
  line-height: 1.5;
`;

// ============================================================================
// Confidence Components (Phase 6)
// ============================================================================

export const ConfidenceBadge = styled.div<{ $riskLevel: 'low' | 'medium' | 'high' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => {
        switch (props.$riskLevel) {
            case 'low': return `${vibeTheme.colors.success}15`;
            case 'medium': return 'rgba(251, 191, 36, 0.15)';
            case 'high': return `${vibeTheme.colors.error}15`;
        }
    }};
  color: ${props => {
        switch (props.$riskLevel) {
            case 'low': return vibeTheme.colors.success;
            case 'medium': return '#fbbf24';
            case 'high': return vibeTheme.colors.error;
        }
    }};
  border: 1px solid ${props => {
        switch (props.$riskLevel) {
            case 'low': return `${vibeTheme.colors.success}40`;
            case 'medium': return 'rgba(251, 191, 36, 0.4)';
            case 'high': return `${vibeTheme.colors.error}40`;
        }
    }};
`;

export const ConfidenceFactors = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
`;

export const FactorItem = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
  color: ${props => props.$positive ? vibeTheme.colors.success : vibeTheme.colors.error};

  &:last-child {
    margin-bottom: 0;
  }

  .factor-icon {
    width: 14px;
    height: 14px;
  }

  .factor-text {
    flex: 1;
    color: ${vibeTheme.colors.text};
  }

  .factor-impact {
    font-weight: 600;
    color: ${props => props.$positive ? vibeTheme.colors.success : vibeTheme.colors.error};
  }
`;

// ============================================================================
// Fallback Components
// ============================================================================

export const FallbackIndicator = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

export const FallbackItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  .fallback-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.2);
    color: ${vibeTheme.colors.cyan};
    font-weight: 600;
    font-size: 11px;
    flex-shrink: 0;
  }

  .fallback-content {
    flex: 1;
    color: ${vibeTheme.colors.text};
    line-height: 1.5;
  }

  .fallback-trigger {
    color: ${vibeTheme.colors.textSecondary};
    font-style: italic;
    margin-bottom: 4px;
  }

  .fallback-confidence {
    color: ${vibeTheme.colors.cyan};
    font-weight: 600;
  }
`;

// ============================================================================
// Footer Components
// ============================================================================

export const Footer = styled.div`
  padding: 20px 28px;
  border-top: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(139, 92, 246, 0.05);
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: ${vibeTheme.colors.text};
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: ${vibeTheme.colors.purple};
  }
`;
