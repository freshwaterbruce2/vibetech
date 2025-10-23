package com.kidesafe.applock

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.kidesafe.applock.kiosk.KioskManager
import com.kidesafe.applock.ui.MainViewModel
import com.kidesafe.applock.ui.Screen
import com.kidesafe.applock.ui.screens.AppSelectionScreen
import com.kidesafe.applock.ui.screens.OnboardingScreen
import com.kidesafe.applock.ui.screens.PinEntryScreen
import com.kidesafe.applock.ui.screens.SetupPinScreen
import com.kidesafe.applock.ui.theme.KidsAppLockTheme

/**
 * MainActivity for Kid's App Lock
 *
 * Main entry point for the application.
 * Uses Jetpack Compose for declarative UI (React-like approach).
 *
 * Features:
 * - Onboarding flow for first-time setup
 * - PIN entry for administrator access
 * - App selection for kiosk mode
 * - Permission requests (Device Admin, Usage Stats)
 */
class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()
    private lateinit var kioskManager: KioskManager

    companion object {
        private const val TAG = "MainActivity"
    }

    // Activity result launcher for Device Admin permission
    private val deviceAdminLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val isAdmin = kioskManager.isDeviceAdmin()
        viewModel.updateDeviceAdminStatus(isAdmin)
        Log.i(TAG, "Device Admin status: $isAdmin")
    }

    // Activity result launcher for Usage Stats permission
    private val usageStatsLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val appListManager = com.kidesafe.applock.kiosk.AppListManager(this)
        val hasPermission = appListManager.hasUsageStatsPermission()
        viewModel.updateUsageStatsPermission(hasPermission)
        Log.i(TAG, "Usage Stats permission: $hasPermission")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        kioskManager = KioskManager(this)

        setContent {
            KidsAppLockTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }

    @Composable
    private fun MainScreen() {
        // collectAsStateWithLifecycle is lifecycle-aware (2025 best practice)
        // Stops collecting when app is backgrounded, improving performance
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()

        // Navigate to appropriate screen based on state
        when (uiState.currentScreen) {
            Screen.Onboarding -> {
                OnboardingScreen(
                    onGetStarted = { viewModel.navigateTo(Screen.SetupPin) }
                )
            }

            Screen.SetupPin -> {
                SetupPinScreen(
                    onPinSet = { pin ->
                        if (viewModel.setPin(pin)) {
                            viewModel.navigateTo(Screen.SetupSecurityQuestion)
                        }
                    },
                    onBack = { viewModel.navigateTo(Screen.Onboarding) }
                )
            }

            Screen.SetupSecurityQuestion -> {
                com.kidesafe.applock.ui.screens.SetupSecurityQuestionScreen(
                    onQuestionSet = { question, answer ->
                        if (viewModel.setSecurityQuestion(question, answer)) {
                            viewModel.navigateTo(Screen.Permissions)
                        }
                    },
                    onBack = { viewModel.navigateTo(Screen.SetupPin) }
                )
            }

            Screen.Permissions -> {
                com.kidesafe.applock.ui.screens.PermissionsScreen(
                    isDeviceAdmin = uiState.isDeviceAdmin,
                    hasUsageStats = uiState.hasUsageStatsPermission,
                    onRequestDeviceAdmin = { requestDeviceAdmin() },
                    onRequestUsageStats = { requestUsageStats() },
                    onContinue = {
                        viewModel.loadInstalledApps()
                        viewModel.navigateTo(Screen.AppSelection)
                    }
                )
            }

            Screen.AppSelection -> {
                AppSelectionScreen(
                    apps = uiState.installedApps,
                    selectedApp = uiState.selectedApp,
                    isLoading = uiState.isLoading,
                    errorMessage = uiState.errorMessage,
                    onAppSelected = { app -> viewModel.selectApp(app) },
                    onStartKioskMode = {
                        if (viewModel.canStartKioskMode()) {
                            viewModel.startKioskMode()
                        }
                    },
                    onRefresh = { viewModel.loadInstalledApps() }
                )
            }

            Screen.PinEntry -> {
                PinEntryScreen(
                    onPinEntered = { pin -> viewModel.verifyPin(pin) },
                    onForgotPin = { viewModel.navigateTo(Screen.ForgotPin) },
                    errorMessage = uiState.errorMessage,
                    onErrorDismiss = { viewModel.clearError() }
                )
            }

            Screen.ForgotPin -> {
                com.kidesafe.applock.ui.screens.ForgotPinScreen(
                    securityQuestion = viewModel.getSecurityQuestion() ?: "",
                    onAnswerSubmit = { answer ->
                        if (viewModel.verifySecurityAnswer(answer)) {
                            viewModel.navigateTo(Screen.ResetPin)
                        }
                    },
                    onBack = { viewModel.navigateTo(Screen.PinEntry) }
                )
            }

            Screen.ResetPin -> {
                com.kidesafe.applock.ui.screens.ResetPinScreen(
                    onPinReset = { newPin ->
                        if (viewModel.setPin(newPin)) {
                            viewModel.navigateTo(Screen.AppSelection)
                        }
                    }
                )
            }

            Screen.KioskActive -> {
                // This screen should never be reached in this app
                // The locked app will be in the foreground
                com.kidesafe.applock.ui.screens.KioskActiveScreen(
                    appName = uiState.selectedApp?.appName ?: "Unknown"
                )
            }
        }
    }

    /**
     * Request Device Administrator permission
     */
    private fun requestDeviceAdmin() {
        kioskManager.requestDeviceAdmin(this)
    }

    /**
     * Request Usage Stats permission
     */
    private fun requestUsageStats() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        usageStatsLauncher.launch(intent)
    }

    override fun onResume() {
        super.onResume()

        // Refresh permission status
        val appListManager = com.kidesafe.applock.kiosk.AppListManager(this)
        viewModel.updateDeviceAdminStatus(kioskManager.isDeviceAdmin())
        viewModel.updateUsageStatsPermission(appListManager.hasUsageStatsPermission())
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == KioskManager.REQUEST_CODE_ENABLE_ADMIN) {
            val isAdmin = kioskManager.isDeviceAdmin()
            viewModel.updateDeviceAdminStatus(isAdmin)
            Log.i(TAG, "Device Admin result: $isAdmin")
        }
    }

    override fun onBackPressed() {
        // Prevent back button from exiting during onboarding
        val uiState = viewModel.uiState.value
        if (uiState.currentScreen == Screen.AppSelection && uiState.isPinSet) {
            // Allow back to home screen if setup is complete
            super.onBackPressed()
        }
        // Otherwise, ignore back button
    }
}
