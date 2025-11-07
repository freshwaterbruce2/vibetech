import { AIMessage } from '../../types';

/**
 * Manages conversation history and context for AI interactions
 */
export class ConversationManager {
  private history: AIMessage[] = [];
  private maxHistoryLength: number;

  constructor(maxHistoryLength: number = 20) {
    this.maxHistoryLength = maxHistoryLength;
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
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }
  }

  getConversationContext(): AIMessage[] {
    return this.getHistory();
  }

  setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
    this.trimHistory();
  }
}
