/**
 * useAgentModeState Hook
 * Custom hook for managing Agent Mode V2 state and handlers
 */
import { useCallback, useRef, useState } from 'react';

import type { ExecutionCallbacks } from '../../../services/ai/ExecutionEngine';
import type { ExecutionEngine } from '../../../services/ai/ExecutionEngine';
import type { TaskPlanner } from '../../../services/ai/TaskPlanner';
import type { BackgroundAgentSystem } from '../../../services/BackgroundAgentSystem';
import { IpcBridge } from '../../../services/IpcBridge';
import { logger } from '../../../services/Logger';
import type { AgentTask, PlanningInsights } from '../../../types';
import type { AgentModeState, PendingApproval, WorkspaceContext } from './types';

interface UseAgentModeStateProps {
    taskPlanner: TaskPlanner;
    executionEngine: ExecutionEngine;
    backgroundAgentSystem?: BackgroundAgentSystem;
    workspaceContext?: WorkspaceContext;
    onComplete: (task: AgentTask) => void;
    onClose: () => void;
    showSuccess?: (title: string, message?: string) => void;
    showError?: (title: string, message?: string) => void;
}

export function useAgentModeState({
    taskPlanner,
    executionEngine,
    backgroundAgentSystem,
    workspaceContext,
    onComplete,
    onClose,
    showSuccess,
    showError,
}: UseAgentModeStateProps) {
    // State
    const [userRequest, setUserRequest] = useState('');
    const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
    const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
    const [completedSteps, setCompletedSteps] = useState(0);
    const [skippedSteps, setSkippedSteps] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState<string>('');
    const [warnings, setWarnings] = useState<string[]>([]);
    const [reasoning, setReasoning] = useState<string>('');
    const [planningInsights, setPlanningInsights] = useState<PlanningInsights | null>(null);
    const [runInBackground, setRunInBackground] = useState(false);

    // Refs
    const stepsEndRef = useRef<HTMLDivElement>(null);

    // Handlers
    const handlePlanTask = useCallback(async () => {
        if (!userRequest.trim()) return;

        try {
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
            setPlanningInsights(planResponse.insights);

            logger.debug('[AgentModeV2] 📊 Planning Insights:', planResponse.insights);
        } catch (error) {
            logger.error('Failed to plan task:', error);
            alert(`Failed to plan task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userRequest, taskPlanner, workspaceContext]);

    const handleExecuteTask = useCallback(async () => {
        if (!currentTask) return;

        // Track task start time for duration calculation
        const taskStartTime = Date.now();

        // Notify IPC bridge that task has started
        const taskContext: Record<string, unknown> = {
            userRequest,
            openFiles: workspaceContext?.openFiles ?? [],
        };
        if (workspaceContext?.workspaceRoot) {
            taskContext['workspaceRoot'] = workspaceContext.workspaceRoot;
        }
        if (workspaceContext?.currentFile) {
            taskContext['currentFile'] = workspaceContext.currentFile;
        }

        IpcBridge.sendTaskStarted(
            currentTask.id,
            (currentTask as { type?: string }).type ?? 'agent-task',
            currentTask.title ?? userRequest.slice(0, 50),
            taskContext as { workspaceRoot?: string; userRequest?: string; openFiles?: string[]; currentFile?: string }
        ).catch(err => logger.warn('[AgentModeV2] Failed to send task_started to IPC bridge:', err));

        // Helper to send task_stopped notification
        const notifyTaskStopped = (status: 'completed' | 'paused' | 'abandoned' | 'error', result?: { success: boolean; output?: string; error?: string }) => {
            const durationMinutes = Math.round((Date.now() - taskStartTime) / 60000);
            IpcBridge.sendTaskStopped(currentTask.id, status, durationMinutes, result)
                .catch(err => logger.warn('[AgentModeV2] Failed to send task_stopped to IPC bridge:', err));
        };

        // Background execution
        if (runInBackground && backgroundAgentSystem) {
            try {
                const taskId = backgroundAgentSystem.submit(
                    'agent-mode-v2',
                    userRequest,
                    workspaceContext?.workspaceRoot || '',
                    {
                        context: workspaceContext,
                        files: workspaceContext?.openFiles || []
                    },
                    { priority: 'normal' }
                );

                if (showSuccess) {
                    showSuccess(
                        'Task Started in Background',
                        `Task ID: ${taskId.slice(0, 8)}... - Check background panel for progress`
                    );
                }

                onClose();
                return;
            } catch (error) {
                logger.error('[AgentModeV2] Failed to submit background task:', error);
                if (showError) {
                    showError(
                        'Background Task Failed',
                        error instanceof Error ? error.message : 'Unknown error'
                    );
                }
                return;
            }
        }

        // Foreground execution
        const callbacks: ExecutionCallbacks = {
            onStepStart: (step) => {
                logger.debug('[AgentModeV2] Step started:', step.order, step.title);
                setCurrentTask(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        steps: prev.steps.map(s => s.id === step.id ? { ...s, status: 'in_progress' } : s),
                    };
                });
            },

            onStepComplete: (step, result) => {
                logger.debug('[AgentModeV2] Step completed:', step.order, step.title, 'Status:', step.status);

                if (step.status === 'skipped' || result.skipped) {
                    setSkippedSteps(prev => prev + 1);
                    logger.debug('[AgentModeV2] Step was skipped:', step.title, 'Reason:', result.message);
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
                logger.error('[AgentModeV2] Step error:', step.order, step.title, error);
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
                logger.debug('[AgentModeV2] 🎉 onTaskComplete received! Task status:', task.status);
                logger.debug('[AgentModeV2] Task has', task.steps.length, 'steps');

                // Notify IPC bridge that task completed
                notifyTaskStopped('completed', { success: true });

                setCurrentTask({ ...task, steps: [...task.steps] });

                logger.debug('[AgentModeV2] Task state updated. Will call onComplete in 1.5 seconds...');
                setTimeout(() => {
                    logger.debug('[AgentModeV2] Calling onComplete callback');
                    onComplete(task);
                }, 1500);
            },

            onTaskError: (task, error) => {
                // Notify IPC bridge that task failed
                notifyTaskStopped('error', { success: false, error: error.message });

                setCurrentTask(task);
                logger.error('Task execution failed:', error);
            },
        };

        try {
            const updatedTask = await executionEngine.executeTask(currentTask, callbacks);
            setCurrentTask(updatedTask);
        } catch (error) {
            logger.error('Execution engine error:', error);
        }
    }, [
        currentTask,
        runInBackground,
        backgroundAgentSystem,
        userRequest,
        workspaceContext,
        executionEngine,
        onComplete,
        onClose,
        showSuccess,
        showError,
        pendingApproval,
    ]);

    const handleApprove = useCallback(() => {
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
    }, [pendingApproval, currentTask]);

    const handleReject = useCallback(() => {
        if (!pendingApproval || !currentTask) return;

        // Notify IPC bridge that task was abandoned (user rejected step)
        IpcBridge.sendTaskStopped(currentTask.id, 'abandoned', undefined, {
            success: false,
            error: `User rejected step: ${pendingApproval.step.title}`,
        }).catch(err => logger.warn('[AgentModeV2] Failed to send task_stopped to IPC bridge:', err));

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
    }, [pendingApproval, currentTask]);

    const handlePause = useCallback(() => {
        // Notify IPC bridge that task was paused
        if (currentTask) {
            IpcBridge.sendTaskStopped(currentTask.id, 'paused')
                .catch(err => logger.warn('[AgentModeV2] Failed to send task_stopped to IPC bridge:', err));
        }
        executionEngine.pause();
    }, [executionEngine, currentTask]);

    const handleResume = useCallback(() => {
        // Notify IPC bridge that task resumed (re-send task_started)
        if (currentTask) {
            IpcBridge.sendTaskStarted(
                currentTask.id,
                (currentTask as { type?: string }).type ?? 'agent-task',
                currentTask.title ?? 'Resumed Task',
                { resumed: true }
            ).catch(err => logger.warn('[AgentModeV2] Failed to send task_started to IPC bridge:', err));
        }
        executionEngine.resume();
    }, [executionEngine, currentTask]);

    const handleStop = useCallback(() => {
        if (currentTask) {
            // Notify IPC bridge that task was stopped/cancelled
            IpcBridge.sendTaskStopped(currentTask.id, 'abandoned', undefined, {
                success: false,
                error: 'User cancelled task',
            }).catch(err => logger.warn('[AgentModeV2] Failed to send task_stopped to IPC bridge:', err));

            setCurrentTask(prev => prev ? { ...prev, status: 'cancelled' } : null);
        }
    }, [currentTask]);

    const handleNewTask = useCallback(() => {
        setCurrentTask(null);
        setUserRequest('');
        setCompletedSteps(0);
        setSkippedSteps(0);
        setWarnings([]);
        setReasoning('');
        setPlanningInsights(null);
    }, []);

    // State getter
    const state: AgentModeState = {
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
    };

    return {
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
        isPaused: executionEngine.isPausedState(),
    };
}
