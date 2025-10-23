# Run this script as Administrator to complete the cleanup
# Right-click PowerShell -> Run as Administrator, then run this script

Write-Host "=== Admin Cleanup for CLAUDE_CODE_GIT_BASH_PATH ===" -ForegroundColor Green

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green

# Remove machine-level environment variable
Write-Host "`nRemoving CLAUDE_CODE_GIT_BASH_PATH from machine environment..." -ForegroundColor Cyan
try {
    [Environment]::SetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", $null, "Machine")
    Write-Host "✅ Successfully removed machine environment variable" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to remove: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify
$machineEnv = [Environment]::GetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", "Machine")
if ($machineEnv) {
    Write-Host "⚠️  Machine environment still contains: $machineEnv" -ForegroundColor Yellow
} else {
    Write-Host "✅ Machine environment successfully cleared" -ForegroundColor Green
}

Write-Host "`n✅ Cleanup complete! The environment variable now only exists in VS Code settings.json" -ForegroundColor Green
