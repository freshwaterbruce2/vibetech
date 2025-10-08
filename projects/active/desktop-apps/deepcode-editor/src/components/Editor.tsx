import React, { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { editor, languages, Range } from 'monaco-editor';
import styled, { keyframes } from 'styled-components';

import { DeepSeekService } from '../services/DeepSeekService';
import { vibeTheme } from '../styles/theme';
import { EditorFile, EditorSettings, WorkspaceContext } from '../types';
// import { useMultiCursor } from '../hooks/useMultiCursor';
// import { MultiCursorIndicator } from './MultiCursorIndicator';

import FileTabs from './FileTabs';
import FindReplace, { FindOptions } from './FindReplace';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: ${vibeTheme.colors.primary};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(0, 212, 255, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
`;

const MonacoContainer = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  border-radius: ${vibeTheme.borderRadius.medium};
  overflow: hidden;
  margin: ${vibeTheme.spacing.sm};
  box-shadow: ${vibeTheme.shadows.large};
  border: 2px solid rgba(139, 92, 246, 0.1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2px;
    background: ${vibeTheme.gradients.border};
    border-radius: ${vibeTheme.borderRadius.medium};
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
    opacity: 0.3;
    z-index: -1;
  }
`;

const StatusOverlay = styled(motion.div)<{ visible: boolean }>`
  position: absolute;
  top: ${vibeTheme.spacing.md};
  right: ${vibeTheme.spacing.md};
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(0, 212, 255, 0.8) 100%);
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transition: all ${vibeTheme.animation.duration.normal} ease;
  z-index: 1000;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow:
    ${vibeTheme.shadows.medium},
    0 0 20px rgba(139, 92, 246, 0.4);
  animation: ${(props) => (props.visible ? pulse : 'none')} 2s infinite;
`;

interface EditorProps {
  file: EditorFile;
  openFiles: EditorFile[];
  onFileChange: (content: string) => void;
  onCloseFile: (path: string) => void;
  onSaveFile: () => void;
  onFileSelect: (file: EditorFile) => void;
  deepSeekService: DeepSeekService;
  workspaceContext?: WorkspaceContext | undefined;
  getFileContext?: ((file: EditorFile) => any[]) | undefined;
  settings?: EditorSettings | undefined;
}

const Editor: React.FC<EditorProps> = ({
  file,
  openFiles,
  onFileChange,
  onCloseFile,
  onSaveFile,
  onFileSelect,
  deepSeekService,
  workspaceContext: _workspaceContext,
  getFileContext: _getFileContext,
  settings,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [showAiStatus, setShowAiStatus] = useState(false);
  const [, setCursorPosition] = useState({ line: 1, column: 1 });
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findMatches, setFindMatches] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const decorationsRef = useRef<string[]>([]);

  // Multi-cursor functionality (disabled for now)
  // const {
  //   cursors,
  //   addCursorAbove,
  //   addCursorBelow,
  //   selectAllOccurrences,
  //   selectNextOccurrence,
  //   clearSecondaryCursors,
  //   toggleColumnSelection
  // } = useMultiCursor({
  //   editor: editorRef.current,
  //   onCursorsChanged: (cursors) => {
  //     // Update cursor position with primary cursor
  //     if (cursors.length > 0) {
  //       setCursorPosition({ line: cursors[0]?.lineNumber || 1, column: cursors[0]?.column || 1 });
  //     }
  //   }
  // });

  // Keyboard shortcuts
  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    onSaveFile();
  });

  useHotkeys('ctrl+/, cmd+/', (e) => {
    e.preventDefault();
    toggleComment();
  });

  useHotkeys('ctrl+d, cmd+d', (e) => {
    e.preventDefault();
    duplicateLine();
  });

  useHotkeys('alt+up', (e) => {
    e.preventDefault();
    moveLineUp();
  });

  useHotkeys('alt+down', (e) => {
    e.preventDefault();
    moveLineDown();
  });

  useHotkeys('ctrl+space, cmd+space', (e) => {
    e.preventDefault();
    triggerAiCompletion();
  });

  useHotkeys('ctrl+f, cmd+f', (e) => {
    e.preventDefault();
    setFindReplaceOpen(true);
  });

  useHotkeys('ctrl+h, cmd+h', (e) => {
    e.preventDefault();
    setFindReplaceOpen(true);
  });

  // Multi-cursor shortcuts (disabled for now)
  // useHotkeys('ctrl+alt+up, cmd+alt+up', (e) => {
  //   e.preventDefault();
  //   addCursorAbove();
  // });

  // useHotkeys('ctrl+alt+down, cmd+alt+down', (e) => {
  //   e.preventDefault();
  //   addCursorBelow();
  // });

  // useHotkeys('ctrl+shift+l, cmd+shift+l', (e) => {
  //   e.preventDefault();
  //   selectAllOccurrences();
  // });

  useHotkeys('ctrl+d, cmd+d', (e) => {
    e.preventDefault();
    // Duplicate line functionality only
    const selection = editorRef.current?.getSelection();
    if (selection && selection.isEmpty()) {
      duplicateLine();
    }
  });

  // useHotkeys('ctrl+shift+alt+up, ctrl+shift+alt+down', (e) => {
  //   e.preventDefault();
  //   toggleColumnSelection();
  // });

  useHotkeys('escape', (e) => {
    // if (cursors.length > 1) {
    //   e.preventDefault();
    //   clearSecondaryCursors();
    // } else 
    if (findReplaceOpen) {
      e.preventDefault();
      setFindReplaceOpen(false);
      clearFindDecorations();
    }
  });

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure editor settings with Vibe Tech theme
    editor.updateOptions({
      fontSize: 15,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      minimap: {
        enabled: true,
        maxColumn: 120,
        renderCharacters: false,
        showSlider: 'always',
      },
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      folding: true,
      lineDecorationsWidth: 12,
      lineNumbersMinChars: 4,
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
      inlineSuggest: { enabled: true },
      stickyScroll: { enabled: true },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      formatOnPaste: true,
      formatOnType: true,
      renderWhitespace: 'selection',
      renderLineHighlight: 'all',
      roundedSelection: true,
      matchBrackets: 'always',
      colorDecorators: true,
      codeLens: true,
      mouseWheelZoom: true,
    });

    // Set up AI completion provider
    setupAiCompletionProvider(editor);

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Set up auto-save
    let saveTimeout: NodeJS.Timeout;
    editor.onDidChangeModelContent(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (file.isModified) {
          console.log('Auto-saving file...');
          // Could auto-save here if enabled in settings
        }
      }, 2000);
    });
  };

  const setupAiCompletionProvider = (_editor: editor.IStandaloneCodeEditor) => {
    // Custom completion provider for AI suggestions
    const disposable = languages.registerCompletionItemProvider(file.language, {
      triggerCharacters: ['.', ' ', '(', '\n'],
      provideCompletionItems: async (_model, position, _context, _token) => {
        try {
          // Get AI completion suggestions
          const completions = await deepSeekService.getCodeCompletion(
            file.content,
            file.language || 'javascript',
            { line: position.lineNumber, column: position.column }
          );

          return {
            suggestions: completions.map((completion, index) => {
              const firstLine = completion.text.split('\n')[0];
              return {
                label: `AI: ${firstLine ? firstLine.substring(0, 50) : ''}...`,
                kind: languages.CompletionItemKind.Snippet,
                insertText: completion.text,
                insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'DeepSeek AI Suggestion',
                documentation: 'AI-generated code completion',
                sortText: `00${index}`,
                range: completion.range,
              };
            }),
          };
        } catch (error) {
          console.error('AI completion error:', error);
          return { suggestions: [] };
        }
      },
    });

    // Clean up on unmount
    return disposable;
  };

  const triggerAiCompletion = async () => {
    if (!editorRef.current) {
      return;
    }

    setShowAiStatus(true);
    setAiSuggestion('Generating AI suggestion...');

    try {
      const model = editorRef.current.getModel();
      const position = editorRef.current.getPosition();

      if (model && position) {
        const completions = await deepSeekService.getCodeCompletion(
          model.getValue(),
          file.language,
          { line: position.lineNumber, column: position.column }
        );

        if (completions.length > 0) {
          const suggestion = completions[0];
          if (suggestion) {
            setAiSuggestion('AI suggestion ready (Tab to accept)');

            // Insert the suggestion
            editorRef.current.executeEdits('ai-completion', [
              {
                range: new Range(
                  suggestion.range.startLineNumber,
                  suggestion.range.startColumn,
                  suggestion.range.endLineNumber,
                  suggestion.range.endColumn
                ),
                text: suggestion.text,
              },
            ]);
          }
        }
      }
    } catch (error) {
      setAiSuggestion('AI completion failed');
      console.error('AI completion error:', error);
    }

    setTimeout(() => setShowAiStatus(false), 3000);
  };

  const toggleComment = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.commentLine')?.run();
    }
  };

  const duplicateLine = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.copyLinesDownAction')?.run();
    }
  };

  const moveLineUp = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.moveLinesUpAction')?.run();
    }
  };

  const moveLineDown = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.moveLinesDownAction')?.run();
    }
  };

  // Find/Replace handlers
  const clearFindDecorations = () => {
    if (editorRef.current) {
      editorRef.current.deltaDecorations(decorationsRef.current, []);
      decorationsRef.current = [];
    }
  };

  const handleFind = (query: string, options: FindOptions) => {
    if (!editorRef.current) {
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    clearFindDecorations();

    const matches = model.findMatches(
      query,
      true,
      options.regex,
      options.caseSensitive,
      options.wholeWord ? '\\b' : null,
      true
    );

    const decorations = matches.map((match) => ({
      range: match.range,
      options: {
        className: 'find-match-decoration',
        overviewRuler: {
          color: 'rgba(139, 92, 246, 0.8)',
          position: editor.OverviewRulerLane.Right,
        },
      },
    }));

    decorationsRef.current = editorRef.current.deltaDecorations([], decorations);
    setFindMatches({ current: matches.length > 0 ? 1 : 0, total: matches.length });

    if (matches.length > 0) {
      const firstMatch = matches[0];
      if (firstMatch) {
        editorRef.current.revealRangeInCenter(firstMatch.range);
        editorRef.current.setSelection(firstMatch.range);
      }
    }
  };

  const handleReplace = (query: string, replacement: string, options: FindOptions) => {
    if (!editorRef.current) {
      return;
    }

    const selection = editorRef.current.getSelection();
    if (!selection) {
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    const match = model.findMatches(
      query,
      selection,
      options.regex,
      options.caseSensitive,
      options.wholeWord ? '\\b' : null,
      false
    )[0];

    if (match) {
      editorRef.current.executeEdits('replace', [
        {
          range: match.range,
          text: replacement,
        },
      ]);
      handleFind(query, options);
    }
  };

  const handleReplaceAll = (query: string, replacement: string, options: FindOptions) => {
    if (!editorRef.current) {
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    const matches = model.findMatches(
      query,
      true,
      options.regex,
      options.caseSensitive,
      options.wholeWord ? '\\b' : null,
      true
    );

    const edits = matches.map((match) => ({
      range: match.range,
      text: replacement,
    }));

    editorRef.current.executeEdits('replaceAll', edits);
    clearFindDecorations();
    setFindMatches({ current: 0, total: 0 });
  };

  const handleFindNext = () => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.getAction('actions.find')?.run();
  };

  const handleFindPrevious = () => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.getAction('editor.action.previousMatchFindAction')?.run();
  };

  return (
    <EditorContainer>
      <FileTabs
        files={openFiles}
        activeFile={file}
        onFileSelect={onFileSelect}
        onCloseFile={onCloseFile}
      />

      <MonacoContainer>
        <MonacoEditor
          language={file.language}
          value={file.content}
          onChange={(value) => onFileChange(value || '')}
          onMount={handleEditorDidMount}
          theme={settings?.theme === 'light' ? 'vs' : 'vs-dark'}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: settings?.fontSize || 14,
            fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
            fontLigatures: true,
            minimap: {
              enabled: settings?.minimap !== false,
              maxColumn: 120,
              renderCharacters: false,
              showSlider: 'always',
            },
            wordWrap: settings?.wordWrap ? 'on' : 'off',
            tabSize: settings?.tabSize || 2,
            lineNumbers: 'on',
            lineDecorationsWidth: 12,
            lineNumbersMinChars: 4,
            glyphMargin: true,
            folding: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            contextmenu: true,
            mouseWheelZoom: true,
            multiCursorModifier: 'ctrlCmd',
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            codeLens: true,
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            roundedSelection: true,
            matchBrackets: 'always',
            colorDecorators: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
              highlightActiveIndentation: true,
            },
            inlineSuggest: { enabled: true },
            stickyScroll: { enabled: true },
          }}
        />

        <StatusOverlay
          visible={showAiStatus}
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{
            opacity: showAiStatus ? 1 : 0,
            scale: showAiStatus ? 1 : 0.8,
            y: showAiStatus ? 0 : -10,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {aiSuggestion}
        </StatusOverlay>

        <FindReplace
          isOpen={findReplaceOpen}
          onClose={() => {
            setFindReplaceOpen(false);
            clearFindDecorations();
          }}
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onFindNext={handleFindNext}
          onFindPrevious={handleFindPrevious}
          currentMatch={findMatches.current}
          totalMatches={findMatches.total}
        />

        {/* Multi-cursor indicator */}
        {/* Multi-cursor indicator disabled for now */}
        {/* {cursors.length > 1 && (
          <div style={{ 
            position: 'absolute', 
            bottom: '10px', 
            right: '10px',
            zIndex: 1000
          }}>
            <MultiCursorIndicator 
              cursorCount={cursors.length}
            />
          </div>
        )} */}
      </MonacoContainer>
    </EditorContainer>
  );
};

export default Editor;
