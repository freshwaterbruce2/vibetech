# Test launch the packaged app and capture console output
$appPath = "C:\dev\projects\active\desktop-apps\deepcode-editor\release-builds\win-unpacked\Vibe Code Studio.exe"

Write-Host "Launching Vibe Code Studio..." -ForegroundColor Cyan
Write-Host "If app is stuck on loading screen, check for errors in DevTools (F12)" -ForegroundColor Yellow
Write-Host ""

& $appPath
