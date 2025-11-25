# MCP Server Diagnostic Tool
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MCP SERVER DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check MCP Configuration
Write-Host "1. MCP CONFIGURATION" -ForegroundColor Yellow
Write-Host "----------------------------------------"
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
Write-Host "Config Location: $configPath"

if (Test-Path $configPath) {
    Write-Host "Status: [OK] Configuration file found" -ForegroundColor Green
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        Write-Host ""
        Write-Host "Configured MCP Servers:" -ForegroundColor White
        if ($config.mcpServers) {
            $config.mcpServers.PSObject.Properties | ForEach-Object {
                Write-Host "  [$($_.Name)]" -ForegroundColor Cyan
                Write-Host "    Command: $($_.Value.command)" -ForegroundColor Gray
                if ($_.Value.args) {
                    Write-Host "    Args: $($_.Value.args -join ' ')" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "  No MCP servers configured" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error parsing config: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Status: [ERROR] Configuration file not found" -ForegroundColor Red
}
Write-Host ""

# 2. Check MCP Logs
Write-Host "2. MCP SERVER LOGS" -ForegroundColor Yellow
Write-Host "----------------------------------------"
$cliLogDir = "$env:LOCALAPPDATA\claude-cli-nodejs\Cache\C--dev"
$desktopLogDir = "$env:APPDATA\Claude\logs"

Write-Host "Checking CLI logs: $cliLogDir"
if (Test-Path $cliLogDir) {
    $cliLogs = Get-ChildItem $cliLogDir -Filter "*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 10
    if ($cliLogs) {
        Write-Host "Found CLI log files:" -ForegroundColor Green
        $cliLogs | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  - $($_.Name) ($sizeMB MB, Modified: $($_.LastWriteTime))" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No CLI log files found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Checking Desktop logs: $desktopLogDir"
if (Test-Path $desktopLogDir) {
    $desktopLogs = Get-ChildItem $desktopLogDir -Filter "mcp*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($desktopLogs) {
        Write-Host "Found Desktop MCP log files:" -ForegroundColor Green
        $desktopLogs | ForEach-Object {
            $sizeKB = [math]::Round($_.Length / 1KB, 2)
            Write-Host "  - $($_.Name) ($sizeKB KB, Modified: $($_.LastWriteTime))" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No Desktop MCP log files found" -ForegroundColor Yellow
    }
}
Write-Host ""

# 3. Check Running Processes
Write-Host "3. RUNNING PROCESSES" -ForegroundColor Yellow
Write-Host "----------------------------------------"

$claudeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*Claude*" } -ErrorAction SilentlyContinue
if ($claudeProcesses) {
    Write-Host "Claude Processes: [FOUND]" -ForegroundColor Green
    $claudeProcesses | ForEach-Object {
        $memMB = [math]::Round($_.WorkingSet64 / 1MB, 2)
        Write-Host "  - $($_.ProcessName) (PID: $($_.Id), Memory: $memMB MB)" -ForegroundColor Gray
    }
} else {
    Write-Host "Claude Processes: [NOT FOUND]" -ForegroundColor Red
    Write-Host "  Note: Claude CLI or Claude Desktop may not be running" -ForegroundColor Yellow
}

Write-Host ""

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Node.js Processes: [FOUND] ($($nodeProcesses.Count) instances)" -ForegroundColor Green
    $nodeProcesses | Select-Object -First 5 | ForEach-Object {
        $memMB = [math]::Round($_.WorkingSet64 / 1MB, 2)
        Write-Host "  - PID: $($_.Id) (Memory: $memMB MB, Started: $($_.StartTime))" -ForegroundColor Gray
    }
    if ($nodeProcesses.Count -gt 5) {
        Write-Host "  ... and $($nodeProcesses.Count - 5) more" -ForegroundColor Gray
    }
} else {
    Write-Host "Node.js Processes: [NOT FOUND]" -ForegroundColor Yellow
    Write-Host "  Note: This is normal if MCP servers use Python or other runtimes" -ForegroundColor Gray
}
Write-Host ""

# 4. Check Latest CLI Log for Errors
Write-Host "4. RECENT MCP ERROR ANALYSIS" -ForegroundColor Yellow
Write-Host "----------------------------------------"
if (Test-Path $cliLogDir) {
    $latestLog = Get-ChildItem $cliLogDir -Filter "*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestLog) {
        Write-Host "Analyzing: $($latestLog.Name)" -ForegroundColor Cyan
        $content = Get-Content $latestLog.FullName -Tail 100 -ErrorAction SilentlyContinue
        $errors = $content | Select-String -Pattern "error|failed|exception" -CaseSensitive:$false
        if ($errors) {
            Write-Host "Found $($errors.Count) error-related lines in last 100 lines:" -ForegroundColor Red
            $errors | Select-Object -First 10 | ForEach-Object {
                Write-Host "  $($_.Line)" -ForegroundColor Red
            }
        } else {
            Write-Host "No obvious errors found in recent log entries" -ForegroundColor Green
        }
    }
}
Write-Host ""

# 5. Summary and Recommendations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common MCP Server Issues:" -ForegroundColor White
Write-Host ""
Write-Host "1. Server not starting:" -ForegroundColor Yellow
Write-Host "   - Check that the command path exists and is correct" -ForegroundColor Gray
Write-Host "   - Verify Node.js is installed: node --version" -ForegroundColor Gray
Write-Host "   - Try running the command manually to see errors" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Timeout errors:" -ForegroundColor Yellow
Write-Host "   - Check server logs for connection errors" -ForegroundColor Gray
Write-Host "   - Verify file permissions on server directory" -ForegroundColor Gray
Write-Host "   - Ensure firewall is not blocking connections" -ForegroundColor Gray
Write-Host ""
Write-Host "3. For Claude CLI specifically:" -ForegroundColor Yellow
Write-Host "   - Check config at: C:\dev\.mcp.json" -ForegroundColor Gray
Write-Host "   - Run: claude --debug to see inline logs" -ForegroundColor Gray
Write-Host "   - View logs in: $cliLogDir" -ForegroundColor Gray
Write-Host ""
