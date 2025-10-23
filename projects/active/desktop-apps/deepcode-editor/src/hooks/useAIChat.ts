import { logger } from '../services/Logger';
import { useCallback, useState, startTransition } from 'react';

import { UnifiedAIService } from '../services/ai/UnifiedAIService';
import { AIContextRequest, AIMessage, EditorFile, WorkspaceContext } from '../types';

export interface UseAIChatReturn {
  aiMessages: AIMessage[];
  aiChatOpen: boolean;
  isAiResponding: boolean;
  setAiChatOpen: (open: boolean) => void;
  handleSendMessage: (message: string, contextRequest?: Partial<AIContextRequest>) => Promise<void>;
  clearAiMessages: () => void;
  addAiMessage: (message: AIMessage) => void;
  updateAiMessage: (messageId: string, updater: (msg: AIMessage) => AIMessage) => void;
}

export interface UseAIChatProps {
  aiService: UnifiedAIService;
  currentFile?: EditorFile | null | undefined;
  workspaceContext?: WorkspaceContext | undefined;
  onError?: ((error: Error) => void) | undefined;
  openFiles?: EditorFile[];
  workspaceFolder?: string | null;
  sidebarOpen?: boolean;
  previewOpen?: boolean;
}

export function useAIChat({
  aiService,
  currentFile,
  workspaceContext,
  onError,
  openFiles = [],
  workspaceFolder = null,
  sidebarOpen = true,
  previewOpen = false,
}: UseAIChatProps): UseAIChatReturn {
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome to DeepCode Editor! 🚀

I'm your AI coding assistant. I can help you with:

• **Code completion** - Smart suggestions as you type
• **Code generation** - Write functions, classes, and more
• **Code explanation** - Understand complex code
• **Debugging** - Find and fix issues
• **Refactoring** - Improve code structure

Try asking me something like:
- "Write a React component for a login form"
- "Explain this function"
- "Help me debug this error"

Let's build something amazing together!`,
      timestamp: new Date(),
    },
  ]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const addAiMessage = useCallback((message: AIMessage) => {
    // Use startTransition for non-urgent message additions (e.g., agent task updates)
    // Urgent messages (e.g., user messages) will skip this and update immediately
    const isUrgent = message.role === 'user';

    if (isUrgent) {
      setAiMessages((prev) => [...prev, message]);
    } else {
      startTransition(() => {
        setAiMessages((prev) => [...prev, message]);
      });
    }
  }, []);

  const updateAiMessage = useCallback((messageId: string, updater: (msg: AIMessage) => AIMessage) => {
    // Use startTransition for non-urgent message updates (agent task step progress)
    startTransition(() => {
      setAiMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updater(msg) : msg))
      );
    });
  }, []);

  const clearAiMessages = useCallback(() => {
    setAiMessages([]);
  }, []);

  const handleSendMessage = useCallback(
    async (message: string, contextRequest?: Partial<AIContextRequest>) => {
      // Add user message
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      addAiMessage(userMessage);

      setIsAiResponding(true);

      try {
        // Build context request with enhanced user activity
        const fullContextRequest: AIContextRequest = {
          userQuery: message,
          relatedFiles: [],
          workspaceContext: workspaceContext || {
            rootPath: '/',
            totalFiles: 0,
            languages: ['JavaScript', 'TypeScript'],
            testFiles: 0,
            projectStructure: {},
            dependencies: {},
            exports: {},
            symbols: {},
            lastIndexed: new Date(),
            summary: 'Demo project',
          },
          conversationHistory: [],
          currentFile: currentFile || undefined,
          userActivity: {
            openFiles: openFiles,
            sidebarOpen: sidebarOpen,
            previewOpen: previewOpen,
            aiChatOpen: aiChatOpen,
            recentFiles: openFiles.slice(0, 5).map(f => f.name),
            workspaceFolder: workspaceFolder,
          },
          ...contextRequest,
        };

        // Get AI response using streaming
        let aiResponseContent = '';
        let aiReasoningContent = '';
        let isCollectingReasoning = false;
        const aiResponseId = (Date.now() + 1).toString();

        // Add initial AI message
        const aiMessage: AIMessage = {
          id: aiResponseId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        addAiMessage(aiMessage);

        // Stream the response
        for await (const chunk of aiService.sendContextualMessageStream(fullContextRequest)) {
          // Check if this is reasoning content
          if (chunk.startsWith('[REASONING] ')) {
            isCollectingReasoning = true;
            aiReasoningContent += chunk.substring(12); // Remove [REASONING] prefix
          } else if (isCollectingReasoning && chunk === '[/REASONING]') {
            isCollectingReasoning = false;
          } else if (isCollectingReasoning) {
            aiReasoningContent += chunk;
          } else {
            aiResponseContent += chunk;
          }

          // Use startTransition to mark streaming updates as non-urgent (improves performance)
          startTransition(() => {
            setAiMessages((prev) => {
              return prev.map((msg) => {
                if (msg.id === aiResponseId) {
                  const updatedMsg: AIMessage = {
                    ...msg,
                    content: aiResponseContent,
                    ...(aiReasoningContent ? { reasoning_content: aiReasoningContent } : {}),
                  };
                  return updatedMsg;
                }
                return msg;
              });
            });
          });
        }

        // Response is complete (no need to mark anything since we don't have isTyping)
      } catch (error) {
        logger.error('AI chat error:', error);

        // Add error message
        const errorMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. ${
            error instanceof Error && error.message.includes('API key')
              ? 'Please add your API key in Settings > API Keys.'
              : 'Please try again.'
          }`,
          timestamp: new Date(),
        };
        addAiMessage(errorMessage);

        onError?.(error as Error);
      } finally {
        setIsAiResponding(false);
      }
    },
    [aiService, currentFile, workspaceContext, addAiMessage, onError, openFiles, workspaceFolder, sidebarOpen, previewOpen]
  );

  return {
    aiMessages,
    aiChatOpen,
    isAiResponding,
    setAiChatOpen,
    handleSendMessage,
    clearAiMessages,
    addAiMessage,
    updateAiMessage,
  };
}
