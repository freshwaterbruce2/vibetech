@echo off
REM Crypto Enhanced Trading System - Easy Launch Wrapper
REM Double-click this file to start the trading system

echo.
echo ===============================================
echo  Crypto Enhanced Trading System Launcher
echo ===============================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available on this system
    echo Please install PowerShell or run manually:
    echo   .venv\Scripts\python.exe start_live_trading.py
    pause
    exit /b 1
)

echo Starting PowerShell launcher...
echo.

REM Execute the PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "launch_trading.ps1"

REM Check the exit code
if errorlevel 1 (
    echo.
    echo ===============================================
    echo  Launch failed! Check the error messages above.
    echo ===============================================
    echo.
    echo Troubleshooting tips:
    echo 1. Make sure virtual environment is set up: python -m venv .venv
    echo 2. Install dependencies: .venv\Scripts\pip install -r requirements.txt
    echo 3. Check your Kraken API credentials in .env file
    echo 4. Use force restart: Start-Trading-Force.bat
    echo.
    pause
) else (
    echo.
    echo ===============================================
    echo  Trading system started successfully!
    echo ===============================================
    echo.
    echo The trading system is now running in the background.
    echo Check the logs folder for activity.
    echo.
    echo Press any key to close this window...
    pause >nul
)