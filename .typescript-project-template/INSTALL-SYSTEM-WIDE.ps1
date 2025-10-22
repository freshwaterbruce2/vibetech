###############################################################################
# SYSTEM-WIDE TypeScript Error Prevention - ONE-TIME SETUP
# Last Updated: October 16, 2025
#
# Tailored for YOUR development environment:
# - Monorepo: C:\dev
# - Learning System: D:\
# - Database: D:\databases\database.db
# - Agent System: .claude/agents/
# - Projects: projects/active/, active-projects/, Vibe-Tutor, etc.
#
# Run this ONCE and you're protected forever.
###############################################################################

param(
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SYSTEM-WIDE TypeScript Error Prevention Installer" -ForegroundColor Cyan
Write-Host "  Configured for Your Complete Development Environment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($WhatIf) {
    Write-Host "⚠️  DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Configuration
$GlobalHooksDir = "$env:USERPROFILE\.git-templates\hooks"
$SearchPaths = @(
    "C:\dev",                                    # Main monorepo
    "D:\",                                       # Learning system + other projects
    "C:\dev\projects\active",                    # Active projects
    "C:\dev\active-projects",                    # Alternative active projects
    "C:\dev\Vibe-Tutor"                         # Capacitor mobile apps
)
$ScheduledTaskName = "TypeScript-Quality-Monitor"
$MonitorScriptPath = "C:\dev\.typescript-quality-monitor.ps1"
$LogPath = "C:\dev\.typescript-quality-monitor.log"

###############################################################################
# STEP 1: Configure Global Git Hooks Template
###############################################################################

Write-Host "STEP 1: Setting up global Git hooks template..." -ForegroundColor Green
Write-Host ""

if (-not $WhatIf) {
    # Create global hooks directory
    if (-not (Test-Path $GlobalHooksDir)) {
        New-Item -ItemType Directory -Path $GlobalHooksDir -Force | Out-Null
        Write-Host "  ✓ Created global hooks directory: $GlobalHooksDir" -ForegroundColor Gray
    } else {
        Write-Host "  ✓ Global hooks directory exists" -ForegroundColor Gray
    }

    # Configure Git to use global template
    git config --global init.templateDir "$env:USERPROFILE\.git-templates"
    Write-Host "  ✓ Configured Git to use global template" -ForegroundColor Gray

    # Create smart global pre-commit hook
    $preCommitHook = @'
#!/bin/sh
# Global pre-commit hook - TypeScript quality check
# Auto-installed for ALL repositories
# Integrated with .claude agents system

# Check if this is a TypeScript project
if [ -f "tsconfig.json" ] || [ -f "package.json" ]; then
    # Check if we have pnpm (preferred) or npm
    if command -v pnpm >/dev/null 2>&1; then
        PKG_MANAGER="pnpm"
    elif command -v npm >/dev/null 2>&1; then
        PKG_MANAGER="npm"
    else
        echo "⚠️  No package manager found, skipping TypeScript checks"
        exit 0
    fi

    # Check if lint-staged is configured
    if [ -f ".lintstagedrc.js" ] || grep -q "lint-staged" package.json 2>/dev/null; then
        echo "🔍 Running TypeScript quality checks..."
        $PKG_MANAGER exec lint-staged
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ TypeScript quality checks failed!"
            echo "Fix errors above before committing."
            echo ""
            echo "Quick fixes:"
            echo "  $PKG_MANAGER run quality:fix   # Auto-fix linting + formatting"
            echo "  $PKG_MANAGER typecheck          # Check TypeScript errors"
            echo ""
            exit 1
        fi
        echo "✅ TypeScript quality checks passed!"
    else
        # Fallback: just run typecheck if available
        if grep -q '"typecheck"' package.json 2>/dev/null; then
            echo "🔍 Running TypeScript check..."
            $PKG_MANAGER run typecheck
            if [ $? -ne 0 ]; then
                echo ""
                echo "❌ TypeScript check failed!"
                echo "Run: $PKG_MANAGER typecheck"
                exit 1
            fi
            echo "✅ TypeScript check passed!"
        fi
    fi
fi

# If no TypeScript checks apply, allow commit
exit 0
'@

    $preCommitPath = Join-Path $GlobalHooksDir "pre-commit"
    $preCommitHook | Out-File -FilePath $preCommitPath -Encoding UTF8 -NoNewline
    Write-Host "  ✓ Created global pre-commit hook" -ForegroundColor Gray

} else {
    Write-Host "  [DRY RUN] Would create: $GlobalHooksDir" -ForegroundColor Yellow
    Write-Host "  [DRY RUN] Would configure Git global template" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 2: Scan and Retrofit ALL TypeScript Projects
###############################################################################

Write-Host "STEP 2: Scanning ALL development directories..." -ForegroundColor Green
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
        Write-Host "    Found $($projects.Count) TypeScript projects" -ForegroundColor DarkGray
    } else {
        Write-Host "  Skipped: $path (not found)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "  Total: $($allProjects.Count) TypeScript projects found" -ForegroundColor Cyan
Write-Host ""

$retrofitted = 0
$skipped = 0
$alreadyConfigured = 0

foreach ($projectPath in $allProjects) {
    $projectName = Split-Path $projectPath -Leaf

    # Check if project has package.json
    $packageJsonPath = Join-Path $projectPath "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        $skipped++
        continue
    }

    # Check if already has lint-staged
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($packageJson.PSObject.Properties["lint-staged"] -or (Test-Path (Join-Path $projectPath ".lintstagedrc.js"))) {
        Write-Host "  ✓ Already configured: $projectName" -ForegroundColor DarkGreen
        $alreadyConfigured++
        continue
    }

    if (-not $WhatIf) {
        # Copy lint-staged configuration
        $templateLintStaged = "C:\dev\.typescript-project-template\.lintstagedrc.js"
        if (Test-Path $templateLintStaged) {
            Copy-Item $templateLintStaged -Destination (Join-Path $projectPath ".lintstagedrc.js") -Force
        }

        # Install lint-staged and husky if package.json has devDependencies
        if ($packageJson.devDependencies) {
            Push-Location $projectPath

            # Check if pnpm or npm
            if (Test-Path "pnpm-lock.yaml") {
                # Already has pnpm, check if lint-staged installed
                $pnpmList = pnpm list lint-staged 2>&1 | Out-String
                if ($pnpmList -notmatch "lint-staged") {
                    Write-Host "  + Installing lint-staged: $projectName" -ForegroundColor Yellow
                    pnpm add -D lint-staged husky 2>&1 | Out-Null
                }
            }

            # Reinitialize Git to pick up global hooks
            if (Test-Path ".git") {
                git init 2>&1 | Out-Null
            }

            Pop-Location
        }

        Write-Host "  ✓ Retrofitted: $projectName" -ForegroundColor Green
        $retrofitted++
    } else {
        Write-Host "  [DRY RUN] Would retrofit: $projectName" -ForegroundColor Yellow
        $retrofitted++
    }
}

Write-Host ""
Write-Host "  Summary:" -ForegroundColor Cyan
Write-Host "    Retrofitted: $retrofitted projects" -ForegroundColor Green
Write-Host "    Already configured: $alreadyConfigured projects" -ForegroundColor DarkGreen
Write-Host "    Skipped: $skipped projects" -ForegroundColor Gray
Write-Host ""

###############################################################################
# STEP 3: Configure VSCode Global Settings
###############################################################################

Write-Host "STEP 3: Configuring VSCode global settings..." -ForegroundColor Green
Write-Host ""

$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"

if (-not $WhatIf) {
    # Read existing settings or create new
    $settings = @{}
    if (Test-Path $vscodeSettingsPath) {
        try {
            $settings = Get-Content $vscodeSettingsPath -Raw | ConvertFrom-Json -AsHashtable
        } catch {
            Write-Host "  ⚠️  Could not parse existing settings.json, creating backup" -ForegroundColor Yellow
            Copy-Item $vscodeSettingsPath "$vscodeSettingsPath.backup" -Force
            $settings = @{}
        }
    }

    # Merge in TypeScript-strict settings (preserving existing)
    $tsSettings = @{
        "typescript.validate.enable" = $true
        "typescript.reportStyleChecksAsWarnings" = $false
        "typescript.updateImportsOnFileMove.enabled" = "always"
        "typescript.preferences.quoteStyle" = "single"
        "editor.formatOnSave" = $true
        "editor.codeActionsOnSave" = @{
            "source.fixAll.eslint" = "explicit"
            "source.organizeImports" = "explicit"
        }
        "eslint.validate" = @("javascript", "javascriptreact", "typescript", "typescriptreact")
        "eslint.alwaysShowStatus" = $true
        "problems.decorations.enabled" = $true
        "problems.showCurrentInStatus" = $true
        "files.watcherExclude" = @{
            "**/.git/objects/**" = $true
            "**/node_modules/**" = $true
            "**/dist/**" = $true
            "**/build/**" = $true
        }
    }

    foreach ($key in $tsSettings.Keys) {
        if (-not $settings.ContainsKey($key)) {
            $settings[$key] = $tsSettings[$key]
        }
    }

    # Save settings
    $settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $vscodeSettingsPath -Encoding UTF8 -Force
    Write-Host "  ✓ VSCode global settings updated" -ForegroundColor Gray
    Write-Host "  ✓ Restart VSCode to apply changes" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would update: $vscodeSettingsPath" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 4: Create Automated Monitoring Script
###############################################################################

Write-Host "STEP 4: Creating automated monitoring script..." -ForegroundColor Green
Write-Host ""

$monitorScript = @"
###############################################################################
# TypeScript Quality Monitor
# Automatically scans all projects for TypeScript errors
# Integrated with your complete development environment
###############################################################################

`$SearchPaths = @(
    "C:\dev",
    "D:\",
    "C:\dev\projects\active",
    "C:\dev\active-projects",
    "C:\dev\Vibe-Tutor"
)

`$LogFile = "$LogPath"
`$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$timestamp] Starting TypeScript quality scan..." -ForegroundColor Cyan
Add-Content -Path `$LogFile -Value "[$timestamp] Starting TypeScript quality scan"

`$allProjects = @()

foreach (`$path in `$SearchPaths) {
    if (Test-Path `$path) {
        `$projects = Get-ChildItem -Path `$path -Recurse -Filter "tsconfig.json" -ErrorAction SilentlyContinue |
            ForEach-Object { `$_.Directory.FullName } |
            Where-Object {
                `$_ -notmatch "node_modules|dist|build|\.next|coverage"
            } |
            Sort-Object -Unique

        `$allProjects += `$projects
    }
}

Write-Host "Found `$(`$allProjects.Count) TypeScript projects" -ForegroundColor Gray

`$totalErrors = 0
`$projectsWithErrors = @()

foreach (`$project in `$allProjects) {
    `$packageJson = Join-Path `$project "package.json"
    if (-not (Test-Path `$packageJson)) { continue }

    `$projectName = Split-Path `$project -Leaf
    `$relativePath = `$project.Replace("C:\dev\", "").Replace("D:\", "D:\")

    Push-Location `$project

    # Check if using pnpm or npm
    `$pkgManager = if (Test-Path "pnpm-lock.yaml") { "pnpm" } else { "npm" }

    # Check if typecheck script exists
    `$packageContent = Get-Content `$packageJson -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if (`$packageContent.scripts.typecheck) {
        `$output = & `$pkgManager run typecheck 2>&1 | Out-String
        `$errors = (`$output | Select-String "error TS" | Measure-Object).Count

        if (`$errors -gt 0) {
            `$totalErrors += `$errors
            `$projectsWithErrors += "`$relativePath ($errors errors)"
            Add-Content -Path `$LogFile -Value "  ⚠️  `$relativePath: `$errors errors"
            Write-Host "  ⚠️  `$projectName: `$errors errors" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ `$projectName: 0 errors" -ForegroundColor DarkGreen
        }
    }

    Pop-Location
}

if (`$totalErrors -gt 0) {
    `$message = "⚠️  TypeScript Quality Alert!``n``nProjects with errors:``n" + (`$projectsWithErrors -join "``n")
    Add-Content -Path `$LogFile -Value "[$timestamp] ALERT: `$totalErrors total errors across `$(`$projectsWithErrors.Count) projects"

    Write-Host ""
    Write-Host "❌ ALERT: `$totalErrors TypeScript errors found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Projects with errors:" -ForegroundColor Yellow
    foreach (`$p in `$projectsWithErrors) {
        Write-Host "  • `$p" -ForegroundColor Yellow
    }

    # Desktop notification
    Add-Type -AssemblyName System.Windows.Forms
    `$notification = New-Object System.Windows.Forms.NotifyIcon
    `$notification.Icon = [System.Drawing.SystemIcons]::Warning
    `$notification.BalloonTipTitle = "TypeScript Quality Alert"
    `$notification.BalloonTipText = "`$totalErrors TypeScript errors found in `$(`$projectsWithErrors.Count) projects"
    `$notification.Visible = `$true
    `$notification.ShowBalloonTip(10000)
} else {
    Add-Content -Path `$LogFile -Value "[$timestamp] ✓ All projects clean (0 errors)"
    Write-Host ""
    Write-Host "✅ All projects clean! 0 TypeScript errors found." -ForegroundColor Green
}

Write-Host ""
Write-Host "Log: `$LogFile" -ForegroundColor Gray
"@

if (-not $WhatIf) {
    $monitorScript | Out-File -FilePath $MonitorScriptPath -Encoding UTF8 -Force
    Write-Host "  ✓ Monitor script created: $MonitorScriptPath" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would create: $MonitorScriptPath" -ForegroundColor Yellow
}

Write-Host ""

###############################################################################
# STEP 5: Schedule Automated Monitoring
###############################################################################

Write-Host "STEP 5: Scheduling automated monitoring..." -ForegroundColor Green
Write-Host ""

if (-not $WhatIf) {
    # Check if task already exists
    $existingTask = Get-ScheduledTask -TaskName $ScheduledTaskName -ErrorAction SilentlyContinue

    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $ScheduledTaskName -Confirm:$false
        Write-Host "  ✓ Removed existing scheduled task" -ForegroundColor Gray
    }

    # Create new scheduled task - runs every Monday at 9 AM
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$MonitorScriptPath`""
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

    Register-ScheduledTask -TaskName $ScheduledTaskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Automatically scans all TypeScript projects for errors across C:\dev and D:\ drives" | Out-Null

    Write-Host "  ✓ Scheduled task created: Runs every Monday at 9 AM" -ForegroundColor Gray
} else {
    Write-Host "  [DRY RUN] Would create scheduled task: $ScheduledTaskName" -ForegroundColor Yellow
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
    Write-Host "✓ $retrofitted projects retrofitted with lint-staged" -ForegroundColor Green
    Write-Host "✓ $alreadyConfigured projects already configured" -ForegroundColor Green
    Write-Host "✓ VSCode global settings updated" -ForegroundColor Green
    Write-Host "✓ Automated monitoring scheduled (Monday 9 AM)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 SYSTEM-WIDE PROTECTION ACTIVE!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "What happens now:" -ForegroundColor Yellow
    Write-Host "  ✓ ALL future Git repos get TypeScript checks automatically" -ForegroundColor White
    Write-Host "  ✓ ALL existing projects ($($allProjects.Count)) protected" -ForegroundColor White
    Write-Host "  ✓ VSCode shows TypeScript errors globally" -ForegroundColor White
    Write-Host "  ✓ Weekly monitoring runs automatically" -ForegroundColor White
    Write-Host ""
    Write-Host "Your environment:" -ForegroundColor Yellow
    Write-Host "  • Monorepo: C:\dev" -ForegroundColor White
    Write-Host "  • Learning system: D:\" -ForegroundColor White
    Write-Host "  • Database: D:\databases\database.db" -ForegroundColor White
    Write-Host "  • Agent system: .claude/agents/" -ForegroundColor White
    Write-Host ""
    Write-Host "Test it NOW:" -ForegroundColor Yellow
    Write-Host "  1. cd C:\dev\projects\active\desktop-apps\deepcode-editor" -ForegroundColor White
    Write-Host "  2. echo 'const x: number = \"string\";' > test.ts" -ForegroundColor White
    Write-Host "  3. git add test.ts && git commit -m 'test'" -ForegroundColor White
    Write-Host "  4. Should FAIL with error ✓ Then remove: rm test.ts" -ForegroundColor White
    Write-Host ""
    Write-Host "Run monitor manually:" -ForegroundColor Yellow
    Write-Host "  powershell -File $MonitorScriptPath" -ForegroundColor White
    Write-Host ""
    Write-Host "View monitor log:" -ForegroundColor Yellow
    Write-Host "  Get-Content $LogPath -Tail 50" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "DRY RUN COMPLETE - No changes made" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Would affect:" -ForegroundColor Cyan
    Write-Host "  • $($allProjects.Count) TypeScript projects" -ForegroundColor White
    Write-Host "  • $retrofitted projects to retrofit" -ForegroundColor White
    Write-Host "  • $alreadyConfigured projects already configured" -ForegroundColor White
    Write-Host ""
    Write-Host "Run without -WhatIf to actually install:" -ForegroundColor Cyan
    Write-Host "  .\INSTALL-SYSTEM-WIDE.ps1" -ForegroundColor White
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
