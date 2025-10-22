# Demo: Automated Development Workflow
# Combines: Window focus, keyboard input, clipboard, notifications

Import-Module "$PSScriptRoot\WindowsAutomation.psm1"

Write-Host ""
Write-Host "=== Automated Dev Workflow Demo ===" -ForegroundColor Cyan
Write-Host ""

# Scenario: Quickly document what you're working on

Write-Host "[1] Reading project status..." -ForegroundColor Yellow
$dbPath = "C:\dev\projects\crypto-enhanced\trading.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length / 1KB
    $lastMod = (Get-Item $dbPath).LastWriteTime
    $age = ((Get-Date) - $lastMod).TotalMinutes
    
    # Generate status report
    $statusReport = @"
# Daily Dev Status - $(Get-Date -Format 'yyyy-MM-dd')

## Crypto Trading Bot
- Database: $([math]::Round($dbSize, 2)) KB
- Last activity: $([math]::Round($age, 1)) minutes ago
- Status: $(if ($age -lt 60) { 'Active' } else { 'Idle' })

## System Info
- CPU: $([math]::Round((Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue, 1))%
- RAM Available: $([math]::Round((Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue, 0)) MB
- Timestamp: $(Get-Date -Format 'HH:mm:ss')

## Next Steps
- [ ] Review trading logs
- [ ] Update strategy parameters
- [ ] Run backtest simulations
"@

    Write-Host "[2] Status report generated" -ForegroundColor Green
    Write-Host ""
    
    # Copy to clipboard
    Set-ClipboardText $statusReport
    Write-Host "[3] Report copied to clipboard" -ForegroundColor Green
    Write-Host ""
    
    # Take screenshot for documentation
    $screenshotPath = "C:\dev\daily_status_$(Get-Date -Format 'yyyyMMdd').png"
    Write-Host "[4] Capturing screenshot..." -ForegroundColor Yellow
    Capture-Screenshot -Path $screenshotPath
    
    if (Test-Path $screenshotPath) {
        $size = (Get-Item $screenshotPath).Length / 1KB
        Write-Host "    Screenshot saved: $([math]::Round($size, 2)) KB" -ForegroundColor Green
    }
    Write-Host ""
    
    # Send notification
    Show-WindowsNotification `
        -Title "Daily Status Report Ready" `
        -Message "Report in clipboard. Screenshot saved. Paste into notes!" `
        -Duration 8
    
    Write-Host "[5] Notification sent" -ForegroundColor Green
    Write-Host ""
    
    # Display the report
    Write-Host "=== Report Content ===" -ForegroundColor Cyan
    Write-Host $statusReport
    Write-Host ""
    Write-Host "=== What Just Happened ===" -ForegroundColor Magenta
    Write-Host "1. Analyzed trading bot database" -ForegroundColor White
    Write-Host "2. Generated markdown status report" -ForegroundColor White
    Write-Host "3. Copied report to clipboard (ready to paste)" -ForegroundColor White
    Write-Host "4. Captured screenshot of current state" -ForegroundColor White
    Write-Host "5. Sent Windows notification" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Yellow
    Write-Host "  - Paste (Ctrl+V) the report into any app" -ForegroundColor Gray
    Write-Host "  - Find screenshot at: $screenshotPath" -ForegroundColor Gray
    Write-Host "  - Check notification in Action Center" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "[ERROR] Trading bot database not found" -ForegroundColor Red
}
