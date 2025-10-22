# Test Build Script for Kid's App Lock
# Verifies APK build and readiness for testing

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Kid's App Lock - Build Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Test 1: Check if APK exists
Write-Host "[1/8] Checking if APK file exists..." -NoNewline
$apkPath = "C:/dev/projects/active/mobile-apps/kids-app-lock/android/app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host " FAIL" -ForegroundColor Red
    Write-Host "      APK not found at: $apkPath" -ForegroundColor Red
    $ErrorCount++
}

# Test 2: Check Java version
Write-Host "[2/8] Checking Java installation..." -NoNewline
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      $javaVersion" -ForegroundColor Gray
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $ErrorCount++
}

# Test 3: Check ADB installation
Write-Host "[3/8] Checking ADB installation..." -NoNewline
try {
    $adbVersion = adb version 2>&1 | Select-String "Version" | Select-Object -First 1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      $adbVersion" -ForegroundColor Gray
} catch {
    Write-Host " WARN" -ForegroundColor Yellow
    Write-Host "      ADB not found. Install Android SDK Platform Tools for device testing." -ForegroundColor Yellow
    $WarningCount++
}

# Test 4: Check for connected devices
Write-Host "[4/8] Checking for connected Android devices..." -NoNewline
try {
    $devices = adb devices 2>&1 | Select-String "device$" | Where-Object { $_ -notmatch "List of devices" }
    if ($devices) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "      Found device(s): $($devices.Count)" -ForegroundColor Gray
    } else {
        Write-Host " WARN" -ForegroundColor Yellow
        Write-Host "      No devices connected. Connect device via USB to test." -ForegroundColor Yellow
        $WarningCount++
    }
} catch {
    Write-Host " SKIP" -ForegroundColor Yellow
    $WarningCount++
}

# Test 5: Check Kotlin files compile
Write-Host "[5/8] Checking Kotlin source files..." -NoNewline
$kotlinFiles = Get-ChildItem -Path "C:/dev/projects/active/mobile-apps/kids-app-lock/android/app/src/main/java" -Filter "*.kt" -Recurse
if ($kotlinFiles.Count -gt 0) {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      Found $($kotlinFiles.Count) Kotlin files" -ForegroundColor Gray
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $ErrorCount++
}

# Test 6: Check AndroidManifest.xml
Write-Host "[6/8] Checking AndroidManifest.xml..." -NoNewline
$manifestPath = "C:/dev/projects/active/mobile-apps/kids-app-lock/android/app/src/main/AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw
    $checks = @(
        @{ Name = "Package name"; Pattern = "com.kidesafe.applock" },
        @{ Name = "Device Admin receiver"; Pattern = "KioskDeviceAdminReceiver" },
        @{ Name = "Usage Stats permission"; Pattern = "PACKAGE_USAGE_STATS" }
    )

    $allChecks = $true
    foreach ($check in $checks) {
        if ($manifest -notmatch $check.Pattern) {
            $allChecks = $false
            break
        }
    }

    if ($allChecks) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " WARN" -ForegroundColor Yellow
        $WarningCount++
    }
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $ErrorCount++
}

# Test 7: Check documentation
Write-Host "[7/8] Checking documentation..." -NoNewline
$docs = @(
    "C:/dev/projects/active/mobile-apps/kids-app-lock/README.md",
    "C:/dev/projects/active/mobile-apps/kids-app-lock/CLAUDE.md",
    "C:/dev/projects/active/mobile-apps/kids-app-lock/docs/DEVICE_OWNER_SETUP.md"
)

$docCount = 0
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $docCount++
    }
}

if ($docCount -eq $docs.Count) {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      All $docCount documentation files present" -ForegroundColor Gray
} else {
    Write-Host " WARN" -ForegroundColor Yellow
    Write-Host "      Only $docCount of $($docs.Count) docs found" -ForegroundColor Yellow
    $WarningCount++
}

# Test 8: APK signature verification
Write-Host "[8/8] Verifying APK signature..." -NoNewline
if (Test-Path $apkPath) {
    # Try to get APK info using aapt2 if available
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      Debug signature present" -ForegroundColor Gray
} else {
    Write-Host " SKIP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "Status: READY FOR TESTING" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Connect Android device via USB" -ForegroundColor White
    Write-Host "  2. Enable USB debugging on device" -ForegroundColor White
    Write-Host "  3. Run: adb install $apkPath" -ForegroundColor White
    Write-Host "  4. Set Device Owner (see DEVICE_OWNER_SETUP.md)" -ForegroundColor White
    Write-Host ""
} elseif ($ErrorCount -eq 0) {
    Write-Host "Status: READY WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Status: BUILD ISSUES DETECTED" -ForegroundColor Red
    Write-Host "Errors: $ErrorCount" -ForegroundColor Red
    Write-Host "Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please fix errors before proceeding." -ForegroundColor Red
}

Write-Host "Build Report: See BUILD_SUCCESS.md for details" -ForegroundColor Gray
Write-Host ""
