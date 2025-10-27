/**
 * Task Execution Panel Component
 *
 * Displays real-time task execution progress, similar to Cursor/Windsurf
 */

import React, { useEffect,useState } from 'react';
import styled from 'styled-components';

import { AgentStep } from '../services/ai/types';
import { vibeTheme } from '../styles/theme';

interface TaskExecutionPanelProps {
  currentStep: AgentStep | null;
  totalSteps: number;
  currentStepIndex: number;
  isExecuting: boolean;
}

const PanelContainer = styled.div<{ $isExecuting: boolean }>`
  position: fixed;
  top: ${props => props.$isExecuting ? '60px' : '-200px'};
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  max-width: 90vw;
  background: rgba(30, 30, 30, 0.98);
  border: 1px solid #3e3e3e;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  padding: 16px;
  z-index: 2000;
  transition: top 0.3s ease;
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${vibeTheme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Spinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
`;

const ActionContainer = styled.div`
  margin-bottom: 12px;
`;

const ActionType = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #8b5cf6;
  margin-bottom: 6px;
  text-transform: capitalize;
`;

const ActionDetails = styled.div`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  font-family: 'Consolas', 'Monaco', monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ThoughtContainer = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #3e3e3e;
`;

const ThoughtLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${vibeTheme.colors.textSecondary};
  margin-bottom: 6px;
`;

const ThoughtText = styled.div`
  font-size: 12px;
  color: ${vibeTheme.colors.text};
  font-style: italic;
  line-height: 1.5;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  transition: width 0.3s ease;
`;

const ElapsedTime = styled.div`
  font-size: 11px;
  color: ${vibeTheme.colors.textSecondary};
  text-align: right;
  margin-top: 8px;
`;

export const TaskExecutionPanel: React.FC<TaskExecutionPanelProps> = ({
  currentStep,
  totalSteps,
  currentStepIndex,
  isExecuting,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isExecuting && currentStep) {
      setStartTime(Date.now());
      setElapsedSeconds(0);

      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setStartTime(null);
      setElapsedSeconds(0);
    }
  }, [isExecuting, currentStep]);

  if (!currentStep) {
    return null;
  }

  const getActionDescription = (step: AgentStep): string => {
    const { type, params } = step.action;

    switch (type) {
      case 'read_file':
        return `📖 Reading: ${params.filePath}`;
      case 'write_file':
        return `✍️ Writing: ${params.filePath}`;
      case 'delete_file':
        return `🗑️ Deleting: ${params.filePath}`;
      case 'create_directory':
        return `📁 Creating directory: ${params.path}`;
      case 'analyze_code':
        return `🔍 Analyzing code: ${params.filePath || 'workspace'}`;
      case 'generate_code':
        return `⚡ Generating code...`;
      case 'refactor_code':
        return `♻️ Refactoring: ${params.filePath}`;
      case 'run_tests':
        return `🧪 Running tests...`;
      default:
        return `🤖 ${type.replace(/_/g, ' ')}`;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;
  const thought = currentStep.result?.data?.thought;

  return (
    <PanelContainer $isExecuting={isExecuting}>
      <Header>
        <Title>
          <Spinner />
          AI Agent Working
        </Title>
        <ProgressText>
          Step {currentStepIndex + 1} of {totalSteps}
        </ProgressText>
      </Header>

      <ActionContainer>
        <ActionType>
          {getActionDescription(currentStep)}
        </ActionType>
        {currentStep.description && (
          <ActionDetails title={currentStep.description}>
            {currentStep.description}
          </ActionDetails>
        )}
      </ActionContainer>

      {thought && (
        <ThoughtContainer>
          <ThoughtLabel>AI Thought Process</ThoughtLabel>
          <ThoughtText>{thought}</ThoughtText>
        </ThoughtContainer>
      )}

      <ProgressBar>
        <ProgressFill $percent={progressPercent} />
      </ProgressBar>

      <ElapsedTime>
        {formatTime(elapsedSeconds)} elapsed
      </ElapsedTime>
    </PanelContainer>
  );
};
