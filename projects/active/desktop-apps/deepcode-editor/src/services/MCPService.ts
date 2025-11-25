/**
 * MCPService - Model Context Protocol Integration
 * Manages connections to MCP servers and provides tool/resource/prompt access
 *
 * BROWSER COMPATIBILITY:
 * This service requires Node.js APIs (child_process) which are only available in Electron/Tauri.
 * In web mode (dev:web), MCP features are disabled gracefully.
 */
// MCP SDK imports - these work in both browser and Node.js
// Note: The stdio transport uses child_process internally, but we handle that gracefully
import type { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import type { StdioClientTransport as MCPTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  CallToolResult,
  GetPromptResult,
  Prompt,
  Resource,
  Tool} from '@modelcontextprotocol/sdk/types.js';

import { logger } from '../services/Logger';
import { EventEmitter } from '../utils/EventEmitter';

// Check if we're in a desktop environment (Electron/Tauri with Node.js APIs)
const isDesktopEnvironment = (() => {
  // Browser definitely doesn't have Node.js APIs
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    // Check for Electron
    if ((window as any).electronAPI) {return true;}
    if (window.electron?.isElectron) {return true;}
    // Pure browser
    return false;
  }
  // If no window, we're in Node.js
  return true;
})();

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface MCPServiceOptions {
  /**
   * Force desktop environment detection (useful for testing)
   * When undefined, automatic detection is used
   */
  forceDesktopMode?: boolean;
}

interface ServerConnection {
  name: string;
  config: MCPServerConfig;
  client: MCPClient;
  transport: MCPTransport;
  process: any; // ChildProcess type, but dynamic
  connected: boolean;
}

/**
 * MCPService manages connections to MCP servers and provides access to their capabilities
 *
 * Note: MCP features are only available in desktop environments (Electron/Tauri).
 * In web mode, all methods will return empty results or throw descriptive errors.
 */
export class MCPService extends EventEmitter {
  private config: MCPConfig;
  private connections: Map<string, ServerConnection>;
  private readonly isDesktop: boolean;

  constructor(config: MCPConfig, options: MCPServiceOptions = {}) {
    super();
    this.config = config;
    this.connections = new Map();

    // Allow override for testing
    if (options.forceDesktopMode !== undefined) {
      this.isDesktop = options.forceDesktopMode;
    } else {
      this.isDesktop = isDesktopEnvironment;
    }

    if (!this.isDesktop) {
      logger.info('MCPService: Running in web mode. MCP features disabled. Use Electron/Tauri for full functionality.');
    }
  }

  /**
   * Check if MCP features are available in this environment
   */
  isAvailable(): boolean {
    return this.isDesktop;
  }

  /**
   * Get list of configured servers
   */
  getServers(): Array<{ name: string; config: MCPServerConfig }> {
    return Object.entries(this.config.mcpServers).map(([name, config]) => ({
      name,
      config
    }));
  }

  /**
   * Connect to an MCP server
   */
  async connectServer(serverName: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('MCP features are only available in desktop mode (Electron/Tauri). Run "npm run dev" instead of "npm run dev:web".');
    }

    const config = this.config.mcpServers[serverName];
    if (!config) {
      throw new Error(`Server ${serverName} not found in configuration`);
    }

    // Check if already connected
    if (this.connections.has(serverName)) {
      const conn = this.connections.get(serverName)!;
      if (conn.connected) {
        return;
      }
    }

    try {
      // Dynamic imports - only loaded in desktop environment
      const { spawn } = await import('child_process');
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

      // Spawn the server process
      const serverProcess = spawn(config.command, config.args, {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check if command exists
      serverProcess.on('error', (error: Error) => {
        this.emit('serverError', { serverName, error });
        throw new Error(`Failed to start server ${serverName}: ${error.message}`);
      });

      // Create transport and client
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env
      });

      const client = new Client({
        name: 'deepcode-editor',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect the client
      await client.connect(transport);

      // Store connection
      const connection: ServerConnection = {
        name: serverName,
        config,
        client,
        transport,
        process: serverProcess,
        connected: true
      };

      this.connections.set(serverName, connection);

      // Handle process exit
      serverProcess.on('exit', (code: number) => {
        connection.connected = false;
        this.connections.delete(serverName);
        if (code !== 0) {
          this.emit('serverCrashed', serverName);
        }
      });

      this.emit('serverConnected', serverName);
    } catch (error) {
      this.emit('serverError', { serverName, error });
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectServer(serverName: string): Promise<void> {
    if (!this.isDesktop) {
      return; // No-op in web mode
    }

    const connection = this.connections.get(serverName);
    if (!connection) {
      return; // Already disconnected or never connected
    }

    try {
      // Close the client connection
      await connection.client.close();

      // Kill the process
      connection.process.kill();

      // Remove from connections
      this.connections.delete(serverName);
      connection.connected = false;

      this.emit('serverDisconnected', serverName);
    } catch (error) {
      // Log but don't throw - disconnection should be best-effort
      logger.warn(`Error disconnecting from ${serverName}:`, error);
    }
  }

  /**
   * Check if connected to a server
   */
  isConnected(serverName: string): boolean {
    if (!this.isDesktop) {
      return false;
    }

    const connection = this.connections.get(serverName);
    return connection?.connected ?? false;
  }

  /**
   * Get list of tools from a connected server
   */
  async getTools(serverName: string): Promise<Tool[]> {
    if (!this.isDesktop) {
      return [];
    }

    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      return [];
    }

    try {
      const response = await connection.client.listTools();
      return response.tools;
    } catch (error) {
      logger.error(`Error getting tools from ${serverName}:`, error);
      return [];
    }
  }

  /**
   * Invoke a tool on an MCP server
   */
  async invokeTool(
    serverName: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<CallToolResult> {
    if (!this.isDesktop) {
      throw new Error('MCP features are only available in desktop mode (Electron/Tauri).');
    }

    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Not connected to server ${serverName}`);
    }

    try {
      // Get tool definition to validate parameters
      const tools = await this.getTools(serverName);
      const tool = tools.find(t => t.name === toolName);

      if (!tool) {
        throw new Error(`Tool ${toolName} not found on server ${serverName}`);
      }

      // Validate required parameters
      if (tool.inputSchema && tool.inputSchema.type === 'object') {
        const required = (tool.inputSchema as any).required || [];
        for (const param of required) {
          if (!(param in parameters)) {
            throw new Error(`Missing required parameter: ${param}`);
          }
        }
      }

      // Invoke the tool
      const result = await connection.client.callTool({
        name: toolName,
        arguments: parameters
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to invoke tool ${toolName}: ${String(error)}`);
    }
  }

  /**
   * Get list of resources from a connected server
   */
  async getResources(serverName: string): Promise<Resource[]> {
    if (!this.isDesktop) {
      return [];
    }

    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      return [];
    }

    try {
      const response = await connection.client.listResources();
      return response.resources;
    } catch (error) {
      logger.error(`Error getting resources from ${serverName}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to resource updates
   */
  async subscribeToResource(serverName: string, uri: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('MCP features are only available in desktop mode (Electron/Tauri).');
    }

    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Not connected to server ${serverName}`);
    }

    try {
      // Subscribe to the resource
      await connection.client.subscribeResource({ uri });

      // Set up listener for resource updates
      // Note: Notification handler setup commented out due to type issues
      // Will be implemented when MCP SDK types are properly configured
      // const self = this;
      // connection.client.setNotificationHandler({
      //   async handleNotification(notification: any) {
      //     if (notification.method === 'notifications/resources/updated') {
      //       self.emit('resourceUpdated', { serverName, uri });
      //     }
      //   }
      // });
    } catch (error) {
      throw new Error(`Failed to subscribe to resource ${uri}: ${String(error)}`);
    }
  }

  /**
   * Get list of prompts from a connected server
   */
  async getPrompts(serverName: string): Promise<Prompt[]> {
    if (!this.isDesktop) {
      return [];
    }

    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      return [];
    }

    try {
      const response = await connection.client.listPrompts();
      return response.prompts;
    } catch (error) {
      logger.error(`Error getting prompts from ${serverName}:`, error);
      return [];
    }
  }

  /**
   * Get a prompt with arguments
   */
  async getPrompt(
    serverName: string,
    promptName: string,
    args: Record<string, string>
  ): Promise<GetPromptResult> {
    if (!this.isDesktop) {
      throw new Error('MCP features are only available in desktop mode (Electron/Tauri).');
    }

    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Not connected to server ${serverName}`);
    }

    try {
      const result = await connection.client.getPrompt({
        name: promptName,
        arguments: args
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get prompt ${promptName}: ${String(error)}`);
    }
  }

  /**
   * Disconnect all servers and clean up
   */
  async dispose(): Promise<void> {
    if (!this.isDesktop) {
      return; // No-op in web mode
    }

    const serverNames = Array.from(this.connections.keys());

    // Disconnect all servers
    await Promise.all(
      serverNames.map(name => this.disconnectServer(name))
    );

    // Remove all event listeners
    this.removeAllListeners();
  }
}

// Export types for external use
export type { CallToolResult, GetPromptResult,Prompt, Resource, Tool };
