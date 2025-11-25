import React, { useEffect,useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  History,
  List,
  Loader,
  Pause,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { BackgroundTask, TaskStats,TaskStatus, TaskType } from '@vibetech/types/tasks';

interface TaskMonitorPanelProps {
  tasks: BackgroundTask[];
  stats: TaskStats;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  history?: BackgroundTask[];
}

export const TaskMonitorPanel: React.FC<TaskMonitorPanelProps> = ({
  tasks,
  stats,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onClearCompleted,
  onClearAll,
  history = [],
}) => {
  const [filter, setFilter] = useState<'all' | 'running' | 'queued' | 'completed'>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') {return true;}
    if (filter === 'running') {return task.status === TaskStatus.RUNNING;}
    if (filter === 'queued') {return task.status === TaskStatus.QUEUED;}
    if (filter === 'completed')
      {return task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED;}
    return true;
  });

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <Container
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>
          <List size={20} />
          Background Tasks
        </Title>
        <Actions>
          <IconButton onClick={onClearCompleted} title="Clear Completed">
            <Trash2 size={16} />
          </IconButton>
          <IconButton
            onClick={() => setShowHistory(!showHistory)}
            title="Task History"
            $active={showHistory}
          >
            <History size={16} />
          </IconButton>
        </Actions>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon $color="#60a5fa">
            <Clock size={18} />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.queued}</StatValue>
            <StatLabel>Queued</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#8b5cf6">
            <Loader size={18} />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.running}</StatValue>
            <StatLabel>Running</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#10b981">
            <CheckCircle2 size={18} />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.completed}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#ef4444">
            <AlertCircle size={18} />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.failed}</StatValue>
            <StatLabel>Failed</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <Filters>
        <FilterButton
          onClick={() => setFilter('all')}
          $active={filter === 'all'}
        >
          All ({tasks.length})
        </FilterButton>
        <FilterButton
          onClick={() => setFilter('running')}
          $active={filter === 'running'}
        >
          Running ({stats.running})
        </FilterButton>
        <FilterButton
          onClick={() => setFilter('queued')}
          $active={filter === 'queued'}
        >
          Queued ({stats.queued})
        </FilterButton>
        <FilterButton
          onClick={() => setFilter('completed')}
          $active={filter === 'completed'}
        >
          Completed ({stats.completed})
        </FilterButton>
      </Filters>

      <TaskList>
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <EmptyState
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Clock size={48} />
              <EmptyText>No tasks {filter !== 'all' && `in ${filter}`}</EmptyText>
            </EmptyState>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <TaskHeader onClick={() => toggleTaskExpanded(task.id)}>
                  <TaskInfo>
                    <TaskStatusIcon status={task.status} />
                    <TaskDetails>
                      <TaskName>{task.name}</TaskName>
                      {task.description && (
                        <TaskDescription>{task.description}</TaskDescription>
                      )}
                    </TaskDetails>
                  </TaskInfo>

                  <TaskControls>
                    {task.status === TaskStatus.RUNNING && task.pausable && (
                      <ControlButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onPauseTask(task.id);
                        }}
                        title="Pause"
                      >
                        <Pause size={14} />
                      </ControlButton>
                    )}

                    {task.status === TaskStatus.PAUSED && (
                      <ControlButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onResumeTask(task.id);
                        }}
                        title="Resume"
                      >
                        <Play size={14} />
                      </ControlButton>
                    )}

                    {(task.status === TaskStatus.QUEUED ||
                      task.status === TaskStatus.RUNNING ||
                      task.status === TaskStatus.PAUSED) &&
                      task.cancelable && (
                        <ControlButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelTask(task.id);
                          }}
                          title="Cancel"
                          $danger
                        >
                          <X size={14} />
                        </ControlButton>
                      )}

                    {expandedTasks.has(task.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </TaskControls>
                </TaskHeader>

                {(task.status === TaskStatus.RUNNING ||
                  task.status === TaskStatus.PAUSED) && (
                  <ProgressContainer>
                    <ProgressBar>
                      <ProgressFill $percentage={task.progress.percentage} />
                    </ProgressBar>
                    <ProgressText>
                      {task.progress.message ||
                        `${task.progress.current}/${task.progress.total} (${task.progress.percentage}%)`}
                    </ProgressText>
                  </ProgressContainer>
                )}

                <AnimatePresence>
                  {expandedTasks.has(task.id) && (
                    <TaskExpanded
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TaskMeta>
                        <MetaItem>
                          <MetaLabel>Type:</MetaLabel>
                          <MetaValue>{task.type}</MetaValue>
                        </MetaItem>
                        <MetaItem>
                          <MetaLabel>Created:</MetaLabel>
                          <MetaValue>
                            {new Date(task.createdAt).toLocaleTimeString()}
                          </MetaValue>
                        </MetaItem>
                        {task.startedAt && (
                          <MetaItem>
                            <MetaLabel>Started:</MetaLabel>
                            <MetaValue>
                              {new Date(task.startedAt).toLocaleTimeString()}
                            </MetaValue>
                          </MetaItem>
                        )}
                        {task.completedAt && (
                          <MetaItem>
                            <MetaLabel>Completed:</MetaLabel>
                            <MetaValue>
                              {new Date(task.completedAt).toLocaleTimeString()}
                            </MetaValue>
                          </MetaItem>
                        )}
                      </TaskMeta>

                      {task.result && (
                        <TaskResult>
                          {task.result.success ? (
                            <ResultSuccess>
                              <CheckCircle2 size={16} />
                              Task completed successfully
                            </ResultSuccess>
                          ) : (
                            <ResultError>
                              <AlertCircle size={16} />
                              {task.result.error || 'Task failed'}
                            </ResultError>
                          )}

                          {task.result.logs && task.result.logs.length > 0 && (
                            <LogsContainer>
                              <LogsTitle>Logs:</LogsTitle>
                              {task.result.logs.map((log, i) => (
                                <LogLine key={i}>{log}</LogLine>
                              ))}
                            </LogsContainer>
                          )}
                        </TaskResult>
                      )}
                    </TaskExpanded>
                  )}
                </AnimatePresence>
              </TaskCard>
            ))
          )}
        </AnimatePresence>
      </TaskList>

      {showHistory && history.length > 0 && (
        <HistorySection>
          <HistoryTitle>
            <History size={16} />
            Recent History ({history.length})
          </HistoryTitle>
          <HistoryList>
            {history.slice(0, 10).map((task) => (
              <HistoryItem key={task.id}>
                <TaskStatusIcon status={task.status} />
                <HistoryInfo>
                  <span>{task.name}</span>
                  <HistoryTime>
                    {new Date(task.completedAt || task.createdAt).toLocaleString()}
                  </HistoryTime>
                </HistoryInfo>
              </HistoryItem>
            ))}
          </HistoryList>
        </HistorySection>
      )}
    </Container>
  );
};

// Status icon component
const TaskStatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case TaskStatus.QUEUED:
      return <Clock size={16} color="#60a5fa" />;
    case TaskStatus.RUNNING:
      return <Loader size={16} color="#8b5cf6" className="spin" />;
    case TaskStatus.PAUSED:
      return <Pause size={16} color="#f59e0b" />;
    case TaskStatus.COMPLETED:
      return <CheckCircle2 size={16} color="#10b981" />;
    case TaskStatus.FAILED:
      return <AlertCircle size={16} color="#ef4444" />;
    case TaskStatus.CANCELED:
      return <X size={16} color="#6b7280" />;
    default:
      return <Clock size={16} />;
  }
};

// Styled components
const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  max-width: 800px;
  margin: 16px auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 18px;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button<{ $active?: boolean }>`
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
`;

const StatIcon = styled.div<{ $color: string }>`
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

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatValue = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 20px;
  font-weight: 700;
`;

const StatLabel = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
`;

const Filters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const FilterButton = styled.button<{ $active: boolean }>`
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

const TaskList = styled.div`
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

const TaskCard = styled(motion.div)`
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
`;

const TaskInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const TaskDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TaskName = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
`;

const TaskDescription = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
`;

const TaskControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ControlButton = styled.button<{ $danger?: boolean }>`
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

const ProgressContainer = styled.div`
  padding: 0 12px 12px 12px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  width: ${(props) => props.$percentage}%;
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #60a5fa 100%);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
`;

const TaskExpanded = styled(motion.div)`
  overflow: hidden;
`;

const TaskMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
`;

const MetaItem = styled.div`
  display: flex;
  gap: 6px;
`;

const MetaLabel = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
`;

const MetaValue = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
`;

const TaskResult = styled.div`
  padding: 12px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
`;

const ResultSuccess = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 13px;
  margin-bottom: 8px;
`;

const ResultError = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 8px;
`;

const LogsContainer = styled.div`
  margin-top: 8px;
`;

const LogsTitle = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const LogLine = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 4px;
`;

const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${vibeTheme.colors.textSecondary};
`;

const EmptyText = styled.div`
  margin-top: 16px;
  font-size: 14px;
`;

const HistorySection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.3);
`;

const HistoryTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
`;

const HistoryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  span {
    color: ${vibeTheme.colors.text};
    font-size: 13px;
  }
`;

const HistoryTime = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
`;
