# ============================================================================
# Desktop Commander Automation Library
# Comprehensive Windows automation optimized for Desktop Commander
# ============================================================================

# Load required assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName PresentationFramework

# ============================================================================
# NATIVE WINDOWS API DEFINITIONS
# ============================================================================

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class NativeWindows {
    // Window Management
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
    
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    
    // Mouse Control
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    
    // Keyboard Control  
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    // Constants
    public const int SW_HIDE = 0;
    public const int SW_SHOWNORMAL = 1;
    public const int SW_SHOWMINIMIZED = 2;
    public const int SW_MAXIMIZE = 3;
    public const int SW_SHOWNOACTIVATE = 4;
    public const int SW_SHOW = 5;
    public const int SW_MINIMIZE = 6;
    public const int SW_SHOWMINNOACTIVE = 7;
    public const int SW_SHOWNA = 8;
    public const int SW_RESTORE = 9;
    
    public const uint MOUSEEVENTF_MOVE = 0x0001;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    public const uint MOUSEEVENTF_WHEEL = 0x0800;
    public const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
    
    public const uint KEYEVENTF_KEYUP = 0x0002;
    
    // Structures
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    public struct POINT {
        public int X;
        public int Y;
    }
    
    // Delegates
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
}
"@

# ============================================================================
# KEYBOARD AUTOMATION
# ============================================================================

function Send-Keys {
    <#
    .SYNOPSIS
        Send keyboard input to the active window
    .EXAMPLE
        Send-Keys -Text "Hello World"
        Send-Keys -Text "^c"  # Ctrl+C
        Send-Keys -Text "%{F4}"  # Alt+F4
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Text,
        
        [switch]$Wait
    )
    
    try {
        if ($Wait) {
            [System.Windows.Forms.SendKeys]::SendWait($Text)
        } else {
            [System.Windows.Forms.SendKeys]::Send($Text)
        }
        Write-Verbose "Sent keys: $Text"
        return @{Success=$true; Message="Keys sent successfully"}
    } catch {
        Write-Error "Failed to send keys: $_"
        return @{Success=$false; Message=$_.Exception.Message}
    }
}

function Send-KeyCombo {
    <#
    .SYNOPSIS
        Send specific key combinations
    .EXAMPLE
        Send-KeyCombo -Key "C" -Ctrl
        Send-KeyCombo -Key "F4" -Alt
    #>
    param(
        [string]$Key,
        [switch]$Ctrl,
        [switch]$Alt,
        [switch]$Shift,
        [switch]$Win
    )
    
    $combo = ""
    if ($Ctrl) { $combo += "^" }
    if ($Alt) { $combo += "%" }
    if ($Shift) { $combo += "+" }
    if ($Win) { $combo += "^{ESC}" }  # Windows key approximation
    $combo += $Key
    
    Send-Keys -Text $combo -Wait
}

# ============================================================================
# MOUSE AUTOMATION
# ============================================================================

function Get-MousePosition {
    <#
    .SYNOPSIS
        Get current mouse cursor position
    #>
    $pos = New-Object NativeWindows+POINT
    [void][NativeWindows]::GetCursorPos([ref]$pos)
    return @{X=$pos.X; Y=$pos.Y}
}

function Set-MousePosition {
    <#
    .SYNOPSIS
        Move mouse to specific coordinates
    .EXAMPLE
        Set-MousePosition -X 100 -Y 200
    #>
    param(
        [Parameter(Mandatory=$true)]
        [int]$X,
        
        [Parameter(Mandatory=$true)]
        [int]$Y
    )
    
    [void][NativeWindows]::SetCursorPos($X, $Y)
    Write-Verbose "Mouse moved to: $X, $Y"
}

function Send-MouseClick {
    <#
    .SYNOPSIS
        Simulate mouse click
    .EXAMPLE
        Send-MouseClick -Button Left
        Send-MouseClick -Button Right -X 100 -Y 200
    #>
    param(
        [ValidateSet("Left","Right","Middle")]
        [string]$Button = "Left",
        
        [int]$X,
        [int]$Y,
        
        [switch]$DoubleClick
    )
    
    # Move if coordinates specified
    if ($PSBoundParameters.ContainsKey('X') -and $PSBoundParameters.ContainsKey('Y')) {
        Set-MousePosition -X $X -Y $Y
        Start-Sleep -Milliseconds 50
    }
    
    # Determine button flags
    $downFlag = switch ($Button) {
        "Left" { [NativeWindows]::MOUSEEVENTF_LEFTDOWN }
        "Right" { [NativeWindows]::MOUSEEVENTF_RIGHTDOWN }
        "Middle" { [NativeWindows]::MOUSEEVENTF_MIDDLEDOWN }
    }
    
    $upFlag = switch ($Button) {
        "Left" { [NativeWindows]::MOUSEEVENTF_LEFTUP }
        "Right" { [NativeWindows]::MOUSEEVENTF_RIGHTUP }
        "Middle" { [NativeWindows]::MOUSEEVENTF_MIDDLEUP }
    }
    
    # Click
    [NativeWindows]::mouse_event($downFlag, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    [NativeWindows]::mouse_event($upFlag, 0, 0, 0, 0)
    
    if ($DoubleClick) {
        Start-Sleep -Milliseconds 50
        [NativeWindows]::mouse_event($downFlag, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 50
        [NativeWindows]::mouse_event($upFlag, 0, 0, 0, 0)
    }
    
    Write-Verbose "$Button click performed"
}

function Send-MouseDrag {
    <#
    .SYNOPSIS
        Drag mouse from one position to another
    .EXAMPLE
        Send-MouseDrag -FromX 100 -FromY 100 -ToX 300 -ToY 300
    #>
    param(
        [int]$FromX,
        [int]$FromY,
        [int]$ToX,
        [int]$ToY,
        [int]$Steps = 10
    )
    
    Set-MousePosition -X $FromX -Y $FromY
    Start-Sleep -Milliseconds 100
    
    [NativeWindows]::mouse_event([NativeWindows]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    
    for ($i = 0; $i -le $Steps; $i++) {
        $x = $FromX + (($ToX - $FromX) * $i / $Steps)
        $y = $FromY + (($ToY - $FromY) * $i / $Steps)
        Set-MousePosition -X $x -Y $y
        Start-Sleep -Milliseconds 20
    }
    
    [NativeWindows]::mouse_event([NativeWindows]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Write-Verbose "Drag complete: ($FromX,$FromY) -> ($ToX,$ToY)"
}

# ============================================================================
# WINDOW MANAGEMENT
# ============================================================================

function Get-AllWindows {
    <#
    .SYNOPSIS
        Get all visible windows
    #>
    $windows = @()
    
    $callback = {
        param($hwnd, $lParam)
        
        if ([NativeWindows]::IsWindowVisible($hwnd)) {
            $title = New-Object System.Text.StringBuilder 256
            [void][NativeWindows]::GetWindowText($hwnd, $title, 256)
            
            if ($title.Length -gt 0) {
                $processId = 0
                [void][NativeWindows]::GetWindowThreadProcessId($hwnd, [ref]$processId)
                
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    $rect = New-Object NativeWindows+RECT
                    [void][NativeWindows]::GetWindowRect($hwnd, [ref]$rect)
                    
                    $script:windows += [PSCustomObject]@{
                        Handle = $hwnd
                        Title = $title.ToString()
                        ProcessName = $process.ProcessName
                        ProcessId = $processId
                        X = $rect.Left
                        Y = $rect.Top
                        Width = $rect.Right - $rect.Left
                        Height = $rect.Bottom - $rect.Top
                    }
                } catch {}
            }
        }
        return $true
    }
    
    $script:windows = @()
    $enumDelegate = [NativeWindows+EnumWindowsProc]$callback
    [void][NativeWindows]::EnumWindows($enumDelegate, [IntPtr]::Zero)
    
    return $script:windows
}

function Get-ActiveWindow {
    <#
    .SYNOPSIS
        Get the currently focused window
    #>
    $hwnd = [NativeWindows]::GetForegroundWindow()
    $title = New-Object System.Text.StringBuilder 256
    [void][NativeWindows]::GetWindowText($hwnd, $title, 256)
    
    $processId = 0
    [void][NativeWindows]::GetWindowThreadProcessId($hwnd, [ref]$processId)
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    $rect = New-Object NativeWindows+RECT
    [void][NativeWindows]::GetWindowRect($hwnd, [ref]$rect)
    
    return [PSCustomObject]@{
        Handle = $hwnd
        Title = $title.ToString()
        ProcessName = $process.ProcessName
        ProcessId = $processId
        X = $rect.Left
        Y = $rect.Top
        Width = $rect.Right - $rect.Left
        Height = $rect.Bottom - $rect.Top
    }
}

function Set-WindowFocus {
    <#
    .SYNOPSIS
        Bring window to front and focus it
    .EXAMPLE
        Set-WindowFocus -Title "Chrome"
        Set-WindowFocus -Handle $hwnd
    #>
    param(
        [string]$Title,
        [IntPtr]$Handle
    )
    
    if (-not $Handle) {
        $windows = Get-AllWindows
        $window = $windows | Where-Object { $_.Title -like "*$Title*" } | Select-Object -First 1
        
        if (-not $window) {
            Write-Error "Window not found: $Title"
            return $false
        }
        
        $Handle = $window.Handle
    }
    
    # Restore if minimized
    [void][NativeWindows]::ShowWindow($Handle, [NativeWindows]::SW_RESTORE)
    Start-Sleep -Milliseconds 100
    
    # Bring to front
    $result = [NativeWindows]::SetForegroundWindow($Handle)
    Write-Verbose "Window focused: $result"
    return $result
}

function Set-WindowPosition {
    <#
    .SYNOPSIS
        Move and/or resize a window
    .EXAMPLE
        Set-WindowPosition -Title "Chrome" -X 0 -Y 0 -Width 1920 -Height 1080
    #>
    param(
        [string]$Title,
        [IntPtr]$Handle,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )
    
    if (-not $Handle) {
        $windows = Get-AllWindows
        $window = $windows | Where-Object { $_.Title -like "*$Title*" } | Select-Object -First 1
        
        if (-not $window) {
            Write-Error "Window not found: $Title"
            return $false
        }
        
        $Handle = $window.Handle
        
        # Use current dimensions if not specified
        if (-not $Width) { $Width = $window.Width }
        if (-not $Height) { $Height = $window.Height }
        if (-not $PSBoundParameters.ContainsKey('X')) { $X = $window.X }
        if (-not $PSBoundParameters.ContainsKey('Y')) { $Y = $window.Y }
    }
    
    $result = [NativeWindows]::MoveWindow($Handle, $X, $Y, $Width, $Height, $true)
    Write-Verbose "Window moved: $result"
    return $result
}

function Set-WindowState {
    <#
    .SYNOPSIS
        Change window state (minimize, maximize, restore)
    .EXAMPLE
        Set-WindowState -Title "Chrome" -State Maximize
    #>
    param(
        [string]$Title,
        [IntPtr]$Handle,
        [ValidateSet("Minimize","Maximize","Restore","Hide","Show")]
        [string]$State
    )
    
    if (-not $Handle) {
        $windows = Get-AllWindows
        $window = $windows | Where-Object { $_.Title -like "*$Title*" } | Select-Object -First 1
        
        if (-not $window) {
            Write-Error "Window not found: $Title"
            return $false
        }
        
        $Handle = $window.Handle
    }
    
    $stateFlag = switch ($State) {
        "Minimize" { [NativeWindows]::SW_MINIMIZE }
        "Maximize" { [NativeWindows]::SW_MAXIMIZE }
        "Restore" { [NativeWindows]::SW_RESTORE }
        "Hide" { [NativeWindows]::SW_HIDE }
        "Show" { [NativeWindows]::SW_SHOW }
    }
    
    $result = [NativeWindows]::ShowWindow($Handle, $stateFlag)
    Write-Verbose "Window state changed to $State - Result: $result"
    return $result
}

# ============================================================================
# SCREEN CAPTURE
# ============================================================================

function Capture-Screen {
    <#
    .SYNOPSIS
        Capture screenshot
    .EXAMPLE
        Capture-Screen -Path "C:\temp\screenshot.png"
        Capture-Screen -Path "C:\temp\region.png" -X 100 -Y 100 -Width 800 -Height 600
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [int]$X = 0,
        [int]$Y = 0,
        [int]$Width,
        [int]$Height,
        
        [ValidateSet("Png","Jpeg","Bmp","Gif")]
        [string]$Format = "Png"
    )
    
    # Get screen bounds if not specified
    if (-not $Width -or -not $Height) {
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        if (-not $Width) { $Width = $bounds.Width }
        if (-not $Height) { $Height = $bounds.Height }
    }
    
    # Create bitmap
    $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Capture
    $graphics.CopyFromScreen($X, $Y, 0, 0, $bitmap.Size)
    
    # Save
    $imageFormat = [System.Drawing.Imaging.ImageFormat]::$Format
    $bitmap.Save($Path, $imageFormat)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Verbose "Screenshot saved: $Path ($($(Get-Item $Path).Length / 1KB) KB)"
    return @{
        Success = $true
        Path = $Path
        Size = (Get-Item $Path).Length
    }
}

function Capture-Window {
    <#
    .SYNOPSIS
        Capture screenshot of specific window
    .EXAMPLE
        Capture-Window -Title "Chrome" -Path "C:\temp\chrome.png"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [string]$Title,
        [IntPtr]$Handle
    )
    
    if (-not $Handle) {
        $windows = Get-AllWindows
        $window = $windows | Where-Object { $_.Title -like "*$Title*" } | Select-Object -First 1
        
        if (-not $window) {
            Write-Error "Window not found: $Title"
            return $false
        }
        
        # Use window dimensions
        return Capture-Screen -Path $Path -X $window.X -Y $window.Y -Width $window.Width -Height $window.Height
    }
}

# ============================================================================
# CLIPBOARD MANAGEMENT
# ============================================================================

function Get-ClipboardContent {
    <#
    .SYNOPSIS
        Get clipboard text content
    #>
    return Get-Clipboard -Format Text
}

function Set-ClipboardContent {
    <#
    .SYNOPSIS
        Set clipboard text content
    .EXAMPLE
        Set-ClipboardContent -Text "Hello World"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Text
    )
    
    Set-Clipboard -Value $Text
    Write-Verbose "Clipboard set: $($Text.Length) characters"
}

function Set-ClipboardImage {
    <#
    .SYNOPSIS
        Set clipboard to an image
    .EXAMPLE
        Set-ClipboardImage -Path "C:\temp\image.png"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path
    )
    
    $image = [System.Drawing.Image]::FromFile($Path)
    [System.Windows.Forms.Clipboard]::SetImage($image)
    Write-Verbose "Image copied to clipboard: $Path"
}

# ============================================================================
# NOTIFICATIONS
# ============================================================================

function Show-Notification {
    <#
    .SYNOPSIS
        Show Windows notification
    .EXAMPLE
        Show-Notification -Title "Build Complete" -Message "All tests passed"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Title,
        
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [int]$Duration = 5
    )
    
    # Use Windows native toast notification
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
    
    $appId = "DesktopCommander"
    
    $toastXml = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>$Title</text>
            <text>$Message</text>
        </binding>
    </visual>
</toast>
"@
    
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($toastXml)
    $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
    
    Write-Verbose "Notification shown: $Title"
}

# ============================================================================
# SYSTEM MONITORING
# ============================================================================

function Get-SystemMetrics {
    <#
    .SYNOPSIS
        Get current system metrics
    #>
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1
    $memory = Get-CimInstance Win32_OperatingSystem
    
    return [PSCustomObject]@{
        CPU = [math]::Round($cpu.CounterSamples[0].CookedValue, 2)
        MemoryUsedMB = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / 1024, 2)
        MemoryTotalMB = [math]::Round($memory.TotalVisibleMemorySize / 1024, 2)
        MemoryPercent = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)
        ProcessCount = (Get-Process).Count
        Uptime = (Get-Date) - $memory.LastBootUpTime
    }
}

function Watch-Process {
    <#
    .SYNOPSIS
        Monitor a process and execute action when state changes
    .EXAMPLE
        Watch-Process -Name "python" -OnStart {Show-Notification -Title "Started" -Message "Python process started"}
    #>
    param(
        [string]$Name,
        [scriptblock]$OnStart,
        [scriptblock]$OnStop,
        [int]$IntervalSeconds = 5
    )
    
    $wasRunning = $false
    
    while ($true) {
        $process = Get-Process -Name $Name -ErrorAction SilentlyContinue
        $isRunning = $null -ne $process
        
        if ($isRunning -and -not $wasRunning -and $OnStart) {
            & $OnStart
        } elseif (-not $isRunning -and $wasRunning -and $OnStop) {
            & $OnStop
        }
        
        $wasRunning = $isRunning
        Start-Sleep -Seconds $IntervalSeconds
    }
}

# ============================================================================
# AUTOMATION WORKFLOWS
# ============================================================================

function Start-AutomatedWorkflow {
    <#
    .SYNOPSIS
        Execute a sequence of automation actions
    .EXAMPLE
        $workflow = @(
            @{Action="FocusWindow"; Title="Chrome"},
            @{Action="SendKeys"; Text="^t"},
            @{Action="SendKeys"; Text="github.com{ENTER}"},
            @{Action="Wait"; Milliseconds=2000},
            @{Action="Screenshot"; Path="C:\temp\result.png"}
        )
        Start-AutomatedWorkflow -Steps $workflow
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Steps
    )
    
    foreach ($step in $Steps) {
        Write-Verbose "Executing: $($step.Action)"
        
        switch ($step.Action) {
            "FocusWindow" {
                Set-WindowFocus -Title $step.Title
            }
            "SendKeys" {
                Send-Keys -Text $step.Text -Wait
            }
            "Click" {
                Send-MouseClick -X $step.X -Y $step.Y -Button $step.Button
            }
            "Wait" {
                Start-Sleep -Milliseconds $step.Milliseconds
            }
            "Screenshot" {
                Capture-Screen -Path $step.Path
            }
            "Notify" {
                Show-Notification -Title $step.Title -Message $step.Message
            }
            "Clipboard" {
                Set-ClipboardContent -Text $step.Text
            }
        }
        
        # Default wait between steps
        if ($step.Action -ne "Wait") {
            Start-Sleep -Milliseconds 100
        }
    }
    
    Write-Verbose "Workflow complete"
}

# Export all functions
Export-ModuleMember -Function *
