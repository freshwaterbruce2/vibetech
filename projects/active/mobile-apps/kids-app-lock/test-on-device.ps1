# Kid's App Lock - Quick Device Testing Script
# Usage: .\test-on-device.ps1

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Kid's App Lock - Device Testing" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if ADB is available
Write-Host "[1/6] Checking ADB..." -ForegroundColor Yellow
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue

if (-not $adbCheck) {
    Write-Host "ERROR: ADB not found!" -ForegroundColor Red
    Write-Host "Please install Android SDK Platform Tools" -ForegroundColor Red
    Write-Host "Download: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "ADB found: $($adbCheck.Source)" -ForegroundColor Green
Write-Host ""

# Check for connected devices
Write-Host "[2/6] Checking for connected devices..." -ForegroundColor Yellow
$devices = adb devices | Select-String -Pattern "device$"

if ($devices.Count -eq 0) {
    Write-Host "ERROR: No devices connected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Connect your Android device via USB" -ForegroundColor Yellow
    Write-Host "2. Enable USB debugging (Settings -> Developer Options)" -ForegroundColor Yellow
    Write-Host "3. Tap 'Allow' when prompted on device" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Device connected!" -ForegroundColor Green
Write-Host ""

# Navigate to Android project
Write-Host "[3/6] Navigating to Android project..." -ForegroundColor Yellow
Set-Location "C:\dev\projects\active\mobile-apps\kids-app-lock\android"

if (-not (Test-Path ".\gradlew")) {
    Write-Host "ERROR: gradlew not found! Are you in the right directory?" -ForegroundColor Red
    exit 1
}

Write-Host "Android project found!" -ForegroundColor Green
Write-Host ""

# Build APK
Write-Host "[4/6] Building debug APK..." -ForegroundColor Yellow
Write-Host "This may take 30-60 seconds..." -ForegroundColor Gray

$buildOutput = .\gradlew assembleDebug --no-daemon 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host ""

# Check APK size
$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK created: $apkPath" -ForegroundColor Green
    Write-Host "APK size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "WARNING: APK not found at expected location" -ForegroundColor Yellow
}
Write-Host ""

# Install APK
Write-Host "[5/6] Installing APK to device..." -ForegroundColor Yellow
$installOutput = .\gradlew installDebug --no-daemon 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Installation failed!" -ForegroundColor Red
    Write-Host $installOutput
    exit 1
}

Write-Host "Installation successful!" -ForegroundColor Green
Write-Host ""

# Launch app
Write-Host "[6/6] Launching app on device..." -ForegroundColor Yellow
adb shell am start -n com.kidesafe.applock/.MainActivity

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "SUCCESS! App launched on device" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Complete onboarding on device (set PIN)" -ForegroundColor White
Write-Host "2. Grant Device Admin permission" -ForegroundColor White
Write-Host "3. Grant Usage Stats permission" -ForegroundColor White
Write-Host "4. Test all three modes:" -ForegroundColor White
Write-Host "   - Single App Lock (Mode 1)" -ForegroundColor Gray
Write-Host "   - Allow Only Selected (Mode 2)" -ForegroundColor Gray
Write-Host "   - Block Selected Apps (Mode 3)" -ForegroundColor Gray
Write-Host ""

Write-Host "Testing Guide: TESTING_GUIDE.md" -ForegroundColor Yellow
Write-Host ""

# Offer to show logs
Write-Host "View live logs? (Y/N): " -NoNewline -ForegroundColor Cyan
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Showing live logs (Press Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    adb logcat | Select-String -Pattern "KioskManager|MainActivity|MainViewModel"
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Green
Write-Host ""
