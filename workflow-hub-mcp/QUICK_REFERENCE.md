# Workflow Hub MCP - Quick Reference Guide

This guide shows you the most useful queries to use with Claude Desktop after installing the Workflow Hub MCP server.

## 🤖 Crypto Trading Monitoring

### Check Bot Status
```
"How's my crypto bot doing?"
"Is the trading bot running?"
"Show me crypto trading status"
```
**Returns:** Bot running status, last trade time, failed orders (24h)

### Get Detailed Status with Positions
```
"Show me crypto status with open positions"
"What positions do I have open?"
"How's my crypto bot doing? Include positions and P&L"
```
**Returns:** Everything above + open positions with unrealized P&L

### Get Performance Metrics
```
"Show me crypto performance metrics"
"What's my trading bot's performance?"
"Get crypto status with performance data"
```
**Returns:** Runs `check_status.py` and includes weekly/monthly stats

### Check for Issues
```
"Any failed orders in the last 24 hours?"
"Are there any errors in the crypto bot?"
"Show me what went wrong with the trading bot today"
```
**Returns:** Failed orders, error messages, system health

---

## 📝 Memory Bank & Task Management

### Resume Work
```
"What was I working on?"
"Resume my last session"
"What's my session context?"
```
**Returns:** Last session info, project context, next steps

### View Recent Tasks
```
"Show me my recent tasks"
"What have I been working on this week?"
"List my last 10 tasks"
```
**Returns:** Recent tasks with status, project, category, timestamps

### Filter by Project
```
"What tasks did I do on deepcode-editor?"
"Show me recent work on crypto-enhanced"
```
**Returns:** Filtered task list for specific project

### Save Current Work
```
"Save this task: fix App.tsx rendering bug in deepcode-editor"
"Remember: investigate crypto bot failed orders issue"
```
**Returns:** Confirmation that task was saved

---

## 💾 Database Queries

### Database Overview
```
"Show me a summary of all databases"
"What databases do I have?"
"Give me database stats"
```
**Returns:** All databases, table counts, row counts

### Query Trading Database
```
"Show me the last 5 trades from the database"
"Query trading database: SELECT * FROM orders WHERE status='failed' LIMIT 10"
"Get all open positions from trading.db"
```
**Returns:** Query results in markdown table format

**Example Queries:**
- `SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10` - Last 10 trades
- `SELECT * FROM positions WHERE status='open'` - Open positions
- `SELECT * FROM orders WHERE status='failed' AND created_at > datetime('now', '-7 days')` - Failed orders this week

### Query Nova Activity Database
```
"Query nova database: SELECT * FROM deep_work_sessions ORDER BY start_time DESC LIMIT 5"
"Show me recent deep work sessions"
```
**Returns:** Deep work tracking data, activity snapshots

### Query Unified Database
```
"Query unified database: SELECT * FROM projects"
"Show me all projects from the unified database"
```
**Returns:** Data from D:\databases\database.db (IconForge, etc.)

---

## 📁 Project & Git Context

### Git Status
```
"What's the git status?"
"Show me modified files"
"What changed in the project?"
```
**Returns:** Modified files, current branch, recent commits

### Current Project Detection
```
"What project am I working on?"
"Detect my active project"
"What's the current project?"
```
**Returns:** Auto-detected project from git changes

### List All Projects
```
"Show me all projects"
"List all projects in the monorepo"
"What projects do I have?"
```
**Returns:** All projects organized by category (web, desktop, mobile, trading)

---

## ⚡ Command Execution

### Run Slash Commands
```
"Run /crypto:status"
"Execute /crypto:performance"
"Run /web:quality-check"
```
**Returns:** Output from your slash commands in `.claude/commands/`

**Available Commands:**
- `/crypto:status` - Comprehensive crypto bot health check
- `/crypto:performance` - Performance metrics and scaling readiness
- `/crypto:restart` - Restart trading bot
- `/web:quality-check` - Run lint + typecheck + build
- `/web:test-all` - Run all test suites

### Run PowerShell Commands
```
"Execute: Get-Process python | Select-Object Name, CPU"
"Run: git log --oneline -5"
```
**Returns:** Command output (read-only operations only)

---

## 🔥 Power User Combos

### Morning Check-In
```
"Give me a morning briefing: crypto status, recent tasks, and git status"
```
I'll use multiple tools to give you a complete overview.

### Debug Crypto Issues
```
"My crypto bot isn't trading. Check:
1. Is it running?
2. Any failed orders?
3. When was the last trade?
4. Show me errors from the database"
```
I'll investigate systematically using multiple queries.

### Project Switch
```
"I'm switching to deepcode-editor. Show me:
- Recent tasks on this project
- Current git status
- What I was working on last"
```
I'll help you resume work with full context.

### End of Day Summary
```
"Save my work for today:
- Fixed crypto nonce issues
- Updated App.tsx in deepcode-editor
- Ran performance tests
What should I work on tomorrow?"
```
I'll save the tasks and suggest next steps.

---

## 🛡️ Security Notes

**Database Queries:**
- ✅ SELECT queries only (safe)
- ❌ INSERT/UPDATE/DELETE blocked
- ❌ DROP/ALTER blocked

**Command Execution:**
- ✅ Slash commands from `.claude/commands/`
- ✅ Read-only PowerShell commands
- ❌ Destructive commands (rm/del) blocked

**File Access:**
- ✅ Read-only database access
- ✅ Memory bank read/write
- ❌ No direct filesystem writes

---

## 💡 Pro Tips

1. **Be Conversational:** Ask naturally, I'll figure out which tools to use
   - "How's my crypto bot?" vs "Execute get_crypto_status tool"

2. **Combine Queries:** Ask for multiple things at once
   - "Check crypto status and show me recent tasks"

3. **Use Project Names:** Mention projects explicitly for better filtering
   - "Show tasks for deepcode-editor"

4. **Save Often:** Save important work items for context
   - "Remember: need to fix the WebSocket disconnect issue"

5. **Morning Routine:** Start each day with a status check
   - "Good morning! Crypto status and what did I work on yesterday?"

---

## 🆘 Troubleshooting

**"I don't see the tools"**
- Restart Claude Desktop completely (Quit from system tray)
- Wait 10 seconds, relaunch
- Check: `C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json`

**"Database query failed"**
- Only SELECT queries allowed
- Check database path exists
- Try `get_database_summary` first to verify connection

**"Command execution timed out"**
- Long-running commands timeout at 30-60 seconds
- Use background execution for long tasks
- Check slash command scripts for errors

**"Memory bank is empty"**
- Start saving tasks: "Save this task: [description]"
- Memory persists in `C:\dev\projects\active\web-apps\memory-bank\quick-access\`

---

## 📚 Full Tool List

| Tool | Purpose | Example |
|------|---------|---------|
| `get_crypto_status` | Trading bot status | "How's my crypto bot?" |
| `get_recent_tasks` | Task history | "Show recent tasks" |
| `get_session_context` | Resume session | "What was I doing?" |
| `save_task` | Save work item | "Remember: fix bug X" |
| `query_database` | SQL queries | "Query trading.db for failed orders" |
| `get_database_summary` | DB overview | "Show database stats" |
| `get_project_status` | Git status | "What changed?" |
| `get_active_project` | Detect project | "What project am I on?" |
| `list_all_projects` | All projects | "List all projects" |
| `execute_command` | Run commands | "Run /crypto:status" |

---

**Need help?** Just ask! I'll figure out which tools to use based on what you need.
