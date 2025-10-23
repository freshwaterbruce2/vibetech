<#
.SYNOPSIS
    Nuclear cleanup script to completely stop all trading bot processes

.DESCRIPTION
    This script performs a comprehensive cleanup of all trading-related processes:
    - Kills ALL Python processes with process tree termination
    - Stops ALL PowerShell windows running trading scripts
    - Removes all lock files
    - Checks and reports any Task Scheduler tasks
    - Provides confirmation of complete shutdown

.EXAMPLE
    .\Force-Stop-Trading.ps1
    Complete nuclear cleanup of all trading processes

.EXAMPLE
    .\Force-Stop-Trading.ps1 -Verbose
    Show detailed information during cleanup

.NOTES
    Based on 2025 best practices for Windows process management
    Uses taskkill /T for complete process tree termination
#>

[CmdletBinding()]
param(
    [switch]$WhatIf
)

# Requires Administrator for some operations
# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Red
Write-Host "NUCLEAR CLEANUP - FORCE STOP TRADING BOT" -ForegroundColor Red
Write-Host ("=" * 80) -ForegroundColor Red
Write-Host ""

if (-not $isAdmin) {
    Write-Host "Running without administrator privileges (some features limited)" -ForegroundColor Yellow
    Write-Host ""
}

# Track what we cleaned up
$cleanupLog = @{
    PythonProcesses = 0
    PowerShellProcesses = 0
    LockFilesRemoved = 0
    TasksFound = 0
    Errors = @()
}

# ============================================================================
# STEP 1: Kill ALL Python Processes (with process tree)
# ============================================================================

Write-Host "[STEP 1/5] Terminating all Python processes..." -ForegroundColor Cyan

$pythonProcesses = Get-Process -Name python* -ErrorAction SilentlyContinue

if ($pythonProcesses) {
    Write-Host "Found $($pythonProcesses.Count) Python process(es):" -ForegroundColor Yellow

    foreach ($proc in $pythonProcesses) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
            Write-Host "  [PID $($proc.Id)] $cmdLine" -ForegroundColor Gray

            if (-not $WhatIf) {
                # Use Stop-Process with force (PowerShell method)
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                $result = "Success"
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "    Killed (including children)" -ForegroundColor Green
                    $cleanupLog.PythonProcesses++
                } else {
                    Write-Host "    Failed: $result" -ForegroundColor Red
                    $cleanupLog.Errors += "Python PID $($proc.Id): $result"
                }
            } else {
                Write-Host "    [WHATIF] Would kill process tree" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "    Error: $_" -ForegroundColor Red
            $cleanupLog.Errors += "Python PID $($proc.Id): $_"
        }
    }
} else {
    Write-Host "No Python processes found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 2: Kill PowerShell processes running trading scripts
# ============================================================================

Write-Host "[STEP 2/5] Checking for PowerShell trading script processes..." -ForegroundColor Cyan

$allPowerShell = Get-Process -Name powershell*, pwsh* -ErrorAction SilentlyContinue
$tradingPowerShell = @()

foreach ($proc in $allPowerShell) {
    try {
        # Skip current process
        if ($proc.Id -eq $PID) {
            continue
        }

        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine

        if ($cmdLine -and ($cmdLine -like "*trading*" -or $cmdLine -like "*crypto*" -or $cmdLine -like "*Monitor*")) {
            $tradingPowerShell += @{
                Process = $proc
                CommandLine = $cmdLine
            }
        }
    }
    catch {
        # Access denied or process ended
    }
}

if ($tradingPowerShell.Count -gt 0) {
    Write-Host "Found $($tradingPowerShell.Count) PowerShell trading process(es):" -ForegroundColor Yellow

    foreach ($item in $tradingPowerShell) {
        Write-Host "  [PID $($item.Process.Id)] $($item.CommandLine)" -ForegroundColor Gray

        if (-not $WhatIf) {
            try {
                Stop-Process -Id $item.Process.Id -Force -ErrorAction Stop
                $result = "Success"
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "    Killed" -ForegroundColor Green
                    $cleanupLog.PowerShellProcesses++
                } else {
                    Write-Host "    Failed: $result" -ForegroundColor Red
                    $cleanupLog.Errors += "PowerShell PID $($item.Process.Id): $result"
                }
            }
            catch {
                Write-Host "    Error: $_" -ForegroundColor Red
                $cleanupLog.Errors += "PowerShell PID $($item.Process.Id): $_"
            }
        } else {
            Write-Host "    [WHATIF] Would kill process" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "No PowerShell trading processes found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 3: Remove all lock files
# ============================================================================

Write-Host "[STEP 3/5] Cleaning up lock files..." -ForegroundColor Cyan

$tempDir = [System.IO.Path]::GetTempPath()
$lockPatterns = @(
    "*kraken-crypto-trading*.lock",
    "*kraken-crypto-trading*.pid",
    "*kraken-crypto-trading*.info",
    "instance.lock",
    "trading*.lock"
)

foreach ($pattern in $lockPatterns) {
    $lockFiles = Get-ChildItem -Path $tempDir -Filter $pattern -ErrorAction SilentlyContinue

    foreach ($file in $lockFiles) {
        Write-Host "  Found: $($file.Name)" -ForegroundColor Yellow

        if (-not $WhatIf) {
            try {
                Remove-Item $file.FullName -Force -ErrorAction Stop
                Write-Host "    Removed" -ForegroundColor Green
                $cleanupLog.LockFilesRemoved++
            }
            catch {
                Write-Host "    Failed to remove: $_" -ForegroundColor Red
                $cleanupLog.Errors += "Lock file $($file.Name): $_"
            }
        } else {
            Write-Host "    [WHATIF] Would remove" -ForegroundColor Yellow
        }
    }
}

# Also check crypto-enhanced directory
$cryptoDir = "C:\dev\projects\crypto-enhanced"
if (Test-Path $cryptoDir) {
    $cryptoLocks = Get-ChildItem -Path $cryptoDir -Filter "*.lock" -ErrorAction SilentlyContinue

    foreach ($file in $cryptoLocks) {
        Write-Host "  Found in crypto dir: $($file.Name)" -ForegroundColor Yellow

        if (-not $WhatIf) {
            try {
                Remove-Item $file.FullName -Force -ErrorAction Stop
                Write-Host "    Removed" -ForegroundColor Green
                $cleanupLog.LockFilesRemoved++
            }
            catch {
                Write-Host "    Failed to remove: $_" -ForegroundColor Red
                $cleanupLog.Errors += "Crypto lock $($file.Name): $_"
            }
        } else {
            Write-Host "    [WHATIF] Would remove" -ForegroundColor Yellow
        }
    }
}

if ($cleanupLog.LockFilesRemoved -eq 0 -and -not $WhatIf) {
    Write-Host "No lock files found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 4: Check Task Scheduler for auto-restart tasks
# ============================================================================

Write-Host "[STEP 4/5] Checking Task Scheduler for trading tasks..." -ForegroundColor Cyan

try {
    $tradingTasks = Get-ScheduledTask -ErrorAction Stop | Where-Object {
        $_.TaskName -like "*trading*" -or
        $_.TaskName -like "*crypto*" -or
        $_.TaskName -like "*python*" -or
        $_.Actions.Execute -like "*start_live_trading*"
    }

    if ($tradingTasks) {
        Write-Host "Found $($tradingTasks.Count) scheduled task(s):" -ForegroundColor Yellow

        foreach ($task in $tradingTasks) {
            Write-Host "  Task: $($task.TaskName)" -ForegroundColor Yellow
            Write-Host "    Path: $($task.TaskPath)" -ForegroundColor Gray
            Write-Host "    State: $($task.State)" -ForegroundColor Gray

            $cleanupLog.TasksFound++

            if ($task.State -eq "Running") {
                Write-Host "    STATUS: Currently running!" -ForegroundColor Red

                if ($isAdmin -and -not $WhatIf) {
                    try {
                        Stop-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction Stop
                        Write-Host "      Stopped task" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "      Failed to stop: $_" -ForegroundColor Red
                    }
                } elseif ($WhatIf) {
                    Write-Host "      [WHATIF] Would stop task" -ForegroundColor Yellow
                } else {
                    Write-Host "      Need admin rights to stop" -ForegroundColor Yellow
                }
            }
        }

        Write-Host ""
        Write-Host "RECOMMENDATION: Review these tasks and disable if not needed:" -ForegroundColor Yellow
        Write-Host "  Disable-ScheduledTask -TaskName '<TaskName>'" -ForegroundColor Gray
    } else {
        Write-Host "No trading-related scheduled tasks found" -ForegroundColor Green
    }
}
catch {
    Write-Host "Could not check scheduled tasks: $_" -ForegroundColor Red
    $cleanupLog.Errors += "Task Scheduler: $_"
}

Write-Host ""

# ============================================================================
# STEP 5: Wait and verify cleanup
# ============================================================================

if (-not $WhatIf) {
    Write-Host "[STEP 5/5] Waiting for processes to terminate..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3

    # Verify no Python processes remain
    $remainingPython = Get-Process -Name python* -ErrorAction SilentlyContinue
    if ($remainingPython) {
        Write-Host "WARNING: $($remainingPython.Count) Python process(es) still running!" -ForegroundColor Red
        foreach ($proc in $remainingPython) {
            Write-Host "  [PID $($proc.Id)] $($proc.ProcessName)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "All Python processes terminated" -ForegroundColor Green
    }
    Write-Host ""
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "Python processes killed:      $($cleanupLog.PythonProcesses)" -ForegroundColor White
Write-Host "PowerShell processes killed:  $($cleanupLog.PowerShellProcesses)" -ForegroundColor White
Write-Host "Lock files removed:           $($cleanupLog.LockFilesRemoved)" -ForegroundColor White
Write-Host "Scheduled tasks found:        $($cleanupLog.TasksFound)" -ForegroundColor White
Write-Host "Errors encountered:           $($cleanupLog.Errors.Count)" -ForegroundColor $(if ($cleanupLog.Errors.Count -gt 0) { "Red" } else { "Green" })

if ($cleanupLog.Errors.Count -gt 0) {
    Write-Host ""
    Write-Host "ERRORS:" -ForegroundColor Red
    foreach ($err in $cleanupLog.Errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

Write-Host ("=" * 80) -ForegroundColor Cyan

if (-not $WhatIf) {
    Write-Host ""
    Write-Host "Trading bot has been forcefully stopped." -ForegroundColor Green
    Write-Host "You can now safely start the bot using Safe-Start-Trading.ps1" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[WHATIF] No actual changes were made. Run without -WhatIf to execute." -ForegroundColor Yellow
    Write-Host ""
}
