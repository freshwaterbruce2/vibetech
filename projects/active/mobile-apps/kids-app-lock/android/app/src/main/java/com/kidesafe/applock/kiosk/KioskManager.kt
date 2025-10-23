package com.kidesafe.applock.kiosk

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import com.kidesafe.applock.admin.KioskDeviceAdminReceiver

/**
 * KioskManager for Kid's App Lock
 *
 * Manages kiosk mode (lock task mode) functionality including:
 * - Starting and stopping lock task mode
 * - Hiding system UI (status bar, navigation bar)
 * - Managing Device Owner/Admin status
 * - Launching and locking to specific apps
 * - Persisting kiosk state across reboots
 *
 * Requirements:
 * - Device Administrator or Device Owner privileges
 * - Package must be allowlisted via setLockTaskPackages()
 *
 * Setup for Device Owner (full kiosk functionality):
 * adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver
 */
class KioskManager(private val context: Context) {

    companion object {
        private const val TAG = "KioskManager"
        private const val PREFS_NAME = "kiosk_prefs"
        private const val KEY_KIOSK_ACTIVE = "kiosk_active"
        private const val KEY_LOCKED_PACKAGE = "locked_package"
        private const val KEY_LOCKED_APP_NAME = "locked_app_name"
        const val REQUEST_CODE_ENABLE_ADMIN = 1001
    }

    private val devicePolicyManager: DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    private val adminComponent = ComponentName(context, KioskDeviceAdminReceiver::class.java)

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /**
     * Check if this app is a Device Owner
     */
    fun isDeviceOwner(): Boolean {
        return devicePolicyManager.isDeviceOwnerApp(context.packageName)
    }

    /**
     * Check if Device Administrator is enabled
     */
    fun isDeviceAdmin(): Boolean {
        return devicePolicyManager.isAdminActive(adminComponent)
    }

    /**
     * Check if kiosk mode is currently active
     */
    fun isKioskModeActive(): Boolean {
        val activity = context as? Activity ?: return prefs.getBoolean(KEY_KIOSK_ACTIVE, false)

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
        } else {
            prefs.getBoolean(KEY_KIOSK_ACTIVE, false)
        }
    }

    /**
     * Get the currently locked package name
     */
    fun getLockedPackage(): String? {
        return prefs.getString(KEY_LOCKED_PACKAGE, null)
    }

    /**
     * Get the currently locked app name
     */
    fun getLockedAppName(): String? {
        return prefs.getString(KEY_LOCKED_APP_NAME, null)
    }

    /**
     * Start kiosk mode for a specific app
     *
     * @param packageName Package name of the app to lock to
     * @param appName Display name of the app
     * @return true if successful, false otherwise
     */
    fun startKioskMode(packageName: String, appName: String): Boolean {
        if (!isDeviceAdmin()) {
            Log.e(TAG, "Device Administrator not enabled")
            return false
        }

        try {
            // If Device Owner, set lock task packages
            if (isDeviceOwner()) {
                Log.i(TAG, "Setting lock task packages as Device Owner")
                devicePolicyManager.setLockTaskPackages(
                    adminComponent,
                    arrayOf(packageName, context.packageName)
                )
            }

            // Launch the target app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent == null) {
                Log.e(TAG, "Could not find launch intent for: $packageName")
                return false
            }

            // Configure intent flags
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TASK or
                Intent.FLAG_ACTIVITY_NO_ANIMATION
            )

            // Save kiosk state
            prefs.edit()
                .putBoolean(KEY_KIOSK_ACTIVE, true)
                .putString(KEY_LOCKED_PACKAGE, packageName)
                .putString(KEY_LOCKED_APP_NAME, appName)
                .apply()

            // Start the app
            context.startActivity(launchIntent)

            Log.i(TAG, "Kiosk mode started for: $packageName")
            return true

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start kiosk mode", e)
            return false
        }
    }

    /**
     * Enter lock task mode for the current activity
     * This should be called from the locked app's activity
     */
    fun enterLockTaskMode(activity: Activity) {
        try {
            // Hide system UI
            hideSystemUI(activity)

            // Start lock task mode
            activity.startLockTask()

            Log.i(TAG, "Entered lock task mode")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enter lock task mode", e)
        }
    }

    /**
     * Exit lock task mode
     */
    fun stopKioskMode(activity: Activity): Boolean {
        try {
            // Stop lock task mode
            activity.stopLockTask()

            // Clear kiosk state
            prefs.edit()
                .putBoolean(KEY_KIOSK_ACTIVE, false)
                .putString(KEY_LOCKED_PACKAGE, null)
                .putString(KEY_LOCKED_APP_NAME, null)
                .apply()

            // Clear lock task packages if Device Owner
            if (isDeviceOwner()) {
                devicePolicyManager.setLockTaskPackages(adminComponent, emptyArray())
            }

            Log.i(TAG, "Kiosk mode stopped")
            return true

        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop kiosk mode", e)
            return false
        }
    }

    /**
     * Request Device Administrator privileges
     */
    fun requestDeviceAdmin(activity: Activity) {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
        intent.putExtra(
            DevicePolicyManager.EXTRA_ADD_EXPLANATION,
            "Enable Device Administrator to lock your device into a single app for child safety."
        )
        activity.startActivityForResult(intent, REQUEST_CODE_ENABLE_ADMIN)
    }

    /**
     * Hide system UI (status bar and navigation bar)
     */
    fun hideSystemUI(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11 (API 30) and above
            val controller = activity.window.insetsController
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            // Android 9 and 10
            @Suppress("DEPRECATION")
            activity.window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        }

        // Keep screen on while in kiosk mode
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    /**
     * Show system UI (for exiting kiosk mode)
     */
    fun showSystemUI(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.window.insetsController?.show(
                WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars()
            )
        } else {
            @Suppress("DEPRECATION")
            activity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
        }

        // Allow screen to turn off
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    /**
     * Get device owner setup instructions
     */
    fun getDeviceOwnerSetupInstructions(): String {
        return """
            To enable full kiosk functionality, set this app as Device Owner:

            1. Ensure no user accounts are added to the device
            2. Enable USB debugging in Developer Options
            3. Connect device to computer via USB
            4. Run the following ADB command:

               adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver

            5. Restart this app

            Note: This can only be done on a factory-reset device with no Google account.
        """.trimIndent()
    }
}
