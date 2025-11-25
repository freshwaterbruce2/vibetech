import type {
  AIProvider,
  PlanResponse,
  NextActionsResponse,
  WeeklySummaryResponse,
} from './provider';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export class DeepSeekProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async call(model: string, system: string, user: string): Promise<string> {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    return content as string;
  }

  async planDay(
    input: Parameters<AIProvider['planDay']>[0]
  ): Promise<PlanResponse> {
    const system = `You are a deterministic planning engine. Output ONLY JSON matching the schema.
    Prefer earlier due dates and higher priorities. Use 30-120 minute blocks and respect work hours.`;

    const schema = `Schema:
{
  "schedule": [ { "taskId": "string", "start": "HH:MM", "end": "HH:MM", "reason": "string" } ],
  "summary": "string",
  "risks": ["string"]
}`;

    const user = `Current time: ${input.now}
Work hours: ${input.workHours.start}-${input.workHours.end}
Tasks: ${JSON.stringify(input.tasks)}
${schema}`;

    const raw = await this.call('deepseek-chat', system, user);
    return JSON.parse(raw) as PlanResponse;
  }

  async nextActions(
    input: Parameters<AIProvider['nextActions']>[0]
  ): Promise<NextActionsResponse> {
    const system = `Provide the top 3 concrete next actions for the task.
    Output JSON with actions (array of strings) and rationale (string).`;

    const user = `Task: ${JSON.stringify(input.task)}
Schema: { "actions": ["string"], "rationale": "string" }`;

    const raw = await this.call('deepseek-chat', system, user);
    return JSON.parse(raw) as NextActionsResponse;
  }

  async summarizeWeek(
    input: Parameters<AIProvider['summarizeWeek']>[0]
  ): Promise<WeeklySummaryResponse> {
    const system = `Summarize weekly performance.
    Output JSON with summary (string) and recommendations (array of strings).`;

    const user = `Metrics: ${JSON.stringify(input.metrics)}
Schema: { "summary": "string", "recommendations": ["string"] }`;

    const raw = await this.call('deepseek-chat', system, user);
    return JSON.parse(raw) as WeeklySummaryResponse;
  }
}