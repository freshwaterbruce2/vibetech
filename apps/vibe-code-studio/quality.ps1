#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run all quality checks for DeepCode Editor
.DESCRIPTION
    Runs TypeScript check, linting, and tests
.PARAMETER Fix
    If specified, auto-fixes linting issues
.EXAMPLE
    .\quality.ps1
    .\quality.ps1 -Fix
#>

param(
    [switch]$Fix
)

Write-Host "🔍 Running quality checks..." -ForegroundColor Cyan

$allPassed = $true

# TypeScript check
Write-Host "`n📝 TypeScript Check..." -ForegroundColor Yellow
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript errors found" -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "✅ TypeScript check passed" -ForegroundColor Green
}

# Linting
Write-Host "`n🧹 ESLint Check..." -ForegroundColor Yellow
if ($Fix) {
    pnpm lint --fix
} else {
    pnpm lint
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting errors found" -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "✅ Linting passed" -ForegroundColor Green
}

# Unit tests
Write-Host "`n🧪 Running Tests..." -ForegroundColor Yellow
pnpm test --reporter=summary
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed" -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "✅ Tests passed" -ForegroundColor Green
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ All quality checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some quality checks failed" -ForegroundColor Red
    exit 1
}
