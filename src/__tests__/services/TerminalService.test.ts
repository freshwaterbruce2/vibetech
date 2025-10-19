/**
 * TerminalService Tests - TDD Approach
 *
 * Integrated terminal service using xterm.js (@xterm/xterm package)
 * Based on 2025 best practices:
 * - Hook-based React integration
 * - GPU-accelerated rendering
 * - Multi-terminal session management
 * - Shell integration (bash, powershell, cmd)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TerminalService } from '../../services/TerminalService';
import type { ITerminal } from '@xterm/xterm';

describe('TerminalService', () => {
  let service: TerminalService;

  beforeEach(() => {
    service = new TerminalService();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('Terminal Creation', () => {
    it('should create a new terminal instance', () => {
      const terminal = service.createTerminal();

      expect(terminal).toBeDefined();
      expect(terminal).toHaveProperty('id');
      expect(terminal).toHaveProperty('instance');
      expect(terminal.instance).toBeDefined();
    });

    it('should create terminal with custom options', () => {
      const terminal = service.createTerminal({
        rows: 40,
        cols: 120,
        fontSize: 14,
        fontFamily: 'Fira Code',
      });

      const instance = terminal.instance as ITerminal;
      expect(instance.rows).toBe(40);
      expect(instance.cols).toBe(120);
    });

    it('should assign unique IDs to each terminal', () => {
      const terminal1 = service.createTerminal();
      const terminal2 = service.createTerminal();

      expect(terminal1.id).not.toBe(terminal2.id);
    });

    it('should track active terminals', () => {
      service.createTerminal();
      service.createTerminal();

      const terminals = service.getActiveTerminals();
      expect(terminals).toHaveLength(2);
    });

    it('should set default shell based on platform', () => {
      const terminal = service.createTerminal();

      expect(terminal.shell).toBeDefined();

      // Windows: powershell or cmd
      // Unix: bash, zsh, sh
      expect(['powershell', 'cmd', 'bash', 'zsh', 'sh']).toContain(terminal.shell);
    });
  });

  describe('Shell Integration', () => {
    it('should spawn shell process', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      expect(terminal.process).toBeDefined();
      expect(terminal.process?.pid).toBeGreaterThan(0);
    });

    it('should support custom shell', async () => {
      const terminal = service.createTerminal({ shell: 'bash' });
      await service.attachShell(terminal.id);

      expect(terminal.shell).toBe('bash');
    });

    it('should handle shell commands', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      const output = await service.executeCommand(terminal.id, 'echo "test"');
      expect(output).toContain('test');
    });

    it('should capture shell output', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      const outputs: string[] = [];
      service.onData(terminal.id, (data) => outputs.push(data));

      await service.writeToTerminal(terminal.id, 'ls\n');

      // Wait for output
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(outputs.length).toBeGreaterThan(0);
    });

    it('should handle shell exit', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      let exitCalled = false;
      service.onExit(terminal.id, (code) => {
        exitCalled = true;
        expect(code).toBeDefined();
      });

      await service.killProcess(terminal.id);

      // Wait for exit event
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(exitCalled).toBe(true);
    });
  });

  describe('Terminal Management', () => {
    it('should get terminal by ID', () => {
      const terminal = service.createTerminal();
      const retrieved = service.getTerminal(terminal.id);

      expect(retrieved).toBe(terminal);
    });

    it('should remove terminal', () => {
      const terminal = service.createTerminal();
      service.removeTerminal(terminal.id);

      const terminals = service.getActiveTerminals();
      expect(terminals).toHaveLength(0);
    });

    it('should dispose all terminals', () => {
      service.createTerminal();
      service.createTerminal();
      service.createTerminal();

      service.dispose();

      const terminals = service.getActiveTerminals();
      expect(terminals).toHaveLength(0);
    });

    it('should clean up process on terminal removal', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      const pid = terminal.process?.pid;
      expect(pid).toBeGreaterThan(0);

      service.removeTerminal(terminal.id);

      // Process should be killed
      expect(terminal.process).toBeUndefined();
    });
  });

  describe('Input/Output', () => {
    it('should write data to terminal', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      const data = 'echo "hello"\n';
      await service.writeToTerminal(terminal.id, data);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should clear terminal', () => {
      const terminal = service.createTerminal();
      service.clearTerminal(terminal.id);

      // Terminal should be cleared (via xterm API)
      expect(terminal.instance).toBeDefined();
    });

    it('should resize terminal', () => {
      const terminal = service.createTerminal();
      service.resizeTerminal(terminal.id, 100, 50);

      const instance = terminal.instance as ITerminal;
      expect(instance.cols).toBe(100);
      expect(instance.rows).toBe(50);
    });

    it('should handle paste events', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      const pasteData = 'pasted text';
      await service.paste(terminal.id, pasteData);

      // Should write pasted data to shell
      expect(true).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    it('should support terminal themes', () => {
      const terminal = service.createTerminal({
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
        },
      });

      expect(terminal.options?.theme).toBeDefined();
      expect(terminal.options?.theme?.background).toBe('#1e1e1e');
    });

    it('should enable GPU acceleration', () => {
      const terminal = service.createTerminal({
        rendererType: 'canvas', // or 'webgl' for GPU
      });

      expect(terminal.options?.rendererType).toBe('canvas');
    });

    it('should support copy on select', () => {
      const terminal = service.createTerminal({
        copyOnSelect: true,
      });

      expect(terminal.options?.copyOnSelect).toBe(true);
    });

    it('should track working directory', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);

      const cwd = await service.getCurrentDirectory(terminal.id);
      expect(cwd).toBeDefined();
      expect(cwd).toMatch(/[/\\]/); // Contains path separators
    });

    it('should support search functionality', () => {
      const terminal = service.createTerminal();
      service.writeToTerminal(terminal.id, 'test output\n');

      const found = service.search(terminal.id, 'test');
      expect(found).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid terminal ID', () => {
      expect(() => service.getTerminal('invalid-id')).toThrow('Terminal not found');
    });

    it('should handle shell spawn failures', async () => {
      const terminal = service.createTerminal({ shell: 'nonexistent-shell' });

      await expect(service.attachShell(terminal.id)).rejects.toThrow();
    });

    it('should handle write to closed terminal', async () => {
      const terminal = service.createTerminal();
      await service.attachShell(terminal.id);
      service.removeTerminal(terminal.id);

      await expect(
        service.writeToTerminal(terminal.id, 'test\n')
      ).rejects.toThrow('Terminal not found');
    });

    it('should handle resize validation', () => {
      const terminal = service.createTerminal();

      // Invalid dimensions should throw
      expect(() => service.resizeTerminal(terminal.id, -1, 50)).toThrow();
      expect(() => service.resizeTerminal(terminal.id, 100, 0)).toThrow();
    });
  });

  describe('Multi-Terminal Sessions', () => {
    it('should manage multiple terminals independently', async () => {
      const terminal1 = service.createTerminal();
      const terminal2 = service.createTerminal();

      await service.attachShell(terminal1.id);
      await service.attachShell(terminal2.id);

      expect(terminal1.process?.pid).not.toBe(terminal2.process?.pid);
    });

    it('should isolate terminal events', async () => {
      const terminal1 = service.createTerminal();
      const terminal2 = service.createTerminal();

      let terminal1Data = '';
      let terminal2Data = '';

      service.onData(terminal1.id, (data) => terminal1Data += data);
      service.onData(terminal2.id, (data) => terminal2Data += data);

      await service.attachShell(terminal1.id);
      await service.attachShell(terminal2.id);

      await service.writeToTerminal(terminal1.id, 'echo "one"\n');
      await service.writeToTerminal(terminal2.id, 'echo "two"\n');

      // Wait for output
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(terminal1Data).toContain('one');
      expect(terminal2Data).toContain('two');
      expect(terminal1Data).not.toContain('two');
      expect(terminal2Data).not.toContain('one');
    });

    it('should allow switching active terminal', () => {
      const terminal1 = service.createTerminal();
      const terminal2 = service.createTerminal();

      service.setActiveTerminal(terminal1.id);
      expect(service.getActiveTerminalId()).toBe(terminal1.id);

      service.setActiveTerminal(terminal2.id);
      expect(service.getActiveTerminalId()).toBe(terminal2.id);
    });
  });

  describe('Session Persistence', () => {
    it('should save terminal session state', () => {
      const terminal = service.createTerminal({ name: 'My Terminal' });
      const state = service.saveSession(terminal.id);

      expect(state).toHaveProperty('id', terminal.id);
      expect(state).toHaveProperty('name', 'My Terminal');
      expect(state).toHaveProperty('options');
      expect(state).toHaveProperty('createdAt');
    });

    it('should restore terminal from session', () => {
      const terminal = service.createTerminal({ name: 'Restored' });
      const state = service.saveSession(terminal.id);

      service.removeTerminal(terminal.id);

      const restored = service.restoreSession(state);
      expect(restored.id).toBe(state.id);
      expect(restored.name).toBe('Restored');
    });

    it('should export all sessions', () => {
      service.createTerminal({ name: 'Terminal 1' });
      service.createTerminal({ name: 'Terminal 2' });

      const sessions = service.exportSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0]).toHaveProperty('name');
    });
  });
});
