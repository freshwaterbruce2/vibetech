import { EditorFile, FindReplaceOptions } from '../types';

export class EditorService {
  private static instance: EditorService;

  private constructor() {}

  static getInstance(): EditorService {
    if (!EditorService.instance) {
      EditorService.instance = new EditorService();
    }
    return EditorService.instance;
  }

  async loadFile(path: string): Promise<EditorFile> {
    try {
      if (!window.electron?.fs) {
        throw new Error('Electron API not available');
      }
      const response = await window.electron.fs.readFile(path);
      if (!response.success || !response.content) {
        throw new Error(response.error || 'Failed to read file');
      }
      return {
        path,
        content: response.content,
        language: this.detectLanguage(path),
        isModified: false,
        lastModified: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to load file: ${path}`);
    }
  }

  async saveFile(file: EditorFile): Promise<void> {
    try {
      if (!window.electron?.fs) {
        throw new Error('Electron API not available');
      }
      await window.electron.fs.writeFile(file.path, file.content);
    } catch (error) {
      throw new Error(`Failed to save file: ${file.path}`);
    }
  }

  detectLanguage(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      r: 'r',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
      dockerfile: 'dockerfile',
      makefile: 'makefile',
    };
    return languageMap[extension || ''] || 'plaintext';
  }

  findMatches(
    content: string,
    query: string,
    options: FindReplaceOptions
  ): Array<{ start: number; end: number; line: number }> {
    const matches: Array<{ start: number; end: number; line: number }> = [];
    let searchQuery = query;

    if (!options.regex) {
      searchQuery = this.escapeRegex(query);
    }

    if (options.wholeWord) {
      searchQuery = `\\b${searchQuery}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(searchQuery, flags);
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          line: lineIndex + 1,
        });
      }
    });

    return matches;
  }

  replaceAll(
    content: string,
    query: string,
    replacement: string,
    options: FindReplaceOptions
  ): string {
    let searchQuery = query;

    if (!options.regex) {
      searchQuery = this.escapeRegex(query);
    }

    if (options.wholeWord) {
      searchQuery = `\\b${searchQuery}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(searchQuery, flags);

    return content.replace(regex, replacement);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
