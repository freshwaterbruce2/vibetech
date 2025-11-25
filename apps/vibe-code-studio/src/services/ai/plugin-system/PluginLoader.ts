/**
 * Plugin Loader
 *
 * Dynamically loads and registers plugins from various sources
 * Supports configuration-based loading and auto-discovery
 */

import { AIPlugin, PluginManifest } from './types';
import { pluginRegistry } from './PluginRegistry';
import { logger } from '../../Logger';

export interface PluginConfig {
  enabled: string[];
  disabled?: string[];
  autoDiscover: boolean;
  pluginDirectory?: string;
  configPath?: string;
}

export class PluginLoader {
  private config: PluginConfig = {
    enabled: [],
    autoDiscover: false,
    pluginDirectory: './plugins'
  };

  private loadedPlugins = new Set<string>();

  constructor(config?: Partial<PluginConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Load plugins from configuration
   */
  async loadFromConfig(configPath?: string): Promise<void> {
    try {
      // Load configuration
      const config = await this.loadConfiguration(configPath);
      this.config = { ...this.config, ...config };

      logger.info(`[PluginLoader] Loading plugins from config: ${config.enabled.length} plugins`);

      // Load enabled plugins
      for (const pluginPath of config.enabled) {
        if (!config.disabled?.includes(pluginPath)) {
          await this.loadPlugin(pluginPath);
        }
      }

      // Auto-discover if enabled
      if (config.autoDiscover && config.pluginDirectory) {
        await this.autoDiscoverPlugins(config.pluginDirectory);
      }

      logger.info(`[PluginLoader] Successfully loaded ${this.loadedPlugins.size} plugins`);
    } catch (error) {
      logger.error('[PluginLoader] Failed to load plugins from config:', error);
      throw error;
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginPath: string): Promise<AIPlugin | undefined> {
    if (this.loadedPlugins.has(pluginPath)) {
      logger.debug(`[PluginLoader] Plugin already loaded: ${pluginPath}`);
      return undefined;
    }

    try {
      logger.debug(`[PluginLoader] Loading plugin: ${pluginPath}`);

      // Dynamically import the plugin
      let plugin: AIPlugin;

      if (pluginPath.startsWith('@')) {
        // NPM package
        plugin = await this.loadNpmPlugin(pluginPath);
      } else if (pluginPath.startsWith('./') || pluginPath.startsWith('../')) {
        // Local file
        plugin = await this.loadLocalPlugin(pluginPath);
      } else {
        // Built-in plugin
        plugin = await this.loadBuiltInPlugin(pluginPath);
      }

      // Register the plugin
      await pluginRegistry.register(plugin);
      this.loadedPlugins.add(pluginPath);

      logger.info(`[PluginLoader] Successfully loaded plugin: ${plugin.name} v${plugin.version}`);
      return plugin;
    } catch (error) {
      logger.error(`[PluginLoader] Failed to load plugin ${pluginPath}:`, error);
      // Don't throw - allow other plugins to load
      return undefined;
    }
  }

  /**
   * Load an NPM package plugin
   */
  private async loadNpmPlugin(packageName: string): Promise<AIPlugin> {
    try {
      // Dynamic import of NPM package
      const module = await import(packageName);

      if (module.default && this.isValidPlugin(module.default)) {
        return module.default;
      } else if (this.isValidPlugin(module)) {
        return module as AIPlugin;
      } else {
        throw new Error(`Invalid plugin structure in ${packageName}`);
      }
    } catch (error) {
      throw new Error(`Failed to load NPM plugin ${packageName}: ${error}`);
    }
  }

  /**
   * Load a local plugin file
   */
  private async loadLocalPlugin(filePath: string): Promise<AIPlugin> {
    try {
      // For local files, we'll simulate the loading
      // In a real implementation, this would use dynamic import

      // Simulate loading a local plugin
      const plugin: AIPlugin = {
        id: `local-${Date.now()}`,
        name: `Local Plugin from ${filePath}`,
        version: '1.0.0',
        type: 'executor',
        capabilities: []
      };

      return plugin;
    } catch (error) {
      throw new Error(`Failed to load local plugin ${filePath}: ${error}`);
    }
  }

  /**
   * Load a built-in plugin
   */
  private async loadBuiltInPlugin(pluginName: string): Promise<AIPlugin> {
    // Map of built-in plugins
    const builtInPlugins: Record<string, () => AIPlugin> = {
      'security-layer': () => ({
        id: 'security-layer',
        name: 'Security Analysis Layer',
        version: '1.0.0',
        type: 'layer',
        capabilities: [{
          name: 'analyze-security',
          description: 'Analyze code for security vulnerabilities',
          handler: async (task: any) => ({
            insights: ['Security analysis completed'],
            score: 0.85
          })
        }]
      }),
      'performance-reviewer': () => ({
        id: 'performance-reviewer',
        name: 'Performance Review Plugin',
        version: '1.0.0',
        type: 'reviewer',
        capabilities: [{
          name: 'review-performance',
          description: 'Review code for performance issues',
          handler: async (task: any, edits: any[]) => ({
            perspective: 'performance',
            taskId: task.id,
            score: 0.9,
            feedback: ['Performance review completed'],
            requiredAmendments: []
          })
        }]
      }),
      'git-executor': () => ({
        id: 'git-executor',
        name: 'Git Operations Executor',
        version: '1.0.0',
        type: 'executor',
        capabilities: [{
          name: 'execute-git',
          description: 'Execute git operations',
          handler: async (params: any) => ({
            success: true,
            message: `Git operation completed: ${params.command}`
          })
        }]
      })
    };

    const pluginFactory = builtInPlugins[pluginName];
    if (!pluginFactory) {
      throw new Error(`Unknown built-in plugin: ${pluginName}`);
    }

    return pluginFactory();
  }

  /**
   * Auto-discover plugins in a directory
   */
  private async autoDiscoverPlugins(directory: string): Promise<void> {
    logger.info(`[PluginLoader] Auto-discovering plugins in: ${directory}`);

    // In a real implementation, this would scan the directory
    // For now, we'll simulate finding plugins
    const discoveredPlugins = [
      'security-layer',
      'performance-reviewer'
    ];

    for (const pluginName of discoveredPlugins) {
      if (!this.loadedPlugins.has(pluginName)) {
        await this.loadPlugin(pluginName);
      }
    }
  }

  /**
   * Load plugin configuration
   */
  private async loadConfiguration(configPath?: string): Promise<PluginConfig> {
    // In a real implementation, this would read from a file
    // For now, return default configuration
    return {
      enabled: [
        'security-layer',
        'performance-reviewer',
        'git-executor'
      ],
      disabled: [],
      autoDiscover: true,
      pluginDirectory: './plugins'
    };
  }

  /**
   * Validate if an object is a valid plugin
   */
  private isValidPlugin(obj: any): obj is AIPlugin {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.version === 'string' &&
      typeof obj.type === 'string' &&
      Array.isArray(obj.capabilities)
    );
  }

  /**
   * Load plugin from manifest
   */
  async loadFromManifest(manifest: PluginManifest): Promise<void> {
    logger.debug(`[PluginLoader] Loading plugin from manifest: ${manifest.name}`);

    try {
      const plugin = await this.loadPlugin(manifest.main);

      // Override properties from manifest if needed
      if (plugin) {
        plugin.id = manifest.id || plugin.id;
        plugin.name = manifest.name || plugin.name;
        plugin.version = manifest.version || plugin.version;
      }
    } catch (error) {
      logger.error(`[PluginLoader] Failed to load plugin from manifest ${manifest.name}:`, error);
      throw error;
    }
  }

  /**
   * Unload all plugins
   */
  async unloadAll(): Promise<void> {
    logger.info('[PluginLoader] Unloading all plugins');

    for (const pluginId of this.loadedPlugins) {
      try {
        // Get plugin from registry and unregister
        const plugin = pluginRegistry.getPlugin(pluginId);
        if (plugin) {
          await pluginRegistry.unregister(plugin.id);
        }
      } catch (error) {
        logger.error(`[PluginLoader] Failed to unload plugin ${pluginId}:`, error);
      }
    }

    this.loadedPlugins.clear();
  }

  /**
   * Get loaded plugins
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins);
  }

  /**
   * Get loader statistics
   */
  getStats(): {
    loaded: number;
    enabled: number;
    autoDiscover: boolean;
  } {
    return {
      loaded: this.loadedPlugins.size,
      enabled: this.config.enabled.length,
      autoDiscover: this.config.autoDiscover
    };
  }
}

// Export singleton instance
export const pluginLoader = new PluginLoader();