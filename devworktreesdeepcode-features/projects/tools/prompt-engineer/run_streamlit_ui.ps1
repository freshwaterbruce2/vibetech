# Prompt Engineer - Streamlit UI Launcher
# PowerShell script for Windows 11

param(
    [switch]$Install,
    [switch]$Help
)

function Show-Header {
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "    Prompt Engineer - Streamlit UI" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-Host "Usage:" -ForegroundColor Green
    Write-Host "  .\run_streamlit_ui.ps1         # Start the UI"
    Write-Host "  .\run_streamlit_ui.ps1 -Install # Install dependencies first"
    Write-Host "  .\run_streamlit_ui.ps1 -Help    # Show this help"
    Write-Host ""
    Write-Host "Description:" -ForegroundColor Green
    Write-Host "  Interactive web interface for the Prompt Engineer tool."
    Write-Host "  Provides visual project selection, template cards, and"
    Write-Host "  easy copy-to-clipboard functionality."
    Write-Host ""
}

function Test-Dependencies {
    Write-Host "[INFO] Checking dependencies..." -ForegroundColor Blue
    
    try {
        python -c "import streamlit" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARNING] Streamlit not found. Installing..." -ForegroundColor Yellow
            pip install streamlit>=1.28.0
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERROR] Failed to install Streamlit" -ForegroundColor Red
                return $false
            }
        }
        Write-Host "[OK] Dependencies check passed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERROR] Python not found or not accessible" -ForegroundColor Red
        return $false
    }
}

function Start-StreamlitUI {
    Write-Host "[INFO] Starting Streamlit UI..." -ForegroundColor Blue
    Write-Host ""
    Write-Host "The web interface will open in your default browser." -ForegroundColor Green
    Write-Host "If it doesn't open automatically, go to: http://localhost:8501" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server when done." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        streamlit run streamlit_ui.py --browser.gatherUsageStats=false
    }
    catch {
        Write-Host "[ERROR] Failed to start Streamlit: $_" -ForegroundColor Red
        Write-Host "Make sure you're in the correct directory and dependencies are installed." -ForegroundColor Yellow
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Show-Header

if ($Install) {
    Write-Host "Installing dependencies..." -ForegroundColor Blue
    pip install -r requirements.txt
    Write-Host "[OK] Installation complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run: .\run_streamlit_ui.ps1" -ForegroundColor Yellow
    exit 0
}

# Check if we're in the right directory
if (-not (Test-Path "streamlit_ui.py")) {
    Write-Host "[ERROR] streamlit_ui.py not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the prompt-engineer directory." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Navigate to the correct directory:" -ForegroundColor Green
    Write-Host "  cd C:\dev\projects\tools\prompt-engineer" -ForegroundColor Yellow
    exit 1
}

# Check and install dependencies
if (-not (Test-Dependencies)) {
    Write-Host "Please fix dependency issues and try again." -ForegroundColor Red
    exit 1
}

# Start the UI
Start-StreamlitUI

Write-Host ""
Write-Host "Application closed." -ForegroundColor Green