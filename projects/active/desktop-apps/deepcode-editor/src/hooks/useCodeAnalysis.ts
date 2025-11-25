import { logger } from '../services/Logger';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '../services/Logger';
import { useEditorStore } from '../stores/useEditorStore';

/**
 * Code Analysis Hook - 2025 Pattern
 *
 * Integrates with Web Worker for offloading heavy code analysis
 *
 * Features:
 * - Automatic worker lifecycle management
 * - Request queuing and cancellation
 * - TypeScript type safety
 * - Error handling
 * - Performance tracking
 */

// Types for analysis operations
export interface CodeMetrics {
  lines: number;
  characters: number;
  functions: number;
  classes: number;
  imports: number;
  exports: number;
  comments: number;
  complexity: number;
}

export interface LintIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

export interface CodeReference {
  line: number;
  column: number;
  text: string;
}

export interface AnalysisOptions {
  symbol?: string;
  rules?: string[];
  maxLineLength?: number;
}

export interface AnalysisRequest {
  id: string;
  type: 'analyze' | 'format' | 'lint' | 'findReferences' | 'calculateComplexity';
  code: string;
  language: string;
  options?: AnalysisOptions;
}

export type AnalysisResult = CodeMetrics | string | LintIssue[] | CodeReference[] | number;

export interface AnalysisResponse {
  id: string;
  type: string;
  result: AnalysisResult;
  error?: string;
}

export interface UseCodeAnalysisOptions {
  workerPath?: string;
  timeout?: number;
  onError?: (error: Error) => void;
}

export interface CodeAnalysisState {
  isAnalyzing: boolean;
  metrics: CodeMetrics | null;
  lintIssues: LintIssue[];
  complexity: number | null;
  error: Error | null;
}

export function useCodeAnalysis(options: UseCodeAnalysisOptions = {}) {
  const { workerPath = '/src/workers/codeAnalysis.worker.ts', timeout = 30000, onError } = options;

  const workerRef = useRef<Worker | null>(null);
  const requestQueueRef = useRef<Map<string, (response: AnalysisResponse) => void>>(new Map());
  const requestIdRef = useRef(0);

  const [state, setState] = useState<CodeAnalysisState>({
    isAnalyzing: false,
    metrics: null,
    lintIssues: [],
    complexity: null,
    error: null,
  });

  // Initialize worker
  useEffect(() => {
    // Capture refs to avoid stale closure warning
    const requestQueue = requestQueueRef.current;
    
    try {
      // Create worker with proper module type
      workerRef.current = new Worker(
        new URL('../workers/codeAnalysis.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle worker messages
      workerRef.current.onmessage = (event: MessageEvent<AnalysisResponse>) => {
        const { id, type, result, error } = event.data;

        const resolver = requestQueueRef.current.get(id);
        if (resolver) {
          resolver(event.data);
          requestQueueRef.current.delete(id);
        }

        // Update state based on response type
        setState((prev) => {
          const newState = { ...prev, isAnalyzing: requestQueueRef.current.size > 0 };

          if (error) {
            newState.error = new Error(error);
            onError?.(newState.error);
          } else {
            newState.error = null;

            switch (type) {
              case 'analyze':
                newState.metrics = result as CodeMetrics;
                break;
              case 'lint':
                newState.lintIssues = result as LintIssue[];
                break;
              case 'calculateComplexity':
                newState.complexity = result as number;
                break;
            }
          }

          return newState;
        });
      };

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        logger.error('Worker error:', error);
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: new Error(`Worker error: ${error.message}`),
        }));
        onError?.(new Error(`Worker error: ${error.message}`));
      };
    } catch (error) {
      logger.error('Failed to create worker:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to create worker'),
      }));
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      requestQueue.clear();
    };
  }, [workerPath, onError]);

  // Send request to worker
  const sendRequest = useCallback(
    async <T = AnalysisResult>(
      type: AnalysisRequest['type'],
      code: string,
      language: string,
      options?: AnalysisOptions
    ): Promise<T> => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const id = `${type}-${++requestIdRef.current}`;
      const request: AnalysisRequest = {
        id,
        type,
        code,
        language,
        options: options || {},
      };

      setState((prev) => ({ ...prev, isAnalyzing: true }));

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          requestQueueRef.current.delete(id);
          setState((prev) => ({ ...prev, isAnalyzing: requestQueueRef.current.size > 0 }));
          reject(new Error(`Analysis timeout: ${type}`));
        }, timeout);

        requestQueueRef.current.set(id, (response) => {
          clearTimeout(timeoutId);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result as T);
          }
        });

        if (workerRef.current) {
          workerRef.current.postMessage(request);
        } else {
          reject(new Error('Worker not initialized'));
        }
      });
    },
    [timeout]
  );

  // Analysis methods
  const analyzeCode = useCallback(
    async (code: string, language: string) => {
      return sendRequest<CodeMetrics>('analyze', code, language);
    },
    [sendRequest]
  );

  const formatCode = useCallback(
    async (code: string, language: string) => {
      return sendRequest<string>('format', code, language);
    },
    [sendRequest]
  );

  const lintCode = useCallback(
    async (code: string, language: string) => {
      return sendRequest<LintIssue[]>('lint', code, language);
    },
    [sendRequest]
  );

  const findReferences = useCallback(
    async (code: string, symbol: string, language: string) => {
      return sendRequest<CodeReference[]>('findReferences', code, language, { symbol });
    },
    [sendRequest]
  );

  const calculateComplexity = useCallback(
    async (code: string, language: string) => {
      return sendRequest<number>('calculateComplexity', code, language);
    },
    [sendRequest]
  );

  // Analyze current file in editor
  const analyzeCurrentFile = useCallback(async () => {
    const activeFile = useEditorStore.getState().currentFile;
    if (!activeFile) {
      return;
    }

    try {
      const [metrics, issues, complexity] = await Promise.all([
        analyzeCode(activeFile.content, activeFile.language),
        lintCode(activeFile.content, activeFile.language),
        calculateComplexity(activeFile.content, activeFile.language),
      ]);

      setState((prev) => ({
        ...prev,
        metrics,
        lintIssues: issues,
        complexity,
      }));
    } catch (error) {
      logger.error('Analysis failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Analysis failed'),
      }));
    }
  }, [analyzeCode, lintCode, calculateComplexity]);

  // Cancel all pending requests
  const cancelAll = useCallback(() => {
    requestQueueRef.current.clear();
    setState((prev) => ({ ...prev, isAnalyzing: false }));
  }, []);

  return {
    // State
    ...state,

    // Methods
    analyzeCode,
    formatCode,
    lintCode,
    findReferences,
    calculateComplexity,
    analyzeCurrentFile,
    cancelAll,
  };
}

export const CodeAnalysisPanel: React.FC = () => {
  const { isAnalyzing, metrics, lintIssues, complexity, analyzeCurrentFile } = useCodeAnalysis();

  useEffect(() => {
    // Analyze on mount and when active file changes
    analyzeCurrentFile();
  }, [analyzeCurrentFile]);

  if (isAnalyzing) {
    return React.createElement('div', null, 'Analyzing code...');
  }

  return React.createElement(
    'div',
    null,
    metrics &&
      React.createElement(
        'div',
        null,
        React.createElement('h3', null, 'Code Metrics'),
        React.createElement(
          'ul',
          null,
          React.createElement('li', null, `Lines: ${metrics.lines}`),
          React.createElement('li', null, `Functions: ${metrics.functions}`),
          React.createElement('li', null, `Classes: ${metrics.classes}`),
          React.createElement('li', null, `Complexity: ${complexity || metrics.complexity}`)
        )
      ),
    lintIssues.length > 0 &&
      React.createElement(
        'div',
        null,
        React.createElement('h3', null, `Issues (${lintIssues.length})`),
        lintIssues.map((issue, index) =>
          React.createElement(
            'div',
            { key: index },
            `[${issue.severity}] Line ${issue.line}: ${issue.message}`
          )
        )
      )
  );
};
