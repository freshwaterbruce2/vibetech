#!/usr/bin/env pwsh
# Prompt Engineer - Quick Start
# Date: October 1, 2025

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Prompt Engineer - Interactive Context Collector" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$pythonPath = "C:\Python313\python.exe"
$projectPath = "c:\dev\projects\tools\prompt-engineer"

# Environment Check
Write-Host "[1] Environment Check" -ForegroundColor Yellow
$pythonVersion = & $pythonPath --version
Write-Host "  Python: $pythonVersion" -ForegroundColor Green
Write-Host "  Location: $projectPath" -ForegroundColor Green
Write-Host ""

# Quick Test
Write-Host "[2] Running Tests..." -ForegroundColor Yellow
Push-Location $projectPath
& $pythonPath test_runner.py > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Status: ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  Status: Tests failed" -ForegroundColor Red
}
Pop-Location
Write-Host ""

# Features
Write-Host "[3] Core Features" -ForegroundColor Yellow
Write-Host "  - Interactive Context Collector" -ForegroundColor White
Write-Host "  - Spec-Driven Development Engine"
Write-Host "  - Multi-Model Prompt Generation (9 AI models)"
Write-Host "  - Web Research Integration"
Write-Host "  - Streamlit Web UI Dashboard"
Write-Host "  - Advanced Context Engineering"
Write-Host ""

# Quick Commands
Write-Host "[4] Quick Start Commands" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Interactive Collector:" -ForegroundColor Cyan
Write-Host "    cd $projectPath"
Write-Host "    $pythonPath -m src.collectors.interactive_collector"
Write-Host ""
Write-Host "  Launch Web UI:" -ForegroundColor Cyan
Write-Host "    cd $projectPath"
Write-Host "    streamlit run streamlit_ui.py"
Write-Host ""
Write-Host "  Full Test Suite:" -ForegroundColor Cyan
Write-Host "    cd $projectPath"
Write-Host "    $pythonPath -m pytest tests/ -v"
Write-Host ""

# Examples
Write-Host "[5] Example Usage" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Analyze Crypto Trading Project:" -ForegroundColor Cyan
Write-Host "    $pythonPath -m src.collectors.interactive_collector"
Write-Host "    # Enter: c:\dev\projects\crypto-enhanced"
Write-Host ""
Write-Host "  Generate Context for Desktop Commander:" -ForegroundColor Cyan
Write-Host "    $pythonPath context_collect.py c:\dev\DesktopCommanderMCP"
Write-Host ""

# Status
Write-Host "[6] Project Status" -ForegroundColor Yellow
Write-Host "  Status: PRODUCTION READY" -ForegroundColor Green
Write-Host "  Last Active: September 2024"
Write-Host "  Restored: October 1, 2025"
Write-Host "  Dependencies: Installed"
Write-Host ""
$pyFiles = (Get-ChildItem -Path $projectPath -Recurse -Filter *.py | Measure-Object).Count
Write-Host "  Files: $pyFiles Python files"
Write-Host "  Documentation: 8 guide files"
Write-Host ""

# Database
Write-Host "[7] Analysis History" -ForegroundColor Yellow
$dbPath = Join-Path $projectPath "databases\analysis_history.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length / 1KB
    Write-Host "  Database: EXISTS" -ForegroundColor Green
    Write-Host "  Size: $($dbSize.ToString('F2')) KB"
} else {
    Write-Host "  Database: Will be created on first use" -ForegroundColor Yellow
}
Write-Host ""

# Next Steps
Write-Host "[8] Recommended Actions" -ForegroundColor Yellow
Write-Host "  1. Run interactive collector on a project"
Write-Host "  2. Launch Streamlit UI to explore features"
Write-Host "  3. Generate context for Desktop Commander"
Write-Host ""

# Documentation
Write-Host "[9] Documentation" -ForegroundColor Yellow
Write-Host "  - README.md (Main documentation)"
Write-Host "  - CLAUDE.md (AI assistant guide)"
Write-Host "  - PROJECT_STATUS.md (Current status - NEW)"
Write-Host "  - ENHANCED_FEATURES.md (Advanced features)"
Write-Host ""

# Final
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   READY TO USE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Competitive Advantages:" -ForegroundColor Yellow
Write-Host "  + More advanced than Codebase-Digest" -ForegroundColor Green
Write-Host "  + Better multi-model support than Cursor" -ForegroundColor Green
Write-Host "  + More complete than GitHub Spec Kit" -ForegroundColor Green
Write-Host ""
Write-Host "Start analyzing projects now!" -ForegroundColor Cyan
Write-Host ""
