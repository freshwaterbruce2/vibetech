import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Plus, X, Maximize2, Minimize2 } from 'lucide-react';
import styled from 'styled-components';
import 'xterm/css/xterm.css';

import { terminalService, TerminalSession } from '../services/TerminalService';

interface TerminalPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TerminalContainer = styled.div<{ $isOpen: boolean; $isMaximized: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.$isMaximized ? '100%' : props.$isOpen ? '40%' : '0'};
  background: #1e1e1e;
  border-top: 1px solid #404040;
  display: flex;
  flex-direction: column;
  transition: height 0.3s ease;
  z-index: 100;
  overflow: hidden;
`;

const TerminalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #252526;
  border-bottom: 1px solid #404040;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  flex: 1;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 2px;
  }
`;

const Tab = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${props => props.$isActive ? '#1e1e1e' : 'transparent'};
  color: ${props => props.$isActive ? '#d4d4d4' : '#888'};
  border: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;

  &:hover {
    background: ${props => props.$isActive ? '#1e1e1e' : '#2d2d2d'};
    color: #d4d4d4;
  }
`;

const TabCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  border-radius: 2px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const TerminalContent = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const TerminalWrapper = styled.div<{ $isActive: boolean }>`
  display: ${props => props.$isActive ? 'block' : 'none'};
  width: 100%;
  height: 100%;
`;

interface TerminalTab {
  id: string;
  title: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  sessionId: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ isOpen, onClose }) => {
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Create initial terminal on mount
  useEffect(() => {
    if (isOpen && terminals.length === 0) {
      createNewTerminal();
    }
  }, [isOpen]);

  // Resize terminals when panel opens/closes or maximizes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        terminals.forEach(tab => {
          try {
            tab.fitAddon.fit();
          } catch (e) {
            // Ignore fit errors
          }
        });
      }, 100);
    }
  }, [isOpen, isMaximized, terminals]);

  const createNewTerminal = () => {
    const id = `term-${Date.now()}`;
    const sessionId = terminalService.createSession();

    // Create xterm instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
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
      },
    });

    // Add addons
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    // Handle terminal input
    terminal.onData((data) => {
      terminalService.writeInput(sessionId, data);
    });

    const newTab: TerminalTab = {
      id,
      title: `Terminal ${terminals.length + 1}`,
      terminal,
      fitAddon,
      sessionId,
    };

    setTerminals(prev => [...prev, newTab]);
    setActiveTerminalId(id);

    // Open terminal in next tick to ensure DOM is ready
    setTimeout(() => {
      const element = terminalRefs.current.get(id);
      if (element) {
        terminal.open(element);
        fitAddon.fit();

        // Start shell
        terminalService.startShell(
          sessionId,
          (data) => terminal.write(data),
          (code) => {
            terminal.write(`\r\n\r\nProcess exited with code ${code}\r\n`);
          }
        );
      }
    }, 0);
  };

  const closeTerminal = (id: string) => {
    const tab = terminals.find(t => t.id === id);
    if (tab) {
      tab.terminal.dispose();
      terminalService.closeSession(tab.sessionId);
      terminalRefs.current.delete(id);
    }

    const newTerminals = terminals.filter(t => t.id !== id);
    setTerminals(newTerminals);

    if (activeTerminalId === id) {
      setActiveTerminalId(newTerminals.length > 0 ? newTerminals[0].id : null);
    }

    // Close panel if no terminals left
    if (newTerminals.length === 0) {
      onClose();
    }
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <TerminalContainer $isOpen={isOpen} $isMaximized={isMaximized}>
      <TerminalHeader>
        <TabsContainer>
          {terminals.map(tab => (
            <Tab
              key={tab.id}
              $isActive={tab.id === activeTerminalId}
              onClick={() => setActiveTerminalId(tab.id)}
            >
              <span>{tab.title}</span>
              <TabCloseButton
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(tab.id);
                }}
              >
                <X />
              </TabCloseButton>
            </Tab>
          ))}
        </TabsContainer>

        <HeaderActions>
          <IconButton onClick={createNewTerminal} title="New Terminal">
            <Plus />
          </IconButton>
          <IconButton onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? <Minimize2 /> : <Maximize2 />}
          </IconButton>
          <IconButton onClick={onClose} title="Close Terminal">
            <X />
          </IconButton>
        </HeaderActions>
      </TerminalHeader>

      <TerminalContent>
        {terminals.map(tab => (
          <TerminalWrapper
            key={tab.id}
            $isActive={tab.id === activeTerminalId}
            ref={(el) => {
              if (el) {
                terminalRefs.current.set(tab.id, el);
              }
            }}
          />
        ))}
      </TerminalContent>
    </TerminalContainer>
  );
};
