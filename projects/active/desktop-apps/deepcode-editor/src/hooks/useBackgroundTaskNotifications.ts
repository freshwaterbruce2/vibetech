/**
 * Hook for showing notifications for background task events
 */

import { useEffect } from 'react';
import { BackgroundAgentSystem, BackgroundTask } from '../services/BackgroundAgentSystem';

interface UseBackgroundTaskNotificationsProps {
  backgroundAgentSystem: BackgroundAgentSystem;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

export const useBackgroundTaskNotifications = ({
  backgroundAgentSystem,
  showSuccess,
  showError,
  showWarning,
}: UseBackgroundTaskNotificationsProps) => {
  useEffect(() => {
    const handleCompleted = (task: BackgroundTask) => {
      const duration = task.endTime && task.startTime
        ? Math.round((task.endTime - task.startTime) / 1000)
        : 0;

      showSuccess(
        'Task Completed',
        `${task.userRequest} (${duration}s)`
      );
    };

    const handleFailed = (task: BackgroundTask) => {
      showError(
        'Task Failed',
        task.error?.message || 'Unknown error occurred'
      );
    };

    const handleCancelled = (task: BackgroundTask) => {
      showWarning(
        'Task Cancelled',
        task.userRequest
      );
    };

    // Subscribe to events
    backgroundAgentSystem.on('completed', handleCompleted);
    backgroundAgentSystem.on('failed', handleFailed);
    backgroundAgentSystem.on('cancelled', handleCancelled);

    // Cleanup
    return () => {
      backgroundAgentSystem.off('completed', handleCompleted);
      backgroundAgentSystem.off('failed', handleFailed);
      backgroundAgentSystem.off('cancelled', handleCancelled);
    };
  }, [backgroundAgentSystem, showSuccess, showError, showWarning]);
};
