import { logger } from '../services/Logger';
export interface MCPTool {
  id: string;
  name: string;
  description: string;
  server: string;
  category: 'filesystem' | 'network' | 'database' | 'api' | 'utility';
  requiredPermissions: string[];
  parameters: MCPParameter[];
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: string | number | boolean | Record<string, unknown> | unknown[];
}

export interface MCPPermission {
  tool: string;
  actions: string[];
  constraints?: Record<string, unknown>;
}

export interface AgentMCPProfile {
  agentId: string;
  allowedTools: string[];
  deniedTools: string[];
  permissions: MCPPermission[];
  quotas: {
    maxCallsPerMinute: number;
    maxDataTransfer: number;
  };
}

export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private agentProfiles: Map<string, AgentMCPProfile> = new Map();
  private toolUsageLog: ToolUsageEntry[] = [];

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Filesystem tools
    this.registerTool({
      id: 'mcp.filesystem.read',
      name: 'Read File',
      description: 'Read contents of a file',
      server: 'filesystem',
      category: 'filesystem',
      requiredPermissions: ['filesystem:read'],
      parameters: [
        {
          name: 'path',
          type: 'string',
          required: true,
          description: 'File path to read',
        },
      ],
    });

    // GitHub tools
    this.registerTool({
      id: 'mcp.github.create_pr',
      name: 'Create Pull Request',
      description: 'Create a GitHub pull request',
      server: 'github',
      category: 'api',
      requiredPermissions: ['github:write'],
      parameters: [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'PR title',
        },
        {
          name: 'body',
          type: 'string',
          required: true,
          description: 'PR description',
        },
        {
          name: 'base',
          type: 'string',
          required: true,
          description: 'Base branch',
        },
        {
          name: 'head',
          type: 'string',
          required: true,
          description: 'Head branch',
        },
      ],
    });

    // Memory tools
    this.registerTool({
      id: 'mcp.memory.store',
      name: 'Store Memory',
      description: 'Store information in agent memory',
      server: 'memory',
      category: 'utility',
      requiredPermissions: ['memory:write'],
      parameters: [
        {
          name: 'key',
          type: 'string',
          required: true,
          description: 'Memory key',
        },
        {
          name: 'value',
          type: 'object',
          required: true,
          description: 'Value to store',
        },
      ],
    });
  }

  registerTool(tool: MCPTool) {
    this.tools.set(tool.id, tool);
  }

  getTool(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }

  getToolsByCategory(category: string): MCPTool[] {
    return Array.from(this.tools.values()).filter((tool) => tool.category === category);
  }

  createAgentProfile(
    agentId: string,
    allowedTools: string[],
    quotas?: Partial<AgentMCPProfile['quotas']>
  ): AgentMCPProfile {
    const profile: AgentMCPProfile = {
      agentId,
      allowedTools,
      deniedTools: [],
      permissions: [],
      quotas: {
        maxCallsPerMinute: quotas?.maxCallsPerMinute || 60,
        maxDataTransfer: quotas?.maxDataTransfer || 1024 * 1024 * 100, // 100MB
      },
    };

    this.agentProfiles.set(agentId, profile);
    return profile;
  }

  canAgentUseTool(agentId: string, toolId: string): boolean {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) {
      return false;
    }

    // Check denied list first
    if (profile.deniedTools.includes(toolId)) {
      return false;
    }

    // Check allowed list
    if (!profile.allowedTools.includes(toolId) && !profile.allowedTools.includes('*')) {
      return false;
    }

    // Check rate limits
    const recentUsage = this.getRecentUsage(agentId, 60); // Last minute
    if (recentUsage.length >= profile.quotas.maxCallsPerMinute) {
      return false;
    }

    return true;
  }

  async executeTool(
    agentId: string,
    toolId: string,
    parameters: Record<string, any>
  ): Promise<any> {
    if (!this.canAgentUseTool(agentId, toolId)) {
      throw new Error(`Agent ${agentId} cannot use tool ${toolId}`);
    }

    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Validate parameters
    this.validateParameters(tool, parameters);

    // Log usage
    this.logUsage(agentId, toolId, parameters);

    // In real implementation, this would call the actual MCP server
    logger.debug(`Executing tool ${toolId} for agent ${agentId}`, parameters);

    return { success: true, result: 'Mock result' };
  }

  private validateParameters(tool: MCPTool, parameters: Record<string, any>) {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      if (param.name in parameters) {
        const value = parameters[param.name];
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (actualType !== param.type && param.type !== 'object') {
          throw new Error(
            `Invalid type for parameter ${param.name}: expected ${param.type}, got ${actualType}`
          );
        }
      }
    }
  }

  private logUsage(agentId: string, toolId: string, parameters: Record<string, any>) {
    this.toolUsageLog.push({
      timestamp: new Date(),
      agentId,
      toolId,
      parameters,
      success: true,
    });
  }

  private getRecentUsage(agentId: string, seconds: number): ToolUsageEntry[] {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return this.toolUsageLog.filter(
      (entry) => entry.agentId === agentId && entry.timestamp > cutoff
    );
  }

  getUsageStats(agentId?: string): {
    totalCalls: number;
    toolBreakdown: Record<string, number>;
    errorRate: number;
  } {
    const relevantLogs = agentId
      ? this.toolUsageLog.filter((log) => log.agentId === agentId)
      : this.toolUsageLog;

    const toolBreakdown: Record<string, number> = {};
    let errorCount = 0;

    relevantLogs.forEach((log) => {
      toolBreakdown[log.toolId] = (toolBreakdown[log.toolId] || 0) + 1;
      if (!log.success) {
        errorCount++;
      }
    });

    return {
      totalCalls: relevantLogs.length,
      toolBreakdown,
      errorRate: relevantLogs.length > 0 ? errorCount / relevantLogs.length : 0,
    };
  }
}

interface ToolUsageEntry {
  timestamp: Date;
  agentId: string;
  toolId: string;
  parameters: Record<string, any>;
  success: boolean;
}
