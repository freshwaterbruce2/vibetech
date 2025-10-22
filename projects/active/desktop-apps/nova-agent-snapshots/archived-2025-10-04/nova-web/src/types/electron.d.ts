// Electron API types for TypeScript
interface NotificationOptions {
  title: string;
  body: string;
  silent?: boolean;
  urgency?: 'low' | 'normal' | 'critical';
}

interface NOVAAPI {
  // File operations
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  listFiles: (path: string) => Promise<string[]>;
  
  // Code execution
  executeCode: (language: string, code: string) => Promise<any>;
  
  // System features
  showNotification: (options: NotificationOptions) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  
  // API communication
  getAPIEndpoint: () => Promise<string>;
  
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // Event listeners
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onFileChanged: (callback: (path: string) => void) => void;
  onQuickSearch: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

interface NOVAInfo {
  version: string;
  platform: NodeJS.Platform;
  isProduction: boolean;
}

declare global {
  interface Window {
    nova: NOVAAPI;
    novaInfo: NOVAInfo;
  }
}

export {};