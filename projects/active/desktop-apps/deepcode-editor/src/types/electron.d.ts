// Type definitions for Electron API exposed through preload script

interface ElectronAPI {
  // Window controls
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;

  // File operations
  showOpenDialog: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  showSaveDialog: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  showMessageBox: (options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }) => Promise<{ response: number }>;

  // System integration
  shellOpenExternal: (url: string) => Promise<void>;
  clipboardWriteText: (text: string) => Promise<void>;
  clipboardReadText: () => Promise<string>;

  // Notifications
  showNotification: (options: { title: string; body: string }) => Promise<void>;

  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;

  // Theme
  getNativeTheme: () => Promise<{ shouldUseDarkColors: boolean }>;
  setNativeTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;

  // Menu events - listening
  onMenuNewFile: (callback: () => void) => void;
  onMenuOpenFile: (callback: () => void) => void;
  onMenuOpenFolder: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuSaveAs: (callback: () => void) => void;
  onMenuFind: (callback: () => void) => void;
  onMenuReplace: (callback: () => void) => void;
  onMenuToggleSidebar: (callback: () => void) => void;
  onMenuToggleAIChat: (callback: () => void) => void;
  onMenuAIAssistant: (callback: () => void) => void;
  onMenuAIGenerate: (callback: () => void) => void;
  onMenuAIExplain: (callback: () => void) => void;
  onMenuAIOptimize: (callback: () => void) => void;
  onGlobalAIAssistant: (callback: () => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;

  // File system operations
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    mkdir: (path: string) => Promise<void>;
    readdir: (path: string) => Promise<string[]>;
    stat: (path: string) => Promise<{
      isFile: () => boolean;
      isDirectory: () => boolean;
      size: number;
      mtime: Date;
    }>;
    unlink: (path: string) => Promise<void>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
  };

  // App-specific features
  app: {
    restart: () => Promise<void>;
    getPath: (
      name:
        | 'home'
        | 'appData'
        | 'userData'
        | 'temp'
        | 'desktop'
        | 'documents'
        | 'downloads'
        | 'music'
        | 'pictures'
        | 'videos'
    ) => Promise<string>;
    setLoginItemSettings: (settings: { openAtLogin?: boolean }) => Promise<void>;
    getLoginItemSettings: () => Promise<{ openAtLogin: boolean }>;
  };
}

interface ElectronDev {
  openDevTools: () => Promise<void>;
  reload: () => Promise<void>;
}

interface ElectronEnv {
  isElectron: boolean;
  platform: string;
  arch: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electronDev?: ElectronDev;
    electronEnv?: ElectronEnv;
  }
}

export {};
