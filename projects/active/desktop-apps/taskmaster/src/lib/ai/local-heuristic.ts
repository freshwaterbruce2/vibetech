import type {
  AIProvider,
  PlanResponse,
  NextActionsResponse,
  WeeklySummaryResponse,
} from './provider';

export class LocalHeuristicProvider implements AIProvider {
  async planDay(
    input: Parameters<AIProvider['planDay']>[0]
  ): Promise<PlanResponse> {
    const { now, workHours, tasks } = input;

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const startMinutes = Math.max(
      timeToMinutes(now),
      timeToMinutes(workHours.start)
    );
    const endMinutes = timeToMinutes(workHours.end);

    const sorted = [...tasks].sort((a, b) => {
      const dueDateCompare = (a.due || '').localeCompare(b.due || '');
      if (dueDateCompare !== 0) return dueDateCompare;

      const priorityCompare = b.priority - a.priority;
      if (priorityCompare !== 0) return priorityCompare;

      return (a.est || 60) - (b.est || 60);
    });

    const schedule = [];
    let currentTime = startMinutes;

    for (const task of sorted) {
      const duration = Math.min(Math.max(task.est || 60, 30), 120);

      if (currentTime + duration > endMinutes) break;

      schedule.push({
        taskId: task.id,
        start: minutesToTime(currentTime),
        end: minutesToTime(currentTime + duration),
        reason: 'Due date/priority heuristic',
      });

      currentTime += duration;
    }

    return {
      schedule,
      summary: 'Heuristic plan generated offline.',
      risks: schedule.length < tasks.length
        ? ['Not all tasks could be scheduled within work hours.']
        : [],
    };
  }

  async nextActions(): Promise<NextActionsResponse> {
    return {
      actions: [
        'Define scope and requirements',
        'Prepare necessary resources',
        'Start with a 25-minute focused work block',
      ],
      rationale: 'Generic kickoff steps for task initiation.',
    };
  }

  async summarizeWeek(): Promise<WeeklySummaryResponse> {
    return {
      summary: 'Local summary unavailable. Enable AI for deeper insights.',
      recommendations: [
        'Review completed tasks for patterns',
        'Adjust estimates based on actual time spent',
        'Consider enabling AI for personalized recommendations',
      ],
    };
  }
}