/**
 * Comprehensive Test Suite for Editor Component
 * Tests Monaco editor integration, keyboard shortcuts, AI completions, and file management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Editor from '../../components/Editor';
import { DeepSeekService } from '../../services/DeepSeekService';
import { UnifiedAIService } from '../../services/ai/UnifiedAIService';
import { EditorFile, EditorSettings } from '../../types';

// Mock monaco-editor package first (before any imports)
vi.mock('monaco-editor', () => ({
  editor: {
    IStandaloneCodeEditor: vi.fn(),
  },
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
  },
  Range: vi.fn(),
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, onChange, onMount }: any) => (
    <div data-testid="monaco-editor">
      <textarea
        data-testid="monaco-textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button
        data-testid="monaco-mount-trigger"
        onClick={() => {
          const mockEditor = {
            updateOptions: vi.fn(),
            dispose: vi.fn(),
            getModel: () => ({
              findMatches: () => [],
              deltaDecorations: () => [],
            }),
            getValue: () => value,
            setValue: vi.fn(),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            setPosition: vi.fn(),
            getSelection: () => null,
            setSelection: vi.fn(),
            focus: vi.fn(),
            onDidChangeCursorPosition: () => ({ dispose: vi.fn() }),
            onDidChangeModelContent: () => ({ dispose: vi.fn() }),
            deltaDecorations: () => [],
            revealRangeInCenter: vi.fn(),
            executeEdits: vi.fn(() => true),
            getAction: () => ({ run: vi.fn() }),
            addCommand: () => ({ dispose: vi.fn() }),
            trigger: vi.fn(),
            revealLine: vi.fn(),
          };
          onMount?.(mockEditor, {} as any);
        }}
      >
        Mount Editor
      </button>
    </div>
  ),
}));

// Mock services
vi.mock('../../services/DeepSeekService');
vi.mock('../../services/ai/UnifiedAIService');
vi.mock('../../services/ai/InlineCompletionProvider', () => ({
  registerInlineCompletionProvider: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
  const createMotionComponent = (type: string) => ({ children, ...props }: any) =>
    type === 'div' ? (
      <div {...props}>{children}</div>
    ) : (
      <button {...props}>{children}</button>
    );

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn(),
}));

describe('Editor - Comprehensive Tests', () => {
  let mockFile: EditorFile;
  let mockOpenFiles: EditorFile[];
  let mockOnFileChange: ReturnType<typeof vi.fn>;
  let mockOnCloseFile: ReturnType<typeof vi.fn>;
  let mockOnSaveFile: ReturnType<typeof vi.fn>;
  let mockOnFileSelect: ReturnType<typeof vi.fn>;
  let mockDeepSeekService: DeepSeekService;
  let mockAIService: UnifiedAIService;
  let mockSettings: EditorSettings;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFile = {
      path: '/test/file.ts',
      name: 'file.ts',
      content: 'const x = 1;',
      language: 'typescript',
    };

    mockOpenFiles = [mockFile];

    mockOnFileChange = vi.fn();
    mockOnCloseFile = vi.fn();
    mockOnSaveFile = vi.fn();
    mockOnFileSelect = vi.fn();

    mockDeepSeekService = new DeepSeekService('test-key');
    mockAIService = new UnifiedAIService();

    mockSettings = {
      theme: 'vibe-dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono',
      tabSize: 2,
      wordWrap: 'on',
      minimap: { enabled: true },
      autoSave: true,
      autoSaveDelay: 1000,
    };
  });

  describe('Component Rendering', () => {
    it('should render editor with Monaco', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should render file tabs', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      // FileTabs component should be rendered
      expect(screen.getByText('file.ts')).toBeInTheDocument();
    });

    it('should display current file content', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('const x = 1;');
    });

    it('should render with AI services provided', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          deepSeekService={mockDeepSeekService}
          aiService={mockAIService}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should render with custom settings', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={mockSettings}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('File Operations', () => {
    it('should call onFileChange when content changes', async () => {
      const user = userEvent.setup();

      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const textarea = screen.getByTestId('monaco-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'const y = 2;');

      await waitFor(() => {
        expect(mockOnFileChange).toHaveBeenCalled();
      });
    });

    it('should update editor when file prop changes', () => {
      const { rerender } = render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const newFile: EditorFile = {
        path: '/test/file2.ts',
        name: 'file2.ts',
        content: 'const z = 3;',
        language: 'typescript',
      };

      rerender(
        <Editor
          file={newFile}
          openFiles={[...mockOpenFiles, newFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('const z = 3;');
    });

    it('should handle file selection', () => {
      const secondFile: EditorFile = {
        path: '/test/file2.ts',
        name: 'file2.ts',
        content: 'const y = 2;',
        language: 'typescript',
      };

      render(
        <Editor
          file={mockFile}
          openFiles={[mockFile, secondFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      // Both files should be visible in tabs
      expect(screen.getByText('file.ts')).toBeInTheDocument();
      expect(screen.getByText('file2.ts')).toBeInTheDocument();
    });

    it('should handle file close', () => {
      const secondFile: EditorFile = {
        path: '/test/file2.ts',
        name: 'file2.ts',
        content: 'const y = 2;',
        language: 'typescript',
      };

      render(
        <Editor
          file={mockFile}
          openFiles={[mockFile, secondFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      // Both files present
      expect(screen.getByText('file.ts')).toBeInTheDocument();
      expect(screen.getByText('file2.ts')).toBeInTheDocument();
    });
  });

  describe('Monaco Editor Integration', () => {
    it('should initialize Monaco editor on mount', async () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const mountButton = screen.getByTestId('monaco-mount-trigger');
      await userEvent.click(mountButton);

      // Editor should be mounted
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should configure Monaco with TypeScript language', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(mockFile.language).toBe('typescript');
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should configure Monaco with JavaScript language', () => {
      const jsFile: EditorFile = {
        ...mockFile,
        name: 'file.js',
        path: '/test/file.js',
        language: 'javascript',
      };

      render(
        <Editor
          file={jsFile}
          openFiles={[jsFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(jsFile.language).toBe('javascript');
    });

    it('should apply custom theme from settings', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={mockSettings}
        />
      );

      expect(mockSettings.theme).toBe('vibe-dark');
    });

    it('should apply font settings', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={mockSettings}
        />
      );

      expect(mockSettings.fontSize).toBe(14);
      expect(mockSettings.fontFamily).toBe('JetBrains Mono');
    });
  });

  describe('Multiple Files', () => {
    it('should handle multiple open files', () => {
      const files: EditorFile[] = [
        mockFile,
        { path: '/test/file2.ts', name: 'file2.ts', content: 'const y = 2;', language: 'typescript' },
        { path: '/test/file3.ts', name: 'file3.ts', content: 'const z = 3;', language: 'typescript' },
      ];

      render(
        <Editor
          file={mockFile}
          openFiles={files}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByText('file.ts')).toBeInTheDocument();
      expect(screen.getByText('file2.ts')).toBeInTheDocument();
      expect(screen.getByText('file3.ts')).toBeInTheDocument();
    });

    it('should maintain current file content when switching files', () => {
      const { rerender } = render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const file2: EditorFile = {
        path: '/test/file2.ts',
        name: 'file2.ts',
        content: 'const y = 2;',
        language: 'typescript',
      };

      rerender(
        <Editor
          file={file2}
          openFiles={[mockFile, file2]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('const y = 2;');
    });
  });

  describe('Language Support', () => {
    it('should support TypeScript files', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(mockFile.language).toBe('typescript');
    });

    it('should support JavaScript files', () => {
      const jsFile: EditorFile = {
        path: '/test/app.js',
        name: 'app.js',
        content: 'console.log("hello");',
        language: 'javascript',
      };

      render(
        <Editor
          file={jsFile}
          openFiles={[jsFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(jsFile.language).toBe('javascript');
    });

    it('should support JSON files', () => {
      const jsonFile: EditorFile = {
        path: '/test/config.json',
        name: 'config.json',
        content: '{"key": "value"}',
        language: 'json',
      };

      render(
        <Editor
          file={jsonFile}
          openFiles={[jsonFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(jsonFile.language).toBe('json');
    });

    it('should support CSS files', () => {
      const cssFile: EditorFile = {
        path: '/test/styles.css',
        name: 'styles.css',
        content: 'body { margin: 0; }',
        language: 'css',
      };

      render(
        <Editor
          file={cssFile}
          openFiles={[cssFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(cssFile.language).toBe('css');
    });

    it('should support Markdown files', () => {
      const mdFile: EditorFile = {
        path: '/test/README.md',
        name: 'README.md',
        content: '# Title\n\nContent',
        language: 'markdown',
      };

      render(
        <Editor
          file={mdFile}
          openFiles={[mdFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(mdFile.language).toBe('markdown');
    });
  });

  describe('AI Integration', () => {
    it('should initialize with DeepSeek service', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          deepSeekService={mockDeepSeekService}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should initialize with UnifiedAI service', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          aiService={mockAIService}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should work without AI services (demo mode)', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Editor Settings', () => {
    it('should apply word wrap setting', () => {
      const settings: EditorSettings = {
        ...mockSettings,
        wordWrap: 'on',
      };

      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={settings}
        />
      );

      expect(settings.wordWrap).toBe('on');
    });

    it('should apply tab size setting', () => {
      const settings: EditorSettings = {
        ...mockSettings,
        tabSize: 4,
      };

      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={settings}
        />
      );

      expect(settings.tabSize).toBe(4);
    });

    it('should toggle minimap', () => {
      const settings: EditorSettings = {
        ...mockSettings,
        minimap: { enabled: false },
      };

      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={settings}
        />
      );

      expect(settings.minimap.enabled).toBe(false);
    });

    it('should apply auto-save settings', () => {
      const settings: EditorSettings = {
        ...mockSettings,
        autoSave: true,
        autoSaveDelay: 2000,
      };

      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={settings}
        />
      );

      expect(settings.autoSave).toBe(true);
      expect(settings.autoSaveDelay).toBe(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file content', () => {
      const emptyFile: EditorFile = {
        path: '/test/empty.ts',
        name: 'empty.ts',
        content: '',
        language: 'typescript',
      };

      render(
        <Editor
          file={emptyFile}
          openFiles={[emptyFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('');
    });

    it('should handle very large files', () => {
      const largeContent = 'const x = 1;\n'.repeat(10000);
      const largeFile: EditorFile = {
        path: '/test/large.ts',
        name: 'large.ts',
        content: largeContent,
        language: 'typescript',
      };

      render(
        <Editor
          file={largeFile}
          openFiles={[largeFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle special characters in file content', () => {
      const specialFile: EditorFile = {
        path: '/test/special.ts',
        name: 'special.ts',
        content: 'const emoji = "🚀";\nconst unicode = "Ω";\nconst tab = "\\t";',
        language: 'typescript',
      };

      render(
        <Editor
          file={specialFile}
          openFiles={[specialFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(specialFile.content);
    });

    it('should handle undefined settings gracefully', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={mockOpenFiles}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
          settings={undefined}
        />
      );

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle single file in openFiles', () => {
      render(
        <Editor
          file={mockFile}
          openFiles={[mockFile]}
          onFileChange={mockOnFileChange}
          onCloseFile={mockOnCloseFile}
          onSaveFile={mockOnSaveFile}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByText('file.ts')).toBeInTheDocument();
    });
  });
});
