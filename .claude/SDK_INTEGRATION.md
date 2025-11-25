# Claude Agent SDK Integration Guide

This document explains how to use our custom agent system with both **Claude Code Subagents** (Markdown files) and the **Claude Agent SDK** (programmatic TypeScript/Python API).

## ⚠️ Important: Two Different Formats

There are **two distinct systems** with different configuration formats:

### 1. Claude Code Subagents (Markdown Files)
**Location**: `.claude/agents/*.md`
**Format**: Simple YAML frontmatter
**Use Case**: Agents invoked by Claude Code CLI

```yaml
---
name: code-reviewer
description: Expert code reviewer
tools: Read, Write, Grep, Glob  # Comma-separated string
model: sonnet  # or opus, haiku, inherit
---
```

### 2. Claude Agent SDK (Programmatic API)
**Location**: TypeScript/Python code
**Format**: SDK constructor options
**Use Case**: Building agents with code

```typescript
const agent = new Agent({
  allowedTools: ['Read', 'Write'],  // Array format
  disallowedTools: ['WebSearch'],
  permissionMode: 'auto',
  mcpServers: { filesystem: {...} }
});
```

## Overview

Our agent system uses **Claude Code Subagents** (Markdown format) but can also be used with the **Claude Agent SDK** (programmatic format):

- ✅ **Subagent Markdown Files**: All agents in `.claude/agents/*.md` use correct subagent format
- ✅ **Tool Permissions**: Configured via `tools` field (comma-separated)
- ✅ **Model Selection**: Configured via `model` field (sonnet, opus, haiku, inherit)
- ✅ **Subagent Collaboration**: Agents can delegate tasks via Task tool
- 🚀 **Auto-Detection**: Custom `agents.json` mapping for project-based agent selection
- 🚀 **Memory Integration**: Session context persistence via memory-bank system

## Installation

### TypeScript / Node.js

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### Python

```bash
pip install claude-agent-sdk
```

## Basic Usage

### TypeScript Example

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

// Load agent from .claude/agents/ directory
const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  settingSources: ['project'], // Load .claude/agents/ and CLAUDE.md
  subagent: 'crypto-expert', // Invoke specific agent
  workingDirectory: './projects/crypto-enhanced'
});

// Run agent on a task
const result = await agent.run({
  prompt: 'Analyze the trading system performance and suggest optimizations'
});

console.log(result.output);
```

### Python Example

```python
from claude_agent_sdk import Agent

# Load agent from .claude/agents/ directory
agent = Agent(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    setting_sources=["project"],  # Load .claude/agents/ and CLAUDE.md
    subagent="crypto-expert",  # Invoke specific agent
    working_directory="./projects/crypto-enhanced"
)

# Run agent on a task
result = agent.run(
    prompt="Analyze the trading system performance and suggest optimizations"
)

print(result.output)
```

## Available Specialist Agents

Our monorepo includes 6 specialist agents configured as Claude Code Subagents (Markdown files):

| Agent | ID | Projects | Model | Tools |
|-------|-----|----------|-------|-------|
| **Crypto Trading Expert** | `crypto-expert` | crypto-enhanced | sonnet | Read, Write, Edit, Bash, Grep, Glob, Task |
| **Web Application Expert** | `webapp-expert` | digital-content-builder, business-booking-platform | inherit | Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch |
| **Mobile Application Expert** | `mobile-expert` | Vibe-Tutor, Vibe-Subscription-Guard | inherit | Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch |
| **Desktop Application Expert** | `desktop-expert` | taskmaster, deepcode-editor | inherit | Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch |
| **Backend API Expert** | `backend-expert` | memory-bank | inherit | Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch |
| **DevOps & Infrastructure Expert** | `devops-expert` | workspace-level | inherit | Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch |

### Subagent File Format

Each agent is defined in `.claude/agents/[name].md`:

```yaml
---
name: crypto-expert
description: Python trading system development with Kraken API. Use proactively for optimization.
tools: Read, Write, Edit, Bash, Grep, Glob, Task
model: sonnet
---

# System prompt defining agent's role and behavior
...
```

## Tool Permissions System

Each subagent has tool permissions configured via the `tools` field in YAML frontmatter:

### Example: crypto-expert Tools

```yaml
---
name: crypto-expert
description: Python trading system expert
tools: Read, Write, Edit, Bash, Grep, Glob, Task  # Comma-separated
model: sonnet
---
```

### Tool Configuration Options

**1. Explicit Tool List** (Recommended for restricted agents):
```yaml
tools: Read, Write, Edit, Bash, Grep, Glob
```

**2. Inherit All Tools** (Omit `tools` field):
```yaml
---
name: webapp-expert
description: Web development expert
model: inherit
# No tools field = inherits all tools from main thread
---
```

### Restricting Tools

To restrict tools, simply list only the allowed tools:

```yaml
# Example: Read-only agent
---
name: code-analyzer
description: Code analysis without modifications
tools: Read, Grep, Glob  # No Write or Edit
model: sonnet
---
```

**Note**: Claude Code Subagents do not support `disallowedTools` or `permissionMode` fields. Use explicit tool listing for restrictions.

## MCP Server Integration

MCP servers are configured **separately** from subagent definitions, not in the YAML frontmatter.

### MCP Configuration Location

MCP servers are configured in:
- **Claude Desktop**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Claude Code CLI**: `~/.claude/mcp.json` or via `--mcp` flag

### Available MCP Servers

Subagents automatically inherit access to all configured MCP servers. Our setup commonly uses:

| MCP Server | Purpose | Used By |
|------------|---------|---------|
| **filesystem** | File operations | All agents |
| **postgres** | Database queries | crypto-expert, backend-expert |
| **github** | PR management, releases | webapp-expert, mobile-expert, desktop-expert, devops-expert |
| **puppeteer** | E2E testing | webapp-expert |

### Using MCP Tools in Subagents

Subagents access MCP tools automatically when `tools` field is omitted:

```yaml
---
name: webapp-expert
description: Web development expert
model: inherit
# Omitting tools = inherits ALL tools including MCP
---
```

To restrict MCP access, explicitly list non-MCP tools:

```yaml
---
name: restricted-agent
description: Limited agent
tools: Read, Write, Edit  # Only built-in tools, no MCP
model: sonnet
---
```

## Subagent Collaboration

Agents can delegate tasks to other specialists using the Task tool:

### Example: Delegating from crypto-expert to devops-expert

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const cryptoAgent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  subagent: 'crypto-expert'
});

// Crypto agent automatically delegates Docker deployment to devops-expert
const result = await cryptoAgent.run({
  prompt: 'Deploy the trading system to production with Docker'
});

// Behind the scenes, crypto-expert will invoke:
// Task({ subagent_type: 'devops-expert', prompt: '...' })
```

### Manual Subagent Invocation

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

// Parent agent
const parentAgent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  subagent: 'webapp-expert'
});

// Explicitly invoke subagent
const result = await parentAgent.task({
  subagent_type: 'backend-expert',
  prompt: 'Design REST API for user authentication with JWT',
  description: 'API authentication design'
});
```

## Custom Project Mapping (agents.json)

Our system includes **enhanced auto-detection** via `.claude/agents.json`:

```json
{
  "project_agents": {
    "crypto-enhanced": "crypto-expert",
    "digital-content-builder": "webapp-expert",
    "business-booking-platform": "webapp-expert",
    "Vibe-Tutor": "mobile-expert",
    "memory-bank": "backend-expert"
  },
  "agent_definitions": {
    "crypto-expert": {
      "display_name": "Crypto Trading Expert",
      "file": "agents/crypto-expert.md",
      "expertise": ["Python", "AsyncIO", "Kraken API", "WebSocket V2"],
      "primary_directive": "Anti-Duplication & Performance-First Design"
    }
  }
}
```

### Auto-Detection Based on Working Directory

```typescript
import { Agent, detectProjectAgent } from '@anthropic-ai/claude-agent-sdk';
import agentsConfig from './.claude/agents.json';

// Automatically select agent based on current directory
const currentDir = process.cwd();
const projectName = currentDir.split('/').pop();
const agentType = agentsConfig.project_agents[projectName];

const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  subagent: agentType || 'webapp-expert', // Fallback to webapp-expert
  workingDirectory: currentDir
});
```

## Memory System Integration

Our agents integrate with a **Phase 1.5 Memory System** for context persistence:

### Memory Features

1. **Task History**: Tracks up to 5 recent tasks per project
2. **Session Context**: Preserves last session state (branch, working dir, prompt)
3. **Project-Aware Filtering**: Shows only relevant tasks for current project
4. **Auto-Save**: Hooks automatically save context on session start/end

### Memory API Usage

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';
import { MemorySystem } from './projects/active/web-apps/memory-bank';

const memory = new MemorySystem('./projects/active/web-apps/memory-bank');

// Retrieve last session context
const lastSession = await memory.retrieve('last-session', 'session_state');

// Create agent with memory context
const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  subagent: 'crypto-expert',
  context: {
    previousSession: lastSession,
    recentTasks: await memory.getRecentTasks('crypto-enhanced')
  }
});

// Run agent
const result = await agent.run({
  prompt: 'Continue optimizing the trading engine from last session'
});

// Save task to memory
await memory.storeTask({
  prompt: result.input,
  status: 'completed',
  timestamp: new Date().toISOString(),
  project: 'crypto-enhanced',
  category: 'optimization'
});
```

## Advanced Examples

### Multi-Agent Workflow

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

async function fullStackFeature() {
  // 1. Backend agent designs API
  const backendAgent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY,
    subagent: 'backend-expert'
  });

  const apiDesign = await backendAgent.run({
    prompt: 'Design REST API for user profile management with CRUD operations'
  });

  // 2. Frontend agent implements UI
  const frontendAgent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY,
    subagent: 'webapp-expert',
    context: { apiContract: apiDesign.output }
  });

  const uiImplementation = await frontendAgent.run({
    prompt: 'Create React components for user profile UI using the API contract'
  });

  // 3. DevOps agent sets up deployment
  const devopsAgent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY,
    subagent: 'devops-expert'
  });

  const deployment = await devopsAgent.run({
    prompt: 'Create GitHub Actions workflow for deploying backend and frontend'
  });

  return { apiDesign, uiImplementation, deployment };
}
```

### Parallel Agent Execution

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

async function parallelCodeReview() {
  const agents = [
    new Agent({ subagent: 'webapp-expert' }),
    new Agent({ subagent: 'backend-expert' }),
    new Agent({ subagent: 'devops-expert' })
  ];

  const results = await Promise.all([
    agents[0].run({ prompt: 'Review frontend code for performance issues' }),
    agents[1].run({ prompt: 'Review API security and authentication' }),
    agents[2].run({ prompt: 'Review CI/CD pipeline for optimization' })
  ]);

  return results;
}
```

## Comparison: Claude Code Subagents vs Agent SDK vs Our System

| Feature | Claude Code Subagents | Agent SDK (Programmatic) | Our Enhanced System |
|---------|----------------------|-------------------------|-------------------|
| **Format** | Markdown with YAML | TypeScript/Python code | Markdown with YAML |
| **Location** | `.claude/agents/*.md` | Code files | `.claude/agents/*.md` |
| **Tool Config** | `tools: Read, Write` | `allowedTools: ['Read']` | `tools: Read, Write, Edit, Bash` |
| **Model Selection** | `model: sonnet` | `model: 'sonnet'` | `model: sonnet` or `inherit` |
| **Use Case** | CLI invocation | Programmatic building | CLI with enhancements |
| **Agent Definitions** | Manual creation | Programmatic config | ✅ 6 pre-configured specialists |
| **Tool Permissions** | Simple `tools` list | `allowedTools`, `disallowedTools` | ✅ Pre-configured per agent |
| **MCP Integration** | Inherits from config | Programmatic setup | ✅ Automatic inheritance |
| **Subagent Collaboration** | Built-in Task tool | Must implement | ✅ Documented patterns |
| **Project Auto-Detection** | Not available | Not available | ✅ `agents.json` mapping |
| **Memory System** | Not available | Not available | ✅ Session context persistence |
| **Anti-Duplication** | Not enforced | Not enforced | ✅ Primary directive in all agents |

### When to Use Which Format

**Use Claude Code Subagents (Markdown)** when:
- Working with Claude Code CLI
- Want simple, declarative configuration
- Need agents invokable via `/agents` command
- Building team-shared agent library

**Use Agent SDK (Programmatic)** when:
- Building agents with TypeScript/Python
- Need dynamic agent configuration
- Programmatically generating agents
- Building agent orchestration systems

## Troubleshooting

### Agent Not Found

**Error**: `Agent 'crypto-expert' not found`

**Solution**: Ensure `settingSources: ['project']` is set to load `.claude/agents/`

```typescript
const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  settingSources: ['project'], // Required to load custom agents
  subagent: 'crypto-expert'
});
```

### Permission Denied

**Error**: `Tool 'WebSearch' is not allowed for this agent`

**Solution**: Check agent frontmatter in `.claude/agents/[agent-name].md` and override if needed:

```typescript
const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  subagent: 'crypto-expert',
  allowedTools: ['Read', 'Write', 'WebSearch'] // Override permissions
});
```

### MCP Server Connection Failed

**Error**: `Failed to connect to MCP server: filesystem`

**Solution**: Ensure MCP servers are configured in `~/.claude/mcp.json` or Claude Desktop config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    }
  }
}
```

## Resources

- **Official SDK Documentation**: https://docs.claude.com/en/docs/claude-code/agent-sdk
- **Agent Definitions**: `.claude/agents/*.md`
- **Agent Configuration**: `.claude/agents.json`
- **Memory System**: `projects/active/web-apps/memory-bank/`
- **Hooks**: `.claude/hooks/*.ps1`
- **Project Instructions**: `CLAUDE.md` and `AGENTS.md`

## Contributing

When adding new agents:

1. Create agent definition in `.claude/agents/[agent-name].md`
2. Add YAML frontmatter with `allowedTools`, `disallowedTools`, `permissionMode`, `mcpServers`
3. Add project mappings to `.claude/agents.json`
4. Document subagent collaboration patterns
5. Add MCP integration examples
6. Test with both TypeScript and Python SDK

## Support

For issues or questions:
- SDK Issues: https://github.com/anthropics/claude-agent-sdk/issues
- Custom Agent Issues: Open issue in this repository
