# Update installed DeepCode Editor
Write-Host "Updating DeepCode Editor with database fix..." -ForegroundColor Cyan

try {
    $installPath = "C:\Program Files\DeepCode Editor"
    $mainSource = "C:\dev\projects\active\desktop-apps\deepcode-editor\out\main"
    $mainTarget = "$installPath\resources\out\main"

    Write-Host "Source: $mainSource" -ForegroundColor Gray
    Write-Host "Target: $mainTarget" -ForegroundColor Gray

    Write-Host "`nClosing app if running..." -ForegroundColor Yellow
    $proc = Get-Process -Name "DeepCode*" -ErrorAction SilentlyContinue
    if ($proc) {
        $proc | Stop-Process -Force
        Write-Host "App closed" -ForegroundColor Green
    }
    Start-Sleep -Seconds 1

    $backupPath = "$mainTarget.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "`nBacking up to: $backupPath" -ForegroundColor Yellow
    Copy-Item $mainTarget $backupPath -Recurse -Force
    Write-Host "Backup created" -ForegroundColor Green

    Write-Host "`nCopying updated files..." -ForegroundColor Yellow
    Copy-Item "$mainSource\*" $mainTarget -Recurse -Force
    Write-Host "Files copied" -ForegroundColor Green

    Write-Host "`n[SUCCESS] Update complete!" -ForegroundColor Green
    Write-Host "Database will save to: $env:APPDATA\vibe-code-studio\deepcode_database.db" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n[ERROR] $_" -ForegroundColor Red
}

Write-Host "`nPress Enter to close..."
Read-Host
