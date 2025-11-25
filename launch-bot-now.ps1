# Launch bot with all fixes applied
$ErrorActionPreference = "Continue"

Write-Host "="*80 -ForegroundColor Green
Write-Host "LAUNCHING TRADING BOT WITH URGENT FIXES" -ForegroundColor Green
Write-Host "="*80 -ForegroundColor Green
Write-Host ""

# Kill any existing Python processes
Write-Host "[1/3] Cleaning up existing Python processes..." -ForegroundColor Cyan
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  Done" -ForegroundColor Green

# Clean lock files
Write-Host "[2/3] Cleaning lock files..." -ForegroundColor Cyan
Remove-Item "$env:TEMP\*kraken-crypto-trading*" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\dev\projects\crypto-enhanced\trading_instance.lock" -Force -ErrorAction SilentlyContinue
Write-Host "  Done" -ForegroundColor Green

# Start bot
Write-Host "[3/3] Starting bot with --auto-confirm --force..." -ForegroundColor Cyan
Write-Host ""
Write-Host "="*80 -ForegroundColor Yellow
Write-Host "BOT OUTPUT (Press Ctrl+C in bot window to stop)" -ForegroundColor Yellow
Write-Host "="*80 -ForegroundColor Yellow
Write-Host ""

Set-Location "C:\dev\projects\crypto-enhanced"
& ".\.venv\Scripts\python.exe" "start_live_trading.py" "--auto-confirm" "--force"
