/**
 * Terminal Component
 *
 * React component for rendering integrated terminal using xterm.js
 * Based on 2025 best practices with hooks and TypeScript
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { TerminalService, TerminalSession } from '../services/TerminalService';
import '@xterm/xterm/css/xterm.css';

export interface TerminalProps {
  terminalId?: string;
  shell?: string;
  cwd?: string;
  onReady?: (session: TerminalSession) => void;
  onExit?: (code: number) => void;
  height?: string | number;
  width?: string | number;
}

const terminalService = new TerminalService();

export const Terminal: React.FC<TerminalProps> = ({
  terminalId,
  shell,
  cwd,
  onReady,
  onExit,
  height = '100%',
  width = '100%',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let currentSession: TerminalSession;

    const initTerminal = async () => {
      try {
        // Create or get existing terminal
        if (terminalId) {
          try {
            currentSession = terminalService.getTerminal(terminalId);
          } catch {
            currentSession = terminalService.createTerminal({ shell, cwd });
          }
        } else {
          currentSession = terminalService.createTerminal({ shell, cwd });
        }

        // Open terminal in DOM
        currentSession.instance.open(terminalRef.current!);

        // Fit terminal to container
        currentSession.fitAddon.fit();

        // Attach shell process
        await terminalService.attachShell(currentSession.id);

        // Register exit handler
        if (onExit) {
          terminalService.onExit(currentSession.id, onExit);
        }

        setSession(currentSession);

        // Notify parent component
        if (onReady) {
          onReady(currentSession);
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Terminal initialization error:', err);
      }
    };

    initTerminal();

    // Handle window resize
    const handleResize = () => {
      if (currentSession) {
        currentSession.fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentSession && !terminalId) {
        // Only remove if we created it (not using existing terminalId)
        terminalService.removeTerminal(currentSession.id);
      }
    };
  }, [terminalId, shell, cwd, onReady, onExit]);

  if (error) {
    return (
      <div
        style={{
          height,
          width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: '#cd3131',
          padding: '20px',
          fontFamily: 'monospace',
        }}
      >
        <div>
          <strong>Terminal Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={terminalRef}
      style={{
        height,
        width,
        overflow: 'hidden',
      }}
    />
  );
};

export default Terminal;
