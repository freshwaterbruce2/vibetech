<#
.SYNOPSIS
    Test bot startup in current window with full error output
#>

$BotPath = "C:\dev\projects\crypto-enhanced"
$VenvPython = "$BotPath\.venv\Scripts\python.exe"

Write-Host ""
Write-Host "Testing bot startup in current window..." -ForegroundColor Cyan
Write-Host ""

# Change to bot directory
Set-Location $BotPath

# Test 1: Check Python
Write-Host "[TEST 1] Python executable:" -ForegroundColor Yellow
Write-Host "  $VenvPython" -ForegroundColor Gray
if (Test-Path $VenvPython) {
    Write-Host "  [OK] Found" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Check Python version
Write-Host "[TEST 2] Python version:" -ForegroundColor Yellow
& $VenvPython --version
Write-Host ""

# Test 3: Check script exists
Write-Host "[TEST 3] Trading script:" -ForegroundColor Yellow
if (Test-Path "start_live_trading.py") {
    Write-Host "  [OK] Found" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Check for lock files
Write-Host "[TEST 4] Lock files:" -ForegroundColor Yellow
$locks = Get-ChildItem -Filter "*.lock" -ErrorAction SilentlyContinue
if ($locks) {
    Write-Host "  [WARNING] Found lock files:" -ForegroundColor Yellow
    foreach ($lock in $locks) {
        Write-Host "    - $($lock.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "  [OK] No lock files" -ForegroundColor Green
}
Write-Host ""

# Test 5: Try importing config
Write-Host "[TEST 5] Testing Python config:" -ForegroundColor Yellow
$configTest = & $VenvPython -c "import sys; sys.path.insert(0, '.'); import config; print('Config loaded OK')" 2>&1
Write-Host "  $configTest" -ForegroundColor Gray
Write-Host ""

# Test 6: Start the bot with full output
Write-Host "[TEST 6] Starting bot (with full error output)..." -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop the bot" -ForegroundColor Gray
Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan

# Start bot - echo YES first, then run
"YES" | & $VenvPython start_live_trading.py
