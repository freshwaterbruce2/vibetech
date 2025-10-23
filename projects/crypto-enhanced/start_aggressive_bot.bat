@echo off
REM AGGRESSIVE TRADING BOT - Faster trades, tighter stops
echo ========================================
echo STARTING AGGRESSIVE TRADING BOT
echo ========================================
echo.
echo Strategy Settings:
echo   * Buy signal: +0.2%% momentum
echo   * Profit target: 2%% gross (1.2%% net)
echo   * Stop loss: -0.3%% momentum
echo.
echo Cleaning up any existing Python processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting bot...
cd /d C:\dev\projects\crypto-enhanced
.\.venv\Scripts\python.exe ultra_simple_bot.py

pause
