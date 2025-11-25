@echo off
echo ============================================================
echo RESTARTING OPTIMIZED TRADING BOT
echo ============================================================
echo.
echo [1/3] Stopping any running bot instances...
taskkill /F /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq *ultra_simple*" 2>nul
timeout /t 2 >nul

echo.
echo [2/3] Cleaning up lock files...
cd /d C:\dev\projects\crypto-enhanced
if exist *.lock del /Q *.lock

echo.
echo [3/3] Starting OPTIMIZED bot with new settings...
echo.
echo NEW SETTINGS:
echo   - Buy Trigger: +0.1%% momentum (was +0.2%%)
echo   - Profit Target: +1.5%% gross (was +2.0%%)
echo   - Stop Loss: -0.2%% momentum (was -0.3%%)
echo.
echo Starting in 3 seconds...
timeout /t 3 >nul

.\.venv\Scripts\python.exe ultra_simple_bot.py

pause
