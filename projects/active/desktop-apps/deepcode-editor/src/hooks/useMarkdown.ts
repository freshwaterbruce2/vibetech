import { logger } from '../services/Logger';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '../services/Logger';

/**
 * Markdown Processing Hook - 2025 Pattern
 *
 * Integrates with Web Worker for offloading markdown processing
 *
 * Features:
 * - Debounced preview generation
 * - Table of contents extraction
 * - Reading time calculation
 * - Caching for performance
 * - Error handling
 */

export interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export interface ReadingTime {
  minutes: number;
  words: number;
  time: string;
}

interface MarkdownRequest {
  id: string;
  type: 'parse' | 'toc' | 'preview' | 'readingTime';
  content: string;
  options?: {
    sanitize?: boolean;
    highlight?: boolean;
    breaks?: boolean;
    gfm?: boolean;
  };
}

type MarkdownResult = string | TOCItem[] | ReadingTime;

interface MarkdownResponse {
  id: string;
  type: string;
  result: MarkdownResult;
  error?: string;
}

export interface UseMarkdownOptions {
  debounceDelay?: number;
  cacheSize?: number;
  onError?: (error: Error) => void;
}

export interface MarkdownState {
  html: string;
  preview: string;
  toc: TOCItem[];
  readingTime: ReadingTime | null;
  isProcessing: boolean;
  error: Error | null;
}

export function useMarkdown(options: UseMarkdownOptions = {}) {
  const { debounceDelay = 300, cacheSize = 10, onError } = options;

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef<Map<string, MarkdownResult>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingRequestsRef = useRef<Map<string, (response: MarkdownResponse) => void>>(new Map());

  const [state, setState] = useState<MarkdownState>({
    html: '',
    preview: '',
    toc: [],
    readingTime: null,
    isProcessing: false,
    error: null,
  });

  // Initialize worker
  useEffect(() => {
    // Capture refs to avoid stale closure warning
    const pendingRequests = pendingRequestsRef.current;
    
    try {
      workerRef.current = new Worker(new URL('../workers/markdown.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.onmessage = (event: MessageEvent<MarkdownResponse>) => {
        const { id, error } = event.data;

        const resolver = pendingRequestsRef.current.get(id);
        if (resolver) {
          resolver(event.data);
          pendingRequestsRef.current.delete(id);
        }

        setState((prev) => ({
          ...prev,
          isProcessing: pendingRequestsRef.current.size > 0,
          error: error ? new Error(error) : null,
        }));

        if (error) {
          onError?.(new Error(error));
        }
      };

      workerRef.current.onerror = (error) => {
        logger.error('Markdown worker error:', error);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: new Error(`Worker error: ${error.message}`),
        }));
        onError?.(new Error(`Worker error: ${error.message}`));
      };
    } catch (error) {
      logger.error('Failed to create markdown worker:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to create worker'),
      }));
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      pendingRequests.clear();
    };
  }, [onError]);

  // Cache management
  const getCacheKey = useCallback((type: string, content: string, options?: MarkdownRequest['options']) => {
    return `${type}:${content.substring(0, 50)}:${JSON.stringify(options || {})}`;
  }, []);

  const getFromCache = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const setCache = useCallback(
    (key: string, value: MarkdownResult) => {
      // Implement LRU cache
      if (cacheRef.current.size >= cacheSize) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey !== undefined) {
          cacheRef.current.delete(firstKey);
        }
      }
      cacheRef.current.set(key, value);
    },
    [cacheSize]
  );

  // Send request to worker
  const sendRequest = useCallback(
    async <T = MarkdownResult>(type: MarkdownRequest['type'], content: string, options?: MarkdownRequest['options']): Promise<T> => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      // Check cache
      const cacheKey = getCacheKey(type, content, options);
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached as T;
      }

      const id = `${type}-${++requestIdRef.current}`;
      const request: MarkdownRequest = {
        id,
        type,
        content,
        options: options || {},
      };

      setState((prev) => ({ ...prev, isProcessing: true }));

      return new Promise((resolve, reject) => {
        pendingRequestsRef.current.set(id, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            // Cache the result
            setCache(cacheKey, response.result);
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
    [getCacheKey, getFromCache, setCache]
  );

  // Parse markdown to HTML
  const parse = useCallback(
    async (content: string, options?: MarkdownRequest['options']) => {
      try {
        const html = await sendRequest<string>('parse', content, options);
        setState((prev) => ({ ...prev, html }));
        return html;
      } catch (error) {
        logger.error('Parse error:', error);
        throw error;
      }
    },
    [sendRequest]
  );

  // Generate preview with debouncing
  const generatePreview = useCallback(
    (content: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const preview = await sendRequest<string>('preview', content);
          setState((prev) => ({ ...prev, preview }));
        } catch (error) {
          logger.error('Preview error:', error);
        }
      }, debounceDelay);
    },
    [sendRequest, debounceDelay]
  );

  // Extract table of contents
  const extractTOC = useCallback(
    async (content: string) => {
      try {
        const toc = await sendRequest<TOCItem[]>('toc', content);
        setState((prev) => ({ ...prev, toc }));
        return toc;
      } catch (error) {
        logger.error('TOC error:', error);
        return [];
      }
    },
    [sendRequest]
  );

  // Calculate reading time
  const calculateReadingTime = useCallback(
    async (content: string) => {
      try {
        const readingTime = await sendRequest<ReadingTime>('readingTime', content);
        setState((prev) => ({ ...prev, readingTime }));
        return readingTime;
      } catch (error) {
        logger.error('Reading time error:', error);
        return null;
      }
    },
    [sendRequest]
  );

  // Process all markdown features
  const processMarkdown = useCallback(
    async (content: string, options?: MarkdownRequest['options']) => {
      try {
        const [html, toc, readingTime] = await Promise.all([
          parse(content, options),
          extractTOC(content),
          calculateReadingTime(content),
        ]);

        // Also generate preview
        generatePreview(content);

        return { html, toc, readingTime };
      } catch (error) {
        logger.error('Process markdown error:', error);
        throw error;
      }
    },
    [parse, extractTOC, calculateReadingTime, generatePreview]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    // State
    ...state,

    // Methods
    parse,
    generatePreview,
    extractTOC,
    calculateReadingTime,
    processMarkdown,
    clearCache,
  };
}

export const MarkdownEditor: React.FC = () => {
  const [content, setContent] = useState('# Hello World\n\nThis is a **markdown** editor.');
  const { preview, toc, readingTime, isProcessing, processMarkdown } = useMarkdown();

  useEffect(() => {
    processMarkdown(content);
  }, [content, processMarkdown]);

  return React.createElement(
    'div',
    { style: { display: 'flex', height: '100%' } },
    React.createElement(
      'div',
      { style: { flex: 1, padding: '20px' } },
      React.createElement('h2', null, 'Editor'),
      React.createElement('textarea', {
        value: content,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value),
        style: { width: '100%', height: '400px' },
      }),
      readingTime &&
        React.createElement(
          'p',
          null,
          `Reading time: ${readingTime.time} (${readingTime.words} words)`
        )
    ),
    React.createElement(
      'div',
      { style: { flex: 1, padding: '20px' } },
      React.createElement('h2', null, `Preview ${isProcessing ? '(Processing...)' : ''}`),
      React.createElement('div', { dangerouslySetInnerHTML: { __html: preview } }),
      toc.length > 0 &&
        React.createElement(
          'div',
          null,
          React.createElement('h3', null, 'Table of Contents'),
          React.createElement(
            'ul',
            null,
            toc.map((item, index) =>
              React.createElement(
                'li',
                {
                  key: index,
                  style: { marginLeft: `${(item.level - 1) * 20}px` },
                },
                React.createElement('a', { href: `#${item.id}` }, item.text)
              )
            )
          )
        )
    )
  );
};
