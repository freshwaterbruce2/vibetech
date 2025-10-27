# Quick Start - Testing Kid's App Lock

**Goal:** Get the app running on your device in under 5 minutes

---

## Option 1: Automated Testing (Easiest)

**Single command to build, install, and launch:**

```powershell
cd C:\dev\projects\active\mobile-apps\kids-app-lock
.\test-on-device.ps1
```

**What it does:**
1. ✅ Checks ADB is installed
2. ✅ Verifies device is connected
3. ✅ Builds debug APK
4. ✅ Installs to device
5. ✅ Launches app
6. ✅ Offers to show live logs

**Time:** 2-3 minutes

---

## Option 2: Manual Testing (Step by Step)

### Step 1: Connect Device

1. Connect Android device via USB
2. Enable USB debugging:
   - Settings → About Phone
   - Tap "Build number" 7 times
   - Back → Developer Options
   - Enable "USB debugging"
3. Tap "Allow" when prompted on device

### Step 2: Verify Connection

```bash
adb devices
# Expected: List of devices attached
#           ABC123456789    device
```

### Step 3: Build and Install

```bash
cd C:\dev\projects\active\mobile-apps\kids-app-lock\android
./gradlew installDebug
```

**Expected output:** `BUILD SUCCESSFUL`

### Step 4: Launch App

```bash
adb shell am start -n com.kidesafe.applock/.MainActivity
```

**Time:** 3-5 minutes

---

## What to Test

### Test 1: Single App Lock (5 minutes)
✅ **Works TODAY** - Fully functional

1. Complete onboarding (set PIN)
2. Grant permissions
3. Select "Single App Lock" mode
4. Pick ONE app (e.g., Clock)
5. Tap "Lock to This App"

**Expected:** Device locked to that app, cannot exit without PIN

---

### Test 2: Block Selected Apps (5 minutes)
⚠️ **PARTIAL** - UI works, monitoring needs work

1. Select "Block Selected Apps" mode
2. Pick apps to block (e.g., games, social media)
3. Tap "Block These Apps"

**Expected:**
- ✅ Apps selected and saved
- ✅ Red color coding shows
- ❌ Active blocking doesn't work yet (monitoring service needed)

---

### Test 3: Whitelist (5 minutes)
⚠️ **Requires Device Owner** - May need factory reset

1. Check if Device Owner set:
   ```bash
   adb shell dpm list-owners
   ```

2. If NOT set (most likely):
   - Skip this test for now
   - Requires factory reset to enable
   - Not needed for your use case anyway

3. If IS set:
   - Select "Allow Only Selected" mode
   - Pick multiple apps
   - Tap "Allow Only These Apps"

**Expected:** Can only use selected apps

---

## Troubleshooting

### "No devices found"
**Solution:**
1. Check USB cable is data cable (not charging-only)
2. Try different USB port
3. On device: Settings → Developer Options → Revoke USB authorizations → Reconnect

### "Build failed"
**Solution:**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### "Installation failed"
**Solution:**
```bash
# Uninstall old version
adb uninstall com.kidesafe.applock

# Reinstall
./gradlew installDebug
```

### "App crashes on launch"
**Solution:**
```bash
# View crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"
```

---

## Your Use Case: Blocking Apps

**Goal:** Keep son out of certain apps

**Best Mode:** Block Selected Apps (Mode 3)

**Quick Setup:**
1. Run automated test script: `.\test-on-device.ps1`
2. Complete onboarding
3. Select "Block Selected Apps"
4. Choose apps to block (TikTok, Instagram, games)
5. Tap "Block These Apps"

**Current Status:**
- ✅ UI works perfectly
- ✅ App selections save correctly
- ⚠️ Active blocking needs monitoring service
- ⏳ Coming next: Background monitoring to actually block apps

**Workaround (Until Monitoring Complete):**
- Use "Allow Only Selected" mode instead
- Select all SAFE apps your son CAN use
- Everything else is automatically blocked
- Requires Device Owner setup (factory reset)

---

## Next Steps

**After Testing:**

1. ✅ **Working Modes:**
   - Single App Lock → Ready for production
   - Whitelist → Ready (if Device Owner set)

2. ⚠️ **Needs Completion:**
   - Blacklist monitoring service
   - Accessibility Service for app detection
   - Overlay window to block launches

3. 📋 **Future Enhancements:**
   - Unit tests
   - Time limits
   - Scheduled mode switching
   - Usage reports

---

## Files Reference

**Documentation:**
- `TESTING_GUIDE.md` - Detailed testing procedures
- `THREE_MODE_IMPLEMENTATION.md` - Technical implementation details
- `CLAUDE.md` - Development guidelines
- `DEVELOPMENT_PLAN.md` - Roadmap

**Scripts:**
- `test-on-device.ps1` - Automated testing script
- `android/gradlew` - Gradle build script

**APK Location:**
- `android/app/build/outputs/apk/debug/app-debug.apk` (58MB)

---

## Support

**View Logs:**
```bash
adb logcat | grep -E "KioskManager|MainActivity"
```

**Force Stop:**
```bash
adb shell am force-stop com.kidesafe.applock
```

**Restart:**
```bash
adb shell am start -n com.kidesafe.applock/.MainActivity
```

**Check Permissions:**
```bash
adb shell dumpsys package com.kidesafe.applock | grep permission
```

---

## Summary

**What Works:**
- ✅ Single App Lock (fully functional)
- ✅ Whitelist mode (requires Device Owner)
- ✅ Multi-app selection UI
- ✅ Mode switching
- ✅ PIN security
- ✅ Data persistence

**What's Coming:**
- ⏳ Blacklist monitoring service
- ⏳ Active app blocking
- ⏳ Background monitoring

**Recommended Test:**
1. Run `.\test-on-device.ps1`
2. Test Single App Lock (Mode 1) - Should work perfectly
3. Test Block Selected Apps UI (Mode 3) - UI works, blocking doesn't yet
4. Report any issues found

**Time Investment:** 10-15 minutes for full testing

---

Ready to start? Run: `.\test-on-device.ps1`
