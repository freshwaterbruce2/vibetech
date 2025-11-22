import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { AIMessage } from '../types';

/**
 * AI Store - Manages AI chat and completion state
 *
 * 2025 Pattern: Separate stores for different domains
 */

interface AIState {
  // Chat state
  messages: AIMessage[];
  isResponding: boolean;
  currentModel:
    // OpenAI GPT-5 (October 2025)
    | 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano'
    // Anthropic Claude 4 (October 2025)
    | 'claude-sonnet-4-5' | 'claude-opus-4-1'
    // Google Gemini 2.x (October 2025)
    | 'gemini-2-5-pro' | 'gemini-2-5-flash' | 'gemini-2-5-flash-lite' | 'gemini-2-0-flash'
    // DeepSeek V3.2 (October 2025) - Current API Models
    | 'deepseek-chat'
    | 'deepseek-reasoner';
  showReasoningProcess: boolean;

  // Completion state
  completionEnabled: boolean;
  completionDelay: number;
  lastCompletion: string | null;

  // Context
  activeContext: {
    files: string[];
    symbols: string[];
    imports: string[];
  };

  // History
  conversationHistory: Array<{
    id: string;
    title: string;
    messages: AIMessage[];
    timestamp: Date;
  }>;

  // Actions
  actions: {
    // Chat actions
    addMessage: (message: AIMessage) => void;
    clearMessages: () => void;
    setResponding: (isResponding: boolean) => void;
    updateMessage: (id: string, updates: Partial<AIMessage>) => void;

    // Model actions
    setModel: (model: AIState['currentModel']) => void;
    toggleReasoningProcess: () => void;

    // Completion actions
    setCompletionEnabled: (enabled: boolean) => void;
    setLastCompletion: (completion: string | null) => void;

    // Context actions
    updateContext: (context: Partial<AIState['activeContext']>) => void;
    clearContext: () => void;

    // History actions
    saveConversation: (title?: string) => void;
    loadConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
  };

  // Computed
  computed: {
    totalMessages: () => number;
    hasActiveConversation: () => boolean;
    currentConversationTokens: () => number;
  };
}

export const useAIStore = create<AIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        messages: [],
        isResponding: false,
        currentModel: 'deepseek-chat',
        showReasoningProcess: false,
        completionEnabled: true,
        completionDelay: 300,
        lastCompletion: null,
        activeContext: {
          files: [],
          symbols: [],
          imports: [],
        },
        conversationHistory: [],

        // Actions
        actions: {
          addMessage: (message) =>
            set((state) => {
              state.messages.push({
                ...message,
                id: message.id || Date.now().toString(),
                timestamp: message.timestamp || new Date(),
              });
            }),

          clearMessages: () =>
            set((state) => {
              state.messages = [];
            }),

          setResponding: (isResponding) =>
            set((state) => {
              state.isResponding = isResponding;
            }),

          updateMessage: (id, updates) =>
            set((state) => {
              const message = state.messages.find((m) => m.id === id);
              if (message) {
                Object.assign(message, updates);
              }
            }),

          setModel: (model) =>
            set((state) => {
              state.currentModel = model;
              // Auto-enable reasoning process for models with extended thinking
              const reasoningModels = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'claude-sonnet-4-5', 'claude-opus-4-1', 'gemini-2-5-pro'];
              if (reasoningModels.includes(model)) {
                state.showReasoningProcess = true;
              }
            }),

          toggleReasoningProcess: () =>
            set((state) => {
              state.showReasoningProcess = !state.showReasoningProcess;
            }),

          setCompletionEnabled: (enabled) =>
            set((state) => {
              state.completionEnabled = enabled;
            }),

          setLastCompletion: (completion) =>
            set((state) => {
              state.lastCompletion = completion;
            }),

          updateContext: (context) =>
            set((state) => {
              Object.assign(state.activeContext, context);
            }),

          clearContext: () =>
            set((state) => {
              state.activeContext = {
                files: [],
                symbols: [],
                imports: [],
              };
            }),

          saveConversation: (title) =>
            set((state) => {
              const conversation = {
                id: Date.now().toString(),
                title: title || `Conversation ${state.conversationHistory.length + 1}`,
                messages: [...state.messages],
                timestamp: new Date(),
              };
              state.conversationHistory.push(conversation);

              // Keep only last 50 conversations
              if (state.conversationHistory.length > 50) {
                state.conversationHistory = state.conversationHistory.slice(-50);
              }
            }),

          loadConversation: (id) =>
            set((state) => {
              const conversation = state.conversationHistory.find((c) => c.id === id);
              if (conversation) {
                state.messages = [...conversation.messages];
              }
            }),

          deleteConversation: (id) =>
            set((state) => {
              const index = state.conversationHistory.findIndex((c) => c.id === id);
              if (index > -1) {
                state.conversationHistory.splice(index, 1);
              }
            }),
        },

        // Computed
        computed: {
          totalMessages: () => get().messages.length,

          hasActiveConversation: () => get().messages.length > 0,

          currentConversationTokens: () => {
            // Rough token estimation: ~4 chars per token
            const state = get();
            const totalChars = state.messages.reduce(
              (sum, msg) => sum + msg.content.length + (msg.reasoning_content?.length || 0),
              0
            );
            return Math.ceil(totalChars / 4);
          },
        },
      })),
      {
        name: 'deepcode-ai-store',
        partialize: (state) => ({
          currentModel: state.currentModel,
          showReasoningProcess: state.showReasoningProcess,
          completionEnabled: state.completionEnabled,
          conversationHistory: state.conversationHistory,
        }),
      }
    ),
    {
      name: 'DeepCode AI Store',
    }
  )
);

// Selector hooks
export const useAIMessages = () => useAIStore((state) => state.messages);
export const useAIModel = () => useAIStore((state) => state.currentModel);
export const useAIContext = () => useAIStore((state) => state.activeContext);
export const useAIActions = () => useAIStore((state) => state.actions);
