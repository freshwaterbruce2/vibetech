/**
 * Live Editor Stream Service
 *
 * Provides real-time code streaming to Monaco editor, similar to Cursor/Windsurf.
 * Shows work happening live as the agent writes/edits code.
 */

import * as monaco from 'monaco-editor';

export interface StreamPosition {
  lineNumber: number;
  column: number;
}

export interface DiffChange {
  type: 'addition' | 'deletion' | 'modification';
  startLine: number;
  endLine: number;
  content?: string;
}

export interface StreamProgress {
  filePath: string;
  currentChar: number;
  totalChars: number;
  percentComplete: number;
  linesAdded: number;
  linesRemoved: number;
}

export interface LiveStreamSettings {
  enabled: boolean;
  streamSpeed: number; // Characters per second (1-100)
  autoApprove: boolean; // Skip approval for low-risk changes
  showDiffOnly: boolean; // Don't stream, just show final diff
  minimizePanel: boolean; // Start with minimized control panel
}

type ApprovalCallback = (approved: boolean, filePath: string) => void;
type ProgressCallback = (progress: StreamProgress) => void;

/**
 * Manages live streaming of code changes to Monaco editor
 */
export class LiveEditorStream {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private decorations: string[] = [];
  private approvalCallback: ApprovalCallback | null = null;
  private progressCallback: ProgressCallback | null = null;
  private isStreaming: boolean = false;
  private settings: LiveStreamSettings = {
    enabled: true,
    streamSpeed: 50, // 50 chars/second = smooth but not too slow
    autoApprove: false,
    showDiffOnly: false,
    minimizePanel: false,
  };

  /**
   * Initialize with Monaco editor instance
   */
  setEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }

  /**
   * Update live streaming settings
   */
  updateSettings(settings: Partial<LiveStreamSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): LiveStreamSettings {
    return { ...this.settings };
  }

  /**
   * Set callback for approval events
   */
  onApprovalRequired(callback: ApprovalCallback) {
    this.approvalCallback = callback;
  }

  /**
   * Set callback for progress updates
   */
  onProgress(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  /**
   * Stream code to editor character-by-character
   *
   * @param filePath - Path to the file being edited
   * @param content - Content to stream
   * @param startPosition - Starting position in editor (default: end of file)
   * @returns Promise that resolves when streaming completes
   *
   * @example
   * ```typescript
   * await liveStream.streamToEditor(
   *   'src/components/Button.tsx',
   *   'export const Button = () => { ... }'
   * );
   * ```
   */
  async streamToEditor(
    filePath: string,
    content: string,
    startPosition?: StreamPosition
  ): Promise<void> {
    if (!this.editor || !this.settings.enabled) {
      return; // Silent no-op if editor not set or streaming disabled
    }

    // If showDiffOnly, skip streaming and just set content
    if (this.settings.showDiffOnly) {
      this.editor.setValue(content);
      return;
    }

    this.isStreaming = true;
    const totalChars = content.length;
    let currentChar = 0;

    // Determine starting position
    const model = this.editor.getModel();
    if (!model) return;

    const position = startPosition || {
      lineNumber: model.getLineCount(),
      column: model.getLineMaxColumn(model.getLineCount()),
    };

    // Calculate delay between characters based on stream speed
    const delayMs = 1000 / this.settings.streamSpeed;

    // Stream character by character
    for (const char of content) {
      if (!this.isStreaming) break; // Allow interruption

      // Insert character at current position
      this.editor.executeEdits('live-stream', [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: char,
        },
      ]);

      // Update position
      if (char === '\n') {
        position.lineNumber++;
        position.column = 1;
      } else {
        position.column++;
      }

      // Update progress
      currentChar++;
      if (this.progressCallback) {
        this.progressCallback({
          filePath,
          currentChar,
          totalChars,
          percentComplete: Math.round((currentChar / totalChars) * 100),
          linesAdded: content.slice(0, currentChar).split('\n').length,
          linesRemoved: 0,
        });
      }

      // Reveal current position
      this.editor.revealPositionInCenter(position);

      // Delay before next character
      await this.sleep(delayMs);
    }

    this.isStreaming = false;
  }

  /**
   * Show diff preview with decorations (red for deletions, green for additions)
   *
   * @param filePath - File being modified
   * @param oldContent - Original content
   * @param newContent - New content
   * @returns Diff changes array
   *
   * @example
   * ```typescript
   * const changes = liveStream.showDiffPreview(
   *   'src/App.tsx',
   *   oldCode,
   *   newCode
   * );
   * // Monaco editor now shows red/green decorations
   * ```
   */
  showDiffPreview(
    filePath: string,
    oldContent: string,
    newContent: string
  ): DiffChange[] {
    if (!this.editor) return [];

    const changes = this.calculateDiff(oldContent, newContent);

    // Create Monaco decorations for additions and deletions
    const decorationsArray: monaco.editor.IModelDeltaDecoration[] = [];

    for (const change of changes) {
      const className =
        change.type === 'addition'
          ? 'live-stream-addition'
          : change.type === 'deletion'
          ? 'live-stream-deletion'
          : 'live-stream-modification';

      const decoration: monaco.editor.IModelDeltaDecoration = {
        range: new monaco.Range(
          change.startLine,
          1,
          change.endLine,
          1000 // Large column to cover whole line
        ),
        options: {
          isWholeLine: true,
          className,
          linesDecorationsClassName:
            change.type === 'addition'
              ? 'live-stream-addition-glyph'
              : change.type === 'deletion'
              ? 'live-stream-deletion-glyph'
              : '',
        },
      };

      decorationsArray.push(decoration);
    }

    // Apply decorations
    this.decorations = this.editor.deltaDecorations(
      this.decorations,
      decorationsArray
    );

    return changes;
  }

  /**
   * Clear all decorations from editor
   */
  clearDecorations(): void {
    if (!this.editor) return;
    this.decorations = this.editor.deltaDecorations(this.decorations, []);
  }

  /**
   * Show approval UI and wait for user decision
   *
   * @param filePath - File being modified
   * @param changes - Diff changes to display
   * @returns Promise<boolean> - true if approved, false if rejected
   */
  async requestApproval(
    filePath: string,
    changes: DiffChange[]
  ): Promise<boolean> {
    // Auto-approve if enabled
    if (this.settings.autoApprove) {
      return true;
    }

    // Return promise that resolves when user approves/rejects
    return new Promise<boolean>((resolve) => {
      if (this.approvalCallback) {
        // Temporarily store resolver
        const originalCallback = this.approvalCallback;

        // Wrap callback to resolve promise
        this.approvalCallback = (approved: boolean, path: string) => {
          originalCallback(approved, path);
          resolve(approved);
          this.approvalCallback = originalCallback; // Restore original
        };
      } else {
        // No callback registered, default to approved
        resolve(true);
      }
    });
  }

  /**
   * Stop current streaming operation
   */
  stopStreaming(): void {
    this.isStreaming = false;
  }

  /**
   * Check if currently streaming
   */
  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Calculate diff between old and new content
   * Simple line-based diff algorithm
   */
  private calculateDiff(oldContent: string, newContent: string): DiffChange[] {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const changes: DiffChange[] = [];

    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // Remaining lines are additions
        changes.push({
          type: 'addition',
          startLine: newIndex + 1,
          endLine: newLines.length,
          content: newLines.slice(newIndex).join('\n'),
        });
        break;
      } else if (newIndex >= newLines.length) {
        // Remaining lines are deletions
        changes.push({
          type: 'deletion',
          startLine: oldIndex + 1,
          endLine: oldLines.length,
        });
        break;
      } else if (oldLines[oldIndex] === newLines[newIndex]) {
        // Lines match, continue
        oldIndex++;
        newIndex++;
      } else {
        // Lines differ - find next match
        const nextMatchOld = this.findNextMatch(
          oldLines,
          newLines[newIndex],
          oldIndex
        );
        const nextMatchNew = this.findNextMatch(
          newLines,
          oldLines[oldIndex],
          newIndex
        );

        if (nextMatchOld !== -1 && nextMatchOld < nextMatchNew) {
          // Deletion detected
          changes.push({
            type: 'deletion',
            startLine: oldIndex + 1,
            endLine: nextMatchOld,
          });
          oldIndex = nextMatchOld + 1;
          newIndex++;
        } else if (nextMatchNew !== -1) {
          // Addition detected
          changes.push({
            type: 'addition',
            startLine: newIndex + 1,
            endLine: nextMatchNew,
            content: newLines.slice(newIndex, nextMatchNew + 1).join('\n'),
          });
          newIndex = nextMatchNew + 1;
          oldIndex++;
        } else {
          // Modification (no clear match found)
          changes.push({
            type: 'modification',
            startLine: Math.min(oldIndex, newIndex) + 1,
            endLine: Math.min(oldIndex, newIndex) + 1,
            content: newLines[newIndex],
          });
          oldIndex++;
          newIndex++;
        }
      }
    }

    return changes;
  }

  /**
   * Find next matching line in array
   */
  private findNextMatch(
    lines: string[],
    target: string,
    startIndex: number
  ): number {
    for (let i = startIndex; i < Math.min(lines.length, startIndex + 10); i++) {
      if (lines[i] === target) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Sleep utility for streaming delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const liveEditorStream = new LiveEditorStream();
