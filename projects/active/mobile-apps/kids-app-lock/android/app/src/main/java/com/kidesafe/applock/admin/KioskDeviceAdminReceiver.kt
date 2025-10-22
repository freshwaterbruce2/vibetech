package com.kidesafe.applock.admin

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

/**
 * Device Admin Receiver for Kid's App Lock
 *
 * This receiver handles device administrator events, required for kiosk mode functionality.
 * It manages device owner status and lock task mode capabilities.
 *
 * Setup:
 * To enable Device Owner mode (required for full kiosk functionality), run:
 * adb shell dpm set-device-owner com.kidesafe.applock/.admin.KioskDeviceAdminReceiver
 *
 * Note: This must be done before adding any user accounts to the device.
 */
class KioskDeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "KioskDeviceAdmin"
    }

    /**
     * Called when the device administrator is enabled.
     */
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device Administrator enabled")
        Toast.makeText(
            context,
            "Kid's App Lock: Device Administrator enabled",
            Toast.LENGTH_SHORT
        ).show()
    }

    /**
     * Called when the device administrator is disabled.
     */
    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Device Administrator disabled")
        Toast.makeText(
            context,
            "Kid's App Lock: Device Administrator disabled",
            Toast.LENGTH_SHORT
        ).show()
    }

    /**
     * Called when password requirements have been changed.
     */
    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        Log.i(TAG, "Password changed")
    }

    /**
     * Called when lock task mode is entering.
     */
    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.i(TAG, "Lock task mode entering for package: $pkg")
    }

    /**
     * Called when lock task mode is exiting.
     */
    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.i(TAG, "Lock task mode exiting")
    }
}
