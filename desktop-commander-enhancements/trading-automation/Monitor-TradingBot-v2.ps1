<#
.SYNOPSIS
    Advanced trading bot health monitor with 2025 best practices

.DESCRIPTION
    Monitors crypto-enhanced trading bot with:
    - Process health monitoring (graceful shutdown support)
    - Trade activity detection
    - Critical error pattern matching
    - Memory/CPU usage tracking
    - Auto-restart with safety checks
    - Instance lock integration

.PARAMETER CheckIntervalSeconds
    How often to check bot health (default: 60)

.PARAMETER NoTradeAlertMinutes
    Alert if no trades in X minutes (default: 30)

.PARAMETER AutoRestart
    Automatically restart bot if crashed

.EXAMPLE
    .\Monitor-TradingBot-v2.ps1
    Standard monitoring

.EXAMPLE
    .\Monitor-TradingBot-v2.ps1 -CheckIntervalSeconds 30 -AutoRestart
    Aggressive monitoring with auto-restart
#>

[CmdletBinding()]
param(
    [int]$CheckIntervalSeconds = 60,
    [int]$NoTradeAlertMinutes = 30,
    [switch]$AutoRestart
)

#Requires -Version 5.1

# Configuration
$Config = @{
    BotPath              = "C:\dev\projects\crypto-enhanced"
    BotProcessName       = "python"
    BotScriptName        = "start_live_trading.py"
    DatabasePath         = "C:\dev\projects\crypto-enhanced\trading.db"
    LogPath              = "C:\dev\projects\crypto-enhanced\trading_new.log"
    VenvActivate         = "C:\dev\projects\crypto-enhanced\.venv\Scripts\Activate.ps1"
    MemoryThresholdMB    = 500
    CPUThresholdPercent  = 80
    NoTradeAlertMinutes  = $NoTradeAlertMinutes
    CriticalErrors       = @(
        "EAPI:Invalid nonce",
        "Circuit breaker triggered",
        "WebSocket connection lost",
        "Database locked",
        "Traceback"
    )
}

# BurntToast check
Write-Host "`nChecking BurntToast module..." -ForegroundColor Cyan

if (-not (Get-Module -ListAvailable -Name BurntToast)) {
    Write-Host "Installing BurntToast module..." -ForegroundColor Yellow
    try {
        Install-Module BurntToast -Force -Scope CurrentUser -ErrorAction Stop
        Write-Host "BurntToast installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Warning "Failed to install BurntToast"
        $script:UseBurntToast = $false
    }
}
else {
    Import-Module BurntToast -ErrorAction SilentlyContinue
    $script:UseBurntToast = $true
}

# Helper Functions
function Send-BotNotification {
    param(
        [string]$Title,
        [string]$Message,
        [ValidateSet('Info', 'Warning', 'Critical')]
        [string]$Severity = 'Info'
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Severity] $Title - $Message"

    $color = switch ($Severity) {
        'Info' { 'Cyan' }
        'Warning' { 'Yellow' }
        'Critical' { 'Red' }
    }
    Write-Host $logMessage -ForegroundColor $color

    if ($script:UseBurntToast) {
        try {
            $sound = switch ($Severity) {
                'Critical' { 'Alarm' }
                'Warning' { 'SMS' }
                default { 'Default' }
            }

            New-BurntToastNotification -Text $Title, $Message -Sound $sound -ErrorAction SilentlyContinue
        }
        catch {
            # Silently fail
        }
    }
}

function Get-BotProcess {
    $processes = Get-Process -Name $Config.BotProcessName -ErrorAction SilentlyContinue

    $botProcesses = @()
    foreach ($proc in $processes) {
        try {
            $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
            if ($procInfo.CommandLine -like "*$($Config.BotScriptName)*") {
                $botProcesses += $proc
            }
        }
        catch {
            # Access denied or process ended
        }
    }

    return $botProcesses
}

function Get-LastTradeTime {
    if (-not (Test-Path $Config.DatabasePath)) {
        return $null
    }

    try {
        $dbInfo = Get-Item $Config.DatabasePath
        return $dbInfo.LastWriteTime
    }
    catch {
        Write-Warning "Failed to check database: $_"
        return $null
    }
}

function Test-CriticalErrors {
    param([string[]]$RecentLogLines)

    $foundErrors = @()
    foreach ($pattern in $Config.CriticalErrors) {
        $matches = $RecentLogLines | Select-String -Pattern $pattern -SimpleMatch
        if ($matches) {
            $foundErrors += $pattern
        }
    }
    return $foundErrors
}

function Start-BotProcess {
    param([bool]$AutoConfirm = $false)

    if (-not $AutoConfirm) {
        $response = Read-Host "Restart trading bot? (YES to confirm)"
        if ($response -ne "YES") {
            Write-Host "Restart cancelled" -ForegroundColor Yellow
            return $false
        }
    }

    Write-Host "Starting trading bot..." -ForegroundColor Cyan

    try {
        $botDir = $Config.BotPath
        $script = Join-Path $botDir $Config.BotScriptName

        $processArgs = @{
            FilePath = "powershell.exe"
            ArgumentList = @(
                "-NoExit",
                "-Command",
                "cd '$botDir'; & '$($Config.VenvActivate)'; echo YES | python $script"
            )
            WorkingDirectory = $botDir
        }

        Start-Process @processArgs
        Start-Sleep -Seconds 5

        $botProcess = Get-BotProcess
        if ($botProcess) {
            Write-Host "Bot restarted successfully (PID: $($botProcess[0].Id))" -ForegroundColor Green
            return $true
        }
        else {
            Write-Warning "Bot process not detected after restart"
            return $false
        }
    }
    catch {
        Write-Error "Failed to restart bot: $_"
        return $false
    }
}

function Stop-BotProcessGracefully {
    param($Process)

    Write-Host "Attempting graceful shutdown..." -ForegroundColor Yellow

    try {
        # Try terminate first (2025 best practice)
        $Process.CloseMainWindow() | Out-Null
        Start-Sleep -Seconds 3

        if (-not $Process.HasExited) {
            # Force kill if still running
            $Process.Kill()
            Write-Host "Process force-killed" -ForegroundColor Yellow
        }
        else {
            Write-Host "Process terminated gracefully" -ForegroundColor Green
        }

        return $true
    }
    catch {
        Write-Warning "Failed to stop process: $_"
        return $false
    }
}

# Log Monitoring
function Start-LogMonitoring {
    if (-not (Test-Path $Config.LogPath)) {
        Write-Warning "Log file not found: $($Config.LogPath)"
        return
    }

    $logDir = Split-Path $Config.LogPath -Parent
    $logFile = Split-Path $Config.LogPath -Leaf

    $script:LogWatcher = New-Object System.IO.FileSystemWatcher
    $script:LogWatcher.Path = $logDir
    $script:LogWatcher.Filter = $logFile
    $script:LogWatcher.NotifyFilter = [System.IO.NotifyFilters]'LastWrite'
    $script:LogWatcher.EnableRaisingEvents = $true

    $action = {
        $path = $Event.SourceEventArgs.FullPath

        try {
            $recentLines = Get-Content $path -Tail 10 -ErrorAction Stop
            $errors = Test-CriticalErrors -RecentLogLines $recentLines

            if ($errors.Count -gt 0) {
                $errorList = $errors -join ", "
                Send-BotNotification -Title "Critical Error Detected" -Message "Errors found: $errorList" -Severity Critical
            }
        }
        catch {
            # File locked, ignore
        }
    }

    $script:LogEvent = Register-ObjectEvent -InputObject $script:LogWatcher -EventName Changed -SourceIdentifier "TradingBotLogMonitor" -Action $action

    Write-Host "Log monitoring started" -ForegroundColor Green
}

function Stop-LogMonitoring {
    if ($script:LogWatcher) {
        $script:LogWatcher.EnableRaisingEvents = $false
        $script:LogWatcher.Dispose()
    }

    if ($script:LogEvent) {
        Unregister-Event -SourceIdentifier "TradingBotLogMonitor" -ErrorAction SilentlyContinue
    }

    Write-Host "Log monitoring stopped" -ForegroundColor Yellow
}

# Main Monitoring Loop
function Start-Monitoring {
    Write-Host "`n" -NoNewline
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "CRYPTO TRADING BOT HEALTH MONITOR V2" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor White
    Write-Host "   Check Interval: $CheckIntervalSeconds seconds" -ForegroundColor Gray
    Write-Host "   No-Trade Alert: $NoTradeAlertMinutes minutes" -ForegroundColor Gray
    Write-Host "   Auto-Restart: $($AutoRestart -eq $true)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host ""

    Start-LogMonitoring

    $lastTradeCheck = Get-Date
    $iteration = 0

    try {
        while ($true) {
            $iteration++
            $timestamp = Get-Date -Format "HH:mm:ss"

            Write-Host "[$timestamp] Check #$iteration" -ForegroundColor Gray

            # Process Check
            $botProcesses = Get-BotProcess

            if (-not $botProcesses -or $botProcesses.Count -eq 0) {
                Send-BotNotification -Title "Bot Process Not Running" -Message "Trading bot has stopped!" -Severity Critical

                if ($AutoRestart) {
                    Start-BotProcess -AutoConfirm $true
                }
                else {
                    $restart = Read-Host "  Restart bot now? (Y/N)"
                    if ($restart -eq 'Y') {
                        Start-BotProcess
                    }
                }
            }
            elseif ($botProcesses.Count -gt 1) {
                Send-BotNotification -Title "Multiple Instances Detected" -Message "Found $($botProcesses.Count) bot instances!" -Severity Warning
                Write-Host "  WARNING: Multiple bot instances detected!" -ForegroundColor Red
                foreach ($proc in $botProcesses) {
                    Write-Host "    PID: $($proc.Id)" -ForegroundColor Yellow
                }
            }
            else {
                $proc = $botProcesses[0]
                $pid = $proc.Id
                $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
                $cpuPercent = [math]::Round($proc.CPU, 2)

                Write-Host "  Bot running (PID: $pid | Memory: ${memoryMB}MB | CPU: ${cpuPercent}s)" -ForegroundColor Green

                if ($memoryMB -gt $Config.MemoryThresholdMB) {
                    Send-BotNotification -Title "High Memory Usage" -Message "Bot using ${memoryMB}MB (threshold: $($Config.MemoryThresholdMB)MB)" -Severity Warning
                }
            }

            # Trade Activity Check
            $now = Get-Date
            if (($now - $lastTradeCheck).TotalMinutes -ge $Config.NoTradeAlertMinutes) {
                $lastTrade = Get-LastTradeTime

                if ($lastTrade) {
                    $minutesSinceLastTrade = [math]::Round(($now - $lastTrade).TotalMinutes, 1)
                    Write-Host "  Last trade: $minutesSinceLastTrade minutes ago" -ForegroundColor Gray

                    if ($minutesSinceLastTrade -gt $Config.NoTradeAlertMinutes) {
                        Send-BotNotification -Title "No Recent Trades" -Message "Last trade was $minutesSinceLastTrade minutes ago" -Severity Warning
                    }
                }

                $lastTradeCheck = $now
            }

            Start-Sleep -Seconds $CheckIntervalSeconds
        }
    }
    finally {
        Stop-LogMonitoring
        Write-Host "`nMonitoring stopped" -ForegroundColor Yellow
    }
}

# Entry Point
if (-not (Test-Path $Config.BotPath)) {
    Write-Error "Bot directory not found: $($Config.BotPath)"
    exit 1
}

# Check if bot is running
$botProcesses = Get-BotProcess
if (-not $botProcesses -or $botProcesses.Count -eq 0) {
    Write-Host "Trading bot is not currently running" -ForegroundColor Yellow
    $start = Read-Host "Start it now? (Y/N)"
    if ($start -eq 'Y') {
        Start-BotProcess
    }
    else {
        Write-Host "Monitoring will continue, but alerts will be sent for missing process" -ForegroundColor Yellow
    }
}
elseif ($botProcesses.Count -gt 1) {
    Write-Host "WARNING: Multiple bot instances detected ($($botProcesses.Count))!" -ForegroundColor Red
    Write-Host "This can cause nonce conflicts and duplicate orders." -ForegroundColor Red
    Write-Host ""
    Write-Host "Run Force-Stop-Trading.ps1 to clean up, then restart safely." -ForegroundColor Yellow
    exit 1
}

Send-BotNotification -Title "Bot Monitor Started" -Message "Monitoring crypto trading bot health" -Severity Info

Start-Monitoring
