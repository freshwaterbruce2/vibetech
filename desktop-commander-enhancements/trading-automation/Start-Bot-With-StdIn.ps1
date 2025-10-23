<#
.SYNOPSIS
    Start trading bot with automatic YES confirmation using System.Diagnostics.Process

.DESCRIPTION
    Uses proper stdin redirection to send "YES" to Python's input() prompt.
    Based on 2025 Stack Overflow best practices for Process stdin handling.

.NOTES
    Limitation: UseShellExecute = $false (required for stdin) prevents new window
    Solution: Bot output is streamed to current window in real-time
#>

[CmdletBinding()]
param()

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"
$Script = "start_live_trading.py"

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "TRADING BOT STARTUP - SYSTEM.DIAGNOSTICS.PROCESS METHOD" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

# Validate prerequisites
if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Python not found: $VenvPython" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$BotPath\$Script")) {
    Write-Host "[ERROR] Script not found: $BotPath\$Script" -ForegroundColor Red
    exit 1
}

# Check if already running
$existing = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdLine -like "*start_live_trading*"
}

if ($existing) {
    Write-Host "[WARNING] Bot already running (PID: $($existing[0].Id))" -ForegroundColor Yellow
    Write-Host "Run Force-Stop-Trading.ps1 first to stop it" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "[1/4] Setting up process configuration..." -ForegroundColor Cyan

# Create ProcessStartInfo
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $VenvPython
$psi.Arguments = $Script
$psi.WorkingDirectory = $BotPath
$psi.UseShellExecute = $false  # REQUIRED for stdin redirection
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $false

Write-Host "  Python: $VenvPython" -ForegroundColor Gray
Write-Host "  Script: $Script" -ForegroundColor Gray
Write-Host "  Working Dir: $BotPath" -ForegroundColor Gray
Write-Host ""

Write-Host "[2/4] Starting Python process..." -ForegroundColor Cyan

try {
    # Start the process
    $process = [System.Diagnostics.Process]::Start($psi)

    Write-Host "  Process started (PID: $($process.Id))" -ForegroundColor Green
    Write-Host ""

    Write-Host "[3/4] Setting up asynchronous output readers..." -ForegroundColor Cyan

    # Register event handlers for asynchronous output (CRITICAL for preventing deadlock)
    $outputHandler = {
        param($sender, $e)
        if ($e.Data) {
            Write-Host $e.Data
        }
    }

    $errorHandler = {
        param($sender, $e)
        if ($e.Data) {
            Write-Host $e.Data -ForegroundColor Yellow
        }
    }

    # Register events
    Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action $outputHandler | Out-Null
    Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action $errorHandler | Out-Null

    # Start asynchronous reading (prevents stdout buffer deadlock)
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()

    Write-Host "  Async readers started" -ForegroundColor Green
    Write-Host ""

    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host "BOT OUTPUT (Press Ctrl+C to stop)" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host ""

    # Wait for bot to initialize and display prompts
    Write-Host "[4/4] Waiting for bot initialization (2 seconds)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2

    # Send YES to stdin
    Write-Host "[4/4] Sending YES confirmation..." -ForegroundColor Yellow
    $process.StandardInput.WriteLine("YES")
    $process.StandardInput.Close()  # Close stdin so Python knows input is complete
    Write-Host "  YES sent!" -ForegroundColor Green
    Write-Host ""

    # Wait for process to complete
    $process.WaitForExit()

    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Yellow
    Write-Host "Bot process exited with code: $($process.ExitCode)" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Yellow

    exit $process.ExitCode
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to start bot: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
finally {
    # Clean up event handlers
    Get-EventSubscriber | Where-Object { $_.SourceObject -eq $process } | Unregister-Event

    # Clean up process
    if ($process -and -not $process.HasExited) {
        Write-Host ""
        Write-Host "Cleaning up process..." -ForegroundColor Yellow
        $process.Kill()
    }

    if ($process) {
        $process.Dispose()
    }
}
