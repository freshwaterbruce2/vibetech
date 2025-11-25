# Windows Automation Library - Keyboard & Mouse Control

Complete automation toolkit providing Windows-MCP functionality through Desktop Commander.

## 📦 Installation

No installation needed! Just import the module:

```powershell
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1
```

## 🎹 Keyboard Functions

### Send-Keys
Send any key sequence using SendKeys notation.

```powershell
# Basic keys
Send-Keys "Hello World"
Send-Keys "{ENTER}"        # Press Enter
Send-Keys "{TAB}"          # Press Tab
Send-Keys "{ESC}"          # Press Escape
Send-Keys "{BACKSPACE}"    # Press Backspace
Send-Keys "{DELETE}"       # Press Delete

# Function keys
Send-Keys "{F1}"           # F1 through F16
Send-Keys "{F5}"

# Arrow keys
Send-Keys "{UP}"
Send-Keys "{DOWN}"
Send-Keys "{LEFT}"
Send-Keys "{RIGHT}"

# Modifiers
Send-Keys "^c"             # Ctrl+C
Send-Keys "^v"             # Ctrl+V
Send-Keys "%{TAB}"         # Alt+Tab
Send-Keys "+{TAB}"         # Shift+Tab
Send-Keys "^a"             # Ctrl+A (Select All)

# With delay before sending
Send-Keys -Keys "{ENTER}" -DelayMs 500
```

**SendKeys Special Characters:**
- `^` = Ctrl
- `%` = Alt
- `+` = Shift
- `{}` = Special keys like {ENTER}, {TAB}, etc.

### Type-Text
Type text naturally with character-by-character delays (simulates human typing).

```powershell
# Basic typing
Type-Text -Text "Hello from automation!"

# Faster typing (50ms per char - default)
Type-Text -Text "Quick message" -DelayPerChar 50

# Slower typing (more human-like)
Type-Text -Text "Slower typing" -DelayPerChar 150

# Handles special characters automatically
Type-Text -Text "Code: function() { return true; }"
Type-Text -Text "Email: test@example.com"
```

### Send-KeyCombo
Send keyboard shortcuts/combinations.

```powershell
# Common shortcuts
Send-KeyCombo "^c"         # Ctrl+C (Copy)
Send-KeyCombo "^v"         # Ctrl+V (Paste)
Send-KeyCombo "^x"         # Ctrl+X (Cut)
Send-KeyCombo "^a"         # Ctrl+A (Select All)
Send-KeyCombo "^s"         # Ctrl+S (Save)
Send-KeyCombo "^z"         # Ctrl+Z (Undo)
Send-KeyCombo "^y"         # Ctrl+Y (Redo)

# Window management
Send-KeyCombo "%{F4}"      # Alt+F4 (Close window)
Send-KeyCombo "%{TAB}"     # Alt+Tab (Switch window)
Send-KeyCombo "^{ESC}"     # Ctrl+Esc (Start menu)

# Browser shortcuts
Send-KeyCombo "^t"         # Ctrl+T (New tab)
Send-KeyCombo "^w"         # Ctrl+W (Close tab)
Send-KeyCombo "^{TAB}"     # Ctrl+Tab (Next tab)

# Multiple modifiers
Send-KeyCombo "^+s"        # Ctrl+Shift+S
Send-KeyCombo "^%{F12}"    # Ctrl+Alt+F12
```

## 🖱️ Mouse Functions

### Get-MousePosition
Get current cursor coordinates.

```powershell
$pos = Get-MousePosition
Write-Host "Mouse at: ($($pos.X), $($pos.Y))"

# Use in conditionals
if ($pos.X -gt 1000) {
    Write-Host "Mouse is on the right side"
}
```

### Move-Mouse
Move cursor to specific coordinates.

```powershell
# Instant movement
Move-Mouse -X 500 -Y 300

# Smooth movement (animated)
Move-Mouse -X 800 -Y 400 -Smooth

# Move to corner
Move-Mouse -X 0 -Y 0           # Top-left
Move-Mouse -X 1920 -Y 1080     # Bottom-right (Full HD)
```

### Click-AtPosition
Click at specific coordinates or current position.

```powershell
# Left click at position
Click-AtPosition -X 500 -Y 300

# Right click
Click-AtPosition -X 500 -Y 300 -Button Right

# Middle click
Click-AtPosition -X 500 -Y 300 -Button Middle

# Click at current position
Click-AtPosition -Button Left

# Custom click delay
Click-AtPosition -X 500 -Y 300 -DelayMs 200
```

### Double-Click
Double-click at position or current location.

```powershell
# Double-click at coordinates
Double-Click -X 500 -Y 300

# Double-click at current position
Double-Click
```

### Right-Click
Convenient right-click function.

```powershell
# Right-click at position
Right-Click -X 600 -Y 400

# Right-click at current position  
Right-Click
```

### Drag-Mouse
Drag from one position to another (drag-and-drop).

```powershell
# Drag from (100,100) to (500,500)
Drag-Mouse -FromX 100 -FromY 100 -ToX 500 -ToY 500

# Drag window or item
Drag-Mouse -FromX 200 -FromY 50 -ToX 800 -ToY 50  # Drag window titlebar
```

## 🔧 Complete Usage Examples

### Example 1: Automated Text Entry
```powershell
# Open Notepad
Start-Process notepad.exe
Start-Sleep -Seconds 2

# Type content
Type-Text -Text "Automated text entry demo"
Send-Keys "{ENTER}{ENTER}"
Type-Text -Text "This text was typed automatically!"

# Select all and copy
Send-KeyCombo "^a"
Start-Sleep -Milliseconds 300
Send-KeyCombo "^c"

# Close without saving
Send-KeyCombo "%{F4}"
Start-Sleep -Milliseconds 500
Send-Keys "{TAB}{ENTER}"  # Don't Save
```

### Example 2: Click Through Menu System
```powershell
# Click on menu item
Click-AtPosition -X 100 -Y 50   # File menu
Start-Sleep -Milliseconds 300

# Click submenu
Click-AtPosition -X 150 -Y 100  # Save As
Start-Sleep -Milliseconds 300

# Type filename
Type-Text -Text "my_document.txt"
Send-Keys "{ENTER}"
```

### Example 3: Form Automation
```powershell
# Fill out a form (Tab between fields)
Type-Text -Text "John Doe"
Send-Keys "{TAB}"

Type-Text -Text "john@example.com"  
Send-Keys "{TAB}"

Type-Text -Text "555-1234"
Send-Keys "{TAB}"

# Submit
Send-Keys "{ENTER}"
```

### Example 4: Screenshot & Annotation Workflow
```powershell
# Capture current state
$mousePos = Get-MousePosition
Capture-Screenshot -Path "C:\dev\screenshot.png"

# Create annotation
$annotation = "Mouse was at ($($mousePos.X), $($mousePos.Y)) when captured"
Set-ClipboardText $annotation

# Notify
Show-WindowsNotification `
    -Title "Screenshot Captured" `
    -Message $annotation
```

### Example 5: Window Navigation Automation
```powershell
# Save current position
$originalPos = Get-MousePosition

# Click window titlebar and drag to reposition
Move-Mouse -X 400 -Y 30 -Smooth
Drag-Mouse -FromX 400 -FromY 30 -ToX 800 -ToY 30

# Restore mouse
Move-Mouse -X $originalPos.X -Y $originalPos.Y
```

### Example 6: Development Workflow Automation
```powershell
# Quick commit workflow
function Quick-GitCommit {
    param([string]$Message)
    
    # Focus terminal window (assuming it's at specific position)
    Click-AtPosition -X 960 -Y 540
    Start-Sleep -Milliseconds 500
    
    # Type git commands
    Type-Text -Text "git add ."
    Send-Keys "{ENTER}"
    Start-Sleep -Milliseconds 500
    
    Type-Text -Text "git commit -m `"$Message`""
    Send-Keys "{ENTER}"
    Start-Sleep -Milliseconds 1000
    
    Type-Text -Text "git push"
    Send-Keys "{ENTER}"
    
    # Notify
    Show-WindowsNotification `
        -Title "Git Operations Complete" `
        -Message "Committed and pushed: $Message"
}

# Use it
Quick-GitCommit -Message "feat: add new automation features"
```

### Example 7: Trading Bot Quick Actions
```powershell
# Quick trading bot status check
function Get-QuickBotStatus {
    # Get trading bot info
    $dbPath = "C:\dev\projects\crypto-enhanced\trading.db"
    if (Test-Path $dbPath) {
        $dbInfo = Get-Item $dbPath
        $age = ((Get-Date) - $dbInfo.LastWriteTime).TotalMinutes
        
        # Create status message
        $status = "Trading Bot: $(if ($age -lt 5) { 'ACTIVE' } else { 'IDLE' }) | " +
                  "Last activity: $([math]::Round($age, 1))m ago | " +
                  "DB: $([math]::Round($dbInfo.Length/1KB, 1)) KB"
        
        # Copy to clipboard
        Set-ClipboardText $status
        
        # Show notification
        Show-WindowsNotification `
            -Title "Trading Bot Status" `
            -Message $status
        
        return $status
    }
}

# Bind to hotkey (in practice, use AutoHotkey or similar)
Get-QuickBotStatus
```

### Example 8: Automated Testing Workflow
```powershell
function Run-UITest {
    param(
        [string]$TestName,
        [array]$ClickSequence
    )
    
    Write-Host "Running UI test: $TestName"
    
    foreach ($step in $ClickSequence) {
        Write-Host "  Step: $($step.Action)"
        
        switch ($step.Type) {
            'Click' {
                Click-AtPosition -X $step.X -Y $step.Y
            }
            'Type' {
                Type-Text -Text $step.Text
            }
            'Keys' {
                Send-Keys $step.Keys
            }
            'Wait' {
                Start-Sleep -Milliseconds $step.Ms
            }
        }
    }
    
    Write-Host "[OK] Test complete: $TestName"
}

# Define test
$loginTest = @(
    @{Type='Click'; X=500; Y=300; Action='Click username field'}
    @{Type='Type'; Text='testuser'; Action='Enter username'}
    @{Type='Keys'; Keys='{TAB}'; Action='Tab to password'}
    @{Type='Type'; Text='password123'; Action='Enter password'}
    @{Type='Keys'; Keys='{ENTER}'; Action='Submit form'}
    @{Type='Wait'; Ms=2000; Action='Wait for load'}
)

Run-UITest -TestName "Login Flow" -ClickSequence $loginTest
```

## 🎯 Common Patterns

### Pattern 1: Safe Window Focus
```powershell
# Always save original mouse position
$originalPos = Get-MousePosition

# Do automation work...
Click-AtPosition -X 500 -Y 300
Type-Text -Text "Something"

# Restore position
Move-Mouse -X $originalPos.X -Y $originalPos.Y
```

### Pattern 2: Keyboard Shortcut Sequences
```powershell
# Open, Edit, Save pattern
Send-KeyCombo "^o"              # Open file
Start-Sleep -Milliseconds 500
Type-Text -Text "filename.txt"
Send-Keys "{ENTER}"
Start-Sleep -Seconds 1

Send-KeyCombo "^a"              # Select all
Type-Text -Text "New content"
Send-KeyCombo "^s"              # Save
```

### Pattern 3: Form Navigation
```powershell
# Consistent form filling pattern
$formData = @{
    "Name" = "John Doe"
    "Email" = "john@example.com"
    "Phone" = "555-1234"
}

foreach ($field in $formData.GetEnumerator()) {
    Type-Text -Text $field.Value
    Send-Keys "{TAB}"
    Start-Sleep -Milliseconds 200
}

Send-Keys "{ENTER}"  # Submit
```

### Pattern 4: Error-Safe Automation
```powershell
try {
    # Get starting state
    $startPos = Get-MousePosition
    
    # Perform automation
    Click-AtPosition -X 500 -Y 300
    Type-Text -Text "Automated input"
    Send-KeyCombo "^s"
    
    # Success notification
    Show-WindowsNotification `
        -Title "Automation Complete" `
        -Message "Operation successful"
        
} catch {
    Write-Error "Automation failed: $_"
    
    # Show error notification
    Show-WindowsNotification `
        -Title "Automation Error" `
        -Message "Operation failed. Check logs."
        
} finally {
    # Always restore mouse position
    Move-Mouse -X $startPos.X -Y $startPos.Y
}
```

## ⚠️ Best Practices

### 1. Always Add Delays
```powershell
# Bad: Too fast, might miss inputs
Click-AtPosition -X 500 -Y 300
Type-Text -Text "Hello"

# Good: Add delays for reliability
Click-AtPosition -X 500 -Y 300
Start-Sleep -Milliseconds 300
Type-Text -Text "Hello"
```

### 2. Save and Restore Mouse Position
```powershell
# Always save original position
$original = Get-MousePosition

# ... do automation work ...

# Restore when done
Move-Mouse -X $original.X -Y $original.Y
```

### 3. Use Smooth Movement for Visibility
```powershell
# For debugging/demos, use smooth movement
Move-Mouse -X 800 -Y 400 -Smooth

# For speed, use instant movement
Move-Mouse -X 800 -Y 400
```

### 4. Handle Special Characters
```powershell
# Type-Text handles special chars automatically
Type-Text -Text "function() { return true; }"

# For SendKeys, use {} for special chars
Send-Keys "{{}function{(}{)} {{}return true{;}{}} "
```

### 5. Test Before Automating
```powershell
# Always verify coordinates before automation
$pos = Get-MousePosition
Write-Host "Current position: $($pos.X), $($pos.Y)"

# Click there to verify
Click-AtPosition -X $pos.X -Y $pos.Y
```

## 🔗 Integration with Trading Bot

### Example: Automated Trading Bot Monitoring
```powershell
# Monitor and report on trading bot
function Monitor-TradingBot {
    while ($true) {
        $dbPath = "C:\dev\projects\crypto-enhanced\trading.db"
        
        if (Test-Path $dbPath) {
            $age = ((Get-Date) - (Get-Item $dbPath).LastWriteTime).TotalMinutes
            
            # Alert if no activity for 60 minutes
            if ($age -gt 60) {
                Show-WindowsNotification `
                    -Title "Trading Bot Alert" `
                    -Message "No activity for $([math]::Round($age)) minutes!"
                    
                # Take screenshot
                Capture-Screenshot -Path "C:\dev\bot_alert_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
            }
        }
        
        Start-Sleep -Seconds 300  # Check every 5 minutes
    }
}
```

## 📚 Available Functions Summary

| Category | Function | Description |
|----------|----------|-------------|
| **Keyboard** | `Send-Keys` | Send any key sequence |
| | `Type-Text` | Type text character-by-character |
| | `Send-KeyCombo` | Send keyboard shortcuts |
| **Mouse** | `Get-MousePosition` | Get current cursor position |
| | `Move-Mouse` | Move cursor to coordinates |
| | `Click-AtPosition` | Click (left/right/middle) |
| | `Double-Click` | Double-click |
| | `Right-Click` | Right-click |
| | `Drag-Mouse` | Drag from point A to B |
| **Other** | `Get-ClipboardText` | Read clipboard |
| | `Set-ClipboardText` | Write to clipboard |
| | `Capture-Screenshot` | Take screenshot |
| | `Show-WindowsNotification` | Show toast notification |
| | `Get-AllWindows` | List all windows |
| | `Focus-WindowByTitle` | Focus window by title |

## 🚀 Quick Start

```powershell
# Import module
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1

# Get current mouse position
$pos = Get-MousePosition
Write-Host "Mouse at: ($($pos.X), $($pos.Y))"

# Type something
Type-Text -Text "Hello from automation!"

# Copy to clipboard
Set-ClipboardText "Automated content"

# Take screenshot
Capture-Screenshot -Path "C:\dev\test.png"

# Show notification
Show-WindowsNotification `
    -Title "Test Complete" `
    -Message "All automation features working!"
```

## 🎓 Learning Resources

- **Demo Script**: Run `C:\dev\tools\windows-automation\keyboard-mouse-demo.ps1`
- **Practical Examples**: Run `C:\dev\tools\windows-automation\practical-examples.ps1`
- **Full Demo**: Run `C:\dev\tools\windows-automation\demo.ps1`

---

**Location**: `C:\dev\tools\windows-automation\`  
**Module**: `WindowsAutomation.psm1`  
**Status**: ✅ Fully functional and tested
