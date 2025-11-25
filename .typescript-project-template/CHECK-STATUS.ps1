###############################################################################
# Check Installation Status
###############################################################################

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TypeScript Protection System - Status Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check 1: Git global hooks
Write-Host "1. Git Global Hooks:" -ForegroundColor Yellow
$gitTemplate = git config --global init.templateDir 2>$null
if ($gitTemplate) {
    Write-Host "   ✓ CONFIGURED: $gitTemplate" -ForegroundColor Green
} else {
    Write-Host "   ✗ NOT CONFIGURED" -ForegroundColor Red
}

# Check 2: Monitor script
Write-Host "2. Monitor Script:" -ForegroundColor Yellow
if (Test-Path "C:\dev\.typescript-quality-monitor.ps1") {
    Write-Host "   ✓ EXISTS: C:\dev\.typescript-quality-monitor.ps1" -ForegroundColor Green
} else {
    Write-Host "   ✗ NOT FOUND" -ForegroundColor Red
}

# Check 3: Scheduled task
Write-Host "3. Scheduled Task:" -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName "TypeScript-Quality-Monitor" -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "   ✓ SCHEDULED: $($task.State)" -ForegroundColor Green
} else {
    Write-Host "   ✗ NOT SCHEDULED" -ForegroundColor Red
}

# Check 4: Sample project
Write-Host "4. Sample Project Check:" -ForegroundColor Yellow
$sampleProject = "C:\dev\projects\active\desktop-apps\deepcode-editor"
if (Test-Path $sampleProject) {
    $hasLintStaged = Test-Path (Join-Path $sampleProject ".lintstagedrc.js")
    if ($hasLintStaged) {
        Write-Host "   ✓ deepcode-editor has .lintstagedrc.js" -ForegroundColor Green
    } else {
        Write-Host "   ✗ deepcode-editor missing .lintstagedrc.js" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Summary
$gitOK = $gitTemplate -ne $null
$monitorOK = Test-Path "C:\dev\.typescript-quality-monitor.ps1"
$taskOK = $task -ne $null

if ($gitOK -and $monitorOK -and $taskOK) {
    Write-Host "  STATUS: ✓ FULLY INSTALLED" -ForegroundColor Green
} else {
    Write-Host "  STATUS: ✗ NOT INSTALLED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To install, run:" -ForegroundColor Yellow
    Write-Host "  .\INSTALL-SYSTEM-WIDE-SIMPLE.ps1" -ForegroundColor White
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
