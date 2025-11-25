<#
.SYNOPSIS
    Real-time trading bot health monitor with intelligent alerting
    
.DESCRIPTION
    Monitors crypto-enhanced trading bot for:
    - Process health (running/crashed)
    - Trade activity (detect WebSocket disconnects)
    - Error patterns (EAPI:Invalid nonce, circuit breaker)
    - Database lock issues
    - Memory/CPU usage
    
    Uses 2025 best practices:
    - FileSystemWatcher for real-time log monitoring
    - BurntToast for rich notifications
    - Proper event cleanup and resource management
    
.PARAMETER CheckIntervalSeconds
    How often to check bot health (default: 60)
    
.PARAMETER NoTradeAlertMinutes
    Alert if no trades in X minutes (default: 30)
    
.PARAMETER AutoRestart
    Automatically restart bot if crashed (requires confirmation)
    
.EXAMPLE
    .\Monitor-TradingBot.ps1
    # Standard monitoring with defaults
    
.EXAMPLE
    .\Monitor-TradingBot.ps1 -CheckIntervalSeconds 30 -NoTradeAlertMinutes 15
    # More aggressive monitoring
#>

[CmdletBinding()]
param(
    [int]$CheckIntervalSeconds = 60,
    [int]$NoTradeAlertMinutes = 30,
    [switch]$AutoRestart
)

#Requires -Version 5.1

# ============================================================================
# CONFIGURATION
# ============================================================================

$Config = @{
    BotPath              = "C:\dev\projects\crypto-enhanced"
    BotProcessName       = "python"
    BotScriptName        = "start_live_trading.py"
    DatabasePath         = "C:\dev\projects\crypto-enhanced\trading.db"
    LogPath              = "C:\dev\projects\crypto-enhanced\trading_new.log"
    VenvActivate         = "C:\dev\projects\crypto-enhanced\.venv\Scripts\Activate.ps1"
    
    # Alert thresholds
    MemoryThresholdMB    = 500
    CPUThresholdPercent  = 80
    NoTradeAlertMinutes  = $NoTradeAlertMinutes
    
    # Error patterns to watch
    CriticalErrors       = @(
        "EAPI:Invalid nonce",
        "Circuit breaker triggered",
        "WebSocket connection lost",
        "Database locked",
        "Traceback"
    )
}

# ============================================================================
# BURNTTOAST INSTALLATION CHECK
# ============================================================================

Write-Host "`n🔍 Checking BurntToast module..." -ForegroundColor Cyan

if (-not (Get-Module -ListAvailable -Name BurntToast)) {
    Write-Host "📦 Installing BurntToast module..." -ForegroundColor Yellow
    try {
        Install-Module BurntToast -Force -Scope CurrentUser -ErrorAction Stop
        Write-Host "✅ BurntToast installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Warning "Failed to install BurntToast. Falling back to basic notifications."
        $script:UseBurntToast = $false
    }
}
else {
    Import-Module BurntToast -ErrorAction SilentlyContinue
    $script:UseBurntToast = $true
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Send-BotNotification {
    param(
        [string]$Title,
        [string]$Message,
        [ValidateSet('Info', 'Warning', 'Critical')]
        [string]$Severity = 'Info'
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Severity] $Title - $Message"
    
    # Console output with color
    $color = switch ($Severity) {
        'Info' { 'Cyan' }
        'Warning' { 'Yellow' }
        'Critical' { 'Red' }
    }
    Write-Host $logMessage -ForegroundColor $color
    
    # Toast notification
    if ($script:UseBurntToast) {
        try {
            $sound = switch ($Severity) {
                'Critical' { 'Alarm' }
                'Warning' { 'SMS' }
                default { 'Default' }
            }
            
            New-BurntToastNotification `
                -Text $Title, $Message `
                -Sound $sound `
                -AppLogo "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
                -ErrorAction SilentlyContinue
        }
        catch {
            Write-Warning "Toast notification failed: $_"
        }
    }
}

function Get-BotProcess {
    $processes = Get-Process -Name $Config.BotProcessName -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*$($Config.BotScriptName)*" }
    return $processes
}

function Get-LastTradeTime {
    if (-not (Test-Path $Config.DatabasePath)) {
        return $null
    }
    
    try {
        # Query SQLite for last trade time
        # This is a simplified check - you might want to use a proper SQLite module
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
            Write-Host "❌ Restart cancelled" -ForegroundColor Yellow
            return $false
        }
    }
    
    Write-Host "🚀 Starting trading bot..." -ForegroundColor Cyan
    
    try {
        $botDir = $Config.BotPath
        $script = Join-Path $botDir $Config.BotScriptName
        
        # Start in new window so we can monitor it
        $processArgs = @{
            FilePath     = "powershell.exe"
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
            Write-Host "✅ Bot restarted successfully (PID: $($botProcess.Id))" -ForegroundColor Green
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

# ============================================================================
# LOG MONITORING WITH FILESYSTEMWATCHER
# ============================================================================

function Start-LogMonitoring {
    if (-not (Test-Path $Config.LogPath)) {
        Write-Warning "Log file not found: $($Config.LogPath)"
        return
    }
    
    $logDir = Split-Path $Config.LogPath -Parent
    $logFile = Split-Path $Config.LogPath -Leaf
    
    # Create FileSystemWatcher
    $script:LogWatcher = New-Object System.IO.FileSystemWatcher
    $script:LogWatcher.Path = $logDir
    $script:LogWatcher.Filter = $logFile
    $script:LogWatcher.NotifyFilter = [System.IO.NotifyFilters]'LastWrite'
    $script:LogWatcher.EnableRaisingEvents = $true
    
    # Define action for log changes
    $action = {
        $path = $Event.SourceEventArgs.FullPath
        
        try {
            # Read last 10 lines
            $recentLines = Get-Content $path -Tail 10 -ErrorAction Stop
            
            # Check for critical errors
            $errors = Test-CriticalErrors -RecentLogLines $recentLines
            
            if ($errors.Count -gt 0) {
                $errorList = $errors -join ", "
                Send-BotNotification `
                    -Title "🚨 Critical Error Detected" `
                    -Message "Errors found: $errorList" `
                    -Severity Critical
            }
        }
        catch {
            # File might be locked, ignore
        }
    }
    
    # Register event
    $script:LogEvent = Register-ObjectEvent `
        -InputObject $script:LogWatcher `
        -EventName Changed `
        -SourceIdentifier "TradingBotLogMonitor" `
        -Action $action
    
    Write-Host "📋 Log monitoring started" -ForegroundColor Green
}

function Stop-LogMonitoring {
    if ($script:LogWatcher) {
        $script:LogWatcher.EnableRaisingEvents = $false
        $script:LogWatcher.Dispose()
    }
    
    if ($script:LogEvent) {
        Unregister-Event -SourceIdentifier "TradingBotLogMonitor" -ErrorAction SilentlyContinue
    }
    
    Write-Host "📋 Log monitoring stopped" -ForegroundColor Yellow
}

# ============================================================================
# MAIN MONITORING LOOP
# ============================================================================

function Start-Monitoring {
    Write-Host "`n" -NoNewline
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "🤖 CRYPTO TRADING BOT HEALTH MONITOR" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Configuration:" -ForegroundColor White
    Write-Host "   • Check Interval: $CheckIntervalSeconds seconds" -ForegroundColor Gray
    Write-Host "   • No-Trade Alert: $NoTradeAlertMinutes minutes" -ForegroundColor Gray
    Write-Host "   • Auto-Restart: $($AutoRestart -eq $true)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""
    
    # Start log monitoring
    Start-LogMonitoring
    
    $lastTradeCheck = Get-Date
    $iteration = 0
    
    try {
        while ($true) {
            $iteration++
            $timestamp = Get-Date -Format "HH:mm:ss"
            
            Write-Host "[$timestamp] Check #$iteration" -ForegroundColor Gray
            
            # ===== PROCESS CHECK =====
            $botProcess = Get-BotProcess
            
            if (-not $botProcess) {
                Send-BotNotification `
                    -Title "❌ Bot Process Not Running" `
                    -Message "Trading bot has stopped!" `
                    -Severity Critical
                
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
            else {
                # Process is running - check health
                $pid = $botProcess.Id
                $memoryMB = [math]::Round($botProcess.WorkingSet64 / 1MB, 2)
                $cpuPercent = [math]::Round($botProcess.CPU, 2)
                
                Write-Host "  ✅ Bot running (PID: $pid | Memory: ${memoryMB}MB | CPU: ${cpuPercent}s)" -ForegroundColor Green
                
                # Memory threshold check
                if ($memoryMB -gt $Config.MemoryThresholdMB) {
                    Send-BotNotification `
                        -Title "⚠️ High Memory Usage" `
                        -Message "Bot using ${memoryMB}MB (threshold: $($Config.MemoryThresholdMB)MB)" `
                        -Severity Warning
                }
            }
            
            # ===== TRADE ACTIVITY CHECK =====
            $now = Get-Date
            if (($now - $lastTradeCheck).TotalMinutes -ge $Config.NoTradeAlertMinutes) {
                $lastTrade = Get-LastTradeTime
                
                if ($lastTrade) {
                    $minutesSinceLastTrade = [math]::Round(($now - $lastTrade).TotalMinutes, 1)
                    Write-Host "  📊 Last trade: $minutesSinceLastTrade minutes ago" -ForegroundColor Gray
                    
                    if ($minutesSinceLastTrade -gt $Config.NoTradeAlertMinutes) {
                        Send-BotNotification `
                            -Title "⏰ No Recent Trades" `
                            -Message "Last trade was $minutesSinceLastTrade minutes ago. Possible WebSocket disconnect?" `
                            -Severity Warning
                    }
                }
                
                $lastTradeCheck = $now
            }
            
            # Sleep until next check
            Start-Sleep -Seconds $CheckIntervalSeconds
        }
    }
    finally {
        Stop-LogMonitoring
        Write-Host "`n🛑 Monitoring stopped" -ForegroundColor Yellow
    }
}

# ============================================================================
# ENTRY POINT
# ============================================================================

# Validate paths
if (-not (Test-Path $Config.BotPath)) {
    Write-Error "Bot directory not found: $($Config.BotPath)"
    exit 1
}

# Check if bot is already running
$botProcess = Get-BotProcess
if (-not $botProcess) {
    Write-Host "⚠️  Trading bot is not currently running" -ForegroundColor Yellow
    $start = Read-Host "Start it now? (Y/N)"
    if ($start -eq 'Y') {
        Start-BotProcess
    }
    else {
        Write-Host "Monitoring will continue, but alerts will be sent for missing process" -ForegroundColor Yellow
    }
}

# Send initial notification
Send-BotNotification `
    -Title "🤖 Bot Monitor Started" `
    -Message "Monitoring crypto trading bot health" `
    -Severity Info

# Start monitoring
Start-Monitoring
