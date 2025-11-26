/**
 * TaskMonitorPanel Styled Components
 * All styled components for the Task Monitor Panel UI
 */
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  max-width: 800px;
  margin: 16px auto;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 18px;
  font-weight: 700;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

export const IconButton = styled.button<{ $active?: boolean }>`
  background: ${(props) =>
    props.$active ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'};
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: ${vibeTheme.colors.text};
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.4);
    transform: translateY(-1px);
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

export const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
`;

export const StatIcon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${(props) => props.$color}22;
  color: ${(props) => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatValue = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 20px;
  font-weight: 700;
`;

export const StatLabel = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
`;

export const Filters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

export const FilterButton = styled.button<{ $active: boolean }>`
  background: ${(props) =>
    props.$active ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.1)'};
  border: 1px solid
    ${(props) =>
      props.$active ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.3)'};
  color: ${vibeTheme.colors.text};
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.3);
  }
`;

export const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 4px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const TaskCard = styled(motion.div)`
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

export const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
`;

export const TaskInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

export const TaskDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TaskName = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
`;

export const TaskDescription = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
`;

export const TaskControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ControlButton = styled.button<{ $danger?: boolean }>`
  background: ${(props) =>
    props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)'};
  border: 1px solid
    ${(props) =>
      props.$danger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)'};
  color: ${(props) => (props.$danger ? '#ef4444' : vibeTheme.colors.text)};
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'};
  }
`;

export const ProgressContainer = styled.div`
  padding: 0 12px 12px 12px;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
`;

export const ProgressFill = styled.div<{ $percentage: number }>`
  width: ${(props) => props.$percentage}%;
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #60a5fa 100%);
  transition: width 0.3s ease;
`;

export const ProgressText = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
`;

export const TaskExpanded = styled(motion.div)`
  overflow: hidden;
`;

export const TaskMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
`;

export const MetaItem = styled.div`
  display: flex;
  gap: 6px;
`;

export const MetaLabel = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
`;

export const MetaValue = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
`;

export const TaskResult = styled.div`
  padding: 12px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
`;

export const ResultSuccess = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 13px;
  margin-bottom: 8px;
`;

export const ResultError = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 8px;
`;

export const LogsContainer = styled.div`
  margin-top: 8px;
`;

export const LogsTitle = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
`;

export const LogLine = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 4px;
`;

export const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${vibeTheme.colors.textSecondary};
`;

export const EmptyText = styled.div`
  margin-top: 16px;
  font-size: 14px;
`;

export const HistorySection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.3);
`;

export const HistoryTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
`;

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
`;

export const HistoryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  span {
    color: ${vibeTheme.colors.text};
    font-size: 13px;
  }
`;

export const HistoryTime = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
`;
