# ============================================================================
# Desktop Commander Pro - Comprehensive Windows Automation Module
# Version: 1.0.0
# Description: Exposes all Windows automation capabilities for Desktop Commander
# ============================================================================

# Add required assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationFramework

# ============================================================================
# KEYBOARD AUTOMATION
# ============================================================================

function Send-KeyPress {
    <#
    .SYNOPSIS
        Simulate keyboard input
    .EXAMPLE
        Send-KeyPress -Keys "Hello World"
        Send-KeyPress -Keys "^c"  # Ctrl+C
        Send-KeyPress -Keys "%{F4}"  # Alt+F4
    .NOTES
        Special Keys:
        ^ = Ctrl
        % = Alt
        + = Shift
        {ENTER} = Enter key
        {TAB} = Tab key
        {BACKSPACE} or {BS} = Backspace
        {DELETE} or {DEL} = Delete
        {UP}, {DOWN}, {LEFT}, {RIGHT} = Arrow keys
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Keys,
        
        [switch]$Wait,
        [int]$DelayMs = 100
    )
    
    try {
        [System.Windows.Forms.SendKeys]::SendWait($Keys)
        if ($Wait) {
            Start-Sleep -Milliseconds $DelayMs
        }
        return @{
            success = $true
            keys_sent = $Keys
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Send-TextInput {
    <#
    .SYNOPSIS
        Type text character by character with optional delay
    .EXAMPLE
        Send-TextInput -Text "Hello World" -DelayMs 50
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Text,
        
        [int]$DelayMs = 50
    )
    
    try {
        foreach ($char in $Text.ToCharArray()) {
            [System.Windows.Forms.SendKeys]::SendWait($char)
            if ($DelayMs -gt 0) {
                Start-Sleep -Milliseconds $DelayMs
            }
        }
        return @{
            success = $true
            chars_sent = $Text.Length
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Send-KeyCombo {
    <#
    .SYNOPSIS
        Send specific key combinations
    .EXAMPLE
        Send-KeyCombo -Ctrl -Key "C"  # Ctrl+C
        Send-KeyCombo -Ctrl -Shift -Key "ESC"  # Ctrl+Shift+Esc
    #>
    param(
        [switch]$Ctrl,
        [switch]$Alt,
        [switch]$Shift,
        [switch]$Win,
        [Parameter(Mandatory=$true)]
        [string]$Key
    )
    
    $modifiers = ""
    if ($Ctrl) { $modifiers += "^" }
    if ($Alt) { $modifiers += "%" }
    if ($Shift) { $modifiers += "+" }
    
    # Windows key requires different handling
    if ($Win) {
        $wsh = New-Object -ComObject WScript.Shell
        $wsh.SendKeys("^{ESC}")  # Simulate Win key
        Start-Sleep -Milliseconds 100
    }
    
    $keys = "$modifiers$Key"
    return Send-KeyPress -Keys $keys
}

# ============================================================================
# MOUSE AUTOMATION
# ============================================================================

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class MouseAutomation {
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
    public const uint MOUSEEVENTF_WHEEL = 0x0800;
}
"@

function Move-MouseCursor {
    <#
    .SYNOPSIS
        Move mouse cursor to specific screen coordinates
    .EXAMPLE
        Move-MouseCursor -X 500 -Y 300
    #>
    param(
        [Parameter(Mandatory=$true)]
        [int]$X,
        
        [Parameter(Mandatory=$true)]
        [int]$Y,
        
        [switch]$Smooth,
        [int]$Steps = 20
    )
    
    try {
        if ($Smooth) {
            $current = Get-MousePosition
            $dx = ($X - $current.X) / $Steps
            $dy = ($Y - $current.Y) / $Steps
            
            for ($i = 0; $i -lt $Steps; $i++) {
                $newX = [int]($current.X + ($dx * $i))
                $newY = [int]($current.Y + ($dy * $i))
                [MouseAutomation]::SetCursorPos($newX, $newY)
                Start-Sleep -Milliseconds 10
            }
        }
        
        [MouseAutomation]::SetCursorPos($X, $Y)
        return @{
            success = $true
            x = $X
            y = $Y
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Get-MousePosition {
    <#
    .SYNOPSIS
        Get current mouse cursor position
    #>
    $point = New-Object MouseAutomation+POINT
    [MouseAutomation]::GetCursorPos([ref]$point) | Out-Null
    return @{
        X = $point.X
        Y = $point.Y
    }
}

function Invoke-MouseClick {
    <#
    .SYNOPSIS
        Simulate mouse click at current position
    .EXAMPLE
        Invoke-MouseClick -Button Left
        Invoke-MouseClick -Button Right -X 500 -Y 300
    #>
    param(
        [ValidateSet('Left', 'Right', 'Middle')]
        [string]$Button = 'Left',
        
        [int]$X = -1,
        [int]$Y = -1,
        
        [switch]$DoubleClick,
        [int]$DelayMs = 50
    )
    
    try {
        # Move to position if specified
        if ($X -ge 0 -and $Y -ge 0) {
            [MouseAutomation]::SetCursorPos($X, $Y)
            Start-Sleep -Milliseconds 50
        }
        
        # Determine button flags
        $downFlag = 0
        $upFlag = 0
        switch ($Button) {
            'Left' {
                $downFlag = [MouseAutomation]::MOUSEEVENTF_LEFTDOWN
                $upFlag = [MouseAutomation]::MOUSEEVENTF_LEFTUP
            }
            'Right' {
                $downFlag = [MouseAutomation]::MOUSEEVENTF_RIGHTDOWN
                $upFlag = [MouseAutomation]::MOUSEEVENTF_RIGHTUP
            }
            'Middle' {
                $downFlag = [MouseAutomation]::MOUSEEVENTF_MIDDLEDOWN
                $upFlag = [MouseAutomation]::MOUSEEVENTF_MIDDLEUP
            }
        }
        
        # Perform click
        [MouseAutomation]::mouse_event($downFlag, 0, 0, 0, 0)
        Start-Sleep -Milliseconds $DelayMs
        [MouseAutomation]::mouse_event($upFlag, 0, 0, 0, 0)
        
        if ($DoubleClick) {
            Start-Sleep -Milliseconds $DelayMs
            [MouseAutomation]::mouse_event($downFlag, 0, 0, 0, 0)
            Start-Sleep -Milliseconds $DelayMs
            [MouseAutomation]::mouse_event($upFlag, 0, 0, 0, 0)
        }
        
        return @{
            success = $true
            button = $Button
            double_click = $DoubleClick.IsPresent
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Invoke-MouseScroll {
    <#
    .SYNOPSIS
        Scroll mouse wheel
    .EXAMPLE
        Invoke-MouseScroll -Direction Up -Clicks 3
    #>
    param(
        [ValidateSet('Up', 'Down')]
        [string]$Direction = 'Up',
        
        [int]$Clicks = 1
    )
    
    $delta = if ($Direction -eq 'Up') { 120 } else { -120 }
    
    for ($i = 0; $i -lt $Clicks; $i++) {
        [MouseAutomation]::mouse_event([MouseAutomation]::MOUSEEVENTF_WHEEL, 0, 0, $delta, 0)
        Start-Sleep -Milliseconds 50
    }
    
    return @{
        success = $true
        direction = $Direction
        clicks = $Clicks
    }
}

function Invoke-MouseDrag {
    <#
    .SYNOPSIS
        Drag mouse from current position to target
    .EXAMPLE
        Invoke-MouseDrag -ToX 500 -ToY 300
    #>
    param(
        [int]$FromX = -1,
        [int]$FromY = -1,
        
        [Parameter(Mandatory=$true)]
        [int]$ToX,
        
        [Parameter(Mandatory=$true)]
        [int]$ToY,
        
        [ValidateSet('Left', 'Right', 'Middle')]
        [string]$Button = 'Left'
    )
    
    try {
        # Move to start position
        if ($FromX -ge 0 -and $FromY -ge 0) {
            [MouseAutomation]::SetCursorPos($FromX, $FromY)
            Start-Sleep -Milliseconds 100
        }
        
        # Press button down
        $downFlag = switch ($Button) {
            'Left' { [MouseAutomation]::MOUSEEVENTF_LEFTDOWN }
            'Right' { [MouseAutomation]::MOUSEEVENTF_RIGHTDOWN }
            'Middle' { [MouseAutomation]::MOUSEEVENTF_MIDDLEDOWN }
        }
        [MouseAutomation]::mouse_event($downFlag, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 50
        
        # Drag to target
        $current = Get-MousePosition
        $steps = 20
        $dx = ($ToX - $current.X) / $steps
        $dy = ($ToY - $current.Y) / $steps
        
        for ($i = 0; $i -lt $steps; $i++) {
            $newX = [int]($current.X + ($dx * $i))
            $newY = [int]($current.Y + ($dy * $i))
            [MouseAutomation]::SetCursorPos($newX, $newY)
            Start-Sleep -Milliseconds 20
        }
        
        [MouseAutomation]::SetCursorPos($ToX, $ToY)
        Start-Sleep -Milliseconds 50
        
        # Release button
        $upFlag = switch ($Button) {
            'Left' { [MouseAutomation]::MOUSEEVENTF_LEFTUP }
            'Right' { [MouseAutomation]::MOUSEEVENTF_RIGHTUP }
            'Middle' { [MouseAutomation]::MOUSEEVENTF_MIDDLEUP }
        }
        [MouseAutomation]::mouse_event($upFlag, 0, 0, 0, 0)
        
        return @{
            success = $true
            from_x = $current.X
            from_y = $current.Y
            to_x = $ToX
            to_y = $ToY
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

# ============================================================================
# ADVANCED WINDOW MANAGEMENT
# ============================================================================

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WindowManager {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
    
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool FlashWindow(IntPtr hWnd, bool bInvert);
    
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_SHOWWINDOW = 0x0040;
}
"@

function Get-WindowInfo {
    <#
    .SYNOPSIS
        Get detailed information about a window
    .EXAMPLE
        Get-WindowInfo -ProcessName "notepad"
    #>
    param(
        [string]$ProcessName,
        [string]$WindowTitle
    )
    
    $windows = @()
    
    Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object {
        $hwnd = $_.MainWindowHandle
        $rect = New-Object WindowManager+RECT
        [WindowManager]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
        
        $title = New-Object System.Text.StringBuilder 256
        [WindowManager]::GetWindowText($hwnd, $title, 256) | Out-Null
        
        $windowInfo = [PSCustomObject]@{
            ProcessName = $_.ProcessName
            ProcessId = $_.Id
            WindowHandle = $hwnd
            WindowTitle = $title.ToString()
            X = $rect.Left
            Y = $rect.Top
            Width = $rect.Right - $rect.Left
            Height = $rect.Bottom - $rect.Top
            Visible = [WindowManager]::IsWindowVisible($hwnd)
        }
        
        if (($ProcessName -and $_.ProcessName -like "*$ProcessName*") -or
            ($WindowTitle -and $title.ToString() -like "*$WindowTitle*") -or
            (!$ProcessName -and !$WindowTitle)) {
            $windows += $windowInfo
        }
    }
    
    return $windows
}

function Set-WindowAlwaysOnTop {
    <#
    .SYNOPSIS
        Make a window stay on top of all other windows
    .EXAMPLE
        Set-WindowAlwaysOnTop -ProcessName "notepad" -OnTop
    #>
    param(
        [string]$ProcessName,
        [string]$WindowTitle,
        [switch]$OnTop
    )
    
    $window = Get-WindowInfo -ProcessName $ProcessName -WindowTitle $WindowTitle | Select-Object -First 1
    
    if ($window) {
        $hwndPos = if ($OnTop) { [WindowManager]::HWND_TOPMOST } else { [WindowManager]::HWND_NOTOPMOST }
        [WindowManager]::SetWindowPos(
            $window.WindowHandle,
            $hwndPos,
            0, 0, 0, 0,
            [WindowManager]::SWP_NOMOVE -bor [WindowManager]::SWP_NOSIZE -bor [WindowManager]::SWP_SHOWWINDOW
        ) | Out-Null
        
        return @{
            success = $true
            window_title = $window.WindowTitle
            always_on_top = $OnTop.IsPresent
        }
    }
    
    return @{
        success = $false
        error = "Window not found"
    }
}

function Invoke-WindowFlash {
    <#
    .SYNOPSIS
        Flash window to get user attention
    #>
    param(
        [string]$ProcessName,
        [int]$Times = 5
    )
    
    $window = Get-WindowInfo -ProcessName $ProcessName | Select-Object -First 1
    
    if ($window) {
        for ($i = 0; $i -lt $Times; $i++) {
            [WindowManager]::FlashWindow($window.WindowHandle, $true) | Out-Null
            Start-Sleep -Milliseconds 500
        }
        
        return @{
            success = $true
            window_title = $window.WindowTitle
            flashes = $Times
        }
    }
    
    return @{
        success = $false
        error = "Window not found"
    }
}

function Move-WindowToMonitor {
    <#
    .SYNOPSIS
        Move window to specific monitor
    .EXAMPLE
        Move-WindowToMonitor -ProcessName "chrome" -MonitorIndex 1
    #>
    param(
        [string]$ProcessName,
        [int]$MonitorIndex = 0
    )
    
    $monitors = [System.Windows.Forms.Screen]::AllScreens
    
    if ($MonitorIndex -ge $monitors.Count) {
        return @{
            success = $false
            error = "Monitor index out of range"
        }
    }
    
    $monitor = $monitors[$MonitorIndex]
    $window = Get-WindowInfo -ProcessName $ProcessName | Select-Object -First 1
    
    if ($window) {
        [WindowManager]::MoveWindow(
            $window.WindowHandle,
            $monitor.Bounds.Left,
            $monitor.Bounds.Top,
            $window.Width,
            $window.Height,
            $true
        ) | Out-Null
        
        return @{
            success = $true
            window_title = $window.WindowTitle
            monitor = $MonitorIndex
            x = $monitor.Bounds.Left
            y = $monitor.Bounds.Top
        }
    }
    
    return @{
        success = $false
        error = "Window not found"
    }
}

# ============================================================================
# SYSTEM MONITORING
# ============================================================================

function Get-SystemStats {
    <#
    .SYNOPSIS
        Get comprehensive system performance statistics
    #>
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $memory = Get-CimInstance Win32_OperatingSystem
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $network = Get-NetAdapterStatistics | Where-Object { $_.Name -notlike "*Bluetooth*" } | Select-Object -First 1
    
    return [PSCustomObject]@{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        CPU_Percent = [Math]::Round($cpu, 2)
        Memory_Total_GB = [Math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        Memory_Free_GB = [Math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        Memory_Used_Percent = [Math]::Round((1 - ($memory.FreePhysicalMemory / $memory.TotalVisibleMemorySize)) * 100, 2)
        Disk_Total_GB = [Math]::Round($disk.Size / 1GB, 2)
        Disk_Free_GB = [Math]::Round($disk.FreeSpace / 1GB, 2)
        Disk_Used_Percent = [Math]::Round((1 - ($disk.FreeSpace / $disk.Size)) * 100, 2)
        Network_BytesReceived = $network.ReceivedBytes
        Network_BytesSent = $network.SentBytes
    }
}

function Watch-SystemStats {
    <#
    .SYNOPSIS
        Monitor system stats in real-time
    .EXAMPLE
        Watch-SystemStats -IntervalSeconds 5 -Duration 60
    #>
    param(
        [int]$IntervalSeconds = 5,
        [int]$DurationSeconds = 60
    )
    
    $stats = @()
    $iterations = [Math]::Ceiling($DurationSeconds / $IntervalSeconds)
    
    for ($i = 0; $i -lt $iterations; $i++) {
        $stats += Get-SystemStats
        Start-Sleep -Seconds $IntervalSeconds
    }
    
    return $stats
}

function Get-ProcessStats {
    <#
    .SYNOPSIS
        Get detailed statistics for a specific process
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProcessName
    )
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    
    if (!$processes) {
        return @{
            success = $false
            error = "Process not found"
        }
    }
    
    return $processes | ForEach-Object {
        [PSCustomObject]@{
            ProcessName = $_.ProcessName
            ProcessId = $_.Id
            CPU_Percent = $_.CPU
            Memory_MB = [Math]::Round($_.WorkingSet64 / 1MB, 2)
            Threads = $_.Threads.Count
            Handles = $_.HandleCount
            StartTime = $_.StartTime
            TotalProcessorTime = $_.TotalProcessorTime
        }
    }
}

# ============================================================================
# SCREEN CAPTURE
# ============================================================================

function Capture-Screenshot {
    <#
    .SYNOPSIS
        Capture screenshot of entire screen or specific region
    .EXAMPLE
        Capture-Screenshot -Path "C:\screenshot.png"
        Capture-Screenshot -Path "C:\region.png" -X 100 -Y 100 -Width 800 -Height 600
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [int]$X = 0,
        [int]$Y = 0,
        [int]$Width = 0,
        [int]$Height = 0,
        
        [int]$MonitorIndex = 0,
        
        [ValidateSet('Png', 'Jpeg', 'Bmp', 'Gif')]
        [string]$Format = 'Png'
    )
    
    try {
        $monitors = [System.Windows.Forms.Screen]::AllScreens
        
        if ($MonitorIndex -ge $monitors.Count) {
            return @{
                success = $false
                error = "Monitor index out of range"
            }
        }
        
        $monitor = $monitors[$MonitorIndex]
        
        if ($Width -eq 0 -or $Height -eq 0) {
            $X = $monitor.Bounds.Left
            $Y = $monitor.Bounds.Top
            $Width = $monitor.Bounds.Width
            $Height = $monitor.Bounds.Height
        }
        
        $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($X, $Y, 0, 0, $bitmap.Size)
        
        $imageFormat = switch ($Format) {
            'Png' { [System.Drawing.Imaging.ImageFormat]::Png }
            'Jpeg' { [System.Drawing.Imaging.ImageFormat]::Jpeg }
            'Bmp' { [System.Drawing.Imaging.ImageFormat]::Bmp }
            'Gif' { [System.Drawing.Imaging.ImageFormat]::Gif }
        }
        
        $bitmap.Save($Path, $imageFormat)
        
        $graphics.Dispose()
        $bitmap.Dispose()
        
        return @{
            success = $true
            path = $Path
            width = $Width
            height = $Height
            format = $Format
            file_size_kb = [Math]::Round((Get-Item $Path).Length / 1KB, 2)
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Capture-WindowScreenshot {
    <#
    .SYNOPSIS
        Capture screenshot of a specific window
    .EXAMPLE
        Capture-WindowScreenshot -ProcessName "notepad" -Path "C:\window.png"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProcessName,
        
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [ValidateSet('Png', 'Jpeg', 'Bmp')]
        [string]$Format = 'Png'
    )
    
    $window = Get-WindowInfo -ProcessName $ProcessName | Select-Object -First 1
    
    if (!$window) {
        return @{
            success = $false
            error = "Window not found"
        }
    }
    
    return Capture-Screenshot -Path $Path -X $window.X -Y $window.Y -Width $window.Width -Height $window.Height -Format $Format
}

# ============================================================================
# REGISTRY OPERATIONS
# ============================================================================

function Get-RegistryValue {
    <#
    .SYNOPSIS
        Read a value from Windows Registry
    .EXAMPLE
        Get-RegistryValue -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer" -Name "ShellState"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [Parameter(Mandatory=$true)]
        [string]$Name
    )
    
    try {
        $value = Get-ItemProperty -Path $Path -Name $Name -ErrorAction Stop
        return @{
            success = $true
            path = $Path
            name = $Name
            value = $value.$Name
            type = $value.$Name.GetType().Name
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Set-RegistryValue {
    <#
    .SYNOPSIS
        Write a value to Windows Registry (use with caution!)
    .EXAMPLE
        Set-RegistryValue -Path "HKCU:\Software\MyApp" -Name "Setting1" -Value "Test" -Type String
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [Parameter(Mandatory=$true)]
        [string]$Name,
        
        [Parameter(Mandatory=$true)]
        $Value,
        
        [ValidateSet('String', 'ExpandString', 'Binary', 'DWord', 'MultiString', 'QWord')]
        [string]$Type = 'String'
    )
    
    try {
        # Create path if it doesn't exist
        if (!(Test-Path $Path)) {
            New-Item -Path $Path -Force | Out-Null
        }
        
        Set-ItemProperty -Path $Path -Name $Name -Value $Value -Type $Type
        
        return @{
            success = $true
            path = $Path
            name = $Name
            value = $Value
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

# ============================================================================
# FILE SYSTEM MONITORING
# ============================================================================

function Watch-FileSystem {
    <#
    .SYNOPSIS
        Monitor a directory for file changes
    .EXAMPLE
        Watch-FileSystem -Path "C:\dev" -Filter "*.py" -DurationSeconds 60
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [string]$Filter = "*.*",
        [int]$DurationSeconds = 60,
        [switch]$IncludeSubdirectories
    )
    
    $changes = @()
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $Path
    $watcher.Filter = $Filter
    $watcher.IncludeSubdirectories = $IncludeSubdirectories.IsPresent
    $watcher.EnableRaisingEvents = $true
    
    $action = {
        $changes += [PSCustomObject]@{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            ChangeType = $Event.SourceEventArgs.ChangeType
            FullPath = $Event.SourceEventArgs.FullPath
            Name = $Event.SourceEventArgs.Name
        }
    }
    
    $handlers = @(
        Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $action
    )
    
    Start-Sleep -Seconds $DurationSeconds
    
    $handlers | ForEach-Object { Unregister-Event -SourceIdentifier $_.Name }
    $watcher.Dispose()
    
    return $changes
}

# ============================================================================
# COM AUTOMATION (Excel, Word, Outlook)
# ============================================================================

function Invoke-ExcelAutomation {
    <#
    .SYNOPSIS
        Automate Excel operations
    .EXAMPLE
        Invoke-ExcelAutomation -FilePath "C:\data.xlsx" -Action "ReadCell" -Cell "A1"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        
        [ValidateSet('ReadCell', 'WriteCell', 'GetUsedRange', 'RunMacro')]
        [string]$Action = 'ReadCell',
        
        [string]$Cell,
        $Value,
        [string]$MacroName
    )
    
    try {
        $excel = New-Object -ComObject Excel.Application
        $excel.Visible = $false
        $excel.DisplayAlerts = $false
        
        $workbook = $excel.Workbooks.Open($FilePath)
        $worksheet = $workbook.Sheets.Item(1)
        
        $result = switch ($Action) {
            'ReadCell' {
                $worksheet.Range($Cell).Text
            }
            'WriteCell' {
                $worksheet.Range($Cell).Value2 = $Value
                $workbook.Save()
                "Cell $Cell updated"
            }
            'GetUsedRange' {
                $usedRange = $worksheet.UsedRange
                [PSCustomObject]@{
                    Rows = $usedRange.Rows.Count
                    Columns = $usedRange.Columns.Count
                    Address = $usedRange.Address()
                }
            }
            'RunMacro' {
                $excel.Run($MacroName)
                "Macro $MacroName executed"
            }
        }
        
        $workbook.Close($false)
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
        
        return @{
            success = $true
            result = $result
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

# ============================================================================
# WMI/CIM ACCESS
# ============================================================================

function Get-SystemInformation {
    <#
    .SYNOPSIS
        Get comprehensive system information via WMI/CIM
    #>
    $os = Get-CimInstance Win32_OperatingSystem
    $cs = Get-CimInstance Win32_ComputerSystem
    $proc = Get-CimInstance Win32_Processor
    $bios = Get-CimInstance Win32_BIOS
    
    return [PSCustomObject]@{
        ComputerName = $cs.Name
        Manufacturer = $cs.Manufacturer
        Model = $cs.Model
        TotalPhysicalMemory_GB = [Math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
        OS_Name = $os.Caption
        OS_Version = $os.Version
        OS_BuildNumber = $os.BuildNumber
        OS_Architecture = $os.OSArchitecture
        OS_InstallDate = $os.InstallDate
        LastBootTime = $os.LastBootUpTime
        Processor_Name = $proc.Name
        Processor_Cores = $proc.NumberOfCores
        Processor_LogicalProcessors = $proc.NumberOfLogicalProcessors
        BIOS_Version = $bios.SMBIOSBIOSVersion
        BIOS_SerialNumber = $bios.SerialNumber
    }
}

function Get-HardwareInfo {
    <#
    .SYNOPSIS
        Get detailed hardware information
    #>
    $cpu = Get-CimInstance Win32_Processor
    $gpu = Get-CimInstance Win32_VideoController
    $disk = Get-CimInstance Win32_DiskDrive
    $network = Get-CimInstance Win32_NetworkAdapter | Where-Object { $_.PhysicalAdapter -eq $true }
    
    return [PSCustomObject]@{
        CPU = $cpu | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed
        GPU = $gpu | Select-Object Name, AdapterRAM, DriverVersion, VideoModeDescription
        Disks = $disk | Select-Object Model, Size, InterfaceType, MediaType
        NetworkAdapters = $network | Select-Object Name, Speed, MACAddress
    }
}

# ============================================================================
# SCHEDULED TASKS
# ============================================================================

function New-ScheduledTaskHelper {
    <#
    .SYNOPSIS
        Create a scheduled task
    .EXAMPLE
        New-ScheduledTaskHelper -TaskName "MyTask" -ScriptPath "C:\script.ps1" -TriggerTime "18:00"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$TaskName,
        
        [Parameter(Mandatory=$true)]
        [string]$ScriptPath,
        
        [Parameter(Mandatory=$true)]
        [string]$TriggerTime,
        
        [switch]$Daily
    )
    
    try {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
        
        $trigger = if ($Daily) {
            New-ScheduledTaskTrigger -Daily -At $TriggerTime
        } else {
            New-ScheduledTaskTrigger -Once -At $TriggerTime
        }
        
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger
        
        return @{
            success = $true
            task_name = $TaskName
            script_path = $ScriptPath
            trigger_time = $TriggerTime
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Get-ScheduledTaskStatus {
    <#
    .SYNOPSIS
        Get status of scheduled tasks
    #>
    param(
        [string]$TaskName
    )
    
    if ($TaskName) {
        $tasks = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    } else {
        $tasks = Get-ScheduledTask | Where-Object { $_.State -ne 'Disabled' }
    }
    
    return $tasks | Select-Object TaskName, State, LastRunTime, NextRunTime, @{
        Name='LastResult'
        Expression={ (Get-ScheduledTaskInfo $_).LastTaskResult }
    }
}

# ============================================================================
# EVENT LOGS
# ============================================================================

function Get-EventLogEntries {
    <#
    .SYNOPSIS
        Read Windows Event Logs
    .EXAMPLE
        Get-EventLogEntries -LogName "Application" -Level "Error" -MaxEvents 50
    #>
    param(
        [ValidateSet('Application', 'System', 'Security', 'Setup')]
        [string]$LogName = 'Application',
        
        [ValidateSet('Error', 'Warning', 'Information', 'Critical', 'Verbose')]
        [string]$Level = 'Error',
        
        [int]$MaxEvents = 100,
        [int]$Hours = 24
    )
    
    $startTime = (Get-Date).AddHours(-$Hours)
    
    $events = Get-WinEvent -FilterHashtable @{
        LogName = $LogName
        Level = switch ($Level) {
            'Critical' { 1 }
            'Error' { 2 }
            'Warning' { 3 }
            'Information' { 4 }
            'Verbose' { 5 }
        }
        StartTime = $startTime
    } -MaxEvents $MaxEvents -ErrorAction SilentlyContinue
    
    return $events | Select-Object TimeCreated, Id, LevelDisplayName, Message, ProviderName
}

function Watch-EventLog {
    <#
    .SYNOPSIS
        Monitor event log for new entries in real-time
    .EXAMPLE
        Watch-EventLog -LogName "Application" -Level "Error" -DurationSeconds 60
    #>
    param(
        [string]$LogName = 'Application',
        [string]$Level = 'Error',
        [int]$DurationSeconds = 60
    )
    
    $events = @()
    $startTime = Get-Date
    $query = "*[System[(Level=2)]]"  # Error level
    
    $watcher = New-Object System.Diagnostics.Eventing.Reader.EventLogWatcher $LogName, $query
    
    $action = {
        $events += [PSCustomObject]@{
            Timestamp = $Event.SourceEventArgs.EventRecord.TimeCreated
            Level = $Event.SourceEventArgs.EventRecord.LevelDisplayName
            Message = $Event.SourceEventArgs.EventRecord.Message
            Id = $Event.SourceEventArgs.EventRecord.Id
        }
    }
    
    Register-ObjectEvent -InputObject $watcher -EventName EventRecordWritten -Action $action
    $watcher.Enabled = $true
    
    Start-Sleep -Seconds $DurationSeconds
    
    $watcher.Enabled = $false
    $watcher.Dispose()
    
    return $events
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Test-DesktopCommanderPro {
    <#
    .SYNOPSIS
        Run comprehensive tests of all Desktop Commander Pro features
    #>
    Write-Host "`n=== Desktop Commander Pro Test Suite ===" -ForegroundColor Cyan
    
    $results = @()
    
    # Test 1: Keyboard
    Write-Host "`nTest 1: Keyboard Automation..." -ForegroundColor Yellow
    try {
        $null = Send-KeyPress -Keys "test"
        $results += [PSCustomObject]@{ Test = "Keyboard"; Status = "PASS" }
        Write-Host "[OK] Keyboard automation working" -ForegroundColor Green
    }
    catch {
        $results += [PSCustomObject]@{ Test = "Keyboard"; Status = "FAIL"; Error = $_.Exception.Message }
        Write-Host "[FAIL] Keyboard automation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 2: Mouse
    Write-Host "`nTest 2: Mouse Automation..." -ForegroundColor Yellow
    try {
        $pos = Get-MousePosition
        $results += [PSCustomObject]@{ Test = "Mouse"; Status = "PASS" }
        Write-Host "[OK] Mouse automation working (Position: $($pos.X), $($pos.Y))" -ForegroundColor Green
    }
    catch {
        $results += [PSCustomObject]@{ Test = "Mouse"; Status = "FAIL"; Error = $_.Exception.Message }
        Write-Host "[FAIL] Mouse automation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 3: Window Management
    Write-Host "`nTest 3: Window Management..." -ForegroundColor Yellow
    try {
        $windows = Get-WindowInfo
        $results += [PSCustomObject]@{ Test = "Windows"; Status = "PASS" }
        Write-Host "[OK] Window management working ($($windows.Count) windows found)" -ForegroundColor Green
    }
    catch {
        $results += [PSCustomObject]@{ Test = "Windows"; Status = "FAIL"; Error = $_.Exception.Message }
        Write-Host "[FAIL] Window management failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 4: System Monitoring
    Write-Host "`nTest 4: System Monitoring..." -ForegroundColor Yellow
    try {
        $stats = Get-SystemStats
        $results += [PSCustomObject]@{ Test = "SystemMonitoring"; Status = "PASS" }
        Write-Host "[OK] System monitoring working (CPU: $($stats.CPU_Percent)%)" -ForegroundColor Green
    }
    catch {
        $results += [PSCustomObject]@{ Test = "SystemMonitoring"; Status = "FAIL"; Error = $_.Exception.Message }
        Write-Host "[FAIL] System monitoring failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 5: Clipboard
    Write-Host "`nTest 5: Clipboard Operations..." -ForegroundColor Yellow
    try {
        $testData = "Desktop Commander Pro Test"
        [System.Windows.Forms.Clipboard]::SetText($testData)
        $retrieved = [System.Windows.Forms.Clipboard]::GetText()
        if ($retrieved -eq $testData) {
            $results += [PSCustomObject]@{ Test = "Clipboard"; Status = "PASS" }
            Write-Host "[OK] Clipboard operations working" -ForegroundColor Green
        } else {
            throw "Clipboard data mismatch"
        }
    }
    catch {
        $results += [PSCustomObject]@{ Test = "Clipboard"; Status = "FAIL"; Error = $_.Exception.Message }
        Write-Host "[FAIL] Clipboard operations failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
    $results | Format-Table -AutoSize
    
    $passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
    $total = $results.Count
    Write-Host "`nPassed: $passed / $total tests" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
    
    return $results
}

# Export all functions
Export-ModuleMember -Function *
