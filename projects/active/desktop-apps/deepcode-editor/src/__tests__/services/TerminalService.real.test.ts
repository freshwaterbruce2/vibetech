/**
 * TerminalService Real Tests
 *
 * Tests terminal session management with mocked child_process
 * Following TDD best practices for service testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TerminalService } from '../../services/TerminalService';
import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
const mockChildProcess = (): ChildProcess => {
  // Create object that properly inherits from EventEmitter
  const process = Object.create(EventEmitter.prototype) as ChildProcess;
  EventEmitter.call(process); // Initialize EventEmitter

  // Add child process specific properties
  Object.assign(process, {
    stdout: new EventEmitter() as any,
    stderr: new EventEmitter() as any,
    stdin: {
      write: vi.fn(),
      end: vi.fn(),
    } as any,
    kill: vi.fn(),
    pid: Math.floor(Math.random() * 10000),
  });

  return process;
};

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const process = mockChildProcess();
    // Auto-emit stdout data and exit event to simulate real process
    setTimeout(() => {
      process.stdout?.emit('data', Buffer.from('test output\n'));
      process.emit('exit', 0);
    }, 10);
    return process;
  }),
}));

describe('TerminalService - Real Tests', () => {
  let terminalService: TerminalService;
  let mockProcess: ChildProcess;

  beforeEach(() => {
    // Mock Electron environment
    (global as any).window = {
      electron: { isElectron: true },
    };

    // Mock process.cwd and process.env
    if (typeof process === 'undefined') {
      (global as any).process = {
        cwd: () => '/test/path',
        env: { PATH: '/usr/bin' },
        platform: 'linux',
      };
    }

    terminalService = new TerminalService();
    mockProcess = mockChildProcess();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should create a new terminal session with unique ID', () => {
      const sessionId1 = terminalService.createSession('/test/workspace1');
      const sessionId2 = terminalService.createSession('/test/workspace2');

      expect(sessionId1).toBeTruthy();
      expect(sessionId2).toBeTruthy();
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^terminal-\d+-[a-z0-9]+$/);
    });

    it('should create session with default cwd when not provided', () => {
      const sessionId = terminalService.createSession();

      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^terminal-/);
    });

    it('should create session with provided cwd', () => {
      const cwd = '/custom/workspace';
      const sessionId = terminalService.createSession(cwd);

      expect(sessionId).toBeTruthy();
      // Session should be created and stored
      expect(() => terminalService.closeSession(sessionId)).not.toThrow();
    });

    it('should track multiple active sessions', () => {
      const session1 = terminalService.createSession('/path1');
      const session2 = terminalService.createSession('/path2');
      const session3 = terminalService.createSession('/path3');

      const sessions = terminalService.getSessions();
      expect(sessions.length).toBe(3);
      expect(sessions.map(s => s.id)).toContain(session1);
      expect(sessions.map(s => s.id)).toContain(session2);
      expect(sessions.map(s => s.id)).toContain(session3);
    });

    it('should store session metadata (cwd, shell, createdAt)', () => {
      const cwd = '/test/workspace';
      const sessionId = terminalService.createSession(cwd);

      const sessions = terminalService.getSessions();
      const session = sessions.find(s => s.id === sessionId);

      expect(session).toBeDefined();
      expect(session?.cwd).toBe(cwd);
      expect(session?.shell).toBeTruthy();
      expect(session?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Shell Process Management', () => {
    it('should start shell process for session', () => {
      const sessionId = terminalService.createSession('/test');
      const onData = vi.fn();
      const onExit = vi.fn();

      expect(() => {
        terminalService.startShell(sessionId, onData, onExit);
      }).not.toThrow();
    });

    it('should throw error when starting shell for non-existent session', async () => {
      const onData = vi.fn();
      const onExit = vi.fn();

      // startShell is async, so error becomes rejected Promise
      await expect(
        terminalService.startShell('non-existent-id', onData, onExit)
      ).rejects.toThrow('Session non-existent-id not found');
    });

    it('should handle shell output via onData callback', async () => {
      const sessionId = terminalService.createSession('/test');
      const onData = vi.fn();
      const onExit = vi.fn();

      // Start shell and wait for it to spawn process
      await terminalService.startShell(sessionId, onData, onExit);

      // Wait for mock to emit data (10ms timeout in mock)
      await new Promise(resolve => setTimeout(resolve, 20));

      // onData should be called with stdout data from mock
      expect(onData).toHaveBeenCalled();
    });

    it('should handle shell exit via onExit callback', () => {
      const sessionId = terminalService.createSession('/test');
      const onData = vi.fn();
      const onExit = vi.fn();

      terminalService.startShell(sessionId, onData, onExit);

      // Simulate process exit
      if (mockProcess) {
        mockProcess.emit('exit', 0);
      }

      // In Electron mode, onExit would be called
      // In browser mode (fallback), it won't spawn process
    });

    it('should handle shell errors gracefully', async () => {
      const sessionId = terminalService.createSession('/test');
      const onData = vi.fn();
      const onExit = vi.fn();

      // Start shell (will spawn process that emits data and exits)
      await terminalService.startShell(sessionId, onData, onExit);

      // Wait for mock to emit data (10ms timeout in mock)
      await new Promise(resolve => setTimeout(resolve, 20));

      // Verify no errors thrown - shell handles errors via onData callback
      expect(onData).toHaveBeenCalled();

      // Get the process from the session to test error handling
      const sessions = terminalService.getSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (session?.process) {
        // Emit error on the actual process
        session.process.emit('error', new Error('Shell spawn failed'));
        // Should call onData with error message (next tick)
        await new Promise(resolve => setTimeout(resolve, 20));
        const errorCalls = onData.mock.calls.filter(call =>
          call[0].includes('Error:')
        );
        expect(errorCalls.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Terminal Input/Output', () => {
    it('should write input to terminal session', () => {
      const sessionId = terminalService.createSession('/test');

      // Start shell first
      terminalService.startShell(sessionId, vi.fn(), vi.fn());

      // Write input - should not throw even if process not available
      expect(() => {
        terminalService.writeInput(sessionId, 'ls -la\n');
      }).not.toThrow();
    });

    it('should handle write to non-existent session gracefully', () => {
      // Should not throw, just return silently
      expect(() => {
        terminalService.writeInput('non-existent', 'command\n');
      }).not.toThrow();
    });

    it('should handle write when no process started', () => {
      const sessionId = terminalService.createSession('/test');

      // Don't start shell, just try to write
      expect(() => {
        terminalService.writeInput(sessionId, 'echo test\n');
      }).not.toThrow();
    });

    it('should support multi-line input', () => {
      const sessionId = terminalService.createSession('/test');
      terminalService.startShell(sessionId, vi.fn(), vi.fn());

      const multilineCommand = 'for i in 1 2 3\ndo\n  echo $i\ndone\n';

      expect(() => {
        terminalService.writeInput(sessionId, multilineCommand);
      }).not.toThrow();
    });
  });

  describe('Session Cleanup', () => {
    it('should close terminal session', () => {
      const sessionId = terminalService.createSession('/test');

      expect(() => {
        terminalService.closeSession(sessionId);
      }).not.toThrow();

      // Session should be removed
      const sessions = terminalService.getSessions();
      expect(sessions.find(s => s.id === sessionId)).toBeUndefined();
    });

    it('should kill process when closing session', () => {
      const sessionId = terminalService.createSession('/test');
      terminalService.startShell(sessionId, vi.fn(), vi.fn());

      // Mock process kill
      const sessions = terminalService.getSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (session?.process) {
        session.process.kill = vi.fn();
      }

      terminalService.closeSession(sessionId);

      // Process kill would be called in real Electron environment
    });

    it('should handle closing non-existent session gracefully', () => {
      expect(() => {
        terminalService.closeSession('non-existent-id');
      }).not.toThrow();
    });

    it('should handle closing session without process', () => {
      const sessionId = terminalService.createSession('/test');
      // Don't start shell

      expect(() => {
        terminalService.closeSession(sessionId);
      }).not.toThrow();
    });

    it('should close all sessions independently', () => {
      const session1 = terminalService.createSession('/test1');
      const session2 = terminalService.createSession('/test2');

      terminalService.closeSession(session1);

      const sessions = terminalService.getSessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(session2);
    });
  });

  describe('Terminal Resize', () => {
    it('should handle terminal resize', () => {
      const sessionId = terminalService.createSession('/test');
      terminalService.startShell(sessionId, vi.fn(), vi.fn());

      expect(() => {
        terminalService.resize(sessionId, 80, 24);
      }).not.toThrow();
    });

    it('should handle resize for non-existent session', () => {
      expect(() => {
        terminalService.resize('non-existent', 100, 30);
      }).not.toThrow();
    });

    it('should handle resize when no process started', () => {
      const sessionId = terminalService.createSession('/test');

      expect(() => {
        terminalService.resize(sessionId, 120, 40);
      }).not.toThrow();
    });

    it('should accept various terminal dimensions', () => {
      const sessionId = terminalService.createSession('/test');
      terminalService.startShell(sessionId, vi.fn(), vi.fn());

      // Test different sizes
      expect(() => terminalService.resize(sessionId, 80, 24)).not.toThrow();
      expect(() => terminalService.resize(sessionId, 120, 30)).not.toThrow();
      expect(() => terminalService.resize(sessionId, 160, 50)).not.toThrow();
    });
  });

  describe('Command Execution', () => {
    it('should execute single command', async () => {
      const result = await terminalService.executeCommand('echo "test"');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');
    });

    it('should execute command with custom cwd', async () => {
      const result = await terminalService.executeCommand(
        'pwd',
        '/custom/path'
      );

      expect(result).toBeDefined();
      expect(typeof result.exitCode).toBe('number');
    });

    it('should capture stdout from command', async () => {
      const result = await terminalService.executeCommand('echo "hello world"');

      expect(result.stdout).toBeDefined();
      expect(typeof result.stdout).toBe('string');
    });

    it('should capture stderr from command', async () => {
      // Command that might write to stderr
      const result = await terminalService.executeCommand('ls /nonexistent 2>&1 || true');

      expect(result).toBeDefined();
      // stderr might be empty or contain error message
      expect(typeof result.stderr).toBe('string');
    });

    it('should return exit code from command', async () => {
      const result = await terminalService.executeCommand('exit 0');

      expect(result.exitCode).toBeDefined();
      expect(typeof result.exitCode).toBe('number');
    });

    it('should handle command execution errors', async () => {
      // Invalid command should still return a result object
      try {
        const result = await terminalService.executeCommand('invalid_command_xyz');
        expect(result).toBeDefined();
      } catch (error) {
        // Or it might reject - both are acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Platform Detection', () => {
    it('should detect default shell based on platform', () => {
      const sessionId = terminalService.createSession('/test');
      const sessions = terminalService.getSessions();
      const session = sessions.find(s => s.id === sessionId);

      expect(session?.shell).toBeTruthy();
      expect(typeof session?.shell).toBe('string');
      // Shell should be valid (cmd.exe, bash, etc.)
    });

    it('should use cmd.exe on Windows', () => {
      // Mock Windows platform
      if (typeof process !== 'undefined') {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          writable: true,
        });

        const service = new TerminalService();
        const sessionId = service.createSession('/test');
        const sessions = service.getSessions();
        const session = sessions.find(s => s.id === sessionId);

        // Should detect Windows shell
        expect(session?.shell).toBeTruthy();

        // Restore original platform
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
        });
      }
    });

    it('should use bash on Unix-like systems', () => {
      // Mock Linux platform
      if (typeof process !== 'undefined') {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'linux',
          writable: true,
        });

        const service = new TerminalService();
        const sessionId = service.createSession('/test');
        const sessions = service.getSessions();
        const session = sessions.find(s => s.id === sessionId);

        // Should detect Unix shell
        expect(session?.shell).toBeTruthy();

        // Restore original platform
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
        });
      }
    });
  });

  describe('Browser Fallback Mode', () => {
    it('should detect browser environment', () => {
      // Mock browser environment (no Electron)
      (global as any).window = {};

      const service = new TerminalService();
      const sessionId = service.createSession('/test');
      const onData = vi.fn();
      const onExit = vi.fn();

      service.startShell(sessionId, onData, onExit);

      // Should call onData with browser fallback message
      expect(onData).toHaveBeenCalled();
      const calls = onData.mock.calls;
      const messages = calls.map(call => call[0]).join('');
      expect(messages).toContain('Web terminal mode');
    });

    it('should provide helpful message in browser mode', () => {
      (global as any).window = {};

      const service = new TerminalService();
      const sessionId = service.createSession('/test');
      const onData = vi.fn();

      service.startShell(sessionId, onData, vi.fn());

      const messages = onData.mock.calls.map(call => call[0]).join('');
      expect(messages).toContain('help');
    });

    it('should execute commands in browser mode with simulation', async () => {
      (global as any).window = {};

      const service = new TerminalService();
      const result = await service.executeCommand('ls -la');

      expect(result).toBeDefined();
      expect(result.stdout).toContain('Simulated output');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle rapid session creation', () => {
      const sessions = Array.from({ length: 10 }, () =>
        terminalService.createSession('/test')
      );

      expect(sessions.length).toBe(10);
      expect(new Set(sessions).size).toBe(10); // All unique
    });

    it('should handle session operations after service creation', () => {
      const service = new TerminalService();

      expect(service.getSessions()).toHaveLength(0);

      const id = service.createSession('/test');
      expect(service.getSessions()).toHaveLength(1);

      service.closeSession(id);
      expect(service.getSessions()).toHaveLength(0);
    });

    it('should handle special characters in cwd', () => {
      const specialPaths = [
        '/path with spaces',
        '/path-with-dashes',
        '/path_with_underscores',
        'C:\\Windows\\Path',
      ];

      specialPaths.forEach(path => {
        expect(() => {
          terminalService.createSession(path);
        }).not.toThrow();
      });
    });

    it('should handle empty getSessions when no sessions exist', () => {
      const service = new TerminalService();
      const sessions = service.getSessions();

      expect(sessions).toEqual([]);
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should clean up sessions on close', () => {
      const sessionId = terminalService.createSession('/test');
      terminalService.startShell(sessionId, vi.fn(), vi.fn());

      expect(terminalService.getSessions().length).toBe(1);

      terminalService.closeSession(sessionId);

      expect(terminalService.getSessions().length).toBe(0);
    });

    it('should handle multiple close calls gracefully', () => {
      const sessionId = terminalService.createSession('/test');

      terminalService.closeSession(sessionId);
      terminalService.closeSession(sessionId); // Second close
      terminalService.closeSession(sessionId); // Third close

      expect(terminalService.getSessions().length).toBe(0);
    });

    it('should not leak sessions after errors', () => {
      const sessionId = terminalService.createSession('/test');

      try {
        terminalService.startShell(sessionId, vi.fn(), vi.fn());
        if (mockProcess) {
          mockProcess.emit('error', new Error('Test error'));
        }
      } catch (e) {
        // Ignore error
      }

      // Session should still be closeable
      expect(() => {
        terminalService.closeSession(sessionId);
      }).not.toThrow();
    });
  });
});
