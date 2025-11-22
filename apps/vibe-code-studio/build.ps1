#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build DeepCode Editor for Windows
.DESCRIPTION
    Builds the production version and optionally packages it
.PARAMETER Package
    If specified, also creates the installer
.EXAMPLE
    .\build.ps1
    .\build.ps1 -Package
#>

param(
    [switch]$Package
)

Write-Host "🔨 Building DeepCode Editor..." -ForegroundColor Cyan

# Run TypeScript check first
Write-Host "📝 Checking TypeScript..." -ForegroundColor Yellow
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript errors found! Fix them before building." -ForegroundColor Red
    exit 1
}

# Build the app
Write-Host "⚙️  Building application..." -ForegroundColor Green
pnpm build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📂 Output: out/ and dist/" -ForegroundColor Cyan

    if ($Package) {
        Write-Host "📦 Packaging installer..." -ForegroundColor Yellow
        pnpm electron-builder --win --x64

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Installer created in release/" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
