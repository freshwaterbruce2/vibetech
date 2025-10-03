# Desktop Commander Enhanced - Restart Guide

## Issue Fixed
Desktop Commander was running an outdated build (v0.2.14) while the source code was at v0.2.16.

## Fix Applied
✅ **Rebuilt Desktop Commander** - TypeScript compilation completed successfully
- Build time: 3.66s
- Files compiled: 262 TypeScript files
- Version now: 0.2.16 (synced with package.json)

## REQUIRED: Restart Claude Desktop

### Why Restart is Critical
MCP servers only reload on Claude Desktop restart. Without a full restart, the old version (0.2.14) will continue running despite the rebuild.

### Windows Restart Procedure

#### Step 1: Complete Quit
**IMPORTANT**: You must completely quit Claude Desktop, not just close the window.

**Method 1 - System Tray (Recommended)**:
1. Look for Claude Desktop icon in system tray (bottom-right corner near clock)
2. Right-click the Claude icon
3. Select **"Quit"** from the menu
4. Wait 10 seconds for all processes to terminate

**Method 2 - Alt+F4**:
1. Make sure Claude Desktop window is focused
2. Press `Alt + F4`
3. Confirm quit if prompted
4. Wait 10 seconds

**Method 3 - Task Manager (If stuck)**:
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find "Claude Desktop" in the processes list
3. Right-click → **End Task**
4. Wait 10 seconds

#### Step 2: Verify Claude is Closed
Open PowerShell and run:
```powershell
Get-Process | Where-Object {$_.Name -like "*Claude*"}
```

**Expected output**: No results (empty)
**If processes are still running**: Wait 5 more seconds and check again

#### Step 3: Restart Claude Desktop
1. Open Start Menu
2. Search for "Claude"
3. Click "Claude Desktop" to launch
4. Wait for Claude to fully load (30-60 seconds)

### Verification

After restart, Desktop Commander Enhanced should:
- ✅ Report version **0.2.16** (not 0.2.14)
- ✅ Load all tools successfully
- ✅ Connect without errors

### Check Logs (Optional)
To verify the new version is running:

```powershell
# View latest MCP server logs
Get-Content "$env:APPDATA\Claude\logs\mcp-server-desktop-commander-enhanced.log" -Tail 50 | Select-String "version"
```

Look for: `"serverInfo":{"name":"desktop-commander","version":"0.2.16"}`

## Troubleshooting

### If Desktop Commander doesn't load:
1. Check logs: `$env:APPDATA\Claude\logs\mcp-server-desktop-commander-enhanced.log`
2. Verify configuration: `$env:APPDATA\Claude\claude_desktop_config.json`
3. Ensure Node.js is accessible: `node --version`

### If version still shows 0.2.14:
1. Verify rebuild succeeded: `ls C:\dev\DesktopCommanderMCP\dist\index.js`
2. Check file modification time (should be recent)
3. Rebuild again: `cd C:\dev\DesktopCommanderMCP && npm run build`
4. Restart Claude Desktop again

### Configuration (No Changes Needed)
Your current configuration is optimal:
```json
{
  "mcpServers": {
    "desktop-commander-enhanced": {
      "command": "node",
      "args": [
        "C:\\dev\\DesktopCommanderMCP\\dist\\desktop-commander-with-path.js"
      ]
    }
  }
}
```

## What Was NOT Changed
- ❌ Configuration file (already optimal)
- ❌ MCP SDK version (1.9.0 is current with timeout fix)
- ❌ PATH wrapper (correctly handles cargo/npm access)

## Limitations to Be Aware Of
- **60-Second Timeout**: Claude Desktop has a hard 60-second timeout for MCP operations (cannot be configured)
- **No Custom Timeouts**: Unlike Claude Code, Claude Desktop doesn't support `MCP_TIMEOUT` environment variables
- **Large Operations**: For operations >60 seconds, Desktop Commander will return early and continue in background

## Success Criteria
After restart, you should be able to:
1. ✅ Use Desktop Commander tools without errors
2. ✅ See version 0.2.16 in logs
3. ✅ Execute file operations, searches, and terminal commands
4. ✅ No connection failures or timeouts (for operations <60s)

---

**Next Steps**: Please restart Claude Desktop now using the procedure above.
