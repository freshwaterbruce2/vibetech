###############################################################################
# TypeScript Project Quick Start Script (PowerShell)
# Last Updated: October 16, 2025
#
# Usage: .\quick-start.ps1 -TargetPath "C:\path\to\your\new\project"
###############################################################################

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetPath
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 TypeScript Project Quick Start" -ForegroundColor Green
Write-Host "Template: $PSScriptRoot" -ForegroundColor Gray
Write-Host "Target: $TargetPath" -ForegroundColor Gray
Write-Host ""

# Create target directory if it doesn't exist
if (-not (Test-Path $TargetPath)) {
    Write-Host "Creating target directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
}

# Copy template files
Write-Host "📦 Copying template files..." -ForegroundColor Green

Write-Host "  → .husky/" -ForegroundColor Gray
Copy-Item -Path "$PSScriptRoot\.husky" -Destination $TargetPath -Recurse -Force

Write-Host "  → .github/" -ForegroundColor Gray
Copy-Item -Path "$PSScriptRoot\.github" -Destination $TargetPath -Recurse -Force

Write-Host "  → .vscode/" -ForegroundColor Gray
Copy-Item -Path "$PSScriptRoot\.vscode" -Destination $TargetPath -Recurse -Force

Write-Host "  → Configuration files" -ForegroundColor Gray
Copy-Item -Path "$PSScriptRoot\.lintstagedrc.js" -Destination $TargetPath -Force
Copy-Item -Path "$PSScriptRoot\.eslintrc.js" -Destination $TargetPath -Force
Copy-Item -Path "$PSScriptRoot\.prettierrc.js" -Destination $TargetPath -Force
Copy-Item -Path "$PSScriptRoot\tsconfig.json" -Destination $TargetPath -Force

Write-Host "  → Documentation" -ForegroundColor Gray
Copy-Item -Path "$PSScriptRoot\DEVELOPMENT_WORKFLOW.md" -Destination $TargetPath -Force
Copy-Item -Path "$PSScriptRoot\SETUP_CHECKLIST.md" -Destination $TargetPath -Force

# Handle package.json
$packageJsonPath = Join-Path $TargetPath "package.json"
if (Test-Path $packageJsonPath) {
    Write-Host "⚠️  package.json already exists" -ForegroundColor Yellow
    Write-Host "  → Saving template as package.template.json" -ForegroundColor Gray
    Copy-Item -Path "$PSScriptRoot\package.template.json" -Destination (Join-Path $TargetPath "package.template.json") -Force
    Write-Host "  → Please merge dependencies manually" -ForegroundColor Yellow
} else {
    Write-Host "  → package.json" -ForegroundColor Gray
    Copy-Item -Path "$PSScriptRoot\package.template.json" -Destination $packageJsonPath -Force
}

# Initialize git if not already initialized
$gitPath = Join-Path $TargetPath ".git"
if (-not (Test-Path $gitPath)) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Green
    Push-Location $TargetPath
    git init
    Pop-Location
}

Write-Host ""
Write-Host "✅ Template copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd $TargetPath" -ForegroundColor White
Write-Host "  2. pnpm install" -ForegroundColor White
Write-Host "  3. pnpm prepare" -ForegroundColor White
Write-Host "  4. Review SETUP_CHECKLIST.md" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding with zero TypeScript errors! 🎉" -ForegroundColor Green
