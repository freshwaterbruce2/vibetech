<#
.SYNOPSIS
    Start bot in current window (simplest method - no Start-Process)
#>

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "BOT STARTUP - CURRENT WINDOW METHOD" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

# Check if already running
$existing = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdLine -like "*start_live_trading*"
}

if ($existing) {
    Write-Host "[WARNING] Bot already running (PID: $($existing[0].Id))" -ForegroundColor Yellow
    Write-Host "Run Force-Stop-Trading.ps1 to stop it first" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "Starting bot in THIS window..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the bot" -ForegroundColor Yellow
Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Change to bot directory
Set-Location $BotPath

# Start bot directly with piped YES (works without Start-Process)
"YES" | & $VenvPython start_live_trading.py
