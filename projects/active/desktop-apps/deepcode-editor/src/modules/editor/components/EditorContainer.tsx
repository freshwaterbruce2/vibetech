import React from 'react';

import ModuleRegistry from '../../ModuleRegistry';
import { useEditorState } from '../hooks/useEditorState';
import { EditorSettings } from '../types';

import { EditorCore } from './EditorCore/EditorCore';

interface EditorContainerProps {
  settings?: EditorSettings;
}

const defaultSettings: EditorSettings = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  theme: 'dark',
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  lineNumbers: true,
};

export const EditorContainer: React.FC<EditorContainerProps> = ({ settings = defaultSettings }) => {
  const { state, actions } = useEditorState();

  // Register module interface for cross-module communication
  React.useEffect(() => {
    ModuleRegistry.setModuleInterface('editor', {
      openFile: actions.openFile,
      closeFile: actions.closeFile,
      saveFile: actions.saveFile,
      getActiveFile: () => state.activeFile,
      getOpenFiles: () => state.openFiles,
    });
  }, [actions, state]);

  if (!state.activeFile) {
    return (
      <div className="editor-empty">
        <p>No file open</p>
        <p>Open a file from the workspace to start editing</p>
      </div>
    );
  }

  return (
    <EditorCore
      file={state.activeFile}
      settings={settings}
      onContentChange={(content) =>
        state.activeFile && actions.updateFileContent(state.activeFile.path, content)
      }
      onCursorChange={(line, column) => actions.setCursorPosition({ line, column })}
    />
  );
};
