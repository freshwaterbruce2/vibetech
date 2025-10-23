# Prompt Engineer - Vibe-Tech UI Launcher
# PowerShell script to launch the enhanced Vibe-Tech themed UI

Write-Host "`n⚡ PROMPT ENGINEER - VIBE-TECH UI ⚡`n" -ForegroundColor Cyan

# Check if Python is available
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue

if (-not $pythonCmd) {
    Write-Host "❌ Python not found! Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

$pythonVersion = python --version 2>&1
Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green

# Check if in correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if streamlit is installed
Write-Host "`nChecking Streamlit installation..." -ForegroundColor Yellow
$streamlitCheck = python -c "import streamlit" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Streamlit not found. Installing dependencies..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Streamlit is ready" -ForegroundColor Green

# Launch the Vibe-Tech UI
Write-Host "`n🚀 Launching Vibe-Tech UI..." -ForegroundColor Cyan
Write-Host "   📡 URL: http://localhost:8501" -ForegroundColor White
Write-Host "   🎨 Theme: Neon Glassmorphism" -ForegroundColor Magenta
Write-Host "   ⚡ Enhanced with Vibe-Tech styling`n" -ForegroundColor Cyan

Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Run Streamlit with the Vibe-Tech UI
streamlit run streamlit_vibe_ui.py --server.port 8501 --server.headless false --browser.gatherUsageStats false
