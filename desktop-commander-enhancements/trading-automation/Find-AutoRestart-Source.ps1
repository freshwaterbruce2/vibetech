<#
.SYNOPSIS
    Diagnostic script to identify the source of trading bot auto-restart

.DESCRIPTION
    This script performs comprehensive diagnostics to find what's causing
    the trading bot to automatically restart after being killed:
    - Scheduled Tasks with trading/crypto/python keywords
    - PowerShell scripts in startup folders
    - Running PowerShell windows with trading-related command lines
    - Background jobs and services
    - Launch scripts (launch_trading.ps1, etc.)

.EXAMPLE
    .\Find-AutoRestart-Source.ps1
    Run complete diagnostic

.EXAMPLE
    .\Find-AutoRestart-Source.ps1 -Detailed
    Show additional technical details

.NOTES
    Based on 2025 best practices for Windows diagnostics
#>

[CmdletBinding()]
param(
    [switch]$Detailed
)

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "DIAGNOSTIC: FIND AUTO-RESTART SOURCE" -ForegroundColor Magenta
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host ""

$findings = @{
    ScheduledTasks = @()
    StartupItems = @()
    RunningScripts = @()
    BackgroundJobs = @()
    Services = @()
    Recommendations = @()
}

# ============================================================================
# CHECK 1: Scheduled Tasks
# ============================================================================

Write-Host "[CHECK 1/6] Scanning Scheduled Tasks..." -ForegroundColor Cyan

try {
    $allTasks = Get-ScheduledTask -ErrorAction Stop
    $suspiciousTasks = $allTasks | Where-Object {
        $taskKeywords = @("trading", "crypto", "python", "kraken", "bot", "monitor")
        $matches = $false

        foreach ($keyword in $taskKeywords) {
            if ($_.TaskName -like "*$keyword*") {
                $matches = $true
                break
            }
        }

        if ($matches) {
            return $true
        }

        # Check actions
        foreach ($action in $_.Actions) {
            $actionStr = "$($action.Execute) $($action.Arguments)".ToLower()
            foreach ($keyword in $taskKeywords) {
                if ($actionStr -like "*$keyword*") {
                    return $true
                }
            }
        }

        return $false
    }

    if ($suspiciousTasks) {
        Write-Host "Found $($suspiciousTasks.Count) suspicious scheduled task(s):" -ForegroundColor Yellow

        foreach ($task in $suspiciousTasks) {
            $taskInfo = [PSCustomObject]@{
                Name = $task.TaskName
                Path = $task.TaskPath
                State = $task.State
                LastRun = $task.LastRunTime
                NextRun = $task.NextRunTime
                Triggers = ($task.Triggers | ForEach-Object { $_.GetType().Name }) -join ", "
                Actions = ($task.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }) -join " | "
            }

            $findings.ScheduledTasks += $taskInfo

            Write-Host ""
            Write-Host "  Task: $($task.TaskName)" -ForegroundColor White
            Write-Host "    Path: $($task.TaskPath)" -ForegroundColor Gray
            Write-Host "    State: $($task.State)" -ForegroundColor $(if ($task.State -eq "Running") { "Red" } elseif ($task.State -eq "Ready") { "Yellow" } else { "Green" })
            Write-Host "    Last Run: $($task.LastRunTime)" -ForegroundColor Gray
            Write-Host "    Next Run: $($task.NextRunTime)" -ForegroundColor Gray
            Write-Host "    Triggers: $($taskInfo.Triggers)" -ForegroundColor Gray
            Write-Host "    Actions: $($taskInfo.Actions)" -ForegroundColor Gray

            if ($task.State -eq "Running" -or $task.State -eq "Ready") {
                $findings.Recommendations += "Review and possibly disable task: $($task.TaskName)"
            }
        }
    } else {
        Write-Host "No suspicious scheduled tasks found" -ForegroundColor Green
    }
}
catch {
    Write-Host "Error checking scheduled tasks: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# CHECK 2: Startup Folder Items
# ============================================================================

Write-Host "[CHECK 2/6] Checking Startup Folders..." -ForegroundColor Cyan

$startupPaths = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
)

foreach ($path in $startupPaths) {
    if (Test-Path $path) {
        $items = Get-ChildItem -Path $path -ErrorAction SilentlyContinue

        foreach ($item in $items) {
            $itemName = $item.Name.ToLower()
            $suspiciousKeywords = @("trading", "crypto", "python", "kraken", "bot")

            $isSuspicious = $false
            foreach ($keyword in $suspiciousKeywords) {
                if ($itemName -like "*$keyword*") {
                    $isSuspicious = $true
                    break
                }
            }

            if ($isSuspicious) {
                Write-Host "  Found in $($path):" -ForegroundColor Yellow
                Write-Host "    $($item.Name)" -ForegroundColor Yellow

                if ($Detailed) {
                    Write-Host "    Full path: $($item.FullName)" -ForegroundColor Gray
                }

                $findings.StartupItems += [PSCustomObject]@{
                    Name = $item.Name
                    Path = $item.FullName
                    Location = $path
                }

                $findings.Recommendations += "Remove startup item: $($item.Name)"
            }
        }
    }
}

if ($findings.StartupItems.Count -eq 0) {
    Write-Host "No suspicious startup items found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# CHECK 3: Running PowerShell Scripts
# ============================================================================

Write-Host "[CHECK 3/6] Scanning Running PowerShell Processes..." -ForegroundColor Cyan

$allPowerShell = Get-Process -Name powershell*, pwsh* -ErrorAction SilentlyContinue

foreach ($proc in $allPowerShell) {
    try {
        # Skip current process
        if ($proc.Id -eq $PID) {
            continue
        }

        $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue

        if ($procInfo -and $procInfo.CommandLine) {
            $cmdLine = $procInfo.CommandLine.ToLower()
            $keywords = @("trading", "crypto", "monitor", "start_live", "launch", "kraken")

            $matches = $false
            foreach ($keyword in $keywords) {
                if ($cmdLine -like "*$keyword*") {
                    $matches = $true
                    break
                }
            }

            if ($matches) {
                Write-Host "  [PID $($proc.Id)] Found suspicious PowerShell:" -ForegroundColor Yellow
                Write-Host "    Command: $($procInfo.CommandLine)" -ForegroundColor Gray
                Write-Host "    Started: $($proc.StartTime)" -ForegroundColor Gray

                $findings.RunningScripts += [PSCustomObject]@{
                    PID = $proc.Id
                    CommandLine = $procInfo.CommandLine
                    StartTime = $proc.StartTime
                }

                $findings.Recommendations += "Kill PowerShell process PID $($proc.Id) if not needed"
            }
        }
    }
    catch {
        # Access denied or process ended
    }
}

if ($findings.RunningScripts.Count -eq 0) {
    Write-Host "No suspicious PowerShell processes found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# CHECK 4: Background Jobs
# ============================================================================

Write-Host "[CHECK 4/6] Checking PowerShell Background Jobs..." -ForegroundColor Cyan

$jobs = Get-Job -ErrorAction SilentlyContinue

if ($jobs) {
    foreach ($job in $jobs) {
        $jobCommand = $job.Command.ToLower()
        if ($jobCommand -like "*trading*" -or $jobCommand -like "*crypto*" -or $jobCommand -like "*python*") {
            Write-Host "  Found suspicious background job:" -ForegroundColor Yellow
            Write-Host "    Name: $($job.Name)" -ForegroundColor Gray
            Write-Host "    State: $($job.State)" -ForegroundColor Gray
            Write-Host "    Command: $($job.Command)" -ForegroundColor Gray

            $findings.BackgroundJobs += [PSCustomObject]@{
                Name = $job.Name
                State = $job.State
                Command = $job.Command
            }

            $findings.Recommendations += "Remove background job: Remove-Job -Name '$($job.Name)'"
        }
    }
}

if ($findings.BackgroundJobs.Count -eq 0) {
    Write-Host "No suspicious background jobs found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# CHECK 5: Windows Services
# ============================================================================

Write-Host "[CHECK 5/6] Checking Windows Services..." -ForegroundColor Cyan

$services = Get-Service -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -like "*trading*" -or
    $_.Name -like "*crypto*" -or
    $_.DisplayName -like "*trading*" -or
    $_.DisplayName -like "*crypto*"
}

if ($services) {
    foreach ($service in $services) {
        Write-Host "  Found suspicious service:" -ForegroundColor Yellow
        Write-Host "    Name: $($service.Name)" -ForegroundColor Gray
        Write-Host "    Display Name: $($service.DisplayName)" -ForegroundColor Gray
        Write-Host "    Status: $($service.Status)" -ForegroundColor Gray

        $findings.Services += [PSCustomObject]@{
            Name = $service.Name
            DisplayName = $service.DisplayName
            Status = $service.Status
        }

        if ($service.Status -eq "Running") {
            $findings.Recommendations += "Stop and disable service: $($service.Name)"
        }
    }
}

if ($findings.Services.Count -eq 0) {
    Write-Host "No suspicious services found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# CHECK 6: Launch Scripts in Crypto Directory
# ============================================================================

Write-Host "[CHECK 6/6] Checking for launch scripts..." -ForegroundColor Cyan

$cryptoDir = "C:\dev\projects\crypto-enhanced"
if (Test-Path $cryptoDir) {
    $launchScripts = Get-ChildItem -Path $cryptoDir -Filter "*launch*.ps1" -ErrorAction SilentlyContinue

    foreach ($script in $launchScripts) {
        Write-Host "  Found launch script: $($script.Name)" -ForegroundColor Yellow
        Write-Host "    Path: $($script.FullName)" -ForegroundColor Gray
        Write-Host "    Last Modified: $($script.LastWriteTime)" -ForegroundColor Gray

        # Check if it's running
        $runningProcs = Get-Process -Name powershell*, pwsh* -ErrorAction SilentlyContinue
        foreach ($proc in $runningProcs) {
            try {
                $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
                if ($procInfo.CommandLine -like "*$($script.Name)*") {
                    Write-Host "    STATUS: Currently running (PID: $($proc.Id))" -ForegroundColor Red
                }
            }
            catch {
                # Ignore
            }
        }

        $findings.Recommendations += "Review launch script: $($script.Name)"
    }

    if ($launchScripts.Count -eq 0) {
        Write-Host "No launch scripts found in crypto directory" -ForegroundColor Green
    }
} else {
    Write-Host "Crypto directory not found: $cryptoDir" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# SUMMARY AND RECOMMENDATIONS
# ============================================================================

Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "DIAGNOSTIC SUMMARY" -ForegroundColor Magenta
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "Scheduled Tasks:      $($findings.ScheduledTasks.Count)" -ForegroundColor White
Write-Host "Startup Items:        $($findings.StartupItems.Count)" -ForegroundColor White
Write-Host "Running Scripts:      $($findings.RunningScripts.Count)" -ForegroundColor White
Write-Host "Background Jobs:      $($findings.BackgroundJobs.Count)" -ForegroundColor White
Write-Host "Services:             $($findings.Services.Count)" -ForegroundColor White
Write-Host ""

if ($findings.Recommendations.Count -gt 0) {
    Write-Host "RECOMMENDATIONS:" -ForegroundColor Yellow
    Write-Host ""
    $findings.Recommendations | Select-Object -Unique | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "ACTION REQUIRED: Review these items to prevent auto-restart" -ForegroundColor Red
} else {
    Write-Host "No auto-restart mechanisms detected" -ForegroundColor Green
    Write-Host "The bot may be restarting due to:" -ForegroundColor Yellow
    Write-Host "  - Manual execution from another terminal" -ForegroundColor Gray
    Write-Host "  - A hidden/minimized PowerShell window" -ForegroundColor Gray
    Write-Host "  - A process not detected by this scan" -ForegroundColor Gray
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Magenta

# Export detailed findings to JSON if requested
if ($Detailed) {
    $exportPath = Join-Path $PSScriptRoot "diagnostic-findings.json"
    $findings | ConvertTo-Json -Depth 5 | Out-File $exportPath
    Write-Host ""
    Write-Host "Detailed findings exported to: $exportPath" -ForegroundColor Cyan
    Write-Host ""
}
