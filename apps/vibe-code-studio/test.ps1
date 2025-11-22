#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run tests for DeepCode Editor
.DESCRIPTION
    Runs unit tests and optionally E2E tests
.PARAMETER E2E
    If specified, also runs E2E tests (requires dev server)
.PARAMETER Coverage
    If specified, generates coverage report
.EXAMPLE
    .\test.ps1
    .\test.ps1 -Coverage
    .\test.ps1 -E2E
#>

param(
    [switch]$E2E,
    [switch]$Coverage
)

Write-Host "🧪 Running tests..." -ForegroundColor Cyan

# Run unit tests
if ($Coverage) {
    Write-Host "📊 Running tests with coverage..." -ForegroundColor Yellow
    pnpm test --coverage
} else {
    pnpm test
}

$unitTestsExitCode = $LASTEXITCODE

# Run E2E tests if requested
if ($E2E) {
    Write-Host "`n🎭 Running E2E tests..." -ForegroundColor Yellow
    pnpm playwright test
    $e2eTestsExitCode = $LASTEXITCODE
}

# Summary
Write-Host "`n📋 Test Summary:" -ForegroundColor Cyan
if ($unitTestsExitCode -eq 0) {
    Write-Host "  ✅ Unit tests passed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Unit tests failed" -ForegroundColor Red
}

if ($E2E) {
    if ($e2eTestsExitCode -eq 0) {
        Write-Host "  ✅ E2E tests passed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ E2E tests failed" -ForegroundColor Red
    }
}

# Exit with failure if any tests failed
if ($unitTestsExitCode -ne 0 -or ($E2E -and $e2eTestsExitCode -ne 0)) {
    exit 1
}
