package com.kidesafe.applock.security

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.runBlocking
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * SecurityManager for Kid's App Lock
 *
 * Handles secure storage and verification of:
 * - 4-digit administrator PIN
 * - Security question and answer
 * - Failed attempt tracking
 *
 * Security features:
 * - PBKDF2 with HMAC-SHA256 for PIN hashing (10,000 iterations)
 * - Salt generation for each PIN
 * - Tink + DataStore for encrypted storage (2025 best practice)
 * - Legacy EncryptedSharedPreferences support for migration
 * - Lockout after 5 failed attempts (30 seconds)
 *
 * Migration Status: Migrated to SecureDataStore on 2025-10-12
 * Reason: EncryptedSharedPreferences is deprecated
 */
class SecurityManager(private val context: Context) {

    companion object {
        private const val TAG = "SecurityManager"
        private const val LEGACY_PREFS_NAME = "kiosk_secure_prefs"

        // Legacy keys for migration
        private const val LEGACY_KEY_PIN_HASH = "pin_hash"
        private const val LEGACY_KEY_PIN_SALT = "pin_salt"
        private const val LEGACY_KEY_SECURITY_QUESTION = "security_question"
        private const val LEGACY_KEY_SECURITY_ANSWER_HASH = "security_answer_hash"
        private const val LEGACY_KEY_SECURITY_ANSWER_SALT = "security_answer_salt"
        private const val LEGACY_KEY_FAILED_ATTEMPTS = "failed_attempts"
        private const val LEGACY_KEY_LOCKOUT_UNTIL = "lockout_until"
        private const val LEGACY_KEY_PIN_SET = "pin_set"

        // Migration flag
        private const val KEY_MIGRATION_COMPLETED = "migration_from_esp_completed"

        private const val MAX_ATTEMPTS = 5
        private const val LOCKOUT_DURATION_MS = 30_000L // 30 seconds

        // PBKDF2 parameters (unchanged - still recommended)
        private const val ITERATIONS = 10_000
        private const val KEY_LENGTH = 256
    }

    // Modern storage (DataStore + Tink)
    private val secureDataStore = SecureDataStore(context)

    // Legacy storage (for migration only)
    private val legacyPrefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                LEGACY_PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create legacy encrypted preferences", e)
            // Fallback to regular SharedPreferences
            context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    init {
        // Migrate data from legacy storage on first access
        runBlocking {
            migrateFromLegacyStorage()
        }
    }

    /**
     * Migrate data from EncryptedSharedPreferences to DataStore + Tink
     * This runs once on first access after update
     */
    private suspend fun migrateFromLegacyStorage() {
        try {
            // Check if migration already completed
            val migrationCompleted = secureDataStore.getBoolean(
                androidx.datastore.preferences.core.booleanPreferencesKey(KEY_MIGRATION_COMPLETED),
                false
            )

            if (migrationCompleted) {
                Log.d(TAG, "Migration already completed, skipping")
                return
            }

            Log.i(TAG, "Starting migration from EncryptedSharedPreferences to DataStore")

            // Migrate all values if they exist in legacy storage
            legacyPrefs.getString(LEGACY_KEY_PIN_HASH, null)?.let {
                secureDataStore.savePinHash(it)
                Log.d(TAG, "Migrated PIN hash")
            }

            legacyPrefs.getString(LEGACY_KEY_PIN_SALT, null)?.let {
                secureDataStore.savePinSalt(it)
                Log.d(TAG, "Migrated PIN salt")
            }

            legacyPrefs.getString(LEGACY_KEY_SECURITY_QUESTION, null)?.let {
                secureDataStore.saveSecurityQuestion(it)
                Log.d(TAG, "Migrated security question")
            }

            legacyPrefs.getString(LEGACY_KEY_SECURITY_ANSWER_HASH, null)?.let {
                secureDataStore.saveSecurityAnswerHash(it)
                Log.d(TAG, "Migrated security answer hash")
            }

            legacyPrefs.getString(LEGACY_KEY_SECURITY_ANSWER_SALT, null)?.let {
                secureDataStore.saveSecurityAnswerSalt(it)
                Log.d(TAG, "Migrated security answer salt")
            }

            val failedAttempts = legacyPrefs.getInt(LEGACY_KEY_FAILED_ATTEMPTS, 0)
            if (failedAttempts > 0) {
                secureDataStore.saveFailedAttempts(failedAttempts)
                Log.d(TAG, "Migrated failed attempts: $failedAttempts")
            }

            val lockoutUntil = legacyPrefs.getLong(LEGACY_KEY_LOCKOUT_UNTIL, 0L)
            if (lockoutUntil > 0) {
                secureDataStore.saveLockoutUntil(lockoutUntil)
                Log.d(TAG, "Migrated lockout timestamp")
            }

            val pinSet = legacyPrefs.getBoolean(LEGACY_KEY_PIN_SET, false)
            secureDataStore.savePinSet(pinSet)
            Log.d(TAG, "Migrated PIN set status: $pinSet")

            // Mark migration as completed
            secureDataStore.saveBoolean(
                androidx.datastore.preferences.core.booleanPreferencesKey(KEY_MIGRATION_COMPLETED),
                true
            )

            Log.i(TAG, "Migration completed successfully")

            // Optional: Clear legacy storage after successful migration
            // Uncomment after verifying migration works in production
            // legacyPrefs.edit().clear().apply()

        } catch (e: Exception) {
            Log.e(TAG, "Migration failed, will retry on next launch", e)
        }
    }

    /**
     * Check if PIN has been set up
     */
    fun isPinSet(): Boolean {
        return runBlocking {
            secureDataStore.isPinSet()
        }
    }

    /**
     * Set the administrator PIN
     * @param pin 4-digit PIN
     * @return true if successful
     */
    fun setPin(pin: String): Boolean {
        if (pin.length != 4 || !pin.all { it.isDigit() }) {
            Log.w(TAG, "Invalid PIN format")
            return false
        }

        return try {
            val salt = generateSalt()
            val hash = hashWithPBKDF2(pin, salt)

            runBlocking {
                secureDataStore.savePinHash(hash)
                secureDataStore.savePinSalt(salt)
                secureDataStore.savePinSet(true)
            }

            Log.i(TAG, "PIN set successfully")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set PIN", e)
            false
        }
    }

    /**
     * Verify the entered PIN
     * @param pin 4-digit PIN to verify
     * @return true if PIN is correct
     */
    fun verifyPin(pin: String): Boolean {
        // Check lockout status
        if (isLockedOut()) {
            Log.w(TAG, "Account is locked out")
            return false
        }

        val storedHash = runBlocking { secureDataStore.getPinHash() }
        val storedSalt = runBlocking { secureDataStore.getPinSalt() }

        if (storedHash == null || storedSalt == null) {
            Log.w(TAG, "PIN not set")
            return false
        }

        return try {
            val enteredHash = hashWithPBKDF2(pin, storedSalt)
            val isCorrect = MessageDigest.isEqual(
                storedHash.toByteArray(),
                enteredHash.toByteArray()
            )

            if (isCorrect) {
                // Reset failed attempts on successful verification
                resetFailedAttempts()
                Log.i(TAG, "PIN verified successfully")
            } else {
                // Increment failed attempts
                incrementFailedAttempts()
                Log.w(TAG, "Incorrect PIN, attempts: ${getFailedAttempts()}")
            }

            isCorrect
        } catch (e: Exception) {
            Log.e(TAG, "Failed to verify PIN", e)
            false
        }
    }

    /**
     * Set security question and answer
     */
    fun setSecurityQuestion(question: String, answer: String): Boolean {
        if (question.isBlank() || answer.isBlank()) {
            Log.w(TAG, "Invalid security question or answer")
            return false
        }

        return try {
            val salt = generateSalt()
            val hash = hashWithPBKDF2(answer.lowercase().trim(), salt)

            runBlocking {
                secureDataStore.saveSecurityQuestion(question)
                secureDataStore.saveSecurityAnswerHash(hash)
                secureDataStore.saveSecurityAnswerSalt(salt)
            }

            Log.i(TAG, "Security question set successfully")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set security question", e)
            false
        }
    }

    /**
     * Get the security question
     */
    fun getSecurityQuestion(): String? {
        return runBlocking {
            secureDataStore.getSecurityQuestion()
        }
    }

    /**
     * Verify security answer
     */
    fun verifySecurityAnswer(answer: String): Boolean {
        val storedHash = runBlocking { secureDataStore.getSecurityAnswerHash() }
        val storedSalt = runBlocking { secureDataStore.getSecurityAnswerSalt() }

        if (storedHash == null || storedSalt == null) {
            return false
        }

        return try {
            val enteredHash = hashWithPBKDF2(answer.lowercase().trim(), storedSalt)
            MessageDigest.isEqual(
                storedHash.toByteArray(),
                enteredHash.toByteArray()
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to verify security answer", e)
            false
        }
    }

    /**
     * Get number of failed PIN attempts
     */
    fun getFailedAttempts(): Int {
        return runBlocking {
            secureDataStore.getFailedAttempts()
        }
    }

    /**
     * Get remaining attempts before lockout
     */
    fun getRemainingAttempts(): Int {
        return (MAX_ATTEMPTS - getFailedAttempts()).coerceAtLeast(0)
    }

    /**
     * Check if account is locked out
     */
    fun isLockedOut(): Boolean {
        val lockoutUntil = runBlocking {
            secureDataStore.getLockoutUntil()
        }
        return System.currentTimeMillis() < lockoutUntil
    }

    /**
     * Get remaining lockout time in seconds
     */
    fun getLockoutTimeRemaining(): Int {
        val lockoutUntil = runBlocking {
            secureDataStore.getLockoutUntil()
        }
        val remaining = (lockoutUntil - System.currentTimeMillis()) / 1000
        return remaining.coerceAtLeast(0).toInt()
    }

    /**
     * Reset PIN and security settings (for recovery)
     */
    fun resetAllSecurity() {
        runBlocking {
            secureDataStore.clearAll()
        }
        Log.i(TAG, "All security settings reset")
    }

    // Private helper methods

    private fun incrementFailedAttempts() {
        val attempts = getFailedAttempts() + 1
        runBlocking {
            secureDataStore.saveFailedAttempts(attempts)
        }

        if (attempts >= MAX_ATTEMPTS) {
            // Set lockout
            val lockoutUntil = System.currentTimeMillis() + LOCKOUT_DURATION_MS
            runBlocking {
                secureDataStore.saveLockoutUntil(lockoutUntil)
            }
            Log.w(TAG, "Account locked out for $LOCKOUT_DURATION_MS ms")
        }
    }

    private fun resetFailedAttempts() {
        runBlocking {
            secureDataStore.saveFailedAttempts(0)
            secureDataStore.saveLockoutUntil(0L)
        }
    }

    private fun generateSalt(): String {
        val random = SecureRandom()
        val salt = ByteArray(16)
        random.nextBytes(salt)
        return salt.joinToString("") { "%02x".format(it) }
    }

    /**
     * Hash input using PBKDF2 with HMAC-SHA256
     * PBKDF2 is still the recommended standard for password/PIN hashing (2025)
     */
    private fun hashWithPBKDF2(input: String, saltHex: String): String {
        val salt = saltHex.chunked(2)
            .map { it.toInt(16).toByte() }
            .toByteArray()

        val spec = PBEKeySpec(input.toCharArray(), salt, ITERATIONS, KEY_LENGTH)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val hash = factory.generateSecret(spec).encoded

        return hash.joinToString("") { "%02x".format(it) }
    }
}
