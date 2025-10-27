# Update installed DeepCode Editor with database fix
Write-Host "Updating DeepCode Editor..." -ForegroundColor Cyan

# Build updated main process
Write-Host "`nBuilding updated files..." -ForegroundColor Yellow
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Find installation
$installPaths = @(
    "$env:LOCALAPPDATA\Programs\deepcode-editor",
    "$env:LOCALAPPDATA\Programs\vibe-code-studio", 
    "$env:LOCALAPPDATA\DeepCode Editor",
    "$env:LOCALAPPDATA\vibe-code-studio",
    "$env:ProgramFiles\DeepCode Editor",
    "$env:ProgramFiles\vibe-code-studio"
)

$appPath = $null
foreach ($path in $installPaths) {
    if (Test-Path $path) {
        $appPath = $path
        Write-Host "`nFound installation: $appPath" -ForegroundColor Green
        break
    }
}

if (-not $appPath) {
    Write-Host "`nCouldn't find installation automatically." -ForegroundColor Yellow
    Write-Host "Please enter the path where you installed DeepCode Editor:"
    $appPath = Read-Host
}

# Find resources folder
$resourcesPath = Get-ChildItem -Path $appPath -Filter "resources" -Directory -Recurse -Depth 2 | Select-Object -First 1

if (-not $resourcesPath) {
    Write-Host "Couldn't find resources folder!" -ForegroundColor Red
    exit 1
}

# Check for app.asar.unpacked or direct access
$targetPath = $null
if (Test-Path "$($resourcesPath.FullName)\app.asar.unpacked\out\main") {
    $targetPath = "$($resourcesPath.FullName)\app.asar.unpacked\out\main"
} elseif (Test-Path "$($resourcesPath.FullName)\app\out\main") {
    $targetPath = "$($resourcesPath.FullName)\app\out\main"
}

if (-not $targetPath) {
    Write-Host "Couldn't find main process folder!" -ForegroundColor Red
    Write-Host "Resources path: $($resourcesPath.FullName)"
    exit 1
}

# Close app if running
$process = Get-Process -Name "DeepCode*","vibe*" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "`nClosing running app..." -ForegroundColor Yellow
    $process | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Backup and copy
Write-Host "`nBacking up old files..." -ForegroundColor Yellow
$backupPath = "$targetPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $targetPath $backupPath -Recurse

Write-Host "Copying updated files..." -ForegroundColor Yellow
Copy-Item "out\main\*" $targetPath -Recurse -Force

Write-Host "`n✓ Update complete!" -ForegroundColor Green
Write-Host "Database will now save to: $env:APPDATA\vibe-code-studio\deepcode_database.db" -ForegroundColor Cyan
Write-Host "`nYou can now launch the app and test API key saving."
