/**
 * TaskControlsView Component
 * Renders the footer with task control buttons
 */
import React from 'react';
import { ChevronRight, Pause, Play, Square, Zap } from 'lucide-react';

import type { BackgroundAgentSystem } from '../../../services/BackgroundAgentSystem';
import type { AgentTask } from '../../../types';
import { Button, CheckboxLabel } from './styled';

interface TaskControlsViewProps {
    currentTask: AgentTask | null;
    userRequest: string;
    runInBackground: boolean;
    isPaused: boolean;
    backgroundAgentSystem?: BackgroundAgentSystem;
    onPlanTask: () => void;
    onExecuteTask: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onNewTask: () => void;
    onClose: () => void;
    onRunInBackgroundChange: (checked: boolean) => void;
}

export const TaskControlsView: React.FC<TaskControlsViewProps> = ({
    currentTask,
    userRequest,
    runInBackground,
    isPaused,
    backgroundAgentSystem,
    onPlanTask,
    onExecuteTask,
    onPause,
    onResume,
    onStop,
    onNewTask,
    onClose,
    onRunInBackgroundChange,
}) => {
    return (
        <>
        <div style= {{ display: 'flex', gap: '12px' }
}>
    {/* Plan Task Button */ }
{
    !currentTask && (
        <Button
            $variant="primary"
    onClick = { onPlanTask }
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
    onChange = {(e) => onRunInBackgroundChange(e.target.checked)
}
                />
Run in Background
    </CheckboxLabel>
            )}
<Button
              $variant="primary"
onClick = { onExecuteTask }
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
                onClick={ onPause }
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
    onClick = { onResume }
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
onClick = { onStop }
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
    onClick = { onNewTask }
    whileHover = {{ scale: 1.02 }
}
whileTap = {{ scale: 0.98 }}
          >
    <ChevronRight />
            New Task
    </Button>
        )}
</div>

{/* Close Button */ }
<Button
        onClick={ onClose }
whileHover = {{ scale: 1.02 }}
whileTap = {{ scale: 0.98 }}
      >
    Close
    </Button>
    </>
  );
};
