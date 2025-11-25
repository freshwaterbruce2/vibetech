---
allowed-tools: Bash(cd:*), Bash(npx cap:*), Bash(npm:*)
description: Sync web assets to native platforms for Capacitor apps
argument-hint: [android|ios|both]
model: sonnet
---

# Sync Capacitor - Native Platforms

Sync web application assets to Android and/or iOS native platforms for Vibe-Tutor.

## Step 1: Determine Target Platform

Platform: ${ARGUMENTS[0]:-both}

Valid options: android, ios, both

If invalid platform specified, show usage:
```
════════════════════════════════════════
  SYNC CAPACITOR - USAGE
════════════════════════════════════════

Usage: /mobile:sync-capacitor [platform]

Arguments:
  platform - Target platform (default: both)
             Options: android, ios, both

Examples:
  /mobile:sync-capacitor android
  /mobile:sync-capacitor ios
  /mobile:sync-capacitor both

What Sync Does:
✓ Copies web assets to native projects
✓ Updates native plugins
✓ Synchronizes Capacitor configuration
✓ Prepares for native build

════════════════════════════════════════
```

## Step 2: Build Web Application

Execute this bash command to build the web app:
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

If build fails, STOP and report errors with recommendation:
```
✗ Web build failed!

Fix errors and try again:
1. Check build errors above
2. Run: /web:quality-check fix
3. Fix any TypeScript/ESLint errors
4. Retry sync
```

## Step 3: Sync to Platform(s)

### Sync to Android (if platform = android or both):

Execute this bash command:
```bash
cd C:\dev\Vibe-Tutor && npx cap sync android
```

Present with header:
```
════════════════════════════════════════
  SYNCING TO ANDROID
════════════════════════════════════════
```

Show sync output.

Report:
```
✓ Android Sync Complete

Synced to: android/app/src/main/assets/public
Files updated:
- Web assets (HTML, CSS, JS)
- Native plugin configurations
- Capacitor runtime
- AndroidManifest.xml (if needed)
```

### Sync to iOS (if platform = ios or both):

Execute this bash command:
```bash
cd C:\dev\Vibe-Tutor && npx cap sync ios
```

Present with header:
```
════════════════════════════════════════
  SYNCING TO iOS
════════════════════════════════════════
```

Show sync output.

Report:
```
✓ iOS Sync Complete

Synced to: ios/App/App/public
Files updated:
- Web assets (HTML, CSS, JS)
- Native plugin configurations
- Capacitor runtime
- Info.plist (if needed)
```

## Step 4: Verify Sync

Execute these bash commands to verify sync:
```bash
cd C:\dev\Vibe-Tutor\android\app\src\main\assets\public && dir index.html
```

```bash
cd C:\dev\Vibe-Tutor\ios\App\App\public && ls -la index.html
```

Present with header:
```
════════════════════════════════════════
  SYNC VERIFICATION
════════════════════════════════════════
```

Show verification results for each platform.

## Step 5: Important Notes

Provide critical information:
```
════════════════════════════════════════
  IMPORTANT SYNC NOTES
════════════════════════════════════════

WHEN TO SYNC:
✓ After changing web code
✓ After installing Capacitor plugins
✓ After updating capacitor.config.ts
✓ Before building native app
✓ After dependency updates

WHAT GETS SYNCED:
✓ dist/ folder contents → native assets
✓ Capacitor plugins to native projects
✓ Configuration from capacitor.config.ts
✓ Package.json dependencies (native plugins)

WHAT DOESN'T GET SYNCED:
✗ Native code changes (edit in Android Studio/Xcode)
✗ Platform-specific resources
✗ Signing keys and credentials
✗ Native dependencies (gradle/pods)

VERSION CODE WARNING:
⚠ Remember to increment versionCode in android/app/build.gradle
⚠ This forces Android WebView to clear cache
⚠ Without this, users may see stale content

════════════════════════════════════════
```

## Step 6: Next Steps

Provide workflow guidance:
```
════════════════════════════════════════
  NEXT STEPS
════════════════════════════════════════

Development Workflow:
1. Make changes to web code (src/)
2. Test in browser: npm run dev
3. Build: npm run build
4. Sync: /mobile:sync-capacitor ${ARGUMENTS[0]:-both}
5. Test native: npx cap run ${ARGUMENTS[0]:-android}

Building for Release:
1. Sync with this command
2. Increment versionCode
3. Build APK/IPA: /mobile:build-android release
4. Test thoroughly
5. Deploy

Quick Commands:
- Build Android: /mobile:build-android
- Run on device: npx cap run android
- Open in IDE: npx cap open android
- View logs: adb logcat (Android)

Common Issues:
- "Module not found": Run npm install, then sync again
- Blank screen: Increment versionCode
- Styling broken: Check Tailwind v3 (not CDN)
- Network errors: Verify CapacitorHttp usage

Related Commands:
- Build Android: /mobile:build-android
- Quality check: /web:quality-check
- Component create: /web:component-create

════════════════════════════════════════
```

## Step 7: Capacitor Configuration

Show current configuration:
```
════════════════════════════════════════
  CAPACITOR CONFIGURATION
════════════════════════════════════════

File: capacitor.config.ts

Key Settings:
- appId: [from config]
- appName: "Vibe-Tutor"
- webDir: "dist"
- server.url: [dev server or production]

Plugins Used (examples):
- @capacitor/app
- @capacitor/http
- @capacitor/filesystem
- @capacitor/camera
- @capacitor/storage

Configuration Tips:
✓ Use CapacitorHttp for network requests
✓ Set proper server.url for dev testing
✓ Configure permissions in AndroidManifest.xml
✓ Set up deep linking if needed

Check Config:
  cat capacitor.config.ts

Update Plugins:
  npm update @capacitor/core @capacitor/cli

════════════════════════════════════════
```

$ARGUMENTS

**IMPORTANT EXECUTION NOTES:**
- Execute bash commands using the Bash tool
- Always build web app before syncing
- Sync copies dist/ to native asset folders
- After sync, native build is ready
- All commands run from Vibe-Tutor directory
- Sync is fast (~5-10 seconds typically)
- Must sync after any web code changes
