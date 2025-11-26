/**
 * TerminalService
 *
 * Integrated terminal service using xterm.js (@xterm/xterm)
 * Manages multiple terminal sessions with shell integration
 *
 * Based on 2025 best practices:
 * - Modern @xterm/xterm package
 * - Hook-based React integration
 * - Multi-terminal session management
 * - Cross-platform shell support (bash, powershell, cmd)
 */

import { Terminal, ITerminalOptions, ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

export interface TerminalOptions extends Partial<ITerminalOptions> {
  shell?: string;
  name?: string;
  cwd?: string;
  env?: Record<string, string>;
  theme?: ITheme;
  rendererType?: 'dom' | 'canvas';
  copyOnSelect?: boolean;
}

export interface TerminalSession {
  id: string;
  name?: string;
  instance: Terminal;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  process?: ChildProcess;
  shell?: string;
  options?: TerminalOptions;
  createdAt: Date;
  dataHandlers: ((data: string) => void)[];
  exitHandlers: ((code: number) => void)[];
}

export interface TerminalSessionState {
  id: string;
  name?: string;
  shell?: string;
  options?: TerminalOptions;
  createdAt: Date;
}

export class TerminalService {
  private terminals = new Map<string, TerminalSession>();
  private activeTerminalId: string | null = null;

  /**
   * Create a new terminal instance
   */
  createTerminal(options: TerminalOptions = {}): TerminalSession {
    const id = this.generateId();
    const defaultShell = this.getDefaultShell();

    // Create xterm instance
    const instance = new Terminal({
      rows: options.rows || 30,
      cols: options.cols || 80,
      fontSize: options.fontSize || 14,
      fontFamily: options.fontFamily || 'Cascadia Code, Consolas, monospace',
      theme: options.theme || this.getDefaultTheme(),
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      allowTransparency: false,
      convertEol: true,
      ...options,
    });

    // Create addons
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();

    instance.loadAddon(fitAddon);
    instance.loadAddon(searchAddon);

    // Create session
    const session: TerminalSession = {
      id,
      name: options.name,
      instance,
      fitAddon,
      searchAddon,
      shell: options.shell || defaultShell,
      options,
      createdAt: new Date(),
      dataHandlers: [],
      exitHandlers: [],
    };

    this.terminals.set(id, session);

    // Set as active if first terminal
    if (this.terminals.size === 1) {
      this.activeTerminalId = id;
    }

    return session;
  }

  /**
   * Attach shell process to terminal
   */
  async attachShell(terminalId: string): Promise<void> {
    const session = this.getTerminal(terminalId);

    const shellCommand = session.shell || this.getDefaultShell();
    const shellArgs = this.getShellArgs(shellCommand);

    try {
      // Spawn shell process
      const childProcess = spawn(shellCommand, shellArgs, {
        cwd: session.options?.cwd || os.homedir(),
        env: {
          ...process.env,
          ...session.options?.env,
          TERM: 'xterm-256color',
        },
        shell: false,
      });

      session.process = childProcess;

      // Forward terminal input to process
      session.instance.onData((data) => {
        if (childProcess.stdin && !childProcess.stdin.destroyed) {
          childProcess.stdin.write(data);
        }
      });

      // Forward process output to terminal
      childProcess.stdout?.on('data', (data) => {
        session.instance.write(data.toString());
        session.dataHandlers.forEach((handler) => handler(data.toString()));
      });

      childProcess.stderr?.on('data', (data) => {
        session.instance.write(data.toString());
        session.dataHandlers.forEach((handler) => handler(data.toString()));
      });

      // Handle process exit
      childProcess.on('exit', (code) => {
        session.exitHandlers.forEach((handler) => handler(code || 0));
        delete session.process;
      });

      childProcess.on('error', (error) => {
        session.instance.write(`\r\n\x1b[31mProcess error: ${error.message}\x1b[0m\r\n`);
        delete session.process;
      });
    } catch (error) {
      throw new Error(`Failed to spawn shell: ${(error as Error).message}`);
    }
  }

  /**
   * Execute command in terminal
   */
  async executeCommand(terminalId: string, command: string): Promise<string> {
    const session = this.getTerminal(terminalId);

    return new Promise((resolve, reject) => {
      if (!session.process) {
        reject(new Error('No shell process attached'));
        return;
      }

      let output = '';

      const dataHandler = (data: string) => {
        output += data;
      };

      session.dataHandlers.push(dataHandler);

      // Write command to terminal
      session.instance.write(command);
      if (session.process.stdin && !session.process.stdin.destroyed) {
        session.process.stdin.write(command);
      }

      // Wait for output
      setTimeout(() => {
        const index = session.dataHandlers.indexOf(dataHandler);
        if (index > -1) {
          session.dataHandlers.splice(index, 1);
        }
        resolve(output);
      }, 100);
    });
  }

  /**
   * Write data to terminal
   */
  async writeToTerminal(terminalId: string, data: string): Promise<void> {
    const session = this.getTerminal(terminalId);

    if (!session) {
      throw new Error('Terminal not found');
    }

    session.instance.write(data);

    if (session.process?.stdin && !session.process.stdin.destroyed) {
      session.process.stdin.write(data);
    }
  }

  /**
   * Register data handler
   */
  onData(terminalId: string, handler: (data: string) => void): void {
    const session = this.getTerminal(terminalId);
    session.dataHandlers.push(handler);
  }

  /**
   * Register exit handler
   */
  onExit(terminalId: string, handler: (code: number) => void): void {
    const session = this.getTerminal(terminalId);
    session.exitHandlers.push(handler);
  }

  /**
   * Kill shell process
   */
  async killProcess(terminalId: string): Promise<void> {
    const session = this.getTerminal(terminalId);

    if (session.process && !session.process.killed) {
      session.process.kill();

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        if (!session.process) {
          resolve();
          return;
        }

        session.process.on('exit', () => resolve());

        // Force kill after 1 second
        setTimeout(() => {
          if (session.process && !session.process.killed) {
            session.process.kill('SIGKILL');
          }
          resolve();
        }, 1000);
      });
    }
  }

  /**
   * Clear terminal
   */
  clearTerminal(terminalId: string): void {
    const session = this.getTerminal(terminalId);
    session.instance.clear();
  }

  /**
   * Resize terminal
   */
  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    if (cols <= 0 || rows <= 0) {
      throw new Error('Invalid terminal dimensions');
    }

    const session = this.getTerminal(terminalId);
    session.instance.resize(cols, rows);

    // Notify shell process of resize
    if (session.process && !session.process.killed) {
      session.process.stdout?.emit('resize');
    }
  }

  /**
   * Paste text to terminal
   */
  async paste(terminalId: string, text: string): Promise<void> {
    await this.writeToTerminal(terminalId, text);
  }

  /**
   * Search for text in terminal
   */
  search(terminalId: string, query: string): boolean {
    const session = this.getTerminal(terminalId);

    // Search addon requires buffer content to search
    const result = session.searchAddon.findNext(query);

    // Fallback: check if query exists in terminal buffer manually
    if (!result) {
      const buffer = session.instance.buffer.active;
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line && line.translateToString(true).includes(query)) {
          return true;
        }
      }
    }

    return result;
  }

  /**
   * Get current working directory
   */
  async getCurrentDirectory(terminalId: string): Promise<string> {
    const session = this.getTerminal(terminalId);

    if (!session.process) {
      throw new Error('No shell process attached');
    }

    // Get CWD from process
    const cwd = session.options?.cwd || process.cwd();
    return cwd;
  }

  /**
   * Get terminal by ID
   */
  getTerminal(terminalId: string): TerminalSession {
    const session = this.terminals.get(terminalId);

    if (!session) {
      throw new Error('Terminal not found');
    }

    return session;
  }

  /**
   * Get all active terminals
   */
  getActiveTerminals(): TerminalSession[] {
    return Array.from(this.terminals.values());
  }

  /**
   * Remove terminal
   */
  removeTerminal(terminalId: string): void {
    const session = this.terminals.get(terminalId);

    if (session) {
      // Kill process
      if (session.process && !session.process.killed) {
        session.process.kill();
      }

      // Dispose terminal
      session.instance.dispose();

      // Remove from map
      this.terminals.delete(terminalId);

      // Update active terminal
      if (this.activeTerminalId === terminalId) {
        const remaining = Array.from(this.terminals.keys());
        this.activeTerminalId = remaining.length > 0 ? remaining[0] : null;
      }
    }
  }

  /**
   * Set active terminal
   */
  setActiveTerminal(terminalId: string): void {
    if (!this.terminals.has(terminalId)) {
      throw new Error('Terminal not found');
    }

    this.activeTerminalId = terminalId;
  }

  /**
   * Get active terminal ID
   */
  getActiveTerminalId(): string | null {
    return this.activeTerminalId;
  }

  /**
   * Save terminal session state
   */
  saveSession(terminalId: string): TerminalSessionState {
    const session = this.getTerminal(terminalId);

    return {
      id: session.id,
      name: session.name,
      shell: session.shell,
      options: session.options,
      createdAt: session.createdAt,
    };
  }

  /**
   * Restore terminal from session state
   */
  restoreSession(state: TerminalSessionState): TerminalSession {
    // Create new terminal with same options
    const session = this.createTerminal({
      ...state.options,
      name: state.name,
      shell: state.shell,
    });

    // Override ID and created date to match saved state
    this.terminals.delete(session.id);
    session.id = state.id;
    session.createdAt = state.createdAt;
    this.terminals.set(session.id, session);

    return session;
  }

  /**
   * Export all sessions
   */
  exportSessions(): TerminalSessionState[] {
    return this.getActiveTerminals().map((session) =>
      this.saveSession(session.id)
    );
  }

  /**
   * Dispose all terminals
   */
  dispose(): void {
    this.terminals.forEach((session) => {
      if (session.process && !session.process.killed) {
        session.process.kill();
      }
      session.instance.dispose();
    });

    this.terminals.clear();
    this.activeTerminalId = null;
  }

  /**
   * Generate unique terminal ID
   */
  private generateId(): string {
    return `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default shell for current platform
   */
  private getDefaultShell(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      // Prefer PowerShell on Windows
      return 'powershell.exe';
    } else if (platform === 'darwin') {
      // Use zsh on macOS (default since Catalina)
      return '/bin/zsh';
    } else {
      // Use bash on Linux
      return '/bin/bash';
    }
  }

  /**
   * Get shell arguments for specific shell
   */
  private getShellArgs(shell: string): string[] {
    if (shell.includes('powershell')) {
      return ['-NoLogo', '-NoProfile'];
    } else if (shell.includes('cmd')) {
      return ['/Q'];
    } else {
      // bash, zsh, etc.
      return ['--login'];
    }
  }

  /**
   * Get default xterm theme
   */
  private getDefaultTheme(): ITheme {
    return {
      background: '#1e1e1e',
      foreground: '#cccccc',
      cursor: '#ffffff',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff',
    };
  }
}
