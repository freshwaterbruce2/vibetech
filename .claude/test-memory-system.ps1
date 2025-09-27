#!/usr/bin/env powershell
# Comprehensive test of the automatic memory system

Write-Host "=== COMPREHENSIVE MEMORY SYSTEM VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Test 1: Check hooks are installed
Write-Host "Test 1: Verifying hooks installation..." -ForegroundColor Yellow
if ((Test-Path "C:\dev\.claude\hooks\session-start.ps1") -and
    (Test-Path "C:\dev\.claude\hooks\user-prompt-submit.ps1")) {
    Write-Host "✓ Hooks installed correctly" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Hooks missing" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Check hooks are registered in settings
Write-Host "`nTest 2: Verifying hooks registration..." -ForegroundColor Yellow
$settings = Get-Content "C:\dev\.claude\settings.local.json" -Raw | ConvertFrom-Json
if ($settings.hooks.SessionStart -and $settings.hooks.UserPromptSubmit) {
    Write-Host "✓ Hooks registered in settings.local.json" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Hooks not registered" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Test session-start hook execution
Write-Host "`nTest 3: Testing session-start hook..." -ForegroundColor Yellow
$output = & "C:\dev\.claude\hooks\session-start.ps1" 2>&1
if ($output -match "AUTO-MEMORY.*Ready for session") {
    Write-Host "✓ Session-start hook works" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Session-start hook failed" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Test memory CLI accessibility
Write-Host "`nTest 4: Testing memory CLI..." -ForegroundColor Yellow
Set-Location "C:\dev\projects\active\web-apps\memory-bank"
$memoryTest = node memory_cli.js retrieve "test-key" "test" 2>&1
if ($LASTEXITCODE -eq 0 -or $memoryTest -match "Data not found") {
    Write-Host "✓ Memory CLI accessible" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Memory CLI not working" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Test memory storage
Write-Host "`nTest 5: Testing memory storage..." -ForegroundColor Yellow
$testData = '{"test":"data","timestamp":"' + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + '"}'
$storeResult = node memory_cli.js store "test-verification" $testData '{"type":"test"}' 2>&1
if ($storeResult -match "Data stored") {
    Write-Host "✓ Memory storage working" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Memory storage failed" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Test memory retrieval
Write-Host "`nTest 6: Testing memory retrieval..." -ForegroundColor Yellow
$retrieveResult = node memory_cli.js retrieve "test-verification" "test" 2>&1
if ($retrieveResult -match "Data retrieved") {
    Write-Host "✓ Memory retrieval working" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Memory retrieval failed" -ForegroundColor Red
    $testsFailed++
}

# Test 7: Verify all project paths
Write-Host "`nTest 7: Verifying project paths..." -ForegroundColor Yellow
$paths = @(
    "C:\dev\projects\active\web-apps",
    "C:\dev\projects\active\web-apps\shipping-pwa",
    "C:\dev\projects\active\web-apps\shipping-pwa\android",
    "C:\dev\projects\active\web-apps\vibe-tech-lovable\backend",
    "C:\dev\projects\active\web-apps\memory-bank"
)
$pathsOk = $true
foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        Write-Host "✗ Missing path: $path" -ForegroundColor Red
        $pathsOk = $false
    }
}
if ($pathsOk) {
    Write-Host "✓ All paths verified" -ForegroundColor Green
    $testsPassed++
} else {
    $testsFailed++
}

# Test 8: Verify CLAUDE.md exists
Write-Host "`nTest 8: Checking CLAUDE.md..." -ForegroundColor Yellow
if (Test-Path 'C:\dev\CLAUDE.md') {
    $claudeMd = Get-Content 'C:\dev\CLAUDE.md' -Raw
    if ($claudeMd -match "AUTOMATED MEMORY AND CONTEXT SYSTEM") {
        Write-Host "✓ CLAUDE.md has memory instructions" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✗ CLAUDE.md missing memory instructions" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "✗ CLAUDE.md not found" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n✓ MEMORY SYSTEM FULLY OPERATIONAL!" -ForegroundColor Green
    Write-Host "The automatic memory system will work in ALL sessions." -ForegroundColor Green
} else {
    Write-Host "`n⚠ ISSUES DETECTED - Memory system may not work automatically" -ForegroundColor Yellow
    Write-Host 'Please fix the failed tests above.' -ForegroundColor Yellow
}

Set-Location 'C:\dev'