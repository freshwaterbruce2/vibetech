<#
.SYNOPSIS
    Safe startup script for crypto trading bot with complete cleanup

.DESCRIPTION
    This script provides a safe, one-command way to start the trading bot:
    1. Runs complete cleanup (Force-Stop-Trading.ps1)
    2. Waits for all processes to terminate
    3. Verifies no processes remain
    4. Optionally runs diagnostics to find auto-restart sources
    5. Starts monitoring script (Monitor-TradingBot-v2.ps1)
    6. Monitors for 60 seconds to ensure no auto-restart occurs

.PARAMETER SkipDiagnostics
    Skip the diagnostic scan for auto-restart sources

.PARAMETER StartMonitoring
    Automatically start the monitoring script after cleanup

.EXAMPLE
    .\Safe-Start-Trading.ps1
    Complete safe startup with diagnostics

.EXAMPLE
    .\Safe-Start-Trading.ps1 -SkipDiagnostics -StartMonitoring
    Quick startup without diagnostics, auto-start monitoring

.NOTES
    This is the recommended way to start the trading bot
#>

[CmdletBinding()]
param(
    [switch]$SkipDiagnostics,
    [switch]$StartMonitoring
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "SAFE TRADING BOT STARTUP PROCEDURE" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

# Step 1: Nuclear Cleanup
Write-Host "[STEP 1/5] Running nuclear cleanup..." -ForegroundColor Cyan
Write-Host ""

$cleanupScript = Join-Path $ScriptDir "Force-Stop-Trading.ps1"
if (Test-Path $cleanupScript) {
    & $cleanupScript
    if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
        Write-Host "Cleanup encountered issues but continuing..." -ForegroundColor Yellow
    }
}
else {
    Write-Error "Force-Stop-Trading.ps1 not found in: $ScriptDir"
    exit 1
}

Write-Host ""

# Step 2: Wait for Complete Termination
Write-Host "[STEP 2/5] Waiting for complete process termination..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

$pythonProcs = Get-Process -Name python* -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "WARNING: $($pythonProcs.Count) Python process(es) still running!" -ForegroundColor Yellow
    Write-Host "Waiting additional 5 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    $pythonProcs = Get-Process -Name python* -ErrorAction SilentlyContinue
    if ($pythonProcs) {
        Write-Host ""
        Write-Host "ERROR: Python processes did not terminate!" -ForegroundColor Red
        Write-Host "Manual intervention required. Processes:" -ForegroundColor Red
        foreach ($proc in $pythonProcs) {
            Write-Host "  PID: $($proc.Id)" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "Run this command to force kill:" -ForegroundColor Yellow
        Write-Host "  Get-Process python | Stop-Process -Force" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host "All processes terminated successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Diagnostics (Optional)
if (-not $SkipDiagnostics) {
    Write-Host "[STEP 3/5] Running diagnostic scan for auto-restart sources..." -ForegroundColor Cyan
    Write-Host ""

    $diagnosticScript = Join-Path $ScriptDir "Find-AutoRestart-Source.ps1"
    if (Test-Path $diagnosticScript) {
        & $diagnosticScript
    }
    else {
        Write-Warning "Find-AutoRestart-Source.ps1 not found, skipping diagnostics"
    }

    Write-Host ""
    Write-Host "Review any findings above before continuing..." -ForegroundColor Yellow
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}
else {
    Write-Host "[STEP 3/5] Diagnostics skipped" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Verify Clean State
Write-Host "[STEP 4/5] Verifying clean state..." -ForegroundColor Cyan

$pythonProcs = Get-Process -Name python* -ErrorAction SilentlyContinue
$tradingPowerShell = Get-Process -Name powershell*, pwsh* -ErrorAction SilentlyContinue | Where-Object {
    try {
        $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue
        $procInfo.CommandLine -like "*trading*" -or $procInfo.CommandLine -like "*crypto*"
    }
    catch {
        $false
    }
}

if ($pythonProcs) {
    Write-Host "WARNING: Found $($pythonProcs.Count) Python process(es)" -ForegroundColor Yellow
}
elseif ($tradingPowerShell) {
    Write-Host "WARNING: Found $($tradingPowerShell.Count) trading PowerShell process(es)" -ForegroundColor Yellow
}
else {
    Write-Host "System is clean - ready to start" -ForegroundColor Green
}

Write-Host ""

# Step 5: Start Monitoring or Wait
if ($StartMonitoring) {
    Write-Host "[STEP 5/5] Starting monitoring script..." -ForegroundColor Cyan
    Write-Host ""

    $monitorScript = Join-Path $ScriptDir "Monitor-TradingBot-v2.ps1"
    if (Test-Path $monitorScript) {
        Write-Host "Launching Monitor-TradingBot-v2.ps1..." -ForegroundColor Green
        Write-Host "The monitoring script will start in a new window." -ForegroundColor Cyan
        Write-Host ""

        Start-Process powershell.exe -ArgumentList "-NoExit", "-File", "`"$monitorScript`""

        Write-Host "Monitoring script launched successfully!" -ForegroundColor Green
    }
    else {
        Write-Error "Monitor-TradingBot-v2.ps1 not found in: $ScriptDir"
        exit 1
    }
}
else {
    Write-Host "[STEP 5/5] Monitoring for auto-restart (60 seconds)..." -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Watching for unexpected process starts..." -ForegroundColor Gray

    for ($i = 1; $i -le 12; $i++) {
        Start-Sleep -Seconds 5

        $pythonProcs = Get-Process -Name python* -ErrorAction SilentlyContinue
        if ($pythonProcs) {
            Write-Host ""
            Write-Host "ALERT: Python process detected!" -ForegroundColor Red
            Write-Host "Auto-restart mechanism may be active!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Process details:" -ForegroundColor Yellow
            foreach ($proc in $pythonProcs) {
                try {
                    $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
                    Write-Host "  [PID $($proc.Id)] $($procInfo.CommandLine)" -ForegroundColor Gray
                }
                catch {
                    Write-Host "  [PID $($proc.Id)] Command line not accessible" -ForegroundColor Gray
                }
            }
            Write-Host ""
            Write-Host "Run Find-AutoRestart-Source.ps1 to identify the source!" -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }

        Write-Host "  $($i * 5)s - No unexpected processes" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "No auto-restart detected - system is stable!" -ForegroundColor Green
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "SAFE STARTUP COMPLETE" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

if (-not $StartMonitoring) {
    Write-Host "You can now safely start the bot using:" -ForegroundColor Cyan
    Write-Host "  .\Monitor-TradingBot-v2.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run this script with -StartMonitoring to auto-start" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Your trading bot environment is ready!" -ForegroundColor Green
Write-Host ""
