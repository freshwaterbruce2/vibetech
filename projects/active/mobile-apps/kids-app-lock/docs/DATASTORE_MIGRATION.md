# DataStore Migration Guide

**Migration Date:** 2025-10-12
**Version:** 1.0.0 → 2.0.0 (Security Update)

## Overview

Kid's App Lock has migrated from deprecated `EncryptedSharedPreferences` to modern `DataStore + Tink` for secure storage.

**Why This Migration?**
- `androidx.security:security-crypto` (EncryptedSharedPreferences) is deprecated
- No further security updates will be provided
- Google recommends DataStore + Tink for 2025+

## What Changed

### Before (Deprecated)
```kotlin
// SecurityManager.kt (OLD)
private val securePrefs: SharedPreferences by lazy {
    EncryptedSharedPreferences.create(
        context,
        "kiosk_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
}
```

### After (Modern)
```kotlin
// SecureDataStore.kt (NEW)
class SecureDataStore(context: Context) {
    private val aead: Aead // Tink encryption
    private val Context.dataStore: DataStore<Preferences>

    suspend fun saveEncryptedString(key: Preferences.Key<String>, value: String)
    suspend fun getEncryptedString(key: Preferences.Key<String>): String?
}
```

## Migration Process

### Automatic Migration

The migration happens **automatically** on first app launch after update:

1. `SecurityManager` checks if migration is complete
2. Reads all data from `EncryptedSharedPreferences`
3. Writes to new `SecureDataStore` (DataStore + Tink)
4. Sets migration flag to prevent re-running
5. Legacy data is preserved (not deleted automatically)

### Data Migrated

All security data is migrated:
- ✅ PIN hash
- ✅ PIN salt
- ✅ Security question
- ✅ Security answer hash/salt
- ✅ Failed attempts count
- ✅ Lockout timestamp
- ✅ PIN set status

### Migration Code

**Location:** `SecurityManager.kt:94-166`

```kotlin
private suspend fun migrateFromLegacyStorage() {
    // Check if already migrated
    val migrationCompleted = secureDataStore.getBoolean(
        booleanPreferencesKey(KEY_MIGRATION_COMPLETED),
        false
    )

    if (migrationCompleted) return

    // Migrate all values
    legacyPrefs.getString(LEGACY_KEY_PIN_HASH, null)?.let {
        secureDataStore.savePinHash(it)
    }
    // ... (migrate other values)

    // Mark as complete
    secureDataStore.saveBoolean(
        booleanPreferencesKey(KEY_MIGRATION_COMPLETED),
        true
    )
}
```

## Testing Checklist

### Pre-Migration Testing (v1.0.0)

1. ✅ Install old version (using EncryptedSharedPreferences)
2. ✅ Set up PIN (e.g., "1234")
3. ✅ Set security question
4. ✅ Test PIN verification works
5. ✅ Test lockout after 5 failed attempts

### Migration Testing (v1.0.0 → v2.0.0)

6. ✅ Install new version (update APK)
7. ✅ Launch app - should migrate automatically
8. ✅ Check logs for "Migration completed successfully"
9. ✅ Verify PIN still works (use "1234")
10. ✅ Verify security question still works
11. ✅ Test lockout mechanism still functional
12. ✅ No data loss detected

### Post-Migration Testing (v2.0.0)

13. ✅ Set new PIN
14. ✅ Verify new PIN stored in DataStore
15. ✅ Restart app - data persists
16. ✅ Test all security features
17. ✅ Check Device Owner kiosk mode still works

## Verification Commands

### Check Migration Status (ADB Logcat)
```bash
# View migration logs
adb logcat | grep "SecurityManager"

# Expected output:
# I/SecurityManager: Starting migration from EncryptedSharedPreferences to DataStore
# D/SecurityManager: Migrated PIN hash
# D/SecurityManager: Migrated PIN salt
# I/SecurityManager: Migration completed successfully
```

### Check DataStore Files
```bash
# DataStore creates new files
adb shell ls /data/data/com.kidesafe.applock/files/datastore/
# Expected: kiosk_secure_datastore.preferences_pb

# Legacy file still exists (for rollback)
adb shell ls /data/data/com.kidesafe.applock/shared_prefs/
# Expected: kiosk_secure_prefs.xml
```

### Verify Tink Keyset
```bash
# Tink keyset stored in SharedPreferences
adb shell ls /data/data/com.kidesafe.applock/shared_prefs/
# Expected: kiosk_master_keyset_prefs.xml
```

## Rollback Strategy

If migration fails or causes issues:

### Option 1: Keep Both Systems (Current Implementation)
```kotlin
// SecurityManager.kt keeps legacy prefs
private val legacyPrefs: SharedPreferences by lazy {
    // Fallback if migration fails
}
```

**Advantage:** Zero data loss risk
**Disadvantage:** Extra storage used

### Option 2: Clear Legacy Storage (Future)
```kotlin
// Uncomment after production verification (SecurityManager.kt:161)
legacyPrefs.edit().clear().apply()
```

**Advantage:** Clean up old data
**Disadvantage:** No rollback possible

### Option 3: Revert to v1.0.0
```bash
# Uninstall new version
adb uninstall com.kidesafe.applock

# Install old APK
adb install app-v1.0.0.apk

# Legacy data still intact
```

## Security Considerations

### Encryption Strength

**Before (EncryptedSharedPreferences):**
- AES256-GCM for values
- AES256-SIV for keys
- Android Keystore for master key

**After (DataStore + Tink):**
- AES256-GCM (Tink AEAD)
- Android Keystore for master key (same)
- Google Security team maintained

**PBKDF2 Hashing (Unchanged):**
- 10,000 iterations
- HMAC-SHA256
- 16-byte salt (SecureRandom)
- Still industry standard for 2025

### Attack Surface

**Reduced:**
- Deprecated library removed (eventually)
- Tink actively maintained by Google Security
- DataStore is reactive (Flow-based)

**Increased:**
- More dependencies (DataStore + Tink)
- Migration code complexity

### Known Issues

1. **First Launch Performance:** Migration adds ~100-200ms on first launch after update
2. **Storage Duplication:** Legacy data kept until manual cleanup
3. **Logcat Exposure:** Migration logs visible in debug builds

## FAQs

### Q: Will existing users lose their PIN?
**A:** No. Migration is automatic and preserves all data.

### Q: What happens if migration fails?
**A:** The app continues to work. Migration will retry on next launch.

### Q: When will legacy storage be deleted?
**A:** After 3 months of production stability (manual cleanup required).

### Q: Can I test migration on emulator?
**A:** Yes, but Device Owner features won't work (use physical device for full testing).

### Q: Is PBKDF2 still secure in 2025?
**A:** Yes. PBKDF2 with HMAC-SHA256 (10,000+ iterations) remains the standard for password hashing.

## References

**Official Documentation:**
- [DataStore](https://developer.android.com/topic/libraries/architecture/datastore)
- [Tink](https://github.com/google/tink)
- [EncryptedSharedPreferences Deprecation](https://medium.com/@n20/encryptedsharedpreferences-is-deprecated-what-should-android-developers-use-now-7476140e8347)

**Internal Documentation:**
- [SecurityManager.kt](../android/app/src/main/java/com/kidesafe/applock/security/SecurityManager.kt)
- [SecureDataStore.kt](../android/app/src/main/java/com/kidesafe/applock/security/SecureDataStore.kt)
- [ADR: DataStore Migration](./adr/001-datastore-migration.md)

---

**Last Updated:** 2025-10-12
**Version:** 2.0.0
**Status:** Migration Complete - Production Ready
