# Workflow Hub MCP Server

MCP server for Claude Desktop that provides unified access to:
- **Resources** - Direct access to CLAUDE.md, configs, logs
- **Prompts** - Pre-written workflow templates
- **Tools** - Crypto monitoring, memory bank, databases, projects
- Crypto trading bot monitoring
- Memory bank (task history & session context)
- Multi-database queries (trading, nova, unified)
- Project context and status
- Slash command execution

## Installation

```bash
cd C:\dev\workflow-hub-mcp
npm install
npm run build
```

## Configuration

Add to `C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "workflow-hub": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\dev\\workflow-hub-mcp\\dist\\index.js"]
    }
  }
}
```

## Available Features

### 📚 Resources (NEW!)
Direct access to key files without explicit queries:

- `workflow://claude-md` - Main CLAUDE.md configuration
- `workflow://recent-tasks` - Last 50 tasks from memory bank
- `workflow://last-session` - Previous session context
- `workflow://crypto/config` - Trading bot configuration
- `workflow://crypto/logs/latest` - Last 100 lines of trading logs
- `workflow://project/readme` - Main project README

### 📝 Prompts (NEW!)
Pre-written workflow templates for consistent responses:

- `morning-briefing` - Comprehensive morning status check
- `crypto-health` - Detailed bot health check
- `debug-mode` - Systematic debugging workflow
- `deploy-checklist` - Pre-deployment verification
- `weekly-review` - Weekly progress summary

### 🛠️ Tools

#### Crypto Trading
- `get_crypto_status` - Trading bot status, positions, recent trades

#### Memory Bank
- `get_recent_tasks` - Recent work items
- `get_session_context` - Resume last session
- `save_task` - Save work item for later

#### Database Hub
- `query_database` - Query trading/nova/unified databases
- `get_database_summary` - Overview of all databases

#### Project Context
- `get_project_status` - Git status and recent commits
- `get_active_project` - Auto-detect current project
- `list_all_projects` - All projects in monorepo

#### Command Executor
- `execute_command` - Run slash commands or PowerShell

## Usage Examples

**Resources (Automatic Access):**
```
"Show me the CLAUDE.md configuration"
→ I can read workflow://claude-md directly

"What are my recent tasks?"
→ I can read workflow://recent-tasks directly

"Tail the crypto bot logs"
→ I can read workflow://crypto/logs/latest directly
```

**Prompts (Structured Workflows):**
```
Use the "morning-briefing" prompt
→ Gets comprehensive morning status

Use the "crypto-health" prompt with include_performance=true
→ Full bot health check with 30-day metrics

Use the "debug-mode" prompt for component="crypto-bot"
→ Systematic debugging workflow

Use the "deploy-checklist" prompt for project="deepcode-editor"
→ Pre-deployment verification
```

**Tools (Explicit Queries):**
```
"How's my crypto bot doing?"
→ Uses get_crypto_status tool

"What was I working on yesterday?"
→ Uses get_recent_tasks tool

"Show me failed orders from the trading database"
→ Uses query_database tool with trading.db

"What's the current project status?"
→ Uses get_project_status tool
```

## Security

- Database queries: SELECT only (no DELETE/UPDATE/DROP)
- Commands: No destructive operations (rm/del/Remove-Item blocked)
- Read-only database access where possible
