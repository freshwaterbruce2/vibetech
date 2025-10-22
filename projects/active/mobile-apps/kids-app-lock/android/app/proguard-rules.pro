# Add project specific ProGuard rules here.

# Keep Device Admin Receiver
-keep class com.kidesafe.applock.admin.KioskDeviceAdminReceiver { *; }

# Keep Boot Receiver
-keep class com.kidesafe.applock.kiosk.BootReceiver { *; }

# Keep Compose
-dontwarn androidx.compose.**
-keep class androidx.compose.** { *; }

# Keep Kotlin Metadata
-keep class kotlin.Metadata { *; }

# Android Security
-keep class androidx.security.crypto.** { *; }
