<#
.SYNOPSIS
    Start trading bot in a NEW PowerShell window with automatic YES confirmation

.DESCRIPTION
    Alternative approach that creates a new PowerShell window which internally
    uses System.Diagnostics.Process to handle stdin properly.

.NOTES
    This creates a wrapper PowerShell window that runs the bot with auto-YES
#>

[CmdletBinding()]
param()

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"
$Script = "start_live_trading.py"

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host "TRADING BOT STARTUP - NEW WINDOW METHOD" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""

# Validate prerequisites
if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Python not found: $VenvPython" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$BotPath\$Script")) {
    Write-Host "[ERROR] Script not found: $BotPath\$Script" -ForegroundColor Red
    exit 1
}

# Check if already running
$existing = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdLine -like "*start_live_trading*"
}

if ($existing) {
    Write-Host "[WARNING] Bot already running (PID: $($existing[0].Id))" -ForegroundColor Yellow
    Write-Host "Run Force-Stop-Trading.ps1 first to stop it" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "Creating new PowerShell window with auto-YES bot..." -ForegroundColor Cyan
Write-Host ""

# Create command that will run in the new window
$command = @"
`$Host.UI.RawUI.WindowTitle = 'Crypto Trading Bot - Live'
Write-Host ''
Write-Host ('=' * 80) -ForegroundColor Green
Write-Host 'CRYPTO TRADING BOT - AUTO-STARTED WITH YES CONFIRMATION' -ForegroundColor Green
Write-Host ('=' * 80) -ForegroundColor Green
Write-Host ''
Write-Host 'Starting bot with System.Diagnostics.Process...' -ForegroundColor Cyan
Write-Host ''

`$psi = New-Object System.Diagnostics.ProcessStartInfo
`$psi.FileName = '$VenvPython'
`$psi.Arguments = '$Script'
`$psi.WorkingDirectory = '$BotPath'
`$psi.UseShellExecute = `$false
`$psi.RedirectStandardInput = `$true
`$psi.RedirectStandardOutput = `$true
`$psi.RedirectStandardError = `$true
`$psi.CreateNoWindow = `$false

`$process = [System.Diagnostics.Process]::Start(`$psi)
Write-Host 'Bot process started (PID: ' -NoNewline -ForegroundColor Green
Write-Host `$process.Id -NoNewline -ForegroundColor White
Write-Host ')' -ForegroundColor Green
Write-Host ''

Start-Sleep -Seconds 2
Write-Host 'Sending YES confirmation...' -ForegroundColor Yellow
`$process.StandardInput.WriteLine('YES')
`$process.StandardInput.Close()
Write-Host 'Confirmation sent!' -ForegroundColor Green
Write-Host ''
Write-Host ('=' * 80) -ForegroundColor Cyan
Write-Host 'BOT OUTPUT' -ForegroundColor Cyan
Write-Host ('=' * 80) -ForegroundColor Cyan
Write-Host ''

# Stream output
while ((`$line = `$process.StandardOutput.ReadLine()) -ne `$null) {
    Write-Host `$line
}

`$process.WaitForExit()

Write-Host ''
Write-Host ('=' * 80) -ForegroundColor Yellow
Write-Host 'Bot stopped. Exit code: ' -NoNewline -ForegroundColor Yellow
Write-Host `$process.ExitCode -ForegroundColor White
Write-Host ('=' * 80) -ForegroundColor Yellow
Write-Host ''
Write-Host 'Press any key to close this window...' -ForegroundColor Gray
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

# Launch new PowerShell window with the command
Start-Process powershell.exe -ArgumentList `
    "-NoExit", `
    "-ExecutionPolicy", "Bypass", `
    "-Command", $command

Write-Host "[SUCCESS] Bot launched in new window" -ForegroundColor Green
Write-Host ""
Write-Host "Look for the new PowerShell window titled:" -ForegroundColor Cyan
Write-Host "  'Crypto Trading Bot - Live'" -ForegroundColor White
Write-Host ""
Write-Host "Waiting 5 seconds to verify startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify bot process started
$botProcess = Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdLine -like "*start_live_trading*"
}

if ($botProcess) {
    Write-Host ""
    Write-Host "[VERIFIED] Bot is running!" -ForegroundColor Green
    Write-Host "  Bot PID: $($botProcess[0].Id)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[WARNING] Bot process not detected" -ForegroundColor Yellow
    Write-Host "Check the new PowerShell window for error messages" -ForegroundColor Gray
    Write-Host ""
}
