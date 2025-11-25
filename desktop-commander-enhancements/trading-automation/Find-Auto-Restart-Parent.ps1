<#
.SYNOPSIS
    Find the ACTUAL source of Python auto-restart by monitoring parent processes

.DESCRIPTION
    This script monitors in real-time to catch what's spawning Python processes
#>

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "AUTO-RESTART PARENT PROCESS DETECTOR" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current state
Write-Host "[STEP 1] Checking current Python processes..." -ForegroundColor Cyan

$pythonProcs = Get-Process -Name python* -ErrorAction SilentlyContinue

if ($pythonProcs) {
    Write-Host "Found $($pythonProcs.Count) Python process(es):" -ForegroundColor Yellow

    foreach ($proc in $pythonProcs) {
        $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue

        Write-Host ""
        Write-Host "  PID: $($proc.Id)" -ForegroundColor White
        Write-Host "  Command: $($procInfo.CommandLine)" -ForegroundColor Gray
        Write-Host "  Parent PID: $($procInfo.ParentProcessId)" -ForegroundColor Yellow

        # Get parent process info
        if ($procInfo.ParentProcessId) {
            try {
                $parentProc = Get-Process -Id $procInfo.ParentProcessId -ErrorAction Stop
                $parentInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($procInfo.ParentProcessId)" -ErrorAction SilentlyContinue

                Write-Host "  Parent Process: $($parentProc.ProcessName)" -ForegroundColor Cyan
                Write-Host "  Parent Command: $($parentInfo.CommandLine)" -ForegroundColor Gray

                # Check grandparent
                if ($parentInfo.ParentProcessId) {
                    try {
                        $grandparent = Get-Process -Id $parentInfo.ParentProcessId -ErrorAction Stop
                        Write-Host "  Grandparent PID: $($parentInfo.ParentProcessId) - $($grandparent.ProcessName)" -ForegroundColor Magenta
                    }
                    catch {
                        Write-Host "  Grandparent: Process no longer exists" -ForegroundColor Gray
                    }
                }
            }
            catch {
                Write-Host "  Parent: Process no longer exists" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "No Python processes currently running" -ForegroundColor Green
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan

# Step 2: Check for active PowerShell processes
Write-Host ""
Write-Host "[STEP 2] Checking PowerShell processes..." -ForegroundColor Cyan

$allPowerShell = Get-Process -Name powershell*, pwsh* -ErrorAction SilentlyContinue

$suspiciousCount = 0
foreach ($proc in $allPowerShell) {
    if ($proc.Id -eq $PID) { continue }

    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine

        if ($cmdLine -like "*trading*" -or $cmdLine -like "*crypto*" -or $cmdLine -like "*launch*" -or $cmdLine -like "*start_live*") {
            $suspiciousCount++
            Write-Host "  [SUSPICIOUS] PID $($proc.Id)" -ForegroundColor Red
            Write-Host "    Command: $cmdLine" -ForegroundColor Yellow
        }
    }
    catch {
        # Access denied
    }
}

if ($suspiciousCount -eq 0) {
    Write-Host "No suspicious PowerShell processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan

# Step 3: Check scheduled tasks CURRENTLY RUNNING
Write-Host ""
Write-Host "[STEP 3] Checking RUNNING scheduled tasks..." -ForegroundColor Cyan

$runningTasks = Get-ScheduledTask | Where-Object { $_.State -eq "Running" }

$cryptoRunning = @()
foreach ($task in $runningTasks) {
    if ($task.TaskName -like "*crypto*" -or $task.TaskName -like "*bot*" -or $task.TaskName -like "*trading*") {
        $cryptoRunning += $task
        Write-Host "  [RUNNING] $($task.TaskName)" -ForegroundColor Red
        Write-Host "    Path: $($task.TaskPath)" -ForegroundColor Gray
    }
}

if ($cryptoRunning.Count -eq 0) {
    Write-Host "No crypto-related tasks currently running" -ForegroundColor Green
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan

# Step 4: Check all "Ready" tasks (could be triggered by events)
Write-Host ""
Write-Host "[STEP 4] Checking READY scheduled tasks..." -ForegroundColor Cyan

$readyTasks = Get-ScheduledTask | Where-Object {
    $_.State -eq "Ready" -and
    ($_.TaskName -like "*crypto*" -or $_.TaskName -like "*bot*" -or $_.TaskName -like "*trading*")
}

if ($readyTasks) {
    Write-Host "Found $($readyTasks.Count) ready task(s):" -ForegroundColor Yellow
    foreach ($task in $readyTasks) {
        Write-Host "  $($task.TaskName) - State: $($task.State)" -ForegroundColor Yellow

        # Check if it has any triggers
        $triggers = $task.Triggers
        if ($triggers) {
            foreach ($trigger in $triggers) {
                $triggerType = $trigger.CimClass.CimClassName
                Write-Host "    Trigger: $triggerType" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan

# Step 5: Recommendations
Write-Host ""
Write-Host "RECOMMENDATIONS:" -ForegroundColor Green
Write-Host ""

if ($pythonProcs -and $pythonProcs.Count -gt 0) {
    Write-Host "1. Python process(es) ARE running - check parent process above" -ForegroundColor Yellow
    Write-Host "   If parent is powershell.exe, find and kill that PowerShell window" -ForegroundColor Gray
} else {
    Write-Host "1. No Python processes running currently" -ForegroundColor Green
    Write-Host "   Run Force-Stop-Trading.ps1 and monitor for 60 seconds" -ForegroundColor Gray
}

Write-Host ""

if ($suspiciousCount -gt 0) {
    Write-Host "2. Found $suspiciousCount suspicious PowerShell process(es)" -ForegroundColor Yellow
    Write-Host "   Kill these processes manually with: Stop-Process -Id <PID>" -ForegroundColor Gray
}

Write-Host ""

if ($cryptoRunning.Count -gt 0) {
    Write-Host "3. Found running scheduled task(s)" -ForegroundColor Red
    Write-Host "   Stop with: Stop-ScheduledTask -TaskName '<TaskName>'" -ForegroundColor Gray
    Write-Host "   Disable with: Disable-ScheduledTask -TaskName '<TaskName>'" -ForegroundColor Gray
}

Write-Host ""
