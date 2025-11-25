<#
.SYNOPSIS
    Find and disable event-triggered scheduled tasks

.DESCRIPTION
    Identifies tasks with event triggers (especially Event ID 4689 - process termination)
    and disables them to prevent auto-restart loops
#>

[CmdletBinding()]
param()

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Red
Write-Host "FINDING EVENT-TRIGGERED AUTO-RESTART TASKS" -ForegroundColor Red
Write-Host ("=" * 80) -ForegroundColor Red
Write-Host ""

$eventTriggeredTasks = @()

# Get all tasks
$allTasks = Get-ScheduledTask

Write-Host "Scanning $($allTasks.Count) scheduled tasks for event triggers..." -ForegroundColor Cyan
Write-Host ""

foreach ($task in $allTasks) {
    try {
        # Check if task has event triggers
        $hasEventTrigger = $false
        $eventDetails = @()

        foreach ($trigger in $task.Triggers) {
            if ($trigger.CimClass.CimClassName -eq "MSFT_TaskEventTrigger") {
                $hasEventTrigger = $true

                # Try to get event details
                $subscription = $trigger.Subscription
                if ($subscription -like "*4689*" -or $subscription -like "*python*" -or $subscription -like "*trading*") {
                    $eventDetails += "Event-based trigger (Possible process termination monitor)"
                }
                else {
                    $eventDetails += "Event-based trigger"
                }
            }
        }

        # If task has event trigger and is crypto-related
        if ($hasEventTrigger) {
            $isCryptoRelated = $task.TaskName -like "*crypto*" -or
                               $task.TaskName -like "*bot*" -or
                               $task.TaskName -like "*trading*" -or
                               $task.TaskName -like "*python*"

            if ($isCryptoRelated) {
                Write-Host "FOUND: $($task.TaskName)" -ForegroundColor Yellow
                Write-Host "  Path: $($task.TaskPath)" -ForegroundColor Gray
                Write-Host "  State: $($task.State)" -ForegroundColor $(if ($task.State -eq "Ready") {"Red"} else {"Green"})
                Write-Host "  Trigger: $($eventDetails -join ', ')" -ForegroundColor Gray

                # Show actions
                foreach ($action in $task.Actions) {
                    Write-Host "  Action: $($action.Execute) $($action.Arguments)" -ForegroundColor Gray
                }

                $eventTriggeredTasks += $task
                Write-Host ""
            }
        }
    }
    catch {
        # Skip tasks we can't access
    }
}

Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "FOUND $($eventTriggeredTasks.Count) EVENT-TRIGGERED CRYPTO TASKS" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

if ($eventTriggeredTasks.Count -gt 0) {
    Write-Host "These tasks may be restarting your bot when it's killed!" -ForegroundColor Red
    Write-Host ""

    $response = Read-Host "Do you want to DISABLE these tasks? (YES to confirm)"

    if ($response -eq "YES") {
        Write-Host ""
        foreach ($task in $eventTriggeredTasks) {
            try {
                Disable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction Stop
                Write-Host "[OK] Disabled: $($task.TaskName)" -ForegroundColor Green
            }
            catch {
                Write-Host "[FAILED] Could not disable $($task.TaskName): $_" -ForegroundColor Red
                Write-Host "  Try running as Administrator" -ForegroundColor Yellow
            }
        }

        Write-Host ""
        Write-Host "Tasks have been disabled. Try starting your bot now!" -ForegroundColor Green
    }
    else {
        Write-Host "No changes made." -ForegroundColor Yellow
    }
}
else {
    Write-Host "No event-triggered crypto tasks found." -ForegroundColor Green
    Write-Host "The auto-restart may be coming from:" -ForegroundColor Yellow
    Write-Host "  - Windows Service recovery settings" -ForegroundColor Gray
    Write-Host "  - launch_trading.ps1 with auto-restart loop" -ForegroundColor Gray
    Write-Host "  - Another monitoring script" -ForegroundColor Gray
}

Write-Host ""
