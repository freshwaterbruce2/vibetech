package com.kidesafe.applock.services

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kidesafe.applock.ui.theme.KidsAppLockTheme

/**
 * BlockingOverlayActivity - Fullscreen activity shown when a blocked app is detected
 *
 * Features:
 * - Fullscreen overlay that blocks access to prohibited app
 * - Shows which app is blocked
 * - Forces user to go home (cannot access the blocked app)
 * - Cannot be dismissed by back button
 */
class BlockingOverlayActivity : ComponentActivity() {

    private var blockedPackage: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Get blocked package name
        blockedPackage = intent.getStringExtra("blocked_package")

        // Make fullscreen and show over lockscreen
        window.addFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        setContent {
            KidsAppLockTheme {
                BlockingOverlayScreen(
                    blockedPackage = blockedPackage ?: "Unknown",
                    onGoHome = {
                        goHome()
                    }
                )
            }
        }
    }

    /**
     * Prevent back button from dismissing the overlay
     */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Do nothing - force user to tap "Go Home" button
    }

    /**
     * Send user to home screen
     */
    private fun goHome() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    /**
     * Get app name from package name
     */
    private fun getAppName(packageName: String): String {
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageName
        }
    }
}

@Composable
private fun BlockingOverlayScreen(
    blockedPackage: String,
    onGoHome: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.errorContainer
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Block icon
            Icon(
                imageVector = Icons.Default.Block,
                contentDescription = "Blocked",
                modifier = Modifier.size(120.dp),
                tint = MaterialTheme.colorScheme.error
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Title
            Text(
                text = "App Blocked",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Message
            Text(
                text = "This app has been blocked by your parent.",
                fontSize = 18.sp,
                color = MaterialTheme.colorScheme.onErrorContainer,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Package name (for debugging)
            Text(
                text = getAppDisplayName(blockedPackage),
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Go Home button
            Button(
                onClick = onGoHome,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text(
                    text = "Go Home",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Help text
            Text(
                text = "To unblock this app, ask your parent to open Kid's App Lock and change the settings.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.6f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
        }
    }
}

/**
 * Get user-friendly app name for common apps
 */
private fun getAppDisplayName(packageName: String): String {
    return when {
        packageName.contains("chrome") -> "Google Chrome"
        packageName.contains("tiktok") -> "TikTok"
        packageName.contains("instagram") -> "Instagram"
        packageName.contains("facebook") -> "Facebook"
        packageName.contains("snapchat") -> "Snapchat"
        packageName.contains("youtube") && !packageName.contains("kids") -> "YouTube"
        packageName.contains("twitter") || packageName.contains("x.com") -> "Twitter/X"
        packageName.contains("reddit") -> "Reddit"
        packageName.contains("discord") -> "Discord"
        packageName.contains("twitch") -> "Twitch"
        else -> packageName.substringAfterLast('.').replaceFirstChar { it.uppercase() }
    }
}
