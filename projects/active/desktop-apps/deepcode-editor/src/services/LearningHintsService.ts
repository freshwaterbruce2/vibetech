type LearningCommand = 'error_prevention' | 'performance_optimize' | 'pattern_recognition' | 'batch_optimize';

export interface LearningHintResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  durationMs?: number;
}

export const LearningHintsService = {
  async run(command: LearningCommand, payload: Record<string, unknown> = {}, options?: { timeoutMs?: number; pythonPath?: string; moduleOverride?: string }): Promise<LearningHintResult> {
    if (!window.electron?.learning?.run) {
      return { success: false, error: 'Learning adapter not available' };
    }
    try {
      const res = await window.electron.learning.run(command, payload, options);
      return res;
    } catch (e: any) {
      return { success: false, error: e?.toString?.() || 'Unknown error' };
    }
  },
};
