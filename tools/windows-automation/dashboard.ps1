# Advanced Windows Automation Dashboard
# Demonstrates: Multi-window management, live monitoring, keyboard automation

Import-Module "$PSScriptRoot\WindowsAutomation.psm1"

function Show-SystemStatus {
    Clear-Host
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Windows Automation Status Dashboard" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 1. Show active windows
    Write-Host "[1] Active Windows:" -ForegroundColor Yellow
    $windows = Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object -First 5
    foreach ($win in $windows) {
        Write-Host "    - $($win.ProcessName): $($win.MainWindowTitle)" -ForegroundColor Gray
    }
    Write-Host ""
    
    # 2. Show clipboard status
    Write-Host "[2] Clipboard Status:" -ForegroundColor Yellow
    $clip = Get-ClipboardText
    if ($clip) {
        $preview = if ($clip.Length -gt 50) { $clip.Substring(0, 50) + "..." } else { $clip }
        Write-Host "    Content: $preview" -ForegroundColor Gray
    } else {
        Write-Host "    (empty)" -ForegroundColor Gray
    }
    Write-Host ""
    
    # 3. Check trading bot status
    Write-Host "[3] Trading Bot:" -ForegroundColor Yellow
    $dbPath = "C:\dev\projects\crypto-enhanced\trading.db"
    if (Test-Path $dbPath) {
        $dbSize = (Get-Item $dbPath).Length / 1KB
        $lastMod = (Get-Item $dbPath).LastWriteTime
        $age = ((Get-Date) - $lastMod).TotalMinutes
        
        $status = if ($age -lt 5) { "[ACTIVE]" } elseif ($age -lt 60) { "[RECENT]" } else { "[IDLE]" }
        Write-Host "    Status: $status" -ForegroundColor $(if ($age -lt 5) { "Green" } else { "Yellow" })
        Write-Host "    Database: $([math]::Round($dbSize, 2)) KB" -ForegroundColor Gray
        Write-Host "    Last activity: $([math]::Round($age, 1)) min ago" -ForegroundColor Gray
    } else {
        Write-Host "    Status: [NOT RUNNING]" -ForegroundColor Red
    }
    Write-Host ""
    
    # 4. System resources
    Write-Host "[4] System Resources:" -ForegroundColor Yellow
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $mem = Get-Counter '\Memory\Available MBytes' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    Write-Host "    CPU: $([math]::Round($cpu, 1))%" -ForegroundColor Gray
    Write-Host "    Available RAM: $([math]::Round($mem, 0)) MB" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Last updated: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor DarkGray
    Write-Host ""
}

# Main execution
Write-Host ""
Write-Host "Starting monitoring dashboard..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to exit" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 2

# Run dashboard once (for demo)
Show-SystemStatus

# Send notification
Show-WindowsNotification `
    -Title "Dashboard Active" `
    -Message "Windows automation monitoring started" `
    -Duration 5

Write-Host ""
Write-Host "[DEMO MODE] Dashboard ran once. In production, this would refresh every 30 seconds." -ForegroundColor Magenta
Write-Host ""
