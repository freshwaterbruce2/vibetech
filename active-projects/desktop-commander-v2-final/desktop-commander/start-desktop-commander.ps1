# Desktop Commander Startup Script
# Launches Desktop Commander in development mode

Write-Host "Starting Desktop Commander..." -ForegroundColor Cyan

# Navigate to Desktop Commander directory
Set-Location "C:\dev\active-projects\desktop-commander-v2-final\desktop-commander"

# Kill any processes on port 1420
Write-Host "Checking for port conflicts..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object {
        $processId = $_.OwningProcess
        Write-Host "  Killing process $processId on port 1420" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Start Desktop Commander
Write-Host "Launching Desktop Commander..." -ForegroundColor Green
npm run tauri:dev
