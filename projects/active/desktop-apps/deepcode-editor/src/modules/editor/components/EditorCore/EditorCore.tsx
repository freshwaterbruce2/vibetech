import React, { useRef } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

import { useEditorShortcuts } from '../../hooks/useEditorShortcuts';
import { EditorFile, EditorSettings } from '../../types';
import { EditorToolbar } from '../EditorToolbar/EditorToolbar';

import './EditorCore.css';

interface EditorCoreProps {
  file: EditorFile;
  settings: EditorSettings;
  onContentChange: (content: string) => void;
  onCursorChange: (line: number, column: number) => void;
}

export const EditorCore: React.FC<EditorCoreProps> = ({
  file,
  settings,
  onContentChange,
  onCursorChange,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });

    editor.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fontLigatures: true,
      lineNumbers: settings.lineNumbers ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
      wordWrap: settings.wordWrap ? 'on' : 'off',
      tabSize: settings.tabSize,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      folding: true,
      glyphMargin: true,
      contextmenu: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
        highlightActiveIndentation: true,
      },
    });
  };

  useEditorShortcuts(editorRef.current);

  return (
    <div className="editor-core">
      <EditorToolbar
        fileName={file.path.split('/').pop() || 'Untitled'}
        isModified={file.isModified}
        language={file.language}
      />
      <div className="editor-monaco-container">
        <MonacoEditor
          language={file.language}
          value={file.content}
          onChange={(value) => onContentChange(value || '')}
          onMount={handleEditorDidMount}
          theme={settings.theme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
};
