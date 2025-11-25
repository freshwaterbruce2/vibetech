@echo off
echo ====================================
echo Testing Kraken API Credentials
echo ====================================
echo.

cd /d C:\dev\projects\crypto-enhanced
python test_keys_now.py

echo.
echo Test complete. Press any key to exit...
pause >nul
