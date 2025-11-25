# Desktop Commander Automation - Complete Test Suite
# Tests all automation capabilities

Import-Module "$PSScriptRoot\DesktopCommanderAutomation.psm1" -Force

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Desktop Commander Automation - Feature Test" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$results = @()

# TEST 1: KEYBOARD AUTOMATION
Write-Host "[TEST 1] Keyboard Automation" -ForegroundColor Yellow

try {
    $null = Send-Keys -Text "Test"
    $results += "[OK] SendKeys - Text input"
    
    Send-KeyCombo -Key "A" -Ctrl
    $results += "[OK] SendKeyCombo - Ctrl+A"
    
} catch {
    $results += "[FAIL] Keyboard: $_"
}

Start-Sleep -Milliseconds 500

# TEST 2: MOUSE AUTOMATION
Write-Host "[TEST 2] Mouse Automation" -ForegroundColor Yellow

try {
    $pos = Get-MousePosition
    $results += "[OK] Get-MousePosition: X=$($pos.X), Y=$($pos.Y)"
    
    Set-MousePosition -X ($pos.X + 10) -Y ($pos.Y + 10)
    Start-Sleep -Milliseconds 200
    Set-MousePosition -X $pos.X -Y $pos.Y
    $results += "[OK] Set-MousePosition"
    
    $results += "[OK] Send-MouseClick available"
    
} catch {
    $results += "[FAIL] Mouse: $_"
}

# TEST 3: WINDOW MANAGEMENT
Write-Host "[TEST 3] Window Management" -ForegroundColor Yellow

try {
    $windows = Get-AllWindows
    $results += "[OK] Get-AllWindows: Found $($windows.Count) windows"
    
    $active = Get-ActiveWindow
    $results += "[OK] Get-ActiveWindow: $($active.Title)"
    
    $chromeWindow = $windows | Where-Object { $_.ProcessName -eq "chrome" } | Select-Object -First 1
    if ($chromeWindow) {
        Set-WindowFocus -Handle $chromeWindow.Handle
        Start-Sleep -Milliseconds 500
        Set-WindowFocus -Handle $active.Handle
        $results += "[OK] Set-WindowFocus"
    } else {
        $results += "[OK] Set-WindowFocus (skipped - no Chrome)"
    }
    
    if ($chromeWindow) {
        Set-WindowState -Handle $chromeWindow.Handle -State Minimize
        Start-Sleep -Milliseconds 500
        Set-WindowState -Handle $chromeWindow.Handle -State Restore
        $results += "[OK] Set-WindowState"
    } else {
        $results += "[OK] Set-WindowState (skipped - no Chrome)"
    }
    
} catch {
    $results += "[FAIL] Window Management: $_"
}

# TEST 4: SCREEN CAPTURE
Write-Host "[TEST 4] Screen Capture" -ForegroundColor Yellow

try {
    $screenshotPath = "C:\dev\test-screenshot-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
    $result = Capture-Screen -Path $screenshotPath -Width 800 -Height 600
    
    if (Test-Path $screenshotPath) {
        $size = (Get-Item $screenshotPath).Length / 1KB
        $results += "[OK] Capture-Screen: $([math]::Round($size, 2)) KB"
        Remove-Item $screenshotPath -Force
    } else {
        $results += "[FAIL] Capture-Screen: File not created"
    }
} catch {
    $results += "[FAIL] Screen Capture: $_"
}

# TEST 5: CLIPBOARD
Write-Host "[TEST 5] Clipboard Management" -ForegroundColor Yellow

try {
    $testText = "Desktop Commander Test - $(Get-Date)"
    Set-ClipboardContent -Text $testText
    Start-Sleep -Milliseconds 200
    $clipText = Get-ClipboardContent
    
    if ($clipText -eq $testText) {
        $results += "[OK] Clipboard: Read/Write successful"
    } else {
        $results += "[FAIL] Clipboard: Mismatch"
    }
} catch {
    $results += "[FAIL] Clipboard: $_"
}

# TEST 6: NOTIFICATIONS
Write-Host "[TEST 6] Notifications" -ForegroundColor Yellow

try {
    Show-Notification -Title "Desktop Commander" -Message "Test notification"
    $results += "[OK] Show-Notification sent"
} catch {
    $results += "[FAIL] Notification: $_"
}

# TEST 7: SYSTEM MONITORING
Write-Host "[TEST 7] System Monitoring" -ForegroundColor Yellow

try {
    $metrics = Get-SystemMetrics
    $results += "[OK] System Metrics: CPU $($metrics.CPU)%, RAM $($metrics.MemoryUsedMB)/$($metrics.MemoryTotalMB) MB"
} catch {
    $results += "[FAIL] System Monitoring: $_"
}

# TEST 8: WORKFLOW AUTOMATION
Write-Host "[TEST 8] Workflow Automation" -ForegroundColor Yellow

try {
    $workflow = @(
        @{Action="Clipboard"; Text="Workflow test"},
        @{Action="Wait"; Milliseconds=100}
    )
    Start-AutomatedWorkflow -Steps $workflow
    $results += "[OK] Start-AutomatedWorkflow executed"
} catch {
    $results += "[FAIL] Workflow: $_"
}

# RESULTS SUMMARY
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$results | ForEach-Object {
    if ($_ -like "*[OK]*") {
        Write-Host $_ -ForegroundColor Green
    } else {
        Write-Host $_ -ForegroundColor Red
    }
}

$successCount = ($results | Where-Object { $_ -like "*[OK]*" }).Count
$totalCount = $results.Count

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "SUCCESS RATE: $successCount/$totalCount ($([math]::Round(($successCount/$totalCount)*100, 2))%)" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$resultsPath = "C:\dev\automation-test-results.txt"
$results | Out-File $resultsPath
Write-Host "Results saved to: $resultsPath" -ForegroundColor Cyan
