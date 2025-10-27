# Quick update script for installed app
Write-Host "Updating DeepCode Editor with database fix..." -ForegroundColor Cyan

try {
    # Paths
    $installPath = "C:\Program Files\DeepCode Editor"
    $mainSource = "C:\dev\projects\active\desktop-apps\deepcode-editor\out\main"
    $mainTarget = "$installPath\resources\out\main"

    Write-Host "Source: $mainSource" -ForegroundColor Gray
    Write-Host "Target: $mainTarget" -ForegroundColor Gray

    # Close app
    Write-Host "`nClosing app if running..." -ForegroundColor Yellow
    $proc = Get-Process -Name "DeepCode*" -ErrorAction SilentlyContinue
    if ($proc) {
        $proc | Stop-Process -Force
        Write-Host "App closed" -ForegroundColor Green
    } else {
        Write-Host "App not running" -ForegroundColor Gray
    }
    Start-Sleep -Seconds 1

    # Backup
    $backupPath = "$mainTarget.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "`nBacking up to: $backupPath" -ForegroundColor Yellow
    Copy-Item $mainTarget $backupPath -Recurse -Force
    Write-Host "Backup created" -ForegroundColor Green

    # Update
    Write-Host "`nCopying updated files..." -ForegroundColor Yellow
    Copy-Item "$mainSource\*" $mainTarget -Recurse -Force
    Write-Host "Files copied" -ForegroundColor Green

    Write-Host "`n✓ Update complete!" -ForegroundColor Green
    Write-Host "Database location: $env:APPDATA\vibe-code-studio\deepcode_database.db" -ForegroundColor Cyan
    Write-Host "`nLaunch the app and test API key saving."
    
} catch {
    Write-Host "`n✗ Error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
}

Write-Host "`nPress any key to close..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
