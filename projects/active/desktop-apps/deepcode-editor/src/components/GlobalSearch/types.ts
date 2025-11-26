/**
 * GlobalSearch Types
 */

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  match: string;
  before: string;
  after: string;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  includeFiles: string;
  excludeFiles: string;
}

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (file: string, line?: number, column?: number) => void;
  onReplaceInFile: (file: string, searchText: string, replaceText: string, options: SearchOptions) => Promise<void>;
  workspaceFiles: string[];
}

export interface GlobalSearchState {
  searchText: string;
  replaceText: string;
  options: SearchOptions;
  results: Record<string, SearchResult[]>;
  expandedFiles: Set<string>;
  isSearching: boolean;
  isReplacing: boolean;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  includeFiles: '',
  excludeFiles: 'node_modules,dist,build',
};
