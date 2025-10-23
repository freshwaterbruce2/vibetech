package com.kidesafe.applock.security

import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.crypto.tink.Aead
import com.google.crypto.tink.KeyTemplates
import com.google.crypto.tink.aead.AeadConfig
import com.google.crypto.tink.integration.android.AndroidKeysetManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.nio.charset.StandardCharsets

/**
 * SecureDataStore for Kid's App Lock
 *
 * Modern replacement for deprecated EncryptedSharedPreferences using:
 * - DataStore for reactive, type-safe storage
 * - Tink for Google-recommended encryption
 * - Android Keystore for key protection
 *
 * Migrated from EncryptedSharedPreferences on 2025-10-12
 * Reason: androidx.security:security-crypto is deprecated
 *
 * @see SecurityManager for PBKDF2 PIN hashing (still recommended)
 */
class SecureDataStore(private val context: Context) {

    companion object {
        private const val TAG = "SecureDataStore"
        private const val DATASTORE_NAME = "kiosk_secure_datastore"
        private const val KEYSET_NAME = "kiosk_master_keyset"
        private const val KEYSET_PREF_NAME = "kiosk_master_keyset_prefs"

        // DataStore keys
        private val KEY_PIN_HASH = stringPreferencesKey("pin_hash")
        private val KEY_PIN_SALT = stringPreferencesKey("pin_salt")
        private val KEY_SECURITY_QUESTION = stringPreferencesKey("security_question")
        private val KEY_SECURITY_ANSWER_HASH = stringPreferencesKey("security_answer_hash")
        private val KEY_SECURITY_ANSWER_SALT = stringPreferencesKey("security_answer_salt")
        private val KEY_FAILED_ATTEMPTS = intPreferencesKey("failed_attempts")
        private val KEY_LOCKOUT_UNTIL = longPreferencesKey("lockout_until")
        private val KEY_PIN_SET = booleanPreferencesKey("pin_set")
    }

    // DataStore instance (singleton per context)
    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
        name = DATASTORE_NAME
    )

    // Tink AEAD (Authenticated Encryption with Associated Data)
    private val aead: Aead by lazy {
        try {
            // Initialize Tink
            AeadConfig.register()

            // Create or load keyset using Android Keystore
            val keysetHandle = AndroidKeysetManager.Builder()
                .withSharedPref(context, KEYSET_NAME, KEYSET_PREF_NAME)
                .withKeyTemplate(KeyTemplates.get("AES256_GCM"))
                .withMasterKeyUri("android-keystore://kiosk_master_key")
                .build()
                .keysetHandle

            keysetHandle.getPrimitive(Aead::class.java)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Tink AEAD", e)
            throw IllegalStateException("Cannot initialize encryption", e)
        }
    }

    /**
     * Encrypt a string value using Tink
     */
    private fun encrypt(plaintext: String): String {
        return try {
            val ciphertext = aead.encrypt(
                plaintext.toByteArray(StandardCharsets.UTF_8),
                null // No associated data
            )
            android.util.Base64.encodeToString(ciphertext, android.util.Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, "Encryption failed", e)
            throw e
        }
    }

    /**
     * Decrypt a string value using Tink
     */
    private fun decrypt(ciphertext: String): String {
        return try {
            val encryptedBytes = android.util.Base64.decode(ciphertext, android.util.Base64.NO_WRAP)
            val plaintext = aead.decrypt(encryptedBytes, null)
            String(plaintext, StandardCharsets.UTF_8)
        } catch (e: Exception) {
            Log.e(TAG, "Decryption failed", e)
            throw e
        }
    }

    /**
     * Save encrypted string value
     */
    suspend fun saveEncryptedString(key: Preferences.Key<String>, value: String) {
        try {
            val encrypted = encrypt(value)
            context.dataStore.edit { prefs ->
                prefs[key] = encrypted
            }
            Log.d(TAG, "Saved encrypted value for key: ${key.name}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save encrypted string", e)
            throw e
        }
    }

    /**
     * Read encrypted string value
     */
    suspend fun getEncryptedString(key: Preferences.Key<String>): String? {
        return try {
            val prefs = context.dataStore.data.first()
            val encrypted = prefs[key]
            encrypted?.let { decrypt(it) }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read encrypted string", e)
            null
        }
    }

    /**
     * Get encrypted string as Flow (reactive)
     */
    fun getEncryptedStringFlow(key: Preferences.Key<String>): Flow<String?> {
        return context.dataStore.data.map { prefs ->
            val encrypted = prefs[key]
            encrypted?.let {
                try {
                    decrypt(it)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to decrypt flow value", e)
                    null
                }
            }
        }
    }

    /**
     * Save integer value (not encrypted, for counters)
     */
    suspend fun saveInt(key: Preferences.Key<Int>, value: Int) {
        context.dataStore.edit { prefs ->
            prefs[key] = value
        }
    }

    /**
     * Get integer value
     */
    suspend fun getInt(key: Preferences.Key<Int>, defaultValue: Int = 0): Int {
        val prefs = context.dataStore.data.first()
        return prefs[key] ?: defaultValue
    }

    /**
     * Save long value (for timestamps)
     */
    suspend fun saveLong(key: Preferences.Key<Long>, value: Long) {
        context.dataStore.edit { prefs ->
            prefs[key] = value
        }
    }

    /**
     * Get long value
     */
    suspend fun getLong(key: Preferences.Key<Long>, defaultValue: Long = 0L): Long {
        val prefs = context.dataStore.data.first()
        return prefs[key] ?: defaultValue
    }

    /**
     * Save boolean value
     */
    suspend fun saveBoolean(key: Preferences.Key<Boolean>, value: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[key] = value
        }
    }

    /**
     * Get boolean value
     */
    suspend fun getBoolean(key: Preferences.Key<Boolean>, defaultValue: Boolean = false): Boolean {
        val prefs = context.dataStore.data.first()
        return prefs[key] ?: defaultValue
    }

    /**
     * Clear all data (for factory reset or testing)
     */
    suspend fun clearAll() {
        try {
            context.dataStore.edit { prefs ->
                prefs.clear()
            }
            Log.i(TAG, "All data cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear data", e)
            throw e
        }
    }

    // Convenience methods for SecurityManager migration

    suspend fun savePinHash(hash: String) = saveEncryptedString(KEY_PIN_HASH, hash)
    suspend fun getPinHash(): String? = getEncryptedString(KEY_PIN_HASH)

    suspend fun savePinSalt(salt: String) = saveEncryptedString(KEY_PIN_SALT, salt)
    suspend fun getPinSalt(): String? = getEncryptedString(KEY_PIN_SALT)

    suspend fun saveSecurityQuestion(question: String) = saveEncryptedString(KEY_SECURITY_QUESTION, question)
    suspend fun getSecurityQuestion(): String? = getEncryptedString(KEY_SECURITY_QUESTION)

    suspend fun saveSecurityAnswerHash(hash: String) = saveEncryptedString(KEY_SECURITY_ANSWER_HASH, hash)
    suspend fun getSecurityAnswerHash(): String? = getEncryptedString(KEY_SECURITY_ANSWER_HASH)

    suspend fun saveSecurityAnswerSalt(salt: String) = saveEncryptedString(KEY_SECURITY_ANSWER_SALT, salt)
    suspend fun getSecurityAnswerSalt(): String? = getEncryptedString(KEY_SECURITY_ANSWER_SALT)

    suspend fun saveFailedAttempts(attempts: Int) = saveInt(KEY_FAILED_ATTEMPTS, attempts)
    suspend fun getFailedAttempts(): Int = getInt(KEY_FAILED_ATTEMPTS, 0)

    suspend fun saveLockoutUntil(timestamp: Long) = saveLong(KEY_LOCKOUT_UNTIL, timestamp)
    suspend fun getLockoutUntil(): Long = getLong(KEY_LOCKOUT_UNTIL, 0L)

    suspend fun savePinSet(isSet: Boolean) = saveBoolean(KEY_PIN_SET, isSet)
    suspend fun isPinSet(): Boolean = getBoolean(KEY_PIN_SET, false)
}
