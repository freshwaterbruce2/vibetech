# Trading Bot Build Watcher - Demonstrates practical Windows automation
# Uses: Clipboard, Notifications, Screenshots on failures

Import-Module "$PSScriptRoot\WindowsAutomation.psm1"

Write-Host ""
Write-Host "Trading Bot Build Monitor - DEMO" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Monitor the crypto-enhanced project
$projectPath = "C:\dev\projects\crypto-enhanced"

if (Test-Path $projectPath) {
    Write-Host "[OK] Found project: crypto-enhanced" -ForegroundColor Green
    
    # Check if trading.db exists
    $dbPath = Join-Path $projectPath "trading.db"
    if (Test-Path $dbPath) {
        $dbSize = (Get-Item $dbPath).Length / 1KB
        Write-Host "[OK] Database found: $([math]::Round($dbSize, 2)) KB" -ForegroundColor Green
        
        # Get last modified time
        $lastModified = (Get-Item $dbPath).LastWriteTime
        $age = (Get-Date) - $lastModified
        
        Write-Host "[INFO] Last activity: $($age.TotalMinutes.ToString('0.0')) minutes ago" -ForegroundColor Yellow
        
        # Simulate test completion
        Write-Host ""
        Write-Host "Running simulated tests..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        
        $testsPassed = $true
        
        if ($testsPassed) {
            # Success notification
            Show-WindowsNotification `
                -Title "Trading Bot Tests Passed" `
                -Message "All systems operational. Database: $([math]::Round($dbSize, 2)) KB" `
                -Duration 5
            
            # Copy summary to clipboard
            $summary = "Trading Bot Status - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`nAll tests passed`nDatabase: $([math]::Round($dbSize, 2)) KB`nLast activity: $($age.TotalMinutes.ToString('0.0')) min ago"
            
            Set-ClipboardText $summary
            Write-Host ""
            Write-Host "[OK] Summary copied to clipboard!" -ForegroundColor Green
            
        } else {
            # Failure notification + screenshot
            Show-WindowsNotification `
                -Title "Trading Bot Tests Failed" `
                -Message "Check logs for details. Screenshot captured." `
                -Duration 10
            
            # Capture error screenshot
            $screenshotPath = "C:\dev\error_screenshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
            Capture-Screenshot -Path $screenshotPath
            Write-Host "[ERROR] Error screenshot saved: $screenshotPath" -ForegroundColor Red
        }
        
    } else {
        Write-Host "[WARN] No database found - bot has not run yet" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "[ERROR] Project not found at: $projectPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "Demo complete! Check your notifications." -ForegroundColor Magenta
Write-Host "Summary is in your clipboard - paste it anywhere!" -ForegroundColor Magenta
Write-Host ""
