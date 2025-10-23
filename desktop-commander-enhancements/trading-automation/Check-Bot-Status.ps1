# Quick bot status check
param()

Write-Host ""
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "TRADING BOT STATUS CHECK" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan
Write-Host ""

# Check Python processes
$procs = Get-Process python* -ErrorAction SilentlyContinue
Write-Host "Python processes running: $($procs.Count)" -ForegroundColor $(if ($procs.Count -eq 1) { "Green" } elseif ($procs.Count -eq 0) { "Red" } else { "Yellow" })

if ($procs) {
    foreach ($proc in $procs) {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        Write-Host "  PID $($proc.Id): $cmd" -ForegroundColor Gray
    }
}

Write-Host ""

# Check log file
$logPath = "C:\dev\projects\crypto-enhanced\trading_new.log"
if (Test-Path $logPath) {
    Write-Host "Last 20 lines of trading_new.log:" -ForegroundColor Cyan
    Write-Host "-"*80 -ForegroundColor Gray
    Get-Content $logPath -Tail 20 | ForEach-Object {
        if ($_ -match "ERROR") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "WARNING") {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "SUCCESS|RUNNING") {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_
        }
    }
    Write-Host "-"*80 -ForegroundColor Gray
} else {
    Write-Host "Log file not found at: $logPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "="*80 -ForegroundColor Cyan
