/**
 * ErrorDetector - Monitors Monaco editor for TypeScript/ESLint/Runtime errors
 * Updated to support TDD tests and enhanced functionality
 */

import * as monaco from 'monaco-editor';

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
  source?: string;
}

export interface ErrorDetectorConfig {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: typeof monaco;
  onError?: (error: DetectedError) => void;
  onErrorResolved?: (errorId: string) => void;
  minSeverity?: 'error' | 'warning' | 'info'; // Default: 'warning' - ignore info-level
  prioritizeErrors?: boolean; // Default: true - show errors first
  debounceMs?: number; // Default: 300ms - debounce error detection
}

export class ErrorDetector {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private monaco: typeof monaco;
  private onError?: (error: DetectedError) => void;
  private onErrorResolved?: (errorId: string) => void;
  private activeErrors: Map<string, DetectedError> = new Map();
  private disposables: Array<{ dispose: () => void }> = [];
  private isDisposed = false;
  private minSeverity: 'error' | 'warning' | 'info';
  private prioritizeErrors: boolean;
  private debounceMs: number;
  private debounceTimer: NodeJS.Timeout | null = null;

  // Legacy support - listener pattern
  private listeners: Set<(errors: DetectedError[]) => void> = new Set();

  constructor(config: ErrorDetectorConfig) {
    if (!config.editor) {
      throw new Error('Editor is required');
    }

    this.editor = config.editor;
    this.monaco = config.monaco;
    this.onError = config.onError;
    this.onErrorResolved = config.onErrorResolved;
    this.minSeverity = config.minSeverity || 'warning'; // Default: ignore info-level
    this.prioritizeErrors = config.prioritizeErrors !== false; // Default: true
    this.debounceMs = config.debounceMs !== undefined ? config.debounceMs : 300; // Default: 300ms

    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Listen for changes in Monaco decorations (indicates errors changed)
    const disposable = this.editor.onDidChangeModelDecorations(() => {
      this.debouncedCheckForErrors();
    });

    this.disposables.push(disposable);

    // Initial error check (no debounce)
    this.checkForErrors();
  }

  /**
   * Debounced error checking (prevents firing on every keystroke)
   */
  private debouncedCheckForErrors(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.checkForErrors();
      this.debounceTimer = null;
    }, this.debounceMs);
  }

  /**
   * Check for errors in the current editor model
   */
  public checkForErrors(): void {
    if (this.isDisposed) {return;}

    const model = this.editor.getModel();
    if (!model) {return;}

    // Get all markers (TypeScript and ESLint errors)
    const markers = this.monaco.editor.getModelMarkers({ resource: model.uri });

    const currentErrorIds = new Set<string>();

    // Process each marker (filtered by severity)
    for (const marker of markers) {
      const error = this.markerToError(marker, model.uri.path);

      // Filter by minimum severity threshold
      if (!this.shouldIncludeError(error)) {
        continue;
      }

      const errorId = this.generateErrorId(error);
      currentErrorIds.add(errorId);

      // Only emit if this is a new error
      if (!this.activeErrors.has(errorId)) {
        this.activeErrors.set(errorId, error);

        if (this.onError && !this.isDisposed) {
          this.onError(error);
        }
      }
    }

    // Check for resolved errors
    const resolvedErrors: string[] = [];
    for (const [errorId, error] of this.activeErrors.entries()) {
      if (!currentErrorIds.has(errorId)) {
        resolvedErrors.push(errorId);

        if (this.onErrorResolved && !this.isDisposed) {
          this.onErrorResolved(errorId);
        }
      }
    }

    // Remove resolved errors
    for (const errorId of resolvedErrors) {
      this.activeErrors.delete(errorId);
    }

    // Notify legacy listeners
    this.notifyListeners();
  }

  /**
   * Parse console output for runtime errors
   */
  public parseConsoleOutput(output: string): void {
    if (this.isDisposed) {return;}

    // Pattern to match error stack traces
    const errorPattern = /(Error|TypeError|ReferenceError|SyntaxError):\s*(.+)/;
    const stackPattern = /at\s+(?:(.+?)\s+)?\((.+?):(\d+):(\d+)\)/;

    const lines = output.split('\n');
    let currentError: Partial<DetectedError> | null = null;
    const stackLines: string[] = [];

    for (const line of lines) {
      const errorMatch = line.match(errorPattern);

      if (errorMatch) {
        // Found error message
        currentError = {
          id: this.generateId(),
          type: 'runtime',
          severity: 'error',
          message: errorMatch[2].trim(),
          file: '',
          line: 0,
          column: 0
        };
        stackLines.length = 0; // Reset stack
      } else if (currentError) {
        const stackMatch = line.match(stackPattern);

        if (stackMatch) {
          const [, , file, lineStr, columnStr] = stackMatch;

          // First stack entry is the error location
          if (currentError.file === '') {
            currentError.file = this.normalizeFilePath(file);
            currentError.line = parseInt(lineStr, 10);
            currentError.column = parseInt(columnStr, 10);
          }

          stackLines.push(line.trim());
        }
      }
    }

    // Emit the error if we found one
    if (currentError && currentError.file && this.onError && !this.isDisposed) {
      currentError.stackTrace = stackLines.join('\n');

      const error = currentError as DetectedError;
      const errorId = this.generateErrorId(error);

      if (!this.activeErrors.has(errorId)) {
        this.activeErrors.set(errorId, error);
        this.onError(error);
      }
    }
  }

  /**
   * Get all currently active errors (sorted by priority if enabled)
   */
  public getActiveErrors(): DetectedError[] {
    const errors = Array.from(this.activeErrors.values());

    if (this.prioritizeErrors) {
      return this.sortByPriority(errors);
    }

    return errors;
  }

  /**
   * Legacy API: Get all detected errors
   */
  public getErrors(): DetectedError[] {
    return this.getActiveErrors();
  }

  /**
   * Legacy API: Get errors for specific file
   */
  public getErrorsForFile(filePath: string): DetectedError[] {
    return this.getActiveErrors().filter(e => e.file === filePath);
  }

  /**
   * Legacy API: Subscribe to error changes
   */
  public onErrorsChanged(callback: (errors: DetectedError[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Convert Monaco marker to DetectedError
   */
  private markerToError(
    marker: monaco.editor.IMarker,
    filePath: string
  ): DetectedError {
    const type = marker.source === 'eslint' ? 'eslint' : 'typescript';
    const severity = this.monacoSeverityToString(marker.severity);

    const code = typeof marker.code === 'object' && marker.code !== null
      ? (marker.code as any).value
      : marker.code;

    return {
      id: this.generateId(),
      type,
      severity,
      message: marker.message,
      file: filePath,
      line: marker.startLineNumber,
      column: marker.startColumn,
      code: code?.toString(),
      source: marker.source
    };
  }

  /**
   * Convert Monaco severity number to string
   */
  private monacoSeverityToString(severity: number): 'error' | 'warning' | 'info' {
    // Monaco.MarkerSeverity: Error = 8, Warning = 4, Info = 2, Hint = 1
    if (severity >= 8) {return 'error';}
    if (severity >= 4) {return 'warning';}
    return 'info';
  }

  /**
   * Check if error should be included based on severity threshold
   */
  private shouldIncludeError(error: DetectedError): boolean {
    const severityRank = { error: 3, warning: 2, info: 1 };
    return severityRank[error.severity] >= severityRank[this.minSeverity];
  }

  /**
   * Sort errors by priority (errors > warnings > info)
   */
  private sortByPriority(errors: DetectedError[]): DetectedError[] {
    const severityRank = { error: 3, warning: 2, info: 1 };

    return errors.sort((a, b) => {
      const rankDiff = severityRank[b.severity] - severityRank[a.severity];

      // If same severity, sort by line number
      if (rankDiff === 0) {
        return a.line - b.line;
      }

      return rankDiff;
    });
  }

  /**
   * Generate unique ID for an error
   */
  private generateErrorId(error: Partial<DetectedError>): string {
    return `${error.type}:${error.file}:${error.line}:${error.column}:${error.message}`;
  }

  /**
   * Generate unique ID (simple version)
   */
  private generateId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize file path for consistency
   */
  private normalizeFilePath(path: string): string {
    // Convert backslashes to forward slashes
    return path.replace(/\\/g, '/');
  }

  /**
   * Notify legacy listeners
   */
  private notifyListeners(): void {
    const allErrors = this.getActiveErrors();
    for (const listener of this.listeners) {
      listener(allErrors);
    }
  }

  /**
   * Stop monitoring and clean up resources
   */
  public dispose(): void {
    this.isDisposed = true;

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.disposables.length = 0;
    this.activeErrors.clear();
    this.listeners.clear();
  }
}
