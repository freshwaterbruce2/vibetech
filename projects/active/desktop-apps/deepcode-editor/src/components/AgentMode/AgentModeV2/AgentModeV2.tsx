/**
 * Agent Mode V2 - Real autonomous coding with AI-powered task planning and execution
 * Implements 2025 best practices for agentic AI workflows
 * 
 * This is the main facade component that orchestrates the modular sub-components.
 */
import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

import type { ExecutionEngine } from '../../../services/ai/ExecutionEngine';
import type { TaskPlanner } from '../../../services/ai/TaskPlanner';
import type { BackgroundAgentSystem } from '../../../services/BackgroundAgentSystem';
import type { AgentTask } from '../../../types';
import { SidePanelView } from './SidePanelView';
import { getStatusIcon } from './StatusIcons';
import { StepCardView } from './StepCardView';
import {
    Backdrop,
    Button,
    CheckboxLabel,
    Container,
    Footer,
    Header,
    MainPanel,
    ProgressText,
    StatusBadge,
    StatusBar,
    StepsContainer,
    Subtitle,
    TaskInputSection,
    TaskTextarea,
    Title,
} from './styled';
import type { WorkspaceContext } from './types';
import { useAgentModeState } from './useAgentModeState';

// Icons for controls
import { ChevronRight, Pause, Play, Square } from 'lucide-react';

interface AgentModeV2Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (task: AgentTask) => void;
    taskPlanner: TaskPlanner;
    executionEngine: ExecutionEngine;
    backgroundAgentSystem?: BackgroundAgentSystem;
    showSuccess?: (title: string, message?: string) => void;
    showError?: (title: string, message?: string) => void;
    workspaceContext?: WorkspaceContext;
}

export const AgentModeV2: React.FC<AgentModeV2Props> = ({
    isOpen,
    onClose,
    onComplete,
    taskPlanner,
    executionEngine,
    backgroundAgentSystem,
    showSuccess,
    showError,
    workspaceContext,
}) => {
    const {
        state,
        stepsEndRef,
        setUserRequest,
        setRunInBackground,
        handlePlanTask,
        handleExecuteTask,
        handleApprove,
        handleReject,
        handlePause,
        handleResume,
        handleStop,
        handleNewTask,
        isPaused,
    } = useAgentModeState({
        taskPlanner,
        executionEngine,
        backgroundAgentSystem,
        workspaceContext,
        onComplete,
        onClose,
        showSuccess,
        showError,
    });

    const {
        userRequest,
        currentTask,
        pendingApproval,
        completedSteps,
        skippedSteps,
        estimatedTime,
        warnings,
        reasoning,
        planningInsights,
        runInBackground,
    } = state;

    // Auto-scroll to latest step
    useEffect(() => {
        stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentTask?.steps, stepsEndRef]);

    return (
        <AnimatePresence>
        { isOpen && (
            <Backdrop
          initial= {{ opacity: 0 }
}
animate = {{ opacity: 1 }}
exit = {{ opacity: 0 }}
onClick = {(e) => e.target === e.currentTarget && onClose()}
        >
    <Container
            initial={ { opacity: 0, scale: 0.92, y: 40 } }
animate = {{ opacity: 1, scale: 1, y: 0 }}
exit = {{ opacity: 0, scale: 0.92, y: 40 }}
transition = {{ type: 'spring', damping: 30, stiffness: 300 }}
onClick = {(e) => e.stopPropagation()}
          >
    <MainPanel>
    {/* Header */ }
    < Header >
    <Title>
    <Zap />
                  Agent Mode V2
    </Title>
    <Subtitle>
AI - powered autonomous task planning and execution with human approval checkpoints
    </Subtitle>
    </Header>

{/* Task Input */ }
<TaskInputSection>
    <TaskTextarea
                  value={ userRequest }
onChange = {(e) => setUserRequest(e.target.value)}
placeholder = "Describe what you want me to build, fix, or improve... (e.g., 'Create a new React component for user authentication')"
disabled = { currentTask?.status === 'in_progress'}
                />
    </TaskInputSection>

{/* Status Bar & Steps */ }
{
    currentTask && (
        <>
        <StatusBar $status={ currentTask.status }>
            <StatusBadge $status={ currentTask.status }>
                { getStatusIcon(currentTask.status) }
    { currentTask.status.charAt(0).toUpperCase() + currentTask.status.slice(1).replace('_', ' ') }
    </StatusBadge>
        <ProgressText>
    { completedSteps } completed
    { skippedSteps > 0 && `, ${skippedSteps} skipped` }
    { ' / ' } { currentTask.steps.length } total
    { estimatedTime && ` • Est. ${estimatedTime}` }
    </ProgressText>
        </StatusBar>

        <StepsContainer>
    {
        currentTask.steps.map((step, index) => (
            <StepCardView
                        key= { step.id }
                        step = { step }
                        index = { index }
                        pendingApproval = { pendingApproval }
                        onApprove = { handleApprove }
                        onReject = { handleReject }
            />
                    ))
    }
    <div ref={ stepsEndRef } />
        </StepsContainer>
        </>
              )
}

{/* Footer with Controls */ }
<Footer>
    <div style={ { display: 'flex', gap: '12px' } }>
        {/* Plan Task Button */ }
{
    !currentTask && (
        <Button
                      $variant="primary"
    onClick = { handlePlanTask }
    disabled = {!userRequest.trim()
}
whileHover = {{ scale: 1.02 }}
whileTap = {{ scale: 0.98 }}
                    >
    <Zap />
                      Plan Task
    </Button>
                  )}

{/* Execute Task Button */ }
{
    currentTask && currentTask.status === 'awaiting_approval' && (
        <>
        { backgroundAgentSystem && (
            <CheckboxLabel>
            <input
                            type="checkbox"
    checked = { runInBackground }
    onChange = {(e) => setRunInBackground(e.target.checked)
}
                          />
Run in Background
    </CheckboxLabel>
                      )}
<Button
                        $variant="primary"
onClick = { handleExecuteTask }
whileHover = {{ scale: 1.02 }}
whileTap = {{ scale: 0.98 }}
                      >
    <Play />
{ runInBackground ? 'Start in Background' : 'Execute Task' }
</Button>
    </>
                  )}

{/* In-Progress Controls */ }
{
    currentTask && currentTask.status === 'in_progress' && (
        <>
        {!isPaused && (
            <Button
                          onClick={ handlePause }
    whileHover = {{ scale: 1.02 }
}
whileTap = {{ scale: 0.98 }}
                        >
    <Pause />
Pause
    </Button>
                      )}
{
    isPaused && (
        <Button
                          $variant="primary"
    onClick = { handleResume }
    whileHover = {{ scale: 1.02 }
}
whileTap = {{ scale: 0.98 }}
                        >
    <Play />
Resume
    </Button>
                      )}
<Button
                        $variant="danger"
onClick = { handleStop }
whileHover = {{ scale: 1.02 }}
whileTap = {{ scale: 0.98 }}
                      >
    <Square />
Stop
    </Button>
    </>
                  )}

{/* Completed/Failed - New Task Button */ }
{
    currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed') && (
        <Button
                      $variant="primary"
    onClick = { handleNewTask }
    whileHover = {{ scale: 1.02 }
}
whileTap = {{ scale: 0.98 }}
                    >
    <ChevronRight />
                      New Task
    </Button>
                  )}
</div>

    < Button
onClick = { onClose }
whileHover = {{ scale: 1.02 }}
whileTap = {{ scale: 0.98 }}
                >
    Close
    </Button>
    </Footer>
    </MainPanel>

{/* Side Panel */ }
<SidePanelView
              workspaceContext={ workspaceContext }
planningInsights = { planningInsights }
reasoning = { reasoning }
warnings = { warnings }
currentTask = { currentTask }
estimatedTime = { estimatedTime }
    />
    </Container>
    </Backdrop>
      )}
</AnimatePresence>
  );
};

export default AgentModeV2;
