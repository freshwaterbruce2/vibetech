import { logger } from '../services/Logger';

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

export interface ReplaceOptions extends SearchOptions {
  dryRun?: boolean;
}

export interface ReplaceResult {
  file: string;
  replacements: number;
  success: boolean;
  error?: string;
}

export class SearchService {
  private fileSystemService: any;

  constructor(fileSystemService: any) {
    this.fileSystemService = fileSystemService;
  }

  /**
   * Search for text across multiple files
   */
  async searchInFiles(
    searchText: string,
    files: string[],
    options: SearchOptions
  ): Promise<Record<string, SearchResult[]>> {
    if (!searchText.trim()) {
      return {};
    }

    const results: Record<string, SearchResult[]> = {};
    const filteredFiles = this.filterFiles(files, options);

    // Create search pattern
    const pattern = this.createSearchPattern(searchText, options);

    for (const file of filteredFiles) {
      try {
        const fileResults = await this.searchInFile(file, pattern, options);
        if (fileResults.length > 0) {
          results[file] = fileResults;
        }
      } catch (error) {
        logger.warn(`Failed to search in file ${file}:`, error);
      }
    }

    return results;
  }

  /**
   * Search for text in a single file
   */
  async searchInFile(
    filePath: string, 
    pattern: RegExp, 
    _options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const content = await this.fileSystemService.readFile(filePath);
      if (!content) {return [];}

      const lines = content.split('\n');
      const results: SearchResult[] = [];

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match;

        // Reset regex lastIndex for global searches
        pattern.lastIndex = 0;

        while ((match = pattern.exec(line)) !== null) {
          const column = match.index + 1; // 1-based column
          const matchText = match[0];
          const before = line.substring(0, match.index);
          const after = line.substring(match.index + matchText.length);

          results.push({
            file: filePath,
            line: lineIndex + 1, // 1-based line number
            column,
            text: line,
            match: matchText,
            before,
            after
          });

          // Break if not global to avoid infinite loop
          if (!pattern.global) {
            break;
          }
        }
      }

      return results;
    } catch (error) {
      logger.error(`Error searching in file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Replace text in multiple files
   */
  async replaceInFiles(
    searchText: string,
    replaceText: string,
    files: string[],
    options: ReplaceOptions
  ): Promise<ReplaceResult[]> {
    if (!searchText.trim()) {
      return [];
    }

    const results: ReplaceResult[] = [];
    const filteredFiles = this.filterFiles(files, options);
    const pattern = this.createSearchPattern(searchText, options);

    for (const file of filteredFiles) {
      try {
        const result = await this.replaceInFile(file, pattern, replaceText, options);
        results.push(result);
      } catch (error) {
        results.push({
          file,
          replacements: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Replace text in a single file
   */
  async replaceInFile(
    filePath: string,
    pattern: RegExp,
    replaceText: string,
    options: ReplaceOptions
  ): Promise<ReplaceResult> {
    try {
      const content = await this.fileSystemService.readFile(filePath);
      if (!content) {
        return { file: filePath, replacements: 0, success: true };
      }

      let replacements = 0;
      const newContent = content.replace(pattern, (_match: string) => {
        replacements++;
        return replaceText;
      });

      if (replacements > 0 && !options.dryRun) {
        await this.fileSystemService.writeFile(filePath, newContent);
      }

      return {
        file: filePath,
        replacements,
        success: true
      };
    } catch (error) {
      return {
        file: filePath,
        replacements: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search and replace in a single operation
   */
  async searchAndReplace(
    searchText: string,
    replaceText: string,
    files: string[],
    options: ReplaceOptions
  ): Promise<{
    searchResults: Record<string, SearchResult[]>;
    replaceResults: ReplaceResult[];
  }> {
    // First search to show preview
    const searchResults = await this.searchInFiles(searchText, files, options);
    
    // Then replace if not dry run
    const replaceResults = await this.replaceInFiles(searchText, replaceText, files, options);

    return { searchResults, replaceResults };
  }

  /**
   * Filter files based on include/exclude patterns
   */
  private filterFiles(files: string[], options: SearchOptions): string[] {
    let filteredFiles = [...files];

    // Exclude files
    if (options.excludeFiles.trim()) {
      const excludePatterns = options.excludeFiles
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      filteredFiles = filteredFiles.filter(file => {
        return !excludePatterns.some(pattern => {
          // Support glob-like patterns
          const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
          return new RegExp(regexPattern, 'i').test(file);
        });
      });
    }

    // Include only specific files
    if (options.includeFiles.trim()) {
      const includePatterns = options.includeFiles
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      filteredFiles = filteredFiles.filter(file => {
        return includePatterns.some(pattern => {
          // Support glob-like patterns
          const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
          return new RegExp(regexPattern, 'i').test(file);
        });
      });
    }

    // Filter to only text files
    filteredFiles = filteredFiles.filter(file => {
      const textExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.htm', '.css', '.scss', '.sass',
        '.md', '.mdx', '.txt', '.xml', '.yaml', '.yml', '.toml', '.ini', '.conf',
        '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go',
        '.rs', '.swift', '.kt', '.scala', '.clj', '.sql', '.sh', '.bat', '.ps1'
      ];
      
      return textExtensions.some(ext => file.toLowerCase().endsWith(ext));
    });

    return filteredFiles;
  }

  /**
   * Create a regex pattern from search text and options
   */
  private createSearchPattern(searchText: string, options: SearchOptions): RegExp {
    let pattern = searchText;

    if (!options.regex) {
      // Escape special regex characters
      pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = `g${  options.caseSensitive ? '' : 'i'}`;

    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      // If regex is invalid, fall back to literal search
      const escapedPattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escapedPattern, flags);
    }
  }

  /**
   * Get file statistics for search results
   */
  getSearchStats(results: Record<string, SearchResult[]>): {
    totalMatches: number;
    fileCount: number;
    filesWithMatches: string[];
  } {
    const filesWithMatches = Object.keys(results);
    const totalMatches = Object.values(results).reduce(
      (sum, fileResults) => sum + fileResults.length, 
      0
    );

    return {
      totalMatches,
      fileCount: filesWithMatches.length,
      filesWithMatches
    };
  }

  /**
   * Format search results for display
   */
  formatResults(results: Record<string, SearchResult[]>): string {
    const stats = this.getSearchStats(results);
    let output = `Found ${stats.totalMatches} matches in ${stats.fileCount} files:\n\n`;

    for (const [file, fileResults] of Object.entries(results)) {
      output += `${file} (${fileResults.length} matches):\n`;
      
      for (const result of fileResults) {
        output += `  Line ${result.line}, Column ${result.column}: ${result.text.trim()}\n`;
      }
      
      output += '\n';
    }

    return output;
  }

  /**
   * Export search results to different formats
   */
  exportResults(results: Record<string, SearchResult[]>, format: 'json' | 'csv' | 'txt' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
        
      case 'csv':
        let csv = 'File,Line,Column,Text,Match\n';
        for (const [file, fileResults] of Object.entries(results)) {
          for (const result of fileResults) {
            csv += `"${file}",${result.line},${result.column},"${result.text.replace(/"/g, '""')}","${result.match.replace(/"/g, '""')}"\n`;
          }
        }
        return csv;
        
      case 'txt':
        return this.formatResults(results);
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}