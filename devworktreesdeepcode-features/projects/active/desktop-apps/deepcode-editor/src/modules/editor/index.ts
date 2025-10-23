// Editor module public API
import type { EditorFile } from './types';

export { EditorCore } from './components/EditorCore/EditorCore';
export * from './hooks/useEditorState';
export { EditorService } from './services/EditorService';
export * from './types';

// Module interface for cross-module communication
export interface EditorModuleInterface {
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  saveFile: (path: string) => Promise<void>;
  getActiveFile: () => EditorFile | null;
  getOpenFiles: () => EditorFile[];
}

// Export module configuration
export const editorModuleConfig = {
  name: 'editor',
  version: '1.0.0',
  dependencies: ['workspace', 'ai-assistant'],
  exports: ['EditorCore', 'EditorService', 'useEditorState'],
};
