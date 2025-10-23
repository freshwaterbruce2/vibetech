/**
 * ExtensionManager Tests (TDD RED Phase)
 *
 * Plugin system with:
 * - Extension registration and lifecycle (install, activate, deactivate, uninstall)
 * - Extension manifest validation (package.json style)
 * - Extension API (commands, hooks, UI contributions)
 * - Extension isolation and sandboxing
 * - Extension dependencies and versioning
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExtensionManager,
  Extension,
  ExtensionManifest,
  ExtensionContext,
  ExtensionAPI,
} from '../../services/ExtensionManager';

describe('ExtensionManager', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Extension Registration', () => {
    it('should register a new extension', () => {
      const manifest: ExtensionManifest = {
        id: 'test-extension',
        name: 'Test Extension',
        version: '1.0.0',
        publisher: 'test-publisher',
        main: './extension.js',
      };

      const extension = manager.registerExtension(manifest);

      expect(extension).toBeDefined();
      expect(extension.id).toBe('test-extension');
      expect(extension.manifest).toEqual(manifest);
      expect(extension.isActive).toBe(false);
    });

    it('should assign unique IDs to extensions', () => {
      const ext1 = manager.registerExtension({
        id: 'ext1',
        name: 'Extension 1',
        version: '1.0.0',
        publisher: 'publisher',
        main: './ext1.js',
      });

      const ext2 = manager.registerExtension({
        id: 'ext2',
        name: 'Extension 2',
        version: '1.0.0',
        publisher: 'publisher',
        main: './ext2.js',
      });

      expect(ext1.id).not.toBe(ext2.id);
    });

    it('should prevent duplicate extension IDs', () => {
      const manifest: ExtensionManifest = {
        id: 'duplicate',
        name: 'Duplicate',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest);

      expect(() => {
        manager.registerExtension(manifest);
      }).toThrow('Extension already registered');
    });

    it('should validate extension manifest', () => {
      expect(() => {
        manager.registerExtension({
          id: '',
          name: 'Invalid',
          version: '1.0.0',
          publisher: 'publisher',
          main: './extension.js',
        });
      }).toThrow('Invalid extension manifest');
    });

    it('should support extension metadata', () => {
      const manifest: ExtensionManifest = {
        id: 'meta-ext',
        name: 'Metadata Extension',
        version: '1.2.3',
        publisher: 'publisher',
        main: './extension.js',
        displayName: 'My Extension',
        description: 'A test extension',
        categories: ['Programming Languages', 'Themes'],
        keywords: ['typescript', 'code'],
        icon: './icon.png',
        repository: 'https://github.com/user/repo',
        license: 'MIT',
      };

      const extension = manager.registerExtension(manifest);

      expect(extension.manifest.displayName).toBe('My Extension');
      expect(extension.manifest.categories).toContain('Themes');
    });
  });

  describe('Extension Activation', () => {
    it('should activate an extension', async () => {
      const manifest: ExtensionManifest = {
        id: 'test-ext',
        name: 'Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      const extension = manager.registerExtension(manifest);

      await manager.activateExtension(extension.id);

      const activated = manager.getExtension(extension.id);
      expect(activated.isActive).toBe(true);
    });

    it('should call activate function when activating', async () => {
      const activateFn = vi.fn();

      const manifest: ExtensionManifest = {
        id: 'activate-test',
        name: 'Activate Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
        activationEvents: ['onStartup'],
      };

      manager.registerExtension(manifest, activateFn);

      await manager.activateExtension('activate-test');

      expect(activateFn).toHaveBeenCalledOnce();
      expect(activateFn).toHaveBeenCalledWith(expect.any(Object)); // ExtensionContext
    });

    it('should provide extension context to activate function', async () => {
      let receivedContext: ExtensionContext | null = null;

      const activateFn = (context: ExtensionContext) => {
        receivedContext = context;
      };

      const manifest: ExtensionManifest = {
        id: 'context-test',
        name: 'Context Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('context-test');

      expect(receivedContext).toBeDefined();
      expect(receivedContext?.extensionId).toBe('context-test');
      expect(receivedContext?.subscriptions).toBeDefined();
    });

    it('should handle activation errors', async () => {
      const activateFn = () => {
        throw new Error('Activation failed');
      };

      const manifest: ExtensionManifest = {
        id: 'error-ext',
        name: 'Error Extension',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);

      await expect(
        manager.activateExtension('error-ext')
      ).rejects.toThrow('Activation failed');
    });

    it('should support activation events', () => {
      const manifest: ExtensionManifest = {
        id: 'events-ext',
        name: 'Events Extension',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
        activationEvents: [
          'onStartup',
          'onLanguage:typescript',
          'onCommand:extension.command',
        ],
      };

      const extension = manager.registerExtension(manifest);

      expect(extension.manifest.activationEvents).toContain('onStartup');
      expect(extension.manifest.activationEvents).toContain('onLanguage:typescript');
    });
  });

  describe('Extension Deactivation', () => {
    it('should deactivate an active extension', async () => {
      const manifest: ExtensionManifest = {
        id: 'deactivate-test',
        name: 'Deactivate Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      const extension = manager.registerExtension(manifest);
      await manager.activateExtension(extension.id);

      await manager.deactivateExtension(extension.id);

      const deactivated = manager.getExtension(extension.id);
      expect(deactivated.isActive).toBe(false);
    });

    it('should call deactivate function when deactivating', async () => {
      const deactivateFn = vi.fn();

      const activateFn = () => {
        return {
          deactivate: deactivateFn,
        };
      };

      const manifest: ExtensionManifest = {
        id: 'deactivate-fn-test',
        name: 'Deactivate Function Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('deactivate-fn-test');
      await manager.deactivateExtension('deactivate-fn-test');

      expect(deactivateFn).toHaveBeenCalledOnce();
    });

    it('should dispose all subscriptions on deactivate', async () => {
      const disposable1 = { dispose: vi.fn() };
      const disposable2 = { dispose: vi.fn() };

      const activateFn = (context: ExtensionContext) => {
        context.subscriptions.push(disposable1);
        context.subscriptions.push(disposable2);
      };

      const manifest: ExtensionManifest = {
        id: 'subscriptions-test',
        name: 'Subscriptions Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('subscriptions-test');
      await manager.deactivateExtension('subscriptions-test');

      expect(disposable1.dispose).toHaveBeenCalledOnce();
      expect(disposable2.dispose).toHaveBeenCalledOnce();
    });
  });

  describe('Extension Commands', () => {
    it('should register a command from extension', async () => {
      const commandHandler = vi.fn();

      const activateFn = (context: ExtensionContext) => {
        context.registerCommand('test.command', commandHandler);
      };

      const manifest: ExtensionManifest = {
        id: 'command-ext',
        name: 'Command Extension',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('command-ext');

      const commands = manager.getCommands();
      expect(commands).toContain('test.command');
    });

    it('should execute registered commands', async () => {
      const commandHandler = vi.fn((arg1: string, arg2: number) => {
        return `Result: ${arg1}-${arg2}`;
      });

      const activateFn = (context: ExtensionContext) => {
        context.registerCommand('test.execute', commandHandler);
      };

      const manifest: ExtensionManifest = {
        id: 'execute-ext',
        name: 'Execute Extension',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('execute-ext');

      const result = await manager.executeCommand('test.execute', 'hello', 42);

      expect(commandHandler).toHaveBeenCalledWith('hello', 42);
      expect(result).toBe('Result: hello-42');
    });

    it('should throw error for unknown commands', async () => {
      await expect(
        manager.executeCommand('unknown.command')
      ).rejects.toThrow('Command not found');
    });
  });

  describe('Extension API', () => {
    it('should provide extension API to activate function', async () => {
      let receivedAPI: ExtensionAPI | null = null;

      const activateFn = (context: ExtensionContext) => {
        receivedAPI = context.api;
      };

      const manifest: ExtensionManifest = {
        id: 'api-test',
        name: 'API Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('api-test');

      expect(receivedAPI).toBeDefined();
      expect(receivedAPI?.workspace).toBeDefined();
      expect(receivedAPI?.window).toBeDefined();
      expect(receivedAPI?.commands).toBeDefined();
    });

    it('should support workspace API', async () => {
      let workspaceAPI: any = null;

      const activateFn = (context: ExtensionContext) => {
        workspaceAPI = context.api.workspace;
      };

      const manifest: ExtensionManifest = {
        id: 'workspace-api-test',
        name: 'Workspace API Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('workspace-api-test');

      expect(workspaceAPI).toBeDefined();
      expect(workspaceAPI.openFolder).toBeDefined();
      expect(workspaceAPI.getFolders).toBeDefined();
    });
  });

  describe('Extension Dependencies', () => {
    it('should support extension dependencies', () => {
      const manifest: ExtensionManifest = {
        id: 'dependent-ext',
        name: 'Dependent Extension',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
        extensionDependencies: ['base-ext', 'util-ext'],
      };

      const extension = manager.registerExtension(manifest);

      expect(extension.manifest.extensionDependencies).toContain('base-ext');
      expect(extension.manifest.extensionDependencies).toContain('util-ext');
    });

    it('should activate dependencies before dependent extension', async () => {
      const activationOrder: string[] = [];

      const baseActivate = () => {
        activationOrder.push('base');
      };

      const dependentActivate = () => {
        activationOrder.push('dependent');
      };

      manager.registerExtension(
        {
          id: 'base-ext',
          name: 'Base',
          version: '1.0.0',
          publisher: 'publisher',
          main: './base.js',
        },
        baseActivate
      );

      manager.registerExtension(
        {
          id: 'dependent-ext',
          name: 'Dependent',
          version: '1.0.0',
          publisher: 'publisher',
          main: './dependent.js',
          extensionDependencies: ['base-ext'],
        },
        dependentActivate
      );

      await manager.activateExtension('dependent-ext');

      expect(activationOrder).toEqual(['base', 'dependent']);
    });

    it('should detect circular dependencies', () => {
      manager.registerExtension({
        id: 'ext-a',
        name: 'Extension A',
        version: '1.0.0',
        publisher: 'publisher',
        main: './a.js',
        extensionDependencies: ['ext-b'],
      });

      manager.registerExtension({
        id: 'ext-b',
        name: 'Extension B',
        version: '1.0.0',
        publisher: 'publisher',
        main: './b.js',
        extensionDependencies: ['ext-a'],
      });

      expect(async () => {
        await manager.activateExtension('ext-a');
      }).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('Extension Lifecycle', () => {
    it('should uninstall an extension', () => {
      const manifest: ExtensionManifest = {
        id: 'uninstall-test',
        name: 'Uninstall Test',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      const extension = manager.registerExtension(manifest);

      manager.uninstallExtension(extension.id);

      expect(() => manager.getExtension(extension.id)).toThrow('Extension not found');
    });

    it('should deactivate before uninstalling', async () => {
      const deactivateFn = vi.fn();

      const activateFn = () => {
        return { deactivate: deactivateFn };
      };

      const manifest: ExtensionManifest = {
        id: 'deactivate-uninstall',
        name: 'Deactivate Uninstall',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest, activateFn);
      await manager.activateExtension('deactivate-uninstall');

      manager.uninstallExtension('deactivate-uninstall');

      expect(deactivateFn).toHaveBeenCalled();
    });

    it('should get all installed extensions', () => {
      manager.registerExtension({
        id: 'ext1',
        name: 'Extension 1',
        version: '1.0.0',
        publisher: 'publisher',
        main: './ext1.js',
      });

      manager.registerExtension({
        id: 'ext2',
        name: 'Extension 2',
        version: '1.0.0',
        publisher: 'publisher',
        main: './ext2.js',
      });

      manager.registerExtension({
        id: 'ext3',
        name: 'Extension 3',
        version: '1.0.0',
        publisher: 'publisher',
        main: './ext3.js',
      });

      const extensions = manager.getAllExtensions();
      expect(extensions).toHaveLength(3);
    });

    it('should get active extensions only', async () => {
      manager.registerExtension({
        id: 'active1',
        name: 'Active 1',
        version: '1.0.0',
        publisher: 'publisher',
        main: './active1.js',
      });

      manager.registerExtension({
        id: 'inactive',
        name: 'Inactive',
        version: '1.0.0',
        publisher: 'publisher',
        main: './inactive.js',
      });

      manager.registerExtension({
        id: 'active2',
        name: 'Active 2',
        version: '1.0.0',
        publisher: 'publisher',
        main: './active2.js',
      });

      await manager.activateExtension('active1');
      await manager.activateExtension('active2');

      const activeExtensions = manager.getActiveExtensions();
      expect(activeExtensions).toHaveLength(2);
      expect(activeExtensions.map(e => e.id)).toContain('active1');
      expect(activeExtensions.map(e => e.id)).toContain('active2');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid extension ID', () => {
      expect(() => {
        manager.getExtension('non-existent');
      }).toThrow('Extension not found');
    });

    it('should handle activation of already active extension', async () => {
      const manifest: ExtensionManifest = {
        id: 'already-active',
        name: 'Already Active',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
      };

      manager.registerExtension(manifest);
      await manager.activateExtension('already-active');

      // Should not throw error, just return early
      await manager.activateExtension('already-active');

      const extension = manager.getExtension('already-active');
      expect(extension.isActive).toBe(true);
    });

    it('should handle missing dependencies', async () => {
      manager.registerExtension({
        id: 'missing-deps',
        name: 'Missing Dependencies',
        version: '1.0.0',
        publisher: 'publisher',
        main: './extension.js',
        extensionDependencies: ['non-existent-ext'],
      });

      await expect(
        manager.activateExtension('missing-deps')
      ).rejects.toThrow('Dependency not found');
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should dispose all extensions', async () => {
      const deactivate1 = vi.fn();
      const deactivate2 = vi.fn();

      manager.registerExtension(
        {
          id: 'dispose1',
          name: 'Dispose 1',
          version: '1.0.0',
          publisher: 'publisher',
          main: './ext1.js',
        },
        () => ({ deactivate: deactivate1 })
      );

      manager.registerExtension(
        {
          id: 'dispose2',
          name: 'Dispose 2',
          version: '1.0.0',
          publisher: 'publisher',
          main: './ext2.js',
        },
        () => ({ deactivate: deactivate2 })
      );

      await manager.activateExtension('dispose1');
      await manager.activateExtension('dispose2');

      manager.dispose();

      expect(deactivate1).toHaveBeenCalled();
      expect(deactivate2).toHaveBeenCalled();

      const extensions = manager.getAllExtensions();
      expect(extensions).toHaveLength(0);
    });
  });
});
