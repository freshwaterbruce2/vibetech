/**
 * Project Structure Detector
 * Intelligently detects project entry points and structure patterns
 *
 * Supports:
 * - Standard Node.js projects (src/index.ts, index.js)
 * - Expo/React Native projects (app/ directory, App.tsx)
 * - Backend projects (server.ts, main.ts)
 * - Package.json "main" and "exports" fields
 *
 * Based on 2025 best practices for multi-project-type support
 */
import { logger } from '../services/Logger';

import { FileSystemService } from '../services/FileSystemService';

export interface ProjectStructure {
  type: 'nodejs' | 'expo' | 'react' | 'backend' | 'monorepo' | 'unknown';
  entryPoints: string[];
  configFiles: string[];
  hasPackageJson: boolean;
  packageJsonMain?: string;
  detectedFramework?: 'expo' | 'react-native' | 'next' | 'vite' | 'create-react-app';
}

export class ProjectStructureDetector {
  // Common entry point patterns by project type
  private static readonly ENTRY_POINT_PATTERNS = {
    // Standard Node.js/TypeScript
    standard: [
      'src/index.ts',
      'src/index.tsx',
      'src/index.js',
      'src/main.ts',
      'src/main.js',
      'index.ts',
      'index.js',
      'main.ts',
      'main.js',
    ],
    // Expo/React Native
    expo: [
      'app/index.tsx',      // Expo Router entry
      'app/_layout.tsx',    // Expo Router layout
      'App.tsx',            // Traditional React Native
      'App.js',
      'app.json',           // Expo config
      'app.config.ts',
      'app.config.js',
    ],
    // Backend/Server
    backend: [
      'server.ts',
      'server.js',
      'backend/server.ts',
      'backend/hono.ts',
      'backend/index.ts',
      'src/server.ts',
    ],
    // React web apps
    react: [
      'src/App.tsx',
      'src/App.js',
      'src/main.tsx',      // Vite pattern
      'src/index.tsx',
      'src/index.js',
    ],
    // Configuration files
    config: [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'next.config.js',
      'expo.config.ts',
    ],
  };

  constructor(private fileSystemService: FileSystemService) {}

  /**
   * Detect project structure and entry points
   */
  async detectStructure(workspaceRoot: string): Promise<ProjectStructure> {
    const result: ProjectStructure = {
      type: 'unknown',
      entryPoints: [],
      configFiles: [],
      hasPackageJson: false,
    };

    // Check if running in web mode with real filesystem paths
    const isWebMode = !window.electron?.isElectron;
    const isRealPath = workspaceRoot && (
      workspaceRoot.startsWith('/') && workspaceRoot !== '/home/freshbruce/deepcode-editor/demo-workspace' ||
      /^[A-Za-z]:[/\\]/.test(workspaceRoot) // Windows paths like C:\ D:\
    );

    if (isWebMode && isRealPath) {
      logger.warn(`[ProjectStructureDetector] Web mode cannot access real filesystem path: ${workspaceRoot}`);
      logger.warn(`[ProjectStructureDetector] Returning demo project structure. Use Tauri desktop app for real filesystem access.`);
      
      // Return a reasonable default structure for web mode
      return {
        type: 'react',
        entryPoints: ['src/index.tsx', 'src/App.tsx'],
        configFiles: ['package.json', 'tsconfig.json', 'vite.config.ts'],
        hasPackageJson: true,
        packageJsonMain: 'src/index.tsx',
        detectedFramework: 'vite'
      };
    }

    try {
      // 1. Check for package.json first
      const packageJsonPath = this.joinPath(workspaceRoot, 'package.json');
      const hasPackageJson = await this.fileExists(packageJsonPath);
      result.hasPackageJson = hasPackageJson;

      if (hasPackageJson) {
        const packageJson = await this.parsePackageJson(packageJsonPath);

        // Extract main entry from package.json
        if (packageJson.main) {
          const mainPath = this.joinPath(workspaceRoot, packageJson.main);
          result.packageJsonMain = packageJson.main;
          result.entryPoints.push(mainPath);
        }

        // Detect framework
        const framework = this.detectFramework(packageJson);
        if (framework) {
          result.detectedFramework = framework;
        }
      }

      // 2. Detect project type based on structure
      result.type = await this.detectProjectType(workspaceRoot, result.detectedFramework);

      // 3. Find entry points based on detected type
      const detectedEntries = await this.findEntryPoints(workspaceRoot, result.type);
      result.entryPoints.push(...detectedEntries);

      // 4. Find config files
      result.configFiles = await this.findConfigFiles(workspaceRoot);

      // Remove duplicates
      result.entryPoints = [...new Set(result.entryPoints)];

      return result;
    } catch (error) {
      logger.error('[ProjectStructureDetector] Error detecting structure:', error);
      return result;
    }
  }

  /**
   * Detect framework from package.json dependencies
   */
  private detectFramework(packageJson: any): ProjectStructure['detectedFramework'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps['expo'] || deps['expo-router']) return 'expo';
    if (deps['react-native']) return 'react-native';
    if (deps['next']) return 'next';
    if (deps['vite']) return 'vite';
    if (deps['react-scripts']) return 'create-react-app';

    return undefined;
  }

  /**
   * Detect project type based on file structure
   */
  private async detectProjectType(
    workspaceRoot: string,
    framework?: string
  ): Promise<ProjectStructure['type']> {
    // Check for Expo/React Native
    if (framework === 'expo' || framework === 'react-native') {
      return 'expo';
    }

    // Check for app/ directory (Expo Router pattern)
    const appDir = this.joinPath(workspaceRoot, 'app');
    if (await this.directoryExists(appDir)) {
      const appIndex = this.joinPath(appDir, 'index.tsx');
      const appLayout = this.joinPath(appDir, '_layout.tsx');
      if (await this.fileExists(appIndex) || await this.fileExists(appLayout)) {
        return 'expo';
      }
    }

    // Check for backend server files
    const serverTs = this.joinPath(workspaceRoot, 'server.ts');
    const backendDir = this.joinPath(workspaceRoot, 'backend');
    if (await this.fileExists(serverTs) || await this.directoryExists(backendDir)) {
      return 'backend';
    }

    // Check for React web app
    if (framework === 'vite' || framework === 'create-react-app' || framework === 'next') {
      return 'react';
    }

    // Check for standard Node.js structure
    const srcDir = this.joinPath(workspaceRoot, 'src');
    if (await this.directoryExists(srcDir)) {
      return 'nodejs';
    }

    return 'unknown';
  }

  /**
   * Find entry points based on project type
   */
  private async findEntryPoints(
    workspaceRoot: string,
    projectType: ProjectStructure['type']
  ): Promise<string[]> {
    const entryPoints: string[] = [];

    let patterns: string[] = [];

    switch (projectType) {
      case 'expo':
        patterns = ProjectStructureDetector.ENTRY_POINT_PATTERNS.expo;
        break;
      case 'backend':
        patterns = ProjectStructureDetector.ENTRY_POINT_PATTERNS.backend;
        break;
      case 'react':
        patterns = ProjectStructureDetector.ENTRY_POINT_PATTERNS.react;
        break;
      case 'nodejs':
      case 'unknown':
        patterns = [
          ...ProjectStructureDetector.ENTRY_POINT_PATTERNS.standard,
          ...ProjectStructureDetector.ENTRY_POINT_PATTERNS.backend,
          ...ProjectStructureDetector.ENTRY_POINT_PATTERNS.react,
        ];
        break;
    }

    // Check each pattern
    for (const pattern of patterns) {
      const fullPath = this.joinPath(workspaceRoot, pattern);
      if (await this.fileExists(fullPath)) {
        entryPoints.push(fullPath);
      }
    }

    return entryPoints;
  }

  /**
   * Find configuration files
   */
  private async findConfigFiles(workspaceRoot: string): Promise<string[]> {
    const configFiles: string[] = [];

    for (const pattern of ProjectStructureDetector.ENTRY_POINT_PATTERNS.config) {
      const fullPath = this.joinPath(workspaceRoot, pattern);
      if (await this.fileExists(fullPath)) {
        configFiles.push(fullPath);
      }
    }

    return configFiles;
  }

  /**
   * Parse package.json safely
   */
  private async parsePackageJson(path: string): Promise<any> {
    try {
      const content = await this.fileSystemService.readFile(path);
      return JSON.parse(content);
    } catch (error) {
      logger.error('[ProjectStructureDetector] Failed to parse package.json:', error);
      return {};
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await this.fileSystemService.getFileStats(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(path: string): Promise<boolean> {
    try {
      const files = await this.fileSystemService.listDirectory(path);
      return files.length >= 0;
    } catch {
      return false;
    }
  }

  /**
   * Join path segments (cross-platform)
   */
  private joinPath(...segments: string[]): string {
    return segments.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  /**
   * Get human-readable summary
   */
  static formatSummary(structure: ProjectStructure): string {
    const lines: string[] = [];

    lines.push(`Project Type: ${structure.type}`);

    if (structure.detectedFramework) {
      lines.push(`Framework: ${structure.detectedFramework}`);
    }

    if (structure.packageJsonMain) {
      lines.push(`Package.json main: ${structure.packageJsonMain}`);
    }

    if (structure.entryPoints.length > 0) {
      lines.push(`\nEntry Points (${structure.entryPoints.length}):`);
      structure.entryPoints.slice(0, 5).forEach((entry, i) => {
        const filename = entry.split('/').pop() || entry;
        lines.push(`  ${i + 1}. ${filename}`);
      });
      if (structure.entryPoints.length > 5) {
        lines.push(`  ... and ${structure.entryPoints.length - 5} more`);
      }
    }

    if (structure.configFiles.length > 0) {
      lines.push(`\nConfig Files: ${structure.configFiles.map(f => f.split('/').pop()).join(', ')}`);
    }

    return lines.join('\n');
  }
}
