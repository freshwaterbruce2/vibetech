/**
 * Search Web Worker - 2025 Pattern
 *
 * Offloads file search and indexing to a separate thread
 *
 * Features:
 * - Full-text search
 * - Fuzzy matching
 * - Regular expression search
 * - File indexing
 * - Search result ranking
 */

interface SearchRequest {
  id: string;
  type: 'search' | 'index' | 'fuzzy' | 'regex';
  query: string;
  files?: FileInfo[];
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    maxResults?: number;
    includePattern?: string;
    excludePattern?: string;
  };
}

interface SearchResponse {
  id: string;
  type: string;
  result: SearchResult[];
  error?: string;
}

interface FileInfo {
  path: string;
  content: string;
  language?: string;
}

interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  preview: string;
  score: number;
}

interface IndexedFile {
  path: string;
  lines: string[];
  tokens: Set<string>;
}

// File index for faster searching
const fileIndex = new Map<string, IndexedFile>();

// Index files for searching
function indexFiles(files: FileInfo[]) {
  fileIndex.clear();

  files.forEach((file) => {
    const lines = file.content.split('\n');
    const tokens = new Set<string>();

    // Extract tokens for fuzzy search
    lines.forEach((line) => {
      const words = line.toLowerCase().match(/\b\w+\b/g) || [];
      words.forEach((word) => tokens.add(word));
    });

    fileIndex.set(file.path, {
      path: file.path,
      lines,
      tokens,
    });
  });

  return fileIndex.size;
}

// Basic text search
function searchText(
  query: string,
  files: FileInfo[],
  options: SearchRequest['options'] = {}
): SearchResult[] {
  const results: SearchResult[] = [];
  const {
    caseSensitive = false,
    wholeWord = false,
    maxResults = 100,
    includePattern,
    excludePattern,
  } = options;

  const searchQuery = caseSensitive ? query : query.toLowerCase();
  // Note: wholeWord logic is handled inline during search

  files.forEach((file) => {
    // Check include/exclude patterns
    if (includePattern && !file.path.match(new RegExp(includePattern))) {
      return;
    }
    if (excludePattern && file.path.match(new RegExp(excludePattern))) {
      return;
    }

    const lines = file.content.split('\n');

    lines.forEach((line, lineIndex) => {
      const searchLine = caseSensitive ? line : line.toLowerCase();
      let columnIndex = 0;

      while (columnIndex < searchLine.length) {
        const index = searchLine.indexOf(searchQuery, columnIndex);
        if (index === -1) {
          break;
        }

        // Check whole word boundary
        if (wholeWord) {
          const before = index > 0 ? searchLine[index - 1] || ' ' : ' ';
          const after =
            index + searchQuery.length < searchLine.length
              ? searchLine[index + searchQuery.length] || ' '
              : ' ';

          if (/\w/.test(before) || /\w/.test(after)) {
            columnIndex = index + 1;
            continue;
          }
        }

        results.push({
          file: file.path,
          line: lineIndex + 1,
          column: index + 1,
          match: line.substring(index, index + searchQuery.length),
          preview: getPreview(line, index, searchQuery.length),
          score: calculateScore(searchQuery, line, index),
        });

        columnIndex = index + searchQuery.length;

        if (results.length >= maxResults) {
          return; // Exit forEach early
        }
      }
    });
  });

  // Sort by score
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// Fuzzy search implementation
function fuzzySearch(
  query: string,
  files: FileInfo[],
  options: SearchRequest['options'] = {}
): SearchResult[] {
  const results: SearchResult[] = [];
  const { maxResults = 100 } = options;
  const queryLower = query.toLowerCase();
  const queryChars = queryLower.split('');

  files.forEach((file) => {
    const lines = file.content.split('\n');

    lines.forEach((line, lineIndex) => {
      const lineLower = line.toLowerCase();
      let score = 0;
      let lastIndex = -1;
      const matchIndices: number[] = [];

      // Check if all query characters appear in order
      for (const char of queryChars) {
        const index = lineLower.indexOf(char, lastIndex + 1);
        if (index === -1) {
          score = 0;
          break;
        }

        // Higher score for consecutive matches
        if (lastIndex !== -1 && index === lastIndex + 1) {
          score += 2;
        } else {
          score += 1;
        }

        // Bonus for matching at word boundaries
        if (index === 0 || (index > 0 && /\W/.test(lineLower[index - 1] || ''))) {
          score += 1;
        }

        matchIndices.push(index);
        lastIndex = index;
      }

      if (score > 0) {
        results.push({
          file: file.path,
          line: lineIndex + 1,
          column: (matchIndices[0] || 0) + 1,
          match: query,
          preview: highlightFuzzyMatch(line, matchIndices),
          score: score / queryChars.length,
        });
      }
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// Regular expression search
function regexSearch(
  pattern: string,
  files: FileInfo[],
  options: SearchRequest['options'] = {}
): SearchResult[] {
  const results: SearchResult[] = [];
  const { caseSensitive = false, maxResults = 100 } = options;

  try {
    const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');

    files.forEach((file) => {
      const lines = file.content.split('\n');

      lines.forEach((line, lineIndex) => {
        let match;
        regex.lastIndex = 0; // Reset regex state

        while ((match = regex.exec(line)) !== null) {
          results.push({
            file: file.path,
            line: lineIndex + 1,
            column: match.index + 1,
            match: match[0],
            preview: getPreview(line, match.index, match[0].length),
            score: 1,
          });

          if (results.length >= maxResults) {
            return; // Exit forEach early
          }
        }
      });
    });
  } catch (error) {
    console.error('Invalid regex pattern:', error);
    return [];
  }

  return results.slice(0, maxResults);
}

// Helper functions
function getPreview(line: string, index: number, length: number): string {
  const contextLength = 40;
  const start = Math.max(0, index - contextLength);
  const end = Math.min(line.length, index + length + contextLength);

  let preview = line.substring(start, end);

  if (start > 0) {
    preview = `...${preview}`;
  }
  if (end < line.length) {
    preview = `${preview}...`;
  }

  return preview;
}

function highlightFuzzyMatch(line: string, indices: number[]): string {
  let result = '';
  let lastIndex = 0;

  indices.forEach((index) => {
    result += line.substring(lastIndex, index);
    result += `[${line[index]}]`;
    lastIndex = index + 1;
  });

  result += line.substring(lastIndex);
  return result;
}

function calculateScore(query: string, line: string, index: number): number {
  let score = 1;

  // Bonus for match at start of line
  if (index === 0) {
    score += 2;
  }

  // Bonus for match at word boundary
  if (index > 0 && /\W/.test(line[index - 1] || '')) {
    score += 1;
  }

  // Bonus for exact case match
  if (line.substring(index, index + query.length) === query) {
    score += 1;
  }

  // Penalty for long lines
  score -= line.length / 1000;

  return Math.max(0, score);
}

// Message handler
self.addEventListener('message', (event: MessageEvent<SearchRequest>) => {
  const { id, type, query, files, options } = event.data;

  try {
    let result: SearchResult[] | number;

    switch (type) {
      case 'index':
        if (files) {
          result = indexFiles(files);
        } else {
          throw new Error('Files required for indexing');
        }
        break;

      case 'search':
        if (!files) {
          throw new Error('Files required for search');
        }
        result = searchText(query, files, options);
        break;

      case 'fuzzy':
        if (!files) {
          throw new Error('Files required for fuzzy search');
        }
        result = fuzzySearch(query, files, options);
        break;

      case 'regex':
        if (!files) {
          throw new Error('Files required for regex search');
        }
        result = regexSearch(query, files, options);
        break;

      default:
        throw new Error(`Unknown search type: ${type}`);
    }

    const response: SearchResponse = {
      id,
      type,
      result: Array.isArray(result) ? result : [],
    };

    self.postMessage(response);
  } catch (error) {
    const response: SearchResponse = {
      id,
      type,
      result: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
});

// Export for TypeScript
export {};
