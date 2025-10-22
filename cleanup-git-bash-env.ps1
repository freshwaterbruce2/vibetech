# Clean up CLAUDE_CODE_GIT_BASH_PATH from system environment
# This script will remove the environment variable from system-level settings
# so it only exists in VS Code via settings.json

Write-Host "=== Cleaning up CLAUDE_CODE_GIT_BASH_PATH Environment Variable ===" -ForegroundColor Green
Write-Host "Goal: Remove from system environment, keep only in VS Code settings.json" -ForegroundColor Yellow

# Check current state
Write-Host "`nCurrent state:" -ForegroundColor Cyan
$currentSession = $env:CLAUDE_CODE_GIT_BASH_PATH
$userEnv = [Environment]::GetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", "User")
$machineEnv = [Environment]::GetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", "Machine")

Write-Host "Current session: $currentSession"
Write-Host "User environment: $userEnv"
Write-Host "Machine environment: $machineEnv"

# Clear current session
Write-Host "`nClearing current PowerShell session..." -ForegroundColor Cyan
Remove-Item Env:CLAUDE_CODE_GIT_BASH_PATH -ErrorAction SilentlyContinue
Write-Host "✅ Current session cleared"

# Clear user environment
Write-Host "`nClearing user environment variable..." -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", $null, "User")
Write-Host "✅ User environment cleared"

# Try to clear machine environment (may need admin rights)
Write-Host "`nTrying to clear machine environment variable..." -ForegroundColor Cyan
try {
    [Environment]::SetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", $null, "Machine")
    Write-Host "✅ Machine environment cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not clear machine environment - may need admin rights" -ForegroundColor Yellow
    Write-Host "If this persists, run PowerShell as Administrator and run:" -ForegroundColor Yellow
    Write-Host '[Environment]::SetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", $null, "Machine")' -ForegroundColor White
}

# Verify cleanup
Write-Host "`nVerification after cleanup:" -ForegroundColor Cyan
$newSession = $env:CLAUDE_CODE_GIT_BASH_PATH
$newUserEnv = [Environment]::GetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", "User")
$newMachineEnv = [Environment]::GetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", "Machine")

Write-Host "Current session: $(if ($newSession) { $newSession } else { 'Not set ✅' })"
Write-Host "User environment: $(if ($newUserEnv) { $newUserEnv } else { 'Not set ✅' })"
Write-Host "Machine environment: $(if ($newMachineEnv) { $newMachineEnv } else { 'Not set ✅' })"

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "✅ Environment variable will now ONLY exist in VS Code via settings.json"
Write-Host "✅ Your regular PowerShell sessions will be unaffected"
Write-Host "✅ Claude Code extension will still work within VS Code"

Write-Host "`nVS Code settings.json should contain:" -ForegroundColor Cyan
Write-Host '"terminal.integrated.env.windows": {' -ForegroundColor White
Write-Host '    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"' -ForegroundColor White
Write-Host '}' -ForegroundColor White

Write-Host "`nCleanup complete! Close and reopen PowerShell to ensure changes take effect." -ForegroundColor Green
