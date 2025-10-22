<#
.SYNOPSIS
    Nuclear cleanup and bot startup with auto-confirm
.DESCRIPTION
    Kills all trading processes, cleans locks, and starts bot with --auto-confirm flag
#>

param()

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "="*80 -ForegroundColor Red
Write-Host "NUCLEAR CLEANUP AND BOT STARTUP" -ForegroundColor Red
Write-Host "="*80 -ForegroundColor Red
Write-Host ""

# Step 1: Kill ALL Python processes
Write-Host "[1/5] Killing all Python processes..." -ForegroundColor Cyan
$pythonProcs = Get-Process python* -ErrorAction SilentlyContinue
if ($pythonProcs) {
    $pythonProcs | Stop-Process -Force
    Write-Host "  Killed $($pythonProcs.Count) Python process(es)" -ForegroundColor Green
} else {
    Write-Host "  No Python processes found" -ForegroundColor Gray
}
Start-Sleep -Seconds 2

# Step 2: Kill monitoring PowerShell scripts
Write-Host "[2/5] Killing monitoring PowerShell scripts..." -ForegroundColor Cyan
$killed = 0
Get-Process powershell*,pwsh* | Where-Object { $_.Id -ne $PID } | ForEach-Object {
    $proc = $_
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
    if ($cmd -like '*Monitor*' -or $cmd -like '*Start-Bot*') {
        Stop-Process -Id $proc.Id -Force
        Write-Host "  Killed PID $($proc.Id): $cmd" -ForegroundColor Yellow
        $killed++
    }
}
if ($killed -eq 0) {
    Write-Host "  No monitoring scripts found" -ForegroundColor Gray
}
Start-Sleep -Seconds 1

# Step 3: Clean ALL lock files
Write-Host "[3/5] Cleaning lock files..." -ForegroundColor Cyan
$removed = 0
Get-ChildItem $env:TEMP -Filter "*kraken-crypto-trading*" | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "  Removed: $($_.Name)" -ForegroundColor Yellow
    $removed++
}
if (Test-Path "C:\dev\projects\crypto-enhanced\trading_instance.lock") {
    Remove-Item "C:\dev\projects\crypto-enhanced\trading_instance.lock" -Force
    Write-Host "  Removed: trading_instance.lock" -ForegroundColor Yellow
    $removed++
}
if ($removed -eq 0) {
    Write-Host "  No lock files found" -ForegroundColor Gray
}

# Step 4: Verify clean state
Write-Host "[4/5] Verifying clean state..." -ForegroundColor Cyan
$finalProcs = Get-Process python* -ErrorAction SilentlyContinue
if ($finalProcs) {
    Write-Host "  ERROR: $($finalProcs.Count) Python process(es) still running!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  System is clean - 0 Python processes" -ForegroundColor Green
}

# Step 5: Start bot with --auto-confirm
Write-Host "[5/5] Starting trading bot with --auto-confirm..." -ForegroundColor Cyan
Write-Host ""
Write-Host "="*80 -ForegroundColor Green
Write-Host "STARTING BOT IN 2 SECONDS..." -ForegroundColor Green
Write-Host "="*80 -ForegroundColor Green
Start-Sleep -Seconds 2

$pythonExe = "C:\dev\projects\crypto-enhanced\.venv\Scripts\python.exe"
$scriptPath = "C:\dev\projects\crypto-enhanced\start_live_trading.py"
Set-Location "C:\dev\projects\crypto-enhanced"
Write-Host "[DEBUG] Executing: $pythonExe $scriptPath --auto-confirm" -ForegroundColor Gray
& $pythonExe $scriptPath "--auto-confirm"
