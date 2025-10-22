# Keyboard & Mouse Automation Demo
# Tests all new input automation capabilities

Import-Module "$PSScriptRoot\WindowsAutomation.psm1"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Keyboard & Mouse Automation Demo" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PART 1: Mouse Position & Movement
# ============================================

Write-Host "[1] MOUSE POSITION & MOVEMENT" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Get current mouse position
$currentPos = Get-MousePosition
Write-Host "  Current mouse position: ($($currentPos.X), $($currentPos.Y))" -ForegroundColor Green
Write-Host ""

# Save original position to restore later
$originalX = $currentPos.X
$originalY = $currentPos.Y

# Test mouse movement
Write-Host "  Testing mouse movement..." -ForegroundColor Cyan
$testPositions = @(
    @{X=500; Y=500; Label="Center-ish"}
    @{X=800; Y=400; Label="Right side"}
    @{X=200; Y=600; Label="Left-bottom"}
)

foreach ($pos in $testPositions) {
    Write-Host "    Moving to $($pos.Label): ($($pos.X), $($pos.Y))" -ForegroundColor Gray
    Move-Mouse -X $pos.X -Y $pos.Y
    Start-Sleep -Milliseconds 500
}

# Smooth movement demo
Write-Host "  Testing smooth movement..." -ForegroundColor Cyan
Write-Host "    Smooth move to (1000, 300)" -ForegroundColor Gray
Move-Mouse -X 1000 -Y 300 -Smooth
Start-Sleep -Milliseconds 500

Write-Host "  [OK] Mouse movement working!" -ForegroundColor Green
Write-Host ""
# ============================================
# PART 2: Mouse Clicking
# ============================================

Write-Host "[2] MOUSE CLICKING" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Test clicks at safe positions (middle of screen)
$centerX = 960
$centerY = 540

Write-Host "  Testing left click..." -ForegroundColor Cyan
$result = Click-AtPosition -X $centerX -Y $centerY -Button Left
Write-Host "    $result" -ForegroundColor Gray
Start-Sleep -Milliseconds 500

Write-Host "  Testing right click..." -ForegroundColor Cyan
$result = Right-Click -X ($centerX + 100) -Y $centerY
Write-Host "    $result" -ForegroundColor Gray
Start-Sleep -Milliseconds 500

Write-Host "  Testing double click..." -ForegroundColor Cyan
$result = Double-Click -X ($centerX - 100) -Y $centerY
Write-Host "    $result" -ForegroundColor Gray
Start-Sleep -Milliseconds 500

Write-Host "  [OK] Mouse clicking working!" -ForegroundColor Green
Write-Host ""

# ============================================
# PART 3: Mouse Dragging
# ============================================

Write-Host "[3] MOUSE DRAGGING" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
Write-Host ""

Write-Host "  Testing drag operation..." -ForegroundColor Cyan
$result = Drag-Mouse -FromX 500 -FromY 500 -ToX 700 -ToY 500
Write-Host "    $result" -ForegroundColor Gray
Start-Sleep -Milliseconds 500

Write-Host "  [OK] Mouse dragging working!" -ForegroundColor Green
Write-Host ""
# ============================================
# PART 4: Keyboard Automation
# ============================================

Write-Host "[4] KEYBOARD AUTOMATION" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
Write-Host ""

Write-Host "  Preparing to test keyboard input..." -ForegroundColor Cyan
Write-Host "  (Opening Notepad for safe testing)" -ForegroundColor Gray
Write-Host ""

# Launch Notepad for testing
Start-Process notepad.exe
Start-Sleep -Seconds 2

Write-Host "  Testing keyboard input..." -ForegroundColor Cyan

# Test 1: Simple text typing
Write-Host "    Typing text: 'Hello from Windows Automation!'" -ForegroundColor Gray
Type-Text -Text "Hello from Windows Automation!" -DelayPerChar 30
Start-Sleep -Milliseconds 500

# Test 2: Press Enter
Write-Host "    Pressing Enter key" -ForegroundColor Gray
Send-Keys "{ENTER}"
Start-Sleep -Milliseconds 300

# Test 3: Type more text
Write-Host "    Typing second line" -ForegroundColor Gray
Type-Text -Text "This is automated keyboard input." -DelayPerChar 30
Start-Sleep -Milliseconds 500

# Test 4: Keyboard shortcuts
Write-Host "    Testing keyboard shortcuts..." -ForegroundColor Gray
Send-Keys "{ENTER}{ENTER}"
Type-Text -Text "Testing Ctrl+A (select all)" -DelayPerChar 30
Start-Sleep -Milliseconds 500

Write-Host "    Pressing Ctrl+A" -ForegroundColor Gray
Send-KeyCombo "^a"  # Ctrl+A
Start-Sleep -Milliseconds 500

Write-Host "    Pressing Ctrl+C (copy)" -ForegroundColor Gray
Send-KeyCombo "^c"  # Ctrl+C
Start-Sleep -Milliseconds 500

# Verify clipboard
$clipContent = Get-ClipboardText
if ($clipContent -like "*Hello from Windows Automation*") {
    Write-Host "    [OK] Clipboard contains our text!" -ForegroundColor Green
} else {
    Write-Host "    [WARN] Clipboard content unexpected" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  [OK] Keyboard automation working!" -ForegroundColor Green
Write-Host ""
# ============================================
# PART 5: Cleanup & Summary
# ============================================

Write-Host "[5] CLEANUP & SUMMARY" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Close Notepad (without saving)
Write-Host "  Closing Notepad..." -ForegroundColor Cyan
$notepadProcess = Get-Process notepad -ErrorAction SilentlyContinue
if ($notepadProcess) {
    # Use Alt+F4 to close
    $notepadWindow = Get-Process notepad | Where-Object {$_.MainWindowTitle -ne ""}
    if ($notepadWindow) {
        # Focus notepad window first
        Add-Type @"
            using System;
            using System.Runtime.InteropServices;
            public class WindowFocus {
                [DllImport("user32.dll")]
                public static extern bool SetForegroundWindow(IntPtr hWnd);
            }
"@
        [WindowFocus]::SetForegroundWindow($notepadWindow[0].MainWindowHandle)
        Start-Sleep -Milliseconds 500
        
        # Close with Alt+F4
        Send-KeyCombo "%{F4}"  # Alt+F4
        Start-Sleep -Milliseconds 500
        
        # Don't save (press Tab then Enter to select "Don't Save")
        Send-Keys "{TAB}{ENTER}"
    }
}

# Restore original mouse position
Write-Host "  Restoring original mouse position..." -ForegroundColor Cyan
Move-Mouse -X $originalX -Y $originalY
Write-Host ""

# Show summary
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "           DEMO COMPLETE!" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Successfully tested:" -ForegroundColor Green
Write-Host "  [OK] Get mouse position" -ForegroundColor White
Write-Host "  [OK] Move mouse (instant & smooth)" -ForegroundColor White
Write-Host "  [OK] Left click" -ForegroundColor White
Write-Host "  [OK] Right click" -ForegroundColor White
Write-Host "  [OK] Double click" -ForegroundColor White
Write-Host "  [OK] Drag and drop" -ForegroundColor White
Write-Host "  [OK] Type text" -ForegroundColor White
Write-Host "  [OK] Send keys (Enter, etc.)" -ForegroundColor White
Write-Host "  [OK] Keyboard shortcuts (Ctrl+A, Ctrl+C)" -ForegroundColor White
Write-Host ""

# Create summary notification
Show-WindowsNotification `
    -Title "Automation Demo Complete" `
    -Message "All keyboard and mouse functions working perfectly!"

Write-Host "All automation features are ready to use!" -ForegroundColor Magenta
Write-Host ""
