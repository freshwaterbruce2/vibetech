/**
 * Terminal Service - Manages terminal sessions and command execution
 * Electron integration for real shell access
 */

// Type-only import to avoid bundling Node.js modules in browser
import type { ChildProcess } from 'child_process';

export interface TerminalSession {
  id: string;
  process: ChildProcess | null;
  cwd: string;
  shell: string;
  createdAt: Date;
}

export class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private isElectron: boolean;

  constructor() {
    this.isElectron = typeof window !== 'undefined' &&
                     (window as any).electron !== undefined;
  }

  /**
   * Create a new terminal session
   */
  createSession(cwd: string = process.cwd()): string {
    const id = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const shell = this.getDefaultShell();

    const session: TerminalSession = {
      id,
      process: null,
      cwd,
      shell,
      createdAt: new Date(),
    };

    this.sessions.set(id, session);
    return id;
  }

  /**
   * Start a shell process for the session
   */
  async startShell(
    sessionId: string,
    onData: (data: string) => void,
    onExit: (code: number | null) => void
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.isElectron) {
      // In browser mode, simulate a basic terminal
      onData('$ Web terminal mode - limited functionality\r\n');
      onData('$ Type "help" for available commands\r\n');
      return;
    }

    // Dynamic import of child_process only when in Electron
    const { spawn } = await import('child_process');

    // Spawn shell process
    const shellProcess = spawn(session.shell, [], {
      cwd: session.cwd,
      env: { ...process.env },
      shell: true,
    });

    session.process = shellProcess;

    // Handle stdout
    shellProcess.stdout?.on('data', (data: Buffer) => {
      onData(data.toString('utf8'));
    });

    // Handle stderr
    shellProcess.stderr?.on('data', (data: Buffer) => {
      onData(data.toString('utf8'));
    });

    // Handle exit
    shellProcess.on('exit', (code) => {
      onExit(code);
    });

    // Handle errors
    shellProcess.on('error', (err) => {
      onData(`\r\nError: ${err.message}\r\n`);
    });
  }

  /**
   * Write input to terminal
   */
  writeInput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      return;
    }

    session.process.stdin?.write(data);
  }

  /**
   * Resize terminal
   */
  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      return;
    }

    // Send resize signal if supported
    if (session.process.stdout && 'resize' in session.process.stdout) {
      (session.process.stdout as any).resize({ columns: cols, rows });
    }
  }

  /**
   * Close a terminal session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    if (session.process) {
      session.process.kill();
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get default shell for the platform
   */
  private getDefaultShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Execute a single command (non-interactive)
   */
  async executeCommand(
    command: string,
    cwd?: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.isElectron) {
      // Browser mode - simulate response
      return {
        stdout: `Simulated output for: ${command}`,
        stderr: '',
        exitCode: 0,
      };
    }

    // Dynamic import of child_process only when in Electron
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const shell = this.getDefaultShell();
      const proc = spawn(shell, ['-c', command], {
        cwd: cwd || process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('exit', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }
}

// Singleton instance
export const terminalService = new TerminalService();
