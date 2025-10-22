# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kid's App Lock is a **native Android application** built with Kotlin and Jetpack Compose that enables parents to lock their Android device to a single application, creating a safe, focused environment for children.

**Author:** Bruce Freshwater
**Target Users:** Parents (administrators) and children ages 2-12
**Version:** 1.0.0 (Development)
**Tech Stack:** Native Kotlin, Jetpack Compose, Android SDK

## Essential Commands

### Build & Deploy

```bash
# Navigate to Android project (ALWAYS required)
cd android

# Build debug APK (most common)
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Build release APK
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk

# Install to connected device
./gradlew installDebug

# Build and install in one step
./gradlew installDebug

# Clean build (when gradle sync fails)
./gradlew clean assembleDebug

# Uninstall from device
adb uninstall com.kidesafe.applock
```

### Device Owner Setup (Critical for Full Functionality)

```bash
# PREREQUISITE: Factory reset device, skip Google account setup

# 1. Enable USB debugging
# Settings → About Phone → tap "Build number" 7 times
# Settings → System → Developer Options → USB debugging (enable)

# 2. Connect device and set Device Owner
adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver

# 3. Verify Device Owner status
adb shell dpm list-owners
# Expected: Device Owner: com.kidesafe.applock

# Remove Device Owner (testing only)
adb shell dpm remove-active-admin com.kidesafe.applock/.admin.KioskDeviceAdminReceiver
```

### Debugging

```bash
# View app logs (filtered)
adb logcat | grep -E "KidsAppLock|KioskManager|SecurityManager"

# View crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"

# Force stop app
adb shell am force-stop com.kidesafe.applock

# Restart app
adb shell am start -n com.kidesafe.applock/.MainActivity

# Check lock task packages (verify Device Owner)
adb shell dumpsys device_policy | grep "lockTaskPackages"

# List all installed apps
adb shell pm list packages | grep kidesafe
```

### Testing Commands

```bash
# Run unit tests (when added)
./gradlew test

# Run instrumented tests (when added)
./gradlew connectedAndroidTest

# Check for lint issues
./gradlew lint

# View dependencies
./gradlew app:dependencies
```

## Architecture

### Tech Stack

```
Native Android (Kotlin)
├── UI Framework: Jetpack Compose (declarative, React-like)
├── Device Management: DevicePolicyManager + Device Owner Mode
├── Security: Android Keystore + EncryptedSharedPreferences
├── Architecture: MVVM with StateFlow (Kotlin Coroutines)
└── Min SDK: API 28 (Android 9.0) | Target SDK: API 35 (Android 15)
```

**Build System:**
- Gradle 8.11.1
- Android Gradle Plugin 8.7.3
- Kotlin 2.1.0
- Jetpack Compose BOM 2025.01.00

### Core Components

**1. MainActivity.kt** (android/app/src/main/java/com/kidesafe/applock/MainActivity.kt:40)
- Entry point for the application
- Manages navigation between screens
- Handles permission request results
- Uses Jetpack Compose for UI

**2. MainViewModel.kt** (android/app/src/main/java/com/kidesafe/applock/ui/MainViewModel.kt:26)
- State management with StateFlow (similar to React useState)
- Business logic for onboarding, PIN setup, app selection
- Integrates SecurityManager, KioskManager, AppListManager

**3. KioskManager.kt** (android/app/src/main/java/com/kidesafe/applock/kiosk/KioskManager.kt:34)
- Manages lock task mode (kiosk functionality)
- Requires Device Owner or Device Admin privileges
- Handles system UI hiding and app launching
- Persists kiosk state in SharedPreferences

**4. SecurityManager.kt** (android/app/src/main/java/com/kidesafe/applock/security/SecurityManager.kt:27)
- PBKDF2 with HMAC-SHA256 for PIN hashing (10,000 iterations)
- EncryptedSharedPreferences with Android Keystore
- Failed attempt tracking (5 attempts = 30s lockout)
- Security question for PIN recovery

**5. AppListManager.kt** (android/app/src/main/java/com/kidesafe/applock/kiosk/AppListManager.kt)
- Queries installed apps via PackageManager
- Requires Usage Stats permission
- Filters system apps (optional)

### Key Design Patterns

**Jetpack Compose (React-like):**
```kotlin
@Composable
fun AppSelectionScreen(
    apps: List<AppInfo>,
    selectedApp: AppInfo?,
    onAppSelected: (AppInfo) -> Unit
) {
    LazyColumn {
        items(apps) { app ->
            AppCard(
                app = app,
                selected = app == selectedApp,
                onClick = { onAppSelected(app) }
            )
        }
    }
}
```

**StateFlow (like React useState):**
```kotlin
class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    fun selectApp(app: AppInfo) {
        _uiState.update { it.copy(selectedApp = app) }
    }
}
```

**Navigation:**
- Sealed class `Screen` defines all possible screens
- Navigation handled via `viewModel.navigateTo(Screen.X)`
- Screens: Onboarding → SetupPin → SetupSecurityQuestion → Permissions → AppSelection → KioskActive

## Device Owner Mode (Critical)

**Why Device Owner?**
- Without: App pinning can be bypassed (Back + Recents buttons)
- With: Full kiosk mode, no bypass possible

**Prerequisites:**
1. Factory-reset device OR brand new device
2. NO Google account added (critical)
3. USB debugging enabled
4. ADB installed on computer

**Limitations:**
- Only one Device Owner per device
- Cannot be set if Google account exists
- Requires ADB access for setup
- Cannot be done on emulator

**Testing Without Device Owner:**
- Device Administrator mode still works (limited)
- Use for UI/UX testing only
- Not suitable for production testing

## Security Implementation (2025 Update)

### Modern Secure Storage

**⚠️ IMPORTANT:** Kid's App Lock migrated to DataStore + Tink on 2025-10-12

**Why?** EncryptedSharedPreferences was deprecated by Google (no future security updates)

**Storage Stack (SecureDataStore.kt):**
```kotlin
// DataStore for reactive, type-safe storage
private val Context.dataStore: DataStore<Preferences>

// Tink for encryption (Google Security team maintained)
private val aead: Aead // AES256-GCM with Android Keystore

// Automatic migration from legacy EncryptedSharedPreferences
private suspend fun migrateFromLegacyStorage()
```

**PIN Hashing (SecurityManager.kt:392) - Unchanged:**
```kotlin
// PBKDF2 still recommended in 2025
private const val ITERATIONS = 10_000
private const val KEY_LENGTH = 256

private fun hashWithPBKDF2(pin: String, salt: String): String {
    val spec = PBEKeySpec(pin.toCharArray(), salt, ITERATIONS, KEY_LENGTH)
    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    val hash = factory.generateSecret(spec).encoded
    return hash.joinToString("") { "%02x".format(it) }
}
```

**Security Layers:**
1. **Encryption:** Tink AEAD (AES256-GCM)
2. **Key Storage:** Android Keystore
3. **PIN Hashing:** PBKDF2 with HMAC-SHA256 (10,000 iterations)
4. **Salt:** 16-byte SecureRandom

**Lockout Policy:**
- Max 5 failed PIN attempts
- 30-second lockout after 5 failures
- Persists across app restarts

**Data Protection:**
- DataStore + Tink encryption (AES256-GCM)
- Android Keystore-backed master key
- Cloud backup disabled (data_extraction_rules.xml)
- ProGuard obfuscation in release builds

## Common Issues & Solutions

### 1. "Failed to start kiosk mode"
**Cause:** Device Administrator not enabled
**Solution:** Run `adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver`

### 2. "No apps found" in app selection
**Cause:** Usage Stats permission not granted
**Solution:** Settings → Special app access → Usage access → Kid's App Lock → Allow

### 3. "Cannot set Device Owner"
**Cause:** Google account already added to device
**Solution:** Factory reset device, skip Google account setup during initial wizard

### 4. Build fails with "Gradle sync failed"
```bash
./gradlew clean
./gradlew build --refresh-dependencies
```

### 5. App crashes on launch
```bash
# Check crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"

# Clear app data
adb shell pm clear com.kidesafe.applock
```

### 6. System UI still visible in kiosk mode
**Cause:** Device Owner not set (using Device Admin only)
**Solution:** Follow Device Owner setup steps

### 7. Back button exits kiosk mode
**Cause:** Not in lock task mode, likely missing Device Owner
**Verify:** `adb shell dumpsys activity activities | grep lockTask`

## File Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/kidesafe/applock/
│   │   │   ├── MainActivity.kt                 # Entry point, navigation
│   │   │   ├── admin/
│   │   │   │   └── KioskDeviceAdminReceiver.kt # Device Admin receiver
│   │   │   ├── kiosk/
│   │   │   │   ├── KioskManager.kt             # Lock task mode manager
│   │   │   │   ├── AppListManager.kt           # Installed apps query
│   │   │   │   ├── AppInfo.kt                  # Data model
│   │   │   │   └── BootReceiver.kt             # Boot persistence
│   │   │   ├── security/
│   │   │   │   └── SecurityManager.kt          # PIN storage (PBKDF2)
│   │   │   └── ui/
│   │   │       ├── MainViewModel.kt            # State management
│   │   │       ├── screens/                    # Composable screens
│   │   │       └── theme/                      # Material 3 theme
│   │   ├── res/
│   │   │   ├── values/strings.xml              # All user-facing text
│   │   │   └── xml/device_admin_policy.xml     # Device Admin policies
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts                        # App-level build config
│   └── proguard-rules.pro                      # Release obfuscation
├── build.gradle.kts                            # Project-level build config
├── settings.gradle.kts                         # Gradle settings
└── gradle.properties                           # Build properties
```

## Testing Checklist

**Critical Path:**
1. First launch → Onboarding screen shows
2. Set 4-digit PIN → Validation accepts only 4 digits
3. Set security question → Answer saved
4. Grant Device Admin → Permission dialog appears
5. Grant Usage Stats → Permission granted
6. App list loads → Shows installed apps
7. Select app → Checkbox appears
8. Start kiosk mode → Selected app launches
9. Enter correct PIN → Exit kiosk (future: triple-tap gesture)
10. Forgot PIN → Security question recovery works

**Edge Cases:**
- Wrong PIN 5 times → 30-second lockout enforced
- Reboot device → Kiosk mode persists (BootReceiver)
- Uninstall attempt → Blocked by Device Admin
- Pull down status bar → Blocked (Device Owner only)
- Press Home/Back/Recents → Blocked (Device Owner only)

## Development Guidelines

1. **Always test on physical device** - Emulators don't support Device Owner mode
2. **Update strings.xml** - Never hardcode user-facing text in Kotlin files
3. **Follow Kotlin conventions** - Use Android Studio auto-formatting (Ctrl+Alt+L)
4. **Keep Compose declarative** - Avoid imperative UI logic, side effects in LaunchedEffect
5. **Use StateFlow** - Don't use mutable state directly in Composables
6. **Log appropriately** - Use `Log.i/w/e` with consistent TAG values

## Known Limitations (Phase 1)

**Not Implemented:**
- Triple-tap gesture to exit kiosk
- Time limits / session duration
- Multiple app selection
- Remote management
- Usage reports
- iOS version
- Multiple child profiles

**Android Version Compatibility:**
- Minimum: Android 9.0 (API 28)
- Target: Android 15 (API 35)
- Tested: Android 11+ recommended

## 2025 Best Practices (Applied)

### ✅ Modern State Collection
```kotlin
// MainActivity.kt:89 - Lifecycle-aware (stops collecting when backgrounded)
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

### ✅ Secure Storage Migration
- **Old:** EncryptedSharedPreferences (deprecated)
- **New:** DataStore + Tink (Google-recommended)
- **Migration:** Automatic on first launch after update
- See: [docs/DATASTORE_MIGRATION.md](docs/DATASTORE_MIGRATION.md)

### 🔄 Future Material 3 Components
```kotlin
// SetupPinScreen.kt:63 - Prepared for SecureTextField
// TODO: Migrate to SecureTextField when available in stable Material 3
// SecureTextField provides better security for password inputs (Material 3 1.4.0+)
```

### 📋 Performance Optimizations (Optional)

For future improvements:
```kotlin
// In ViewModels - Use remember for expensive calculations
val filteredApps = remember(installedApps) {
    installedApps.filter { !it.isSystemApp }
}

// Use derivedStateOf for rapidly changing state
val shouldShowError by remember {
    derivedStateOf { failedAttempts >= MAX_ATTEMPTS }
}

// In Composables - Add keys to LazyColumn items
LazyColumn {
    items(apps, key = { it.packageName }) { app ->
        AppCard(app)
    }
}
```

## Resources

**Official Documentation:**
- [Android Device Owner](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Device Policy Manager](https://developer.android.com/reference/android/app/admin/DevicePolicyManager)
- [DataStore](https://developer.android.com/topic/libraries/architecture/datastore)
- [Tink Encryption](https://github.com/google/tink)

**Internal Documentation:**
- [README.md](README.md) - Quick start guide
- [docs/DEVICE_OWNER_SETUP.md](docs/DEVICE_OWNER_SETUP.md) - Detailed Device Owner setup
- [docs/DATASTORE_MIGRATION.md](docs/DATASTORE_MIGRATION.md) - Security migration guide
- [docs/adr/001-datastore-migration.md](docs/adr/001-datastore-migration.md) - ADR for security migration

---

**Last Updated:** 2025-10-12
**Version:** 2.0.0-dev (Security Update)
**Status:** Phase 1-3 Complete - Modernization Applied
