# Windows Automation Library for Desktop Commander
# Provides Windows-MCP-like functionality via PowerShell

# Launch Application from Start Menu
function Launch-App {
    param([string]$AppName)
    Start-Process "shell:AppsFolder\$AppName"
}

# Get Clipboard Content
function Get-ClipboardText {
    return Get-Clipboard
}

# Set Clipboard Content
function Set-ClipboardText {
    param([string]$Text)
    Set-Clipboard -Value $Text
}

# List All Windows
function Get-AllWindows {
    Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        using System.Text;
        public class Win32 {
            [DllImport("user32.dll")]
            public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
            [DllImport("user32.dll")]
            public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
            [DllImport("user32.dll")]
            public static extern bool IsWindowVisible(IntPtr hWnd);
            public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
        }
"@
    
    $windows = @()
    $callback = {
        param($hwnd, $param)
        if ([Win32]::IsWindowVisible($hwnd)) {
            $title = New-Object System.Text.StringBuilder 256
            [Win32]::GetWindowText($hwnd, $title, $title.Capacity) | Out-Null
            if ($title.Length -gt 0) {
                $windows += [PSCustomObject]@{
                    Handle = $hwnd
                    Title = $title.ToString()
                }
            }
        }
        return $true
    }
    
    [Win32]::EnumWindows($callback, [IntPtr]::Zero)
    return $windows
}

# Focus Window by Title
function Focus-WindowByTitle {
    param([string]$Title)
    $shell = New-Object -ComObject WScript.Shell
    $shell.AppActivate($Title)
}

# Send Keyboard Input
function Send-Keys {
    param([string]$Keys)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
}

# Mouse Click at Coordinates
function Click-AtPosition {
    param(
        [int]$X,
        [int]$Y,
        [string]$Button = "Left"
    )
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
    
    Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
            [DllImport("user32.dll")]
            public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
            public const int MOUSEEVENTF_LEFTDOWN = 0x02;
            public const int MOUSEEVENTF_LEFTUP = 0x04;
            public const int MOUSEEVENTF_RIGHTDOWN = 0x08;
            public const int MOUSEEVENTF_RIGHTUP = 0x10;
        }
"@
    
    if ($Button -eq "Left") {
        [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 50
        [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    }
}

# Take Screenshot
function Capture-Screenshot {
    param([string]$Path = "$env:TEMP\screenshot.png")
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
    $bitmap.Save($Path)
    $graphics.Dispose()
    $bitmap.Dispose()
    return $Path
}

# Show Notification
function Show-WindowsNotification {
    param(
        [string]$Title,
        [string]$Message
    )
    Add-Type -AssemblyName System.Windows.Forms
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Information
    $notification.BalloonTipTitle = $Title
    $notification.BalloonTipText = $Message
    $notification.Visible = $true
    $notification.ShowBalloonTip(5000)
}

# ============================================
# KEYBOARD AUTOMATION
# ============================================

# Send keyboard input using SendKeys
function Send-Keys {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Keys,
        
        [int]$DelayMs = 100
    )
    
    Add-Type -AssemblyName System.Windows.Forms
    
    # Small delay before sending keys
    Start-Sleep -Milliseconds $DelayMs
    
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
    
    return "Keys sent: $Keys"
}

# Type text naturally with delays between characters
function Type-Text {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Text,
        
        [int]$DelayPerChar = 50
    )
    
    Add-Type -AssemblyName System.Windows.Forms
    
    # Escape special SendKeys characters
    $escaped = $Text -replace '([+^%~()\[\]{}])', '{$1}'
    
    foreach ($char in $escaped.ToCharArray()) {
        [System.Windows.Forms.SendKeys]::SendWait($char.ToString())
        Start-Sleep -Milliseconds $DelayPerChar
    }
    
    return "Typed: $Text"
}

# Send key combination (e.g., Ctrl+C, Alt+Tab)
function Send-KeyCombo {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Combo
    )
    
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait($Combo)
    
    return "Key combo sent: $Combo"
}

# ============================================
# MOUSE AUTOMATION
# ============================================

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class MouseHelper {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    
    public struct POINT {
        public int X;
        public int Y;
    }
    
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
}
"@

# Get current mouse position
function Get-MousePosition {
    $point = New-Object MouseHelper+POINT
    [MouseHelper]::GetCursorPos([ref]$point) | Out-Null
    
    return [PSCustomObject]@{
        X = $point.X
        Y = $point.Y
    }
}

# Move mouse to position
function Move-Mouse {
    param(
        [Parameter(Mandatory=$true)]
        [int]$X,
        
        [Parameter(Mandatory=$true)]
        [int]$Y,
        
        [switch]$Smooth
    )
    
    if ($Smooth) {
        # Smooth movement
        $current = Get-MousePosition
        $steps = 20
        $deltaX = ($X - $current.X) / $steps
        $deltaY = ($Y - $current.Y) / $steps
        
        for ($i = 0; $i -lt $steps; $i++) {
            $newX = [int]($current.X + ($deltaX * $i))
            $newY = [int]($current.Y + ($deltaY * $i))
            [MouseHelper]::SetCursorPos($newX, $newY)
            Start-Sleep -Milliseconds 10
        }
    }
    
    [MouseHelper]::SetCursorPos($X, $Y)
    
    return "Mouse moved to: ($X, $Y)"
}

# Click at current position or specific coordinates
function Click-AtPosition {
    param(
        [int]$X,
        [int]$Y,
        [ValidateSet('Left', 'Right', 'Middle')]
        [string]$Button = 'Left',
        [int]$DelayMs = 100
    )
    
    # Move to position if coordinates provided
    if ($PSBoundParameters.ContainsKey('X') -and $PSBoundParameters.ContainsKey('Y')) {
        [MouseHelper]::SetCursorPos($X, $Y)
        Start-Sleep -Milliseconds 50
    }
    
    # Get current position for return message
    $pos = Get-MousePosition
    
    # Determine which button to click
    $downFlag = 0
    $upFlag = 0
    
    switch ($Button) {
        'Left' {
            $downFlag = [MouseHelper]::MOUSEEVENTF_LEFTDOWN
            $upFlag = [MouseHelper]::MOUSEEVENTF_LEFTUP
        }
        'Right' {
            $downFlag = [MouseHelper]::MOUSEEVENTF_RIGHTDOWN
            $upFlag = [MouseHelper]::MOUSEEVENTF_RIGHTUP
        }
        'Middle' {
            $downFlag = [MouseHelper]::MOUSEEVENTF_MIDDLEDOWN
            $upFlag = [MouseHelper]::MOUSEEVENTF_MIDDLEUP
        }
    }
    
    # Perform click
    [MouseHelper]::mouse_event($downFlag, 0, 0, 0, 0)
    Start-Sleep -Milliseconds $DelayMs
    [MouseHelper]::mouse_event($upFlag, 0, 0, 0, 0)
    
    return "$Button click at: ($($pos.X), $($pos.Y))"
}

# Double click at position
function Double-Click {
    param(
        [int]$X,
        [int]$Y
    )
    
    if ($PSBoundParameters.ContainsKey('X') -and $PSBoundParameters.ContainsKey('Y')) {
        [MouseHelper]::SetCursorPos($X, $Y)
        Start-Sleep -Milliseconds 50
    }
    
    # First click
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    
    Start-Sleep -Milliseconds 50
    
    # Second click
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    
    $pos = Get-MousePosition
    return "Double clicked at: ($($pos.X), $($pos.Y))"
}

# Right click at position
function Right-Click {
    param(
        [int]$X,
        [int]$Y
    )
    
    return Click-AtPosition @PSBoundParameters -Button 'Right'
}

# Drag mouse from one position to another
function Drag-Mouse {
    param(
        [Parameter(Mandatory=$true)]
        [int]$FromX,
        
        [Parameter(Mandatory=$true)]
        [int]$FromY,
        
        [Parameter(Mandatory=$true)]
        [int]$ToX,
        
        [Parameter(Mandatory=$true)]
        [int]$ToY
    )
    
    # Move to start position
    [MouseHelper]::SetCursorPos($FromX, $FromY)
    Start-Sleep -Milliseconds 100
    
    # Press mouse button down
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 100
    
    # Drag to end position (smooth movement)
    $steps = 20
    $deltaX = ($ToX - $FromX) / $steps
    $deltaY = ($ToY - $FromY) / $steps
    
    for ($i = 0; $i -lt $steps; $i++) {
        $newX = [int]($FromX + ($deltaX * $i))
        $newY = [int]($FromY + ($deltaY * $i))
        [MouseHelper]::SetCursorPos($newX, $newY)
        Start-Sleep -Milliseconds 20
    }
    
    # Move to final position
    [MouseHelper]::SetCursorPos($ToX, $ToY)
    Start-Sleep -Milliseconds 100
    
    # Release mouse button
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    
    return "Dragged from ($FromX, $FromY) to ($ToX, $ToY)"
}

# Export functions
Export-ModuleMember -Function *
