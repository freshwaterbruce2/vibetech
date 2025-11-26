/**
 * Extension System Types for DeepCode Editor
 * Plugin architecture inspired by VS Code Extension API
 */

export interface ExtensionManifest {
  /** Unique extension identifier (e.g., "publisher.extension-name") */
  id: string;

  /** Display name */
  name: string;

  /** Extension version (semver) */
  version: string;

  /** Extension description */
  description?: string;

  /** Extension author/publisher */
  publisher: string;

  /** Main entry point (JavaScript file path) */
  main?: string;

  /** Activation events (when to load the extension) */
  activationEvents?: string[];

  /** Extension dependencies (other extension IDs) */
  dependencies?: string[];

  /** Contribution points (UI, commands, etc.) */
  contributes?: ExtensionContributions;

  /** Extension metadata */
  metadata?: {
    icon?: string;
    repository?: string;
    license?: string;
    keywords?: string[];
  };
}

export interface ExtensionContributions {
  /** Command contributions */
  commands?: {
    id: string;
    title: string;
    category?: string;
    icon?: string;
    keybinding?: string;
  }[];

  /** Menu contributions */
  menus?: Record<string, {
    command: string;
    when?: string;
    group?: string;
  }[]>;

  /** Settings contributions */
  configuration?: {
    title: string;
    properties: Record<string, {
      type: string;
      default?: any;
      description?: string;
      enum?: any[];
    }>;
  };

  /** View contributions (sidebar panels, etc.) */
  views?: Record<string, {
    id: string;
    name: string;
    icon?: string;
  }[]>;

  /** Language contributions */
  languages?: {
    id: string;
    extensions?: string[];
    aliases?: string[];
    configuration?: string;
  }[];

  /** Theme contributions */
  themes?: {
    id: string;
    label: string;
    path: string;
  }[];
}

export interface ExtensionContext {
  /** Extension unique ID */
  extensionId: string;

  /** Extension installation path */
  extensionPath: string;

  /** Global state storage */
  globalState: ExtensionState;

  /** Workspace state storage */
  workspaceState: ExtensionState;

  /** Subscribe to extension lifecycle events */
  subscriptions: { dispose: () => void }[];

  /** Logger for the extension */
  logger: ExtensionLogger;
}

export interface ExtensionState {
  get<T>(key: string): T | undefined;
  update(key: string, value: any): Promise<void>;
  keys(): readonly string[];
}

export interface ExtensionLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string | Error): void;
  debug(message: string): void;
}

export interface Extension {
  /** Extension manifest */
  manifest: ExtensionManifest;

  /** Extension context */
  context: ExtensionContext;

  /** Extension activation state */
  isActive: boolean;

  /** Extension instance (the loaded module) */
  instance?: any;

  /** Activate the extension */
  activate(): Promise<void>;

  /** Deactivate the extension */
  deactivate(): Promise<void>;
}

export type ExtensionEventType =
  | 'extensionLoaded'
  | 'extensionActivated'
  | 'extensionDeactivated'
  | 'extensionUnloaded'
  | 'extensionError';

export interface ExtensionEvent {
  type: ExtensionEventType;
  extensionId: string;
  timestamp: number;
  data?: any;
}

export type ExtensionEventHandler = (event: ExtensionEvent) => void;

/**
 * Extension API surface (what extensions can access)
 */
export interface ExtensionAPI {
  /** Commands API */
  commands: {
    registerCommand(id: string, callback: (...args: any[]) => any): void;
    executeCommand(id: string, ...args: any[]): Promise<any>;
  };

  /** Window API */
  window: {
    showInformationMessage(message: string): void;
    showWarningMessage(message: string): void;
    showErrorMessage(message: string): void;
    showInputBox(options?: { prompt?: string; placeholder?: string }): Promise<string | undefined>;
  };

  /** Workspace API */
  workspace: {
    getWorkspaceFolders(): string[];
    findFiles(pattern: string): Promise<string[]>;
    openTextDocument(path: string): Promise<any>;
  };

  /** Editor API */
  editor: {
    getActiveEditor(): any;
    getVisibleEditors(): any[];
    openFile(path: string): Promise<void>;
  };
}

/**
 * Extension activation function signature
 */
export type ExtensionActivate = (context: ExtensionContext, api: ExtensionAPI) => Promise<void> | void;

/**
 * Extension deactivation function signature
 */
export type ExtensionDeactivate = () => Promise<void> | void;

/**
 * Extension module structure (what extensions export)
 */
export interface ExtensionModule {
  activate: ExtensionActivate;
  deactivate?: ExtensionDeactivate;
}
