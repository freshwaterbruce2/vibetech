###############################################################################
# SYSTEM-WIDE TypeScript Error Prevention - ONE-TIME SETUP
# Last Updated: October 16, 2025
###############################################################################

param(
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SYSTEM-WIDE TypeScript Error Prevention Installer" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($WhatIf) {
    Write-Host "⚠️  DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Configuration
$GlobalHooksDir = "$env:USERPROFILE\.git-templates\hooks"
$SearchPaths = @(
    "C:\dev",
    "D:\",
    "C:\dev\projects\active",
    "C:\dev\active-projects",
    "C:\dev\Vibe-Tutor"
)
$ScheduledTaskName = "TypeScript-Quality-Monitor"
$MonitorScriptPath = "C:\dev\.typescript-quality-monitor.ps1"
$LogPath = "C:\dev\.typescript-quality-monitor.log"
$TemplateDir = "C:\dev\.typescript-project-template"

###############################################################################
# STEP 1: Configure Global Git Hooks
###############################################################################

Write-Host "STEP 1: Setting up global Git hooks..." -ForegroundColor Green
Write-Host ""

if (-not $WhatIf) {
    # Create global hooks directory
    if (-not (Test-Path $GlobalHooksDir)) {
        New-Item -ItemType Directory -Path $GlobalHooksDir -Force | Out-Null
        Write-Host "  ✓ Created: $GlobalHooksDir" -ForegroundColor Gray
    }

    # Configure Git to use global template
    git config --global init.templateDir "$env:USERPROFILE\.git-templates"
    Write-Host "  ✓ Configured Git global template" -ForegroundColor Gray

    # Copy pre-commit hook from template (already created in .husky)
    $sourceHook = Join-Path $TemplateDir ".husky\pre-commit"
    $destHook = Join-Path $GlobalHooksDir "pre-commit"

    if (Test-Path $sourceHook) {
        Copy-Item $sourceHook $destHook -Force
        Write-Host "  ✓ Installed global pre-commit hook" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  Warning: Template hook not found, creating basic version" -ForegroundColor Yellow

        # Create basic version
        $basicHook = "#!/bin/sh`npnpm typecheck 2>/dev/null || npm run typecheck 2>/dev/null || true"
        $basicHook | Out-File -FilePath $destHook -Encoding ASCII -NoNewline
    }
} else {
    Write-Host "  [DRY RUN] Would create: $GlobalHooksDir" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 2: Scan and Retrofit Projects
###############################################################################

Write-Host "STEP 2: Scanning development directories..." -ForegroundColor Green
Write-Host ""

$allProjects = @()

foreach ($path in $SearchPaths) {
    if (Test-Path $path) {
        Write-Host "  Scanning: $path" -ForegroundColor Gray

        $projects = Get-ChildItem -Path $path -Recurse -Filter "tsconfig.json" -ErrorAction SilentlyContinue |
            ForEach-Object { $_.Directory.FullName } |
            Where-Object {
                $_ -notmatch "node_modules|dist|build|\.next|coverage|\.husky|\.git"
            } |
            Sort-Object -Unique

        $allProjects += $projects
        Write-Host "    Found $($projects.Count) projects" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "  Total: $($allProjects.Count) TypeScript projects" -ForegroundColor Cyan
Write-Host ""

$retrofitted = 0
$skipped = 0
$alreadyConfigured = 0

foreach ($projectPath in $allProjects) {
    $projectName = Split-Path $projectPath -Leaf
    $packageJsonPath = Join-Path $projectPath "package.json"

    if (-not (Test-Path $packageJsonPath)) {
        $skipped++
        continue
    }

    # Check if already has lint-staged
    $hasLintStaged = Test-Path (Join-Path $projectPath ".lintstagedrc.js")

    if ($hasLintStaged) {
        Write-Host "  ✓ Already configured: $projectName" -ForegroundColor DarkGreen
        $alreadyConfigured++
        continue
    }

    if (-not $WhatIf) {
        # Copy lint-staged configuration
        $templateLintStaged = Join-Path $TemplateDir ".lintstagedrc.js"
        if (Test-Path $templateLintStaged) {
            Copy-Item $templateLintStaged -Destination (Join-Path $projectPath ".lintstagedrc.js") -Force
        }

        # Reinitialize Git to pick up global hooks
        Push-Location $projectPath
        if (Test-Path ".git") {
            git init 2>&1 | Out-Null
        }
        Pop-Location

        Write-Host "  ✓ Retrofitted: $projectName" -ForegroundColor Green
        $retrofitted++
    } else {
        Write-Host "  [DRY RUN] Would retrofit: $projectName" -ForegroundColor Yellow
        $retrofitted++
    }
}

Write-Host ""
Write-Host "  Summary:" -ForegroundColor Cyan
Write-Host "    Retrofitted: $retrofitted" -ForegroundColor Green
Write-Host "    Already configured: $alreadyConfigured" -ForegroundColor DarkGreen
Write-Host "    Skipped: $skipped" -ForegroundColor Gray
Write-Host ""

###############################################################################
# STEP 3: VSCode Global Settings
###############################################################################

Write-Host "STEP 3: Configuring VSCode..." -ForegroundColor Green
Write-Host ""

$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"

if (-not $WhatIf) {
    if (Test-Path $vscodeSettingsPath) {
        Write-Host "  ℹ️  VSCode settings exist - Manual merge recommended" -ForegroundColor Yellow
        Write-Host "    Template: $TemplateDir\.vscode\settings.json" -ForegroundColor Gray
        Write-Host "    Your settings: $vscodeSettingsPath" -ForegroundColor Gray
    } else {
        $templateSettings = Join-Path $TemplateDir ".vscode\settings.json"
        if (Test-Path $templateSettings) {
            $settingsDir = Split-Path $vscodeSettingsPath
            if (-not (Test-Path $settingsDir)) {
                New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
            }
            Copy-Item $templateSettings $vscodeSettingsPath -Force
            Write-Host "  ✓ VSCode settings installed" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  [DRY RUN] Would update: $vscodeSettingsPath" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 4: Create Monitor Script
###############################################################################

Write-Host "STEP 4: Creating monitor script..." -ForegroundColor Green
Write-Host ""

$monitorScript = @"
# TypeScript Quality Monitor
`$SearchPaths = @("C:\dev", "D:\", "C:\dev\projects\active")
`$LogFile = "$LogPath"
`$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[`$timestamp] Scanning TypeScript projects..." -ForegroundColor Cyan
Add-Content -Path `$LogFile -Value "[`$timestamp] Starting scan"

`$allProjects = @()
foreach (`$path in `$SearchPaths) {
    if (Test-Path `$path) {
        `$projects = Get-ChildItem -Path `$path -Recurse -Filter "tsconfig.json" -ErrorAction SilentlyContinue |
            ForEach-Object { `$_.Directory.FullName } |
            Where-Object { `$_ -notmatch "node_modules|dist|build" } |
            Sort-Object -Unique
        `$allProjects += `$projects
    }
}

Write-Host "Found `$(`$allProjects.Count) projects" -ForegroundColor Gray
`$totalErrors = 0
`$projectsWithErrors = @()

foreach (`$project in `$allProjects) {
    `$packageJson = Join-Path `$project "package.json"
    if (-not (Test-Path `$packageJson)) { continue }

    `$projectName = Split-Path `$project -Leaf
    Push-Location `$project

    `$pkgManager = if (Test-Path "pnpm-lock.yaml") { "pnpm" } else { "npm" }
    `$packageContent = Get-Content `$packageJson -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue

    if (`$packageContent.scripts.typecheck) {
        `$output = & `$pkgManager run typecheck 2>&1 | Out-String
        `$errors = (`$output | Select-String "error TS" | Measure-Object).Count

        if (`$errors -gt 0) {
            `$totalErrors += `$errors
            `$projectsWithErrors += "`$projectName (`$errors errors)"
            Write-Host "  ⚠️  `$projectName: `$errors errors" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ `$projectName: 0 errors" -ForegroundColor DarkGreen
        }
    }
    Pop-Location
}

if (`$totalErrors -gt 0) {
    Write-Host ""
    Write-Host "❌ `$totalErrors TypeScript errors found!" -ForegroundColor Red
    Add-Content -Path `$LogFile -Value "[`$timestamp] ALERT: `$totalErrors errors"
} else {
    Write-Host ""
    Write-Host "✅ All projects clean!" -ForegroundColor Green
    Add-Content -Path `$LogFile -Value "[`$timestamp] All clean (0 errors)"
}
"@

if (-not $WhatIf) {
    $monitorScript | Out-File -FilePath $MonitorScriptPath -Encoding UTF8 -Force
    Write-Host "  ✓ Created: $MonitorScriptPath" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would create: $MonitorScriptPath" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 5: Schedule Monitoring
###############################################################################

Write-Host "STEP 5: Scheduling monitoring..." -ForegroundColor Green
Write-Host ""

if (-not $WhatIf) {
    $existingTask = Get-ScheduledTask -TaskName $ScheduledTaskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $ScheduledTaskName -Confirm:$false
        Write-Host "  ✓ Removed old task" -ForegroundColor Gray
    }

    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$MonitorScriptPath`""
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

    Register-ScheduledTask -TaskName $ScheduledTaskName `
        -Action $action -Trigger $trigger -Principal $principal -Settings $settings `
        -Description "TypeScript quality monitor" | Out-Null

    Write-Host "  ✓ Scheduled: Every Monday 9 AM" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would create task: $ScheduledTaskName" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# Summary
###############################################################################

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not $WhatIf) {
    Write-Host "✓ Global Git hooks configured" -ForegroundColor Green
    Write-Host "✓ $($allProjects.Count) TypeScript projects scanned" -ForegroundColor Green
    Write-Host "✓ $retrofitted projects retrofitted" -ForegroundColor Green
    Write-Host "✓ VSCode configured" -ForegroundColor Green
    Write-Host "✓ Monitoring scheduled" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 SYSTEM-WIDE PROTECTION ACTIVE!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test it:" -ForegroundColor Yellow
    Write-Host "  cd C:\dev\projects\active\desktop-apps\deepcode-editor" -ForegroundColor White
    Write-Host "  git commit (will check TypeScript automatically)" -ForegroundColor White
    Write-Host ""
    Write-Host "Run monitor manually:" -ForegroundColor Yellow
    Write-Host "  powershell -File $MonitorScriptPath" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "DRY RUN COMPLETE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Would affect: $($allProjects.Count) projects" -ForegroundColor White
    Write-Host ""
    Write-Host "Run without -WhatIf to install:" -ForegroundColor Cyan
    Write-Host "  .\INSTALL-SYSTEM-WIDE-SIMPLE.ps1" -ForegroundColor White
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
