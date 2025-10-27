---
description: Run comprehensive system health diagnostics across the monorepo
---

# System Doctor - Comprehensive Health Check

Run comprehensive diagnostics across the entire monorepo and system.

## Diagnostic Checks

**1. Git Repository Health**
```powershell
Write-Host "=== GIT REPOSITORY HEALTH ===" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "Modified files:" -ForegroundColor Yellow
git status --short

# Check for uncommitted changes
$uncommittedCount = (git status --short | Measure-Object).Count
if ($uncommittedCount -gt 0) {
    Write-Host "⚠️  $uncommittedCount uncommitted files" -ForegroundColor Yellow
} else {
    Write-Host "✅ Working directory clean" -ForegroundColor Green
}

# Check current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Check for divergence from remote
$gitStatus = git status -sb
Write-Host $gitStatus -ForegroundColor Gray
Write-Host ""
```

**2. Database Connections (D:\databases\)**
```powershell
Write-Host "=== DATABASE HEALTH ===" -ForegroundColor Cyan
Write-Host ""

$databases = @(
    @{ Path = "D:\databases\crypto-enhanced\trading.db"; Name = "Crypto Trading DB" },
    @{ Path = "D:\databases\database.db"; Name = "Unified Database" }
)

foreach ($db in $databases) {
    if (Test-Path $db.Path) {
        $dbFile = Get-Item $db.Path
        Write-Host "✅ $($db.Name)" -ForegroundColor Green
        Write-Host "   Path: $($db.Path)" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($dbFile.Length / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "   Modified: $($dbFile.LastWriteTime)" -ForegroundColor Gray
    } else {
        Write-Host "❌ $($db.Name) - NOT FOUND" -ForegroundColor Red
        Write-Host "   Expected: $($db.Path)" -ForegroundColor Gray
    }
    Write-Host ""
}
```

**3. Active Processes (Dev Servers, Trading System)**
```powershell
Write-Host "=== ACTIVE PROCESSES ===" -ForegroundColor Cyan
Write-Host ""

# Check for dev processes
$devProcesses = Get-Process | Where-Object {
    $_.ProcessName -match "node|electron|python|pnpm"
} | Select-Object Id, ProcessName, StartTime, @{Name="CPU(s)";Expression={$_.CPU}}, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64 / 1MB, 2)}}

if ($devProcesses) {
    Write-Host "Active development processes:" -ForegroundColor Yellow
    $devProcesses | Format-Table -AutoSize
} else {
    Write-Host "No active development processes found" -ForegroundColor Gray
}
Write-Host ""
```

**4. Disk Space (C:\ and D:\)**
```powershell
Write-Host "=== DISK SPACE ===" -ForegroundColor Cyan
Write-Host ""

$drives = @("C:", "D:")
foreach ($drive in $drives) {
    if (Test-Path $drive) {
        $driveInfo = Get-PSDrive -Name $drive.TrimEnd(':')
        $usedGB = [math]::Round($driveInfo.Used / 1GB, 2)
        $freeGB = [math]::Round($driveInfo.Free / 1GB, 2)
        $totalGB = [math]::Round(($driveInfo.Used + $driveInfo.Free) / 1GB, 2)
        $percentUsed = [math]::Round(($usedGB / $totalGB) * 100, 1)

        Write-Host "$drive" -ForegroundColor Yellow
        Write-Host "   Total: $totalGB GB" -ForegroundColor Gray
        Write-Host "   Used:  $usedGB GB ($percentUsed%)" -ForegroundColor Gray
        Write-Host "   Free:  $freeGB GB" -ForegroundColor $(if ($freeGB -lt 50) { "Red" } elseif ($freeGB -lt 100) { "Yellow" } else { "Green" })
        Write-Host ""
    }
}
```

**5. Node Modules & Dependencies**
```powershell
Write-Host "=== NODE MODULES HEALTH ===" -ForegroundColor Cyan
Write-Host ""

# Check root node_modules
if (Test-Path "C:\dev\node_modules") {
    $nodeModulesSize = (Get-ChildItem "C:\dev\node_modules" -Recurse -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum / 1GB
    Write-Host "✅ Root node_modules exists" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round($nodeModulesSize, 2)) GB" -ForegroundColor Gray
} else {
    Write-Host "❌ Root node_modules missing - run 'pnpm install'" -ForegroundColor Red
}

# Check pnpm version
$pnpmVersion = pnpm --version 2>$null
if ($pnpmVersion) {
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ pnpm not found" -ForegroundColor Red
}

# Check Node version
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node not found" -ForegroundColor Red
}

Write-Host ""
```

**6. MCP Server Health**
```powershell
Write-Host "=== MCP SERVERS ===" -ForegroundColor Cyan
Write-Host ""

$mcpConfig = "C:\dev\.mcp.json"
if (Test-Path $mcpConfig) {
    Write-Host "✅ MCP config found: .mcp.json" -ForegroundColor Green

    # Try to parse MCP config
    try {
        $mcpData = Get-Content $mcpConfig -Raw | ConvertFrom-Json
        $serverCount = ($mcpData.mcpServers | Get-Member -MemberType NoteProperty).Count
        Write-Host "   Configured servers: $serverCount" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Unable to parse MCP config" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No MCP config found" -ForegroundColor Yellow
}

Write-Host ""
```

**7. Crypto Trading System Status**
```powershell
Write-Host "=== CRYPTO TRADING SYSTEM ===" -ForegroundColor Cyan
Write-Host ""

# Check if trading database exists
$tradingDb = "D:\databases\crypto-enhanced\trading.db"
if (Test-Path $tradingDb) {
    Write-Host "✅ Trading database exists" -ForegroundColor Green

    # Check for Python trading processes
    $tradingProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -like "*crypto-enhanced*" }

    if ($tradingProcesses) {
        Write-Host "✅ Trading system is running" -ForegroundColor Green
        $tradingProcesses | Format-Table Id, ProcessName, StartTime -AutoSize
    } else {
        Write-Host "⚠️  No active trading processes found" -ForegroundColor Yellow
    }

    # Check recent logs
    $logPath = "C:\dev\projects\crypto-enhanced\logs\trading.log"
    if (Test-Path $logPath) {
        Write-Host "📄 Recent log entries:" -ForegroundColor Cyan
        Get-Content $logPath -Tail 3 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    }
} else {
    Write-Host "❌ Trading database not found" -ForegroundColor Red
}

Write-Host ""
```

**8. Recent Test Results**
```powershell
Write-Host "=== RECENT TEST RESULTS ===" -ForegroundColor Cyan
Write-Host ""

$testPaths = @(
    "C:\dev\projects\active\desktop-apps\deepcode-editor\test_output.txt",
    "C:\dev\projects\active\desktop-apps\deepcode-editor\PROJECT_STATUS.md",
    "C:\dev\test-results"
)

$foundTests = $false
foreach ($testPath in $testPaths) {
    if (Test-Path $testPath) {
        Write-Host "📋 Found: $(Split-Path $testPath -Leaf)" -ForegroundColor Cyan
        if ((Get-Item $testPath).PSIsContainer) {
            $testFiles = Get-ChildItem $testPath -File | Select-Object -First 3
            foreach ($file in $testFiles) {
                Write-Host "   - $($file.Name)" -ForegroundColor Gray
            }
        } else {
            Get-Content $testPath -Tail 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
        $foundTests = $true
        Write-Host ""
        break
    }
}

if (-not $foundTests) {
    Write-Host "⚠️  No recent test results found" -ForegroundColor Yellow
    Write-Host "   Consider running tests: pnpm run test" -ForegroundColor Gray
}

Write-Host ""
```

**9. Summary & Recommendations**
```powershell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Collect issues
$issues = @()
$warnings = @()

# Check for critical issues
if (-not (Test-Path "C:\dev\node_modules")) { $issues += "Missing node_modules - run 'pnpm install'" }
if ($uncommittedCount -gt 20) { $warnings += "$uncommittedCount uncommitted files (consider committing)" }
if (-not (Test-Path $tradingDb)) { $issues += "Trading database missing at $tradingDb" }

# Display results
if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All systems healthy" -ForegroundColor Green
    Write-Host "   No critical issues or warnings detected" -ForegroundColor Gray
} else {
    if ($issues.Count -gt 0) {
        Write-Host "❌ CRITICAL ISSUES ($($issues.Count)):" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   • $issue" -ForegroundColor Red
        }
        Write-Host ""
    }

    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   • $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
```

## Next Steps

After running diagnostics, Claude Code will:
1. Identify any critical issues requiring immediate attention
2. Suggest commands to fix common problems
3. Provide context for starting development work

## Quick Fixes

Common issues and their solutions:
- **Missing node_modules**: `pnpm install`
- **Uncommitted changes**: `git status` → `git add .` → `git commit`
- **No test results**: `pnpm run test` or `pnpm nx test <project>`
- **Low disk space**: Run `/dev:cleanup deep`
- **Database missing**: Check D:\databases\ path configuration
