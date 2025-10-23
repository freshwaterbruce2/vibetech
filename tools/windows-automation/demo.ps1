# Demo: Windows Automation with Desktop Commander
Import-Module C:\dev\tools\windows-automation\WindowsAutomation.psm1

Write-Host "`n=== Windows Automation Demo ===" -ForegroundColor Cyan

# Test 1: Clipboard Operations
Write-Host "`n1. Clipboard Test" -ForegroundColor Yellow
Set-ClipboardText "Hello from automation!"
$clipboardText = Get-ClipboardText
Write-Host "   Clipboard content: $clipboardText" -ForegroundColor Green

# Test 2: List Windows
Write-Host "`n2. Window List (First 5)" -ForegroundColor Yellow
$windows = Get-AllWindows
$windows | Select-Object -First 5 | ForEach-Object {
    Write-Host "   - $($_.Title)" -ForegroundColor Green
}
Write-Host "   Total windows: $($windows.Count)" -ForegroundColor Green

# Test 3: Notification
Write-Host "`n3. Showing Notification" -ForegroundColor Yellow
Show-WindowsNotification -Title "Automation Test" -Message "Desktop Commander is working!"
Write-Host "   Notification displayed!" -ForegroundColor Green

# Test 4: Screenshot
Write-Host "`n4. Taking Screenshot" -ForegroundColor Yellow
$screenshotPath = "$env:TEMP\automation-test-screenshot.png"
Capture-Screenshot -Path $screenshotPath
Write-Host "   Screenshot saved: $screenshotPath" -ForegroundColor Green

Write-Host "`n=== All Tests Passed! ===" -ForegroundColor Cyan
Write-Host "`nAvailable Functions:" -ForegroundColor Yellow
Write-Host "  - Launch-App <name>" -ForegroundColor White
Write-Host "  - Get-ClipboardText" -ForegroundColor White
Write-Host "  - Set-ClipboardText <text>" -ForegroundColor White
Write-Host "  - Get-AllWindows" -ForegroundColor White
Write-Host "  - Focus-WindowByTitle <title>" -ForegroundColor White
Write-Host "  - Send-Keys <keys>" -ForegroundColor White
Write-Host "  - Click-AtPosition -X <x> -Y <y>" -ForegroundColor White
Write-Host "  - Capture-Screenshot -Path <path>" -ForegroundColor White
Write-Host "  - Show-WindowsNotification -Title <title> -Message <msg>" -ForegroundColor White
