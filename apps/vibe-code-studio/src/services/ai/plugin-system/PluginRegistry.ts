/**
 * Plugin Registry
 *
 * Central registry for managing AI plugins
 * Handles registration, lifecycle, and execution of plugin capabilities
 */

import { logger } from '../../Logger';
import {
  AIPlugin,
  PluginCapability,
  PluginEvent,
  PluginType,
  ExecutorPlugin,
  LayerPlugin,
  ReviewPlugin,
  DatabasePlugin,
} from './types';

export class PluginRegistry {
  private plugins = new Map<string, AIPlugin>();
  private capabilityMap = new Map<string, Set<AIPlugin>>();
  private typeMap = new Map<PluginType, Set<AIPlugin>>();
  private eventListeners = new Map<string, Set<(event: PluginEvent) => void>>();
  private initializationOrder: string[] = [];

  constructor() {
    logger.debug('[PluginRegistry] Initialized');
  }

  /**
   * Register a new plugin
   */
  async register(plugin: AIPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    // Validate dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Plugin ${plugin.id} depends on ${depId} which is not registered`);
        }
      }
    }

    // Call onRegister lifecycle hook
    if (plugin.onRegister) {
      try {
        await plugin.onRegister();
      } catch (error) {
        logger.error(`[PluginRegistry] Failed to initialize plugin ${plugin.id}:`, error);
        throw error;
      }
    }

    // Register plugin
    this.plugins.set(plugin.id, plugin);
    this.initializationOrder.push(plugin.id);

    // Index by type
    if (!this.typeMap.has(plugin.type)) {
      this.typeMap.set(plugin.type, new Set());
    }
    this.typeMap.get(plugin.type)!.add(plugin);

    // Index capabilities
    for (const capability of plugin.capabilities) {
      if (!this.capabilityMap.has(capability.name)) {
        this.capabilityMap.set(capability.name, new Set());
      }
      this.capabilityMap.get(capability.name)!.add(plugin);
    }

    // Emit registration event
    this.emitEvent({
      type: 'registered',
      pluginId: plugin.id,
      timestamp: new Date(),
      data: { name: plugin.name, version: plugin.version },
    });

    logger.info(`[PluginRegistry] Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check for dependent plugins
    const dependents = this.findDependents(pluginId);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister ${pluginId}: plugins depend on it: ${dependents.join(', ')}`
      );
    }

    // Call onUnregister lifecycle hook
    if (plugin.onUnregister) {
      try {
        await plugin.onUnregister();
      } catch (error) {
        logger.error(`[PluginRegistry] Error during plugin cleanup:`, error);
      }
    }

    // Remove from registries
    this.plugins.delete(pluginId);
    this.typeMap.get(plugin.type)?.delete(plugin);

    // Remove from capability map
    for (const capability of plugin.capabilities) {
      this.capabilityMap.get(capability.name)?.delete(plugin);
    }

    // Remove from initialization order
    const index = this.initializationOrder.indexOf(pluginId);
    if (index > -1) {
      this.initializationOrder.splice(index, 1);
    }

    // Emit unregistration event
    this.emitEvent({
      type: 'unregistered',
      pluginId,
      timestamp: new Date(),
    });

    logger.info(`[PluginRegistry] Unregistered plugin: ${plugin.name}`);
  }

  /**
   * Get a plugin by ID
   */
  getPlugin<T extends AIPlugin = AIPlugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T;
  }

  /**
   * Get all plugins of a specific type
   */
  getPluginsByType<T extends AIPlugin = AIPlugin>(type: PluginType): T[] {
    const plugins = this.typeMap.get(type);
    return plugins ? Array.from(plugins) as T[] : [];
  }

  /**
   * Get all plugins with a specific capability
   */
  getPluginsWithCapability(capabilityName: string): AIPlugin[] {
    const plugins = this.capabilityMap.get(capabilityName);
    return plugins ? Array.from(plugins) : [];
  }

  /**
   * Execute a capability across all plugins that support it
   */
  async executeCapability(
    capabilityName: string,
    ...args: any[]
  ): Promise<any[]> {
    const plugins = this.getPluginsWithCapability(capabilityName);
    const results: any[] = [];

    for (const plugin of plugins) {
      if (!plugin.enabled ?? true) continue;

      const capability = plugin.capabilities.find(c => c.name === capabilityName);
      if (!capability) continue;

      try {
        const result = await capability.handler(...args);
        results.push(result);
      } catch (error) {
        logger.error(
          `[PluginRegistry] Error executing ${capabilityName} on ${plugin.id}:`,
          error
        );

        if (plugin.onError) {
          plugin.onError(error as Error);
        }

        this.emitEvent({
          type: 'error',
          pluginId: plugin.id,
          timestamp: new Date(),
          data: { capability: capabilityName, error },
        });
      }
    }

    return results;
  }

  /**
   * Get all executor plugins for custom action types
   */
  getExecutorForAction(actionType: string): ExecutorPlugin | undefined {
    const executors = this.getPluginsByType<ExecutorPlugin>('executor');
    return executors.find(e => e.actionType === actionType);
  }

  /**
   * Get all layer plugins sorted by layer ID
   */
  getLayerPlugins(): LayerPlugin[] {
    const layers = this.getPluginsByType<LayerPlugin>('layer');
    return layers.sort((a, b) => a.layerId - b.layerId);
  }

  /**
   * Get all review plugins
   */
  getReviewPlugins(): ReviewPlugin[] {
    return this.getPluginsByType<ReviewPlugin>('reviewer');
  }

  /**
   * Get active database plugins
   */
  getDatabasePlugins(): DatabasePlugin[] {
    return this.getPluginsByType<DatabasePlugin>('database');
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalPlugins: number;
    byType: Record<PluginType, number>;
    capabilities: number;
  } {
    const byType: Record<PluginType, number> = {
      layer: 0,
      orchestrator: 0,
      reviewer: 0,
      executor: 0,
      database: 0,
    };

    for (const [type, plugins] of this.typeMap.entries()) {
      byType[type] = plugins.size;
    }

    return {
      totalPlugins: this.plugins.size,
      byType,
      capabilities: this.capabilityMap.size,
    };
  }

  /**
   * Subscribe to registry events
   */
  on(event: string, listener: (event: PluginEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Unsubscribe from registry events
   */
  off(event: string, listener: (event: PluginEvent) => void): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * Clear all plugins
   */
  async clear(): Promise<void> {
    // Unregister in reverse order
    for (let i = this.initializationOrder.length - 1; i >= 0; i--) {
      await this.unregister(this.initializationOrder[i]);
    }
  }

  /**
   * Find plugins that depend on a given plugin
   */
  private findDependents(pluginId: string): string[] {
    const dependents: string[] = [];

    for (const [id, plugin] of this.plugins.entries()) {
      if (plugin.dependencies?.includes(pluginId)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: PluginEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          logger.error('[PluginRegistry] Error in event listener:', error);
        }
      }
    }
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();