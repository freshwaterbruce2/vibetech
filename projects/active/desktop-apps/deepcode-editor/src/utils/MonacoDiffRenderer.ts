/**
 * Monaco Diff Renderer Utility
 *
 * Higher-level utility for rendering diffs in Monaco editor with intelligent
 * change detection and visual highlighting.
 */

import * as monaco from 'monaco-editor';

import { DiffChange } from '../services/LiveEditorStream';

export interface DiffRenderOptions {
  showInlineDiff?: boolean; // Show character-level diffs within lines
  highlightWhitespace?: boolean; // Highlight whitespace changes
  collapseUnchanged?: boolean; // Collapse unchanged sections
  contextLines?: number; // Lines of context around changes (default: 3)
}

export interface InlineDiffSegment {
  text: string;
  type: 'unchanged' | 'added' | 'removed';
}

/**
 * Renders and manages diff decorations in Monaco editor
 */
export class MonacoDiffRenderer {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private decorations: string[] = [];
  private widgets: monaco.editor.IContentWidget[] = [];

  /**
   * Set the Monaco editor instance
   */
  setEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.editor = editor;
  }

  /**
   * Highlight deleted lines with red background
   *
   * @param lines - Array of line numbers to highlight
   * @param options - Optional rendering options
   */
  highlightDeletions(
    lines: number[],
    options: DiffRenderOptions = {}
  ): void {
    if (!this.editor || lines.length === 0) {return;}

    const decorationsArray: monaco.editor.IModelDeltaDecoration[] = lines.map(
      (lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'live-stream-deletion',
          linesDecorationsClassName: 'live-stream-deletion-glyph',
          hoverMessage: { value: 'Line will be removed' },
        },
      })
    );

    this.decorations = this.editor.deltaDecorations(
      this.decorations,
      decorationsArray
    );
  }

  /**
   * Highlight added lines with green background
   *
   * @param lines - Array of line numbers to highlight
   * @param options - Optional rendering options
   */
  highlightAdditions(
    lines: number[],
    options: DiffRenderOptions = {}
  ): void {
    if (!this.editor || lines.length === 0) {return;}

    const decorationsArray: monaco.editor.IModelDeltaDecoration[] = lines.map(
      (lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'live-stream-addition',
          linesDecorationsClassName: 'live-stream-addition-glyph',
          hoverMessage: { value: 'Line will be added' },
        },
      })
    );

    this.decorations = this.editor.deltaDecorations(
      this.decorations,
      decorationsArray
    );
  }

  /**
   * Highlight modified lines with yellow background
   *
   * @param lines - Array of line numbers to highlight
   */
  highlightModifications(lines: number[]): void {
    if (!this.editor || lines.length === 0) {return;}

    const decorationsArray: monaco.editor.IModelDeltaDecoration[] = lines.map(
      (lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'live-stream-modification',
          hoverMessage: { value: 'Line will be modified' },
        },
      })
    );

    this.decorations = this.editor.deltaDecorations(
      this.decorations,
      decorationsArray
    );
  }

  /**
   * Show inline character-level diff within modified lines
   *
   * @param changes - Array of diff changes to render
   */
  showInlineDiff(changes: DiffChange[]): void {
    if (!this.editor) {return;}

    const decorationsArray: monaco.editor.IModelDeltaDecoration[] = [];

    for (const change of changes) {
      if (change.type !== 'modification' || !change.content) {continue;}

      // For each modified line, calculate character-level diff
      const lineNumber = change.startLine;
      const model = this.editor.getModel();
      if (!model) {continue;}

      const oldLine = model.getLineContent(lineNumber);
      const newLine = change.content;

      const segments = this.calculateInlineDiff(oldLine, newLine);

      // Create decorations for added/removed segments
      let column = 1;
      for (const segment of segments) {
        if (segment.type === 'added') {
          decorationsArray.push({
            range: new monaco.Range(
              lineNumber,
              column,
              lineNumber,
              column + segment.text.length
            ),
            options: {
              inlineClassName: 'inline-diff-addition',
              hoverMessage: { value: 'Added text' },
            },
          });
        } else if (segment.type === 'removed') {
          decorationsArray.push({
            range: new monaco.Range(
              lineNumber,
              column,
              lineNumber,
              column + segment.text.length
            ),
            options: {
              inlineClassName: 'inline-diff-deletion',
              hoverMessage: { value: 'Removed text' },
            },
          });
        }

        column += segment.text.length;
      }
    }

    this.decorations = this.editor.deltaDecorations(
      this.decorations,
      decorationsArray
    );
  }

  /**
   * Render all changes from DiffChange array
   *
   * @param changes - Array of diff changes
   * @param options - Rendering options
   */
  renderDiff(changes: DiffChange[], options: DiffRenderOptions = {}): void {
    if (!this.editor) {return;}

    this.clearDecorations();

    const additions: number[] = [];
    const deletions: number[] = [];
    const modifications: number[] = [];

    // Group changes by type
    for (const change of changes) {
      const lines = Array.from(
        { length: change.endLine - change.startLine + 1 },
        (_, i) => change.startLine + i
      );

      if (change.type === 'addition') {
        additions.push(...lines);
      } else if (change.type === 'deletion') {
        deletions.push(...lines);
      } else if (change.type === 'modification') {
        modifications.push(...lines);
      }
    }

    // Apply decorations
    this.highlightAdditions(additions, options);
    this.highlightDeletions(deletions, options);
    this.highlightModifications(modifications);

    // Show inline diffs for modifications
    if (options.showInlineDiff) {
      this.showInlineDiff(changes);
    }

    // Reveal first change
    if (changes.length > 0) {
      this.editor.revealLineInCenter(changes[0].startLine);
    }
  }

  /**
   * Clear all diff decorations and widgets
   */
  clearDecorations(): void {
    if (!this.editor) {return;}

    this.decorations = this.editor.deltaDecorations(this.decorations, []);

    // Remove any content widgets
    for (const widget of this.widgets) {
      this.editor.removeContentWidget(widget);
    }
    this.widgets = [];
  }

  /**
   * Add a floating info widget at a specific line
   *
   * @param lineNumber - Line number to place widget
   * @param message - Message to display
   */
  addInfoWidget(lineNumber: number, message: string): void {
    if (!this.editor) {return;}

    const widget: monaco.editor.IContentWidget = {
      getId: () => `diff-info-${lineNumber}-${Date.now()}`,
      getDomNode: () => {
        const node = document.createElement('div');
        node.className = 'monaco-diff-info-widget';
        node.textContent = message;
        node.style.backgroundColor = '#1e1e1e';
        node.style.color = '#d4d4d4';
        node.style.padding = '4px 8px';
        node.style.borderRadius = '3px';
        node.style.fontSize = '12px';
        node.style.zIndex = '1000';
        return node;
      },
      getPosition: () => ({
        position: { lineNumber, column: 1 },
        preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
      }),
    };

    this.editor.addContentWidget(widget);
    this.widgets.push(widget);
  }

  /**
   * Calculate character-level diff between two strings
   * Simple implementation - can be enhanced with Myers diff algorithm
   */
  private calculateInlineDiff(
    oldText: string,
    newText: string
  ): InlineDiffSegment[] {
    const segments: InlineDiffSegment[] = [];

    // Simple character-by-character comparison
    // This is a basic implementation - for production, use a proper diff algorithm
    let i = 0;
    let j = 0;

    while (i < oldText.length || j < newText.length) {
      if (i >= oldText.length) {
        // Remaining characters are additions
        segments.push({
          text: newText.slice(j),
          type: 'added',
        });
        break;
      } else if (j >= newText.length) {
        // Remaining characters are deletions
        segments.push({
          text: oldText.slice(i),
          type: 'removed',
        });
        break;
      } else if (oldText[i] === newText[j]) {
        // Characters match
        const matchStart = i;
        while (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
          i++;
          j++;
        }
        segments.push({
          text: oldText.slice(matchStart, i),
          type: 'unchanged',
        });
      } else {
        // Characters differ - find next match
        const oldMatch = newText.indexOf(oldText[i], j);
        const newMatch = oldText.indexOf(newText[j], i);

        if (oldMatch !== -1 && (newMatch === -1 || oldMatch < newMatch)) {
          // Addition detected
          segments.push({
            text: newText.slice(j, oldMatch),
            type: 'added',
          });
          j = oldMatch;
        } else if (newMatch !== -1) {
          // Deletion detected
          segments.push({
            text: oldText.slice(i, newMatch),
            type: 'removed',
          });
          i = newMatch;
        } else {
          // No match found - treat as replacement
          segments.push({
            text: oldText[i],
            type: 'removed',
          });
          segments.push({
            text: newText[j],
            type: 'added',
          });
          i++;
          j++;
        }
      }
    }

    return segments;
  }

  /**
   * Get decoration count by type
   */
  getDecorationStats(): {
    total: number;
    additions: number;
    deletions: number;
    modifications: number;
  } {
    if (!this.editor) {
      return { total: 0, additions: 0, deletions: 0, modifications: 0 };
    }

    const model = this.editor.getModel();
    if (!model) {
      return { total: 0, additions: 0, deletions: 0, modifications: 0 };
    }

    const decorations = model.getAllDecorations();
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    for (const decoration of decorations) {
      const className = decoration.options.className || '';
      if (className.includes('addition')) {additions++;}
      else if (className.includes('deletion')) {deletions++;}
      else if (className.includes('modification')) {modifications++;}
    }

    return {
      total: this.decorations.length,
      additions,
      deletions,
      modifications,
    };
  }
}

// Singleton instance
export const monacoDiffRenderer = new MonacoDiffRenderer();
