interface ElectronAPI {
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;
  showOpenDialog: (options: DialogOptions) => Promise<DialogResult | null>;
  showSaveDialog: (options: DialogOptions) => Promise<DialogResult | null>;
  showMessageBox: (options: any) => Promise<any>;
  fs: {
    readFile: (path: string) => Promise<{ success: boolean; content?: string }>;
    writeFile: (path: string, content: string) => Promise<{ success: boolean }>;
    readdir: (path: string) => Promise<{ success: boolean; items: Array<{ name: string; path: string; isDirectory: boolean }> }>;
    exists: (path: string) => Promise<{ exists: boolean }>;
    mkdir: (path: string) => Promise<{ success: boolean }>;
    unlink: (path: string) => Promise<{ success: boolean }>;
    rename: (oldPath: string, newPath: string) => Promise<{ success: boolean }>;
    stat: (path: string) => Promise<any>;
  };
  shellOpenExternal: (url: string) => Promise<void>;
  clipboardWriteText: (text: string) => Promise<void>;
  clipboardReadText: () => Promise<string>;
  showNotification: (options: { title: string; body: string; icon?: string }) => Promise<void>;
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getNativeTheme: () => Promise<boolean>;
  setNativeTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  onMenuNewFile: (callback: () => void) => void;
  onMenuOpenFile: (callback: (event: unknown, filePath: string) => void) => void;
  onMenuOpenFolder: (callback: (event: unknown, folderPath: string) => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuSaveAs: (callback: (event: unknown, filePath: string) => void) => void;
  onMenuFind: (callback: () => void) => void;
  onMenuReplace: (callback: () => void) => void;
  onMenuToggleSidebar: (callback: () => void) => void;
  onMenuToggleAIChat: (callback: () => void) => void;
  onMenuAIAssistant: (callback: () => void) => void;
  onMenuAIGenerate: (callback: () => void) => void;
  onMenuAIExplain: (callback: () => void) => void;
  onMenuAIOptimize: (callback: () => void) => void;
  onGlobalAIAssistant: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  app: {
    restart: () => Promise<void>;
    getPath: (name: string) => Promise<string>;
    setLoginItemSettings: (settings: { openAtLogin: boolean; openAsHidden: boolean }) => Promise<void>;
    getLoginItemSettings: () => Promise<{ openAtLogin: boolean }>;
  };
  codeExecutor: {
    execute: (request: any) => Promise<any>;
  };
}

interface ElectronEnv {
  isElectron: boolean;
  platform: string;
}

interface DialogOptions {
  properties?: string[];
  filters?: Array<{ name: string; extensions: string[] }>;
  defaultPath?: string;
  buttonLabel?: string;
  title?: string;
}

interface DialogResult {
  canceled: boolean;
  filePaths?: string[];
  filePath?: string;
}

interface ExtendedWindow {
  electronAPI?: ElectronAPI;
  electronEnv?: ElectronEnv;
}

// Service to handle Electron API integration
export class ElectronService {
  private electronAPI: ElectronAPI | undefined;

  constructor() {
    this.electronAPI = (window as unknown as ExtendedWindow).electronAPI;
  }

  get isElectron(): boolean {
    return !!(window as unknown as ExtendedWindow).electronEnv?.isElectron;
  }

  get platform(): string {
    return (window as unknown as ExtendedWindow).electronEnv?.platform || 'web';
  }

  // Window controls
  async minimizeWindow(): Promise<void> {
    if (this.isElectron) {
      await this.electronAPI?.windowMinimize();
    }
  }

  async maximizeWindow(): Promise<void> {
    if (this.isElectron) {
      await this.electronAPI?.windowMaximize();
    }
  }

  async closeWindow(): Promise<void> {
    if (this.isElectron) {
      await this.electronAPI?.windowClose();
    }
  }

  async isWindowMaximized(): Promise<boolean> {
    if (this.isElectron && this.electronAPI) {
      return await this.electronAPI.windowIsMaximized();
    }
    return false;
  }

  // File operations
  async showOpenFileDialog(options: Partial<DialogOptions> = {}): Promise<DialogResult | null> {
    if (this.isElectron && this.electronAPI) {
      return await this.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'JavaScript', extensions: ['js', 'jsx', 'ts', 'tsx'] },
          { name: 'Python', extensions: ['py'] },
          { name: 'Text', extensions: ['txt', 'md'] },
          ...(options.filters || []),
        ],
        ...options,
      });
    }
    return null;
  }

  async showOpenFolderDialog(): Promise<DialogResult | null> {
    if (this.isElectron && this.electronAPI) {
      return await this.electronAPI.showOpenDialog({
        properties: ['openDirectory'],
      });
    }
    return null;
  }

  async showSaveFileDialog(options: Partial<DialogOptions> = {}): Promise<DialogResult | null> {
    if (this.isElectron && this.electronAPI) {
      return await this.electronAPI.showSaveDialog({
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'JavaScript', extensions: ['js'] },
          { name: 'TypeScript', extensions: ['ts'] },
          { name: 'Python', extensions: ['py'] },
          ...(options.filters || []),
        ],
        ...options,
      });
    }
    return null;
  }

  // File system operations
  async readFile(path: string): Promise<string | null> {
    if (this.isElectron && this.electronAPI) {
      const result = await this.electronAPI.fs.readFile(path);
      return result?.success && result.content ? result.content : null;
    }
    return null;
  }

  async writeFile(path: string, content: string): Promise<boolean> {
    if (this.isElectron) {
      const result = await this.electronAPI?.fs.writeFile(path, content);
      return result?.success || false;
    }
    return false;
  }

  async fileExists(path: string): Promise<boolean> {
    if (this.isElectron) {
      const result = await this.electronAPI?.fs.exists(path);
      return result?.exists || false;
    }
    return false;
  }

  async readDirectory(path: string): Promise<Array<{ name: string; path: string; isDirectory: boolean }>> {
    if (this.isElectron) {
      const result = await this.electronAPI?.fs.readdir(path);
      return result?.success ? result.items : [];
    }
    return [];
  }

  async createDirectory(path: string): Promise<boolean> {
    if (this.isElectron) {
      const result = await this.electronAPI?.fs.mkdir(path);
      return result?.success || false;
    }
    return false;
  }

  async deleteFile(path: string): Promise<boolean> {
    if (this.isElectron) {
      const result = await this.electronAPI?.fs.unlink(path);
      return result?.success || false;
    }
    return false;
  }

  async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    if (this.isElectron) {
      const result = await this.electronAPI?.fs.rename(oldPath, newPath);
      return result?.success || false;
    }
    return false;
  }

  // System integration
  async openExternal(url: string): Promise<void> {
    if (this.isElectron) {
      await this.electronAPI?.shellOpenExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    if (this.isElectron) {
      await this.electronAPI?.clipboardWriteText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  async readFromClipboard(): Promise<string> {
    if (this.isElectron) {
      return (await this.electronAPI?.clipboardReadText()) || '';
    } else {
      return (await navigator.clipboard.readText()) || '';
    }
  }

  // Notifications
  async showNotification(title: string, body: string, icon?: string): Promise<void> {
    if (this.isElectron && this.electronAPI) {
      await this.electronAPI.showNotification({ title, body, ...(icon !== undefined ? { icon } : {}) });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, ...(icon ? { icon } : {}) });
    }
  }

  // App info
  async getAppVersion(): Promise<string> {
    if (this.isElectron) {
      return (await this.electronAPI?.getAppVersion()) || '1.0.0';
    }
    return '1.0.0-web';
  }

  // Theme
  async getNativeTheme(): Promise<boolean> {
    if (this.isElectron && this.electronAPI) {
      return await this.electronAPI.getNativeTheme();
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  async setNativeTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    if (this.isElectron) {
      await this.electronAPI?.setNativeTheme(theme);
    }
  }

  // Menu event listeners
  setupMenuListeners(handlers: {
    onNewFile?: () => void;
    onOpenFile?: (filePath: string) => void;
    onOpenFolder?: (folderPath: string) => void;
    onSave?: () => void;
    onSaveAs?: (filePath: string) => void;
    onFind?: () => void;
    onReplace?: () => void;
    onToggleSidebar?: () => void;
    onToggleAIChat?: () => void;
    onAIAssistant?: () => void;
    onAIGenerate?: () => void;
    onAIExplain?: () => void;
    onAIOptimize?: () => void;
    onGlobalAIAssistant?: () => void;
  }): void {
    if (!this.isElectron) {
      return;
    }

    if (handlers.onNewFile) {
      this.electronAPI?.onMenuNewFile(() => handlers.onNewFile?.());
    }
    if (handlers.onOpenFile) {
      this.electronAPI?.onMenuOpenFile((_event: unknown, filePath: string) =>
        handlers.onOpenFile?.(filePath)
      );
    }
    if (handlers.onOpenFolder) {
      this.electronAPI?.onMenuOpenFolder((_event: unknown, folderPath: string) =>
        handlers.onOpenFolder?.(folderPath)
      );
    }
    if (handlers.onSave) {
      this.electronAPI?.onMenuSave(() => handlers.onSave?.());
    }
    if (handlers.onSaveAs) {
      this.electronAPI?.onMenuSaveAs((_event: unknown, filePath: string) =>
        handlers.onSaveAs?.(filePath)
      );
    }
    if (handlers.onFind) {
      this.electronAPI?.onMenuFind(() => handlers.onFind?.());
    }
    if (handlers.onReplace) {
      this.electronAPI?.onMenuReplace(() => handlers.onReplace?.());
    }
    if (handlers.onToggleSidebar) {
      this.electronAPI?.onMenuToggleSidebar(() => handlers.onToggleSidebar?.());
    }
    if (handlers.onToggleAIChat) {
      this.electronAPI?.onMenuToggleAIChat(() => handlers.onToggleAIChat?.());
    }
    if (handlers.onAIAssistant) {
      this.electronAPI?.onMenuAIAssistant(() => handlers.onAIAssistant?.());
    }
    if (handlers.onAIGenerate) {
      this.electronAPI?.onMenuAIGenerate(() => handlers.onAIGenerate?.());
    }
    if (handlers.onAIExplain) {
      this.electronAPI?.onMenuAIExplain(() => handlers.onAIExplain?.());
    }
    if (handlers.onAIOptimize) {
      this.electronAPI?.onMenuAIOptimize(() => handlers.onAIOptimize?.());
    }
    if (handlers.onGlobalAIAssistant) {
      this.electronAPI?.onGlobalAIAssistant(() => handlers.onGlobalAIAssistant?.());
    }
  }

  // Cleanup listeners
  cleanupListeners(): void {
    if (!this.isElectron || !this.electronAPI) {
      return;
    }

    const channels = [
      'menu-new-file',
      'menu-open-file',
      'menu-open-folder',
      'menu-save',
      'menu-save-as',
      'menu-find',
      'menu-replace',
      'menu-toggle-sidebar',
      'menu-toggle-ai-chat',
      'menu-ai-assistant',
      'menu-ai-generate',
      'menu-ai-explain',
      'menu-ai-optimize',
      'global-ai-assistant',
    ];

    channels.forEach((channel) => {
      if (this.electronAPI) {
        this.electronAPI.removeAllListeners(channel);
      }
    });
  }

  // App settings
  async setStartOnLogin(enabled: boolean): Promise<void> {
    if (this.isElectron && this.electronAPI) {
      await this.electronAPI.app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
      });
    }
  }

  async getStartOnLogin(): Promise<boolean> {
    if (this.isElectron && this.electronAPI) {
      const settings = await this.electronAPI.app.getLoginItemSettings();
      return settings?.openAtLogin || false;
    }
    return false;
  }

  // Generic invoke method for IPC calls
  async invoke(channel: string, data?: any): Promise<any> {
    if (this.isElectron && this.electronAPI) {
      // Handle code execution specifically
      if (channel === 'code-execute') {
        return await this.electronAPI.codeExecutor.execute(data);
      }
      // Handle other invoke calls generically if needed
      return null;
    }
    return null;
  }

  // Development helpers
  async openDevTools(): Promise<void> {
    if (this.isElectron && import.meta.env.DEV) {
      await (window as unknown as ExtendedWindow & { electronDev?: { openDevTools: () => Promise<void> } }).electronDev?.openDevTools();
    }
  }

  async reload(): Promise<void> {
    if (this.isElectron && import.meta.env.DEV) {
      await (window as unknown as ExtendedWindow & { electronDev?: { reload: () => Promise<void> } }).electronDev?.reload();
    } else {
      window.location.reload();
    }
  }
}
