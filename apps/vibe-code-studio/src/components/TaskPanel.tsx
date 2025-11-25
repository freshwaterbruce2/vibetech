/**
 * Task Panel Component for Vibe Code Studio
 * Shows current task, insights, and predictions
 */

import React, { useState, useEffect } from 'react';
import { taskIntelligenceService, Task, TaskInsights } from '../services/TaskIntelligenceService';

interface TaskPanelProps {
    onClose?: () => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ onClose }) => {
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [insights, setInsights] = useState<TaskInsights | null>(null);
    const [activeTasks, setActiveTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiAvailable, setApiAvailable] = useState(false);

    useEffect(() => {
        checkApiAvailability();
        refreshTasks();

        // Refresh every 30 seconds
        const interval = setInterval(refreshTasks, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkApiAvailability = async () => {
        const available = await taskIntelligenceService.isAvailable();
        setApiAvailable(available);
    };

    const refreshTasks = async () => {
        setLoading(true);
        const tasks = await taskIntelligenceService.getActiveTasks('vibe');
        setActiveTasks(tasks);

        const current = taskIntelligenceService.getCurrentTask();
        setCurrentTask(current);

        if (current) {
            const taskInsights = await taskIntelligenceService.getTaskInsights(
                current.task_id,
                current.task_type
            );
            setInsights(taskInsights);
        }

        setLoading(false);
    };

    if (!apiAvailable) {
        return (
            <div className= "task-panel task-panel-unavailable" >
            <h3>📋 Task Intelligence </h3>
                < p className = "status-message" >
                    Task Intelligence API not available
                        </p>
                        < button onClick = { checkApiAvailability } className = "btn-refresh" >
                            Retry Connection
                                </button>
                                </div>
        );
    }

return (
    <div className= "task-panel" >
    <div className="task-panel-header" >
        <h3>📋 Task Intelligence </h3>
            < div style = {{ display: 'flex', gap: '8px' }}>
                <button
                        onClick={ refreshTasks }
className = "btn-refresh"
disabled = { loading }
title = "Refresh"
    >
    { loading? '⏳': '🔄' }
    </button>
{
    onClose && (
        <button
                            onClick={ onClose }
    className = "btn-refresh"
    title = "Close"
        >
                            ❌
    </button>
                    )
}
</div>
    </div>

{
    currentTask ? (
        <div className= "current-task" >
        <div className="task-header" >
            <h4>Current Task </h4>
                < span className = {`task-type-badge ${currentTask.task_type}`
}>
    { currentTask.task_type }
    </span>
    </div>

    < div className = "task-info" >
        <p><strong>ID: </strong> {currentTask.task_id}</p >
            <p><strong>Status: </strong> {currentTask.status}</p >

                { insights?.completion_prediction && (
                    <div className="prediction" >
                        <strong>⏱️ Estimated Time: </strong>
                            < p className = "prediction-value" >
                                { insights.completion_prediction.predicted_hours.toFixed(1) } hours
                                    < span className = "confidence" >
                                        ({ Math.round(insights.completion_prediction.confidence * 100) } % confident)
                                        </span>
                                        </p>
                                        < p className = "prediction-message" >
                                            { insights.completion_prediction.message }
                                            </p>
                                            </div>
                        )}

{
    insights && (
        <>
        {
            insights.related_mistakes.length > 0 && (
                <div className="insights-section">
                    <strong>⚠️ Related Mistakes: </strong>
                        < p > { insights.related_mistakes.length } mistakes to avoid</ p >
        </div>
    )
}

{
    insights.related_knowledge.length > 0 && (
        <div className="insights-section" >
            <strong>💡 Related Knowledge: </strong>
                < p > { insights.related_knowledge.length } helpful insights </p>
                    </div>
                                )
}

{
    insights.recommendations.length > 0 && (
        <div className="insights-section" >
            <strong>✨ Recommendations: </strong>
                < ul className = "recommendations-list" >
                {
                    insights.recommendations.map((rec, idx) => (
                        <li key= { idx } > { rec } </li>
                    ))
                }
                    </ul>
                    </div>
                                )
}
</>
                        )}
</div>

    < button
onClick = {() => taskIntelligenceService.stopTask(currentTask.task_id)}
className = "btn-stop-task"
    >
    Stop Task
        </button>
        </div>
            ) : (
    <div className= "no-current-task" >
    <p>No active task in Vibe Code Studio </p>
{
    activeTasks.length > 0 && (
        <div className="other-tasks" >
            <h4>Active in other apps: </h4>
                <ul>
    {
        activeTasks.map(task => (
            <li key= { task.task_id } >
            <span className={`task-type-badge ${task.task_type}`}>
                { task.task_type }
                </span>
    { task.task_id }
    <span className="app-badge" > { task.app_source } </span>
        </li>
                                ))
}
</ul>
    </div>
                    )}
</div>
            )}

<style jsx > {`
                .task-panel {
                    padding: 16px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .task-panel-unavailable {
                    text-align: center;
                    padding: 32px 16px;
                }

                .task-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .task-panel-header h3 {
                    margin: 0;
                    font-size: 16px;
                }

                .btn-refresh {
                    background: transparent;
                    border: 1px solid var(--vscode-button-border);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .btn-refresh:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .current-task {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 12px;
                }

                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .task-header h4 {
                    margin: 0;
                    font-size: 14px;
                }

                .task-type-badge {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .task-type-badge.ml {
                    background: #4CAF50;
                    color: white;
                }

                .task-type-badge.web {
                    background: #2196F3;
                    color: white;
                }

                .task-type-badge.trading {
                    background: #FF9800;
                    color: white;
                }

                .task-type-badge.generic {
                    background: #9E9E9E;
                    color: white;
                }

                .task-info p {
                    margin: 4px 0;
                    font-size: 13px;
                }

                .prediction {
                    margin: 12px 0;
                    padding: 8px;
                    background: var(--vscode-textCodeBlock-background);
                    border-radius: 4px;
                }

                .prediction-value {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 4px 0;
                }

                .confidence {
                    font-size: 11px;
                    opacity: 0.7;
                    margin-left: 8px;
                }

                .prediction-message {
                    font-size: 12px;
                    opacity: 0.8;
                    margin: 4px 0 0 0;
                }

                .insights-section {
                    margin: 12px 0;
                    padding: 8px;
                    background: var(--vscode-textCodeBlock-background);
                    border-radius: 4px;
                }

                .insights-section strong {
                    display: block;
                    margin-bottom: 4px;
                }

                .recommendations-list {
                    margin: 8px 0 0 0;
                    padding-left: 20px;
                }

                .recommendations-list li {
                    font-size: 12px;
                    margin: 4px 0;
                }

                .btn-stop-task {
                    width: 100%;
                    padding: 8px;
                    margin-top: 12px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .btn-stop-task:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .no-current-task {
                    text-align: center;
                    padding: 32px 16px;
                    opacity: 0.7;
                }

                .other-tasks {
                    margin-top: 16px;
                    text-align: left;
                }

                .other-tasks h4 {
                    font-size: 13px;
                    margin-bottom: 8px;
                }

                .other-tasks ul {
                    list-style: none;
                    padding: 0;
                }

                .other-tasks li {
                    padding: 8px;
                    margin: 4px 0;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }

                .app-badge {
                    margin-left: auto;
                    padding: 2px 6px;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    border-radius: 8px;
                    font-size: 10px;
                }
            `}</style>
    </div>
    );
};
