/**
 * Cross-App Command Palette for Vibe Code Studio
 * Execute @nova commands and get results
 * Part of P3.2 Integration
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

interface CommandResult {
    success: boolean;
    result?: any;
    error?: string;
}

const NOVA_COMMANDS = [
    { name: 'ask', description: 'Ask NOVA AI a question', usage: '@nova ask <question>', args: ['question'] },
    { name: 'analyze', description: 'Analyze code with NOVA', usage: '@nova analyze <file>', args: ['file'] },
    { name: 'suggest', description: 'Get code suggestions', usage: '@nova suggest', args: [] },
    { name: 'task', description: 'Create task in NOVA', usage: '@nova task <description>', args: ['description'] },
    { name: 'search', description: 'Search with NOVA', usage: '@nova search <query>', args: ['query'] },
    { name: 'git', description: 'Git operations via NOVA', usage: '@nova git <command>', args: ['command'] },
    { name: 'refactor', description: 'Refactor code', usage: '@nova refactor <code>', args: ['code'] },
    { name: 'debug', description: 'Debug with NOVA', usage: '@nova debug', args: [] },
    { name: 'help', description: 'Show available commands', usage: '@nova help', args: [] }
];

interface CrossAppCommandPaletteProps {
    onClose: () => void;
}

export const CrossAppCommandPalette: React.FC<CrossAppCommandPaletteProps> = ({ onClose }) => {
    const [input, setInput] = useState('@nova ');
    const [filteredCommands, setFilteredCommands] = useState(NOVA_COMMANDS);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState<CommandResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const command = input.replace('@nova ', '').trim();
        if (command) {
            const filtered = NOVA_COMMANDS.filter(cmd =>
                cmd.name.toLowerCase().includes(command.toLowerCase()) ||
                cmd.description.toLowerCase().includes(command.toLowerCase())
            );
            setFilteredCommands(filtered);
            setSelectedIndex(0);
        } else {
            setFilteredCommands(NOVA_COMMANDS);
        }
    }, [input]);

    const executeCommand = async () => {
        const commandText = input.replace('@nova ', '').trim();
        if (!commandText) return;

        const parts = commandText.split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        setExecuting(true);
        setResult(null);

        try {
            // Send command via IPC Bridge
            const response = await window.electronAPI.sendCrossAppCommand({
                commandId: `cmd-${Date.now()}`,
                target: 'nova',
                command,
                args,
                text: commandText,
                source: 'vibe'
            });

            setResult(response as CommandResult);

            if (response.success) {
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (err: any) {
            setResult({
                success: false,
                error: err.message || 'Command execution failed'
            });
        } finally {
            setExecuting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            executeCommand();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                setInput(`@nova ${filteredCommands[selectedIndex].name} `);
            }
        }
    };

    const selectCommand = (cmd: typeof NOVA_COMMANDS[0]) => {
        setInput(`@nova ${cmd.name} `);
        inputRef.current?.focus();
    };

    return (
        <Overlay onClick={onClose}>
            <Palette onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Icon>🎯</Icon>
                    <Input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="@nova <command> [args...]"
                        disabled={executing}
                    />
                    <CloseBtn onClick={onClose}>×</CloseBtn>
                </Header>

                {result && (
                    <Result success={result.success}>
                        <ResultIcon>{result.success ? '✓' : '✗'}</ResultIcon>
                        <ResultContent>
                            {result.success ? (
                                <>
                                    <ResultTitle>Command executed successfully</ResultTitle>
                                    {result.result && (
                                        <ResultData>
                                            {JSON.stringify(result.result, null, 2)}
                                        </ResultData>
                                    )}
                                </>
                            ) : (
                                <>
                                    <ResultTitle>Command failed</ResultTitle>
                                    <ResultError>{result.error}</ResultError>
                                </>
                            )}
                        </ResultContent>
                    </Result>
                )}

                <CommandList>
                    {filteredCommands.length === 0 ? (
                        <NoResults>No matching commands</NoResults>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <CommandItem
                                key={cmd.name}
                                selected={index === selectedIndex}
                                onClick={() => selectCommand(cmd)}
                            >
                                <CommandName>@nova {cmd.name}</CommandName>
                                <CommandDesc>{cmd.description}</CommandDesc>
                                <CommandUsage>{cmd.usage}</CommandUsage>
                            </CommandItem>
                        ))
                    )}
                </CommandList>

                <Footer>
                    <FooterHint>
                        <Kbd>↑↓</Kbd> Navigate
                        <Kbd>Tab</Kbd> Autocomplete
                        <Kbd>Enter</Kbd> Execute
                        <Kbd>Esc</Kbd> Close
                    </FooterHint>
                    {executing && (
                        <ExecutingIndicator>
                            <Spinner />
                            Executing command...
                        </ExecutingIndicator>
                    )}
                </Footer>
            </Palette>
        </Overlay>
    );
};

// Styled Components
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 100px;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const Palette = styled.div`
    width: 600px;
    max-height: 500px;
    background: ${p => p.theme.colors?.background || '#252525'};
    border: 1px solid ${p => p.theme.colors?.border || '#333'};
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    animation: slideDown 0.2s ease-out;
    overflow: hidden;

    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid ${p => p.theme.colors?.border || '#333'};
`;

const Icon = styled.span`
    font-size: 24px;
`;

const Input = styled.input`
    flex: 1;
    padding: 12px;
    background: ${p => p.theme.colors?.secondary || '#1e1e1e'};
    border: 1px solid ${p => p.theme.colors?.border || '#333'};
    border-radius: 6px;
    color: ${p => p.theme.colors?.text || '#fff'};
    font-size: 15px;
    font-family: 'Monaco', 'Menlo', monospace;

    &:focus {
        outline: none;
        border-color: ${p => p.theme.colors?.accent || '#3b82f6'};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CloseBtn = styled.button`
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: ${p => p.theme.colors?.textSecondary || '#888'};
    font-size: 24px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: ${p => p.theme.colors?.text || '#fff'};
    }
`;

const Result = styled.div<{ success: boolean }>`
    padding: 16px;
    border-bottom: 1px solid ${p => p.theme.colors?.border || '#333'};
    display: flex;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
    background: ${p => p.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)'};
    border-left: 3px solid ${p => p.success ? '#4ade80' : '#f87171'};

    @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;

const ResultIcon = styled.div`
    font-size: 24px;
    font-weight: bold;
`;

const ResultContent = styled.div`
    flex: 1;
`;

const ResultTitle = styled.div`
    font-weight: 600;
    margin-bottom: 8px;
`;

const ResultData = styled.pre`
    background: ${p => p.theme.colors?.secondary || '#1e1e1e'};
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    max-height: 150px;
    overflow-y: auto;
`;

const ResultError = styled.div`
    color: #f87171;
    font-size: 13px;
`;

const CommandList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
`;

const NoResults = styled.div`
    padding: 40px;
    text-align: center;
    color: ${p => p.theme.colors?.textSecondary || '#888'};
`;

const CommandItem = styled.div<{ selected: boolean }>`
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;
    background: ${p => p.selected ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
    border-left: ${p => p.selected ? '3px solid #3b82f6' : 'none'};

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
`;

const CommandName = styled.div`
    font-weight: 600;
    font-family: 'Monaco', 'Menlo', monospace;
    color: ${p => p.theme.colors?.accent || '#3b82f6'};
    margin-bottom: 4px;
`;

const CommandDesc = styled.div`
    font-size: 13px;
    color: ${p => p.theme.colors?.text || '#fff'};
    margin-bottom: 4px;
`;

const CommandUsage = styled.div`
    font-size: 11px;
    color: ${p => p.theme.colors?.textSecondary || '#888'};
    font-family: 'Monaco', 'Menlo', monospace;
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: ${p => p.theme.colors?.secondary || '#1e1e1e'};
    border-top: 1px solid ${p => p.theme.colors?.border || '#333'};
`;

const FooterHint = styled.div`
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: ${p => p.theme.colors?.textSecondary || '#888'};
`;

const Kbd = styled.kbd`
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid ${p => p.theme.colors?.border || '#333'};
    border-radius: 3px;
    font-size: 11px;
    font-family: monospace;
    margin-right: 4px;
`;

const ExecutingIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: ${p => p.theme.colors?.accent || '#3b82f6'};
`;

const Spinner = styled.div`
    width: 12px;
    height: 12px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
