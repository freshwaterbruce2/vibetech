import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  Plug,
  RefreshCw,
  ServerIcon,
  X,
  Zap
} from 'lucide-react';
import styled from 'styled-components';

import { logger } from '../services/Logger';
import type { Prompt,Resource, Tool } from '../services/MCPService';
import { MCPService } from '../services/MCPService';
import { vibeTheme } from '../styles/theme';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};

  svg {
    width: 18px;
    height: 18px;
    color: ${vibeTheme.colors.purple};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.xs};
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    color: ${vibeTheme.colors.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${vibeTheme.spacing.md};
`;

const ServerCard = styled.div`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.medium};
  padding: ${vibeTheme.spacing.md};
  margin-bottom: ${vibeTheme.spacing.md};
`;

const ServerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${vibeTheme.spacing.sm};
`;

const ServerName = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};

  svg {
    width: 16px;
    height: 16px;
    color: ${vibeTheme.colors.purple};
  }
`;

const StatusBadge = styled.span<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  background: ${props => props.connected
    ? 'rgba(34, 197, 94, 0.1)'
    : 'rgba(239, 68, 68, 0.1)'
  };
  color: ${props => props.connected ? '#22c55e' : '#ef4444'};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ConnectButton = styled.button<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  background: ${props => props.connected
    ? 'rgba(239, 68, 68, 0.1)'
    : 'rgba(139, 92, 246, 0.1)'
  };
  border: 1px solid ${props => props.connected
    ? 'rgba(239, 68, 68, 0.3)'
    : 'rgba(139, 92, 246, 0.3)'
  };
  border-radius: ${vibeTheme.borderRadius.small};
  color: ${props => props.connected ? '#ef4444' : vibeTheme.colors.purple};
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.xs};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: ${props => props.connected
      ? 'rgba(239, 68, 68, 0.2)'
      : 'rgba(139, 92, 246, 0.2)'
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Section = styled.div`
  margin-top: ${vibeTheme.spacing.md};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs} 0;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.textSecondary};

  &:hover {
    color: ${vibeTheme.colors.text};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing.xs};
  margin-top: ${vibeTheme.spacing.xs};
`;

const Item = styled.div`
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
  }
`;

const ItemName = styled.span`
  flex: 1;
  color: ${vibeTheme.colors.text};
`;

const ItemButton = styled.button`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.purple};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${vibeTheme.spacing.xl} ${vibeTheme.spacing.md};
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};
`;

interface MCPPanelProps {
  mcpService: MCPService;
  onToolInvoke?: (serverName: string, toolName: string) => void;
}

export const MCPPanel: React.FC<MCPPanelProps> = ({ mcpService, onToolInvoke }) => {
  const [servers, setServers] = useState<Array<{ name: string; connected: boolean }>>([]);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [serverTools, setServerTools] = useState<Map<string, Tool[]>>(new Map());
  const [serverResources, setServerResources] = useState<Map<string, Resource[]>>(new Map());
  const [serverPrompts, setServerPrompts] = useState<Map<string, Prompt[]>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Initialize servers list
  useEffect(() => {
    const serverList = mcpService.getServers().map(s => ({
      name: s.name,
      connected: mcpService.isConnected(s.name)
    }));
    setServers(serverList);
  }, [mcpService]);

  // Refresh servers connection status
  const refreshServers = useCallback(() => {
    setServers(prev => prev.map(s => ({
      ...s,
      connected: mcpService.isConnected(s.name)
    })));
  }, [mcpService]);

  // Connect/disconnect server
  const toggleConnection = useCallback(async (serverName: string, isConnected: boolean) => {
    setLoading(prev => new Set(prev).add(serverName));

    try {
      if (isConnected) {
        await mcpService.disconnectServer(serverName);
      } else {
        await mcpService.connectServer(serverName);

        // Load capabilities after connecting
        const tools = await mcpService.getTools(serverName);
        const resources = await mcpService.getResources(serverName);
        const prompts = await mcpService.getPrompts(serverName);

        setServerTools(prev => new Map(prev).set(serverName, tools));
        setServerResources(prev => new Map(prev).set(serverName, resources));
        setServerPrompts(prev => new Map(prev).set(serverName, prompts));
      }

      refreshServers();
    } catch (error) {
      logger.error('Failed to toggle server connection:', error);
    } finally {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(serverName);
        return next;
      });
    }
  }, [mcpService, refreshServers]);

  // Toggle server expansion
  const toggleServer = useCallback((serverName: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(serverName)) {
        next.delete(serverName);
      } else {
        next.add(serverName);
      }
      return next;
    });
  }, []);

  // Handle tool invocation
  const handleToolInvoke = useCallback((serverName: string, toolName: string) => {
    onToolInvoke?.(serverName, toolName);
  }, [onToolInvoke]);

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>
          <Plug />
          MCP Servers
        </Title>
        <Actions>
          <ActionButton onClick={refreshServers} title="Refresh servers">
            <RefreshCw />
          </ActionButton>
        </Actions>
      </PanelHeader>

      <ScrollContent>
        {servers.length === 0 ? (
          <EmptyState>
            No MCP servers configured.
            <br />
            Add servers to .mcp.json
          </EmptyState>
        ) : (
          servers.map(server => {
            const isExpanded = expandedServers.has(server.name);
            const isLoading = loading.has(server.name);
            const tools = serverTools.get(server.name) || [];
            const resources = serverResources.get(server.name) || [];
            const prompts = serverPrompts.get(server.name) || [];

            return (
              <ServerCard key={server.name}>
                <ServerHeader>
                  <ServerName onClick={() => toggleServer(server.name)}>
                    {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    <ServerIcon />
                    {server.name}
                  </ServerName>
                  <StatusBadge connected={server.connected}>
                    {server.connected ? <Check /> : <X />}
                    {server.connected ? 'Connected' : 'Disconnected'}
                  </StatusBadge>
                </ServerHeader>

                <ConnectButton
                  connected={server.connected}
                  disabled={isLoading}
                  onClick={() => toggleConnection(server.name, server.connected)}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" />
                      {server.connected ? 'Disconnecting...' : 'Connecting...'}
                    </>
                  ) : (
                    <>
                      {server.connected ? <X /> : <Play />}
                      {server.connected ? 'Disconnect' : 'Connect'}
                    </>
                  )}
                </ConnectButton>

                {isExpanded && server.connected && (
                  <>
                    {/* Tools Section */}
                    {tools.length > 0 && (
                      <Section>
                        <SectionHeader>
                          <Zap />
                          Tools ({tools.length})
                        </SectionHeader>
                        <ItemList>
                          {tools.map(tool => (
                            <Item key={tool.name}>
                              <ItemName>{tool.name}</ItemName>
                              <ItemButton onClick={() => handleToolInvoke(server.name, tool.name)}>
                                <Play />
                              </ItemButton>
                            </Item>
                          ))}
                        </ItemList>
                      </Section>
                    )}

                    {/* Resources Section */}
                    {resources.length > 0 && (
                      <Section>
                        <SectionHeader>
                          <Box />
                          Resources ({resources.length})
                        </SectionHeader>
                        <ItemList>
                          {resources.map(resource => (
                            <Item key={resource.uri}>
                              <ItemName>{resource.name || resource.uri}</ItemName>
                            </Item>
                          ))}
                        </ItemList>
                      </Section>
                    )}

                    {/* Prompts Section */}
                    {prompts.length > 0 && (
                      <Section>
                        <SectionHeader>
                          <ServerIcon />
                          Prompts ({prompts.length})
                        </SectionHeader>
                        <ItemList>
                          {prompts.map(prompt => (
                            <Item key={prompt.name}>
                              <ItemName>{prompt.name}</ItemName>
                            </Item>
                          ))}
                        </ItemList>
                      </Section>
                    )}
                  </>
                )}
              </ServerCard>
            );
          })
        )}
      </ScrollContent>
    </PanelContainer>
  );
};
