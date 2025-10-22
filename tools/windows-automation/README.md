# Windows Automation Library - Complete Guide

Full-featured Windows automation toolkit providing keyboard, mouse, clipboard, screenshot, and window management capabilities through Desktop Commander.

## 🚀 Quick Start

```powershell
# Import the module
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1

# Test it out
Type-Text -Text "Hello from Windows Automation!"
$pos = Get-MousePosition
Write-Host "Mouse at: ($($pos.X), $($pos.Y))"
Capture-Screenshot -Path "C:\dev\test.png"
Show-WindowsNotification -Title "Ready!" -Message "Automation is working!"
```

## 📦 Installation

```powershell
# Import the module (no installation needed!)
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1

# Optional: Add to PowerShell profile for permanent access
Add-Content $PROFILE "Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1"
```

## ✨ Core Features

### 🎹 Keyboard Automation
- **Send-Keys**: Send any key sequence (Enter, Tab, F-keys, arrows)
- **Type-Text**: Type text naturally with character-by-character delays  
- **Send-KeyCombo**: Execute keyboard shortcuts (Ctrl+C, Alt+Tab, etc.)

### 🖱️ Mouse Automation
- **Get-MousePosition**: Get current cursor coordinates
- **Move-Mouse**: Move cursor instantly or with smooth animation
- **Click-AtPosition**: Click with left/right/middle button
- **Double-Click**: Double-click at position
- **Right-Click**: Right-click for context menus
- **Drag-Mouse**: Drag and drop operations

### 📋 Clipboard & Screen
- **Get-ClipboardText / Set-ClipboardText**: Clipboard operations
- **Capture-Screenshot**: Take screenshots with metadata
- **Show-WindowsNotification**: Display toast notifications

### 🪟 Window Management
- **Get-AllWindows**: List all open windows
- **Focus-WindowByTitle**: Focus specific window by title

## 📖 Usage Examples

### Keyboard Operations

```powershell
# Basic text typing
Type-Text -Text "Hello World!"

# Send special keys
Send-Keys "{ENTER}"           # Press Enter
Send-Keys "{TAB}"             # Press Tab  
Send-Keys "{F5}"              # Press F5
Send-Keys "{UP}{DOWN}"        # Arrow keys

# Keyboard shortcuts
Send-KeyCombo "^c"            # Ctrl+C (copy)
Send-KeyCombo "^v"            # Ctrl+V (paste)
Send-KeyCombo "^a"            # Ctrl+A (select all)
Send-KeyCombo "%{F4}"         # Alt+F4 (close window)
Send-KeyCombo "^+s"           # Ctrl+Shift+S

# Type with custom speed
Type-Text -Text "Slow typing" -DelayPerChar 100
```

### Mouse Operations

```powershell
# Get current position
$pos = Get-MousePosition
Write-Host "Mouse at: ($($pos.X), $($pos.Y))"

# Move mouse
Move-Mouse -X 500 -Y 300                # Instant movement
Move-Mouse -X 800 -Y 400 -Smooth        # Smooth animation

# Click operations
Click-AtPosition -X 500 -Y 300          # Left click
Click-AtPosition -X 500 -Y 300 -Button Right  # Right click
Double-Click -X 600 -Y 400              # Double click
Right-Click -X 700 -Y 500               # Right click shortcut

# Drag and drop
Drag-Mouse -FromX 100 -FromY 100 -ToX 500 -ToY 500
```

### Clipboard & Screenshots

```powershell
# Clipboard operations
Set-ClipboardText "Automated content"
$content = Get-ClipboardText
Write-Host $content

# Take screenshot
$path = Capture-Screenshot -Path "C:\dev\screenshot.png"
Write-Host "Screenshot saved: $path"

# Screenshot with notification
Capture-Screenshot -Path "C:\dev\test.png"
Show-WindowsNotification `
    -Title "Screenshot Captured" `
    -Message "Saved to C:\dev\test.png"
```

### Window Management

```powershell
# List all windows
$windows = Get-AllWindows
foreach ($win in $windows) {
    Write-Host "$($win.Title) [$($win.Handle)]"
}

# Focus specific window
Focus-WindowByTitle "Chrome"
Focus-WindowByTitle "Visual Studio Code"
```

## 🎯 Practical Examples

### Example 1: Automated Note Taking

```powershell
# Open Notepad
Start-Process notepad.exe
Start-Sleep -Seconds 2

# Type content
Type-Text -Text "Meeting Notes - $(Get-Date -Format 'yyyy-MM-dd')"
Send-Keys "{ENTER}{ENTER}"
Type-Text -Text "- Discussed project timeline"
Send-Keys "{ENTER}"
Type-Text -Text "- Reviewed budget constraints"

# Save
Send-KeyCombo "^s"
Start-Sleep -Milliseconds 500
Type-Text -Text "meeting_notes.txt"
Send-Keys "{ENTER}"
```

### Example 2: Quick Screenshot Workflow

```powershell
function Capture-AnnotatedScreen {
    param([string]$Annotation)
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $path = "C:\dev\screenshots\capture_$timestamp.png"
    
    # Capture
    Capture-Screenshot -Path $path
    
    # Create metadata
    $metadata = @"
Screenshot: $timestamp
Annotation: $Annotation
Mouse Position: $(Get-MousePosition | ConvertTo-Json -Compress)
"@
    
    Set-ClipboardText $metadata
    
    Show-WindowsNotification `
        -Title "Screenshot Captured" `
        -Message "Saved: $path"
        
    return $path
}

# Use it
Capture-AnnotatedScreen -Annotation "Trading bot dashboard view"
```

### Example 3: Form Automation

```powershell
function Fill-Form {
    param([hashtable]$Data)
    
    foreach ($field in $Data.GetEnumerator()) {
        Write-Host "Filling: $($field.Key)"
        Type-Text -Text $field.Value -DelayPerChar 30
        Send-Keys "{TAB}"
        Start-Sleep -Milliseconds 200
    }
    
    Send-Keys "{ENTER}"  # Submit
}

# Example data
$formData = @{
    "Name" = "John Doe"
    "Email" = "john@example.com"
    "Phone" = "555-1234"
}

Fill-Form -Data $formData
```

### Example 4: Development Workflow Automation

```powershell
function Quick-DevSnapshot {
    # Get system state
    $cpu = [math]::Round((Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue, 1)
    $ram = [math]::Round((Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue, 0)
    
    # Check trading bot
    $botStatus = if (Test-Path "C:\dev\projects\crypto-enhanced\trading.db") {
        $age = ((Get-Date) - (Get-Item "C:\dev\projects\crypto-enhanced\trading.db").LastWriteTime).TotalMinutes
        if ($age -lt 5) { "ACTIVE" } else { "IDLE" }
    } else { "STOPPED" }
    
    # Create report
    $report = @"
Dev Snapshot - $(Get-Date -Format 'HH:mm:ss')
==============================
CPU: $cpu%
RAM: $ram MB available
Trading Bot: $botStatus

Quick Actions:
- Ctrl+Shift+S: Screenshot
- Ctrl+Shift+C: Copy status
"@
    
    # Copy to clipboard
    Set-ClipboardText $report
    
    # Screenshot
    $screenshot = "C:\dev\snapshots\dev_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
    Capture-Screenshot -Path $screenshot
    
    # Notify
    Show-WindowsNotification `
        -Title "Dev Snapshot Complete" `
        -Message "Report in clipboard, screenshot saved"
        
    return $report
}

# Use it
Quick-DevSnapshot
```

## 🔧 Advanced Usage

### Pattern 1: Safe Automation

```powershell
# Always save and restore mouse position
$originalPos = Get-MousePosition

try {
    # Your automation code
    Move-Mouse -X 500 -Y 300
    Click-AtPosition
    Type-Text -Text "Automated input"
    
    # Success notification
    Show-WindowsNotification `
        -Title "Success" `
        -Message "Automation completed"
        
} catch {
    Write-Error "Automation failed: $_"
    
    Show-WindowsNotification `
        -Title "Error" `
        -Message "Automation failed"
        
} finally {
    # Always restore mouse
    Move-Mouse -X $originalPos.X -Y $originalPos.Y
}
```

### Pattern 2: Keyboard Macro

```powershell
function Invoke-KeyboardMacro {
    param([array]$Actions)
    
    foreach ($action in $Actions) {
        switch ($action.Type) {
            'Type' {
                Type-Text -Text $action.Text
            }
            'Keys' {
                Send-Keys $action.Keys
            }
            'Combo' {
                Send-KeyCombo $action.Combo
            }
            'Wait' {
                Start-Sleep -Milliseconds $action.Ms
            }
        }
    }
}

# Define macro
$saveMacro = @(
    @{Type='Combo'; Combo='^a'}        # Select all
    @{Type='Combo'; Combo='^c'}        # Copy
    @{Type='Keys'; Keys='{ENTER}'}     # New line
    @{Type='Type'; Text='Copied!'}     # Type confirmation
    @{Type='Wait'; Ms=1000}            # Wait 1 second
)

Invoke-KeyboardMacro -Actions $saveMacro
```

### Pattern 3: Mouse Click Sequence

```powershell
function Invoke-ClickSequence {
    param([array]$Clicks)
    
    foreach ($click in $Clicks) {
        Write-Host "Clicking: $($click.Description)"
        
        if ($click.Smooth) {
            Move-Mouse -X $click.X -Y $click.Y -Smooth
        } else {
            Move-Mouse -X $click.X -Y $click.Y
        }
        
        Start-Sleep -Milliseconds 200
        Click-AtPosition -Button $click.Button
        Start-Sleep -Milliseconds $click.Delay
    }
}

# Example sequence
$menuSequence = @(
    @{X=100; Y=50; Button='Left'; Delay=300; Description='File menu'}
    @{X=150; Y=100; Button='Left'; Delay=300; Description='Save As'}
    @{X=500; Y=400; Button='Left'; Delay=500; Description='Save button'}
)

Invoke-ClickSequence -Clicks $menuSequence
```

## 📚 Complete Function Reference

| Function | Category | Description |
|----------|----------|-------------|
| **Send-Keys** | Keyboard | Send key sequences (Enter, Tab, F-keys) |
| **Type-Text** | Keyboard | Type text with character delays |
| **Send-KeyCombo** | Keyboard | Send keyboard shortcuts |
| **Get-MousePosition** | Mouse | Get cursor coordinates |
| **Move-Mouse** | Mouse | Move cursor (instant or smooth) |
| **Click-AtPosition** | Mouse | Click at position (left/right/middle) |
| **Double-Click** | Mouse | Double-click at position |
| **Right-Click** | Mouse | Right-click at position |
| **Drag-Mouse** | Mouse | Drag from point A to B |
| **Get-ClipboardText** | Clipboard | Read clipboard |
| **Set-ClipboardText** | Clipboard | Write to clipboard |
| **Capture-Screenshot** | Screen | Take screenshot |
| **Show-WindowsNotification** | System | Show toast notification |
| **Get-AllWindows** | Windows | List all windows |
| **Focus-WindowByTitle** | Windows | Focus window by title |

## 🎓 Learning Resources

### Demo Scripts
```powershell
# Comprehensive keyboard & mouse demo
C:\dev\tools\windows-automation\keyboard-mouse-demo.ps1

# Practical real-world examples
C:\dev\tools\windows-automation\practical-examples.ps1

# Complete feature showcase
C:\dev\tools\windows-automation\demo.ps1
```

### Documentation
- **Keyboard & Mouse Guide**: `KEYBOARD_MOUSE_GUIDE.md` - Complete reference with 30+ examples
- **Main README**: This file - Quick reference and getting started
- **Demo Scripts**: Working examples you can run immediately

## ⚙️ Configuration

### Adding to PowerShell Profile

```powershell
# Edit profile
notepad $PROFILE

# Add this line:
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1

# Save and reload
. $PROFILE
```

### Integration with npm Scripts

```json
{
  "scripts": {
    "build:notify": "npm run build && powershell -Command \"Import-Module C:/dev/tools/windows-automation/WindowsAutomation.psm1; Show-WindowsNotification -Title 'Build Complete' -Message 'Your build finished successfully'\""
  }
}
```

## 🔗 Integration Examples

### Trading Bot Monitoring

```powershell
# Add to your trading bot startup
function Start-TradingBotWithNotifications {
    # Start bot
    python C:\dev\projects\crypto-enhanced\start_live_trading.py
    
    # Notify when started
    Show-WindowsNotification `
        -Title "Trading Bot Started" `
        -Message "XLM/USD monitoring active"
}
```

### Build Process Automation

```powershell
# Automated build workflow
function Build-WithScreenshot {
    # Take pre-build screenshot
    Capture-Screenshot -Path "C:\dev\builds\pre_build.png"
    
    # Run build
    npm run build
    
    # Take post-build screenshot
    Capture-Screenshot -Path "C:\dev\builds\post_build.png"
    
    # Copy build log to clipboard
    $log = Get-Content .\build.log -Tail 20 -Raw
    Set-ClipboardText $log
    
    # Notify
    Show-WindowsNotification `
        -Title "Build Complete" `
        -Message "Build log copied to clipboard"
}
```

## ⚠️ Best Practices

1. **Always add delays** between actions for reliability
2. **Save and restore** mouse position for safety
3. **Use try-catch-finally** for error handling
4. **Test coordinates** before running automation
5. **Use smooth movement** for demos/debugging
6. **Handle special characters** properly in text

## 🆚 Comparison: This vs Windows-MCP

| Feature | This Library | Windows-MCP |
|---------|-------------|-------------|
| **Status** | ✅ Working now | ❌ venv issues |
| **Clipboard** | ✅ Tested | ❌ Broken |
| **Screenshots** | ✅ Working | ❌ Broken |
| **Notifications** | ✅ Working | ❌ Broken |
| **Keyboard** | ✅ Full support | ❌ Limited |
| **Mouse** | ✅ Full support | ❌ Limited |
| **Setup** | ✅ Import & go | ❌ Complex |
| **Customization** | ✅ Full control | ⚠️ Limited |
| **Integration** | ✅ PowerShell/Python | ⚠️ Python only |

## 🎉 Success Stories

### ✅ Demonstrated Working Features
- ✅ Keyboard text input (Type-Text)
- ✅ Special key sequences (Send-Keys)
- ✅ Keyboard shortcuts (Send-KeyCombo)
- ✅ Mouse position tracking (Get-MousePosition)
- ✅ Mouse movement (instant & smooth)
- ✅ Left/right/double clicking
- ✅ Drag and drop operations
- ✅ Clipboard read/write
- ✅ Screenshot capture
- ✅ Windows notifications
- ✅ Window listing and focus

All features have been tested and confirmed working!

## 📍 File Locations

```
C:\dev\tools\windows-automation\
├── WindowsAutomation.psm1          # Main PowerShell module
├── windows_automation.py            # Python async version
├── README.md                        # This file
├── KEYBOARD_MOUSE_GUIDE.md          # Detailed keyboard/mouse reference
├── demo.ps1                         # Feature showcase demo
├── keyboard-mouse-demo.ps1          # Keyboard & mouse demo
├── practical-examples.ps1           # Real-world examples
├── trading-bot-watcher.ps1          # Trading bot monitoring
├── dashboard.ps1                    # System monitoring dashboard
└── workflow-demo.ps1                # Dev workflow automation
```

## 🚀 Get Started Now!

```powershell
# Run the full demo
C:\dev\tools\windows-automation\demo.ps1

# Or start with keyboard & mouse
C:\dev\tools\windows-automation\keyboard-mouse-demo.ps1

# Or try practical examples
C:\dev\tools\windows-automation\practical-examples.ps1
```

---

**Status**: ✅ Fully functional and production-ready  
**Location**: `C:\dev\tools\windows-automation\`  
**Support**: All features tested and documented  
**Last Updated**: 2025-10-12
