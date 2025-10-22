# Check PowerShell profile
Write-Host "PowerShell Profile Location: $PROFILE"
Write-Host ""

if (Test-Path $PROFILE) {
    Write-Host "Profile EXISTS. Contents:" -ForegroundColor Yellow
    Write-Host "="*80 -ForegroundColor Gray
    Get-Content $PROFILE
    Write-Host "="*80 -ForegroundColor Gray
} else {
    Write-Host "No PowerShell profile found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking CryptoBot scheduled task..." -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName "CryptoBot Weekly Cleanup" -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "  Task Name: $($task.TaskName)"
    Write-Host "  State: $($task.State)" -ForegroundColor $(if ($task.State -eq 'Ready') { 'Red' } else { 'Green' })
    Write-Host "  Triggers:" -ForegroundColor Yellow
    $task.Triggers | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host "  Task not found"
}
