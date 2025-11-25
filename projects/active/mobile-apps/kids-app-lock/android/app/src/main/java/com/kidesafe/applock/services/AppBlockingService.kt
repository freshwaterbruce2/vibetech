package com.kidesafe.applock.services

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.kidesafe.applock.MainActivity
import com.kidesafe.applock.R

/**
 * AppBlockingService - Background service that monitors app launches
 * and blocks prohibited apps in BLACKLIST mode
 *
 * How it works:
 * 1. Runs as a foreground service (Android requirement for background monitoring)
 * 2. Polls UsageStatsManager every 500ms to detect current foreground app
 * 3. When a blocked app is detected, launches BlockingOverlayActivity
 * 4. User must exit the overlay to return home
 */
class AppBlockingService : Service() {

    companion object {
        private const val TAG = "AppBlockingService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "app_blocking_channel"
        private const val POLL_INTERVAL_MS = 500L // Check every 500ms

        private const val PREFS_NAME = "kiosk_prefs"
        private const val KEY_BLOCKED_PACKAGES = "blocked_packages"

        /**
         * Start the blocking service
         */
        fun start(context: Context) {
            val intent = Intent(context, AppBlockingService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stop the blocking service
         */
        fun stop(context: Context) {
            val intent = Intent(context, AppBlockingService::class.java)
            context.stopService(intent)
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var usageStatsManager: UsageStatsManager
    private val blockedPackages = mutableSetOf<String>()
    private var lastCheckedPackage: String? = null

    private val monitoringRunnable = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Service created")

        usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

        // Load blocked packages from SharedPreferences
        loadBlockedPackages()

        // Create notification channel for Android O+
        createNotificationChannel()

        // Start as foreground service (required for background monitoring)
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service started, monitoring ${blockedPackages.size} blocked apps")

        // Start monitoring
        handler.post(monitoringRunnable)

        return START_STICKY // Restart service if killed
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "Service destroyed")

        // Stop monitoring
        handler.removeCallbacks(monitoringRunnable)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    /**
     * Load blocked packages from SharedPreferences
     */
    private fun loadBlockedPackages() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val packagesString = prefs.getString(KEY_BLOCKED_PACKAGES, "") ?: ""

        blockedPackages.clear()
        if (packagesString.isNotEmpty()) {
            blockedPackages.addAll(packagesString.split(","))
        }

        Log.i(TAG, "Loaded ${blockedPackages.size} blocked packages: $blockedPackages")
    }

    /**
     * Check current foreground app
     */
    private fun checkForegroundApp() {
        val currentPackage = getForegroundPackage() ?: return

        // Ignore our own app and system apps
        if (currentPackage == packageName ||
            currentPackage == "com.android.systemui" ||
            currentPackage == "com.android.launcher3") {
            return
        }

        // Only block if package is in blocked list and different from last check
        if (blockedPackages.contains(currentPackage) && currentPackage != lastCheckedPackage) {
            Log.w(TAG, "BLOCKED APP DETECTED: $currentPackage")
            blockApp(currentPackage)
        }

        lastCheckedPackage = currentPackage
    }

    /**
     * Get current foreground app package name using UsageStatsManager
     */
    private fun getForegroundPackage(): String? {
        try {
            val endTime = System.currentTimeMillis()
            val beginTime = endTime - 1000 // Last 1 second

            val events = usageStatsManager.queryEvents(beginTime, endTime)
            var lastPackage: String? = null

            while (events.hasNextEvent()) {
                val event = UsageEvents.Event()
                events.getNextEvent(event)

                // Look for MOVE_TO_FOREGROUND events
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastPackage = event.packageName
                }
            }

            return lastPackage
        } catch (e: Exception) {
            Log.e(TAG, "Error getting foreground package", e)
            return null
        }
    }

    /**
     * Block the app by launching overlay activity
     */
    private fun blockApp(packageName: String) {
        val intent = Intent(this, BlockingOverlayActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("blocked_package", packageName)
        }
        startActivity(intent)

        // Also try to force the app to background
        try {
            val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            @Suppress("DEPRECATION")
            activityManager.killBackgroundProcesses(packageName)
        } catch (e: Exception) {
            Log.w(TAG, "Could not kill background process", e)
        }
    }

    /**
     * Create notification channel for Android O+
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "App Blocking Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors and blocks prohibited apps"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Create foreground notification
     */
    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("App Protection Active")
            .setContentText("${blockedPackages.size} apps blocked")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
