---
allowed-tools: Bash(cd:*), Bash(npm:*), Bash(npx cap:*), Bash(./gradlew:*)
description: Build Android APK for Vibe-Tutor mobile app
argument-hint: [debug|release]
model: sonnet
---

# Build Android APK - Vibe-Tutor

Build the Vibe-Tutor mobile app as an Android APK for testing or production deployment.

## Step 1: Verify Project Location

Execute this bash command:
```bash
cd C:\dev\Vibe-Tutor && pwd
```

Present with header:
```
════════════════════════════════════════
  VIBE-TUTOR ANDROID BUILD
════════════════════════════════════════
```

Report location to user.

## Step 2: Sync Web Assets

Execute this bash command to build web app and sync to Android:
```bash
cd C:\dev\Vibe-Tutor && npm run build
```

Present with header:
```
════════════════════════════════════════
  BUILDING WEB APPLICATION
════════════════════════════════════════
```

Show build output.

If build fails, STOP and report errors.

## Step 3: Sync Capacitor

Execute this bash command to sync assets to Android:
```bash
cd C:\dev\Vibe-Tutor && npx cap sync android
```

Present with header:
```
════════════════════════════════════════
  SYNCING TO ANDROID PLATFORM
════════════════════════════════════════
```

Show sync output.

Report:
```
✓ Web assets copied to android/app/src/main/assets/public
✓ Native plugins synchronized
✓ Capacitor configuration updated
```

## Step 4: Increment Version Code

IMPORTANT: Increment versionCode to force cache clear on device.

Execute this bash command to check current version:
```bash
cd C:\dev\Vibe-Tutor\android\app && grep "versionCode" build.gradle
```

Present with header:
```
════════════════════════════════════════
  CURRENT VERSION
════════════════════════════════════════
```

Show current versionCode and versionName.

Warn user:
```
⚠ IMPORTANT: Increment versionCode before building!

Current versionCode: [show current]
Recommended: [current + 1]

Why this matters:
- Forces Android to clear WebView cache
- Ensures users get latest changes
- Prevents stale content issues

Update manually in: android/app/build.gradle
Or continue with current version (not recommended for production)
```

## Step 5: Build APK

Build Type: ${ARGUMENTS[0]:-debug}

### Debug Build (default):

Execute this bash command:
```bash
cd C:\dev\Vibe-Tutor\android && ./gradlew assembleDebug
```

Present with header:
```
════════════════════════════════════════
  BUILDING DEBUG APK
════════════════════════════════════════
```

Show build output (may take 2-5 minutes).

### Release Build (if 'release' argument):

Execute this bash command:
```bash
cd C:\dev\Vibe-Tutor\android && ./gradlew assembleRelease
```

Present with header:
```
════════════════════════════════════════
  BUILDING RELEASE APK
════════════════════════════════════════
```

Show build output (may take 3-7 minutes).

Note: Release builds require signing keys configuration.

## Step 6: Locate APK

Execute this bash command to find the APK:
```bash
cd C:\dev\Vibe-Tutor\android\app\build\outputs\apk && dir /s *.apk
```

Present with header:
```
════════════════════════════════════════
  APK BUILD COMPLETE
════════════════════════════════════════
```

Show APK location and size.

## Step 7: Installation Instructions

Provide installation guidance:
```
════════════════════════════════════════
  INSTALLATION & TESTING
════════════════════════════════════════

APK Location:
Debug: android/app/build/outputs/apk/debug/app-debug.apk
Release: android/app/build/outputs/apk/release/app-release.apk

INSTALL ON DEVICE:

Method 1 - ADB (Recommended):
  adb install android/app/build/outputs/apk/debug/app-debug.apk
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk  # Force reinstall

Method 2 - Manual Transfer:
  1. Copy APK to device storage
  2. Open file on device
  3. Allow installation from unknown sources
  4. Install

Method 3 - Capacitor CLI:
  npx cap run android

TESTING CHECKLIST:
✓ App launches without crashes
✓ All screens load correctly
✓ API calls work (check network)
✓ Styling appears correct (no CDN issues)
✓ Native features work (camera, storage, etc.)
✓ No console errors in WebView

COMMON ISSUES:
- Blank screen: Check versionCode was incremented
- Styling broken: Verify Tailwind v3 (not CDN)
- Network fails: Verify CapacitorHttp usage
- Crashes: Check logs with: adb logcat

════════════════════════════════════════
```

## Step 8: Build Configuration

Show important configuration details:
```
════════════════════════════════════════
  VIBE-TUTOR BUILD CONFIGURATION
════════════════════════════════════════

Key Learnings (from CLAUDE.md):
✓ Always use Tailwind v3 (NOT CDN v4)
✓ Use CapacitorHttp.request() explicitly
✓ Increment versionCode on each build
✓ Test on real devices, not just emulators

Build Files:
- android/app/build.gradle - Version config
- capacitor.config.ts - Capacitor settings
- vite.config.ts - Web build config
- tailwind.config.js - Styling (must be v3)

Current Status: v1.0.5 (Production-ready)

Related Commands:
- Sync only: /mobile:sync-capacitor
- Open in Android Studio: npx cap open android
- Run on device: npx cap run android

════════════════════════════════════════
```

## Step 9: Next Steps

Provide next steps based on build type:
```
${ARGUMENTS[0]:+For RELEASE builds:}
${ARGUMENTS[0]:+1. Sign APK with release keystore}
${ARGUMENTS[0]:+2. Test thoroughly on multiple devices}
${ARGUMENTS[0]:+3. Upload to Google Play Console}
${ARGUMENTS[0]:+4. Create release notes}

For DEBUG builds:
1. Install on test device: adb install -r [apk-path]
2. Monitor logs: adb logcat
3. Test all features
4. Report issues

Build Again:
- Same build: /mobile:build-android ${ARGUMENTS[0]:-debug}
- Other build: /mobile:build-android release

Quality Check:
- Run web quality: /web:quality-check
- Test web version: npm run dev
```

$ARGUMENTS

**IMPORTANT EXECUTION NOTES:**
- Execute bash commands using the Bash tool
- Build process may take 2-7 minutes
- Always increment versionCode for production
- Test on real devices, not just emulators
- All commands run from appropriate directories
- Gradle builds are cached for faster subsequent builds
