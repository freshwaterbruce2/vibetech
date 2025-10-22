#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { getCryptoTradingStatus } from './tools/crypto-trading.js';
import { getRecentTasks, getSessionContext, saveTask } from './tools/memory-bank.js';
import { queryDatabase, getDatabaseSummary } from './tools/database-hub.js';
import { getProjectStatus, getActiveProject, listAllProjects } from './tools/project-context.js';
import { executeSlashCommand } from './tools/command-executor.js';
import { RESOURCES, getResourceContent } from './resources/index.js';
import { PROMPTS, getPromptMessages } from './prompts/index.js';

// Create server instance
const server = new Server(
  {
    name: 'workflow-hub-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Define all available tools
const tools: Tool[] = [
  // Crypto Trading Tools
  {
    name: 'get_crypto_status',
    description: 'Get current crypto trading bot status including positions, recent trades, and system health',
    inputSchema: {
      type: 'object',
      properties: {
        include_positions: {
          type: 'boolean',
          description: 'Include open positions in response',
          default: true,
        },
        include_performance: {
          type: 'boolean',
          description: 'Include performance metrics (P&L, win rate)',
          default: false,
        },
      },
    },
  },

  // Memory Bank Tools
  {
    name: 'get_recent_tasks',
    description: 'Get recent tasks and work sessions from memory bank',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of tasks to return',
          default: 5,
        },
        project: {
          type: 'string',
          description: 'Filter by project name (optional)',
        },
      },
    },
  },
  {
    name: 'get_session_context',
    description: 'Get the last session context to resume work',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'save_task',
    description: 'Save a task or work item to memory bank for later',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Task description or content',
        },
        project: {
          type: 'string',
          description: 'Associated project name',
        },
        category: {
          type: 'string',
          description: 'Task category (feature, bug, refactor, etc)',
        },
        status: {
          type: 'string',
          description: 'Task status (in_progress, pending, completed)',
          default: 'pending',
        },
      },
      required: ['content'],
    },
  },

  // Database Hub Tools
  {
    name: 'query_database',
    description: 'Query any of the databases (trading, nova_activity, unified)',
    inputSchema: {
      type: 'object',
      properties: {
        database: {
          type: 'string',
          enum: ['trading', 'nova', 'unified'],
          description: 'Which database to query',
        },
        query: {
          type: 'string',
          description: 'SQL query to execute (SELECT only for safety)',
        },
      },
      required: ['database', 'query'],
    },
  },
  {
    name: 'get_database_summary',
    description: 'Get a summary of all available databases and their contents',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Project Context Tools
  {
    name: 'get_project_status',
    description: 'Get git status, recent commits, and modified files for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_path: {
          type: 'string',
          description: 'Path to project (defaults to C:\\dev)',
        },
      },
    },
  },
  {
    name: 'get_active_project',
    description: 'Auto-detect the currently active project from git/memory',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_all_projects',
    description: 'List all projects in the monorepo with health status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Command Executor Tool
  {
    name: 'execute_command',
    description: 'Execute a slash command or PowerShell script',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Command to execute (e.g., /crypto:status, /web:quality-check)',
        },
      },
      required: ['command'],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    const content = await getResourceContent(uri);

    return {
      contents: [
        {
          uri,
          mimeType: RESOURCES.find((r) => r.uri === uri)?.mimeType || 'text/plain',
          text: content,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read resource ${uri}: ${errorMessage}`);
  }
});

// Handle list prompts request
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: PROMPTS.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  };
});

// Handle get prompt request
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const messages = getPromptMessages(name, args);

    return {
      description: PROMPTS.find((p) => p.name === name)?.description || '',
      messages,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get prompt ${name}: ${errorMessage}`);
  }
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_crypto_status':
        return await getCryptoTradingStatus(args || {});

      case 'get_recent_tasks':
        return await getRecentTasks(args || {});

      case 'get_session_context':
        return await getSessionContext();

      case 'save_task':
        return await saveTask(args as any);

      case 'query_database':
        return await queryDatabase(args as any);

      case 'get_database_summary':
        return await getDatabaseSummary();

      case 'get_project_status':
        return await getProjectStatus(args || {});

      case 'get_active_project':
        return await getActiveProject();

      case 'list_all_projects':
        return await listAllProjects();

      case 'execute_command':
        return await executeSlashCommand(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Workflow Hub MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
