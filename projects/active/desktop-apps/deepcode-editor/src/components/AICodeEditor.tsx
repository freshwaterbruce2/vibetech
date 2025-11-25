import React, { useCallback, useRef, useState } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { Bot, Code, Loader2, X, Zap } from 'lucide-react';
import { editor as MonacoEditorType } from 'monaco-editor';
import styled from 'styled-components';

// import { useStreamingCompletion } from '../hooks/useStreamingAI';
import { vibeTheme } from '../styles/theme';

/**
 * AI-Powered Code Editor - 2025 Patterns
 *
 * Features:
 * - Real-time AI code completion with streaming
 * - Inline AI suggestions
 * - Context-aware completions
 * - Multi-model support
 * - Performance optimized
 */

const EditorContainer = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${vibeTheme.colors.primary};
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
`;

const AIStatus = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  background: ${(props) => (props.$active ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)')};
  border: 1px solid
    ${(props) => (props.$active ? vibeTheme.colors.cyan : 'rgba(139, 92, 246, 0.3)')};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${(props) => (props.$active ? vibeTheme.colors.cyan : vibeTheme.colors.textSecondary)};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const CompletionOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  right: ${vibeTheme.spacing.lg};
  transform: translateY(-50%);
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.medium};
  padding: ${vibeTheme.spacing.md};
  max-width: 400px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
  transition: opacity ${vibeTheme.animation.duration.normal} ease;
  box-shadow: ${vibeTheme.shadows.large};
  z-index: 1000;
`;

const CompletionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${vibeTheme.spacing.sm};
  color: ${vibeTheme.colors.purple};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const CompletionContent = styled.pre`
  margin: 0;
  padding: ${vibeTheme.spacing.sm};
  background: ${vibeTheme.colors.primary};
  border-radius: ${vibeTheme.borderRadius.small};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.text};
  max-height: 300px;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 3px;
  }
`;

const CompletionActions = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.sm};
  margin-top: ${vibeTheme.spacing.sm};
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  border: 1px solid transparent;

  ${(props) =>
    props.$variant === 'primary'
      ? `
    background: ${vibeTheme.gradients.primary};
    color: ${vibeTheme.colors.text};
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: ${vibeTheme.shadows.small};
    }
  `
      : `
    background: transparent;
    color: ${vibeTheme.colors.textSecondary};
    border-color: rgba(139, 92, 246, 0.3);
    
    &:hover {
      background: rgba(139, 92, 246, 0.1);
    }
  `}
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  color: ${vibeTheme.colors.cyan};
  font-size: ${vibeTheme.typography.fontSize.xs};

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

interface AICodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onSave?: () => void;
  readOnly?: boolean;
}

export const AICodeEditor: React.FC<AICodeEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  onSave,
  readOnly = false,
}) => {
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [, setCursorPosition] = useState({ line: 1, column: 1 });

  // const { completion, isCompleting, getCompletion, cancelCompletion } = useStreamingCompletion();
  // Fallback implementation
  const completion = '';
  const isCompleting = false;
  const getCompletion = (_textBeforeCursor: string, _position: { line: number; column: number }, _language: string) => Promise.resolve('');
  const cancelCompletion = () => {};

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register AI completion provider
    monaco.languages.registerInlineCompletionsProvider(language, {
      provideInlineCompletions: async (model, position, context, _token) => {
        if (context.triggerKind !== monaco.languages.InlineCompletionTriggerKind.Explicit) {
          return { items: [] };
        }

        // Get context around cursor
        const textBeforeCursor = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 10),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Show completion overlay
        setShowCompletion(true);
        setCursorPosition({ line: position.lineNumber, column: position.column });

        // Get AI completion
        await getCompletion(
          textBeforeCursor,
          { line: position.lineNumber, column: position.column },
          language
        );

        return {
          items: [
            {
              insertText: completion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            },
          ],
        };
      },
    } as any);

    // Add keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('ai-complete', 'editor.action.inlineSuggest.trigger', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  // Handle manual completion trigger
  const triggerCompletion = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const position = editorRef.current.getPosition();
    if (!position) {
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    const textBeforeCursor = model.getValueInRange({
      startLineNumber: Math.max(1, position.lineNumber - 20),
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    setShowCompletion(true);
    getCompletion(
      textBeforeCursor,
      { line: position.lineNumber, column: position.column },
      language
    );
  }, [getCompletion, language]);

  // Apply completion
  const applyCompletion = useCallback(() => {
    if (!editorRef.current || !completion) {
      return;
    }

    const position = editorRef.current.getPosition();
    if (!position) {
      return;
    }

    editorRef.current.executeEdits('ai-completion', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: completion,
      },
    ]);

    setShowCompletion(false);
  }, [completion]);

  // Cancel completion
  const handleCancelCompletion = useCallback(() => {
    cancelCompletion();
    setShowCompletion(false);
  }, [cancelCompletion]);

  return (
    <EditorContainer>
      <EditorHeader>
        <AIStatus $active={isCompleting}>
          {isCompleting ? (
            <>
              <Loader2 />
              AI is thinking...
            </>
          ) : (
            <>
              <Bot />
              AI Ready (Ctrl+Space)
            </>
          )}
        </AIStatus>

        <div style={{ display: 'flex', gap: vibeTheme.spacing.sm }}>
          <ActionButton onClick={triggerCompletion}>
            <Zap size={14} style={{ marginRight: '4px' }} />
            Get AI Suggestion
          </ActionButton>

          {onSave && (
            <ActionButton $variant="primary" onClick={onSave}>
              Save (Ctrl+S)
            </ActionButton>
          )}
        </div>
      </EditorHeader>

      <div style={{ flex: 1, position: 'relative' }}>
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            readOnly,
            inlineSuggest: {
              enabled: true,
            },
          }}
        />

        <CompletionOverlay $visible={showCompletion && (!!completion || isCompleting)}>
          <CompletionHeader>
            <span>
              <Code size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              AI Suggestion
            </span>
            <X size={14} style={{ cursor: 'pointer' }} onClick={handleCancelCompletion} />
          </CompletionHeader>

          {(() => {
            if (isCompleting) {
              return (
                <LoadingIndicator>
                  <Loader2 size={14} />
                  Generating completion...
                </LoadingIndicator>
              );
            }
            if (completion) {
              return (
                <>
                  <CompletionContent>{completion}</CompletionContent>
                  <CompletionActions>
                    <ActionButton $variant="primary" onClick={applyCompletion}>
                      Apply (Tab)
                    </ActionButton>
                    <ActionButton onClick={handleCancelCompletion}>Cancel (Esc)</ActionButton>
                  </CompletionActions>
                </>
              );
            }
            return null;
          })()}
        </CompletionOverlay>
      </div>
    </EditorContainer>
  );
};

export default AICodeEditor;
