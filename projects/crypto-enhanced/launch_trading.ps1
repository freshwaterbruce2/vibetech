#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Crypto Enhanced Trading System - PowerShell Launcher
    Bulletproof single-instance enforcement with native Windows process management

.DESCRIPTION
    This script launches the crypto trading system with proper single-instance enforcement
    using native Windows PowerShell process management instead of bash/WSL.

    Features:
    - Native Windows process detection and management
    - Automatic cleanup of orphaned processes
    - Virtual environment activation and validation
    - Comprehensive error handling and logging
    - Force restart capability for emergency situations

.PARAMETER Force
    Force restart by killing existing instances first

.PARAMETER DryRun
    Show what would be done without actually executing

.PARAMETER Verbose
    Enable detailed logging output

.EXAMPLE
    .\launch_trading.ps1
    Standard launch with single-instance enforcement

.EXAMPLE
    .\launch_trading.ps1 -Force
    Kill existing instances and start fresh

.EXAMPLE
    .\launch_trading.ps1 -DryRun -VerboseOutput
    Show what would be done with detailed output

#>

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$DryRun,
    [switch]$VerboseOutput
)

# Set strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Constants
$SCRIPT_NAME = "CryptoEnhanced-Launcher"
$LOCK_FILE = "crypto_trading.lock"
$PID_FILE = "crypto_trading.pid"
$LOG_FILE = "logs\launcher.log"
$VENV_PYTHON = ".venv\Scripts\python.exe"
$MAIN_SCRIPT = "start_live_trading.py"
$PROCESS_NAME = "python"

# Ensure logs directory exists
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    # Write to console with color coding
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN"  { Write-Host $logMessage -ForegroundColor Yellow }
        "INFO"  { Write-Host $logMessage -ForegroundColor Green }
        "DEBUG" { if ($VerboseOutput) { Write-Host $logMessage -ForegroundColor Cyan } }
        default { Write-Host $logMessage }
    }

    # Write to log file
    Add-Content -Path $LOG_FILE -Value $logMessage
}

# Function to check if virtual environment exists and is valid
function Test-VirtualEnvironment {
    Write-Log "Checking virtual environment..." "DEBUG"

    if (-not (Test-Path $VENV_PYTHON)) {
        Write-Log "Virtual environment not found at $VENV_PYTHON" "ERROR"
        Write-Log "Please run: python -m venv .venv" "ERROR"
        Write-Log "Then: .venv\Scripts\activate && pip install -r requirements.txt" "ERROR"
        return $false
    }

    if (-not (Test-Path $MAIN_SCRIPT)) {
        Write-Log "Main script not found: $MAIN_SCRIPT" "ERROR"
        return $false
    }

    Write-Log "Virtual environment validated successfully" "DEBUG"
    return $true
}

# Function to find existing trading processes using native PowerShell
function Get-TradingProcesses {
    Write-Log "Scanning for existing trading processes..." "DEBUG"

    $processes = @()

    # Method 1: Find python processes with our script in command line
    try {
        $pythonProcesses = Get-WmiObject Win32_Process | Where-Object {
            $_.Name -eq "python.exe" -and
            $_.CommandLine -like "*start_live_trading.py*"
        }

        foreach ($proc in $pythonProcesses) {
            $processes += [PSCustomObject]@{
                ProcessId = $proc.ProcessId
                CommandLine = $proc.CommandLine
                CreationDate = $proc.CreationDate
                Method = "WMI"
            }
        }
    }
    catch {
        Write-Log "WMI query failed, trying alternative method: $($_.Exception.Message)" "WARN"
    }

    # Method 2: Check for lock file with valid PID
    if (Test-Path $PID_FILE) {
        try {
            $storedPid = Get-Content $PID_FILE -ErrorAction Stop
            $process = Get-Process -Id $storedPid -ErrorAction SilentlyContinue

            if ($process -and $process.ProcessName -eq "python") {
                $processes += [PSCustomObject]@{
                    ProcessId = $process.Id
                    CommandLine = "From PID file"
                    CreationDate = $process.StartTime
                    Method = "PIDFile"
                }
            }
            else {
                Write-Log "Stale PID file found, will clean up" "WARN"
                Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            Write-Log "Invalid PID file, will clean up: $($_.Exception.Message)" "WARN"
            Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
        }
    }

    # Method 3: Check for lock file
    if (Test-Path $LOCK_FILE) {
        $lockAge = (Get-Date) - (Get-Item $LOCK_FILE).LastWriteTime
        if ($lockAge.TotalMinutes -gt 5) {
            Write-Log "Stale lock file found (age: $($lockAge.TotalMinutes.ToString('F1')) minutes), will clean up" "WARN"
            Remove-Item $LOCK_FILE -Force -ErrorAction SilentlyContinue
        }
        else {
            Write-Log "Active lock file detected (age: $($lockAge.TotalMinutes.ToString('F1')) minutes)" "INFO"
        }
    }

    # Remove duplicates based on ProcessId
    $uniqueProcesses = $processes | Sort-Object ProcessId -Unique

    Write-Log "Found $($uniqueProcesses.Count) existing trading processes" "DEBUG"
    return $uniqueProcesses
}

# Function to safely terminate trading processes
function Stop-TradingProcesses {
    param([array]$Processes)

    if ($Processes.Count -eq 0) {
        Write-Log "No processes to terminate" "DEBUG"
        return
    }

    Write-Log "Terminating $($Processes.Count) trading processes..." "INFO"

    foreach ($proc in $Processes) {
        try {
            Write-Log "Terminating process $($proc.ProcessId)..." "DEBUG"

            if ($DryRun) {
                Write-Log "[DRY RUN] Would terminate process $($proc.ProcessId)" "INFO"
                continue
            }

            # Try graceful shutdown first
            $process = Get-Process -Id $proc.ProcessId -ErrorAction SilentlyContinue
            if ($process) {
                # Send Ctrl+C signal (graceful)
                $process.CloseMainWindow() | Out-Null

                # Wait up to 10 seconds for graceful shutdown
                $waited = 0
                while (-not $process.HasExited -and $waited -lt 10) {
                    Start-Sleep -Seconds 1
                    $waited++
                    $process.Refresh()
                }

                # Force kill if still running
                if (-not $process.HasExited) {
                    Write-Log "Process $($proc.ProcessId) did not exit gracefully, force killing..." "WARN"
                    Stop-Process -Id $proc.ProcessId -Force
                }

                Write-Log "Process $($proc.ProcessId) terminated successfully" "INFO"
            }
        }
        catch {
            Write-Log "Failed to terminate process $($proc.ProcessId): $($_.Exception.Message)" "ERROR"
        }
    }

    # Clean up lock files
    Remove-Item $LOCK_FILE, $PID_FILE -Force -ErrorAction SilentlyContinue
}

# Function to create process lock
function New-ProcessLock {
    param([int]$ProcessId)

    try {
        # Create lock file with process info
        $lockInfo = @{
            ProcessId = $ProcessId
            StartTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            LauncherVersion = "PowerShell-v1.0"
            MachineName = $env:COMPUTERNAME
        } | ConvertTo-Json

        Set-Content -Path $LOCK_FILE -Value $lockInfo
        Set-Content -Path $PID_FILE -Value $ProcessId

        Write-Log "Process lock created for PID $ProcessId" "DEBUG"
        return $true
    }
    catch {
        Write-Log "Failed to create process lock: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to launch the trading system
function Start-TradingSystem {
    Write-Log "Starting Crypto Enhanced Trading System..." "INFO"

    if ($DryRun) {
        Write-Log "[DRY RUN] Would start: $VENV_PYTHON $MAIN_SCRIPT" "INFO"
        return $true
    }

    try {
        # Change to the correct directory
        $originalLocation = Get-Location
        Set-Location (Split-Path $MyInvocation.ScriptName -Parent)

        # Start the process
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = $VENV_PYTHON
        $processInfo.Arguments = $MAIN_SCRIPT
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $false
        $processInfo.RedirectStandardError = $false
        $processInfo.RedirectStandardInput = $true
        $processInfo.CreateNoWindow = $false

        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $processInfo

        if ($process.Start()) {
            $processId = $process.Id
            Write-Log "Trading system started successfully (PID: $processId)" "INFO"

            # Create lock file
            if (New-ProcessLock -ProcessId $processId) {
                Write-Log "Process lock established" "INFO"
            }

            # Send "YES" to confirm live trading
            try {
                $process.StandardInput.WriteLine("YES")
                $process.StandardInput.Close()
                Write-Log "Auto-confirmation sent for live trading" "INFO"
            }
            catch {
                Write-Log "Failed to send auto-confirmation: $($_.Exception.Message)" "WARN"
            }

            # Restore original location
            Set-Location $originalLocation

            Write-Log "Trading system is now running. Monitor with: Get-Process -Id $processId" "INFO"
            return $true
        }
        else {
            Write-Log "Failed to start trading system process" "ERROR"
            Set-Location $originalLocation
            return $false
        }
    }
    catch {
        Write-Log "Exception starting trading system: $($_.Exception.Message)" "ERROR"
        if (Get-Variable originalLocation -ErrorAction SilentlyContinue) {
            Set-Location $originalLocation
        }
        return $false
    }
}

# Main execution logic
function Main {
    Write-Log "=== Crypto Enhanced Trading System Launcher ===" "INFO"
    Write-Log "PowerShell Version: $($PSVersionTable.PSVersion)" "DEBUG"
    Write-Log "Execution Policy: $(Get-ExecutionPolicy)" "DEBUG"
    Write-Log "Current Directory: $(Get-Location)" "DEBUG"

    # Validate environment
    if (-not (Test-VirtualEnvironment)) {
        Write-Log "Environment validation failed" "ERROR"
        exit 1
    }

    # Check for existing processes
    $existingProcesses = Get-TradingProcesses

    if ($existingProcesses.Count -gt 0) {
        Write-Log "Found $($existingProcesses.Count) existing trading processes:" "WARN"
        foreach ($proc in $existingProcesses) {
            Write-Log "  PID $($proc.ProcessId): $($proc.CommandLine)" "WARN"
        }

        if ($Force) {
            Write-Log "Force restart requested, terminating existing processes..." "INFO"
            Stop-TradingProcesses -Processes $existingProcesses
            Start-Sleep -Seconds 2  # Brief pause for cleanup
        }
        else {
            Write-Log "Trading system already running. Use -Force to restart." "ERROR"
            Write-Log "To check status: Get-Process | Where-Object { $_.ProcessName -eq 'python' }" "INFO"
            exit 1
        }
    }
    else {
        Write-Log "No existing trading processes detected" "INFO"
    }

    # Start the trading system
    if (Start-TradingSystem) {
        Write-Log "=== Trading System Launch Successful ===" "INFO"
        exit 0
    }
    else {
        Write-Log "=== Trading System Launch Failed ===" "ERROR"
        exit 1
    }
}

# Script entry point
try {
    Main
}
catch {
    Write-Log "Fatal error in launcher: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack Trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}