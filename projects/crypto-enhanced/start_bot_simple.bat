@echo off
REM Simple batch file to start trading bot with cleanup
echo Cleaning up any existing Python processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo Cleaning lock files...
del /F /Q "%TEMP%\*kraken-crypto-trading*" 2>nul
del /F /Q "C:\dev\projects\crypto-enhanced\trading_instance.lock" 2>nul

echo.
echo Starting trading bot with auto-confirm and force flags...
cd /d C:\dev\projects\crypto-enhanced
.\.venv\Scripts\python.exe start_live_trading.py --auto-confirm --force
