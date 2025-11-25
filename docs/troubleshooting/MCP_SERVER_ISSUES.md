# MCP Server Troubleshooting Guide

**Last Updated:** October 3, 2025
**Applies To:** Claude Desktop, Claude Code, MCP Servers

---

## 🔍 Common Issues & Solutions

### Issue 1: MCP Server Version Mismatch

**Symptoms:**
- Server reports older version than package.json
- Features not working as expected
- Build appears successful but changes don't apply

**Root Cause:**
Version hardcoded in source files (e.g., `src/version.ts`) doesn't match `package.json`

**Resolution:**
```bash
# 1. Sync version across all files
npm run sync-version

# 2. Rebuild with updated version
npm run build

# 3. Restart Claude Desktop completely
# Windows: Right-click system tray icon → Quit
# macOS: Cmd+Q (complete quit, not window close)
# Linux: Full application quit

# 4. Verify version in logs
tail -50 "$APPDATA\Claude\logs\mcp-server-[name].log" | grep version
```

**Prevention:**
- Always use `npm run sync-version` before publishing
- Automate version sync in CI/CD pipeline
- Add version check to pre-commit hooks

---

### Issue 2: Claude Desktop Connection Failures

**Symptoms:**
- "Cannot connect to MCP server" error
- MCP tools not appearing in Claude Desktop
- Server starts but immediately disconnects

**Common Causes:**

#### A. Windows npx Path Issues
**Problem:** Using `"command": "npx"` on Windows fails
**Solution:** Use full path to npx.cmd

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    }
  }
}
```

**Find your npx path:**
```powershell
(Get-Command npx).Source
```

#### B. Configuration File Issues
**Problem:** Typo or syntax error in claude_desktop_config.json
**Solution:** Validate JSON syntax

```bash
# Check JSON validity (Windows PowerShell)
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json

# Check JSON validity (macOS/Linux)
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

#### C. Node.js Version Compatibility
**Problem:** MCP server requires different Node.js version
**Solution:** Check server's `engines` field in package.json

```bash
# Check required Node version
npm view @wonderwhy-er/desktop-commander engines

# Check your Node version
node --version
```

---

### Issue 3: Timeout Errors (Error -32001)

**Symptoms:**
- "MCP error -32001: Request timed out" after 60 seconds
- Long-running operations fail
- Search/analysis tools timeout

**Root Cause:**
- Claude Desktop has hard-coded 60-second timeout
- TypeScript MCP SDK timeout limit
- Cannot be configured (as of October 2025)

**Workarounds:**

1. **Break operations into smaller chunks**
   ```typescript
   // Instead of one large search
   await searchAllFiles(largeDirectory);

   // Use streaming/progressive results
   const session = await startSearch(directory);
   const results = await getMoreResults(session, 0, 100);
   ```

2. **Use background processes**
   - Start process, return PID immediately
   - Poll for results with `read_process_output`
   - Early termination when needed

3. **Optimize operations**
   - Limit search scope
   - Use file patterns to filter
   - Enable early termination for file searches

**Future:** Feature request open for configurable timeouts in Claude Desktop

---

### Issue 4: Restart Required But Changes Don't Apply

**Symptoms:**
- Restarted Claude Desktop
- MCP server still shows old behavior
- Logs show old version

**Debugging Steps:**

1. **Verify complete quit (not just window close)**
   ```powershell
   # Windows - Check if Claude is still running
   Get-Process | Where-Object {$_.Name -like "*Claude*"}

   # Should return nothing if properly quit
   ```

2. **Check if build actually succeeded**
   ```bash
   # Verify dist files are recent
   ls -lt dist/ | head -10

   # Check version.js content
   cat dist/version.js
   ```

3. **Clear Claude Desktop cache (last resort)**
   ```bash
   # WARNING: This resets all Claude Desktop settings
   # Windows
   Remove-Item "$env:APPDATA\Claude" -Recurse -Force

   # macOS
   rm -rf ~/Library/Application\ Support/Claude
   ```

---

## 🛠 Diagnostic Commands

### Check MCP Server Logs
```powershell
# Windows
Get-Content "$env:APPDATA\Claude\logs\mcp-server-[name].log" -Tail 100

# macOS/Linux
tail -100 ~/Library/Application\ Support/Claude/logs/mcp-server-[name].log
```

### Verify Configuration
```powershell
# Windows
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json

# macOS/Linux
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

### Test MCP Server Standalone
```bash
# Run server directly to check for errors
npx -y @wonderwhy-er/desktop-commander

# Or if local development
node dist/index.js
```

### Monitor Connection
```bash
# Watch logs in real-time (Windows)
Get-Content "$env:APPDATA\Claude\logs\mcp.log" -Wait -Tail 50

# Watch logs in real-time (macOS/Linux)
tail -f ~/Library/Application\ Support/Claude/logs/mcp.log
```

---

## 📋 Configuration Best Practices

### 1. Development vs Production

**Development (local path):**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["C:\\dev\\my-server\\dist\\index.js"]
    }
  }
}
```

**Production (npm package):**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@scope/my-server@latest"]
    }
  }
}
```

### 2. Environment Variables
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@scope/my-server"],
      "env": {
        "DEBUG": "true",
        "LOG_LEVEL": "verbose"
      }
    }
  }
}
```

### 3. Allowed Directories (Security)
```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"],
      "env": {
        "ALLOWED_DIRECTORIES": "C:\\dev,C:\\projects"
      }
    }
  }
}
```

---

## 🔄 Restart Procedures

### Claude Desktop Complete Restart

**Windows:**
1. Right-click Claude Desktop icon in system tray
2. Select "Quit" (NOT just close window)
3. Wait 10 seconds
4. Verify process stopped: `Get-Process | Where {$_.Name -like "*Claude*"}`
5. Relaunch Claude Desktop

**macOS:**
1. Press Cmd+Q (complete quit)
2. Or: Claude menu → Quit Claude
3. Wait 5-10 seconds
4. Verify: `ps aux | grep Claude`
5. Relaunch from Applications

**Why it matters:**
- MCP servers only initialize on startup
- Window close doesn't reload servers
- Cache may persist without complete quit

---

## 📚 Related Documentation

- [Desktop Commander Restart Guide](../guides/DESKTOP_COMMANDER_RESTART_GUIDE.md)
- [Claude Desktop MCP Documentation](https://docs.claude.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

---

## 🆘 Getting Help

1. **Check Logs First**
   - `$APPDATA\Claude\logs\mcp-server-[name].log`
   - Look for error patterns, connection issues

2. **Search Known Issues**
   - [Claude Code GitHub Issues](https://github.com/anthropics/claude-code/issues)
   - [MCP Protocol Issues](https://github.com/modelcontextprotocol/typescript-sdk/issues)

3. **Community Resources**
   - MCP Discord Server
   - Claude Desktop Forums

4. **Report Issues**
   - Include: OS, Claude version, MCP server version
   - Attach relevant log excerpts
   - Describe steps to reproduce

---

**Last Verified:** October 3, 2025
**Tested With:** Claude Desktop (latest), Desktop Commander v0.2.16
