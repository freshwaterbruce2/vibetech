/**
 * Tests for useAIStore - AI chat and completion state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIStore } from '../../stores/useAIStore';
import { AIMessage } from '../../types';

describe('useAIStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAIStore());
    act(() => {
      result.current.actions.clearMessages();
    });
  });

  describe('message management', () => {
    it('should add a message', () => {
      const { result } = renderHook(() => useAIStore());

      const message: AIMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Hello AI',
        timestamp: new Date(),
      };

      act(() => {
        result.current.actions.addMessage(message);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Hello AI');
    });

    it('should auto-generate message ID if not provided', () => {
      const { result } = renderHook(() => useAIStore());

      const message: Partial<AIMessage> = {
        role: 'assistant',
        content: 'Response',
      };

      act(() => {
        result.current.actions.addMessage(message as AIMessage);
      });

      expect(result.current.messages[0].id).toBeTruthy();
    });

    it('should clear all messages', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.addMessage({
          role: 'user',
          content: 'Message 1',
        } as AIMessage);
        result.current.actions.addMessage({
          role: 'assistant',
          content: 'Message 2',
        } as AIMessage);
      });

      expect(result.current.messages.length).toBeGreaterThan(0);

      act(() => {
        result.current.actions.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should update a message', () => {
      const { result } = renderHook(() => useAIStore());

      const message: AIMessage = {
        id: 'msg1',
        role: 'assistant',
        content: 'Original content',
        timestamp: new Date(),
      };

      act(() => {
        result.current.actions.addMessage(message);
        result.current.actions.updateMessage('msg1', { content: 'Updated content' });
      });

      expect(result.current.messages[0].content).toBe('Updated content');
    });
  });

  describe('model selection', () => {
    it('should set current model', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.setModel('claude-sonnet-4-5');
      });

      expect(result.current.currentModel).toBe('claude-sonnet-4-5');
    });

    it('should enable reasoning for supported models', () => {
      const { result } = renderHook(() => useAIStore());

      const reasoningModels = ['gpt-5', 'claude-sonnet-4-5', 'gemini-2-5-pro'];

      reasoningModels.forEach(model => {
        act(() => {
          result.current.actions.setModel(model as any);
        });

        expect(result.current.showReasoningProcess).toBe(true);
      });
    });

    it('should toggle reasoning process', () => {
      const { result } = renderHook(() => useAIStore());

      const initial = result.current.showReasoningProcess;

      act(() => {
        result.current.actions.toggleReasoningProcess();
      });

      expect(result.current.showReasoningProcess).toBe(!initial);
    });
  });

  describe('responding state', () => {
    it('should set responding state', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.setResponding(true);
      });

      expect(result.current.isResponding).toBe(true);

      act(() => {
        result.current.actions.setResponding(false);
      });

      expect(result.current.isResponding).toBe(false);
    });
  });

  describe('completion settings', () => {
    it('should enable/disable completion', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.setCompletionEnabled(false);
      });

      expect(result.current.completionEnabled).toBe(false);

      act(() => {
        result.current.actions.setCompletionEnabled(true);
      });

      expect(result.current.completionEnabled).toBe(true);
    });

    it('should set last completion', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.setLastCompletion('const x = ');
      });

      expect(result.current.lastCompletion).toBe('const x = ');
    });
  });

  describe('context management', () => {
    it('should update context', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.updateContext({
          files: ['/test.ts', '/app.tsx'],
          symbols: ['useState', 'useEffect'],
        });
      });

      expect(result.current.activeContext.files).toEqual(['/test.ts', '/app.tsx']);
      expect(result.current.activeContext.symbols).toEqual(['useState', 'useEffect']);
    });

    it('should clear context', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.updateContext({
          files: ['/test.ts'],
          symbols: ['useState'],
          imports: ['react'],
        });
        result.current.actions.clearContext();
      });

      expect(result.current.activeContext.files).toEqual([]);
      expect(result.current.activeContext.symbols).toEqual([]);
      expect(result.current.activeContext.imports).toEqual([]);
    });
  });

  describe('conversation history', () => {
    it('should save conversation', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.addMessage({
          role: 'user',
          content: 'Test message',
        } as AIMessage);
        result.current.actions.saveConversation('Test Conversation');
      });

      expect(result.current.conversationHistory).toHaveLength(1);
      expect(result.current.conversationHistory[0].title).toBe('Test Conversation');
    });

    it('should auto-generate conversation title if not provided', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.addMessage({
          role: 'user',
          content: 'Message',
        } as AIMessage);
        result.current.actions.saveConversation();
      });

      expect(result.current.conversationHistory[0].title).toContain('Conversation');
    });

    it('should limit conversation history to 50', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.actions.addMessage({
            role: 'user',
            content: `Message ${i}`,
          } as AIMessage);
          result.current.actions.saveConversation(`Conv ${i}`);
          result.current.actions.clearMessages();
        }
      });

      expect(result.current.conversationHistory.length).toBeLessThanOrEqual(50);
    });

    it('should load conversation', () => {
      const { result } = renderHook(() => useAIStore());

      let conversationId: string;

      act(() => {
        result.current.actions.addMessage({
          role: 'user',
          content: 'Original message',
        } as AIMessage);
        result.current.actions.saveConversation('Original');
        conversationId = result.current.conversationHistory[0].id;
        result.current.actions.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);

      act(() => {
        result.current.actions.loadConversation(conversationId);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Original message');
    });

    it('should delete conversation', () => {
      const { result } = renderHook(() => useAIStore());

      let conversationId: string;

      act(() => {
        result.current.actions.addMessage({
          role: 'user',
          content: 'Test',
        } as AIMessage);
        result.current.actions.saveConversation('Test');
        conversationId = result.current.conversationHistory[0].id;
      });

      expect(result.current.conversationHistory).toHaveLength(1);

      act(() => {
        result.current.actions.deleteConversation(conversationId);
      });

      expect(result.current.conversationHistory).toHaveLength(0);
    });
  });

  describe('computed values', () => {
    it('should compute totalMessages', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.addMessage({ role: 'user', content: 'Msg 1' } as AIMessage);
        result.current.actions.addMessage({ role: 'assistant', content: 'Msg 2' } as AIMessage);
        result.current.actions.addMessage({ role: 'user', content: 'Msg 3' } as AIMessage);
      });

      expect(result.current.computed.totalMessages()).toBe(3);
    });

    it('should compute hasActiveConversation', () => {
      const { result } = renderHook(() => useAIStore());

      expect(result.current.computed.hasActiveConversation()).toBe(false);

      act(() => {
        result.current.actions.addMessage({ role: 'user', content: 'Hello' } as AIMessage);
      });

      expect(result.current.computed.hasActiveConversation()).toBe(true);
    });

    it('should compute currentConversationTokens', () => {
      const { result } = renderHook(() => useAIStore());

      act(() => {
        result.current.actions.addMessage({
          role: 'user',
          content: 'This is a test message with approximately twenty tokens',
        } as AIMessage);
      });

      const tokens = result.current.computed.currentConversationTokens();
      expect(tokens).toBeGreaterThan(0);
      // Rough estimate: ~4 chars per token
      expect(tokens).toBeGreaterThan(10);
    });
  });
});
