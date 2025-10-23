import { logger } from '../services/Logger';
import { useCallback, useEffect } from 'react';

import { useAIActions, useAIStore } from '../stores/useAIStore';
import { useEditorStore, useFileActions } from '../stores/useEditorStore';
import { AIMessage, EditorFile } from '../types';

/**
 * Store Integration Hook - Bridges old hooks with new Zustand stores
 *
 * This provides a migration path from the old useState-based hooks
 * to the new Zustand store pattern while maintaining API compatibility
 */

// File management integration
export function useFileManagement() {
  const currentFile = useEditorStore((state) => state.currentFile);
  const openFiles = useEditorStore((state) => state.openFiles);
  const { openFile, closeFile, updateFile, saveFile, setCurrentFile } = useFileActions();

  // Maintain compatibility with old API
  const handleOpenFile = useCallback(
    async (filePath: string, content?: string) => {
      const file: EditorFile = {
        id: filePath,
        name: filePath.split('/').pop() || 'untitled',
        path: filePath,
        content: content || '',
        language: 'typescript', // You'd detect this from extension
        isModified: false,
      };
      openFile(file);
    },
    [openFile]
  );

  const handleFileChange = useCallback(
    (fileId: string, content: string) => {
      updateFile(fileId, { content, isModified: true });
    },
    [updateFile]
  );

  const handleSaveFile = useCallback(async () => {
    if (currentFile) {
      await saveFile(currentFile.id);
    }
  }, [currentFile, saveFile]);

  return {
    currentFile,
    openFiles,
    handleOpenFile,
    handleCloseFile: closeFile,
    handleFileChange,
    handleSaveFile,
    setCurrentFile,
  };
}

// Notification integration
export function useNotificationSystem() {
  const notifications = useEditorStore((state) => state.notifications);
  const { showNotification, removeNotification } = useEditorStore((state) => state.actions);

  const showError = useCallback(
    (title: string, message: string) => {
      showNotification({ type: 'error', title, message });
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    (title: string, message: string) => {
      showNotification({ type: 'success', title, message });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (title: string, message: string) => {
      showNotification({ type: 'warning', title, message });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (title: string, message: string) => {
      showNotification({ type: 'info', title, message });
    },
    [showNotification]
  );

  return {
    notifications,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeNotification,
  };
}

// AI Chat integration
export function useAIChatIntegration() {
  const messages = useAIStore((state) => state.messages);
  const isResponding = useAIStore((state) => state.isResponding);
  const currentModel = useAIStore((state) => state.currentModel);
  const { addMessage, clearMessages, setResponding } = useAIActions();

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Set responding state
      setResponding(true);

      try {
        // Here you would call your AI service
        // For now, we'll simulate a response
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This is a simulated response to: "${content}"`,
          timestamp: new Date(),
        };

        addMessage(assistantMessage);
      } finally {
        setResponding(false);
      }
    },
    [addMessage, setResponding]
  );

  return {
    messages,
    isResponding,
    currentModel,
    handleSendMessage,
    clearMessages,
  };
}

// Settings integration
export function useSettingsIntegration() {
  const settings = useEditorStore((state) => state.settings);
  const settingsOpen = useEditorStore((state) => state.settingsOpen);
  const { updateSettings, toggleSettings } = useEditorStore((state) => state.actions);

  return {
    settings,
    settingsOpen,
    updateSettings,
    toggleSettings,
    setSettingsOpen: toggleSettings, // Alias for compatibility
  };
}

// Workspace integration
export function useWorkspaceIntegration() {
  const workspace = useEditorStore((state) => ({
    folder: state.workspaceFolder,
    context: state.workspaceContext,
    isIndexing: state.isIndexing,
    progress: state.indexingProgress,
  }));

  const { setWorkspaceFolder, setWorkspaceContext, setIndexing } = useEditorStore(
    (state) => state.actions
  );

  const indexWorkspace = useCallback(
    async (folderPath: string) => {
      setIndexing(true, 0);
      setWorkspaceFolder(folderPath);

      try {
        // Simulate workspace indexing
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setIndexing(true, i);
        }

        // Set mock context
        setWorkspaceContext({
          rootPath: folderPath,
          totalFiles: 42,
          languages: ['TypeScript', 'JavaScript', 'CSS'],
          testFiles: 15,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Mock workspace',
        });
      } finally {
        setIndexing(false, 100);
      }
    },
    [setIndexing, setWorkspaceFolder, setWorkspaceContext]
  );

  return {
    ...workspace,
    indexWorkspace,
  };
}

// Global store sync hook
export function useSyncStores() {
  const aiModel = useAIStore((state) => state.currentModel);
  const { updateSettings } = useEditorStore((state) => state.actions);

  // Sync AI model between stores
  useEffect(() => {
    updateSettings({ aiModel });
  }, [aiModel, updateSettings]);

  // You can add more synchronization logic here
}

// Performance monitoring hook
export function useStorePerformance() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Monitor store updates
      const unsubscribe = useEditorStore.subscribe(
        (state) => state,
        (state, prevState) => {
          logger.debug('[Store Update]', {
            changed: Object.keys(state).filter(
              (key) => state[key as keyof typeof state] !== prevState[key as keyof typeof state]
            ),
          });
        }
      );

      return unsubscribe;
    }
    // Return undefined for production mode
    return undefined;
  }, []);
}
