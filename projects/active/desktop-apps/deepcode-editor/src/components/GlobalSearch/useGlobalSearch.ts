/**
 * useGlobalSearch Hook
 * Manages search state, debounced search, and replace operations
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { logger } from '../../services/Logger';
import type { SearchResult, SearchOptions, GlobalSearchState } from './types';
import { DEFAULT_SEARCH_OPTIONS } from './types';

export interface UseGlobalSearchOptions {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (file: string, line?: number, column?: number) => void;
  onReplaceInFile: (file: string, searchText: string, replaceText: string, options: SearchOptions) => Promise<void>;
  workspaceFiles: string[];
}

export function useGlobalSearch({
  isOpen,
  onClose,
  onOpenFile,
  onReplaceInFile,
  workspaceFiles,
}: UseGlobalSearchOptions) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useHotkeys('ctrl+shift+f', (e) => {
    e.preventDefault();
    if (!isOpen) return;
    searchInputRef.current?.focus();
  });

  useHotkeys('escape', (e) => {
    if (isOpen) {
      e.preventDefault();
      onClose();
    }
  });

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const performSearch = useCallback(async () => {
    if (!searchText.trim()) {
      setResults({});
      return;
    }

    setIsSearching(true);

    try {
      // Simulate search through files
      // In a real implementation, this would use the MCP filesystem server
      const mockResults: Record<string, SearchResult[]> = {};

      // Filter files based on include/exclude patterns
      const filteredFiles = workspaceFiles.filter(file => {
        if (options.excludeFiles) {
          const excludePatterns = options.excludeFiles.split(',');
          if (excludePatterns.some(pattern => file.includes(pattern.trim()))) {
            return false;
          }
        }

        if (options.includeFiles) {
          const includePatterns = options.includeFiles.split(',');
          return includePatterns.some(pattern => file.includes(pattern.trim()));
        }

        return true;
      });

      // Simulate search results
      for (const file of filteredFiles.slice(0, 10)) {
        const fileResults: SearchResult[] = [];

        // Generate mock matches
        const matchCount = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < matchCount; i++) {
          const line = Math.floor(Math.random() * 100) + 1;
          const column = Math.floor(Math.random() * 50) + 1;

          fileResults.push({
            file,
            line,
            column,
            text: `Sample code line containing ${searchText} here`,
            match: searchText,
            before: 'Sample code line containing ',
            after: ' here',
          });
        }

        if (fileResults.length > 0) {
          mockResults[file] = fileResults;
        }
      }

      setResults(mockResults);

      // Auto-expand first few files
      const fileNames = Object.keys(mockResults);
      setExpandedFiles(new Set(fileNames.slice(0, 3)));
    } catch (error) {
      logger.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchText, options, workspaceFiles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [performSearch]);

  const toggleFileExpansion = useCallback((file: string) => {
    setExpandedFiles(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(file)) {
        newExpanded.delete(file);
      } else {
        newExpanded.add(file);
      }
      return newExpanded;
    });
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    onOpenFile(result.file, result.line, result.column);
  }, [onOpenFile]);

  const handleReplaceAll = useCallback(async () => {
    if (!replaceText.trim() || !searchText.trim()) return;

    setIsReplacing(true);

    try {
      const files = Object.keys(results);
      for (const file of files) {
        await onReplaceInFile(file, searchText, replaceText, options);
      }

      // Refresh search after replace
      await performSearch();
    } catch (error) {
      logger.error('Replace failed:', error);
    } finally {
      setIsReplacing(false);
    }
  }, [replaceText, searchText, results, options, onReplaceInFile, performSearch]);

  const toggleOption = useCallback((key: keyof Pick<SearchOptions, 'caseSensitive' | 'wholeWord' | 'regex'>) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setFilterOption = useCallback((key: 'includeFiles' | 'excludeFiles', value: string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const totalResults = Object.values(results).reduce((sum, fileResults) => sum + fileResults.length, 0);
  const fileCount = Object.keys(results).length;

  return {
    // State
    searchText,
    replaceText,
    options,
    results,
    expandedFiles,
    isSearching,
    isReplacing,
    totalResults,
    fileCount,
    
    // Refs
    searchInputRef,
    
    // Actions
    setSearchText,
    setReplaceText,
    toggleOption,
    setFilterOption,
    performSearch,
    toggleFileExpansion,
    handleResultClick,
    handleReplaceAll,
  };
}
