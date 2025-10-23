/**
 * LanguageServer Tests (TDD RED Phase)
 *
 * Language Server Protocol (LSP) integration with:
 * - Server lifecycle (initialize, start, stop)
 * - Document synchronization (open, change, close)
 * - Code completion (IntelliSense)
 * - Hover information
 * - Go to definition
 * - Diagnostics (errors, warnings)
 *
 * Based on LSP 3.17 specification and 2025 best practices
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LanguageServer, Position, Range, CompletionItem, Diagnostic, DiagnosticSeverity } from '../../services/LanguageServer';

describe('LanguageServer', () => {
  let server: LanguageServer;

  beforeEach(() => {
    server = new LanguageServer('typescript');
  });

  afterEach(() => {
    server.dispose();
  });

  describe('Server Lifecycle', () => {
    it('should initialize the language server', async () => {
      const capabilities = await server.initialize({
        rootUri: '/project',
        capabilities: {
          textDocument: {
            completion: { dynamicRegistration: true },
            hover: { dynamicRegistration: true },
          },
        },
      });

      expect(capabilities).toBeDefined();
      expect(capabilities.completionProvider).toBeDefined();
      expect(capabilities.hoverProvider).toBe(true);
    });

    it('should start the language server', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      expect(server.isRunning()).toBe(true);
    });

    it('should stop the language server', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();
      await server.stop();

      expect(server.isRunning()).toBe(false);
    });

    it('should handle initialization errors', async () => {
      await expect(
        server.initialize({ rootUri: '', capabilities: {} })
      ).rejects.toThrow('Invalid root URI');
    });
  });

  describe('Document Synchronization', () => {
    it('should open a document', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      const document = server.getDocument('/project/file.ts');
      expect(document).toBeDefined();
      expect(document?.text).toBe('const x = 1;');
    });

    it('should update document on change', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      server.changeDocument({
        uri: '/project/file.ts',
        version: 2,
        changes: [
          {
            range: { start: { line: 0, character: 10 }, end: { line: 0, character: 11 } },
            text: '2',
          },
        ],
      });

      const document = server.getDocument('/project/file.ts');
      expect(document?.text).toBe('const x = 2;');
      expect(document?.version).toBe(2);
    });

    it('should close a document', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      server.closeDocument({ uri: '/project/file.ts' });

      const document = server.getDocument('/project/file.ts');
      expect(document).toBeUndefined();
    });

    it('should handle multiple documents', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file1.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const a = 1;',
      });

      server.openDocument({
        uri: '/project/file2.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const b = 2;',
      });

      const documents = server.getAllDocuments();
      expect(documents).toHaveLength(2);
    });
  });

  describe('Code Completion', () => {
    it('should provide completion items', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = { name: "test" };\nx.',
      });

      const completions = await server.getCompletions({
        uri: '/project/file.ts',
        position: { line: 1, character: 2 },
      });

      expect(completions).toBeDefined();
      expect(completions.items).toBeInstanceOf(Array);
      expect(completions.items.length).toBeGreaterThan(0);
    });

    it('should include completion item details', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = { name: "test" };\nx.',
      });

      const completions = await server.getCompletions({
        uri: '/project/file.ts',
        position: { line: 1, character: 2 },
      });

      const nameCompletion = completions.items.find(item => item.label === 'name');
      expect(nameCompletion).toBeDefined();
      expect(nameCompletion?.kind).toBeDefined();
      expect(nameCompletion?.detail).toBeDefined();
    });

    it('should support trigger characters', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = {};\nx.',
      });

      const completions = await server.getCompletions({
        uri: '/project/file.ts',
        position: { line: 1, character: 2 },
        context: { triggerKind: 2, triggerCharacter: '.' },
      });

      expect(completions.items).toBeDefined();
    });
  });

  describe('Hover Information', () => {
    it('should provide hover information', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 123;\nconst y = x;',
      });

      const hover = await server.getHover({
        uri: '/project/file.ts',
        position: { line: 1, character: 10 },
      });

      expect(hover).toBeDefined();
      expect(hover?.contents).toBeDefined();
      expect(hover?.range).toBeDefined();
    });

    it('should return null for non-hoverable positions', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 123;',
      });

      const hover = await server.getHover({
        uri: '/project/file.ts',
        position: { line: 0, character: 99 },
      });

      expect(hover).toBeNull();
    });
  });

  describe('Go to Definition', () => {
    it('should provide definition location', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 123;\nconst y = x;',
      });

      const definition = await server.getDefinition({
        uri: '/project/file.ts',
        position: { line: 1, character: 10 },
      });

      expect(definition).toBeDefined();
      expect(definition?.length).toBeGreaterThan(0);
      expect(definition?.[0].uri).toBe('/project/file.ts');
      expect(definition?.[0].range).toBeDefined();
    });

    it('should return null for undefined symbols', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = undefined_symbol;',
      });

      const definition = await server.getDefinition({
        uri: '/project/file.ts',
        position: { line: 0, character: 15 },
      });

      expect(definition).toBeNull();
    });
  });

  describe('Diagnostics', () => {
    it('should provide diagnostics for errors', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x: number = "string";', // Type error
      });

      const diagnostics = await server.getDiagnostics({ uri: '/project/file.ts' });

      expect(diagnostics).toBeDefined();
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
    });

    it('should publish diagnostics on document change', async () => {
      const diagnosticsCallback = vi.fn();

      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.onDiagnostics(diagnosticsCallback);

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x: number = "string";',
      });

      // Wait for diagnostics to be published
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(diagnosticsCallback).toHaveBeenCalled();
      expect(diagnosticsCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: '/project/file.ts',
          diagnostics: expect.any(Array),
        })
      );
    });

    it('should clear diagnostics when errors are fixed', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x: number = "string";',
      });

      let diagnostics = await server.getDiagnostics({ uri: '/project/file.ts' });
      expect(diagnostics.length).toBeGreaterThan(0);

      // Fix the error
      server.changeDocument({
        uri: '/project/file.ts',
        version: 2,
        changes: [
          {
            range: { start: { line: 0, character: 18 }, end: { line: 0, character: 26 } },
            text: '123',
          },
        ],
      });

      diagnostics = await server.getDiagnostics({ uri: '/project/file.ts' });
      expect(diagnostics.length).toBe(0);
    });
  });

  describe('Language-Specific Features', () => {
    it('should support TypeScript-specific features', async () => {
      const tsServer = new LanguageServer('typescript');
      await tsServer.initialize({ rootUri: '/project', capabilities: {} });
      await tsServer.start();

      const capabilities = tsServer.getCapabilities();
      expect(capabilities.completionProvider).toBeDefined();
      expect(capabilities.definitionProvider).toBe(true);

      tsServer.dispose();
    });

    it('should support JavaScript-specific features', async () => {
      const jsServer = new LanguageServer('javascript');
      await jsServer.initialize({ rootUri: '/project', capabilities: {} });
      await jsServer.start();

      const capabilities = jsServer.getCapabilities();
      expect(capabilities.completionProvider).toBeDefined();

      jsServer.dispose();
    });
  });

  describe('Error Handling', () => {
    it('should handle server crashes gracefully', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      // Simulate server crash
      server['crash']();

      expect(server.isRunning()).toBe(false);
    });

    it('should handle invalid document URIs', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      expect(() => {
        server.openDocument({
          uri: '',
          languageId: 'typescript',
          version: 1,
          text: '',
        });
      }).toThrow('Invalid document URI');
    });

    it('should handle operations on non-running server', async () => {
      await expect(
        server.getCompletions({
          uri: '/project/file.ts',
          position: { line: 0, character: 0 },
        })
      ).rejects.toThrow('Server not initialized');
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should dispose all resources', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.openDocument({
        uri: '/project/file.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      server.dispose();

      expect(server.isRunning()).toBe(false);
      const documents = server.getAllDocuments();
      expect(documents).toHaveLength(0);
    });

    it('should stop server on dispose', async () => {
      await server.initialize({ rootUri: '/project', capabilities: {} });
      await server.start();

      server.dispose();

      expect(server.isRunning()).toBe(false);
    });
  });
});
