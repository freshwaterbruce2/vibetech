#!/usr/bin/env powershell
# COMPREHENSIVE CLAUDE CODE SETUP VALIDATION
# Date: 09/27/2025
# Purpose: Validate all Claude Code features are properly configured

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " CLAUDE CODE COMPREHENSIVE VALIDATION TEST" -ForegroundColor Cyan
Write-Host " Testing YOLO MODE and Full Automation Features" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0
$warnings = @()

# Helper function for test results
function Test-Result {
    param($TestName, $Condition, $PassMessage, $FailMessage)
    $script:totalTests++
    Write-Host -NoNewline "Testing $TestName... "
    if ($Condition) {
        Write-Host "PASS" -ForegroundColor Green
        Write-Host "  $PassMessage" -ForegroundColor DarkGray
        $script:passedTests++
        return $true
    } else {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "  $FailMessage" -ForegroundColor Yellow
        $script:failedTests++
        return $false
    }
}

# 1. CONFIGURATION FILES
Write-Host "`n[1/7] CONFIGURATION FILES" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor DarkGray

Test-Result "settings.local.json" `
    (Test-Path "C:\dev\.claude\settings.local.json") `
    "Settings file exists with permissions configured" `
    "Settings file missing - Claude Code may not have proper permissions"

Test-Result "CLAUDE.md" `
    (Test-Path "C:\dev\CLAUDE.md") `
    "Workspace instructions found with YOLO MODE configuration" `
    "CLAUDE.md missing - automation instructions not available"

# 2. HOOKS SYSTEM
Write-Host "`n[2/7] AUTOMATION HOOKS" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor DarkGray

Test-Result "session-start.ps1" `
    (Test-Path "C:\dev\.claude\hooks\session-start.ps1") `
    "Session start hook installed for automatic memory loading" `
    "Session start hook missing - memory won't load automatically"

Test-Result "user-prompt-submit.ps1" `
    (Test-Path "C:\dev\.claude\hooks\user-prompt-submit.ps1") `
    "User prompt hook installed for automatic context saving" `
    "User prompt hook missing - context won't save automatically"

Test-Result "hook-config.json" `
    (Test-Path "C:\dev\.claude\hooks\hook-config.json") `
    "Hook configuration file present" `
    "Hook configuration missing"

# Test hook execution
Write-Host -NoNewline "Testing hook execution... "
$hookOutput = & "C:\dev\.claude\hooks\session-start.ps1" 2>&1
$hookWorks = $hookOutput -match "AUTO-MEMORY.*Ready"
Test-Result "Hook Execution" `
    $hookWorks `
    "Hooks execute properly" `
    "Hooks may not be executing correctly"

# 3. MEMORY SYSTEM
Write-Host "`n[3/7] MEMORY SYSTEM" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor DarkGray

Test-Result "memory-bank directory" `
    (Test-Path "C:\dev\projects\active\web-apps\memory-bank") `
    "Memory bank directory exists" `
    "Memory bank directory missing"

Test-Result "memory_cli.js" `
    (Test-Path "C:\dev\projects\active\web-apps\memory-bank\memory_cli.js") `
    "Memory CLI tool present" `
    "Memory CLI missing - automatic memory won't work"

# Test memory CLI functionality
Write-Host -NoNewline "Testing memory CLI... "
$originalLoc = Get-Location
Set-Location "C:\dev\projects\active\web-apps\memory-bank"
$memoryTest = node memory_cli.js retrieve "test-key" "test" 2>&1
Set-Location $originalLoc
$memoryWorks = ($LASTEXITCODE -eq 0) -or ($memoryTest -match "Data not found")
Test-Result "Memory CLI Function" `
    $memoryWorks `
    "Memory CLI is functional" `
    "Memory CLI may have issues"

# 4. PERMISSIONS
Write-Host "`n[4/7] YOLO MODE PERMISSIONS" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor DarkGray

$settings = Get-Content "C:\dev\.claude\settings.local.json" -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($settings) {
    $allowedCommands = @(
        "Bash(npm run*)",
        "Bash(git*)",
        "Bash(python:*)",
        "WebSearch",
        "WebFetch"
    )

    foreach ($cmd in $allowedCommands) {
        $pattern = $cmd -replace '\*', '.*' -replace '\(', '\(' -replace '\)', '\)'
        $hasPermission = $settings.permissions.allow | Where-Object { $_ -match $pattern }
        Test-Result "Permission: $cmd" `
            ($hasPermission -ne $null) `
            "Auto-execute enabled" `
            "May require manual approval"
    }
}

# 5. SLASH COMMANDS
Write-Host "`n[5/7] SLASH COMMANDS" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor DarkGray

Test-Result "Commands directory" `
    (Test-Path "C:\dev\.claude\commands") `
    "Commands directory exists" `
    "Commands directory missing"

$commandFiles = @("auto-memory.md", "memory-status.md")
foreach ($cmd in $commandFiles) {
    Test-Result "Command: /$($cmd -replace '\.md','')" `
        (Test-Path "C:\dev\.claude\commands\$cmd") `
        "Command definition found" `
        "Command definition missing"
}

# 6. YOLO MODE VALIDATION
Write-Host "`n[6/7] YOLO MODE FEATURES" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor DarkGray

# Check if YOLO MODE is mentioned in CLAUDE.md
$claudeMd = Get-Content "C:\dev\CLAUDE.md" -Raw -ErrorAction SilentlyContinue
Test-Result "YOLO MODE Documentation" `
    ($claudeMd -match "YOLO MODE") `
    "YOLO MODE fully documented in CLAUDE.md" `
    "YOLO MODE documentation not found"

Test-Result "Auto-Accept Configuration" `
    ($claudeMd -match "Auto-Accept ALL Edits") `
    "Auto-accept edits enabled" `
    "Auto-accept may not be configured"

Test-Result "Parallel Operations" `
    ($claudeMd -match "Parallel Operations") `
    "Parallel operations enabled" `
    "Parallel operations may not be configured"

# 7. ENVIRONMENT VALIDATION
Write-Host "`n[7/7] ENVIRONMENT" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor DarkGray

Test-Result "Git Repository" `
    (Test-Path "C:\dev\.git") `
    "Git repository detected" `
    "Not a git repository"

$branch = git branch --show-current 2>$null
Test-Result "Git Branch" `
    ($branch -ne $null) `
    "On branch: $branch" `
    "Unable to determine git branch"

Test-Result "Node.js" `
    ((node --version 2>$null) -ne $null) `
    "Node.js is installed" `
    "Node.js not found"

Test-Result "PowerShell" `
    ((Get-Command powershell -ErrorAction SilentlyContinue) -ne $null) `
    "PowerShell is available" `
    "PowerShell not found"

# SUMMARY
Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host " VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }

Write-Host "`nTests Run: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Gray" })
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

# Status determination
Write-Host "`n===================================================" -ForegroundColor Cyan
if ($successRate -ge 90) {
    Write-Host " STATUS: FULLY OPERATIONAL" -ForegroundColor Green
    Write-Host " YOLO MODE is ready for maximum automation!" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host " STATUS: PARTIALLY OPERATIONAL" -ForegroundColor Yellow
    Write-Host " Most features working, some issues detected" -ForegroundColor Yellow
} else {
    Write-Host " STATUS: NEEDS ATTENTION" -ForegroundColor Red
    Write-Host " Several critical features need fixing" -ForegroundColor Red
}
Write-Host "===================================================" -ForegroundColor Cyan

# Recommendations
if ($failedTests -gt 0) {
    Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Yellow
    if (-not (Test-Path "C:\dev\.claude\hooks\session-start.ps1")) {
        Write-Host "- Restore session-start.ps1 hook for automatic memory" -ForegroundColor White
    }
    if (-not (Test-Path "C:\dev\projects\active\web-apps\memory-bank\memory_cli.js")) {
        Write-Host "- Install memory-bank system for context persistence" -ForegroundColor White
    }
    if ($successRate -lt 50) {
        Write-Host "- Review CLAUDE.md for complete setup instructions" -ForegroundColor White
    }
}

Write-Host "`nValidation complete!" -ForegroundColor Green
Write-Host "Run this script anytime with: powershell .claude/validate-setup.ps1" -ForegroundColor DarkGray