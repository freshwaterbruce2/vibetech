# Kid's App Lock - Device Testing Guide

**Date:** 2025-10-25
**Version:** 2.0.0-enhanced
**Testing Status:** Ready for Device Testing

---

## Pre-Testing Checklist

### What You Need

- [x] ✅ APK built successfully (58MB)
- [ ] Physical Android device (Android 9.0+)
- [ ] USB cable
- [ ] ADB installed and working
- [ ] 10-15 minutes for testing

### Quick ADB Check

```bash
# Check if ADB is installed
adb --version

# Check if device is connected
adb devices
# Expected: List of devices attached
#           ABC123456789    device

# If no devices shown:
# 1. Enable USB debugging on device (Settings → Developer Options)
# 2. Connect USB cable
# 3. Tap "Allow" on device when prompted
```

---

## Testing Workflow

### Phase 1: Install and Initial Setup (5 minutes)

**Step 1: Install APK**

```bash
cd C:\dev\projects\active\mobile-apps\kids-app-lock\android

# Install to connected device
./gradlew installDebug

# Expected output:
# BUILD SUCCESSFUL
# App installed on device
```

**Step 2: Launch App**

On device:
1. Open app drawer
2. Find "Kid's App Lock" (KideSafe)
3. Tap to open

OR from command line:
```bash
adb shell am start -n com.kidesafe.applock/.MainActivity
```

**Step 3: Complete Onboarding**

1. ✅ **Onboarding Screen**
   - Read welcome message
   - Tap "Get Started"

2. ✅ **Setup PIN Screen**
   - Enter 4-digit PIN (e.g., 1234)
   - Re-enter same PIN
   - Tap "Set PIN"

3. ✅ **Security Question Screen**
   - Select a question (or enter custom)
   - Enter answer
   - Tap "Set Security Question"

4. ✅ **Permissions Screen**
   - Tap "Enable Device Admin"
   - Grant permission on system dialog
   - Tap "Grant Usage Stats"
   - Enable in Settings → Usage access
   - Return to app
   - Tap "Continue"

**Expected Result:** Should now see App Selection screen with mode selector

---

### Phase 2: Test Mode 1 - Single App Lock (3 minutes)

**Scenario:** Lock device to ONE app only

**Steps:**

1. ✅ **Select Mode**
   - Ensure "Single App Lock" chip is selected (should be blue)
   - Read description: "Lock device to ONE app only..."

2. ✅ **Select App**
   - Scroll through app list
   - Tap on a safe app (e.g., Clock, Calculator, or YouTube)
   - App card should turn blue/green
   - Check mark should appear

3. ✅ **Start Lock Mode**
   - Bottom bar should show "1 app selected"
   - Tap "Lock to This App" button
   - App should launch

4. ✅ **Test Lock Behavior**
   - Try pressing BACK button → Should not exit
   - Try pressing HOME button → Should not exit
   - Try pulling down notification shade → Should not work (if Device Owner)
   - Try accessing recent apps → Should not work (if Device Owner)

5. ✅ **Exit Lock Mode**
   - Triple-tap screen (if implemented)
   - OR force stop: `adb shell am force-stop com.kidesafe.applock`
   - Reopen app
   - Enter PIN when prompted

**Expected Results:**
- [x] App launches in lock task mode
- [x] Cannot exit to home screen
- [x] PIN required to exit
- [ ] System UI hidden (requires Device Owner)

**Test Status:** ⬜ PASS / ⬜ FAIL / ⬜ PARTIAL

**Notes:**
```
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

---

### Phase 3: Test Mode 2 - Whitelist (5 minutes)

**Scenario:** Allow ONLY selected apps

**Requirements:**
- ⚠️ Requires Device Owner mode
- ⚠️ May require factory reset if not set

**Device Owner Check:**

```bash
# Check if Device Owner is set
adb shell dpm list-owners

# Expected for Device Owner:
# Device Owner: com.kidesafe.applock

# Expected for Device Admin only:
# (empty or shows "Active admins")
```

**If NOT Device Owner:**

Option A: Set Device Owner (Factory Reset Required)
```bash
# WARNING: This requires factory reset!
# 1. Backup all data
# 2. Factory reset device
# 3. Skip Google account setup
# 4. Enable USB debugging
# 5. Run:
adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver
```

Option B: Skip Whitelist Testing
- Move to Phase 4 (Blacklist mode)
- Whitelist can be tested later with Device Owner setup

**Whitelist Testing Steps (If Device Owner Set):**

1. ✅ **Select Mode**
   - Return to app selection screen
   - Tap "Allow Only Selected" chip
   - Read description

2. ✅ **Select Multiple Apps**
   - Tap 3-5 safe apps (e.g., Clock, Calculator, Camera, YouTube)
   - Each should show blue/green background
   - Check marks on all selected apps
   - Checkboxes visible on unselected apps

3. ✅ **Start Whitelist Mode**
   - Bottom bar shows "X apps selected"
   - Tap "Allow Only These Apps"

4. ✅ **Test Whitelist Behavior**
   - Try opening a selected app → Should work
   - Try switching between selected apps → Should work
   - Try opening a NON-selected app → Should be blocked
   - Try accessing Settings → Should be blocked
   - Try accessing app drawer → Should only show allowed apps

5. ✅ **Exit Whitelist Mode**
   - Enter PIN to exit

**Expected Results:**
- [x] Can switch between allowed apps
- [x] Non-allowed apps are blocked
- [x] Home screen restricted to allowed apps only

**Test Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIPPED (No Device Owner)

**Notes:**
```
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

---

### Phase 4: Test Mode 3 - Blacklist (5 minutes)

**Scenario:** Block specific apps (YOUR USE CASE!)

**Steps:**

1. ✅ **Select Mode**
   - Tap "Block Selected Apps" chip
   - Should turn blue
   - Description: "Block specific apps. Child can use everything EXCEPT..."

2. ✅ **Select Apps to Block**
   - Tap on apps to block (e.g., if you have TikTok, Instagram, games)
   - Selected apps should show RED background
   - Check marks on blocked apps
   - Bottom bar updates: "X apps selected"

3. ✅ **Start Blacklist Mode**
   - Tap "Block These Apps" button
   - Should return to home screen or show success message

4. ✅ **Test Blacklist Behavior**
   - Try opening a NON-blocked app → Should work normally
   - Try opening a BLOCKED app → Should show warning/blocking overlay
   - Verify all other apps work normally

5. ✅ **Check Persistence**
   - Force stop app: `adb shell am force-stop com.kidesafe.applock`
   - Reboot device: `adb reboot`
   - After reboot, try opening blocked app
   - Should still be blocked

6. ✅ **Exit Blacklist Mode**
   - Reopen Kid's App Lock
   - Enter PIN
   - Navigate back to app selection
   - Change mode or clear selections

**Expected Results:**
- [x] Blocked apps saved to SharedPreferences
- [ ] Blocked apps show overlay when launched (NOT YET IMPLEMENTED)
- [x] Non-blocked apps work normally
- [x] Settings persist across app restarts

**Test Status:** ⬜ PASS / ⬜ FAIL / ⬜ PARTIAL (Monitoring not implemented)

**Notes:**
```
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

---

## Known Issues & Limitations

### Current Limitations

**Blacklist Mode:**
- ⚠️ Monitoring service NOT YET IMPLEMENTED
- ⚠️ Blocked apps are saved but not actively blocked
- ⚠️ No overlay window to prevent app launch
- ✅ App list saves/loads correctly
- ✅ Mode switching works
- ✅ UI shows selected apps in red

**What Works:**
- Mode selection and switching
- Multi-app selection
- Data persistence
- UI color coding

**What Doesn't Work:**
- Active app blocking in BLACKLIST mode
- Background monitoring service
- Overlay window to prevent launches

### Workarounds

**For Testing Blacklist Logic:**
```bash
# Check if blocked apps are saved
adb shell run-as com.kidesafe.applock cat /data/data/com.kidesafe.applock/shared_prefs/kiosk_prefs.xml

# Expected to see:
# <string name="blocking_mode">BLACKLIST</string>
# <string name="blocked_packages">com.tiktok,com.instagram.android,...</string>
```

---

## Debugging Commands

### View Live Logs

```bash
# All app logs
adb logcat | grep -E "KioskManager|MainActivity|MainViewModel"

# Just errors
adb logcat | grep -E "ERROR|FATAL"

# Specific component
adb logcat | grep "KioskManager"
```

### Check App State

```bash
# Check if app is running
adb shell ps | grep kidesafe

# Check permissions granted
adb shell dumpsys package com.kidesafe.applock | grep permission

# Check Device Admin status
adb shell dumpsys device_policy | grep kidesafe

# Check lock task packages
adb shell dumpsys device_policy | grep lockTaskPackages
```

### Force Actions

```bash
# Force stop app
adb shell am force-stop com.kidesafe.applock

# Restart app
adb shell am start -n com.kidesafe.applock/.MainActivity

# Clear app data (resets everything)
adb shell pm clear com.kidesafe.applock

# Uninstall app
adb uninstall com.kidesafe.applock
```

---

## Testing Results Summary

### Mode 1: Single App Lock

- [ ] Installation successful
- [ ] Onboarding completed
- [ ] App selection works
- [ ] Lock task mode activates
- [ ] Cannot exit with BACK/HOME
- [ ] PIN required to exit

**Overall:** ⬜ PASS / ⬜ FAIL

---

### Mode 2: Whitelist

- [ ] Device Owner status: ⬜ SET / ⬜ NOT SET
- [ ] Multi-app selection works
- [ ] Only allowed apps accessible
- [ ] Non-allowed apps blocked
- [ ] Can switch between allowed apps

**Overall:** ⬜ PASS / ⬜ FAIL / ⬜ SKIPPED

---

### Mode 3: Blacklist

- [ ] Multi-app selection works
- [ ] Red color coding shows
- [ ] Blocked apps saved correctly
- [ ] Active blocking works: ⬜ YES / ⬜ NO (expected NO)
- [ ] Settings persist after reboot

**Overall:** ⬜ PARTIAL (Monitoring not implemented)

---

## Next Steps After Testing

### If PASS (Single App Lock & Whitelist)
✅ Core functionality works!
- Deploy to production device
- Test with actual child usage
- Monitor for issues

### If PARTIAL (Blacklist Mode)
⚠️ Expected result!
- Blacklist monitoring service needs implementation
- UI and data persistence works
- Next: Implement AccessibilityService or UsageStats polling

### If FAIL
❌ Debug issues found
- Review error logs
- Check permissions granted
- Verify Android version compatibility
- Report issues for fixing

---

## Reporting Issues

### Issue Template

```markdown
**Mode:** KIOSK_SINGLE / WHITELIST / BLACKLIST
**Android Version:** [e.g., Android 12]
**Device:** [e.g., Samsung Galaxy S21]
**Device Owner Status:** YES / NO

**Issue Description:**
[What went wrong?]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Error occurs]

**Expected Behavior:**
[What should have happened]

**Actual Behavior:**
[What actually happened]

**Logs:**
```
[Paste relevant logs from adb logcat]
```

**Screenshots:**
[If applicable]
```

---

## Test Completion

**Tester Name:** ________________
**Test Date:** ________________
**Device Used:** ________________
**Android Version:** ________________

**Overall Assessment:**
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major fixes
- [ ] Blocked (cannot test)

**Comments:**
```
_____________________________________________________
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

---

*For questions during testing, check logs with `adb logcat` or review THREE_MODE_IMPLEMENTATION.md*
