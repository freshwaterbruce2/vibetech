#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Continuous Trading Bot Health Monitor

.DESCRIPTION
    Monitors trading bot health and automatically kills duplicate instances:
    1. Checks for multiple instances every 60 seconds
    2. Auto-kills duplicates (keeps oldest)
    3. Monitors nonce errors in logs
    4. Alerts on API issues
    5. Suggests corrective actions

.NOTES
    Author: Auto-generated for Crypto Enhanced Trading System
    Date: 2025-10-07
    Version: 1.0.0

.EXAMPLE
    .\check_trading_health.ps1
    .\check_trading_health.ps1 -Interval 30 -AutoKill
#>

param(
    [int]$Interval = 60,
    [switch]$AutoKill,
    [switch]$Continuous
)

$ErrorActionPreference = "Continue"

function Get-TradingProcesses {
    return Get-Process python -ErrorAction SilentlyContinue | Where-Object {
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
}

function Check-NonceErrors {
    $logFile = "C:\dev\projects\crypto-enhanced\trading_new.log"
    if (-not (Test-Path $logFile)) {
        return @{HasErrors = $false; Count = 0}
    }

    $recentLines = Get-Content $logFile -Tail 100 -ErrorAction SilentlyContinue
    $nonceErrors = $recentLines | Where-Object { $_ -match "Invalid nonce|EAPI:Invalid nonce" }

    return @{
        HasErrors = ($nonceErrors.Count -gt 0)
        Count = $nonceErrors.Count
        Recent = $nonceErrors | Select-Object -Last 3
    }
}

function Check-MultipleInstances {
    $processes = Get-TradingProcesses

    if ($processes.Count -eq 0) {
        return @{
            Status = "STOPPED"
            Count = 0
            Processes = @()
        }
    } elseif ($processes.Count -eq 1) {
        return @{
            Status = "HEALTHY"
            Count = 1
            Processes = $processes
        }
    } else {
        return @{
            Status = "CRITICAL"
            Count = $processes.Count
            Processes = $processes
        }
    }
}

function Kill-DuplicateInstances {
    param([array]$Processes)

    # Keep the oldest instance, kill the rest
    $sorted = $processes | Sort-Object StartTime
    $toKeep = $sorted[0]
    $toKill = $sorted | Select-Object -Skip 1

    Write-Host "`n[AUTO-KILL] Killing duplicate instances..." -ForegroundColor Red
    Write-Host "[KEEP] PID $($toKeep.Id) - Started: $($toKeep.StartTime)" -ForegroundColor Green

    foreach ($proc in $toKill) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "[KILLED] PID $($proc.Id) - Started: $($proc.StartTime)" -ForegroundColor Red
        } catch {
            Write-Host "[ERROR] Failed to kill PID $($proc.Id): $_" -ForegroundColor Yellow
        }
    }

    return $toKill.Count
}

function Show-HealthReport {
    param(
        $InstanceCheck,
        $NonceCheck
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "TRADING BOT HEALTH REPORT" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Time: $timestamp" -ForegroundColor White
    Write-Host ""

    # Instance Status
    Write-Host "Instance Status: " -NoNewline
    switch ($InstanceCheck.Status) {
        "HEALTHY" {
            Write-Host "HEALTHY" -ForegroundColor Green
            $proc = $InstanceCheck.Processes[0]
            $runtime = (Get-Date) - $proc.StartTime
            Write-Host "  PID: $($proc.Id)" -ForegroundColor White
            Write-Host "  Runtime: $($runtime.ToString('hh\:mm\:ss'))" -ForegroundColor White
            Write-Host "  Memory: $([math]::Round($proc.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor White
        }
        "CRITICAL" {
            Write-Host "CRITICAL - MULTIPLE INSTANCES!" -ForegroundColor Red
            Write-Host "  Count: $($InstanceCheck.Count)" -ForegroundColor Red
            foreach ($proc in $InstanceCheck.Processes) {
                $runtime = (Get-Date) - $proc.StartTime
                Write-Host "  [PID $($proc.Id)] Runtime: $($runtime.ToString('hh\:mm\:ss'))" -ForegroundColor Yellow
            }
        }
        "STOPPED" {
            Write-Host "STOPPED" -ForegroundColor Yellow
            Write-Host "  No trading processes found" -ForegroundColor Yellow
        }
    }

    Write-Host ""

    # Nonce Errors
    Write-Host "Nonce Health: " -NoNewline
    if ($NonceCheck.HasErrors) {
        Write-Host "ERRORS DETECTED" -ForegroundColor Red
        Write-Host "  Error count (last 100 lines): $($NonceCheck.Count)" -ForegroundColor Red
        if ($NonceCheck.Recent) {
            Write-Host "  Recent errors:" -ForegroundColor Yellow
            foreach ($err in $NonceCheck.Recent) {
                Write-Host "    $($err.Trim())" -ForegroundColor Yellow
            }
        }
        Write-Host "`n  [RECOMMENDATION] Consider:" -ForegroundColor Yellow
        Write-Host "    1. Restart bot: .\stop_trading.ps1 && .\launch_trading.ps1" -ForegroundColor Yellow
        Write-Host "    2. Generate new API keys if errors persist" -ForegroundColor Yellow
        Write-Host "    3. Check for duplicate instances" -ForegroundColor Yellow
    } else {
        Write-Host "HEALTHY" -ForegroundColor Green
        Write-Host "  No nonce errors detected" -ForegroundColor Green
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
}

# Main monitoring loop
$iteration = 0
do {
    $iteration++

    if ($iteration -gt 1) {
        Write-Host "`n[WAIT] Sleeping for $Interval seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds $Interval
    }

    $instanceCheck = Check-MultipleInstances
    $nonceCheck = Check-NonceErrors

    Show-HealthReport -InstanceCheck $instanceCheck -NonceCheck $nonceCheck

    # Auto-kill duplicates if enabled
    if ($AutoKill -and $instanceCheck.Status -eq "CRITICAL") {
        $killed = Kill-DuplicateInstances -Processes $instanceCheck.Processes
        Write-Host "[OK] Killed $killed duplicate instance(s)" -ForegroundColor Green
    }

} while ($Continuous)

Write-Host "`n[INFO] Health check complete" -ForegroundColor Green
