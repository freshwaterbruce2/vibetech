# MCP Diagnostic Check Script

Write-Output "════════════════════════════════════════"
Write-Output "  MCP CONFIGURATION"
Write-Output "════════════════════════════════════════"

$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
Write-Output "Location: $configPath"
Write-Output ""

if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    Write-Output "Status: ✓ Configuration file found"
    Write-Output ""
    Write-Output "Configured MCP Servers:"
    if ($config.mcpServers) {
        $config.mcpServers.PSObject.Properties | ForEach-Object {
            Write-Output ""
            Write-Output "  [$($_.Name)]"
            Write-Output "    Command: $($_.Value.command)"
            if ($_.Value.args) {
                Write-Output "    Args: $($_.Value.args -join ' ')"
            }
        }
    } else {
        Write-Output "  No MCP servers configured"
    }
} else {
    Write-Output "Status: ✗ Configuration file not found"
    Write-Output "Expected at: $configPath"
}

Write-Output ""
Write-Output "════════════════════════════════════════"
Write-Output "  MCP SERVER LOGS (Last 50 lines)"
Write-Output "════════════════════════════════════════"

$logPath = "$env:APPDATA\Claude\logs\mcp-server-desktop-commander-enhanced.log"
Write-Output "Location: $logPath"
Write-Output ""

if (Test-Path $logPath) {
    Write-Output "Status: ✓ Log file found"
    Write-Output ""
    Write-Output "Recent Logs:"
    Write-Output "────────────────────────────────────────"
    Get-Content $logPath -Tail 50 -ErrorAction SilentlyContinue
} else {
    Write-Output "Status: ✗ Log file not found"
    Write-Output ""
    Write-Output "Checking for other MCP log files..."
    $logDir = "$env:APPDATA\Claude\logs"
    if (Test-Path $logDir) {
        $mcpLogs = Get-ChildItem $logDir -Filter "mcp*.log" -ErrorAction SilentlyContinue
        if ($mcpLogs) {
            Write-Output "Found alternative MCP logs:"
            $mcpLogs | ForEach-Object {
                Write-Output "  - $($_.Name) (Modified: $($_.LastWriteTime))"
            }
        } else {
            Write-Output "  No MCP log files found in $logDir"
        }
    } else {
        Write-Output "  Log directory does not exist"
    }
}

Write-Output ""
Write-Output "════════════════════════════════════════"
Write-Output "  RUNNING CLAUDE PROCESSES"
Write-Output "════════════════════════════════════════"

$claudeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*Claude*" } -ErrorAction SilentlyContinue
if ($claudeProcesses) {
    Write-Output "Status: ✓ Found running Claude processes"
    Write-Output ""
    $claudeProcesses | ForEach-Object {
        Write-Output "  Process: $($_.ProcessName)"
        Write-Output "    PID: $($_.Id)"
        Write-Output "    Start Time: $($_.StartTime)"
        Write-Output "    Memory (MB): $([math]::Round($_.WorkingSet64 / 1MB, 2))"
        Write-Output ""
    }
} else {
    Write-Output "Status: ⚠ No running Claude processes found"
    Write-Output ""
    Write-Output "If Claude Desktop should be running:"
    Write-Output "  1. Check if Claude Desktop is actually open"
    Write-Output "  2. Look in Task Manager for 'Claude' process"
    Write-Output "  3. Try restarting Claude Desktop completely"
}

Write-Output ""
Write-Output "════════════════════════════════════════"
Write-Output "  MCP SERVER PROCESSES (Node.js)"
Write-Output "════════════════════════════════════════"

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Output "Status: ✓ Found running node processes"
    Write-Output ""
    Write-Output "Note: These may include MCP servers running via Node.js"
    Write-Output ""
    $nodeProcesses | Select-Object -First 5 | ForEach-Object {
        Write-Output "  PID: $($_.Id)"
        Write-Output "    Start Time: $($_.StartTime)"
        Write-Output "    Memory (MB): $([math]::Round($_.WorkingSet64 / 1MB, 2))"
        Write-Output ""
    }
    if ($nodeProcesses.Count -gt 5) {
        Write-Output "  ... and $($nodeProcesses.Count - 5) more node processes"
    }
} else {
    Write-Output "Status: ⚠ No node.js processes found"
    Write-Output ""
    Write-Output "This is normal if:"
    Write-Output "  - MCP servers are not currently active"
    Write-Output "  - MCP servers use different runtime (Python, etc.)"
}

Write-Output ""
Write-Output "════════════════════════════════════════"
Write-Output "  DIAGNOSTIC SUMMARY & NEXT STEPS"
Write-Output "════════════════════════════════════════"
Write-Output ""
Write-Output "Common MCP Issues & Solutions:"
Write-Output ""
Write-Output "1. MCP tools not appearing in Claude Code:"
Write-Output "   → Restart Claude Desktop completely (quit from system tray)"
Write-Output "   → Verify config file syntax is valid JSON"
Write-Output "   → Check that command paths use full absolute paths"
Write-Output ""
Write-Output "2. MCP server timeout errors:"
Write-Output "   → Check logs above for connection errors"
Write-Output "   → Verify the MCP server path exists"
Write-Output "   → Try running the command manually to test"
Write-Output ""
Write-Output "3. Version mismatch errors:"
Write-Output "   → Rebuild MCP server: cd to server dir, run 'npm run build'"
Write-Output "   → Run 'npm run sync-version' if available"
Write-Output ""
Write-Output "4. To manually test MCP server:"
Write-Output "   → cd C:\dev\DesktopCommanderMCP"
Write-Output "   → node dist/desktop-commander-with-path.js"
Write-Output ""
Write-Output "5. Full restart protocol:"
Write-Output "   → Close Claude Desktop (right-click system tray → Quit)"
Write-Output "   → Wait 10 seconds"
Write-Output "   → Verify no Claude processes: Get-Process | Where {`$_.Name -like '*Claude*'}"
Write-Output "   → Relaunch Claude Desktop"
Write-Output ""
Write-Output "════════════════════════════════════════"
