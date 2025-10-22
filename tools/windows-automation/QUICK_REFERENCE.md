# Windows Automation - Quick Reference Card

## 🚀 Import Module
```powershell
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1
```

## 🎹 KEYBOARD

```powershell
# Type text naturally
Type-Text -Text "Hello World"
Type-Text -Text "Slower typing" -DelayPerChar 100

# Send special keys
Send-Keys "{ENTER}"          # Enter
Send-Keys "{TAB}"            # Tab
Send-Keys "{F5}"             # Function keys
Send-Keys "{UP}{DOWN}"       # Arrow keys
Send-Keys "{ESC}"            # Escape

# Keyboard shortcuts
Send-KeyCombo "^c"           # Ctrl+C
Send-KeyCombo "^v"           # Ctrl+V
Send-KeyCombo "^a"           # Ctrl+A
Send-KeyCombo "%{F4}"        # Alt+F4
Send-KeyCombo "^+s"          # Ctrl+Shift+S
```

### Special Key Reference
| Key | Code | Key | Code |
|-----|------|-----|------|
| Enter | `{ENTER}` | Backspace | `{BACKSPACE}` |
| Tab | `{TAB}` | Delete | `{DELETE}` |
| Escape | `{ESC}` | Space | ` ` or `{SPACE}` |
| Up | `{UP}` | Down | `{DOWN}` |
| Left | `{LEFT}` | Right | `{RIGHT}` |
| Home | `{HOME}` | End | `{END}` |
| Page Up | `{PGUP}` | Page Down | `{PGDN}` |

### Modifier Keys
- `^` = Ctrl
- `%` = Alt
- `+` = Shift
- `^+s` = Ctrl+Shift+S

## 🖱️ MOUSE

```powershell
# Get position
$pos = Get-MousePosition
# Returns: @{X=123; Y=456}

# Move mouse
Move-Mouse -X 500 -Y 300           # Instant
Move-Mouse -X 800 -Y 400 -Smooth   # Animated

# Click
Click-AtPosition -X 500 -Y 300                # Left
Click-AtPosition -X 500 -Y 300 -Button Right  # Right
Click-AtPosition -X 500 -Y 300 -Button Middle # Middle

# Special clicks
Double-Click -X 500 -Y 300
Right-Click -X 600 -Y 400

# Drag and drop
Drag-Mouse -FromX 100 -FromY 100 -ToX 500 -ToY 500
```

## 📋 CLIPBOARD

```powershell
# Read
$text = Get-ClipboardText

# Write
Set-ClipboardText "Automated content"
```

## 📸 SCREENSHOT

```powershell
# Capture screen
Capture-Screenshot -Path "C:\dev\screenshot.png"

# With timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Capture-Screenshot -Path "C:\dev\screen_$timestamp.png"
```

## 🔔 NOTIFICATION

```powershell
Show-WindowsNotification `
    -Title "Build Complete" `
    -Message "Your build finished successfully"
```

## 🪟 WINDOWS

```powershell
# List windows
$windows = Get-AllWindows
$windows | ForEach-Object { $_.Title }

# Focus window
Focus-WindowByTitle "Chrome"
Focus-WindowByTitle "Visual Studio Code"
```

## 🎯 COMMON PATTERNS

### Pattern 1: Safe Automation
```powershell
$original = Get-MousePosition
try {
    # Your automation
    Move-Mouse -X 500 -Y 300
    Click-AtPosition
} finally {
    Move-Mouse -X $original.X -Y $original.Y
}
```

### Pattern 2: Form Filling
```powershell
Type-Text -Text "John Doe"
Send-Keys "{TAB}"
Type-Text -Text "john@example.com"
Send-Keys "{TAB}"
Type-Text -Text "555-1234"
Send-Keys "{ENTER}"
```

### Pattern 3: Menu Navigation
```powershell
Click-AtPosition -X 100 -Y 50    # File menu
Start-Sleep -Milliseconds 300
Click-AtPosition -X 150 -Y 100   # Save As
Start-Sleep -Milliseconds 300
Type-Text -Text "filename.txt"
Send-Keys "{ENTER}"
```

### Pattern 4: Screenshot + Notification
```powershell
$path = Capture-Screenshot -Path "C:\dev\screenshot.png"
Set-ClipboardText $path
Show-WindowsNotification `
    -Title "Screenshot Captured" `
    -Message "Path copied to clipboard"
```

### Pattern 5: Status Report
```powershell
$status = @"
Status Report
=============
Time: $(Get-Date -Format 'HH:mm:ss')
Mouse: $(Get-MousePosition | ConvertTo-Json -Compress)
"@

Set-ClipboardText $status
Show-WindowsNotification `
    -Title "Status Ready" `
    -Message "Report in clipboard"
```

## 🚀 QUICK START EXAMPLES

### Example 1: Hello World
```powershell
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1
Type-Text -Text "Hello from Windows Automation!"
Show-WindowsNotification -Title "Success!" -Message "It works!"
```

### Example 2: Mouse Position Logger
```powershell
for ($i = 0; $i -lt 5; $i++) {
    $pos = Get-MousePosition
    Write-Host "$i: Mouse at ($($pos.X), $($pos.Y))"
    Start-Sleep -Seconds 1
}
```

### Example 3: Clipboard Workflow
```powershell
$data = "Automated at $(Get-Date)"
Set-ClipboardText $data
Write-Host "Clipboard set. Press Ctrl+V to paste: $data"
```

### Example 4: Screenshot Series
```powershell
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Screenshot $i in 3 seconds..."
    Start-Sleep -Seconds 3
    Capture-Screenshot -Path "C:\dev\screenshot_$i.png"
    Write-Host "Captured!"
}
```

## 📚 DEMO SCRIPTS

```powershell
# Full feature demo
C:\dev\tools\windows-automation\demo.ps1

# Keyboard & mouse demo
C:\dev\tools\windows-automation\keyboard-mouse-demo.ps1

# Practical examples
C:\dev\tools\windows-automation\practical-examples.ps1
```

## 🔗 FULL DOCUMENTATION

- **Complete Guide**: `README.md`
- **Detailed Reference**: `KEYBOARD_MOUSE_GUIDE.md`
- **Module Source**: `WindowsAutomation.psm1`

## ⚡ ONE-LINERS

```powershell
# Quick screenshot
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1; Capture-Screenshot -Path "C:\dev\quick.png"

# Quick notification
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1; Show-WindowsNotification -Title "Alert" -Message "Something happened"

# Quick clipboard
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1; Set-ClipboardText "Quick content"; Write-Host "Clipboard set!"

# Mouse position
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1; $p = Get-MousePosition; Write-Host "Mouse: ($($p.X), $($p.Y))"
```

---

**Location**: `C:\dev\tools\windows-automation\`  
**Status**: ✅ All features working  
**Version**: 1.0 (2025-10-12)
