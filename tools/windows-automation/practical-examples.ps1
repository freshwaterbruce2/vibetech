# Practical Automation Examples
# Real-world use cases for keyboard & mouse automation

Import-Module "$PSScriptRoot\WindowsAutomation.psm1"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Practical Automation Examples" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# EXAMPLE 1: Automated Code Documentation
# ============================================

Write-Host "[Example 1] Automated Code Documentation" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

function New-CodeDocumentation {
    param([string]$FunctionName, [string]$Description)
    
    # Generate timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # Create documentation block
    $docBlock = @"
/**
 * Function: $FunctionName
 * Description: $Description
 * Author: Automated Documentation System
 * Created: $timestamp
 */
"@
    
    # Copy to clipboard
    Set-ClipboardText $docBlock
    
    Write-Host "  Documentation block created for: $FunctionName" -ForegroundColor Green
    Write-Host "  Copied to clipboard - ready to paste!" -ForegroundColor Gray
    Write-Host ""
    
    return $docBlock
}

# Demo it
$doc = New-CodeDocumentation -FunctionName "processTradeSignal" -Description "Handles incoming cryptocurrency trade signals from WebSocket"
Write-Host $doc -ForegroundColor DarkGray
Write-Host ""
# ============================================
# EXAMPLE 2: Quick Screenshot Annotation Tool
# ============================================

Write-Host "[Example 2] Screenshot Annotation Workflow" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

function Capture-AnnotatedScreenshot {
    param(
        [string]$AnnotationText,
        [string]$OutputPath
    )
    
    # Get mouse position for reference
    $mousePos = Get-MousePosition
    
    # Capture screenshot
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $screenshotPath = if ($OutputPath) { $OutputPath } else { "C:\dev\screenshot_$timestamp.png" }
    Capture-Screenshot -Path $screenshotPath
    
    # Create metadata file
    $metadata = @"
Screenshot Metadata
===================
Captured: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Mouse Position: ($($mousePos.X), $($mousePos.Y))
Annotation: $AnnotationText
File: $screenshotPath
"@
    
    $metadataPath = $screenshotPath -replace '\.png$', '_metadata.txt'
    $metadata | Out-File -FilePath $metadataPath -Encoding UTF8
    
    # Copy annotation to clipboard
    Set-ClipboardText $AnnotationText
    
    Write-Host "  Screenshot saved: $screenshotPath" -ForegroundColor Green
    Write-Host "  Metadata saved: $metadataPath" -ForegroundColor Green
    Write-Host "  Annotation copied to clipboard" -ForegroundColor Green
    Write-Host ""
    
    return $screenshotPath
}

# Demo it
$screenshot = Capture-AnnotatedScreenshot -AnnotationText "Trading bot dashboard showing XLM/USD performance"
Write-Host ""
# ============================================
# EXAMPLE 3: Automated Form Filling
# ============================================

Write-Host "[Example 3] Automated Form Filling" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

function Fill-FormWithData {
    param(
        [hashtable]$FormData,
        [int]$DelayBetweenFields = 200
    )
    
    Write-Host "  Starting automated form filling..." -ForegroundColor Cyan
    Write-Host "  (Using Tab to navigate between fields)" -ForegroundColor Gray
    Write-Host ""
    
    $fieldCount = 0
    foreach ($field in $FormData.GetEnumerator()) {
        $fieldCount++
        
        # Type the value
        Write-Host "  Field $fieldCount - $($field.Key): " -NoNewline -ForegroundColor Gray
        Type-Text -Text $field.Value -DelayPerChar 20
        Write-Host "Done" -ForegroundColor Green
        
        # Move to next field (Tab)
        Start-Sleep -Milliseconds $DelayBetweenFields
        Send-Keys "{TAB}"
        Start-Sleep -Milliseconds 100
    }
    
    Write-Host ""
    Write-Host "  [OK] Filled $fieldCount form fields" -ForegroundColor Green
    Write-Host ""
}

# Example form data
$tradingBotConfig = @{
    "API Key" = "YOUR_KRAKEN_API_KEY_HERE"
    "API Secret" = "YOUR_SECRET_HERE"
    "Trading Pair" = "XLM/USD"
    "Max Trade Size" = "10"
    "Strategy" = "Momentum"
}

Write-Host "  Demo: Would fill form with trading bot configuration" -ForegroundColor Cyan
Write-Host "  (Not executing to avoid interfering with active windows)" -ForegroundColor Yellow
Write-Host ""
foreach ($field in $tradingBotConfig.GetEnumerator()) {
    Write-Host "    $($field.Key): $($field.Value)" -ForegroundColor Gray
}
Write-Host ""
# ============================================
# EXAMPLE 4: Trading Bot Quick Actions
# ============================================

Write-Host "[Example 4] Trading Bot Quick Actions" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

function Quick-TradingBotStatus {
    # Get trading bot database info
    $dbPath = "C:\dev\projects\crypto-enhanced\trading.db"
    
    if (Test-Path $dbPath) {
        $dbInfo = Get-Item $dbPath
        $size = [math]::Round($dbInfo.Length / 1KB, 2)
        $lastMod = $dbInfo.LastWriteTime
        $age = ((Get-Date) - $lastMod).TotalMinutes
        
        # Get current mouse position
        $mousePos = Get-MousePosition
        
        # Create quick status report
        $status = @"
Trading Bot Quick Status
========================
Time: $(Get-Date -Format 'HH:mm:ss')
Database: $size KB
Last Activity: $([math]::Round($age, 1)) min ago
Status: $(if ($age -lt 5) { 'ACTIVE' } elseif ($age -lt 60) { 'RECENT' } else { 'IDLE' })
Mouse Position: ($($mousePos.X), $($mousePos.Y))

Quick Actions:
- Ctrl+Shift+L: View logs
- Ctrl+Shift+S: Take screenshot
- Ctrl+Shift+C: Copy status
"@
        
        # Copy to clipboard
        Set-ClipboardText $status
        
        # Show notification
        Show-WindowsNotification `
            -Title "Trading Bot Status" `
            -Message "Status copied to clipboard. DB: $size KB"
        
        Write-Host $status -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  [OK] Status copied to clipboard" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host "  [WARN] Trading bot database not found" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Execute it
Quick-TradingBotStatus
# ============================================
# EXAMPLE 5: Macro-Style Automation Sequences
# ============================================

Write-Host "[Example 5] Macro-Style Automation Sequences" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

function Invoke-DevelopmentWorkflowMacro {
    Write-Host "  Executing development workflow macro..." -ForegroundColor Cyan
    Write-Host ""
    
    # Step 1: Check git status
    Write-Host "  [1/5] Checking git status..." -ForegroundColor Gray
    $gitStatus = git -C "C:\dev" status --short 2>$null
    if ($gitStatus) {
        Write-Host "    Found uncommitted changes" -ForegroundColor Yellow
    } else {
        Write-Host "    Working directory clean" -ForegroundColor Green
    }
    
    # Step 2: Get system resources
    Write-Host "  [2/5] Checking system resources..." -ForegroundColor Gray
    $cpu = [math]::Round((Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue, 1)
    $ram = [math]::Round((Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue, 0)
    Write-Host "    CPU: $cpu%, RAM: $ram MB available" -ForegroundColor Green
    
    # Step 3: Check trading bot
    Write-Host "  [3/5] Checking trading bot status..." -ForegroundColor Gray
    $dbPath = "C:\dev\projects\crypto-enhanced\trading.db"
    if (Test-Path $dbPath) {
        $age = ((Get-Date) - (Get-Item $dbPath).LastWriteTime).TotalMinutes
        $status = if ($age -lt 5) { "ACTIVE" } elseif ($age -lt 60) { "RECENT" } else { "IDLE" }
        Write-Host "    Status: $status (last activity: $([math]::Round($age, 1)) min ago)" -ForegroundColor Green
    }
    
    # Step 4: Create workflow report
    Write-Host "  [4/5] Generating workflow report..." -ForegroundColor Gray
    $report = @"
Development Workflow Report
===========================
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Git Status: $(if ($gitStatus) { 'Uncommitted changes' } else { 'Clean' })
System: CPU $cpu%, RAM $ram MB
Trading Bot: $(if (Test-Path $dbPath) { $status } else { 'Not running' })

Next Actions:
- [ ] Review code changes
- [ ] Run tests
- [ ] Update documentation
- [ ] Commit changes
"@
    
    Set-ClipboardText $report
    Write-Host "    Report copied to clipboard" -ForegroundColor Green
    
    # Step 5: Screenshot current state
    Write-Host "  [5/5] Capturing screenshot..." -ForegroundColor Gray
    $screenshot = "C:\dev\workflow_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
    Capture-Screenshot -Path $screenshot
    Write-Host "    Saved: $screenshot" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "  [OK] Workflow macro completed!" -ForegroundColor Green
    Write-Host ""
    
    # Show notification
    Show-WindowsNotification `
        -Title "Workflow Macro Complete" `
        -Message "Report in clipboard. Screenshot saved."
    
    return $report
}

# Execute macro
$result = Invoke-DevelopmentWorkflowMacro
Write-Host $result -ForegroundColor DarkCyan
Write-Host ""
# ============================================
# Summary
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Practical Examples Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "You now have access to:" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Keyboard Functions:" -ForegroundColor Yellow
Write-Host "    - Send-Keys           : Send any key sequence" -ForegroundColor White
Write-Host "    - Type-Text           : Type text naturally" -ForegroundColor White
Write-Host "    - Send-KeyCombo       : Keyboard shortcuts" -ForegroundColor White
Write-Host ""
Write-Host "  Mouse Functions:" -ForegroundColor Yellow
Write-Host "    - Get-MousePosition   : Get current position" -ForegroundColor White
Write-Host "    - Move-Mouse          : Move cursor" -ForegroundColor White
Write-Host "    - Click-AtPosition    : Click (left/right/middle)" -ForegroundColor White
Write-Host "    - Double-Click        : Double click" -ForegroundColor White
Write-Host "    - Right-Click         : Context menu" -ForegroundColor White
Write-Host "    - Drag-Mouse          : Drag and drop" -ForegroundColor White
Write-Host ""
Write-Host "  Practical Use Cases:" -ForegroundColor Yellow
Write-Host "    1. Code documentation automation" -ForegroundColor White
Write-Host "    2. Screenshot annotation workflow" -ForegroundColor White
Write-Host "    3. Form filling automation" -ForegroundColor White
Write-Host "    4. Trading bot status checks" -ForegroundColor White
Write-Host "    5. Development workflow macros" -ForegroundColor White
Write-Host ""

Write-Host "Integration Ideas:" -ForegroundColor Cyan
Write-Host "  - Add to npm scripts for build notifications" -ForegroundColor Gray
Write-Host "  - Create hotkey launchers for common tasks" -ForegroundColor Gray
Write-Host "  - Build custom productivity macros" -ForegroundColor Gray
Write-Host "  - Automate repetitive development workflows" -ForegroundColor Gray
Write-Host ""

Write-Host "All functions available in:" -ForegroundColor Green
Write-Host "  C:\dev\tools\windows-automation\WindowsAutomation.psm1" -ForegroundColor White
Write-Host ""
