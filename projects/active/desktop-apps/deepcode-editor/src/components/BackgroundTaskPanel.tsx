/**
 * Background Task Panel Component
 *
 * Displays and manages background agent tasks
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Play,
  Pause,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { BackgroundAgentSystem, BackgroundTask } from '../services/BackgroundAgentSystem';
import { vibeTheme } from '../styles/theme';

interface BackgroundTaskPanelProps {
  backgroundAgent: BackgroundAgentSystem;
  onTaskClick?: (task: BackgroundTask) => void;
}

export const BackgroundTaskPanel: React.FC<BackgroundTaskPanelProps> = ({
  backgroundAgent,
  onTaskClick,
}) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  });

  useEffect(() => {
    // Initial load
    updateTasks();

    // Subscribe to events
    const onTaskUpdate = () => updateTasks();

    backgroundAgent.on('submitted', onTaskUpdate);
    backgroundAgent.on('started', onTaskUpdate);
    backgroundAgent.on('progress', onTaskUpdate);
    backgroundAgent.on('completed', onTaskUpdate);
    backgroundAgent.on('failed', onTaskUpdate);
    backgroundAgent.on('cancelled', onTaskUpdate);

    return () => {
      backgroundAgent.off('submitted', onTaskUpdate);
      backgroundAgent.off('started', onTaskUpdate);
      backgroundAgent.off('progress', onTaskUpdate);
      backgroundAgent.off('completed', onTaskUpdate);
      backgroundAgent.off('failed', onTaskUpdate);
      backgroundAgent.off('cancelled', onTaskUpdate);
    };
  }, [backgroundAgent]);

  const updateTasks = () => {
    const allTasks = backgroundAgent.getAllTasks();
    setTasks(allTasks);
    setStats(backgroundAgent.getStats());
  };

  const handleCancel = (taskId: string) => {
    backgroundAgent.cancel(taskId);
  };

  const handleClearCompleted = () => {
    backgroundAgent.clearCompleted();
    updateTasks();
  };

  const getFilteredTasks = (): BackgroundTask[] => {
    switch (filter) {
      case 'running':
        return tasks.filter(t => t.status === 'running' || t.status === 'pending');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      case 'failed':
        return tasks.filter(t => t.status === 'failed');
      default:
        return tasks;
    }
  };

  const formatDuration = (task: BackgroundTask): string => {
    if (!task.startTime) return '-';

    const endTime = task.endTime || Date.now();
    const duration = endTime - task.startTime;
    const seconds = Math.floor(duration / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getStatusIcon = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'running':
        return <Loader size={16} className="spinning" />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'failed':
        return <AlertCircle size={16} />;
      case 'cancelled':
        return <X size={16} />;
    }
  };

  const getStatusColor = (status: BackgroundTask['status']): string => {
    switch (status) {
      case 'pending':
        return '#6b7280';
      case 'running':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'cancelled':
        return '#f59e0b';
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <Activity size={20} />
          Background Tasks
        </Title>
        <Stats>
          <StatItem>
            <StatLabel>Running</StatLabel>
            <StatValue color="#3b82f6">{stats.running}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Completed</StatLabel>
            <StatValue color="#10b981">{stats.completed}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Failed</StatLabel>
            <StatValue color="#ef4444">{stats.failed}</StatValue>
          </StatItem>
        </Stats>
      </Header>

      <FilterBar>
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </FilterButton>
        <FilterButton
          active={filter === 'running'}
          onClick={() => setFilter('running')}
        >
          Active ({stats.running + stats.pending})
        </FilterButton>
        <FilterButton
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
        >
          Completed ({stats.completed})
        </FilterButton>
        <FilterButton
          active={filter === 'failed'}
          onClick={() => setFilter('failed')}
        >
          Failed ({stats.failed})
        </FilterButton>

        {stats.completed > 0 && (
          <ClearButton onClick={handleClearCompleted}>
            Clear Completed
          </ClearButton>
        )}
      </FilterBar>

      <TaskList>
        {getFilteredTasks().length === 0 ? (
          <EmptyState>
            <Activity size={48} />
            <EmptyText>No tasks yet</EmptyText>
            <EmptySubtext>
              Background tasks will appear here when you run agents
            </EmptySubtext>
          </EmptyState>
        ) : (
          getFilteredTasks().map(task => (
            <TaskItem
              key={task.id}
              onClick={() => onTaskClick?.(task)}
            >
              <TaskHeader>
                <TaskStatus color={getStatusColor(task.status)}>
                  {getStatusIcon(task.status)}
                  <span>{task.status}</span>
                </TaskStatus>
                <TaskActions>
                  {task.status === 'running' && (
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(task.id);
                      }}
                      title="Cancel task"
                    >
                      <X size={16} />
                    </ActionButton>
                  )}
                </TaskActions>
              </TaskHeader>

              <TaskContent>
                <TaskTitle>{task.userRequest}</TaskTitle>
                {task.stepDescription && task.status === 'running' && (
                  <TaskStep>{task.stepDescription}</TaskStep>
                )}

                {task.status === 'running' && (
                  <ProgressBar>
                    <ProgressFill progress={task.progress || 0} />
                    <ProgressText>
                      {Math.round(task.progress || 0)}%
                      {task.currentStep && task.totalSteps && (
                        <> · Step {task.currentStep}/{task.totalSteps}</>
                      )}
                    </ProgressText>
                  </ProgressBar>
                )}

                {task.error && (
                  <ErrorMessage>{task.error.message}</ErrorMessage>
                )}
              </TaskContent>

              <TaskFooter>
                <TaskMeta>
                  <MetaItem>
                    <Clock size={12} />
                    {formatDuration(task)}
                  </MetaItem>
                  <MetaItem>Agent: {task.agentId}</MetaItem>
                </TaskMeta>
              </TaskFooter>
            </TaskItem>
          ))
        )}
      </TaskList>
    </Container>
  );
};

// Styled Components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.background};
  color: ${vibeTheme.text};
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: ${vibeTheme.borders.divider};
`;

const Title = styled.h2`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Stats = styled.div`
  display: flex;
  gap: 16px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.span`
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
`;

const StatValue = styled.span<{ color: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.color};
`;

const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: ${vibeTheme.borders.divider};
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.active ? '#3b82f6' : '#444'};
  background: ${props => props.active ? '#3b82f633' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : '#d4d4d4'};
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#3b82f644' : '#ffffff11'};
  }
`;

const ClearButton = styled.button`
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid #444;
  background: transparent;
  color: #f59e0b;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f59e0b22;
    border-color: #f59e0b;
  }
`;

const TaskList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  gap: 12px;
  padding: 48px 24px;
`;

const EmptyText = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const EmptySubtext = styled.div`
  font-size: 13px;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
`;

const TaskItem = styled.div`
  background: #252526;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2d2d30;
    border-color: #444;
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TaskStatus = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.color};
  text-transform: uppercase;

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const TaskActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  padding: 4px;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #ffffff11;
    color: #fff;
  }
`;

const TaskContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #e5e5e5;
`;

const TaskStep = styled.div`
  font-size: 12px;
  color: #888;
  font-style: italic;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 20px;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
`;

const ErrorMessage = styled.div`
  padding: 8px;
  background: #7f1d1d22;
  border: 1px solid #991b1b;
  border-radius: 4px;
  font-size: 12px;
  color: #fca5a5;
`;

const TaskFooter = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #333;
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #888;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;
