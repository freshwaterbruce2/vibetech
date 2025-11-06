import { AIMessage } from '../../types';

/**
 * Manages conversation history and context for AI interactions
 */
export class ConversationManager {
  private history: AIMessage[] = [];
  private maxHistoryLength: number;
  private maxTokens: number; // DeepSeek limit: 131,072 tokens
  private readonly TOKEN_SAFETY_MARGIN = 0.6; // Use only 60% of limit for context

  constructor(maxHistoryLength: number = 20, maxTokens: number = 78643) {
    // maxTokens = 131072 * 0.6 = 78,643 (leaves room for completion)
    this.maxHistoryLength = maxHistoryLength;
    this.maxTokens = maxTokens;
  }

  /**
   * Estimate token count (rough: ~4 chars = 1 token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate total tokens in history
   */
  private getTotalTokens(): number {
    return this.history.reduce((total, msg) => {
      return total + this.estimateTokens(msg.content);
    }, 0);
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.history.push({
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    });
    this.trimHistory();
  }

  addUserMessage(content: string): void {
    this.addMessage('user', content);
  }

  addAssistantMessage(content: string): void {
    this.addMessage('assistant', content);
  }

  getHistory(): AIMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  private trimHistory(): void {
    // First trim by message count
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }

    // Then trim by token count
    let totalTokens = this.getTotalTokens();
    while (totalTokens > this.maxTokens && this.history.length > 1) {
      // Remove oldest message (but keep at least 1)
      this.history.shift();
      totalTokens = this.getTotalTokens();
    }

    // If single message exceeds limit, truncate it
    if (totalTokens > this.maxTokens && this.history.length === 1) {
      const msg = this.history[0];
      const maxChars = this.maxTokens * 4; // ~4 chars per token
      msg.content = msg.content.slice(-maxChars) + '\n\n[Earlier content truncated due to length]';
    }
  }

  getConversationContext(): AIMessage[] {
    return this.getHistory();
  }

  setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
    this.trimHistory();
  }

  setMaxTokens(tokens: number): void {
    this.maxTokens = tokens;
    this.trimHistory();
  }

  /**
   * Get conversation stats for debugging
   */
  getStats(): { messageCount: number; totalTokens: number; maxTokens: number } {
    return {
      messageCount: this.history.length,
      totalTokens: this.getTotalTokens(),
      maxTokens: this.maxTokens
    };
  }
}
