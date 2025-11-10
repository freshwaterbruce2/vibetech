# Claude Desktop Integration Validation Script
# Tests all integration components before restart

param(
    [switch]$Verbose
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Claude Desktop Integration Validation" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$allPassed = $true

# ============================================================================
# Test 1: Claude Desktop Config File
# ============================================================================

Write-Host "`n[1/6] Validating Claude Desktop Config..." -ForegroundColor Yellow

$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"

if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json

        # Check for SQLite MCP servers
        $requiredServers = @("sqlite-learning", "sqlite-tasks", "sqlite-nova")
        $missingServers = @()

        foreach ($server in $requiredServers) {
            if (-not $config.mcpServers.$server) {
                $missingServers += $server
            }
        }

        if ($missingServers.Count -eq 0) {
            Write-Host "   ✓ Config file valid - all SQLite MCP servers configured" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Missing MCP servers: $($missingServers -join ', ')" -ForegroundColor Red
            $allPassed = $false
        }

        # Display server count
        $serverCount = $config.mcpServers.PSObject.Properties.Count
        Write-Host "   ℹ Total MCP servers: $serverCount" -ForegroundColor Gray

    } catch {
        Write-Host "   ✗ Config file has JSON syntax errors" -ForegroundColor Red
        if ($Verbose) { Write-Host "     Error: $_" -ForegroundColor DarkRed }
        $allPassed = $false
    }
} else {
    Write-Host "   ✗ Config file not found: $configPath" -ForegroundColor Red
    $allPassed = $false
}

# ============================================================================
# Test 2: Startup Hook Script
# ============================================================================

Write-Host "`n[2/6] Validating Startup Hook..." -ForegroundColor Yellow

$hookPath = "$env:APPDATA\Claude\hooks\startup-context.ps1"

if (Test-Path $hookPath) {
    Write-Host "   ✓ Startup hook script exists" -ForegroundColor Green

    # Test if script is executable
    try {
        $scriptContent = Get-Content $hookPath -Raw
        if ($scriptContent.Length -gt 100) {
            Write-Host "   ✓ Script appears valid ($($scriptContent.Length) bytes)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Script seems too short, may be incomplete" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ✗ Cannot read startup hook script" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "   ✗ Startup hook not found: $hookPath" -ForegroundColor Red
    $allPassed = $false
}

# ============================================================================
# Test 3: Database Files
# ============================================================================

Write-Host "`n[3/6] Validating D Drive Databases..." -ForegroundColor Yellow

$databases = @{
    "Learning DB" = "D:\databases\agent_learning.db"
    "Task Registry" = "D:\task-registry\active_tasks.db"
    "NOVA Activity" = "D:\databases\nova_activity.db"
}

$dbCount = 0
foreach ($db in $databases.GetEnumerator()) {
    if (Test-Path $db.Value) {
        Write-Host "   ✓ $($db.Key): Found" -ForegroundColor Green
        $dbCount++

        # Check file size
        $size = (Get-Item $db.Value).Length
        $sizeKB = [math]::Round($size / 1KB, 2)
        Write-Host "     Size: $sizeKB KB" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ $($db.Key): Not found at $($db.Value)" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host "   ℹ Databases found: $dbCount/3" -ForegroundColor Gray

# ============================================================================
# Test 4: SQLite Availability
# ============================================================================

Write-Host "`n[4/6] Validating SQLite..." -ForegroundColor Yellow

$sqlite = Get-Command sqlite3 -ErrorAction SilentlyContinue

if ($sqlite) {
    Write-Host "   ✓ SQLite3 found in PATH" -ForegroundColor Green
    Write-Host "     Location: $($sqlite.Source)" -ForegroundColor Gray

    # Test SQLite functionality
    try {
        $testDb = "D:\databases\agent_learning.db"
        if (Test-Path $testDb) {
            $result = sqlite3 $testDb "SELECT COUNT(*) FROM sqlite_master;" 2>$null
            if ($result) {
                Write-Host "   ✓ SQLite query test passed" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ⚠ SQLite found but query test failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠ SQLite3 not found in PATH" -ForegroundColor Yellow
    Write-Host "     Startup hook will not display context" -ForegroundColor Gray
}

# ============================================================================
# Test 5: Node.js and NPM
# ============================================================================

Write-Host "`n[5/6] Validating Node.js Environment..." -ForegroundColor Yellow

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if ($node) {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js not found - MCP servers will not work" -ForegroundColor Red
    $allPassed = $false
}

if ($npm) {
    $npmVersion = npm --version
    Write-Host "   ✓ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ npm not found" -ForegroundColor Red
    $allPassed = $false
}

# Check if @modelcontextprotocol/server-sqlite is available
Write-Host "   ℹ Testing SQLite MCP server availability..." -ForegroundColor Gray
try {
    $mcpTest = npx -y @modelcontextprotocol/server-sqlite --help 2>&1
    if ($LASTEXITCODE -eq 0 -or $mcpTest -match "Usage") {
        Write-Host "   ✓ SQLite MCP server package accessible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ SQLite MCP server may need download on first use" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ Could not verify SQLite MCP server" -ForegroundColor Yellow
}

# ============================================================================
# Test 6: Desktop Commander v2
# ============================================================================

Write-Host "`n[6/6] Validating Desktop Commander v2..." -ForegroundColor Yellow

$dcPath = "C:\dev\desktop-commander-v2\mcp-server\dist\index.js"

if (Test-Path $dcPath) {
    Write-Host "   ✓ Desktop Commander v2 MCP server built" -ForegroundColor Green
    Write-Host "     Location: $dcPath" -ForegroundColor Gray
} else {
    Write-Host "   ⚠ Desktop Commander v2 not built" -ForegroundColor Yellow
    Write-Host "     This is optional - SQLite MCP servers will work without it" -ForegroundColor Gray
}

# ============================================================================
# Test 7: IPC Bridge (Bonus Check)
# ============================================================================

Write-Host "`n[Bonus] Checking IPC Bridge..." -ForegroundColor Yellow

$ipcRunning = Test-NetConnection -ComputerName localhost -Port 5004 -InformationLevel Quiet -WarningAction SilentlyContinue 2>$null

if ($ipcRunning) {
    Write-Host "   ✓ IPC Bridge is running on port 5004" -ForegroundColor Green
} else {
    Write-Host "   ℹ IPC Bridge not running (optional for Claude Desktop)" -ForegroundColor Gray
}

# ============================================================================
# Summary
# ============================================================================

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  ✅ ALL CRITICAL TESTS PASSED" -ForegroundColor Green
    Write-Host "`n  Claude Desktop is ready for integration!" -ForegroundColor White
    Write-Host "  Next steps:" -ForegroundColor Gray
    Write-Host "    1. Restart Claude Desktop" -ForegroundColor Gray
    Write-Host "    2. Test with: 'Show me my active tasks'" -ForegroundColor Gray
    Write-Host "    3. Run startup hook manually for preview:" -ForegroundColor Gray
    Write-Host "       powershell -File `"$env:APPDATA\Claude\hooks\startup-context.ps1`"" -ForegroundColor DarkGray
} else {
    Write-Host "  ⚠️  SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host "`n  Please fix the issues above before restarting Claude Desktop" -ForegroundColor White
    Write-Host "  Run with -Verbose flag for detailed error information" -ForegroundColor Gray
}

Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

exit $(if ($allPassed) { 0 } else { 1 })
