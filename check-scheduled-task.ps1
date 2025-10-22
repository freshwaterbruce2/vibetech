# Get detailed info about CryptoBot Weekly Cleanup task
$taskName = "CryptoBot Weekly Cleanup"
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($task) {
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($task.TaskName)"
    Write-Host "  State: $($task.State)"
    Write-Host "  Enabled: $($task.Settings.Enabled)"
    Write-Host ""

    Write-Host "Actions:" -ForegroundColor Yellow
    $task.Actions | ForEach-Object {
        Write-Host "  Execute: $($_.Execute)"
        Write-Host "  Arguments: $($_.Arguments)"
        Write-Host "  Working Directory: $($_.WorkingDirectory)"
    }
    Write-Host ""

    Write-Host "Triggers:" -ForegroundColor Yellow
    $task.Triggers | ForEach-Object {
        Write-Host "  Type: $($_.CimClass.CimClassName)"
        Write-Host "  Enabled: $($_.Enabled)"
    }
    Write-Host ""

    Write-Host "Task XML (action details):" -ForegroundColor Yellow
    $taskInfo = Export-ScheduledTask -TaskName $taskName
    $taskInfo | Select-String -Pattern "<Command>.*</Command>" -Context 0,2

} else {
    Write-Host "Task not found"
}
