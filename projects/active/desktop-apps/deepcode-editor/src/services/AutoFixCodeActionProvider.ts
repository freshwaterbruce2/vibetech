/**
 * AutoFixCodeActionProvider - Monaco Code Actions Provider for AI-powered fixes
 * Integrates Auto-Fix with VS Code-style quick fix UI (lightbulb + context menu)
 * Based on 2025 best practices from VS Code and Monaco Editor
 */
import * as monaco from 'monaco-editor';

import { logger } from '../services/Logger';

import type { AutoFixService } from './AutoFixService';
import type { ErrorDetector } from './ErrorDetector';

export interface AutoFixCodeActionProviderConfig {
  autoFixService: AutoFixService;
  errorDetector: ErrorDetector;
  onFixApplied?: (fixTitle: string) => void;
  onFixFailed?: (error: Error) => void;
}

export class AutoFixCodeActionProvider implements monaco.languages.CodeActionProvider {
  private autoFixService: AutoFixService;
  private errorDetector: ErrorDetector;
  private onFixApplied?: (fixTitle: string) => void;
  private onFixFailed?: (error: Error) => void;

  constructor(config: AutoFixCodeActionProviderConfig) {
    this.autoFixService = config.autoFixService;
    this.errorDetector = config.errorDetector;
    this.onFixApplied = config.onFixApplied;
    this.onFixFailed = config.onFixFailed;
  }

  /**
   * Provide code actions for the given position
   * Called when user opens context menu or hovers over error
   */
  async provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CodeActionList | undefined> {
    // Check if there are any markers (errors) at this position
    const {markers} = context;
    if (!markers || markers.length === 0) {
      return undefined;
    }

    const actions: monaco.languages.CodeAction[] = [];

    // Filter markers to only include errors and warnings
    const relevantMarkers = markers.filter(
      marker => marker.severity >= monaco.MarkerSeverity.Warning
    );

    if (relevantMarkers.length === 0) {
      return undefined;
    }

    // Add "Fix with AI" action for each error/warning
    for (const marker of relevantMarkers) {
      // Create main "Fix with AI" action
      const fixAction: monaco.languages.CodeAction = {
        title: `✨ Fix with AI: ${this.truncateMessage(marker.message)}`,
        kind: 'quickfix',
        diagnostics: [marker],
        isPreferred: true, // Show as primary action
        command: {
          id: 'autofix.fixWithAI',
          title: 'Fix with AI',
          arguments: [model, marker]
        }
      };

      actions.push(fixAction);

      // Add "Fix All with AI" if multiple errors
      if (relevantMarkers.length > 1 && relevantMarkers.indexOf(marker) === 0) {
        const fixAllAction: monaco.languages.CodeAction = {
          title: `✨ Fix All (${relevantMarkers.length} issues) with AI`,
          kind: 'quickfix',
          diagnostics: relevantMarkers,
          command: {
            id: 'autofix.fixAllWithAI',
            title: 'Fix All with AI',
            arguments: [model, relevantMarkers]
          }
        };

        actions.push(fixAllAction);
      }
    }

    return {
      actions,
      dispose: () => {} // No cleanup needed
    };
  }

  /**
   * Resolve a code action (optional optimization)
   * Can be used to lazily fetch fix details only when action is selected
   */
  async resolveCodeAction?(
    codeAction: monaco.languages.CodeAction,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CodeAction> {
    // For now, return the action as-is
    // In future, we could fetch AI-generated fixes here for preview
    return codeAction;
  }

  /**
   * Register command handlers for the code actions
   * Must be called after provider is registered
   */
  registerCommandHandlers(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) {
    // Handler for single fix
    this.registerCommand(monacoInstance, 'autofix.fixWithAI', async (model: monaco.editor.ITextModel, marker: monaco.editor.IMarker) => {
      try {
        logger.debug('[CodeActionProvider] Fixing single error:', marker.message);

        // Convert Monaco marker to DetectedError
        const error = this.markerToDetectedError(marker, model);

        // Generate fix using AutoFixService
        const fix = await this.autoFixService.generateFix(error, editor);

        if (fix.suggestions.length === 0) {
          throw new Error('No fix suggestions generated');
        }

        // Apply the first (highest confidence) suggestion
        const suggestion = fix.suggestions[0];
        this.applyFix(editor, model, suggestion);

        // Notify success
        if (this.onFixApplied) {
          this.onFixApplied(suggestion.title);
        }

        logger.debug('[CodeActionProvider] Fix applied successfully');
      } catch (error) {
        logger.error('[CodeActionProvider] Fix failed:', error);
        if (this.onFixFailed) {
          this.onFixFailed(error as Error);
        }
      }
    });

    // Handler for fix all
    this.registerCommand(monacoInstance, 'autofix.fixAllWithAI', async (model: monaco.editor.ITextModel, markers: monaco.editor.IMarker[]) => {
      try {
        logger.debug('[CodeActionProvider] Fixing multiple errors:', markers.length);

        let fixedCount = 0;
        const errors: string[] = [];

        // Fix errors one by one (could be optimized with batch processing)
        for (const marker of markers) {
          try {
            const error = this.markerToDetectedError(marker, model);
            const fix = await this.autoFixService.generateFix(error, editor);

            if (fix.suggestions.length > 0) {
              const suggestion = fix.suggestions[0];
              this.applyFix(editor, model, suggestion);
              fixedCount++;
            }
          } catch (err) {
            errors.push(`${marker.message}: ${(err as Error).message}`);
          }
        }

        // Notify success
        if (this.onFixApplied) {
          this.onFixApplied(`Fixed ${fixedCount} of ${markers.length} issues`);
        }

        if (errors.length > 0 && this.onFixFailed) {
          this.onFixFailed(new Error(`Some fixes failed: ${errors.join(', ')}`));
        }

        logger.debug('[CodeActionProvider] Batch fix complete:', fixedCount, 'fixed');
      } catch (error) {
        logger.error('[CodeActionProvider] Batch fix failed:', error);
        if (this.onFixFailed) {
          this.onFixFailed(error as Error);
        }
      }
    });
  }

  /**
   * Convert Monaco marker to DetectedError format
   */
  private markerToDetectedError(
    marker: monaco.editor.IMarker,
    model: monaco.editor.ITextModel
  ): any {
    const severity = marker.severity >= monaco.MarkerSeverity.Error ? 'error' : 'warning';
    const type = marker.source === 'eslint' ? 'eslint' : 'typescript';

    // Extract error code
    const code = typeof marker.code === 'object' && marker.code !== null
      ? (marker.code as any).value
      : marker.code;

    return {
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message: marker.message,
      file: model.uri.path,
      line: marker.startLineNumber,
      column: marker.startColumn,
      code: code?.toString(),
      source: marker.source
    };
  }

  /**
   * Apply a fix suggestion to the editor
   */
  private applyFix(
    editor: monaco.editor.IStandaloneCodeEditor,
    model: monaco.editor.ITextModel,
    suggestion: any
  ): void {
    // Create edit operation
    const edit: monaco.editor.IIdentifiedSingleEditOperation = {
      range: {
        startLineNumber: suggestion.startLine,
        startColumn: 1,
        endLineNumber: suggestion.endLine,
        endColumn: model.getLineMaxColumn(suggestion.endLine)
      },
      text: suggestion.code,
      forceMoveMarkers: true
    };

    // Apply edit
    editor.executeEdits('autofix', [edit]);

    // Move cursor to fixed location
    editor.setPosition({
      lineNumber: suggestion.startLine,
      column: 1
    });

    // Reveal the changed line
    editor.revealLineInCenter(suggestion.startLine);
  }

  /**
   * Truncate long error messages for display
   */
  private truncateMessage(message: string, maxLength: number = 50): string {
    if (message.length <= maxLength) {
      return message;
    }
    return `${message.substring(0, maxLength)  }...`;
  }

  /**
   * Register a command in Monaco editor
   * Helper method to handle command registration safely
   */
  private registerCommand(
    monacoInstance: typeof monaco,
    commandId: string,
    handler: (...args: any[]) => void | Promise<void>
  ): void {
    try {
      // Try to dispose existing command first (in case of hot reload)
      try {
        (monacoInstance.editor as any).getEditors()?.forEach((ed: any) => {
          ed._actions?.forEach((action: any) => {
            if (action.id === commandId) {
              action.dispose?.();
            }
          });
        });
      } catch (e) {
        // Ignore disposal errors
      }

      // Register new command
      (monacoInstance.editor as any).registerCommand?.(commandId, handler);
      logger.debug('[CodeActionProvider] Registered command:', commandId);
    } catch (error) {
      logger.warn('[CodeActionProvider] Failed to register command:', commandId, error);
    }
  }
}
