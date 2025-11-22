/**
 * IPC Store for Vibe Code Studio
 *
 * Zustand store for managing IPC Bridge connection state
 *
 * Features:
 * - Connection status tracking
 * - Remote learning data from NOVA Agent
 * - Integration with IPCClient service
 * - React hooks for component access
 *
 * Based on 2025 Best Practices:
 * - Zustand for efficient state management
 * - TypeScript for type safety
 * - Event-driven architecture
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type { ConnectionStatus } from '../services/IPCClient';
import { ipcClient } from '../services/IPCClient';
import { logger } from '../services/Logger';

export interface RemoteLearningData {
  id: string;
  source: 'nova' | 'vibe';
  content: string;
  timestamp: number;
  category?: string;
  tags?: string[];
}

export interface RemoteProjectUpdate {
  projectId: string;
  projectName: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: number;
  details?: any;
}

interface IPCStore {
  // Connection State
  status: ConnectionStatus;
  lastPing: number | null;
  lastError: string | null;
  queuedMessageCount: number;

  // Remote Data
  remoteLearningData: RemoteLearningData[];
  remoteProjectUpdates: RemoteProjectUpdate[];

  // Actions
  updateStatus: (status: ConnectionStatus) => void;
  updateLastPing: (timestamp: number) => void;
  updateQueuedMessageCount: (count: number) => void;
  setLastError: (error: string | null) => void;

  // Data Management
  addRemoteLearningData: (data: RemoteLearningData) => void;
  addRemoteProjectUpdate: (update: RemoteProjectUpdate) => void;
  clearRemoteLearningData: () => void;
  clearRemoteProjectUpdates: () => void;

  // Connection Control
  connect: () => void;
  disconnect: () => void;

  // Utility
  isConnected: () => boolean;
  getTimeSinceLastPing: () => number | null;
}

export const useIPCStore = create<IPCStore>((set, get) => ({
  // Initial State
  status: 'disconnected',
  lastPing: null,
  lastError: null,
  queuedMessageCount: 0,
  remoteLearningData: [],
  remoteProjectUpdates: [],

  // Status Updates - guarded to prevent unnecessary re-renders
  updateStatus: (status: ConnectionStatus) => {
    const currentStatus = get().status;
    if (currentStatus !== status) {
      set({ status });
      logger.debug('[IPC Store] Status updated:', status);
    }
  },

  updateLastPing: (timestamp: number) => {
    const currentPing = get().lastPing;
    if (currentPing !== timestamp) {
      set({ lastPing: timestamp });
    }
  },

  updateQueuedMessageCount: (count: number) => {
    const currentCount = get().queuedMessageCount;
    if (currentCount !== count) {
      set({ queuedMessageCount: count });
    }
  },

  setLastError: (error: string | null) => {
    const currentError = get().lastError;
    if (currentError !== error) {
      set({ lastError: error });
    }
  },

  // Data Management
  addRemoteLearningData: (data: RemoteLearningData) => {
    set((state) => ({
      remoteLearningData: [...state.remoteLearningData, data]
    }));
    logger.debug('[IPC Store] Added remote learning data:', data.id);
  },

  addRemoteProjectUpdate: (update: RemoteProjectUpdate) => {
    set((state) => ({
      remoteProjectUpdates: [...state.remoteProjectUpdates, update]
    }));
    logger.debug('[IPC Store] Added project update:', update.projectName);
  },

  clearRemoteLearningData: () => {
    set({ remoteLearningData: [] });
    logger.debug('[IPC Store] Cleared remote learning data');
  },

  clearRemoteProjectUpdates: () => {
    set({ remoteProjectUpdates: [] });
    logger.debug('[IPC Store] Cleared remote project updates');
  },

  // Connection Control
  connect: () => {
    ipcClient.connect();
  },

  disconnect: () => {
    ipcClient.disconnect();
  },

  // Utility
  isConnected: () => {
    return get().status === 'connected';
  },

  getTimeSinceLastPing: () => {
    const { lastPing } = get();
    if (!lastPing) return null;
    return Date.now() - lastPing;
  }
}));

/**
 * Initialize IPC Store - Sets up event listeners
 * Call this once on app startup
 */
// CRITICAL FIX: Guard flag prevents React 18 StrictMode duplicate initialization - DO NOT REMOVE!
let isIPCStoreInitialized = false;

export const initializeIPCStore = () => {
  // Guard against multiple initializations (React 18 StrictMode calls effects twice in dev)
  // WARNING: Removing this guard will cause duplicate event listeners and infinite loops!
  if (isIPCStoreInitialized) {
    logger.debug('[IPC Store] Already initialized, skipping...');
    return;
  }

  const store = useIPCStore.getState();

  logger.info('[IPC Store] Initializing...');
  isIPCStoreInitialized = true;

  // Listen to connection status changes
  ipcClient.on('status', (status) => {
    store.updateStatus(status);

    // Clear error on successful connection
    if (status === 'connected') {
      store.setLastError(null);
    }
  });

  // Listen to pong responses (health check)
  ipcClient.on('pong', (timestamp) => {
    store.updateLastPing(timestamp);
  });

  // Listen for learning data sync from NOVA
  ipcClient.on('learning:sync', (payload) => {
    try {
      const learningData: RemoteLearningData = {
        id: payload.id || `remote-${Date.now()}`,
        source: 'nova',
        content: payload.content || JSON.stringify(payload),
        timestamp: payload.timestamp || Date.now(),
        category: payload.category,
        tags: payload.tags
      };

      store.addRemoteLearningData(learningData);
      logger.debug('[IPC Store] Received learning sync from NOVA');
    } catch (error) {
      logger.error('[IPC Store] Failed to process learning sync:', error);
    }
  });

  // Listen for project updates from NOVA
  ipcClient.on('project:update', (payload) => {
    try {
      const update: RemoteProjectUpdate = {
        projectId: payload.projectId || payload.id,
        projectName: payload.projectName || payload.name || 'Unknown',
        action: payload.action || 'updated',
        timestamp: payload.timestamp || Date.now(),
        details: payload.details
      };

      store.addRemoteProjectUpdate(update);
      logger.debug('[IPC Store] Received project update from NOVA');
    } catch (error) {
      logger.error('[IPC Store] Failed to process project update:', error);
    }
  });

  // Listen for file open requests from NOVA
  ipcClient.on('file:open', (payload) => {
    logger.debug('[IPC Store] Received file open request:', payload);
    // This will be handled by the file opening implementation (Task 20)
    // For now, just emit a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ipc:file-open', { detail: payload }));
    }
  });

  // Listen for notifications from NOVA
  ipcClient.on('notification', (payload) => {
    logger.debug('[IPC Store] Received notification:', payload);
    // This will be handled by the notification implementation (Task 18)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ipc:notification', { detail: payload }));
    }
  });

  // Periodically update queued message count
  setInterval(() => {
    const count = ipcClient.getQueuedMessageCount();
    store.updateQueuedMessageCount(count);
  }, 5000);

  logger.info('[IPC Store] Initialized successfully');
};

/**
 * Custom Hooks for Component Access
 */

// Connection status hook - memoized to prevent infinite re-renders
// CRITICAL FIX: useMemo prevents infinite loops - DO NOT REMOVE!
export const useIPCConnectionStatus = () => {
  const status = useIPCStore((state) => state.status);
  const lastError = useIPCStore((state) => state.lastError);
  const lastPing = useIPCStore((state) => state.lastPing);
  const queuedMessageCount = useIPCStore((state) => state.queuedMessageCount);

  // Use useMemo to return stable object reference when values haven't changed
  // WARNING: Removing useMemo will cause "Maximum update depth exceeded" errors!
  return useMemo(
    () => ({
      status,
      isConnected: status === 'connected',
      lastError,
      lastPing,
      queuedMessageCount
    }),
    [status, lastError, lastPing, queuedMessageCount]
  );
};

// Remote learning data hook
export const useRemoteLearningData = () => {
  return useIPCStore((state) => state.remoteLearningData);
};

// Remote project updates hook
export const useRemoteProjectUpdates = () => {
  return useIPCStore((state) => state.remoteProjectUpdates);
};

// Connection actions hook - memoized for consistency
export const useIPCActions = () => {
  const connect = useIPCStore((state) => state.connect);
  const disconnect = useIPCStore((state) => state.disconnect);
  const clearRemoteLearningData = useIPCStore((state) => state.clearRemoteLearningData);
  const clearRemoteProjectUpdates = useIPCStore((state) => state.clearRemoteProjectUpdates);

  return useMemo(
    () => ({
      connect,
      disconnect,
      clearRemoteLearningData,
      clearRemoteProjectUpdates
    }),
    [connect, disconnect, clearRemoteLearningData, clearRemoteProjectUpdates]
  );
};

// Combined hook for everything - memoized to prevent re-renders
export const useIPC = () => {
  const status = useIPCConnectionStatus();
  const learningData = useRemoteLearningData();
  const projectUpdates = useRemoteProjectUpdates();
  const actions = useIPCActions();

  return useMemo(
    () => ({
      ...status,
      learningData,
      projectUpdates,
      ...actions
    }),
    [status, learningData, projectUpdates, actions]
  );
};
