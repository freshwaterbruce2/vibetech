# Fix Claude Code command
# This script adds a function to your PowerShell profile to run Claude Code properly

$claudePath = "C:\Users\fresh_zxae3v6\.claude\downloads\claude-2.0.13-win32-x64.exe"
$profilePath = $PROFILE

# Create profile directory if it doesn't exist
$profileDir = Split-Path -Parent $profilePath
if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Create profile if it doesn't exist
if (!(Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

# Check if function already exists
$content = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($content -notmatch "function claude") {
    # Add function to profile
    $functionDef = @"

# Claude Code CLI function
function claude {
    & "$claudePath" `$args
}
"@
    Add-Content -Path $profilePath -Value $functionDef
    Write-Host "[OK] Added 'claude' function to PowerShell profile" -ForegroundColor Green
    Write-Host "Profile location: $profilePath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To use immediately, run:" -ForegroundColor Yellow
    Write-Host "  . `$PROFILE" -ForegroundColor White
    Write-Host ""
    Write-Host "Or restart PowerShell" -ForegroundColor Yellow
} else {
    Write-Host "[OK] 'claude' function already exists in profile" -ForegroundColor Green
}

# Test the executable
Write-Host ""
Write-Host "Testing Claude executable..." -ForegroundColor Cyan
if (Test-Path $claudePath) {
    $sizeInMB = [math]::Round((Get-Item $claudePath).Length / 1MB, 2)
    Write-Host "[OK] Claude executable found ($sizeInMB MB)" -ForegroundColor Green
    Write-Host "     Path: $claudePath" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Claude executable not found at expected location" -ForegroundColor Red
}
