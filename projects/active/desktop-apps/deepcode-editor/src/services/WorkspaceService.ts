import { logger } from '../services/Logger';
import { FileAnalysis, FileSystemItem, WorkspaceContext } from '../types';

export interface WorkspaceIndex {
  files: Map<string, FileAnalysis>;
  dependencies: Map<string, string[]>;
  exports: Map<string, string[]>;
  imports: Map<string, string[]>;
  symbols: Map<string, string[]>;
  lastUpdated: Date;
}

interface PackageJson {
  name?: string;
  version?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

interface TsConfig {
  compilerOptions?: {
    target?: string;
    module?: string;
    strict?: boolean;
    esModuleInterop?: boolean;
    [key: string]: unknown;
  };
  include?: string[];
  exclude?: string[];
  [key: string]: unknown;
}

export interface ProjectStructure {
  rootPath: string;
  packageJson?: PackageJson;
  tsConfig?: TsConfig;
  gitignore?: string[];
  readmeContent?: string;
  mainEntryPoints: string[];
  testFiles: string[];
  configFiles: string[];
}

export class WorkspaceService {
  private index: WorkspaceIndex;
  private projectStructure: ProjectStructure | null = null;
  private indexingInProgress = false;

  constructor() {
    this.index = {
      files: new Map(),
      dependencies: new Map(),
      exports: new Map(),
      imports: new Map(),
      symbols: new Map(),
      lastUpdated: new Date(),
    };
  }

  async indexWorkspace(rootPath: string): Promise<WorkspaceContext> {
    if (this.indexingInProgress) {
      throw new Error('Indexing already in progress');
    }

    this.indexingInProgress = true;
    logger.debug(`Starting workspace indexing for: ${rootPath}`);

    try {
      // 1. Analyze project structure
      this.projectStructure = await this.analyzeProjectStructure(rootPath);

      // 2. Build file tree and index files
      const fileTree = await this.buildFileTree(rootPath);

      // 3. Analyze each file for context
      await this.analyzeFiles(fileTree);

      // 4. Build dependency graph
      await this.buildDependencyGraph();

      // 5. Extract symbols and exports
      await this.extractSymbolsAndExports();

      this.index.lastUpdated = new Date();

      logger.debug(`Workspace indexing completed. Indexed ${this.index.files.size} files`);

      return this.getWorkspaceContext();
    } finally {
      this.indexingInProgress = false;
    }
  }

  private async analyzeProjectStructure(rootPath: string): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      rootPath,
      mainEntryPoints: [],
      testFiles: [],
      configFiles: [],
    };

    try {
      // Check for package.json
      const packageJsonPath = `${rootPath}/package.json`;
      if (await this.fileExists(packageJsonPath)) {
        const content = await this.readFile(packageJsonPath);
        structure.packageJson = JSON.parse(content);
        structure.configFiles.push('package.json');

        // Identify main entry points
        if (structure.packageJson?.main) {
          structure.mainEntryPoints.push(structure.packageJson.main);
        }
        if (structure.packageJson?.['module']) {
          structure.mainEntryPoints.push(structure.packageJson['module'] as string);
        }
      }

      // Check for tsconfig.json


      const tsconfigPath = `${rootPath}/tsconfig.json`;


      if (await this.fileExists(tsconfigPath)) {


        try {
          const content = await this.readFile(tsconfigPath);

          // Remove comments from JSONC (JSON with Comments) format
          // Line comments: strip entire line after //
          // Block comments: remove /* */ blocks
          const jsonContent = content
            .split('\n')
            .map(line => {
              // Remove line comments
              const commentIndex = line.indexOf('//');
              if (commentIndex !== -1) {
                return line.substring(0, commentIndex);
              }
              return line;
            })
            .join('\n')
            .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments

          structure.tsConfig = JSON.parse(jsonContent);
          structure.configFiles.push('tsconfig.json');

        } catch (error) {
          // Silently track file exists even if parsing fails
          // This is non-critical - tsconfig parsing is just for additional context
          structure.configFiles.push('tsconfig.json');
        }


      }

      // Check for README
      const readmePaths = ['README.md', 'readme.md', 'README.txt'];
      for (const readmePath of readmePaths) {
        const fullPath = `${rootPath}/${readmePath}`;
        if (await this.fileExists(fullPath)) {
          structure.readmeContent = await this.readFile(fullPath);
          break;
        }
      }

      // Check for .gitignore
      const gitignorePath = `${rootPath}/.gitignore`;
      if (await this.fileExists(gitignorePath)) {
        const content = await this.readFile(gitignorePath);
        structure.gitignore = content
          .split('\n')
          .filter((line) => line.trim() && !line.startsWith('#'));
      }
    } catch (error) {
      logger.warn('Error analyzing project structure:', error);
    }

    return structure;
  }

  private async buildFileTree(rootPath: string): Promise<FileSystemItem[]> {
    // This would integrate with the actual file system
    // For now, return a mock structure that we can expand
    return this.getMockFileTree(rootPath);
  }

  private getMockFileTree(rootPath: string): FileSystemItem[] {
    // Enhanced mock with realistic project structure
    return [
      {
        name: 'src',
        path: `${rootPath}/src`,
        type: 'directory',
        children: [
          { name: 'App.tsx', path: `${rootPath}/src/App.tsx`, type: 'file' },
          { name: 'index.ts', path: `${rootPath}/src/index.ts`, type: 'file' },
          {
            name: 'components',
            path: `${rootPath}/src/components`,
            type: 'directory',
            children: [
              { name: 'Button.tsx', path: `${rootPath}/src/components/Button.tsx`, type: 'file' },
              { name: 'Modal.tsx', path: `${rootPath}/src/components/Modal.tsx`, type: 'file' },
              { name: 'Editor.tsx', path: `${rootPath}/src/components/Editor.tsx`, type: 'file' },
              { name: 'Sidebar.tsx', path: `${rootPath}/src/components/Sidebar.tsx`, type: 'file' },
            ],
          },
          {
            name: 'services',
            path: `${rootPath}/src/services`,
            type: 'directory',
            children: [
              {
                name: 'DeepSeekService.ts',
                path: `${rootPath}/src/services/DeepSeekService.ts`,
                type: 'file',
              },
              {
                name: 'FileSystemService.ts',
                path: `${rootPath}/src/services/FileSystemService.ts`,
                type: 'file',
              },
              {
                name: 'WorkspaceService.ts',
                path: `${rootPath}/src/services/WorkspaceService.ts`,
                type: 'file',
              },
            ],
          },
          {
            name: 'types',
            path: `${rootPath}/src/types`,
            type: 'directory',
            children: [{ name: 'index.ts', path: `${rootPath}/src/types/index.ts`, type: 'file' }],
          },
          {
            name: 'hooks',
            path: `${rootPath}/src/hooks`,
            type: 'directory',
            children: [
              {
                name: 'useFileSystem.ts',
                path: `${rootPath}/src/hooks/useFileSystem.ts`,
                type: 'file',
              },
              {
                name: 'useWorkspace.ts',
                path: `${rootPath}/src/hooks/useWorkspace.ts`,
                type: 'file',
              },
            ],
          },
        ],
      },
      {
        name: 'public',
        path: `${rootPath}/public`,
        type: 'directory',
        children: [
          { name: 'index.html', path: `${rootPath}/public/index.html`, type: 'file' },
          { name: 'icon.png', path: `${rootPath}/public/icon.png`, type: 'file' },
        ],
      },
      { name: 'package.json', path: `${rootPath}/package.json`, type: 'file' },
      { name: 'tsconfig.json', path: `${rootPath}/tsconfig.json`, type: 'file' },
      { name: 'vite.config.ts', path: `${rootPath}/vite.config.ts`, type: 'file' },
      { name: 'README.md', path: `${rootPath}/README.md`, type: 'file' },
    ];
  }

  private async analyzeFiles(fileTree: FileSystemItem[]): Promise<void> {
    const analyzeItem = async (item: FileSystemItem): Promise<void> => {
      if (item.type === 'file') {
        const analysis = await this.analyzeFile(item.path);
        this.index.files.set(item.path, analysis);
      } else if (item.children) {
        for (const child of item.children) {
          await analyzeItem(child);
        }
      }
    };

    for (const item of fileTree) {
      await analyzeItem(item);
    }
  }

  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const fileName = filePath.split('/').pop() || '';

    // Mock file content analysis - in real implementation would read actual files
    const analysis: FileAnalysis = {
      path: filePath,
      name: fileName,
      extension: extension || '',
      language: this.getLanguageFromExtension(extension || ''),
      size: Math.floor(Math.random() * 10000) + 100, // Mock size
      lastModified: new Date(),
      imports: [],
      exports: [],
      symbols: [],
      dependencies: [],
      isTestFile: this.isTestFile(filePath),
      isConfigFile: this.isConfigFile(filePath),
      complexity: Math.floor(Math.random() * 10) + 1,
      summary: `${fileName} - ${this.getLanguageFromExtension(extension || '')} file`,
    };

    // Add mock imports/exports based on file type
    if (extension === 'tsx' || extension === 'ts') {
      analysis.imports = this.getMockImports(filePath);
      analysis.exports = this.getMockExports(filePath);
      analysis.symbols = this.getMockSymbols(filePath);
    }

    return analysis;
  }

  private getMockImports(filePath: string): string[] {
    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.(tsx?|jsx?)$/, '') || '';

    const commonImports = ['react', 'styled-components'];
    const mockImports: string[] = [...commonImports];

    if (fileName.includes('Service')) {
      mockImports.push('axios', '../types');
    }
    if (fileName.includes('Component') || fileName.includes('tsx')) {
      mockImports.push('lucide-react', 'framer-motion');
    }

    return mockImports;
  }

  private getMockExports(filePath: string): string[] {
    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.(tsx?|jsx?)$/, '') || '';
    return [fileName, `${fileName}Props`, `use${fileName}`];
  }

  private getMockSymbols(filePath: string): string[] {
    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.(tsx?|jsx?)$/, '') || '';
    const symbols: string[] = [];

    if (fileName.includes('Service')) {
      symbols.push(`${fileName}`, `get${fileName}Instance`, `${fileName.toLowerCase()}Methods`);
    }
    if (fileName.includes('Component') || fileName.includes('tsx')) {
      symbols.push(`${fileName}`, `${fileName}Props`, `Styled${fileName}`);
    }

    return symbols;
  }

  private async buildDependencyGraph(): Promise<void> {
    // Build relationships between files based on imports/exports
    for (const [filePath, analysis] of this.index.files) {
      const dependencies: string[] = [];

      for (const importPath of analysis.imports) {
        // Resolve relative imports to absolute paths
        if (importPath.startsWith('.')) {
          const resolvedPath = this.resolveRelativePath(filePath, importPath);
          if (this.index.files.has(resolvedPath)) {
            dependencies.push(resolvedPath);
          }
        }
      }

      this.index.dependencies.set(filePath, dependencies);
    }
  }

  private async extractSymbolsAndExports(): Promise<void> {
    // Extract all symbols and exports for quick lookup
    for (const [filePath, analysis] of this.index.files) {
      this.index.exports.set(filePath, analysis.exports);
      this.index.symbols.set(filePath, analysis.symbols);
    }
  }

  private resolveRelativePath(currentPath: string, relativePath: string): string {
    // Simple relative path resolution - in real implementation would be more robust
    const currentDir = currentPath.split('/').slice(0, -1).join('/');
    const resolved = `${currentDir}/${relativePath}`;

    // Add common extensions if not present
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      const withExt = `${resolved}${ext}`;
      if (this.index.files.has(withExt)) {
        return withExt;
      }
    }

    return resolved;
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sh: 'shell',
      sql: 'sql',
    };
    return languageMap[ext] || 'plaintext';
  }

  private isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.test\.(ts|tsx|js|jsx)$/,
      /\.spec\.(ts|tsx|js|jsx)$/,
      /\/__tests__\//,
      /\/tests?\//,
    ];
    return testPatterns.some((pattern) => pattern.test(filePath));
  }

  private isConfigFile(filePath: string): boolean {
    const configPatterns = [
      /package\.json$/,
      /tsconfig.*\.json$/,
      /vite\.config\./,
      /webpack\.config\./,
      /\.eslintrc/,
      /\.prettierrc/,
      /\.gitignore$/,
    ];
    return configPatterns.some((pattern) => pattern.test(filePath));
  }

  private async fileExists(_path: string): Promise<boolean> {
    // Mock implementation - in real app would check actual file system
    return Math.random() > 0.3; // 70% chance file exists
  }

  private async readFile(path: string): Promise<string> {
    // Mock implementation - in real app would read actual file
    if (path.includes('package.json')) {
      return JSON.stringify(
        {
          name: 'deepcode-editor',
          version: '1.0.0',
          main: 'src/index.ts',
          dependencies: {
            react: '^18.3.1',
            typescript: '^5.2.2',
            'styled-components': '^6.1.11',
          },
        },
        null,
        2
      );
    }

    if (path.includes('README.md')) {
      return '# DeepCode Editor\n\nAI-powered code editor with DeepSeek integration.';
    }

    return `// Mock content for ${path}`;
  }

  getWorkspaceContext(): WorkspaceContext {
    const totalFiles = this.index.files.size;
    const languages = new Set(Array.from(this.index.files.values()).map((f) => f.language));
    const testFiles = Array.from(this.index.files.values()).filter((f) => f.isTestFile);

    return {
      rootPath: this.projectStructure?.rootPath || '',
      totalFiles,
      languages: Array.from(languages),
      testFiles: testFiles.length,
      projectStructure: (this.projectStructure || {}) as Record<string, unknown>,
      dependencies: Object.fromEntries(this.index.dependencies),
      exports: Object.fromEntries(this.index.exports),
      symbols: Object.fromEntries(this.index.symbols),
      lastIndexed: this.index.lastUpdated,
      summary: this.generateWorkspaceSummary(),
    };
  }

  private generateWorkspaceSummary(): string {
    const totalFiles = this.index.files.size;
    const languages = new Set(Array.from(this.index.files.values()).map((f) => f.language));
    const testFiles = Array.from(this.index.files.values()).filter((f) => f.isTestFile).length;

    let summary = `Workspace contains ${totalFiles} files across ${languages.size} languages. `;
    summary += `Primary languages: ${Array.from(languages).slice(0, 3).join(', ')}. `;
    summary += `${testFiles} test files detected. `;

    if (this.projectStructure?.packageJson) {
      summary += `Node.js project with ${Object.keys(this.projectStructure.packageJson.dependencies || {}).length} dependencies. `;
    }

    return summary;
  }

  getRelatedFiles(filePath: string, maxResults = 10): string[] {
    const related: string[] = [];
    const fileAnalysis = this.index.files.get(filePath);

    if (!fileAnalysis) {
      return related;
    }

    // 1. Direct dependencies
    const dependencies = this.index.dependencies.get(filePath) || [];
    related.push(...dependencies);

    // 2. Files that depend on this file
    for (const [path, deps] of this.index.dependencies) {
      if (deps.includes(filePath) && !related.includes(path)) {
        related.push(path);
      }
    }

    // 3. Files in same directory
    const directory = filePath.split('/').slice(0, -1).join('/');
    for (const [path] of this.index.files) {
      if (path.startsWith(directory) && path !== filePath && !related.includes(path)) {
        related.push(path);
      }
    }

    return related.slice(0, maxResults);
  }

  getFileContent(filePath: string): FileAnalysis | null {
    return this.index.files.get(filePath) || null;
  }

  searchFiles(query: string, maxResults = 20): FileAnalysis[] {
    const results: FileAnalysis[] = [];
    const lowerQuery = query.toLowerCase();

    for (const analysis of this.index.files.values()) {
      const score = this.calculateSearchScore(analysis, lowerQuery);
      if (score > 0) {
        results.push({ ...analysis, searchScore: score });
      }
    }

    return results.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0)).slice(0, maxResults);
  }

  private calculateSearchScore(analysis: FileAnalysis, query: string): number {
    let score = 0;

    // File name match
    if (analysis.name.toLowerCase().includes(query)) {
      score += 10;
    }

    // Symbol match
    for (const symbol of analysis.symbols) {
      if (symbol.toLowerCase().includes(query)) {
        score += 5;
      }
    }

    // Export match
    for (const exp of analysis.exports) {
      if (exp.toLowerCase().includes(query)) {
        score += 3;
      }
    }

    // Language match
    if (analysis.language.toLowerCase().includes(query)) {
      score += 2;
    }

    return score;
  }

  isIndexed(): boolean {
    return this.index.files.size > 0;
  }

  getIndexStats() {
    return {
      totalFiles: this.index.files.size,
      totalDependencies: this.index.dependencies.size,
      totalSymbols: Array.from(this.index.symbols.values()).flat().length,
      lastUpdated: this.index.lastUpdated,
      isIndexing: this.indexingInProgress,
    };
  }
}
