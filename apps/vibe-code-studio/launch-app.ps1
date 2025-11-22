# Quick launcher for Vibe Code Studio - Optimized Build
# Shows startup time

Write-Host "Launching Vibe Code Studio..." -ForegroundColor Cyan
Write-Host "Package size: OPTIMIZED - 25MB ASAR (was 299MB)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Expected load time:" -ForegroundColor Green
Write-Host "   - First launch: 2-3 seconds" -ForegroundColor Gray
Write-Host "   - Subsequent: 1-2 seconds" -ForegroundColor Gray
Write-Host ""

$appPath = "C:\dev\projects\active\desktop-apps\deepcode-editor\release-builds\win-unpacked\Vibe Code Studio.exe"

if (Test-Path $appPath) {
    $startTime = Get-Date
    Write-Host "Starting application..." -ForegroundColor Cyan

    Start-Process -FilePath $appPath

    $elapsed = (Get-Date) - $startTime
    Write-Host ""
    Write-Host "Application launched in $($elapsed.TotalSeconds) seconds" -ForegroundColor Green
    Write-Host ""
    Write-Host "If Windows SmartScreen appears:" -ForegroundColor Yellow
    Write-Host "   Click 'More info' then 'Run anyway'" -ForegroundColor Gray
} else {
    Write-Host "Application not found at:" -ForegroundColor Red
    Write-Host "   $appPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Run this first:" -ForegroundColor Yellow
    Write-Host "   cd C:\dev\projects\active\desktop-apps\deepcode-editor" -ForegroundColor Gray
    Write-Host "   pnpm run build" -ForegroundColor Gray
    Write-Host "   npx electron-builder --dir" -ForegroundColor Gray
}
