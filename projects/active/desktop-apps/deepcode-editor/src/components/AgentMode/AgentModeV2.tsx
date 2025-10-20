/**
 * Agent Mode V2 - Real autonomous coding with AI-powered task planning and execution
 * Implements 2025 best practices for agentic AI workflows
 */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Code,
  Zap,
  Activity,
  Clock,
  ChevronRight,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { vibeTheme } from '../../styles/theme';
import { TaskPlanner } from '../../services/ai/TaskPlanner';
import { ExecutionEngine, ExecutionCallbacks } from '../../services/ai/ExecutionEngine';
import {
  AgentTask,
  AgentStep,
  ApprovalRequest,
  TaskStatus,
  StepStatus,
  EnhancedAgentStep,
  PlanningInsights,
} from '../../types';

interface AgentModeV2Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (task: AgentTask) => void;
  taskPlanner: TaskPlanner;
  executionEngine: ExecutionEngine;
  workspaceContext?: {
    workspaceRoot: string;
    currentFile?: string;
    openFiles: string[];
    recentFiles: string[];
  };
}

const Backdrop = styled(motion.div)`
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

const Container = styled(motion.div)`
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

const MainPanel = styled.div`
  display: flex;
  flex-direction: column;
  border-right: ${vibeTheme.borders.thin};
`;

const Header = styled.div`
  padding: 24px 28px;
  border-bottom: ${vibeTheme.borders.thin};
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
`;

const Title = styled.h2`
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

const Subtitle = styled.div`
  font-size: 14px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.5;
`;

const TaskInputSection = styled.div`
  padding: 24px 28px;
  border-bottom: ${vibeTheme.borders.thin};
`;

const TaskTextarea = styled.textarea`
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

const StatusBar = styled.div<{ $status: TaskStatus }>`
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

const StatusBadge = styled.div<{ $status: TaskStatus }>`
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

const ProgressText = styled.div`
  font-size: 13px;
  color: ${vibeTheme.colors.textSecondary};
`;

const StepsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
`;

const StepCard = styled(motion.div)<{ $status: StepStatus }>`
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'awaiting_approval': return '#fbbf24';
      case 'in_progress': return vibeTheme.colors.purple;
      case 'completed': return vibeTheme.colors.success;
      case 'failed': return vibeTheme.colors.error;
      case 'skipped': return '#fb923c'; // Orange for skipped
      default: return vibeTheme.colors.surface;
    }
  }};
  background: ${props => {
    switch (props.$status) {
      case 'awaiting_approval': return 'rgba(251, 191, 36, 0.08)';
      case 'in_progress': return `${vibeTheme.colors.purple}08`;
      case 'completed': return `${vibeTheme.colors.success}05`;
      case 'failed': return `${vibeTheme.colors.error}05`;
      case 'skipped': return 'rgba(251, 146, 60, 0.08)'; // Orange background for skipped
      default: return vibeTheme.colors.surface;
    }
  }};
`;

const StepHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const StepNumber = styled.div<{ $status: StepStatus }>`
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
      case 'skipped': return '#fb923c'; // Orange for skipped
      default: return vibeTheme.colors.surface;
    }
  }};
  color: ${props => props.$status === 'pending' ? vibeTheme.colors.textSecondary : 'white'};
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
  color: ${vibeTheme.colors.text};
`;

const StepDescription = styled.div`
  font-size: 13px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: 8px;
`;

const StepMeta = styled.div`
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

const ApprovalPrompt = styled(motion.div)`
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
`;

const ApprovalTitle = styled.div`
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

const ApprovalDetails = styled.div`
  font-size: 13px;
  color: ${vibeTheme.colors.text};
  margin-bottom: 12px;
  line-height: 1.6;

  .detail-label {
    font-weight: 600;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const ApprovalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled(motion.button)<{ $variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
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

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(139, 92, 246, 0.05);
`;

const SidePanelSection = styled.div`
  padding: 20px 24px;
  border-bottom: ${vibeTheme.borders.thin};
`;

const SectionTitle = styled.div`
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

const InfoRow = styled.div`
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

const WarningList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const WarningItem = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${vibeTheme.colors.error}08;
  border-left: 3px solid ${vibeTheme.colors.error};
  font-size: 12px;
  color: ${vibeTheme.colors.text};
  line-height: 1.5;
`;

// Phase 6: Confidence Display Components
const ConfidenceBadge = styled.div<{ $riskLevel: 'low' | 'medium' | 'high' }>`
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

const ConfidenceFactors = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
`;

const FactorItem = styled.div<{ $positive: boolean }>`
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

const FallbackIndicator = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

const FallbackItem = styled.div`
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

const Footer = styled.div`
  padding: 20px 28px;
  border-top: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(139, 92, 246, 0.05);
`;

const AgentModeV2: React.FC<AgentModeV2Props> = ({
  isOpen,
  onClose,
  onComplete,
  taskPlanner,
  executionEngine,
  workspaceContext,
}) => {
  const [userRequest, setUserRequest] = useState('');
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{ step: AgentStep; request: ApprovalRequest } | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [skippedSteps, setSkippedSteps] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [planningInsights, setPlanningInsights] = useState<PlanningInsights | null>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTask?.steps]);

  const handlePlanTask = async () => {
    if (!userRequest.trim()) return;

    try {
      // PHASE 6: Plan the task using enhanced planning with confidence scores
      const planResponse = await taskPlanner.planTaskEnhanced({
        userRequest,
        context: {
          workspaceRoot: workspaceContext?.workspaceRoot || '',
          openFiles: workspaceContext?.openFiles || [],
          ...(workspaceContext?.currentFile ? { currentFile: workspaceContext.currentFile } : {}),
          recentFiles: workspaceContext?.recentFiles || [],
        },
        options: {
          maxSteps: 20,
          requireApprovalForAll: false,
          allowDestructiveActions: true,
        },
      });

      setCurrentTask(planResponse.task);
      setReasoning(planResponse.reasoning);
      setEstimatedTime(planResponse.estimatedTime || 'Unknown');
      setWarnings(planResponse.warnings || []);
      // PHASE 6: Store planning insights
      setPlanningInsights(planResponse.insights);

      console.log('[AgentModeV2] 📊 Planning Insights:', planResponse.insights);
    } catch (error) {
      console.error('Failed to plan task:', error);
      alert(`Failed to plan task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExecuteTask = async () => {
    if (!currentTask) return;

    const callbacks: ExecutionCallbacks = {
      onStepStart: (step) => {
        console.log('[AgentModeV2] Step started:', step.order, step.title);
        setCurrentTask(prev => {
          if (!prev) return null;
          return {
            ...prev,
            steps: prev.steps.map(s => s.id === step.id ? { ...s, status: 'in_progress' } : s),
          };
        });
      },

      onStepComplete: (step, result) => {
        console.log('[AgentModeV2] Step completed:', step.order, step.title, 'Status:', step.status);

        // Track if step was skipped
        if (step.status === 'skipped' || result.skipped) {
          setSkippedSteps(prev => prev + 1);
          console.log('[AgentModeV2] Step was skipped:', step.title, 'Reason:', result.message);
        } else {
          setCompletedSteps(prev => prev + 1);
        }

        setCurrentTask(prev => {
          if (!prev) return null;
          return {
            ...prev,
            steps: prev.steps.map(s => s.id === step.id ? { ...s, status: step.status, result } : s),
          };
        });
      },

      onStepError: (step, error) => {
        console.error('[AgentModeV2] Step error:', step.order, step.title, error);
        setCurrentTask(prev => {
          if (!prev) return null;
          return {
            ...prev,
            steps: prev.steps.map(s => s.id === step.id ? { ...s, status: 'failed', error: error.message } : s),
          };
        });
      },

      onStepApprovalRequired: async (step, request) => {
        return new Promise((resolve) => {
          setPendingApproval({ step, request });

          // Wait for user to approve/reject
          const checkApproval = setInterval(() => {
            if (pendingApproval === null) {
              clearInterval(checkApproval);
              resolve(step.approved === true);
            }
          }, 100);
        });
      },

      onTaskProgress: (completed, _total) => {
        setCompletedSteps(completed);
      },

      onTaskComplete: (task) => {
        console.log('[AgentModeV2] 🎉 onTaskComplete received! Task status:', task.status);
        console.log('[AgentModeV2] Task has', task.steps.length, 'steps');

        // CRITICAL FIX: Create new object to force React re-render
        // React doesn't detect mutations to the same object reference
        setCurrentTask({ ...task, steps: [...task.steps] });

        console.log('[AgentModeV2] Task state updated. Will call onComplete in 1.5 seconds...');
        setTimeout(() => {
          console.log('[AgentModeV2] Calling onComplete callback');
          onComplete(task);
        }, 1500);
      },

      onTaskError: (task, error) => {
        setCurrentTask(task);
        console.error('Task execution failed:', error);
      },
    };

    try {
      const updatedTask = await executionEngine.executeTask(currentTask, callbacks);
      setCurrentTask(updatedTask);
    } catch (error) {
      console.error('Execution engine error:', error);
    }
  };

  const handleApprove = () => {
    if (!pendingApproval || !currentTask) return;

    setCurrentTask(prev => {
      if (!prev) return null;
      return {
        ...prev,
        steps: prev.steps.map(s =>
          s.id === pendingApproval.step.id
            ? { ...s, approved: true, status: 'approved' }
            : s
        ),
      };
    });

    setPendingApproval(null);
  };

  const handleReject = () => {
    if (!pendingApproval || !currentTask) return;

    setCurrentTask(prev => {
      if (!prev) return null;
      return {
        ...prev,
        steps: prev.steps.map(s =>
          s.id === pendingApproval.step.id
            ? { ...s, approved: false, status: 'rejected' }
            : s
        ),
        status: 'cancelled',
      };
    });

    setPendingApproval(null);
  };

  const handlePause = () => {
    executionEngine.pause();
  };

  const handleResume = () => {
    executionEngine.resume();
  };

  const handleStop = () => {
    if (currentTask) {
      setCurrentTask(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'planning':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}><Loader2 /></motion.div>;
      case 'in_progress':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}><Activity /></motion.div>;
      case 'completed':
        return <CheckCircle2 />;
      case 'failed':
        return <XCircle />;
      default:
        return null;
    }
  };

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'in_progress':
        return <Loader2 className="animate-spin" />;
      case 'completed':
        return <CheckCircle2 />;
      case 'failed':
        return <XCircle />;
      case 'awaiting_approval':
        return <Shield />;
      case 'skipped':
        return <AlertTriangle />; // Warning icon for skipped steps
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <Container
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <MainPanel>
              <Header>
                <Title>
                  <Zap />
                  Agent Mode V2
                </Title>
                <Subtitle>
                  AI-powered autonomous task planning and execution with human approval checkpoints
                </Subtitle>
              </Header>

              <TaskInputSection>
                <TaskTextarea
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                  placeholder="Describe what you want me to build, fix, or improve... (e.g., 'Create a new React component for user authentication')"
                  disabled={currentTask?.status === 'in_progress'}
                />
              </TaskInputSection>

              {currentTask && (
                <>
                  <StatusBar $status={currentTask.status}>
                    <StatusBadge $status={currentTask.status}>
                      {getStatusIcon(currentTask.status)}
                      {currentTask.status.charAt(0).toUpperCase() + currentTask.status.slice(1).replace('_', ' ')}
                    </StatusBadge>
                    <ProgressText>
                      {completedSteps} completed
                      {skippedSteps > 0 && `, ${skippedSteps} skipped`}
                      {' / '}{currentTask.steps.length} total
                      {estimatedTime && ` • Est. ${estimatedTime}`}
                    </ProgressText>
                  </StatusBar>

                  <StepsContainer>
                    {currentTask.steps.map((step, index) => {
                      // Check if this is a synthesis step for special styling
                      const isSynthesis = step.result?.data?.isSynthesis === true;
                      const hasAIReview = step.result?.data?.generatedCode && step.status === 'completed';

                      // PHASE 6: Cast to EnhancedAgentStep to access confidence data
                      const enhancedStep = step as EnhancedAgentStep;
                      const hasConfidence = enhancedStep.confidence !== undefined;
                      const hasFallbacks = enhancedStep.fallbackPlans && enhancedStep.fallbackPlans.length > 0;

                      return (
                      <StepCard
                        key={step.id}
                        $status={step.status}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={isSynthesis ? {
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))',
                          border: '2px solid rgba(139, 92, 246, 0.6)',
                          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
                        } : hasAIReview ? {
                          borderLeft: '4px solid rgba(139, 92, 246, 0.4)'
                        } : undefined}
                      >
                        <StepHeader>
                          <StepNumber $status={step.status}>
                            {getStepIcon(step.status) || step.order}
                          </StepNumber>
                          <StepContent>
                            <StepTitle>{step.title}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>

                            {/* PHASE 6: Confidence Badge */}
                            {hasConfidence && (
                              <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                                <ConfidenceBadge $riskLevel={enhancedStep.confidence!.riskLevel}>
                                  {enhancedStep.confidence!.riskLevel === 'low' && '✓'}
                                  {enhancedStep.confidence!.riskLevel === 'medium' && '⚠'}
                                  {enhancedStep.confidence!.riskLevel === 'high' && '⚠'}
                                  {Math.round(enhancedStep.confidence!.score)}% confidence
                                  {enhancedStep.confidence!.memoryBacked && ' • Memory-backed'}
                                </ConfidenceBadge>
                              </div>
                            )}

                            <StepMeta>
                              <div className="meta-item">
                                <Code />
                                {step.action.type.replace('_', ' ')}
                              </div>
                              {step.requiresApproval && (
                                <div className="meta-item">
                                  <Shield />
                                  Requires approval
                                </div>
                              )}
                              {step.retryCount > 0 && step.status !== 'failed' && (
                                <div className="meta-item" style={{ color: '#fb923c' }}>
                                  <AlertTriangle />
                                  Self-correcting (attempt {step.retryCount + 1})
                                </div>
                              )}
                              {step.result && (
                                <div className="meta-item">
                                  {step.result.success ? <CheckCircle2 /> : <XCircle />}
                                  {step.result.message}
                                </div>
                              )}
                            </StepMeta>
                          </StepContent>
                        </StepHeader>

                        {/* PHASE 6: Confidence Factors */}
                        {hasConfidence && enhancedStep.confidence!.factors.length > 0 && (
                          <ConfidenceFactors>
                            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: vibeTheme.colors.purple }}>
                              Confidence Factors
                            </div>
                            {enhancedStep.confidence!.factors.map((factor, idx) => (
                              <FactorItem key={idx} $positive={factor.impact > 0}>
                                <span className="factor-icon">
                                  {factor.impact > 0 ? '+' : ''}
                                </span>
                                <span className="factor-text">{factor.description}</span>
                                <span className="factor-impact">
                                  {factor.impact > 0 ? '+' : ''}{factor.impact}
                                </span>
                              </FactorItem>
                            ))}
                          </ConfidenceFactors>
                        )}

                        {/* PHASE 6: Fallback Plans */}
                        {hasFallbacks && (
                          <FallbackIndicator>
                            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: vibeTheme.colors.cyan }}>
                              {enhancedStep.fallbackPlans!.length} Fallback Plan{enhancedStep.fallbackPlans!.length > 1 ? 's' : ''} Available
                            </div>
                            {enhancedStep.fallbackPlans!.map((fallback, idx) => (
                              <FallbackItem key={fallback.id}>
                                <div className="fallback-number">{idx + 1}</div>
                                <div className="fallback-content">
                                  <div className="fallback-trigger">{fallback.trigger}</div>
                                  <div>{fallback.reasoning}</div>
                                  <div style={{ marginTop: '4px' }}>
                                    <span className="fallback-confidence">
                                      {fallback.confidence}% confidence
                                    </span>
                                  </div>
                                </div>
                              </FallbackItem>
                            ))}
                          </FallbackIndicator>
                        )}

                        {/* Display result data (file content, search results, etc.) */}
                        {step.result?.data && step.status === 'completed' ? (
                          <ApprovalPrompt
                            key={`result-${step.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <ApprovalTitle>
                              <CheckCircle2 />
                              Result Data
                            </ApprovalTitle>
                            <ApprovalDetails style={{ maxHeight: '400px', overflow: 'auto' }}>
                              {(() => {
                                const data = step.result!.data as any; // Dynamic result data structure
                                return (
                                  <>
                                    {/* PHASE 4: Display ReAct Chain-of-Thought */}
                                    {data.thought && (
                                      <div style={{ marginBottom: '16px', borderLeft: '3px solid #8b5cf6', paddingLeft: '12px' }}>
                                        <div style={{ marginBottom: '12px', fontWeight: 600, color: '#8b5cf6', fontSize: '13px' }}>
                                          💭 Chain-of-Thought Reasoning
                                        </div>

                                        {/* Thought Phase */}
                                        <div style={{ marginBottom: '12px' }}>
                                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', marginBottom: '4px' }}>
                                            🧠 Thought
                                          </div>
                                          <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                                            <strong>Approach:</strong> {data.thought.approach}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                                            {data.thought.reasoning}
                                          </div>
                                          <div style={{ fontSize: '11px' }}>
                                            <span style={{ color: '#10b981' }}>Confidence: {data.thought.confidence}%</span>
                                            {data.thought.risks?.length > 0 && (
                                              <span style={{ marginLeft: '12px', color: '#f59e0b' }}>
                                                ⚠️ {data.thought.risks.length} risk(s) identified
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Reflection Phase */}
                                        {data.reflection && (
                                          <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', marginBottom: '4px' }}>
                                              🤔 Reflection
                                            </div>
                                            <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                                              <strong>Knowledge Gained:</strong> {data.reflection.knowledgeGained}
                                            </div>
                                            {data.reflection.whatWorked?.length > 0 && (
                                              <div style={{ fontSize: '11px', color: '#10b981', marginBottom: '2px' }}>
                                                ✅ Worked: {data.reflection.whatWorked.join(', ')}
                                              </div>
                                            )}
                                            {data.reflection.whatFailed?.length > 0 && (
                                              <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '2px' }}>
                                                ❌ Failed: {data.reflection.whatFailed.join(', ')}
                                              </div>
                                            )}
                                            {data.reflection.rootCause && (
                                              <div style={{ fontSize: '11px', color: '#f59e0b', fontStyle: 'italic' }}>
                                                Root Cause: {data.reflection.rootCause}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Full ReAct Cycle (collapsed by default) */}
                                        {data.reActCycle && (
                                          <details style={{ marginTop: '8px' }}>
                                            <summary style={{ fontSize: '11px', cursor: 'pointer', color: '#6366f1' }}>
                                              View Full ReAct Cycle (Cycle #{data.reActCycle.cycleNumber})
                                            </summary>
                                            <pre style={{
                                              fontSize: '10px',
                                              whiteSpace: 'pre-wrap',
                                              background: 'rgba(139, 92, 246, 0.1)',
                                              padding: '8px',
                                              borderRadius: '4px',
                                              marginTop: '8px',
                                              maxHeight: '200px',
                                              overflow: 'auto'
                                            }}>
                                              {JSON.stringify(data.reActCycle, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    )}

                                    {/* Display file content from read_file */}
                                    {data.content && (
                                      <div>
                                        <div style={{ marginBottom: '8px', fontWeight: 600, color: '#10b981' }}>
                                          📄 File Content ({data.filePath || 'file'})
                                        </div>
                                        <pre style={{
                                          fontSize: '12px',
                                          whiteSpace: 'pre-wrap',
                                          wordBreak: 'break-word',
                                          background: 'rgba(0,0,0,0.1)',
                                          padding: '12px',
                                          borderRadius: '4px',
                                          margin: 0,
                                          maxHeight: '300px',
                                          overflow: 'auto'
                                        }}>
                                          {typeof data.content === 'string' ? data.content.slice(0, 5000) : JSON.stringify(data.content).slice(0, 5000)}
                                          {(typeof data.content === 'string' ? data.content : JSON.stringify(data.content)).length > 5000 && '\n... (truncated)'}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Display analysis from analyze_code */}
                                    {data.analysis && (
                                      <div>
                                        <div style={{ marginBottom: '8px', fontWeight: 600, color: '#3b82f6' }}>
                                          📊 Code Analysis
                                        </div>
                                        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                                          <div>Path: {data.analysis.filePath}</div>
                                          <div>Lines: {data.analysis.lines}</div>
                                          <div>Size: {data.analysis.size} bytes</div>
                                        </div>
                                        {data.analysis.content && (
                                          <pre style={{
                                            fontSize: '11px',
                                            whiteSpace: 'pre-wrap',
                                            background: 'rgba(0,0,0,0.1)',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            maxHeight: '200px',
                                            overflow: 'auto'
                                          }}>
                                            {data.analysis.content.slice(0, 3000)}
                                            {data.analysis.content.length > 3000 && '\n... (truncated)'}
                                          </pre>
                                        )}
                                      </div>
                                    )}

                                    {/* Display generated code/reviews */}
                                    {data.generatedCode && (
                                      <div>
                                        <div style={{
                                          marginBottom: '8px',
                                          fontWeight: 700,
                                          fontSize: data.isSynthesis ? '16px' : '14px',
                                          color: data.isSynthesis ? '#a78bfa' : '#8b5cf6',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px'
                                        }}>
                                          {data.isSynthesis ? '✨ Comprehensive Review Summary' : '🤖 AI Review/Analysis'}
                                          {data.isSynthesis && (
                                            <span style={{
                                              background: 'rgba(139, 92, 246, 0.3)',
                                              padding: '2px 8px',
                                              borderRadius: '12px',
                                              fontSize: '11px',
                                              fontWeight: 500
                                            }}>
                                              AUTO-GENERATED
                                            </span>
                                          )}
                                        </div>
                                        <pre style={{
                                          fontSize: data.isSynthesis ? '14px' : '13px',
                                          whiteSpace: 'pre-wrap',
                                          wordBreak: 'break-word',
                                          background: data.isSynthesis
                                            ? 'rgba(139, 92, 246, 0.15)'
                                            : 'rgba(139, 92, 246, 0.1)',
                                          padding: data.isSynthesis ? '16px' : '12px',
                                          borderRadius: '4px',
                                          margin: 0,
                                          lineHeight: '1.7',
                                          border: data.isSynthesis
                                            ? '2px solid rgba(139, 92, 246, 0.5)'
                                            : '1px solid rgba(139, 92, 246, 0.3)',
                                          boxShadow: data.isSynthesis
                                            ? '0 4px 16px rgba(139, 92, 246, 0.2)'
                                            : 'none'
                                        }}>
                                          {data.generatedCode}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Display search results */}
                                    {data.results && (
                                      <div>
                                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                                          🔍 Found {data.results.length} matches
                                        </div>
                                        {data.results.slice(0, 10).map((result: any, idx: number) => (
                                          <div key={idx} style={{ marginBottom: '4px', fontSize: '12px' }}>
                                            {typeof result === 'string' ? result : JSON.stringify(result)}
                                          </div>
                                        ))}
                                        {data.results.length > 10 && (
                                          <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                                            ... and {data.results.length - 10} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {data.analysis && (
                                      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(data.analysis, null, 2)}
                                      </pre>
                                    )}
                                    {data.generatedCode && (
                                      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                        {data.generatedCode}
                                      </pre>
                                    )}
                                    {!data.content && !data.results && !data.analysis && !data.generatedCode && (
                                      <pre style={{ fontSize: '12px' }}>
                                        {JSON.stringify(data, null, 2)}
                                      </pre>
                                    )}
                                  </>
                                );
                              })()}
                            </ApprovalDetails>
                          </ApprovalPrompt>
                        ) : null}

                        {pendingApproval?.step.id === step.id && (
                          <ApprovalPrompt
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <ApprovalTitle>
                              <AlertCircle />
                              Approval Required
                            </ApprovalTitle>
                            <ApprovalDetails>
                              <div className="detail-label">Risk Level:</div>
                              {pendingApproval.request.impact.riskLevel.toUpperCase()}

                              <div className="detail-label" style={{ marginTop: 8 }}>Files Affected:</div>
                              {pendingApproval.request.impact.filesAffected.join(', ') || 'None'}

                              <div className="detail-label" style={{ marginTop: 8 }}>Reversible:</div>
                              {pendingApproval.request.impact.reversible ? 'Yes' : 'No'}
                            </ApprovalDetails>
                            <ApprovalActions>
                              <Button
                                $variant="success"
                                onClick={handleApprove}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <CheckCircle2 />
                                Approve
                              </Button>
                              <Button
                                $variant="danger"
                                onClick={handleReject}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <XCircle />
                                Reject
                              </Button>
                            </ApprovalActions>
                          </ApprovalPrompt>
                        )}
                      </StepCard>
                    );
                    })}
                    <div ref={stepsEndRef} />
                  </StepsContainer>
                </>
              )}

              <Footer>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {!currentTask && (
                    <Button
                      $variant="primary"
                      onClick={handlePlanTask}
                      disabled={!userRequest.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Zap />
                      Plan Task
                    </Button>
                  )}

                  {currentTask && currentTask.status === 'awaiting_approval' && (
                    <Button
                      $variant="primary"
                      onClick={handleExecuteTask}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play />
                      Execute Task
                    </Button>
                  )}

                  {currentTask && currentTask.status === 'in_progress' && (
                    <>
                      {!executionEngine.isPausedState() && (
                        <Button
                          onClick={handlePause}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Pause />
                          Pause
                        </Button>
                      )}
                      {executionEngine.isPausedState() && (
                        <Button
                          $variant="primary"
                          onClick={handleResume}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play />
                          Resume
                        </Button>
                      )}
                      <Button
                        $variant="danger"
                        onClick={handleStop}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Square />
                        Stop
                      </Button>
                    </>
                  )}

                  {currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed') && (
                    <Button
                      $variant="primary"
                      onClick={() => {
                        setCurrentTask(null);
                        setUserRequest('');
                        setCompletedSteps(0);
                        setSkippedSteps(0); // Reset skipped count too
                        setWarnings([]);
                        setReasoning('');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ChevronRight />
                      New Task
                    </Button>
                  )}
                </div>

                <Button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </Button>
              </Footer>
            </MainPanel>

            <SidePanel>
              {workspaceContext && (
                <SidePanelSection>
                  <SectionTitle>
                    <FileText />
                    Workspace Context
                  </SectionTitle>
                  <InfoRow>
                    <span className="label">Root:</span>
                    <span className="value">{workspaceContext.workspaceRoot}</span>
                  </InfoRow>
                  {workspaceContext.currentFile && (
                    <InfoRow>
                      <span className="label">Current File:</span>
                      <span className="value">{workspaceContext.currentFile}</span>
                    </InfoRow>
                  )}
                  <InfoRow>
                    <span className="label">Open Files:</span>
                    <span className="value">{workspaceContext.openFiles.length}</span>
                  </InfoRow>
                </SidePanelSection>
              )}

              {/* PHASE 6: Planning Insights Panel */}
              {planningInsights && (
                <SidePanelSection>
                  <SectionTitle>
                    <Activity />
                    Planning Insights
                  </SectionTitle>
                  <InfoRow>
                    <span className="label">Confidence:</span>
                    <span className="value" style={{
                      color: planningInsights.overallConfidence >= 70 ? vibeTheme.colors.success :
                             planningInsights.overallConfidence >= 40 ? '#fbbf24' : vibeTheme.colors.error
                    }}>
                      {Math.round(planningInsights.overallConfidence)}%
                    </span>
                  </InfoRow>
                  <InfoRow>
                    <span className="label">Success Rate:</span>
                    <span className="value" style={{ color: vibeTheme.colors.success }}>
                      {Math.round(planningInsights.estimatedSuccessRate)}%
                    </span>
                  </InfoRow>
                  <InfoRow>
                    <span className="label">Memory-Backed:</span>
                    <span className="value">
                      {planningInsights.memoryBackedSteps} / {currentTask?.steps.length || 0} steps
                    </span>
                  </InfoRow>
                  <InfoRow>
                    <span className="label">Fallbacks:</span>
                    <span className="value">
                      {planningInsights.fallbacksGenerated} plan{planningInsights.fallbacksGenerated !== 1 ? 's' : ''}
                    </span>
                  </InfoRow>
                  {planningInsights.highRiskSteps > 0 && (
                    <InfoRow>
                      <span className="label">High Risk:</span>
                      <span className="value" style={{ color: vibeTheme.colors.error }}>
                        {planningInsights.highRiskSteps} step{planningInsights.highRiskSteps !== 1 ? 's' : ''}
                      </span>
                    </InfoRow>
                  )}
                </SidePanelSection>
              )}

              {reasoning && (
                <SidePanelSection>
                  <SectionTitle>
                    <Activity />
                    AI Reasoning
                  </SectionTitle>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: vibeTheme.colors.text }}>
                    {reasoning}
                  </div>
                </SidePanelSection>
              )}

              {warnings.length > 0 && (
                <SidePanelSection>
                  <SectionTitle>
                    <AlertTriangle />
                    Warnings
                  </SectionTitle>
                  <WarningList>
                    {warnings.map((warning, index) => (
                      <WarningItem key={index}>{warning}</WarningItem>
                    ))}
                  </WarningList>
                </SidePanelSection>
              )}

              {currentTask && (
                <SidePanelSection>
                  <SectionTitle>
                    <Clock />
                    Task Info
                  </SectionTitle>
                  <InfoRow>
                    <span className="label">Task ID:</span>
                    <span className="value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {currentTask.id}
                    </span>
                  </InfoRow>
                  <InfoRow>
                    <span className="label">Total Steps:</span>
                    <span className="value">{currentTask.steps.length}</span>
                  </InfoRow>
                  {estimatedTime && (
                    <InfoRow>
                      <span className="label">Est. Time:</span>
                      <span className="value">{estimatedTime}</span>
                    </InfoRow>
                  )}
                  {currentTask.createdAt && (
                    <InfoRow>
                      <span className="label">Created:</span>
                      <span className="value">{currentTask.createdAt.toLocaleTimeString()}</span>
                    </InfoRow>
                  )}
                </SidePanelSection>
              )}
            </SidePanel>
          </Container>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

export default AgentModeV2;
