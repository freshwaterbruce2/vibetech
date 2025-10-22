<#
.SYNOPSIS
    Start bot with automatic YES confirmation (no manual input needed)
#>

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"
$Script = "$BotPath\start_live_trading.py"

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "AUTO-CONFIRMED BOT STARTUP" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

# Check prerequisites
if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Python not found: $VenvPython" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $Script)) {
    Write-Host "[ERROR] Script not found: $Script" -ForegroundColor Red
    exit 1
}

# Check if already running
$existing = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdLine -like "*start_live_trading*"
}

if ($existing) {
    Write-Host "[WARNING] Bot already running (PID: $($existing[0].Id))" -ForegroundColor Yellow
    exit 0
}

Write-Host "Starting bot with auto-confirmation..." -ForegroundColor Cyan
Write-Host ""

try {
    # Start in new window with echo YES piped to python
    $startCmd = "Set-Location '$BotPath'; echo YES | & '$VenvPython' start_live_trading.py; Write-Host ''; Write-Host 'Bot stopped. Press any key to close...'; `$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')"

    $process = Start-Process powershell.exe -ArgumentList `
        "-NoExit", `
        "-Command", $startCmd `
        -PassThru

    Write-Host "Bot starting in new window (PowerShell PID: $($process.Id))..." -ForegroundColor Yellow
    Start-Sleep -Seconds 7

    # Check if bot process appeared
    $botProcess = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        $cmdLine -like "*start_live_trading*"
    }

    Write-Host ""
    if ($botProcess) {
        Write-Host "[SUCCESS] Bot is running!" -ForegroundColor Green
        Write-Host "  Bot PID: $($botProcess[0].Id)" -ForegroundColor White
        Write-Host "  Window PID: $($process.Id)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check the PowerShell window for bot output" -ForegroundColor Cyan
    } else {
        Write-Host "[WARNING] Bot process not detected" -ForegroundColor Yellow
        Write-Host "Possible reasons:" -ForegroundColor Gray
        Write-Host "  1. Duplicate instance lock prevented startup" -ForegroundColor Gray
        Write-Host "  2. Configuration error" -ForegroundColor Gray
        Write-Host "  3. Check the PowerShell window for error messages" -ForegroundColor Gray
    }

    Write-Host ""
}
catch {
    Write-Host "[ERROR] Failed to start: $_" -ForegroundColor Red
    exit 1
}
