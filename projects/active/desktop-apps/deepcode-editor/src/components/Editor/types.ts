/**
 * Editor Types
 * Type definitions and interfaces for the Editor component
 */
import type { editor } from 'monaco-editor';

import type { DeepSeekService } from '../../services/DeepSeekService';
import type { UnifiedAIService } from '../../services/ai/UnifiedAIService';
import type { EditorFile, EditorSettings, WorkspaceContext } from '../../types';

export interface EditorProps {
  file: EditorFile;
  openFiles: EditorFile[];
  onFileChange: (content: string) => void;
  onCloseFile: (path: string) => void;
  onSaveFile: () => void;
  onFileSelect: (file: EditorFile) => void;
  deepSeekService?: DeepSeekService;
  aiService?: UnifiedAIService;
  workspaceContext?: WorkspaceContext;
  getFileContext?: (file: EditorFile) => unknown[];
  settings?: EditorSettings;
  liveStream?: unknown;
  onEditorMount?: (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void;
  modelStrategy?: 'fast' | 'balanced' | 'accurate' | 'adaptive';
  currentAIModel?: string;
}

export interface CompletionStats {
  totalSuggestions: number;
  accepted: number;
  rejected: number;
  avgLatency: number;
}

export interface PrefetchStats {
  cacheSize: number;
  queueSize: number;
  activeCount: number;
  hitRate: number;
  avgLatency: number;
  memoryUsageMB: number;
}

export type PrefetchStatus = 'idle' | 'active' | 'learning';

export interface FindMatchState {
  current: number;
  total: number;
}

export interface CursorPosition {
  line: number;
  column: number;
}
