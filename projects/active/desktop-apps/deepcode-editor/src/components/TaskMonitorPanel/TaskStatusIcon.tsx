/**
 * TaskStatusIcon Component
 * Displays status icon for tasks based on their current state
 */
import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader,
  Pause,
  X,
} from 'lucide-react';

import { TaskStatus } from '@vibetech/types/tasks';

interface TaskStatusIconProps {
  status: TaskStatus;
}

export const TaskStatusIcon: React.FC<TaskStatusIconProps> = ({ status }) => {
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
