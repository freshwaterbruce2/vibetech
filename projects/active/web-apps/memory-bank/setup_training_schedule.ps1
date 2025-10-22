#!/usr/bin/env powershell
<#
.SYNOPSIS
    Setup Windows Task Scheduler for Daily Agent Training

.DESCRIPTION
    Creates a scheduled task to run agent training daily at 2 AM
    The training analyzes agent performance and discovers patterns

.EXAMPLE
    .\setup_training_schedule.ps1
    .\setup_training_schedule.ps1 -Time "03:00"  # Run at 3 AM instead
#>

param(
    [string]$Time = "02:00",  # Default: 2 AM
    [string]$TaskName = "Claude-AgentTraining",
    [switch]$Remove  # Remove existing task
)

$ErrorActionPreference = "Stop"

# Paths
$ScriptRoot = $PSScriptRoot
$TrainingScript = Join-Path $ScriptRoot "train_agents.py"
$PythonExe = (Get-Command python).Source
$LogDir = Join-Path $ScriptRoot "logs"

# Create logs directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Remove-ExistingTask {
    Write-Host "Checking for existing task..." -ForegroundColor Yellow
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

    if ($ExistingTask) {
        Write-Host "  Found existing task. Removing..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "  Removed existing task" -ForegroundColor Green
    } else {
        Write-Host "  No existing task found" -ForegroundColor Gray
    }
}

function Create-TrainingTask {
    Write-Host "Creating scheduled task..." -ForegroundColor Cyan

    # Task action
    $Action = New-ScheduledTaskAction `
        -Execute $PythonExe `
        -Argument "$TrainingScript --hours 168 --quiet" `
        -WorkingDirectory $ScriptRoot

    # Task trigger (daily at specified time)
    $Trigger = New-ScheduledTaskTrigger `
        -Daily `
        -At $Time

    # Task settings
    $Settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -MultipleInstances IgnoreNew

    # Task principal (run as current user)
    $Principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType Interactive `
        -RunLevel Highest

    # Register task
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Daily agent training for Claude Code memory system. Analyzes agent performance and discovers patterns." `
        | Out-Null

    Write-Host "  Task created successfully" -ForegroundColor Green
}

function Test-TrainingTask {
    Write-Host "`nTesting task configuration..." -ForegroundColor Cyan

    $Task = Get-ScheduledTask -TaskName $TaskName

    Write-Host "  Task Name      : $($Task.TaskName)" -ForegroundColor White
    Write-Host "  State          : $($Task.State)" -ForegroundColor White
    Write-Host "  Trigger        : Daily at $Time" -ForegroundColor White
    Write-Host "  Python Path    : $PythonExe" -ForegroundColor White
    Write-Host "  Script Path    : $TrainingScript" -ForegroundColor White
    Write-Host "  Working Dir    : $ScriptRoot" -ForegroundColor White

    # Verify files exist
    if (-not (Test-Path $TrainingScript)) {
        Write-Host "  ERROR: Training script not found!" -ForegroundColor Red
        return $false
    }

    if (-not (Test-Path $PythonExe)) {
        Write-Host "  ERROR: Python executable not found!" -ForegroundColor Red
        return $false
    }

    Write-Host "  All checks passed" -ForegroundColor Green
    return $true
}

function Show-NextRun {
    $Task = Get-ScheduledTask -TaskName $TaskName
    $Info = Get-ScheduledTaskInfo -TaskName $TaskName

    Write-Host "`nSchedule Information:" -ForegroundColor Cyan
    Write-Host "  Next Run Time  : $($Info.NextRunTime)" -ForegroundColor White
    Write-Host "  Last Run Time  : $($Info.LastRunTime)" -ForegroundColor White
    Write-Host "  Last Result    : $($Info.LastTaskResult)" -ForegroundColor White
}

function Run-TaskNow {
    Write-Host "`nTest Run:" -ForegroundColor Cyan
    Write-Host "  Running training task now (this may take a minute)..." -ForegroundColor Yellow

    Start-ScheduledTask -TaskName $TaskName

    # Wait a bit for it to start
    Start-Sleep -Seconds 2

    $Task = Get-ScheduledTask -TaskName $TaskName
    Write-Host "  Task State: $($Task.State)" -ForegroundColor White

    if ($Task.State -eq "Running") {
        Write-Host "  Task is running..." -ForegroundColor Yellow
        Write-Host "  Check $LogDir\training.log for output" -ForegroundColor Gray
    }
}

# Main execution
try {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Claude Agent Training - Task Setup" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    if ($Remove) {
        Remove-ExistingTask
        Write-Host "`nTask removed successfully" -ForegroundColor Green
        exit 0
    }

    # Remove any existing task
    Remove-ExistingTask

    # Create new task
    Create-TrainingTask

    # Test configuration
    $TestResult = Test-TrainingTask

    if (-not $TestResult) {
        Write-Host "`nERROR: Task configuration failed validation" -ForegroundColor Red
        exit 1
    }

    # Show next run time
    Show-NextRun

    # Ask if user wants to run now
    Write-Host "`n========================================" -ForegroundColor Cyan
    $Response = Read-Host "Run training task now for testing? (y/n)"

    if ($Response -eq 'y' -or $Response -eq 'Y') {
        Run-TaskNow
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Setup complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nTask will run daily at $Time" -ForegroundColor White
    Write-Host "To check status:" -ForegroundColor Gray
    Write-Host "  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host "`nTo remove:" -ForegroundColor Gray
    Write-Host "  .\setup_training_schedule.ps1 -Remove" -ForegroundColor Gray
    Write-Host "`nLogs located at:" -ForegroundColor Gray
    Write-Host "  $LogDir\training.log`n" -ForegroundColor Gray

} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack Trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
