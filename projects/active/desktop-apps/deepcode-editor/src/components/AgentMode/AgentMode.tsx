/**
 * Agent Mode - Autonomous coding interface inspired by Cursor's Agent Mode
 */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Code,
  Zap,
} from 'lucide-react';
import { vibeTheme } from '../../styles/theme';

interface AgentModeProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (task: string) => void;
  workspaceContext?: {
    workspaceFolder: string;
    currentFile?: string;
    openFiles?: string[];
  };
}

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled(motion.div)`
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(139, 92, 246, 0.3);
  overflow: hidden;
  position: relative;
  z-index: 10000;
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    color: ${vibeTheme.colors.purple};
  }
`;

const StatusIndicator = styled.div<{ $status: 'idle' | 'running' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => 
    props.$status === 'running' ? `${vibeTheme.colors.purple}20` :
    props.$status === 'completed' ? `${vibeTheme.colors.success}20` :
    props.$status === 'error' ? `${vibeTheme.colors.error}20` :
    vibeTheme.colors.surface
  };
  color: ${props =>
    props.$status === 'running' ? vibeTheme.colors.purple :
    props.$status === 'completed' ? vibeTheme.colors.success :
    props.$status === 'error' ? vibeTheme.colors.error :
    vibeTheme.colors.text
  };
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TaskInput = styled.div`
  padding: 20px;
  border-bottom: ${vibeTheme.borders.thin};
`;

const TaskTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  background: ${vibeTheme.colors.surface};
  color: ${vibeTheme.colors.text};
  border: ${vibeTheme.borders.thin};
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }
  
  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const ExecutionLog = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
`;

const LogEntry = styled(motion.div)<{ $type: 'info' | 'action' | 'success' | 'error' }>`
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props =>
    props.$type === 'action' ? `${vibeTheme.colors.purple}10` :
    props.$type === 'success' ? `${vibeTheme.colors.success}10` :
    props.$type === 'error' ? `${vibeTheme.colors.error}10` :
    'transparent'
  };
  
  .timestamp {
    font-size: 11px;
    color: ${vibeTheme.colors.textSecondary};
    margin-right: 8px;
  }
  
  .content {
    color: ${props =>
      props.$type === 'action' ? vibeTheme.colors.purple :
      props.$type === 'success' ? vibeTheme.colors.success :
      props.$type === 'error' ? vibeTheme.colors.error :
      vibeTheme.colors.text
    };
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
  padding: 12px 16px;
  background: ${vibeTheme.colors.surface};
  border-radius: 8px;
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${vibeTheme.colors.purple};
    color: white;
    font-size: 12px;
    font-weight: 600;
  }
  
  .step-description {
    flex: 1;
    color: ${vibeTheme.colors.text};
  }
  
  .step-status {
    color: ${vibeTheme.colors.textSecondary};
    font-size: 12px;
  }
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ActionButton = styled(motion.button)<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  background: ${props =>
    props.$variant === 'primary' ? vibeTheme.colors.purple :
    props.$variant === 'danger' ? vibeTheme.colors.error :
    vibeTheme.colors.surface
  };
  
  color: ${props =>
    props.$variant === 'primary' || props.$variant === 'danger' ? 'white' :
    vibeTheme.colors.text
  };
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ContextInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: ${vibeTheme.colors.surface};
  border-top: ${vibeTheme.borders.thin};
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  
  .context-item {
    display: flex;
    align-items: center;
    gap: 4px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

interface LogEntry {
  id: string;
  type: 'info' | 'action' | 'success' | 'error';
  timestamp: Date;
  content: string;
}

const AgentMode: React.FC<AgentModeProps> = ({
  isOpen,
  onClose,
  onComplete,
  workspaceContext,
}) => {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      content,
    }]);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const executeTask = async () => {
    if (!task.trim()) return;

    setStatus('running');
    setLogs([]);
    setCurrentStep(0);
    setTotalSteps(0);

    addLog('info', `Starting autonomous task: "${task}"`);
    addLog('info', `Workspace: ${workspaceContext?.workspaceFolder || 'No workspace'}`);

    try {
      // Simulate task analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('action', '🔍 Analyzing task requirements...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTotalSteps(5);
      addLog('info', 'Task breakdown: 5 steps identified');

      // Simulate step execution
      const steps = [
        'Setting up environment',
        'Analyzing code structure',
        'Implementing changes',
        'Running tests',
        'Finalizing and cleanup',
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, 2000));
        addLog('action', `Step ${i + 1}/${steps.length}: ${steps[i]}`);
        
        // Simulate sub-actions
        if (i === 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          addLog('info', '  → Created new component structure');
          await new Promise(resolve => setTimeout(resolve, 1000));
          addLog('info', '  → Updated imports and exports');
        }
      }

      setStatus('completed');
      addLog('success', '✅ Task completed successfully!');
      
      // Call onComplete callback
      setTimeout(() => {
        onComplete(task);
      }, 1500);

    } catch (error) {
      setStatus('error');
      addLog('error', `❌ Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStop = () => {
    setStatus('idle');
    addLog('info', 'Task execution stopped by user');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <Container
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
          <Header>
            <Title>
              <Zap />
              Agent Mode
            </Title>
            <StatusIndicator $status={status}>
              {status === 'running' && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={14} />
                  </motion.div>
                  Running
                </>
              )}
              {status === 'completed' && (
                <>
                  <CheckCircle size={14} />
                  Completed
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle size={14} />
                  Error
                </>
              )}
              {status === 'idle' && 'Ready'}
            </StatusIndicator>
          </Header>

          <Content>
            <TaskInput>
              <TaskTextarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Describe what you want me to build or fix..."
                disabled={status === 'running'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    executeTask();
                  }
                }}
              />
            </TaskInput>

            {workspaceContext && (
              <ContextInfo>
                <div className="context-item">
                  <FileText />
                  {workspaceContext.workspaceFolder}
                </div>
                {workspaceContext.currentFile && (
                  <div className="context-item">
                    <Code />
                    {workspaceContext.currentFile}
                  </div>
                )}
              </ContextInfo>
            )}

            <ExecutionLog>
              {logs.map((log, index) => (
                <LogEntry
                  key={log.id}
                  $type={log.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="timestamp">{formatTimestamp(log.timestamp)}</span>
                  <span className="content">{log.content}</span>
                </LogEntry>
              ))}
              
              {status === 'running' && totalSteps > 0 && (
                <StepIndicator>
                  <div className="step-number">{currentStep}</div>
                  <div className="step-description">
                    Processing step {currentStep} of {totalSteps}
                  </div>
                  <div className="step-status">
                    {Math.round((currentStep / totalSteps) * 100)}% complete
                  </div>
                </StepIndicator>
              )}
              
              <div ref={logEndRef} />
            </ExecutionLog>
          </Content>

          <Footer>
            <div style={{ display: 'flex', gap: '8px' }}>
              {status === 'idle' && (
                <ActionButton
                  $variant="primary"
                  onClick={executeTask}
                  disabled={!task.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={16} />
                  Start Task
                </ActionButton>
              )}
              
              {status === 'running' && (
                <ActionButton
                  $variant="danger"
                  onClick={handleStop}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Square size={16} />
                  Stop
                </ActionButton>
              )}
              
              {(status === 'completed' || status === 'error') && (
                <ActionButton
                  $variant="primary"
                  onClick={() => {
                    setStatus('idle');
                    setLogs([]);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset
                </ActionButton>
              )}
            </div>
            
            <ActionButton
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </ActionButton>
          </Footer>
          </Container>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

export default AgentMode;