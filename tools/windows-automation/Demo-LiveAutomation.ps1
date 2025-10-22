# Desktop Commander - Live Automation Demo
# Showcases autonomous computer control capabilities

Import-Module "$PSScriptRoot\DesktopCommanderAutomation.psm1" -Force

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " DESKTOP COMMANDER - AUTONOMOUS CONTROL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Demo 1: System Intelligence
Write-Host "[DEMO 1] System Intelligence & Awareness" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$metrics = Get-SystemMetrics
$activeWindow = Get-ActiveWindow
$windows = Get-AllWindows

Write-Host "  System Status:"
Write-Host "    CPU: $($metrics.CPU)%" -ForegroundColor Green
Write-Host "    Memory: $($metrics.MemoryUsedMB) / $($metrics.MemoryTotalMB) MB ($($metrics.MemoryPercent)%)" -ForegroundColor Green
Write-Host "    Processes: $($metrics.ProcessCount)" -ForegroundColor Green
Write-Host "    Uptime: $($metrics.Uptime.Days)d $($metrics.Uptime.Hours)h $($metrics.Uptime.Minutes)m" -ForegroundColor Green
Write-Host ""
Write-Host "  Current Focus:"
Write-Host "    Window: $($activeWindow.Title)" -ForegroundColor Cyan
Write-Host "    Process: $($activeWindow.ProcessName)" -ForegroundColor Cyan
Write-Host "    Position: $($activeWindow.X),$($activeWindow.Y)" -ForegroundColor Cyan
Write-Host "    Size: $($activeWindow.Width)x$($activeWindow.Height)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Active Windows: $($windows.Count) detected" -ForegroundColor Cyan
$windows | Select-Object -First 5 | ForEach-Object {
    Write-Host "    - $($_.ProcessName): $($_.Title)" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Demo 2: Mouse Control
Write-Host "`n[DEMO 2] Precise Mouse Control" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$originalPos = Get-MousePosition
Write-Host "  Original position: $($originalPos.X), $($originalPos.Y)" -ForegroundColor Cyan

Write-Host "  Moving mouse in pattern..." -ForegroundColor Gray
# Draw a small square with mouse
$startX = $originalPos.X
$startY = $originalPos.Y
Set-MousePosition -X $startX -Y $startY
Start-Sleep -Milliseconds 200
Set-MousePosition -X ($startX + 50) -Y $startY
Start-Sleep -Milliseconds 200
Set-MousePosition -X ($startX + 50) -Y ($startY + 50)
Start-Sleep -Milliseconds 200
Set-MousePosition -X $startX -Y ($startY + 50)
Start-Sleep -Milliseconds 200
Set-MousePosition -X $startX -Y $startY
Write-Host "  Pattern complete!" -ForegroundColor Green

# Return to original
Set-MousePosition -X $originalPos.X -Y $originalPos.Y

Start-Sleep -Seconds 2

# Demo 3: Window Management
Write-Host "`n[DEMO 3] Window Orchestration" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$chromeWindow = $windows | Where-Object {$_.ProcessName -eq "chrome"} | Select-Object -First 1
if ($chromeWindow) {
    Write-Host "  Chrome window found: $($chromeWindow.Title)" -ForegroundColor Cyan
    Write-Host "  Current state: $($chromeWindow.Width)x$($chromeWindow.Height) at $($chromeWindow.X),$($chromeWindow.Y)" -ForegroundColor Gray
    
    Write-Host "  Demonstrating window control..." -ForegroundColor Gray
    
    # Minimize
    Write-Host "    - Minimizing..." -ForegroundColor Gray
    Set-WindowState -Handle $chromeWindow.Handle -State Minimize
    Start-Sleep -Seconds 1
    
    # Restore
    Write-Host "    - Restoring..." -ForegroundColor Gray
    Set-WindowState -Handle $chromeWindow.Handle -State Restore
    Start-Sleep -Seconds 1
    
    # Focus
    Write-Host "    - Focusing..." -ForegroundColor Gray
    Set-WindowFocus -Handle $chromeWindow.Handle
    Start-Sleep -Seconds 1
    
    Write-Host "  Window control complete!" -ForegroundColor Green
} else {
    Write-Host "  (Chrome not running - skipping demo)" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Demo 4: Screen Capture
Write-Host "`n[DEMO 4] Visual Documentation" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$screenshotPath = "C:\dev\demo-screenshot-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
Write-Host "  Capturing screen..." -ForegroundColor Gray
$capture = Capture-Screen -Path $screenshotPath -Width 1920 -Height 1080
Write-Host "  Screenshot saved: $screenshotPath" -ForegroundColor Green
Write-Host "  Size: $([math]::Round($capture.Size / 1KB, 2)) KB" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Demo 5: Clipboard Mastery
Write-Host "`n[DEMO 5] Clipboard Operations" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$statusReport = @"
=== DESKTOP COMMANDER STATUS REPORT ===
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

SYSTEM METRICS:
- CPU Usage: $($metrics.CPU)%
- Memory: $($metrics.MemoryUsedMB) / $($metrics.MemoryTotalMB) MB
- Active Processes: $($metrics.ProcessCount)
- Uptime: $($metrics.Uptime.Days)d $($metrics.Uptime.Hours)h

ACTIVE WINDOWS: $($windows.Count)
$(($windows | Select-Object -First 5 | ForEach-Object { "- $($_.ProcessName): $($_.Title)" }) -join "`n")

SCREENSHOT: $screenshotPath

STATUS: All systems operational
========================================
"@

Set-ClipboardContent -Text $statusReport
Write-Host "  Status report copied to clipboard!" -ForegroundColor Green
Write-Host "  You can now paste it anywhere (Ctrl+V)" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Demo 6: Notifications
Write-Host "`n[DEMO 6] User Notifications" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "  Sending notification..." -ForegroundColor Gray
Show-Notification -Title "Desktop Commander Demo" -Message "All automation systems operational!"
Write-Host "  Notification sent to Windows Action Center" -ForegroundColor Green

Start-Sleep -Seconds 2

# Demo 7: Automated Workflow
Write-Host "`n[DEMO 7] Orchestrated Workflow" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "  Executing multi-step automation..." -ForegroundColor Gray

$workflow = @(
    @{Action="Clipboard"; Text="Desktop Commander workflow test"},
    @{Action="Wait"; Milliseconds=500},
    @{Action="Notify"; Title="Workflow Step 1"; Message="Clipboard updated"}
)

Start-AutomatedWorkflow -Steps $workflow
Write-Host "  Workflow complete!" -ForegroundColor Green

Start-Sleep -Seconds 2

# Final Summary
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " DEMONSTRATION COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Desktop Commander Capabilities Demonstrated:" -ForegroundColor White
Write-Host "  [OK] System Intelligence & Monitoring" -ForegroundColor Green
Write-Host "  [OK] Mouse Control & Positioning" -ForegroundColor Green
Write-Host "  [OK] Window Management & Orchestration" -ForegroundColor Green
Write-Host "  [OK] Screen Capture & Documentation" -ForegroundColor Green
Write-Host "  [OK] Clipboard Operations" -ForegroundColor Green
Write-Host "  [OK] User Notifications" -ForegroundColor Green
Write-Host "  [OK] Automated Workflows" -ForegroundColor Green
Write-Host ""
Write-Host "Your computer is now under autonomous control!" -ForegroundColor Cyan
Write-Host "Check your clipboard for the status report." -ForegroundColor Yellow
Write-Host ""

# Cleanup old screenshots
Write-Host "Cleaning up old demo screenshots..." -ForegroundColor Gray
Get-ChildItem "C:\dev\demo-screenshot-*.png" -File | 
    Where-Object {$_.CreationTime -lt (Get-Date).AddHours(-1)} | 
    Remove-Item -Force
Write-Host "Cleanup complete." -ForegroundColor Green
