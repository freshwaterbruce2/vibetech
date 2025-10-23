<#
.SYNOPSIS
    Quick bot startup with error diagnosis
#>

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"
$Script = "$BotPath\start_live_trading.py"

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "QUICK BOT STARTUP" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Python not found: $VenvPython" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python found" -ForegroundColor Green

if (-not (Test-Path $Script)) {
    Write-Host "[ERROR] Script not found: $Script" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Script found" -ForegroundColor Green

# Check if already running
$existing = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdLine -like "*start_live_trading*"
}

if ($existing) {
    Write-Host ""
    Write-Host "[WARNING] Bot already running (PID: $($existing[0].Id))" -ForegroundColor Yellow
    Write-Host "Kill it first with: .\Force-Stop-Trading.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "[OK] No existing bot process" -ForegroundColor Green
Write-Host ""

# Start the bot
Write-Host "Starting bot in new window..." -ForegroundColor Cyan
Write-Host "  Command: echo YES | python start_live_trading.py" -ForegroundColor Gray
Write-Host ""

try {
    $process = Start-Process powershell.exe -ArgumentList `
        "-NoExit", `
        "-WorkingDirectory", $BotPath, `
        "-Command", "& '$VenvPython' start_live_trading.py" `
        -PassThru

    Write-Host "PowerShell window launched (PID: $($process.Id))" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting 5 seconds for bot to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    # Check if bot process appeared
    $botProcess = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        $cmdLine -like "*start_live_trading*"
    }

    if ($botProcess) {
        Write-Host ""
        Write-Host "[SUCCESS] Bot started successfully!" -ForegroundColor Green
        Write-Host "  Bot PID: $($botProcess[0].Id)" -ForegroundColor White
        Write-Host "  PowerShell PID: $($process.Id)" -ForegroundColor White
        Write-Host ""
        Write-Host "Type 'YES' in the PowerShell window to confirm live trading" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[WARNING] Bot process not detected" -ForegroundColor Yellow
        Write-Host "The PowerShell window is open - check it for errors or prompts" -ForegroundColor Gray
        Write-Host ""
    }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to start: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
