package com.kidesafe.applock.kiosk

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * AppListManager for Kid's App Lock
 *
 * Manages querying and filtering installed applications on the device.
 * Provides a list of user-installable apps suitable for kiosk mode.
 *
 * Filtering rules:
 * - Excludes system apps by default
 * - Only shows apps with launcher activities
 * - Excludes Kid's App Lock itself
 * - Sorts alphabetically by app name
 */
class AppListManager(private val context: Context) {

    companion object {
        private const val TAG = "AppListManager"

        // System apps and services to always exclude
        private val EXCLUDED_PACKAGES = setOf(
            "com.kidesafe.applock",  // This app
            "com.android.systemui",
            "com.android.settings",
            "com.google.android.packageinstaller",
            "com.android.vending",  // Play Store (optional)
        )
    }

    /**
     * Get list of all user-installed apps suitable for kiosk mode
     *
     * @param includeSystemApps Whether to include system apps (default: false)
     * @return List of AppInfo objects sorted alphabetically
     */
    suspend fun getInstalledApps(includeSystemApps: Boolean = false): List<AppInfo> = withContext(Dispatchers.IO) {
        val packageManager = context.packageManager
        val apps = mutableListOf<AppInfo>()

        try {
            // Get all installed packages
            val packages = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)

            for (packageInfo in packages) {
                val packageName = packageInfo.packageName

                // Skip excluded packages
                if (EXCLUDED_PACKAGES.contains(packageName)) {
                    continue
                }

                // Check if package has a launcher intent
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                if (launchIntent == null) {
                    continue
                }

                // Check if system app
                val isSystemApp = (packageInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                // Skip system apps unless explicitly included
                if (isSystemApp && !includeSystemApps) {
                    continue
                }

                // Get app info
                try {
                    val appName = packageInfo.loadLabel(packageManager).toString()
                    val appIcon = packageInfo.loadIcon(packageManager)

                    apps.add(
                        AppInfo(
                            packageName = packageName,
                            appName = appName,
                            icon = appIcon,
                            isSystemApp = isSystemApp
                        )
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to load app info for: $packageName", e)
                }
            }

            // Sort alphabetically by app name
            apps.sortBy { it.appName.lowercase() }

            Log.i(TAG, "Found ${apps.size} installed apps")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to get installed apps", e)
        }

        return@withContext apps
    }

    /**
     * Get app info for a specific package
     */
    fun getAppInfo(packageName: String): AppInfo? {
        val packageManager = context.packageManager

        return try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            val appName = appInfo.loadLabel(packageManager).toString()
            val appIcon = appInfo.loadIcon(packageManager)
            val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

            AppInfo(
                packageName = packageName,
                appName = appName,
                icon = appIcon,
                isSystemApp = isSystemApp
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get app info for: $packageName", e)
            null
        }
    }

    /**
     * Check if an app is installed
     */
    fun isAppInstalled(packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    /**
     * Check if Usage Stats permission is granted
     * Required to query installed apps on Android 10+
     */
    fun hasUsageStatsPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = appOps.checkOpNoThrow(
            android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.packageName
        )
        return mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    /**
     * Open Usage Stats settings
     */
    fun openUsageStatsSettings(context: Context) {
        val intent = Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
