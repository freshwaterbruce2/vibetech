<#
.SYNOPSIS
    Start bot with auto-confirmation using file-based input (Start-Process limitation workaround)
#>

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"
$Script = "$BotPath\start_live_trading.py"

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "BOT STARTUP - FILE-BASED INPUT METHOD" -ForegroundColor Green
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

Write-Host "Creating temporary input file..." -ForegroundColor Cyan

# Create temp file with YES input
$tempInput = [System.IO.Path]::GetTempFileName()
"YES" | Out-File -FilePath $tempInput -Encoding ASCII -NoNewline

Write-Host "Starting bot in new window with file-based input..." -ForegroundColor Yellow
Write-Host ""

try {
    # Use -RedirectStandardInput with file
    $process = Start-Process -FilePath $VenvPython `
        -ArgumentList $Script `
        -WorkingDirectory $BotPath `
        -RedirectStandardInput $tempInput `
        -PassThru `
        -NoNewWindow:$false

    Write-Host "Bot starting (PowerShell PID: $($process.Id))..." -ForegroundColor Yellow
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
        Write-Host ""
    } else {
        Write-Host "[INFO] Checking log for errors..." -ForegroundColor Yellow
        $logPath = "$BotPath\trading_new.log"
        if (Test-Path $logPath) {
            $recentLog = Get-Content $logPath -Tail 5
            Write-Host ""
            Write-Host "Recent log entries:" -ForegroundColor Gray
            $recentLog | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
        Write-Host ""
        Write-Host "Check: $logPath" -ForegroundColor Cyan
    }

    Write-Host ""
}
catch {
    Write-Host "[ERROR] Failed to start: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Clean up temp file
    if (Test-Path $tempInput) {
        Remove-Item $tempInput -Force -ErrorAction SilentlyContinue
    }
}
