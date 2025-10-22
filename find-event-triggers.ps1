# Find any tasks triggered by events (process start, etc.)
Write-Host "Searching for event-triggered scheduled tasks..." -ForegroundColor Cyan
Write-Host ""

$allTasks = Get-ScheduledTask | Where-Object { $_.State -ne 'Disabled' }

foreach ($task in $allTasks) {
    $hasEventTrigger = $false
    $taskXml = Export-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath

    # Check for event triggers
    if ($taskXml -match '<EventTrigger>') {
        $hasEventTrigger = $true
    }

    # Check for process-related actions
    $hasPythonAction = $false
    if ($taskXml -match 'python|trading|crypto') {
        $hasPythonAction = $true
    }

    if ($hasEventTrigger -or $hasPythonAction) {
        Write-Host "Task: $($task.TaskName)" -ForegroundColor Yellow
        Write-Host "  Path: $($task.TaskPath)"
        Write-Host "  State: $($task.State)"

        if ($hasEventTrigger) {
            Write-Host "  [!] Has EVENT TRIGGER" -ForegroundColor Red
        }
        if ($hasPythonAction) {
            Write-Host "  [!] Python/Trading related" -ForegroundColor Red
        }

        # Extract action
        if ($taskXml -match '<Command>(.*?)</Command>') {
            Write-Host "  Command: $($matches[1])" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

Write-Host "Checking for Python in startup folder..." -ForegroundColor Cyan
$startupPaths = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
    "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
)

foreach ($path in $startupPaths) {
    if (Test-Path $path) {
        $items = Get-ChildItem $path -Filter "*python*" -ErrorAction SilentlyContinue
        $items += Get-ChildItem $path -Filter "*trading*" -ErrorAction SilentlyContinue
        $items += Get-ChildItem $path -Filter "*crypto*" -ErrorAction SilentlyContinue

        if ($items) {
            Write-Host "Found in $path" -ForegroundColor Red
            $items | ForEach-Object { Write-Host "  $_" }
        }
    }
}
