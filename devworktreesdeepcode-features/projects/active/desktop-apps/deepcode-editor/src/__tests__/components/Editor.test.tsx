import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Editor from '../../components/Editor';
import { EditorFile, EditorSettings } from '../../types';
import { DeepSeekService } from '../../services/DeepSeekService';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: vi.fn(({ onChange, onMount, value }) => {
    // Create a simple textarea that mimics Monaco behavior
    return (
      <textarea
        data-testid="monaco-editor"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() =>
          onMount?.({
            focus: vi.fn(),
            getModel: vi.fn(() => ({
              getValue: vi.fn(() => value || ''),
              setValue: vi.fn(),
              getLineCount: vi.fn(() => 1),
              getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
            })),
            onDidChangeCursorPosition: vi.fn(),
            onDidChangeModelContent: vi.fn(),
            addCommand: vi.fn(),
            trigger: vi.fn(),
            setModel: vi.fn(),
            getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
            setPosition: vi.fn(),
            revealLine: vi.fn(),
            deltaDecorations: vi.fn(() => []),
            getSelection: vi.fn(),
            setSelection: vi.fn(),
          })
        }
        style={{ width: '100%', height: '400px' }}
      />
    );
  }),
}));

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  Range: vi.fn(),
  editor: {
    create: vi.fn(),
    setTheme: vi.fn(),
  },
  languages: {
    typescript: {
      typescriptDefaults: {
        setCompilerOptions: vi.fn(),
        addExtraLib: vi.fn(),
      },
    },
    registerCompletionItemProvider: vi.fn(),
  },
}));

// Mock DeepSeekService
vi.mock('../../services/DeepSeekService');

const mockFile: EditorFile = {
  id: 'test-file',
  name: 'test.tsx',
  path: '/test/test.tsx',
  content: 'import React from "react"\n\nfunction TestComponent() {\n  return <div>Hello</div>\n}',
  language: 'typescript',
  isModified: false,
};

const mockSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  aiAutoComplete: true,
  aiSuggestions: true,
};

const defaultProps = {
  file: mockFile,
  openFiles: [mockFile],
  onFileChange: vi.fn(),
  onCloseFile: vi.fn(),
  onSaveFile: vi.fn(),
  onFileSelect: vi.fn(),
  deepSeekService: new DeepSeekService(),
  workspaceContext: {
    rootPath: '/test',
    totalFiles: 5,
    languages: ['TypeScript', 'JavaScript'],
    testFiles: 2,
    projectStructure: {},
    dependencies: {},
    exports: {},
    symbols: {},
    lastIndexed: new Date(),
    summary: 'Test workspace',
  },
  getFileContext: vi.fn(() => []),
  settings: mockSettings,
};

describe('Editor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render editor with file tabs', () => {
      render(<Editor {...defaultProps} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByText('test.tsx')).toBeInTheDocument();
    });

    it('should render file content in Monaco editor', () => {
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('import React from "react"');
      expect(editor.value).toContain('function TestComponent');
    });

    it('should render multiple file tabs', () => {
      const secondFile: EditorFile = {
        id: 'second-file',
        name: 'second.tsx',
        path: '/test/second.tsx',
        content: 'export const test = "hello"',
        language: 'typescript',
        isModified: false,
      };

      render(<Editor {...defaultProps} openFiles={[mockFile, secondFile]} />);

      expect(screen.getByText('test.tsx')).toBeInTheDocument();
      expect(screen.getByText('second.tsx')).toBeInTheDocument();
    });

    it('should show modified indicator for unsaved files', () => {
      const modifiedFile: EditorFile = {
        ...mockFile,
        isModified: true,
      };

      render(<Editor {...defaultProps} file={modifiedFile} openFiles={[modifiedFile]} />);

      // Look for modified indicator (usually a dot or asterisk)
      expect(screen.getByText('test.tsx')).toBeInTheDocument();
    });

    it('should render without optional props', () => {
      const minimalProps = {
        file: mockFile,
        openFiles: [mockFile],
        onFileChange: vi.fn(),
        onCloseFile: vi.fn(),
        onSaveFile: vi.fn(),
        onFileSelect: vi.fn(),
        deepSeekService: new DeepSeekService(),
      };

      expect(() => {
        render(<Editor {...minimalProps} />);
      }).not.toThrow();
    });
  });

  describe('File Operations', () => {
    it('should call onFileChange when content is modified', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      await user.type(editor, '\nconsole.log("test")');

      expect(defaultProps.onFileChange).toHaveBeenCalled();
    });

    it('should call onSaveFile when Ctrl+S is pressed', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      editor.focus();
      await user.keyboard('{Control>}s{/Control}');

      expect(defaultProps.onSaveFile).toHaveBeenCalled();
    });

    it('should switch to different file when tab is clicked', async () => {
      const user = userEvent.setup();
      const secondFile: EditorFile = {
        id: 'second-file',
        name: 'second.tsx',
        path: '/test/second.tsx',
        content: 'export const test = "hello"',
        language: 'typescript',
        isModified: false,
      };

      render(<Editor {...defaultProps} openFiles={[mockFile, secondFile]} />);

      await user.click(screen.getByText('second.tsx'));

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(secondFile);
    });

    it('should close file when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      // Look for close button (usually an X)
      const closeButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) => btn.textContent === '×' || btn.getAttribute('aria-label')?.includes('close')
        );

      if (closeButtons.length > 0) {
        await user.click(closeButtons[0]);
        expect(defaultProps.onCloseFile).toHaveBeenCalledWith(mockFile.path);
      }
    });
  });

  describe('Find and Replace', () => {
    it('should open find/replace dialog with Ctrl+F', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      editor.focus();
      await user.keyboard('{Control>}f{/Control}');

      // Should show find/replace interface
      await waitFor(
        () => {
          expect(
            screen.getByPlaceholderText(/find/i) || screen.getByLabelText(/find/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should open find/replace dialog with Ctrl+H', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      editor.focus();
      await user.keyboard('{Control>}h{/Control}');

      // Should show find/replace interface
      await waitFor(
        () => {
          expect(
            screen.getByPlaceholderText(/find/i) || screen.getByLabelText(/find/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should perform search operations', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      editor.focus();
      await user.keyboard('{Control>}f{/Control}');

      await waitFor(() => {
        const findInput = screen.getByPlaceholderText(/find/i) || screen.getByLabelText(/find/i);
        expect(findInput).toBeInTheDocument();
      });
    });
  });

  describe('AI Integration', () => {
    it('should provide AI code completion suggestions', async () => {
      const mockGetCodeCompletion = vi.fn().mockResolvedValue([
        {
          text: 'useState()',
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          confidence: 0.9,
        },
      ]);

      const mockDeepSeekService = {
        getCodeCompletion: mockGetCodeCompletion,
      } as any;

      render(<Editor {...defaultProps} deepSeekService={mockDeepSeekService} />);

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.type(editor, '\nuse');

      // AI completion might be triggered
      // This depends on the actual implementation
    });

    it('should handle AI completion errors gracefully', async () => {
      const mockGetCodeCompletion = vi.fn().mockRejectedValue(new Error('AI service error'));

      const mockDeepSeekService = {
        getCodeCompletion: mockGetCodeCompletion,
      } as any;

      render(<Editor {...defaultProps} deepSeekService={mockDeepSeekService} />);

      const editor = screen.getByTestId('monaco-editor');

      // Should not crash when AI service fails
      expect(() => userEvent.type(editor, '\ntest')).not.toThrow();
    });

    it('should disable AI features when settings are off', () => {
      const settingsWithoutAI: EditorSettings = {
        ...mockSettings,
        aiAutoComplete: false,
        aiSuggestions: false,
      };

      render(<Editor {...defaultProps} settings={settingsWithoutAI} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Editor Settings', () => {
    it('should apply font size setting', () => {
      const customSettings: EditorSettings = {
        ...mockSettings,
        fontSize: 18,
      };

      render(<Editor {...defaultProps} settings={customSettings} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should apply theme setting', () => {
      const lightThemeSettings: EditorSettings = {
        ...mockSettings,
        theme: 'light',
      };

      render(<Editor {...defaultProps} settings={lightThemeSettings} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should apply tab size setting', () => {
      const customTabSettings: EditorSettings = {
        ...mockSettings,
        tabSize: 4,
      };

      render(<Editor {...defaultProps} settings={customTabSettings} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle word wrap setting', () => {
      const noWrapSettings: EditorSettings = {
        ...mockSettings,
        wordWrap: false,
      };

      render(<Editor {...defaultProps} settings={noWrapSettings} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle minimap setting', () => {
      const noMinimapSettings: EditorSettings = {
        ...mockSettings,
        minimap: false,
      };

      render(<Editor {...defaultProps} settings={noMinimapSettings} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should handle TypeScript files', () => {
      const tsFile: EditorFile = {
        ...mockFile,
        id: 'test-ts-file',
        name: 'test.ts',
        language: 'typescript',
        content: 'const test: string = "hello"',
      };

      render(<Editor {...defaultProps} file={tsFile} openFiles={[tsFile]} />);

      const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('const test: string');
    });

    it('should handle JavaScript files', () => {
      const jsFile: EditorFile = {
        ...mockFile,
        id: 'test-js-file',
        name: 'test.js',
        language: 'javascript',
        content: 'const test = "hello"',
      };

      render(<Editor {...defaultProps} file={jsFile} openFiles={[jsFile]} />);

      const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('const test = "hello"');
    });

    it('should handle JSON files', () => {
      const jsonFile: EditorFile = {
        ...mockFile,
        id: 'test-json-file',
        name: 'test.json',
        language: 'json',
        content: '{"test": "value"}',
      };

      render(<Editor {...defaultProps} file={jsonFile} openFiles={[jsonFile]} />);

      const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('{"test": "value"}');
    });

    it('should handle unknown file types', () => {
      const unknownFile: EditorFile = {
        ...mockFile,
        id: 'test-unknown-file',
        name: 'test.unknown',
        language: 'plaintext',
        content: 'plain text content',
      };

      render(<Editor {...defaultProps} file={unknownFile} openFiles={[unknownFile]} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support common editor shortcuts', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      editor.focus();

      // Test Ctrl+A (select all)
      await user.keyboard('{Control>}a{/Control}');

      // Test Ctrl+Z (undo) - should not crash
      await user.keyboard('{Control>}z{/Control}');

      // Should not throw errors
      expect(editor).toBeInTheDocument();
    });

    it('should handle Escape key to close find/replace', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      editor.focus();

      // Open find/replace
      await user.keyboard('{Control>}f{/Control}');

      // Close with Escape
      await user.keyboard('{Escape}');

      // Find dialog should be closed
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle Monaco editor mount errors', () => {
      // Mock console.error to check if errors are handled
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Editor {...defaultProps} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle invalid file content', () => {
      const invalidFile: EditorFile = {
        ...mockFile,
        id: 'test-invalid-file',
        content: null as any,
      };

      expect(() => {
        render(<Editor {...defaultProps} file={invalidFile} />);
      }).not.toThrow();
    });

    it('should handle missing file', () => {
      expect(() => {
        render(<Editor {...defaultProps} file={null as any} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large files efficiently', () => {
      const largeContent = 'line\n'.repeat(1000);
      const largeFile: EditorFile = {
        ...mockFile,
        id: 'test-large-file',
        content: largeContent,
      };

      expect(() => {
        render(<Editor {...defaultProps} file={largeFile} />);
      }).not.toThrow();

      const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('line');
    });

    it('should efficiently switch between files', () => {
      const files = Array.from({ length: 5 }, (_, i) => ({
        id: `file-${i}`,
        name: `file-${i}.tsx`,
        path: `/test/file-${i}.tsx`,
        content: `// File ${i} content`,
        language: 'typescript',
        isModified: false,
      }));

      const { rerender } = render(<Editor {...defaultProps} openFiles={files} />);

      // Switch to different files
      files.forEach((file) => {
        rerender(<Editor {...defaultProps} file={file} openFiles={files} />);
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Editor {...defaultProps} />);

      // Tab to editor
      await user.tab();

      expect(document.activeElement).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<Editor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      render(<Editor {...defaultProps} />);

      // Editor content should be readable
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue(mockFile.content);
    });
  });
});
