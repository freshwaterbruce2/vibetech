import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { EditorFile, EditorSettings, WorkspaceContext } from '../types';

/**
 * Modern Zustand Store for DeepCode Editor - 2025 Patterns
 *
 * Features:
 * - TypeScript first with proper inference
 * - Immer for immutable updates
 * - DevTools integration
 * - Persistence with localStorage
 * - Subscriptions for specific state changes
 * - Computed values with selectors
 * - Async actions support
 */

interface EditorState {
  // File Management
  currentFile: EditorFile | null;
  openFiles: EditorFile[];
  recentFiles: string[];

  // Editor Settings
  settings: EditorSettings;

  // UI State
  sidebarOpen: boolean;
  aiChatOpen: boolean;
  settingsOpen: boolean;
  commandPaletteOpen: boolean;

  // Workspace
  workspaceFolder: string | null;
  workspaceContext: WorkspaceContext | null;
  isIndexing: boolean;
  indexingProgress: number;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }>;

  // Actions
  actions: {
    // File actions
    openFile: (file: EditorFile) => void;
    closeFile: (fileId: string) => void;
    updateFile: (fileId: string, updates: Partial<EditorFile>) => void;
    setCurrentFile: (file: EditorFile | null) => void;
    saveFile: (fileId: string) => Promise<void>;

    // Settings actions
    updateSettings: (settings: Partial<EditorSettings>) => void;
    resetSettings: () => void;

    // UI actions
    toggleSidebar: () => void;
    toggleAIChat: () => void;
    toggleSettings: () => void;
    toggleCommandPalette: () => void;

    // Workspace actions
    setWorkspaceFolder: (folder: string | null) => void;
    setWorkspaceContext: (context: WorkspaceContext | null) => void;
    setIndexing: (isIndexing: boolean, progress?: number) => void;

    // Notification actions
    showNotification: (
      notification: Omit<EditorState['notifications'][0], 'id' | 'timestamp'>
    ) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
  };

  // Computed values (selectors)
  computed: {
    hasUnsavedChanges: () => boolean;
    modifiedFiles: () => EditorFile[];
    activeFileName: () => string | null;
    totalNotifications: () => number;
  };
}

// Default settings
const defaultSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  aiAutoComplete: true,
  aiSuggestions: true,
  aiModel: 'deepseek-chat',
  showReasoningProcess: false,
};

// Create the store with middleware
export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          currentFile: null,
          openFiles: [],
          recentFiles: [],
          settings: defaultSettings,
          sidebarOpen: true,
          aiChatOpen: false,
          settingsOpen: false,
          commandPaletteOpen: false,
          workspaceFolder: null,
          workspaceContext: null,
          isIndexing: false,
          indexingProgress: 0,
          notifications: [],

          // Actions
          actions: {
            // File management
            openFile: (file) =>
              set((state) => {
                const exists = state.openFiles.some((f) => f.id === file.id);
                if (!exists) {
                  state.openFiles.push(file);
                }
                state.currentFile = file;

                // Update recent files
                state.recentFiles = [
                  file.path,
                  ...state.recentFiles.filter((p) => p !== file.path),
                ].slice(0, 10);
              }),

            closeFile: (fileId) =>
              set((state) => {
                const index = state.openFiles.findIndex((f) => f.id === fileId);
                if (index > -1) {
                  state.openFiles.splice(index, 1);

                  // Update current file if needed
                  if (state.currentFile?.id === fileId) {
                    state.currentFile =
                      state.openFiles[index - 1] || state.openFiles[index] || null;
                  }
                }
              }),

            updateFile: (fileId, updates) =>
              set((state) => {
                const file = state.openFiles.find((f) => f.id === fileId);
                if (file) {
                  Object.assign(file, updates);
                }
                if (state.currentFile?.id === fileId) {
                  Object.assign(state.currentFile, updates);
                }
              }),

            setCurrentFile: (file) =>
              set((state) => {
                state.currentFile = file;
              }),

            saveFile: async (fileId) => {
              const state = get();
              const file = state.openFiles.find((f) => f.id === fileId);
              if (file) {
                try {
                  // Simulate file save (replace with actual implementation)
                  await new Promise((resolve) => setTimeout(resolve, 500));

                  set((state) => {
                    const file = state.openFiles.find((f) => f.id === fileId);
                    if (file) {
                      file.isModified = false;
                    }
                  });

                  state.actions.showNotification({
                    type: 'success',
                    title: 'File Saved',
                    message: `${file.name} saved successfully`,
                  });
                } catch (error) {
                  state.actions.showNotification({
                    type: 'error',
                    title: 'Save Failed',
                    message: `Failed to save ${file.name}`,
                  });
                  throw error;
                }
              }
            },

            // Settings
            updateSettings: (updates) =>
              set((state) => {
                Object.assign(state.settings, updates);
              }),

            resetSettings: () =>
              set((state) => {
                state.settings = { ...defaultSettings };
              }),

            // UI toggles
            toggleSidebar: () =>
              set((state) => {
                state.sidebarOpen = !state.sidebarOpen;
              }),

            toggleAIChat: () =>
              set((state) => {
                state.aiChatOpen = !state.aiChatOpen;
              }),

            toggleSettings: () =>
              set((state) => {
                state.settingsOpen = !state.settingsOpen;
              }),

            toggleCommandPalette: () =>
              set((state) => {
                state.commandPaletteOpen = !state.commandPaletteOpen;
              }),

            // Workspace
            setWorkspaceFolder: (folder) =>
              set((state) => {
                state.workspaceFolder = folder;
              }),

            setWorkspaceContext: (context) =>
              set((state) => {
                state.workspaceContext = context;
              }),

            setIndexing: (isIndexing, progress) =>
              set((state) => {
                state.isIndexing = isIndexing;
                if (progress !== undefined) {
                  state.indexingProgress = progress;
                }
              }),

            // Notifications
            showNotification: (notification) =>
              set((state) => {
                const id = Date.now().toString();
                state.notifications.push({
                  ...notification,
                  id,
                  timestamp: new Date(),
                });

                // Auto-remove after 5 seconds for non-error notifications
                if (notification.type !== 'error') {
                  setTimeout(() => {
                    get().actions.removeNotification(id);
                  }, 5000);
                }
              }),

            removeNotification: (id) =>
              set((state) => {
                const index = state.notifications.findIndex((n) => n.id === id);
                if (index > -1) {
                  state.notifications.splice(index, 1);
                }
              }),

            clearNotifications: () =>
              set((state) => {
                state.notifications = [];
              }),
          },

          // Computed values
          computed: {
            hasUnsavedChanges: () => {
              const state = get();
              return state.openFiles.some((f) => f.isModified);
            },

            modifiedFiles: () => {
              const state = get();
              return state.openFiles.filter((f) => f.isModified);
            },

            activeFileName: () => {
              const state = get();
              return state.currentFile?.name || null;
            },

            totalNotifications: () => {
              const state = get();
              return state.notifications.length;
            },
          },
        }))
      ),
      {
        name: 'deepcode-editor-store',
        partialize: (state) => ({
          recentFiles: state.recentFiles,
          settings: state.settings,
          sidebarOpen: state.sidebarOpen,
          workspaceFolder: state.workspaceFolder,
        }),
      }
    ),
    {
      name: 'DeepCode Editor Store',
    }
  )
);

// Selector hooks for performance optimization
export const useCurrentFile = () => useEditorStore((state) => state.currentFile);
export const useOpenFiles = () => useEditorStore((state) => state.openFiles);
export const useSettings = () => useEditorStore((state) => state.settings);
export const useNotifications = () => useEditorStore((state) => state.notifications);
export const useWorkspace = () =>
  useEditorStore((state) => ({
    folder: state.workspaceFolder,
    context: state.workspaceContext,
    isIndexing: state.isIndexing,
    progress: state.indexingProgress,
  }));

// Action hooks
export const useEditorActions = () => useEditorStore((state) => state.actions);
export const useFileActions = () =>
  useEditorStore((state) => ({
    openFile: state.actions.openFile,
    closeFile: state.actions.closeFile,
    updateFile: state.actions.updateFile,
    saveFile: state.actions.saveFile,
    setCurrentFile: state.actions.setCurrentFile,
  }));

// Subscribe to specific changes
export const subscribeToFileChanges = (
  fileId: string,
  callback: (file: EditorFile | undefined) => void
) => {
  return useEditorStore.subscribe(
    (state) => state.openFiles.find((f) => f.id === fileId),
    callback
  );
};

// DevTools actions
if (import.meta.env.DEV) {
  // @ts-expect-error - Exposing store for dev tools
  window.editorStore = useEditorStore;
}
