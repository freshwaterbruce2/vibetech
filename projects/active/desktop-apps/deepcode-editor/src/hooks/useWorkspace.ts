import { logger } from '../services/Logger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WorkspaceService } from '../services/WorkspaceService';
import { ContextualFile, EditorFile, WorkspaceContext } from '../types';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export interface UseWorkspaceReturn {
  workspaceService: WorkspaceService;
  workspaceContext: WorkspaceContext | null;
  isIndexing: boolean;
  indexingProgress: number;
  error: string | null;

  // Actions
  indexWorkspace: (rootPath: string) => Promise<WorkspaceContext | null>;
  getRelatedFiles: (filePath: string, maxResults?: number) => ContextualFile[];
  searchFiles: (query: string, maxResults?: number) => any[];
  getFileContext: (file: EditorFile) => ContextualFile[];
  refreshIndex: () => Promise<void>;
  clearWorkspace: () => void;
}

export const useWorkspace = (): UseWorkspaceReturn => {
  const [workspaceService] = useState(() => new WorkspaceService());
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const indexWorkspace = useCallback(
    async (rootPath: string): Promise<WorkspaceContext | null> => {
      if (isIndexing) {
        logger.warn('Indexing already in progress');
        return null;
      }

      try {
        setIsIndexing(true);
        setError(null);
        setIndexingProgress(0);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setIndexingProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 15;
          });
        }, 200);

        logger.debug(`Starting workspace indexing for: ${rootPath}`);
        const context = await workspaceService.indexWorkspace(rootPath);

        clearInterval(progressInterval);
        setIndexingProgress(100);
        setWorkspaceContext(context);

        logger.debug('Workspace indexing completed:', context);

        // Reset progress after a brief delay
        setTimeout(() => setIndexingProgress(0), 1000);

        return context;
      } catch (err) {
        logger.error('Workspace indexing failed:', err);
        setError(err instanceof Error ? err.message : 'Indexing failed');
        return null;
      } finally {
        setIsIndexing(false);
      }
    },
    [workspaceService, isIndexing]
  );

  const getRelatedFiles = useCallback(
    (filePath: string, maxResults = 10): ContextualFile[] => {
      if (!workspaceContext) {
        return [];
      }

      const relatedPaths = workspaceService.getRelatedFiles(filePath, maxResults);

      return relatedPaths.map((path) => {
        const analysis = workspaceService.getFileContent(path);
        if (!analysis) {
          return {
            path,
            content: '',
            relevance: 0.1,
            reason: 'File not found',
          };
        }

        // Calculate relevance based on relationship type
        let relevance = 0.5;
        let reason = 'Related file';

        // Check if it's a direct dependency
        const dependencies = workspaceContext.dependencies[filePath] || [];
        if (dependencies.includes(path)) {
          relevance = 0.9;
          reason = 'Direct dependency';
        }

        // Check if current file depends on this file
        const reverseDeps = Object.entries(workspaceContext.dependencies)
          .filter(([, deps]) => deps.includes(filePath))
          .map(([depPath]) => depPath);
        if (reverseDeps.includes(path)) {
          relevance = 0.8;
          reason = 'Depends on current file';
        }

        // Check if same directory
        const currentDir = filePath.split('/').slice(0, -1).join('/');
        const fileDir = path.split('/').slice(0, -1).join('/');
        if (currentDir === fileDir) {
          relevance = Math.max(relevance, 0.6);
          reason = reason === 'Related file' ? 'Same directory' : reason;
        }

        // Mock content - in real implementation would read actual file
        const mockContent = `// ${analysis.name}\n// ${analysis.language} file\n// ${analysis.summary}\n\n// Mock content for context`;

        return {
          path,
          content: mockContent,
          relevance,
          reason,
        };
      });
    },
    [workspaceService, workspaceContext]
  );

  const searchFiles = useCallback(
    (query: string, maxResults = 20) => {
      if (!workspaceContext) {
        return [];
      }

      return workspaceService.searchFiles(query, maxResults);
    },
    [workspaceService, workspaceContext]
  );

  const getFileContext = useCallback(
    (file: EditorFile): ContextualFile[] => {
      if (!workspaceContext) {
        return [];
      }

      const relatedFiles = getRelatedFiles(file.path, 5);

      // Add current file as context
      const currentFileContext: ContextualFile = {
        path: file.path,
        content: file.content,
        relevance: 1.0,
        reason: 'Current file',
      };

      return [currentFileContext, ...relatedFiles];
    },
    [getRelatedFiles, workspaceContext]
  );

  const refreshIndex = useCallback(async () => {
    if (!workspaceContext) {
      return;
    }

    await indexWorkspace(workspaceContext.rootPath);
  }, [indexWorkspace, workspaceContext]);

  // Debounced version of refreshIndex (5 second delay to prevent rapid re-indexing)
  // FIX: Use ref to store workspace context to prevent infinite loop from dependency changes
  const workspaceContextRef = useRef(workspaceContext);
  useEffect(() => {
    workspaceContextRef.current = workspaceContext;
  }, [workspaceContext]);

  const debouncedRefreshIndex = useMemo(
    () =>
      debounce(() => {
        const ctx = workspaceContextRef.current;
        if (ctx && !isIndexing) {
          logger.debug('[useWorkspace] Debounced refresh triggered');
          indexWorkspace(ctx.rootPath);
        }
      }, 5000),
    [indexWorkspace, isIndexing] // Removed workspaceContext and refreshIndex to prevent loop
  );

  const clearWorkspace = useCallback(() => {
    setWorkspaceContext(null);
    setError(null);
    setIndexingProgress(0);
  }, []);

  // Auto-refresh index periodically (every 5 minutes)
  // Uses debounced version to prevent performance issues from rapid refreshes
  // FIX: Added stability check to prevent refresh during active indexing
  useEffect(() => {
    if (!workspaceContext) {
      return;
    }

    // Only set up auto-refresh if not currently indexing
    if (isIndexing) {
      logger.debug('[useWorkspace] Skipping auto-refresh setup - indexing in progress');
      return;
    }

    logger.debug('[useWorkspace] Setting up auto-refresh interval (5 minutes)');
    const interval = setInterval(
      () => {
        if (!isIndexing) {
          logger.debug('[useWorkspace] Auto-refresh scheduled (debounced)');
          debouncedRefreshIndex();
        } else {
          logger.debug('[useWorkspace] Skipping auto-refresh - indexing in progress');
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => {
      logger.debug('[useWorkspace] Cleaning up auto-refresh interval');
      clearInterval(interval);
    };
  }, [workspaceContext?.rootPath, isIndexing]); // FIX: Removed debouncedRefreshIndex to prevent loop!

  return {
    workspaceService,
    workspaceContext,
    isIndexing,
    indexingProgress,
    error,

    // Actions
    indexWorkspace,
    getRelatedFiles,
    searchFiles,
    getFileContext,
    refreshIndex,
    clearWorkspace,
  };
};

export default useWorkspace;
