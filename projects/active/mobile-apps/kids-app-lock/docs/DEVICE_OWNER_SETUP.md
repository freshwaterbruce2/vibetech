# Device Owner Setup Guide

This guide explains how to set up Kid's App Lock as a Device Owner on Android devices.

## What is Device Owner Mode?

Device Owner mode is a special Android management mode that gives apps extended privileges, including:
- Full lock task mode control (cannot be bypassed)
- Ability to set kiosk restrictions
- System-level permissions
- Protection against uninstallation

**Without Device Owner:** The app uses basic app pinning, which can be bypassed by holding Back + Recents.

**With Device Owner:** Full kiosk mode with no bypass methods available.

## Prerequisites

1. **Factory-reset Android device** OR **brand new device**
2. **NO Google account added** (critical requirement)
3. **USB debugging enabled**
4. **ADB installed** on your computer
5. **Kid's App Lock APK installed** on the device

## Step-by-Step Setup

### Step 1: Prepare the Device

If device has been used before:
1. Go to Settings → System → Reset options
2. Select "Erase all data (factory reset)"
3. Confirm and wait for device to reset
4. **DO NOT add a Google account during setup**
5. Complete the setup wizard (skip account step)

### Step 2: Enable USB Debugging

1. Go to Settings → About phone
2. Tap "Build number" 7 times
3. Go back to Settings → System → Developer options
4. Enable "USB debugging"
5. Connect device to computer via USB
6. Accept the "Allow USB debugging?" prompt on device

### Step 3: Install Kid's App Lock

```bash
# Option 1: Build and install
cd android
./gradlew installDebug

# Option 2: Install pre-built APK
adb install app-debug.apk
```

### Step 4: Set Device Owner

```bash
# Run this command on your computer
adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver

# Expected output:
# Success: Device owner set to package com.kidesafe.applock

# Verify:
adb shell dpm list-owners

# Expected output:
# Device Owner: com.kidesafe.applock
```

### Step 5: Launch and Configure App

1. Open Kid's App Lock on the device
2. Complete the onboarding flow
3. Set your 4-digit PIN
4. Set security question
5. Grant Device Administrator permission (should auto-confirm)
6. Grant Usage Stats permission
7. Select an app to lock to
8. Tap "Start Lock Mode"

## Troubleshooting

### Error: "Not allowed to set the device owner"

**Cause:** A Google account has been added to the device.

**Solution:**
- Factory reset the device
- During initial setup, skip the Google account step
- Try again

### Error: "java.lang.IllegalStateException: Trying to set the device owner, but device owner is already set"

**Cause:** Device already has a Device Owner app.

**Solution:**
```bash
# List current device owners
adb shell dpm list-owners

# Remove existing device owner
adb shell dpm remove-active-admin <package>/.AdminReceiver

# Try setting Device Owner again
```

### Error: "adb: command not found"

**Cause:** ADB is not installed or not in PATH.

**Solution:**
- Install Android SDK Platform Tools from https://developer.android.com/studio/releases/platform-tools
- Add to PATH or use full path to adb executable

### Device Owner set, but kiosk mode doesn't work

**Cause:** App may need to be restarted after Device Owner setup.

**Solution:**
```bash
# Force stop and restart
adb shell am force-stop com.kidesafe.applock
adb shell am start -n com.kidesafe.applock/.MainActivity
```

## Testing Device Owner Status

### Check Device Owner

```bash
adb shell dpm list-owners
```

### Check Lock Task Packages

```bash
adb shell dumpsys device_policy | grep "lockTaskPackages"
```

### Remove Device Owner (for testing)

```bash
# WARNING: This removes Device Owner privileges
adb shell dpm remove-active-admin com.kidesafe.applock/.admin.KioskDeviceAdminReceiver
```

## Production Deployment

For deploying to multiple devices:

### Option 1: Manual Setup (Small Scale)

Follow the setup steps above for each device.

### Option 2: Zero-Touch Enrollment (Large Scale)

1. Enroll in Android Zero-Touch Enrollment
2. Configure Kid's App Lock as default Device Owner
3. Devices automatically configure on first boot

### Option 3: NFC Provisioning

1. Prepare a provisioning device with NFC
2. Create NFC bump provisioning profile
3. Bump devices together during initial setup

## Security Considerations

**After Device Owner is set:**
- The app cannot be uninstalled without the admin PIN
- Factory reset protection is enabled
- The device cannot be used for other purposes without removing Device Owner

**To remove app after Device Owner:**
1. Launch Kid's App Lock
2. Enter admin PIN
3. Exit kiosk mode
4. Go to Settings → Apps → Kid's App Lock
5. You'll be prompted to remove device admin
6. Then uninstall normally

## References

- [Android Device Owner Documentation](https://developer.android.com/work/dpc/dedicated-devices)
- [Lock Task Mode Guide](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode)
- [Device Policy Manager API](https://developer.android.com/reference/android/app/admin/DevicePolicyManager)

---

**Last Updated:** 2025-10-12
**Version:** 1.0.0
