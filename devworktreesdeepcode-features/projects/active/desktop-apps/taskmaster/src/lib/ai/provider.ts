export type PlanItem = {
  taskId: string;
  start: string;
  end: string;
  reason: string;
};

export type PlanResponse = {
  schedule: PlanItem[];
  summary: string;
  risks: string[];
};

export type NextActionsResponse = {
  actions: string[];
  rationale: string;
};

export type WeeklySummaryResponse = {
  summary: string;
  recommendations: string[];
};

export interface AIProvider {
  planDay(input: {
    now: string;
    workHours: { start: string; end: string };
    tasks: Array<{
      id: string;
      title: string;
      priority: number;
      due?: string;
      est?: number;
    }>;
    includeDescriptions?: boolean;
  }): Promise<PlanResponse>;

  nextActions(input: {
    task: {
      id: string;
      title: string;
      description?: string;
    };
  }): Promise<NextActionsResponse>;

  summarizeWeek(input: {
    metrics: Record<string, unknown>;
  }): Promise<WeeklySummaryResponse>;
}