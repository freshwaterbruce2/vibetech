#!/usr/bin/env pwsh
# Nuclear Trading Bot Launcher - ZERO TOLERANCE for duplicate instances
# Version: 1.0.0

param([switch]$Force, [switch]$NoConfirm, [int]$Timeout = 30)
$ErrorActionPreference = "Stop"

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "NUCLEAR TRADING BOT LAUNCHER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill ALL existing trading processes
Write-Host "[STEP 1] Killing existing processes..." -ForegroundColor Yellow
taskkill /F /IM python.exe /T 2>$null | Out-Null
Write-Host "[OK] All Python processes terminated" -ForegroundColor Green

# Remove ALL lock files
Write-Host "[STEP 2] Removing lock files..." -ForegroundColor Yellow
Remove-Item -Path "*.lock*","nonce_state*.json","$env:TEMP\*trading*.lock*" -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Lock files cleaned" -ForegroundColor Green

# Wait for cleanup
Write-Host "[WAIT] Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Launch trading bot
Write-Host "[LAUNCH] Starting trading bot..." -ForegroundColor Green
echo YES | python start_live_trading.py
