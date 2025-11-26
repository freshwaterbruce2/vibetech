/**
 * IPC Bridge Types
 *
 * Type definitions for WebSocket bridge communication between
 * DeepCode Editor (Electron) and Nova Agent (Tauri) via ws://127.0.0.1:5004
 */

export interface BridgeMessage {
  type: string;
  source: 'deepcode' | 'vibe' | 'nova';
  target?: string;
  payload: any;
  timestamp: number;
  messageId: string;
}

export interface TaskStartedPayload {
  task_id: string;
  task_type: string;
  title: string;
  context?: {
    workspaceRoot?: string;
    userRequest?: string;
    files?: string[];
  };
}

export interface TaskStoppedPayload {
  task_id: string;
  duration_minutes?: number;
  status: 'completed' | 'paused' | 'abandoned';
  reason?: string;
}

export interface BridgeStatus {
  connected: boolean;
  lastConnectedAt?: number;
  reconnectAttempts?: number;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ipcBridge?: {
      send: (msg: BridgeMessage) => Promise<{ success: boolean; error?: string }>;
      onMessage: (handler: (msg: BridgeMessage) => void) => () => void;
      onStatusChange: (handler: (status: BridgeStatus) => void) => () => void;
      getStatus: () => Promise<BridgeStatus>;
    };
  }
}

export {};
