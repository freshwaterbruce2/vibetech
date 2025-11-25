package com.kidesafe.applock.kiosk

/**
 * App Blocking Modes for Kid's App Lock
 *
 * Defines the three modes of operation:
 * 1. KIOSK_SINGLE - Lock device to ONE specific app (original functionality)
 * 2. WHITELIST - Allow ONLY selected apps (block everything else)
 * 3. BLACKLIST - Block ONLY selected apps (allow everything else)
 */
enum class AppBlockingMode {
    /**
     * KIOSK_SINGLE Mode
     * - Locks device to a single app using Android's lock task mode
     * - Child can ONLY use that one app
     * - No access to home screen, notifications, or other apps
     * - Requires Device Admin
     * - Most restrictive mode
     */
    KIOSK_SINGLE,

    /**
     * WHITELIST Mode
     * - Parent selects multiple ALLOWED apps
     * - Child can switch between allowed apps
     * - Everything else is blocked
     * - Requires Device Owner for full functionality
     * - Uses lock task with multiple packages
     */
    WHITELIST,

    /**
     * BLACKLIST Mode
     * - Parent selects apps to BLOCK
     * - Child can use everything EXCEPT blocked apps
     * - Monitors app launches and blocks prohibited apps
     * - Uses UsageStatsManager + overlay window
     * - Least restrictive mode
     */
    BLACKLIST;

    /**
     * Get user-friendly display name
     */
    fun getDisplayName(): String = when (this) {
        KIOSK_SINGLE -> "Single App Lock"
        WHITELIST -> "Allow Only Selected"
        BLACKLIST -> "Block Selected Apps"
    }

    /**
     * Get description for UI
     */
    fun getDescription(): String = when (this) {
        KIOSK_SINGLE -> "Lock device to ONE app only. Child cannot access anything else."
        WHITELIST -> "Allow child to use ONLY selected apps. Everything else is blocked."
        BLACKLIST -> "Block specific apps. Child can use everything EXCEPT selected apps."
    }

    /**
     * Check if this mode supports multiple app selection
     */
    fun supportsMultipleApps(): Boolean = when (this) {
        KIOSK_SINGLE -> false
        WHITELIST, BLACKLIST -> true
    }
}
