/**
 * TaskResumption Component
 * 
 * Provides UI for resuming previously interrupted Agent Mode tasks
 */
import { logger } from '../services/Logger';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ExecutionEngine } from '../services/ai/ExecutionEngine';

interface ResumableTask {
  id: string;
  title: string;
  progress: string;
  timestamp: Date;
}

interface TaskResumptionProps {
  executionEngine: ExecutionEngine | null;
  onResumeTask: (taskId: string) => Promise<void>;
  onClose: () => void;
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #2d2d30;
  border: 1px solid #464647;
  border-radius: 8px;
  padding: 24px;
  min-width: 500px;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  color: #cccccc;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 16px;
  
  &:hover {
    background: #464647;
  }
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskItem = styled.div`
  background: #383838;
  border: 1px solid #464647;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #424242;
    border-color: #007acc;
  }
`;

const TaskTitle = styled.div`
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 8px;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #cccccc;
  font-size: 13px;
`;

const TaskProgress = styled.div`
  color: #4ec9b0;
`;

const TaskTimestamp = styled.div`
  color: #9cdcfe;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #cccccc;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 20px;
  color: #cccccc;
`;

export const TaskResumption: React.FC<TaskResumptionProps> = ({
  executionEngine,
  onResumeTask,
  onClose,
}) => {
  const [tasks, setTasks] = useState<ResumableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResumableTasks();
  }, []);

  const loadResumableTasks = async () => {
    if (!executionEngine) {
      setError('ExecutionEngine not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const resumableTasks = await executionEngine.getResumableTasks();
      setTasks(resumableTasks);
      setError(null);
    } catch (err) {
      setError('Failed to load resumable tasks');
      logger.error('Failed to load resumable tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      await onResumeTask(taskId);
      onClose();
    } catch (err) {
      setError('Failed to resume task');
      logger.error('Failed to resume task:', err);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  };

  return (
    <Container onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Resume Agent Tasks</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        {loading && <LoadingState>Loading resumable tasks...</LoadingState>}

        {error && (
          <EmptyState>
            <div style={{ color: '#f48771' }}>{error}</div>
          </EmptyState>
        )}

        {!loading && !error && tasks.length === 0 && (
          <EmptyState>
            No resumable tasks found.
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Agent Mode tasks that are interrupted will appear here for resumption.
            </div>
          </EmptyState>
        )}

        {!loading && !error && tasks.length > 0 && (
          <TaskList>
            {tasks.map((task) => (
              <TaskItem key={task.id} onClick={() => handleResumeTask(task.id)}>
                <TaskTitle>{task.title}</TaskTitle>
                <TaskMeta>
                  <TaskProgress>{task.progress}</TaskProgress>
                  <TaskTimestamp>{formatTimestamp(task.timestamp)}</TaskTimestamp>
                </TaskMeta>
              </TaskItem>
            ))}
          </TaskList>
        )}
      </Modal>
    </Container>
  );
};