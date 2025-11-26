/**
 * EnhancedAgentMode Styled Components
 * All styled components for the Enhanced Agent Mode UI
 */
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

import { vibeTheme } from '../../styles/theme';
import type { LogEntryType, TaskStatus } from './types';

export const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Container = styled(motion.div)`
  width: 95%;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(139, 92, 246, 0.4);
  overflow: hidden;
  position: relative;
`;

export const Header = styled.div`
  padding: 20px 24px;
  border-bottom: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: ${vibeTheme.colors.purple};
  }
`;

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const getStatusBackground = (status: TaskStatus) => {
  switch (status) {
    case 'analyzing': return `${vibeTheme.colors.cyan}20`;
    case 'coordinating': return `${vibeTheme.colors.purple}20`;
    case 'executing': return 'rgba(251, 191, 36, 0.2)';
    case 'completed': return `${vibeTheme.colors.success}20`;
    case 'error': return `${vibeTheme.colors.error}20`;
    default: return vibeTheme.colors.surface;
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'analyzing': return vibeTheme.colors.cyan;
    case 'coordinating': return vibeTheme.colors.purple;
    case 'executing': return '#fbbf24';
    case 'completed': return vibeTheme.colors.success;
    case 'error': return vibeTheme.colors.error;
    default: return vibeTheme.colors.text;
  }
};

export const StatusIndicator = styled.div<{ $status: TaskStatus }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => getStatusBackground(props.$status)};
  color: ${props => getStatusColor(props.$status)};
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export const TaskSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: ${vibeTheme.borders.thin};
`;

export const TaskInput = styled.div`
  padding: 24px;
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
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }
  
  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

export const ExecutionLog = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
`;

const getLogBorderColor = (type: LogEntryType) => {
  switch (type) {
    case 'agent': return vibeTheme.colors.purple;
    case 'coordination': return vibeTheme.colors.cyan;
    case 'success': return vibeTheme.colors.success;
    case 'error': return vibeTheme.colors.error;
    case 'performance': return '#fbbf24';
    default: return 'transparent';
  }
};

const getLogBackground = (type: LogEntryType) => {
  switch (type) {
    case 'agent': return `${vibeTheme.colors.purple}08`;
    case 'coordination': return `${vibeTheme.colors.cyan}08`;
    case 'success': return `${vibeTheme.colors.success}08`;
    case 'error': return `${vibeTheme.colors.error}08`;
    case 'performance': return 'rgba(251, 191, 36, 0.08)';
    default: return 'transparent';
  }
};

const getLogAgentColor = (type: LogEntryType) => {
  switch (type) {
    case 'agent': return vibeTheme.colors.purple;
    case 'coordination': return vibeTheme.colors.cyan;
    default: return 'inherit';
  }
};

export const LogEntryStyled = styled(motion.div)<{ $type: LogEntryType }>`
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid ${props => getLogBorderColor(props.$type)};
  background: ${props => getLogBackground(props.$type)};
  
  .timestamp {
    font-size: 11px;
    color: ${vibeTheme.colors.textSecondary};
    margin-right: 12px;
  }
  
  .content {
    color: ${vibeTheme.colors.text};
    
    .agent-name {
      font-weight: 600;
      color: ${props => getLogAgentColor(props.$type)};
    }
    
    .performance-metric {
      font-size: 12px;
      color: ${vibeTheme.colors.textSecondary};
      margin-left: 8px;
    }
  }
`;

export const Sidebar = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  background: rgba(139, 92, 246, 0.05);
  border-left: ${vibeTheme.borders.thin};
`;

export const SidebarSection = styled.div`
  border-bottom: ${vibeTheme.borders.thin};
`;

export const SidebarHeader = styled.div`
  padding: 16px 20px;
  font-weight: 600;
  font-size: 14px;
  color: ${vibeTheme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${vibeTheme.colors.purple};
  }
`;

export const SidebarContent = styled(motion.div)`
  padding: 0 20px 16px;
  font-size: 13px;
`;

export const AgentCard = styled.div<{ $active: boolean }>`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${props => props.$active ? `${vibeTheme.colors.purple}15` : vibeTheme.colors.surface};
  border: 2px solid ${props => props.$active ? vibeTheme.colors.purple : 'transparent'};
  transition: all 0.2s;
  
  .agent-name {
    font-weight: 600;
    font-size: 14px;
    color: ${vibeTheme.colors.text};
    margin-bottom: 4px;
  }
  
  .agent-role {
    font-size: 12px;
    color: ${vibeTheme.colors.textSecondary};
    margin-bottom: 8px;
  }
  
  .agent-metrics {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

export const PerformanceMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 12px;
  
  .metric-label {
    color: ${vibeTheme.colors.textSecondary};
  }
  
  .metric-value {
    color: ${vibeTheme.colors.text};
    font-weight: 600;
  }
`;

export const Footer = styled.div`
  padding: 20px 24px;
  border-top: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(139, 92, 246, 0.05);
`;

type ButtonVariant = 'primary' | 'secondary' | 'danger';

const getButtonBackground = (variant?: ButtonVariant) => {
  switch (variant) {
    case 'primary': return vibeTheme.colors.purple;
    case 'danger': return vibeTheme.colors.error;
    default: return vibeTheme.colors.surface;
  }
};

const getButtonColor = (variant?: ButtonVariant) => {
  switch (variant) {
    case 'primary':
    case 'danger': 
      return 'white';
    default: 
      return vibeTheme.colors.text;
  }
};

export const ActionButton = styled(motion.button)<{ $variant?: ButtonVariant }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => getButtonBackground(props.$variant)};
  color: ${props => getButtonColor(props.$variant)};
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
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

export const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  
  .progress-text {
    font-size: 14px;
    color: ${vibeTheme.colors.text};
  }
  
  .progress-detail {
    font-size: 12px;
    color: ${vibeTheme.colors.textSecondary};
  }
`;
