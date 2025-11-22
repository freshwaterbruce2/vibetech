/**
 * Model Selector Service
 *
 * Intelligent model selection based on task type (Cursor-style)
 * - Chat/Completion: Fast, cost-effective (deepseek-chat)
 * - Agent/Reasoning: Chain-of-thought, multi-step (deepseek-reasoner)
 */

export type TaskMode = 'chat' | 'completion' | 'agent' | 'reasoning' | 'code-review' | 'debug';

export class ModelSelector {
  /**
   * Select optimal model for the given task mode
   *
   * @param mode - The type of task being performed
   * @returns Optimal model ID for the task
   */
  selectForMode(mode: TaskMode): string {
    switch (mode) {
      case 'chat':
      case 'completion':
        // Fast, general-purpose interactions
        return 'deepseek-chat';

      case 'agent':
      case 'reasoning':
      case 'code-review':
      case 'debug':
        // Complex multi-step tasks requiring chain-of-thought
        return 'deepseek-reasoner';

      default:
        return 'deepseek-chat';
    }
  }

  /**
   * Get model capabilities description
   */
  getModelDescription(modelId: string): string {
    switch (modelId) {
      case 'deepseek-chat':
        return 'Fast general-purpose model (V3.2-Exp non-thinking mode)';
      case 'deepseek-reasoner':
        return 'Reasoning model with chain-of-thought (V3.2-Exp thinking mode)';
      default:
        return 'Unknown model';
    }
  }

  /**
   * Check if model is suitable for agentic tasks
   */
  isAgenticModel(modelId: string): boolean {
    return modelId === 'deepseek-reasoner';
  }

  /**
   * Get recommended model for a task description
   */
  recommendModel(taskDescription: string): string {
    const lowerDesc = taskDescription.toLowerCase();

    // Keywords indicating complex reasoning needed
    const reasoningKeywords = [
      'agent', 'multi-step', 'complex', 'debug', 'analyze',
      'refactor', 'review', 'plan', 'architecture', 'fix bug'
    ];

    const needsReasoning = reasoningKeywords.some(keyword =>
      lowerDesc.includes(keyword)
    );

    return needsReasoning ? 'deepseek-reasoner' : 'deepseek-chat';
  }
}

// Singleton instance
export const modelSelector = new ModelSelector();
