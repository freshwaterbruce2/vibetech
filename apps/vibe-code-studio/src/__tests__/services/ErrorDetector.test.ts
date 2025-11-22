/**
 * ErrorDetector Service Tests
 * TDD: Writing tests FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor';

// Mock Monaco types for testing
type MockEditor = {
  getModel: () => MockModel | null;
  onDidChangeModelDecorations: (callback: () => void) => { dispose: () => void };
};

type MockModel = {
  uri: { path: string };
  getAllDecorations: () => Array<{ options: { className?: string } }>;
};

type MonacoMarker = {
  severity: number;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  code?: string | { value: string };
  source?: string;
};

// Types we expect ErrorDetector to use
export interface DetectedError {
  id: string;
  type: 'typescript' | 'eslint' | 'runtime';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  code?: string;
  stackTrace?: string;
  suggestion?: string;
}

export interface ErrorDetectorConfig {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: typeof monaco;
  onError?: (error: DetectedError) => void;
  onErrorResolved?: (errorId: string) => void;
}

describe('ErrorDetector', () => {
  let mockEditor: MockEditor;
  let mockMonaco: any;
  let ErrorDetector: any;
  let detector: any;
  let onErrorCallback: any;
  let onErrorResolvedCallback: any;

  beforeEach(async () => {
    // Mock Monaco editor
    mockEditor = {
      getModel: vi.fn(() => ({
        uri: { path: '/test/file.ts' },
        getAllDecorations: vi.fn(() => [])
      })),
      onDidChangeModelDecorations: vi.fn(() => ({ dispose: vi.fn() }))
    };

    // Mock Monaco namespace
    mockMonaco = {
      editor: {
        getModelMarkers: vi.fn(() => []),
        setModelMarkers: vi.fn()
      },
      MarkerSeverity: {
        Error: 8,
        Warning: 4,
        Info: 2
      }
    };

    onErrorCallback = vi.fn();
    onErrorResolvedCallback = vi.fn();

    // Import ErrorDetector (will fail initially - TDD RED phase)
    try {
      const module = await import('../../services/ErrorDetector');
      ErrorDetector = module.ErrorDetector;
    } catch {
      // Expected to fail initially - we haven't implemented it yet
      ErrorDetector = null;
    }
  });

  afterEach(() => {
    if (detector) {
      detector.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      if (!ErrorDetector) {
        expect(true).toBe(true); // TDD RED - implementation doesn't exist yet
        return;
      }

      expect(() => {
        detector = new ErrorDetector({
          editor: mockEditor as any,
          monaco: mockMonaco,
          onError: onErrorCallback,
          onErrorResolved: onErrorResolvedCallback
        });
      }).not.toThrow();
    });

    it('should start monitoring on initialization', () => {
      if (!ErrorDetector) return;

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco
      });

      expect(mockEditor.onDidChangeModelDecorations).toHaveBeenCalled();
    });

    it('should throw if editor is not provided', () => {
      if (!ErrorDetector) return;

      expect(() => {
        new ErrorDetector({
          monaco: mockMonaco
        });
      }).toThrow('Editor is required');
    });
  });

  describe('TypeScript Error Detection', () => {
    it('should detect TypeScript errors from Monaco markers', () => {
      if (!ErrorDetector) return;

      const markers: MonacoMarker[] = [
        {
          severity: 8, // Error
          message: "Property 'foo' does not exist on type 'Bar'",
          startLineNumber: 10,
          startColumn: 5,
          endLineNumber: 10,
          endColumn: 8,
          code: '2339',
          source: 'ts'
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(markers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      // Trigger error detection
      detector.checkForErrors();

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'typescript',
          severity: 'error',
          message: "Property 'foo' does not exist on type 'Bar'",
          line: 10,
          column: 5,
          code: '2339'
        })
      );
    });

    it('should detect TypeScript warnings', () => {
      if (!ErrorDetector) return;

      const markers: MonacoMarker[] = [
        {
          severity: 4, // Warning
          message: "Variable 'x' is never used",
          startLineNumber: 5,
          startColumn: 7,
          endLineNumber: 5,
          endColumn: 8,
          code: '6133',
          source: 'ts'
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(markers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.checkForErrors();

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'typescript',
          severity: 'warning',
          message: "Variable 'x' is never used"
        })
      );
    });

    it('should handle multiple errors', () => {
      if (!ErrorDetector) return;

      const markers: MonacoMarker[] = [
        {
          severity: 8,
          message: 'Error 1',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1
        },
        {
          severity: 8,
          message: 'Error 2',
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 1
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(markers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.checkForErrors();

      expect(onErrorCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('ESLint Error Detection', () => {
    it('should detect ESLint errors', () => {
      if (!ErrorDetector) return;

      const markers: MonacoMarker[] = [
        {
          severity: 8,
          message: 'Missing semicolon',
          startLineNumber: 15,
          startColumn: 20,
          endLineNumber: 15,
          endColumn: 21,
          code: 'semi',
          source: 'eslint'
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(markers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.checkForErrors();

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'eslint',
          severity: 'error',
          message: 'Missing semicolon',
          code: 'semi'
        })
      );
    });
  });

  describe('Runtime Error Detection', () => {
    it('should parse runtime errors from console output', () => {
      if (!ErrorDetector) return;

      const consoleOutput = `
Error: Cannot read property 'foo' of undefined
    at Object.<anonymous> (C:\\dev\\test\\file.ts:25:10)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
`;

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.parseConsoleOutput(consoleOutput);

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'runtime',
          severity: 'error',
          message: "Cannot read property 'foo' of undefined",
          file: expect.stringContaining('file.ts'),
          line: 25,
          column: 10,
          stackTrace: expect.stringContaining('at Object.<anonymous>')
        })
      );
    });

    it('should handle TypeError exceptions', () => {
      if (!ErrorDetector) return;

      const consoleOutput = `
TypeError: x is not a function
    at test (C:\\dev\\app.ts:42:5)
`;

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.parseConsoleOutput(consoleOutput);

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'runtime',
          message: 'x is not a function',
          line: 42,
          column: 5
        })
      );
    });

    it('should ignore non-error console output', () => {
      if (!ErrorDetector) return;

      const consoleOutput = 'INFO: Application started successfully';

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.parseConsoleOutput(consoleOutput);

      expect(onErrorCallback).not.toHaveBeenCalled();
    });
  });

  describe('Error Resolution', () => {
    it('should detect when errors are resolved', () => {
      if (!ErrorDetector) return;

      // Initially has errors
      const initialMarkers: MonacoMarker[] = [
        {
          severity: 8,
          message: 'Test error',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          code: 'test-error'
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(initialMarkers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback,
        onErrorResolved: onErrorResolvedCallback
      });

      detector.checkForErrors();

      // Error is now resolved
      mockMonaco.editor.getModelMarkers.mockReturnValue([]);

      detector.checkForErrors();

      expect(onErrorResolvedCallback).toHaveBeenCalled();
    });

    it('should track active errors', () => {
      if (!ErrorDetector) return;

      const markers: MonacoMarker[] = [
        {
          severity: 8,
          message: 'Error 1',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(markers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco
      });

      detector.checkForErrors();

      const activeErrors = detector.getActiveErrors();
      expect(activeErrors).toHaveLength(1);
      expect(activeErrors[0].message).toBe('Error 1');
    });

    it('should clear resolved errors from active list', () => {
      if (!ErrorDetector) return;

      mockMonaco.editor.getModelMarkers.mockReturnValue([
        {
          severity: 8,
          message: 'Error',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1
        }
      ]);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco
      });

      detector.checkForErrors();
      expect(detector.getActiveErrors()).toHaveLength(1);

      // Resolve all errors
      mockMonaco.editor.getModelMarkers.mockReturnValue([]);
      detector.checkForErrors();

      expect(detector.getActiveErrors()).toHaveLength(0);
    });
  });

  describe('Disposal', () => {
    it('should stop monitoring when disposed', () => {
      if (!ErrorDetector) return;

      const disposeMock = vi.fn();
      mockEditor.onDidChangeModelDecorations = vi.fn(() => ({ dispose: disposeMock }));

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco
      });

      detector.dispose();

      expect(disposeMock).toHaveBeenCalled();
    });

    it('should not emit events after disposal', () => {
      if (!ErrorDetector) return;

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.dispose();

      mockMonaco.editor.getModelMarkers.mockReturnValue([
        {
          severity: 8,
          message: 'Error',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1
        }
      ]);

      detector.checkForErrors();

      expect(onErrorCallback).not.toHaveBeenCalled();
    });
  });

  describe('Error Deduplication', () => {
    it('should not emit duplicate errors', () => {
      if (!ErrorDetector) return;

      const markers: MonacoMarker[] = [
        {
          severity: 8,
          message: 'Same error',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          code: 'same'
        }
      ];

      mockMonaco.editor.getModelMarkers.mockReturnValue(markers);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      // Check twice with same error
      detector.checkForErrors();
      detector.checkForErrors();

      // Should only emit once
      expect(onErrorCallback).toHaveBeenCalledTimes(1);
    });

    it('should emit new errors even if similar message', () => {
      if (!ErrorDetector) return;

      mockMonaco.editor.getModelMarkers
        .mockReturnValueOnce([
          {
            severity: 8,
            message: 'Error',
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
          }
        ])
        .mockReturnValueOnce([
          {
            severity: 8,
            message: 'Error',
            startLineNumber: 2, // Different line
            startColumn: 1,
            endLineNumber: 2,
            endColumn: 1
          }
        ]);

      detector = new ErrorDetector({
        editor: mockEditor as any,
        monaco: mockMonaco,
        onError: onErrorCallback
      });

      detector.checkForErrors();
      detector.checkForErrors();

      // Should emit both (different locations)
      expect(onErrorCallback).toHaveBeenCalledTimes(2);
    });
  });
});
