<#
.SYNOPSIS
    Test if auto-restart issue is fixed by monitoring for 60 seconds

.DESCRIPTION
    Watches for unexpected Python process starts to verify auto-restart is eliminated
#>

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "AUTO-RESTART FIX VERIFICATION TEST" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

Write-Host "This test will monitor for 60 seconds to verify no auto-restart occurs." -ForegroundColor Cyan
Write-Host ""

$testDuration = 60
$checkInterval = 5
$checksNeeded = $testDuration / $checkInterval

Write-Host "Starting monitoring..." -ForegroundColor Yellow
Write-Host ""

$detectedRestart = $false
$restartCount = 0

for ($i = 1; $i -le $checksNeeded; $i++) {
    Start-Sleep -Seconds $checkInterval

    $elapsed = $i * $checkInterval
    $pythonProcs = Get-Process -Name python* -ErrorAction SilentlyContinue

    if ($pythonProcs) {
        $detectedRestart = $true
        $restartCount++

        Write-Host "[$elapsed`s] ALERT: Python process detected!" -ForegroundColor Red
        Write-Host "  PID: $($pythonProcs[0].Id)" -ForegroundColor Yellow

        try {
            $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($pythonProcs[0].Id)" -ErrorAction SilentlyContinue
            Write-Host "  Command: $($procInfo.CommandLine)" -ForegroundColor Gray
            Write-Host "  Parent PID: $($procInfo.ParentProcessId)" -ForegroundColor Yellow

            if ($procInfo.ParentProcessId) {
                $parentProc = Get-Process -Id $procInfo.ParentProcessId -ErrorAction SilentlyContinue
                if ($parentProc) {
                    Write-Host "  Parent: $($parentProc.ProcessName)" -ForegroundColor Cyan
                }
            }
        }
        catch {
            # Process may have ended
        }

        Write-Host ""
    } else {
        Write-Host "[$elapsed`s] No processes - system clean" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST RESULTS" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

if (-not $detectedRestart) {
    Write-Host "SUCCESS: No auto-restart detected!" -ForegroundColor Green
    Write-Host "The auto-restart issue appears to be FIXED." -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now safely start the bot using:" -ForegroundColor Cyan
    Write-Host "  .\Safe-Start-Trading.ps1 -StartMonitoring" -ForegroundColor White
} else {
    Write-Host "FAILED: Auto-restart still occurring ($restartCount detection(s))" -ForegroundColor Red
    Write-Host ""
    Write-Host "The auto-restart source is still active." -ForegroundColor Yellow
    Write-Host "Run Find-Auto-Restart-Parent.ps1 when process is detected to identify source." -ForegroundColor Yellow
}

Write-Host ""
