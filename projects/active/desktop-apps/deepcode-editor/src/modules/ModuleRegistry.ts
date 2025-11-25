import { logger } from '../services/Logger';
import { EditorModuleInterface } from './editor';

export interface Module {
  name: string;
  version: string;
  dependencies: string[];
  exports: string[];
  instance?: unknown;
}

export interface ModuleInterfaces {
  editor?: EditorModuleInterface;
  aiAssistant?: unknown;
  versionControl?: unknown;
  workspace?: unknown;
}

/**
 * ModuleRegistry is a singleton that manages the registration and lifecycle of
 * application modules. It ensures proper dependency resolution and provides
 * a centralized access point for module interfaces.
 *
 * @example
 * ```typescript
 * // Register a module
 * ModuleRegistry.registerModule({
 *   name: 'editor',
 *   version: '1.0.0',
 *   dependencies: ['workspace'],
 *   exports: ['EditorService']
 * })
 *
 * // Access module interface
 * const editor = ModuleRegistry.getModuleInterface('editor')
 * ```
 */
class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, Module> = new Map();
  private moduleInterfaces: ModuleInterfaces = {};

  private constructor() {}

  /**
   * Gets the singleton instance of ModuleRegistry
   * @returns The ModuleRegistry instance
   */
  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Registers a new module with dependency checking
   * @param module - The module to register
   * @throws Warning if module is already registered or dependencies are missing
   */
  registerModule(module: Module): void {
    if (this.modules.has(module.name)) {
      logger.warn(`Module ${module.name} already registered`);
      return;
    }

    // Check dependencies
    for (const dep of module.dependencies) {
      if (!this.modules.has(dep)) {
        logger.warn(`Module ${module.name} depends on ${dep} which is not registered`);
      }
    }

    this.modules.set(module.name, module);
    logger.debug(`Module ${module.name} v${module.version} registered`);
  }

  setModuleInterface(name: keyof ModuleInterfaces, moduleInterface: unknown): void {
    this.moduleInterfaces[name] = moduleInterface as any;
  }

  getModuleInterface<K extends keyof ModuleInterfaces>(name: K): ModuleInterfaces[K] {
    const moduleInterface = this.moduleInterfaces[name];
    if (!moduleInterface) {
      throw new Error(`Module interface ${name} not found`);
    }
    return moduleInterface;
  }

  getModule(name: string): Module | undefined {
    return this.modules.get(name);
  }

  getAllModules(): Module[] {
    return Array.from(this.modules.values());
  }

  checkDependencies(moduleName: string): boolean {
    const module = this.modules.get(moduleName);
    if (!module) {
      return false;
    }

    return module.dependencies.every((dep) => this.modules.has(dep));
  }

  getModuleDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const [name, module] of this.modules) {
      graph.set(name, module.dependencies);
    }

    return graph;
  }
}

export default ModuleRegistry.getInstance();
