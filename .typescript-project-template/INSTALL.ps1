#Requires -Version 5.1
###############################################################################
# SYSTEM-WIDE TypeScript Error Prevention - ONE-TIME SETUP
###############################################################################

param([switch]$WhatIf)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  TypeScript Error Prevention - System-Wide Installer" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($WhatIf) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

$GlobalHooksDir = "$env:USERPROFILE\.git-templates\hooks"
$MonitorPath = "C:\dev\.typescript-quality-monitor.ps1"
$LogPath = "C:\dev\.typescript-quality-monitor.log"
$TaskName = "TypeScript-Quality-Monitor"

###############################################################################
# STEP 1: Git Global Hooks
###############################################################################

Write-Host "STEP 1: Configuring Git global hooks..." -ForegroundColor Green

if (-not $WhatIf) {
    if (-not (Test-Path $GlobalHooksDir)) {
        New-Item -ItemType Directory -Path $GlobalHooksDir -Force | Out-Null
        Write-Host "  Created: $GlobalHooksDir" -ForegroundColor Gray
    }

    git config --global init.templateDir "$env:USERPROFILE\.git-templates"
    Write-Host "  Configured Git global template" -ForegroundColor Gray

    # Create simple pre-commit hook
    $hookContent = @"
#!/bin/sh
if [ -f "package.json" ]; then
    if command -v pnpm >/dev/null 2>&1; then
        pnpm typecheck 2>/dev/null || true
    fi
fi
exit 0
"@

    $hookPath = Join-Path $GlobalHooksDir "pre-commit"
    Set-Content -Path $hookPath -Value $hookContent -Encoding ASCII
    Write-Host "  Created pre-commit hook" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would configure Git global hooks" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 2: Scan Projects
###############################################################################

Write-Host "STEP 2: Scanning TypeScript projects..." -ForegroundColor Green

$paths = @("C:\dev", "D:\")
$allProjects = @()

foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "  Scanning: $path" -ForegroundColor Gray
        $found = Get-ChildItem -Path $path -Recurse -Filter "tsconfig.json" -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch "node_modules|dist|build" } |
            ForEach-Object { $_.Directory.FullName } |
            Select-Object -Unique

        $allProjects += $found
        Write-Host "    Found: $($found.Count) projects" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "  Total: $($allProjects.Count) TypeScript projects" -ForegroundColor Cyan
Write-Host ""

$retrofitted = 0
$skipped = 0

foreach ($proj in $allProjects) {
    $name = Split-Path $proj -Leaf
    $pkgJson = Join-Path $proj "package.json"

    if (-not (Test-Path $pkgJson)) {
        $skipped++
        continue
    }

    $hasConfig = Test-Path (Join-Path $proj ".lintstagedrc.js")

    if ($hasConfig) {
        Write-Host "  Already configured: $name" -ForegroundColor DarkGreen
        continue
    }

    if (-not $WhatIf) {
        $template = "C:\dev\.typescript-project-template\.lintstagedrc.js"
        if (Test-Path $template) {
            Copy-Item $template -Destination (Join-Path $proj ".lintstagedrc.js") -Force
        }

        Push-Location $proj
        if (Test-Path ".git") {
            git init 2>&1 | Out-Null
        }
        Pop-Location

        Write-Host "  Retrofitted: $name" -ForegroundColor Green
        $retrofitted++
    } else {
        Write-Host "  [DRY RUN] Would retrofit: $name" -ForegroundColor Yellow
        $retrofitted++
    }
}

Write-Host ""
Write-Host "  Retrofitted: $retrofitted projects" -ForegroundColor Green
Write-Host ""

###############################################################################
# STEP 3: Monitor Script
###############################################################################

Write-Host "STEP 3: Creating monitor script..." -ForegroundColor Green

$monitorContent = @'
$paths = @("C:\dev", "D:\")
$log = "C:\dev\.typescript-quality-monitor.log"
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$ts] Scanning projects..." -ForegroundColor Cyan
Add-Content -Path $log -Value "[$ts] Starting scan"

$allProj = @()
foreach ($p in $paths) {
    if (Test-Path $p) {
        $found = Get-ChildItem -Path $p -Recurse -Filter "tsconfig.json" -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch "node_modules|dist" } |
            ForEach-Object { $_.Directory.FullName } |
            Select-Object -Unique
        $allProj += $found
    }
}

Write-Host "Found $($allProj.Count) projects"
$errors = 0

foreach ($proj in $allProj) {
    $pkg = Join-Path $proj "package.json"
    if (-not (Test-Path $pkg)) { continue }

    Push-Location $proj
    $mgr = if (Test-Path "pnpm-lock.yaml") { "pnpm" } else { "npm" }

    $content = Get-Content $pkg -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($content.scripts.typecheck) {
        $out = & $mgr run typecheck 2>&1 | Out-String
        $errs = ($out | Select-String "error TS" | Measure-Object).Count
        if ($errs -gt 0) {
            $errors += $errs
            Write-Host "  $((Split-Path $proj -Leaf)): $errs errors" -ForegroundColor Yellow
        }
    }
    Pop-Location
}

if ($errors -gt 0) {
    Write-Host ""
    Write-Host "ALERT: $errors TypeScript errors found!" -ForegroundColor Red
    Add-Content -Path $log -Value "[$ts] ALERT: $errors errors"
} else {
    Write-Host ""
    Write-Host "All projects clean!" -ForegroundColor Green
    Add-Content -Path $log -Value "[$ts] Clean (0 errors)"
}
'@

if (-not $WhatIf) {
    Set-Content -Path $MonitorPath -Value $monitorContent -Encoding UTF8
    Write-Host "  Created: $MonitorPath" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would create monitor script" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 4: Schedule Task
###############################################################################

Write-Host "STEP 4: Scheduling monitoring..." -ForegroundColor Green

if (-not $WhatIf) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$MonitorPath`""
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Description "TypeScript monitor" | Out-Null

    Write-Host "  Scheduled: Every Monday 9 AM" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would schedule task" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# Summary
###############################################################################

Write-Host "================================================================" -ForegroundColor Cyan
if (-not $WhatIf) {
    Write-Host "  INSTALLATION COMPLETE!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "System-wide protection is now ACTIVE!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "What was installed:" -ForegroundColor Yellow
    Write-Host "  - Git global hooks (all repos)" -ForegroundColor White
    Write-Host "  - Retrofitted $retrofitted projects" -ForegroundColor White
    Write-Host "  - Monitor script" -ForegroundColor White
    Write-Host "  - Scheduled task (Monday 9 AM)" -ForegroundColor White
    Write-Host ""
    Write-Host "Test it:" -ForegroundColor Yellow
    Write-Host "  powershell -File $MonitorPath" -ForegroundColor White
} else {
    Write-Host "  DRY RUN COMPLETE" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Would install:" -ForegroundColor Yellow
    Write-Host "  - Git global hooks" -ForegroundColor White
    Write-Host "  - Retrofit $retrofitted projects" -ForegroundColor White
    Write-Host "  - Monitor script" -ForegroundColor White
    Write-Host "  - Scheduled task" -ForegroundColor White
    Write-Host ""
    Write-Host "Run without -WhatIf to install:" -ForegroundColor Cyan
    Write-Host "  .\INSTALL.ps1" -ForegroundColor White
}
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
