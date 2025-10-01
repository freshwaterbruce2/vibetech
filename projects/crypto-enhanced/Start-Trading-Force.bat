@echo off
REM Crypto Enhanced Trading System - Force Restart Wrapper
REM Use this to kill existing instances and start fresh

echo.
echo ===============================================
echo  Crypto Enhanced Trading System - FORCE RESTART
echo ===============================================
echo.
echo WARNING: This will terminate all existing trading processes!
echo.
set /p confirm="Are you sure you want to continue? (Y/N): "

if /i not "%confirm%"=="Y" (
    echo Cancelled by user.
    pause
    exit /b 0
)

echo.
echo Force restarting trading system...
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Execute the PowerShell script with force flag
powershell -ExecutionPolicy Bypass -File "launch_trading.ps1" -Force

REM Check the exit code
if errorlevel 1 (
    echo.
    echo ===============================================
    echo  Force restart failed! Check the error messages above.
    echo ===============================================
    echo.
    pause
) else (
    echo.
    echo ===============================================
    echo  Trading system restarted successfully!
    echo ===============================================
    echo.
    echo The trading system is now running in the background.
    echo Check the logs folder for activity.
    echo.
    echo Press any key to close this window...
    pause >nul
)