/**
 * Electron Service - Matches preload.cjs API structure
 * Deep Code Editor - Electron IPC Bridge
 *
 * This service aligns EXACTLY with the window.electron API exposed
 * by electron/preload.cjs to ensure proper IPC communication
 */
import { logger } from '../services/Logger';

// Types matching preload.cjs exposed API
interface ElectronFS {
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>; error?: string }>;
  createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  remove: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  exists: (targetPath: string) => Promise<{ success: boolean; exists: boolean }>;
  stat: (targetPath: string) => Promise<{ success: boolean; stats?: { size: number; isFile: boolean; isDirectory: boolean; created: Date; modified: Date }; error?: string }>;
}

interface ElectronDialog {
  openFile: (options?: any) => Promise<{ success: boolean; canceled: boolean; filePaths: string[] }>;
  openFolder: (options?: any) => Promise<{ success: boolean; canceled: boolean; filePaths: string[] }>;
  saveFile: (options?: any) => Promise<{ success: boolean; canceled: boolean; filePath?: string }>;
}

interface ElectronShell {
  execute: (command: string, cwd?: string) => Promise<{ success: boolean; stdout: string; stderr: string; code: number }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

interface ElectronApp {
  getPath: (name: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  getPlatform: () => Promise<{ success: boolean; platform: string; arch: string; version: string; electron: string; node: string }>;
}

interface ElectronWindow {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
}

interface WindowElectron {
  fs: ElectronFS;
  dialog: ElectronDialog;
  shell: ElectronShell;
  app: ElectronApp;
  window?: ElectronWindow;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electron?: WindowElectron;
    __ELECTRON__?: boolean;
  }
}

// Service to handle Electron API integration
export class ElectronService {
  private electron: WindowElectron | undefined;

  constructor() {
    this.electron = window.electron;
  }

  isElectron(): boolean {
    return !!window.electron?.isElectron || !!window.__ELECTRON__;
  }

  get platform(): string {
    return this.electron?.platform || 'web';
  }

  // File System Operations (matches preload.cjs)
  async readFile(path: string): Promise<string> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.fs.readFile(path);
    if (!result.success || !result.content) {
      throw new Error(result.error || 'Failed to read file');
    }

    return result.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.fs.writeFile(path, content);
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  async readDir(dirPath: string): Promise<Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    logger.debug('[ElectronService] Reading directory:', dirPath);
    const result = await this.electron.fs.readDir(dirPath);

    if (!result.success) {
      logger.error('[ElectronService] readDir failed:', result.error);
      throw new Error(result.error || 'Failed to read directory');
    }

    logger.debug('[ElectronService] readDir success, got', result.items?.length || 0, 'items');
    return result.items || [];
  }

  async createDir(dirPath: string): Promise<void> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.fs.createDir(dirPath);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create directory');
    }
  }

  /**
   * Alias for createDir (for compatibility)
   */
  async createDirectory(dirPath: string): Promise<void> {
    return this.createDir(dirPath);
  }

  async remove(targetPath: string): Promise<void> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.fs.remove(targetPath);
    if (!result.success) {
      throw new Error(result.error || 'Failed to remove file/directory');
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.fs.rename(oldPath, newPath);
    if (!result.success) {
      throw new Error(result.error || 'Failed to rename file/directory');
    }
  }

  async exists(targetPath: string): Promise<boolean> {
    if (!this.electron) {
      return false;
    }

    const result = await this.electron.fs.exists(targetPath);
    return result.exists;
  }

  async stat(targetPath: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; birthtime?: Date; mtime?: Date }> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.fs.stat(targetPath);
    if (!result.success || !result.stats) {
      throw new Error(result.error || 'Failed to get file stats');
    }

    return {
      size: result.stats.size,
      isFile: result.stats.isFile,
      isDirectory: result.stats.isDirectory,
      birthtime: result.stats.created,
      mtime: result.stats.modified,
    };
  }

  // Dialog Operations
  async openFileDialog(options?: any): Promise<{ canceled: boolean; filePaths: string[] }> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.dialog.openFile(options);
    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  }

  async openFolderDialog(options?: any): Promise<{ canceled: boolean; filePaths: string[] }> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    logger.debug('[ElectronService] Opening folder dialog...');
    const result = await this.electron.dialog.openFolder(options);
    logger.debug('[ElectronService] Dialog result:', result);

    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  }

  async saveFileDialog(options?: any): Promise<{ canceled: boolean; filePath?: string }> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.dialog.saveFile(options);
    return {
      canceled: result.canceled,
      filePath: result.filePath,
    };
  }

  // Shell Operations (for Agent Mode)
  async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.shell.execute(command, cwd);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
    };
  }

  async openExternal(url: string): Promise<void> {
    if (!this.electron) {
      // Fallback to window.open for web mode
      window.open(url, '_blank');
      return;
    }

    const result = await this.electron.shell.openExternal(url);
    if (!result.success) {
      throw new Error(result.error || 'Failed to open external URL');
    }
  }

  // App Operations
  async getPath(name: string): Promise<string> {
    if (!this.electron) {
      throw new Error('Electron API not available');
    }

    const result = await this.electron.app.getPath(name);
    if (!result.success || !result.path) {
      throw new Error(result.error || 'Failed to get path');
    }

    return result.path;
  }

  async getPlatform(): Promise<{ platform: string; arch: string; version: string }> {
    if (!this.electron) {
      return {
        platform: navigator.platform,
        arch: 'web',
        version: '1.0.0-web',
      };
    }

    const result = await this.electron.app.getPlatform();
    return {
      platform: result.platform,
      arch: result.arch,
      version: result.version,
    };
  }

  // Clipboard Operations
  async copyToClipboard(text: string): Promise<void> {
    // Use browser API - works in both Electron and web
    await navigator.clipboard.writeText(text);
  }

  async readFromClipboard(): Promise<string> {
    // Use browser API - works in both Electron and web
    return await navigator.clipboard.readText();
  }

  // Window Control Operations
  minimizeWindow(): void {
    if (!this.electron?.window) {
      logger.warn('[ElectronService] Window controls not available in web mode');
      return;
    }
    this.electron.window.minimize();
  }

  maximizeWindow(): void {
    if (!this.electron?.window) {
      logger.warn('[ElectronService] Window controls not available in web mode');
      return;
    }
    this.electron.window.maximize();
  }

  closeWindow(): void {
    if (!this.electron?.window) {
      logger.warn('[ElectronService] Window controls not available in web mode');
      return;
    }
    this.electron.window.close();
  }

  async isMaximized(): Promise<boolean> {
    if (!this.electron?.window) {
      return false;
    }
    return await this.electron.window.isMaximized();
  }

  /**
   * Generic IPC invoke method for Electron IPC
   * @param channel - The IPC channel to invoke
   * @param args - Arguments to pass to the main process
   */
  async invoke(channel: string, ...args: any[]): Promise<any> {
    if (!this.electron) {
      throw new Error('Electron API not available - invoke method only works in Electron');
    }

    // Direct invoke via electron object if available
    if ((this.electron as any).invoke) {
      return (this.electron as any).invoke(channel, ...args);
    }

    // Otherwise, throw error as invoke is not available
    throw new Error(`IPC invoke not available for channel: ${channel}`);
  }
}
