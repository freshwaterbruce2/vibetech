/**
 * ExtensionManager
 *
 * Plugin architecture for DeepCode Editor inspired by VS Code
 * Manages extension lifecycle, commands, and API
 *
 * Based on 2025 best practices:
 * - Interface-based extension contracts
 * - Dependency resolution with circular detection
 * - Extension context with subscriptions
 * - Command registration and execution
 * - Extension API exposure
 */

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  publisher: string;
  main: string;
  displayName?: string;
  description?: string;
  categories?: string[];
  keywords?: string[];
  icon?: string;
  repository?: string;
  license?: string;
  activationEvents?: string[];
  extensionDependencies?: string[];
}

export interface ExtensionContext {
  extensionId: string;
  subscriptions: { dispose: () => void }[];
  registerCommand: (commandId: string, handler: (...args: any[]) => any) => void;
  api: ExtensionAPI;
}

export interface ExtensionAPI {
  workspace: any;
  window: any;
  commands: any;
}

export interface Extension {
  id: string;
  manifest: ExtensionManifest;
  isActive: boolean;
}

interface ExtensionInternal extends Extension {
  activateFn?: Function;
  deactivateFn?: Function;
  context?: ExtensionContext;
}

export class ExtensionManager {
  private extensions: Map<string, ExtensionInternal> = new Map();
  private commands: Map<string, (...args: any[]) => any> = new Map();

  /**
   * Register a new extension
   */
  registerExtension(manifest: ExtensionManifest, activateFn?: Function): Extension {
    // Validate manifest
    if (!manifest.id || manifest.id.trim() === '') {
      throw new Error('Invalid extension manifest');
    }

    if (!manifest.name || manifest.name.trim() === '') {
      throw new Error('Invalid extension manifest');
    }

    if (!manifest.version) {
      throw new Error('Invalid extension manifest');
    }

    if (!manifest.publisher) {
      throw new Error('Invalid extension manifest');
    }

    if (!manifest.main) {
      throw new Error('Invalid extension manifest');
    }

    // Check for duplicates
    if (this.extensions.has(manifest.id)) {
      throw new Error('Extension already registered');
    }

    const extension: ExtensionInternal = {
      id: manifest.id,
      manifest,
      isActive: false,
      activateFn,
    };

    this.extensions.set(manifest.id, extension);

    return {
      id: extension.id,
      manifest: extension.manifest,
      isActive: extension.isActive,
    };
  }

  /**
   * Activate an extension
   */
  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);

    if (!extension) {
      throw new Error('Extension not found');
    }

    if (extension.isActive) {
      return; // Already active, no-op
    }

    // Check and activate dependencies first
    if (extension.manifest.extensionDependencies) {
      await this.activateDependencies(extensionId, extension.manifest.extensionDependencies, []);
    }

    // Create extension context
    const context: ExtensionContext = {
      extensionId: extension.id,
      subscriptions: [],
      registerCommand: (commandId: string, handler: (...args: any[]) => any) => {
        this.commands.set(commandId, handler);
        context.subscriptions.push({
          dispose: () => this.commands.delete(commandId),
        });
      },
      api: {
        workspace: {
          workspaceFolders: [],
          getConfiguration: (section?: string) => ({}),
          openFolder: (path: string) => Promise.resolve(),
          getFolders: () => [],
        },
        window: {
          showInformationMessage: (message: string) => console.log(message),
          showErrorMessage: (message: string) => console.error(message),
        },
        commands: {
          registerCommand: (commandId: string, handler: (...args: any[]) => any) => {
            context.registerCommand(commandId, handler);
          },
          executeCommand: (commandId: string, ...args: any[]) => {
            return this.executeCommand(commandId, ...args);
          },
        },
      },
    };

    extension.context = context;

    // Call activate function and capture deactivate function
    if (extension.activateFn) {
      const result = extension.activateFn(context);
      if (result && typeof result.then === 'function') {
        const awaitedResult = await result;
        if (awaitedResult && awaitedResult.deactivate) {
          extension.deactivateFn = awaitedResult.deactivate;
        }
      } else if (result && result.deactivate) {
        extension.deactivateFn = result.deactivate;
      }
    }

    extension.isActive = true;
  }

  /**
   * Activate extension dependencies
   */
  private async activateDependencies(
    extensionId: string,
    dependencies: string[],
    visited: string[]
  ): Promise<void> {
    // Check for circular dependencies
    if (visited.includes(extensionId)) {
      throw new Error('Circular dependency detected');
    }

    const newVisited = [...visited, extensionId];

    for (const depId of dependencies) {
      const depExtension = this.extensions.get(depId);

      if (!depExtension) {
        throw new Error('Dependency not found');
      }

      // Recursively activate dependencies
      if (depExtension.manifest.extensionDependencies) {
        await this.activateDependencies(depId, depExtension.manifest.extensionDependencies, newVisited);
      }

      // Activate dependency if not already active
      if (!depExtension.isActive) {
        await this.activateExtension(depId);
      }
    }
  }

  /**
   * Deactivate an extension
   */
  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);

    if (!extension) {
      throw new Error('Extension not found');
    }

    if (!extension.isActive) {
      return; // Already inactive, no-op
    }

    // Call deactivate function if exists
    if (extension.deactivateFn) {
      const result = extension.deactivateFn();
      if (result && typeof result.then === 'function') {
        await result;
      }
    }

    // Dispose all subscriptions
    if (extension.context) {
      for (const subscription of extension.context.subscriptions) {
        subscription.dispose();
      }
      extension.context.subscriptions = [];
    }

    extension.isActive = false;
  }

  /**
   * Uninstall an extension
   */
  uninstallExtension(extensionId: string): void {
    const extension = this.extensions.get(extensionId);

    if (!extension) {
      throw new Error('Extension not found');
    }

    // Deactivate first if active (synchronous version)
    if (extension.isActive) {
      // Call deactivate function if exists
      if (extension.deactivateFn) {
        extension.deactivateFn();
      }

      // Dispose all subscriptions
      if (extension.context) {
        for (const subscription of extension.context.subscriptions) {
          subscription.dispose();
        }
        extension.context.subscriptions = [];
      }

      extension.isActive = false;
    }

    this.extensions.delete(extensionId);
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): Extension {
    const extension = this.extensions.get(extensionId);

    if (!extension) {
      throw new Error('Extension not found');
    }

    return {
      id: extension.id,
      manifest: extension.manifest,
      isActive: extension.isActive,
    };
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values()).map(ext => ({
      id: ext.id,
      manifest: ext.manifest,
      isActive: ext.isActive,
    }));
  }

  /**
   * Get active extensions
   */
  getActiveExtensions(): Extension[] {
    return this.getAllExtensions().filter(ext => ext.isActive);
  }

  /**
   * Get all registered commands
   */
  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Execute a command
   */
  async executeCommand(commandId: string, ...args: any[]): Promise<any> {
    const handler = this.commands.get(commandId);

    if (!handler) {
      throw new Error('Command not found');
    }

    const result = handler(...args);
    if (result && typeof result.then === 'function') {
      return await result;
    }

    return result;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Deactivate all active extensions
    for (const extension of this.extensions.values()) {
      if (extension.isActive) {
        // Call deactivate function if exists
        if (extension.deactivateFn) {
          extension.deactivateFn();
        }

        // Dispose all subscriptions
        if (extension.context) {
          for (const subscription of extension.context.subscriptions) {
            subscription.dispose();
          }
          extension.context.subscriptions = [];
        }

        extension.isActive = false;
      }
    }

    // Clear all data
    this.extensions.clear();
    this.commands.clear();
  }

  /**
   * Set deactivate function for extension (for testing)
   */
  setDeactivateFunction(extensionId: string, deactivateFn: Function): void {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      extension.deactivateFn = deactivateFn;
    }
  }
}
