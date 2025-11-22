#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Clean build artifacts and caches
.DESCRIPTION
    Removes node_modules, dist, out, and cache directories
.PARAMETER Deep
    If specified, also removes pnpm cache and reinstalls dependencies
.EXAMPLE
    .\clean.ps1
    .\clean.ps1 -Deep
#>

param(
    [switch]$Deep
)

Write-Host "🧹 Cleaning DeepCode Editor..." -ForegroundColor Cyan

# Remove build artifacts
$pathsToRemove = @(
    "node_modules",
    "dist",
    "out",
    ".vite",
    "coverage",
    "playwright-report",
    "test-results"
)

foreach ($path in $pathsToRemove) {
    if (Test-Path $path) {
        Write-Host "  🗑️  Removing $path..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $path
    }
}

if ($Deep) {
    Write-Host "  🗑️  Clearing pnpm cache..." -ForegroundColor Yellow
    pnpm store prune

    Write-Host "  📦 Reinstalling dependencies..." -ForegroundColor Green
    pnpm install
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
