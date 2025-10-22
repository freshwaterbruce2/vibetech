package com.kidesafe.applock.kiosk

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Boot Receiver for Kid's App Lock
 *
 * This receiver handles device boot events to maintain kiosk mode after device restart.
 *
 * If kiosk mode was active before shutdown/restart, this receiver can:
 * 1. Check if kiosk mode should be re-enabled
 * 2. Launch the locked app automatically
 * 3. Re-enter lock task mode
 *
 * Note: This requires RECEIVE_BOOT_COMPLETED permission.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
        private const val PREFS_NAME = "kiosk_prefs"
        private const val KEY_KIOSK_ACTIVE = "kiosk_active"
        private const val KEY_LOCKED_PACKAGE = "locked_package"
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON" -> {
                Log.i(TAG, "Boot completed, checking kiosk status")

                // Check if kiosk mode was active
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val wasKioskActive = prefs.getBoolean(KEY_KIOSK_ACTIVE, false)
                val lockedPackage = prefs.getString(KEY_LOCKED_PACKAGE, null)

                if (wasKioskActive && lockedPackage != null) {
                    Log.i(TAG, "Kiosk mode was active, attempting to restore for: $lockedPackage")

                    // Launch the locked app
                    try {
                        val launchIntent = context.packageManager
                            .getLaunchIntentForPackage(lockedPackage)

                        if (launchIntent != null) {
                            launchIntent.addFlags(
                                Intent.FLAG_ACTIVITY_NEW_TASK or
                                Intent.FLAG_ACTIVITY_CLEAR_TASK or
                                Intent.FLAG_ACTIVITY_NO_ANIMATION
                            )
                            context.startActivity(launchIntent)
                            Log.i(TAG, "Successfully launched locked app after boot")
                        } else {
                            Log.w(TAG, "Could not find launch intent for: $lockedPackage")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to launch locked app after boot", e)
                    }
                }
            }
        }
    }
}
