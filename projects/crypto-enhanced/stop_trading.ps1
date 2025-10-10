#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Graceful Trading Bot Shutdown

.DESCRIPTION
    Stops the trading bot gracefully with proper cleanup:
    1. Finds running trading processes
    2. Sends termination signal
    3. Waits for graceful shutdown
    4. Force kills if needed
    5. Cleans up lock files
    6. Shows final status

.NOTES
    Author: Auto-generated for Crypto Enhanced Trading System
    Date: 2025-10-07
    Version: 1.0.0
#>

param(
    [int]$GracefulTimeout = 30,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TRADING BOT SHUTDOWN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find trading processes
Write-Host "[STEP 1] Finding trading processes..." -ForegroundColor Yellow
$tradingProcesses = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    try {
        $cmdline = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdline) {
            return $cmdline -match "trading|kraken|crypto-enhanced|start_live"
        }
        return $false
    } catch {
        return $false
    }
}

if (-not $tradingProcesses) {
    Write-Host "[INFO] No trading processes found" -ForegroundColor Yellow
    Write-Host "[OK] System is already stopped" -ForegroundColor Green
    exit 0
}

Write-Host "[FOUND] $($tradingProcesses.Count) trading process(es):" -ForegroundColor Green
foreach ($proc in $tradingProcesses) {
    try {
        $runtime = (Get-Date) - $proc.StartTime
        Write-Host "  [PID $($proc.Id)] Runtime: $($runtime.ToString('hh\:mm\:ss'))" -ForegroundColor White
    } catch {
        Write-Host "  [PID $($proc.Id)] Status: Running" -ForegroundColor White
    }
}

# Step 2: Graceful shutdown
if (-not $Force) {
    Write-Host "`n[STEP 2] Sending termination signal..." -ForegroundColor Yellow
    foreach ($proc in $tradingProcesses) {
        try {
            $proc.CloseMainWindow() | Out-Null
            Write-Host "  [OK] Sent close signal to PID $($proc.Id)" -ForegroundColor Green
        } catch {
            Write-Host "  [WARN] Could not send close signal to PID $($proc.Id)" -ForegroundColor Yellow
        }
    }

    Write-Host "`n[WAIT] Waiting up to $GracefulTimeout seconds for graceful shutdown..." -ForegroundColor Yellow
    $waited = 0
    $allStopped = $false

    while ($waited -lt $GracefulTimeout -and -not $allStopped) {
        Start-Sleep -Seconds 2
        $waited += 2

        $stillRunning = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
            $_.Id -in $tradingProcesses.Id
        }

        if (-not $stillRunning) {
            $allStopped = $true
            Write-Host "[SUCCESS] All processes stopped gracefully" -ForegroundColor Green
        } else {
            Write-Host "  [WAIT] $($stillRunning.Count) process(es) still running... ($waited/$GracefulTimeout sec)" -ForegroundColor Yellow
        }
    }
}

# Step 3: Force kill if needed
$remainingProcesses = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.Id -in $tradingProcesses.Id
}

if ($remainingProcesses) {
    Write-Host "`n[STEP 3] Force killing remaining processes..." -ForegroundColor Red
    foreach ($proc in $remainingProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "  [KILLED] PID $($proc.Id)" -ForegroundColor Red
        } catch {
            Write-Host "  [ERROR] Failed to kill PID $($proc.Id): $_" -ForegroundColor Red
        }
    }

    # Final force kill
    Start-Process -FilePath "taskkill.exe" -ArgumentList "/F", "/IM", "python.exe", "/T" -Wait -NoNewWindow -ErrorAction SilentlyContinue
}

# Step 4: Cleanup lock files
Write-Host "`n[STEP 4] Cleaning up lock files..." -ForegroundColor Yellow
$lockFiles = @(
    "C:\dev\projects\crypto-enhanced\*.lock*",
    "$env:TEMP\*trading*.lock*",
    "$env:TEMP\*trading*.pid*",
    "$env:TEMP\*kraken*.lock*"
)

$filesRemoved = 0
foreach ($pattern in $lockFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Remove-Item -Path $file.FullName -Force -ErrorAction Stop
            $filesRemoved++
        } catch {
            Write-Host "  [WARN] Could not remove $($file.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host "[OK] Removed $filesRemoved lock file(s)" -ForegroundColor Green

# Step 5: Show final status
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SHUTDOWN COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Final status:" -ForegroundColor White
Write-Host "  - All trading processes stopped" -ForegroundColor Green
Write-Host "  - Lock files cleaned" -ForegroundColor Green
Write-Host "  - System ready for restart" -ForegroundColor Green
Write-Host ""
Write-Host "To view session logs: Get-Content trading_new.log -Tail 50" -ForegroundColor Yellow
Write-Host "To restart: .\launch_trading.ps1" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
