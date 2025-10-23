@echo off
echo Running PATH fix as Administrator...
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -NoProfile -File C:\dev\Fix-PATH.ps1' -Verb RunAs"
echo.
echo PATH fix complete! Close all PowerShell windows and restart VS Code to see changes.
pause
