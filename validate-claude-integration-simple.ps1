# Claude Desktop Integration Validation Script (ASCII-safe)
# Tests all integration components before restart

Write-Host "`nClaude Desktop Integration Validation" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$allPassed = $true

# Test 1: Config File
Write-Host "[1/6] Validating Config File..." -ForegroundColor Yellow
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        $requiredServers = @("sqlite-learning", "sqlite-tasks", "sqlite-nova")
        $missing = @()
        foreach ($server in $requiredServers) {
            if (-not $config.mcpServers.$server) { $missing += $server }
        }
        if ($missing.Count -eq 0) {
            Write-Host "  [OK] All SQLite MCP servers configured" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Missing: $($missing -join ', ')" -ForegroundColor Red
            $allPassed = $false
        }
        Write-Host "  Info: $($config.mcpServers.PSObject.Properties.Count) total MCP servers" -ForegroundColor Gray
    } catch {
        Write-Host "  [FAIL] Config has JSON errors: $_" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  [FAIL] Config not found" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: Startup Hook
Write-Host "`n[2/6] Validating Startup Hook..." -ForegroundColor Yellow
$hookPath = "$env:APPDATA\Claude\hooks\startup-context.ps1"
if (Test-Path $hookPath) {
    $size = (Get-Item $hookPath).Length
    if ($size -gt 1000) {
        Write-Host "  [OK] Startup hook exists ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Hook file seems too small" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] Startup hook not found" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Databases
Write-Host "`n[3/6] Validating Databases..." -ForegroundColor Yellow
$databases = @{
    "Learning" = "D:\databases\agent_learning.db"
    "Tasks" = "D:\task-registry\active_tasks.db"
    "NOVA" = "D:\databases\nova_activity.db"
}
$dbCount = 0
foreach ($db in $databases.GetEnumerator()) {
    if (Test-Path $db.Value) {
        $sizeKB = [math]::Round((Get-Item $db.Value).Length / 1KB, 2)
        Write-Host "  [OK] $($db.Key): $sizeKB KB" -ForegroundColor Green
        $dbCount++
    } else {
        Write-Host "  [FAIL] $($db.Key) not found" -ForegroundColor Red
        $allPassed = $false
    }
}

# Test 4: SQLite
Write-Host "`n[4/6] Validating SQLite..." -ForegroundColor Yellow
$sqlite = Get-Command sqlite3 -ErrorAction SilentlyContinue
if ($sqlite) {
    Write-Host "  [OK] SQLite3 found: $($sqlite.Source)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] SQLite3 not in PATH (startup hook won't work)" -ForegroundColor Yellow
}

# Test 5: Node.js
Write-Host "`n[5/6] Validating Node.js..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $nodeVer = node --version
    Write-Host "  [OK] Node.js: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Node.js not found - MCP servers won't work" -ForegroundColor Red
    $allPassed = $false
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($npm) {
    $npmVer = npm --version
    Write-Host "  [OK] npm: v$npmVer" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] npm not found" -ForegroundColor Red
    $allPassed = $false
}

# Test 6: Desktop Commander
Write-Host "`n[6/6] Validating Desktop Commander v2..." -ForegroundColor Yellow
$dcPath = "C:\dev\desktop-commander-v2\mcp-server\dist\index.js"
if (Test-Path $dcPath) {
    Write-Host "  [OK] Desktop Commander built" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Desktop Commander not built (optional)" -ForegroundColor Gray
}

# Summary
Write-Host "`n======================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "ALL CRITICAL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "  1. Restart Claude Desktop" -ForegroundColor Gray
    Write-Host "  2. Test query: 'Show me my active tasks'" -ForegroundColor Gray
    Write-Host "  3. Run startup hook:" -ForegroundColor Gray
    Write-Host "     powershell -File `"$hookPath`"" -ForegroundColor DarkGray
} else {
    Write-Host "SOME TESTS FAILED - Fix issues above" -ForegroundColor Yellow
}
Write-Host "======================================`n" -ForegroundColor Cyan
