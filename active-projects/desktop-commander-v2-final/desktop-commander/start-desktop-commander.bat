@echo off
REM Desktop Commander Startup Script - Batch wrapper
REM Double-click this file to launch Desktop Commander

echo Starting Desktop Commander...
powershell -ExecutionPolicy Bypass -File "%~dp0start-desktop-commander.ps1"
