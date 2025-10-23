# Workflow Hub MCP v1.1.0 - Upgrade Guide

## What's New

Your Workflow Hub MCP server has been upgraded with **2 powerful new capabilities** based on 2025 MCP best practices:

### ✅ Resources - Direct File Access
### ✅ Prompts - Pre-written Workflows
### ✅ Bug Fix - Crypto database column name

---

## 📚 Resources (NEW!)

Resources give me **direct access** to key files without you asking. I can proactively use context from:

### Available Resources:

| URI | Description | Path |
|-----|-------------|------|
| `workflow://claude-md` | Main CLAUDE.md configuration | C:\dev\CLAUDE.md |
| `workflow://recent-tasks` | Last 50 tasks from memory | memory-bank/quick-access/recent-tasks.json |
| `workflow://last-session` | Previous session context | memory-bank/quick-access/last-session.json |
| `workflow://crypto/config` | Trading bot configuration | crypto-enhanced/config.py |
| `workflow://crypto/logs/latest` | Last 100 log lines | crypto-enhanced/logs/trading.log |
| `workflow://project/readme` | Main project README | C:\dev\README.md |

### How It Works:

**Before (v1.0):**
```
You: "Show me my recent tasks"
Me: *uses get_recent_tasks tool*
```

**Now (v1.1):**
```
You: "Show me my recent tasks"
Me: *directly reads workflow://recent-tasks resource* (faster, less overhead)
```

I can now **proactively** reference these files without explicit queries!

---

## 📝 Prompts (NEW!)

Prompts are **pre-written workflow templates** that ensure consistent, structured responses.

### Available Prompts:

#### 1. **morning-briefing**
Comprehensive morning status check:
- Crypto bot status, positions, failed orders
- Yesterday's tasks and uncommitted changes
- Today's suggested focus

**Usage in Claude Desktop:**
```
Use the "morning-briefing" prompt
```

#### 2. **crypto-health**
Detailed trading bot health check:
- System status (running/stopped, last trade)
- Current positions with P&L
- Recent issues and errors
- Optional: 30-day performance metrics

**Usage:**
```
Use the "crypto-health" prompt
Use the "crypto-health" prompt with include_performance=true
```

#### 3. **debug-mode**
Systematic debugging workflow:
- Current state analysis
- Data gathering (logs, database, git)
- Root cause analysis
- Recommended fixes

**Usage:**
```
Use the "debug-mode" prompt for component="crypto-bot"
Use the "debug-mode" prompt for component="web-app"
```

#### 4. **deploy-checklist**
Pre-deployment verification:
- Code quality checks
- Git status verification
- Dependencies audit
- Configuration validation
- Crypto bot safety check

**Usage:**
```
Use the "deploy-checklist" prompt for project="deepcode-editor"
Use the "deploy-checklist" prompt for project="crypto-enhanced"
```

#### 5. **weekly-review**
Weekly progress summary:
- Tasks completed this week (grouped by project)
- Active projects with status
- Crypto trading performance
- Next week planning

**Usage:**
```
Use the "weekly-review" prompt
```

---

## 🐛 Bug Fixes

### Fixed: Crypto Trading Database Query
- **Issue**: Database column name mismatch (`timestamp` vs `executed_at`)
- **Impact**: `get_crypto_status` tool was failing
- **Fixed**: Now properly queries `executed_at` column with fallback to `created_at`

---

## 🚀 How to Use (After Restart)

### Restart Claude Desktop
1. Quit Claude Desktop (system tray → Quit)
2. Wait 10 seconds
3. Relaunch

### Try It Out

**Test Resources:**
```
"Show me the CLAUDE.md file"
"What are my recent tasks?"
"Tail the crypto bot logs"
```

**Test Prompts:**
```
Use the "morning-briefing" prompt
Use the "crypto-health" prompt with include_performance=true
```

**Test Fixed Tool:**
```
"How's my crypto bot doing?"  (should work now!)
```

---

## 🎯 What This Means for You

### Resources = Faster, Smarter Responses
- I can reference your CLAUDE.md configuration automatically
- I know your recent tasks without asking
- I can check logs instantly

### Prompts = Consistent Workflows
- Morning briefings are now structured and thorough
- Debugging follows a systematic process
- Deployments have a checklist

### Combined Power
Example morning routine:
```
You: Use the "morning-briefing" prompt
Me: *Uses resources to read recent-tasks, last-session*
    *Uses crypto tools to check bot status*
    *Uses project tools to check git status*
    *Provides comprehensive structured briefing*
```

---

## 📊 Feature Comparison

| Feature | v1.0 | v1.1 |
|---------|------|------|
| Tools | 10 | 10 |
| Resources | ❌ | ✅ 6 resources |
| Prompts | ❌ | ✅ 5 prompts |
| Crypto Bug | ❌ | ✅ Fixed |
| Direct file access | ❌ | ✅ Yes |
| Structured workflows | ❌ | ✅ Yes |

---

## 💡 Pro Tips

1. **Morning Routine**: Start each day with `morning-briefing` prompt
2. **Before Deploy**: Always use `deploy-checklist` prompt
3. **Weekly Planning**: Use `weekly-review` every Friday
4. **Debugging**: Use `debug-mode` for systematic investigation
5. **Monitoring**: Use `crypto-health` for detailed bot checks

---

## 🆘 Troubleshooting

**"I don't see the new prompts"**
- Make sure you **completely restarted** Claude Desktop (Quit, not just close)
- Verify v1.1.0 in the MCP server logs

**"Resources not working"**
- Check file paths exist:
  - `C:\dev\CLAUDE.md`
  - `C:\dev\projects\active\web-apps\memory-bank\`
  - `C:\dev\projects\crypto-enhanced\`

**"Crypto status still failing"**
- Verify database exists: `C:\dev\projects\crypto-enhanced\trading.db`
- Check database has `trades` table with `executed_at` column

---

## 📚 Documentation

- **README.md** - Updated with Resources and Prompts sections
- **CHANGELOG.md** - Full version history
- **QUICK_REFERENCE.md** - All available queries
- **EXAMPLE_CONVERSATIONS.md** - Real usage examples

---

## 🎉 What's Next?

Future enhancements planned:
- **Notifications** - Real-time crypto alerts (bot stop, P&L thresholds)
- **Streaming** - Live log tailing, real-time price feeds
- **Progress** - Long-running command status updates
- **Query History** - Save frequently used database queries

**Current Version: 1.1.0** ✅
**Requires: Claude Desktop Restart** 🔄
