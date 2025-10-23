# Setup Daily Performance Monitoring
# Run this once to configure automated daily snapshots

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "30-DAY MONITORING SETUP" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Create directories
$snapshotDir = "performance_snapshots"
if (!(Test-Path $snapshotDir)) {
    New-Item -ItemType Directory -Path $snapshotDir | Out-Null
    Write-Host "[OK] Created $snapshotDir directory" -ForegroundColor Green
}

# Test the monitor
Write-Host ""
Write-Host "Testing performance monitor..." -ForegroundColor Yellow
python performance_monitor.py weekly

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "DAILY MONITORING COMMANDS" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "  python performance_monitor.py daily    - View last 24 hours" -ForegroundColor White
Write-Host "  python performance_monitor.py weekly   - View last 7 days" -ForegroundColor White
Write-Host "  python performance_monitor.py monthly  - View last 30 days" -ForegroundColor White
Write-Host "  python performance_monitor.py snapshot - Save daily snapshot" -ForegroundColor White
Write-Host ""

# Create Windows Task Scheduler task for daily snapshots
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "AUTOMATED DAILY SNAPSHOTS" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$currentDir = Get-Location
$pythonPath = (Get-Command python).Source
$scriptPath = Join-Path $currentDir "performance_monitor.py"

Write-Host "Setting up Windows Task Scheduler..." -ForegroundColor Yellow
Write-Host "  Task: Daily Performance Snapshot"
Write-Host "  Time: Every day at 11:59 PM"
Write-Host "  Action: Save performance metrics"
Write-Host ""

# Create task
$action = New-ScheduledTaskAction -Execute $pythonPath -Argument "$scriptPath snapshot" -WorkingDirectory $currentDir
$trigger = New-ScheduledTaskTrigger -Daily -At "23:59"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

try {
    # Check if task exists
    $existingTask = Get-ScheduledTask -TaskName "CryptoTradingDailySnapshot" -ErrorAction SilentlyContinue

    if ($existingTask) {
        Write-Host "[INFO] Task already exists, updating..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName "CryptoTradingDailySnapshot" -Confirm:$false
    }

    Register-ScheduledTask -TaskName "CryptoTradingDailySnapshot" -Action $action -Trigger $trigger -Settings $settings -Description "Daily trading performance snapshot for 30-day validation" | Out-Null

    Write-Host "[OK] Automated daily snapshots configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Daily snapshots will be saved at 11:59 PM in:" -ForegroundColor Cyan
    Write-Host "  $currentDir\performance_snapshots\" -ForegroundColor White
} catch {
    Write-Host "[ERROR] Failed to create scheduled task: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual alternative: Run this daily:" -ForegroundColor Yellow
    Write-Host "  python performance_monitor.py snapshot" -ForegroundColor White
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "MONITORING IS NOW ACTIVE!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check status daily: python performance_monitor.py daily"
Write-Host "  2. Review weekly: python performance_monitor.py weekly"
Write-Host "  3. After 30 days: python performance_monitor.py monthly"
Write-Host "  4. Decision point: Check 'ready_to_scale' status"
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
