package com.kidesafe.applock.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kidesafe.applock.kiosk.AppInfo
import com.kidesafe.applock.kiosk.AppListManager
import com.kidesafe.applock.kiosk.KioskManager
import com.kidesafe.applock.security.SecurityManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * MainViewModel for Kid's App Lock
 *
 * Manages application state using Kotlin StateFlow (similar to React useState)
 * Handles business logic for:
 * - Onboarding flow
 * - PIN setup and verification
 * - App selection
 * - Kiosk mode activation
 */
class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val securityManager = SecurityManager(application)
    private val kioskManager = KioskManager(application)
    private val appListManager = AppListManager(application)

    // UI State
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        checkInitialState()
    }

    /**
     * Check initial app state
     */
    private fun checkInitialState() {
        val isPinSet = securityManager.isPinSet()
        val isDeviceAdmin = kioskManager.isDeviceAdmin()
        val hasUsageStats = appListManager.hasUsageStatsPermission()

        _uiState.update {
            it.copy(
                currentScreen = when {
                    !isPinSet -> Screen.Onboarding
                    kioskManager.isKioskModeActive() -> Screen.KioskActive
                    else -> Screen.AppSelection
                },
                isDeviceAdmin = isDeviceAdmin,
                hasUsageStatsPermission = hasUsageStats,
                isPinSet = isPinSet
            )
        }
    }

    /**
     * Load installed apps
     */
    fun loadInstalledApps() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            try {
                val apps = appListManager.getInstalledApps(includeSystemApps = false)
                _uiState.update {
                    it.copy(
                        installedApps = apps,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Failed to load apps: ${e.message}"
                    )
                }
            }
        }
    }

    /**
     * Set administrator PIN
     */
    fun setPin(pin: String): Boolean {
        val success = securityManager.setPin(pin)
        if (success) {
            _uiState.update { it.copy(isPinSet = true) }
        }
        return success
    }

    /**
     * Verify PIN
     */
    fun verifyPin(pin: String): Boolean {
        if (securityManager.isLockedOut()) {
            _uiState.update {
                it.copy(
                    errorMessage = "Too many attempts. Please wait ${securityManager.getLockoutTimeRemaining()} seconds."
                )
            }
            return false
        }

        val isCorrect = securityManager.verifyPin(pin)
        if (isCorrect) {
            _uiState.update {
                it.copy(
                    currentScreen = Screen.AppSelection,
                    errorMessage = null
                )
            }
        } else {
            val remaining = securityManager.getRemainingAttempts()
            _uiState.update {
                it.copy(
                    errorMessage = if (remaining > 0) {
                        "Incorrect PIN. $remaining attempts remaining."
                    } else {
                        "Too many incorrect attempts. Locked for 30 seconds."
                    }
                )
            }
        }
        return isCorrect
    }

    /**
     * Set security question
     */
    fun setSecurityQuestion(question: String, answer: String): Boolean {
        return securityManager.setSecurityQuestion(question, answer)
    }

    /**
     * Get security question
     */
    fun getSecurityQuestion(): String? {
        return securityManager.getSecurityQuestion()
    }

    /**
     * Verify security answer (for PIN recovery)
     */
    fun verifySecurityAnswer(answer: String): Boolean {
        val isCorrect = securityManager.verifySecurityAnswer(answer)
        if (isCorrect) {
            _uiState.update {
                it.copy(
                    currentScreen = Screen.ResetPin,
                    errorMessage = null
                )
            }
        }
        return isCorrect
    }

    /**
     * Select an app for kiosk mode
     */
    fun selectApp(app: AppInfo) {
        _uiState.update { it.copy(selectedApp = app) }
    }

    /**
     * Start kiosk mode with selected app
     */
    fun startKioskMode(): Boolean {
        val selectedApp = _uiState.value.selectedApp ?: return false

        val success = kioskManager.startKioskMode(
            packageName = selectedApp.packageName,
            appName = selectedApp.appName
        )

        if (success) {
            _uiState.update {
                it.copy(
                    currentScreen = Screen.KioskActive,
                    errorMessage = null
                )
            }
        } else {
            _uiState.update {
                it.copy(
                    errorMessage = "Failed to start kiosk mode. Please check Device Administrator settings."
                )
            }
        }

        return success
    }

    /**
     * Navigate to screen
     */
    fun navigateTo(screen: Screen) {
        _uiState.update { it.copy(currentScreen = screen) }
    }

    /**
     * Update Device Admin status
     */
    fun updateDeviceAdminStatus(isAdmin: Boolean) {
        _uiState.update { it.copy(isDeviceAdmin = isAdmin) }
    }

    /**
     * Update Usage Stats permission status
     */
    fun updateUsageStatsPermission(hasPermission: Boolean) {
        _uiState.update { it.copy(hasUsageStatsPermission = hasPermission) }
        if (hasPermission) {
            loadInstalledApps()
        }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    /**
     * Check if can start kiosk mode
     */
    fun canStartKioskMode(): Boolean {
        return _uiState.value.let {
            it.isDeviceAdmin && it.selectedApp != null
        }
    }

    fun getKioskManager() = kioskManager
}

/**
 * UI State data class
 */
data class MainUiState(
    val currentScreen: Screen = Screen.Onboarding,
    val isPinSet: Boolean = false,
    val isDeviceAdmin: Boolean = false,
    val hasUsageStatsPermission: Boolean = false,
    val installedApps: List<AppInfo> = emptyList(),
    val selectedApp: AppInfo? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

/**
 * Screen navigation sealed class
 */
sealed class Screen {
    object Onboarding : Screen()
    object SetupPin : Screen()
    object SetupSecurityQuestion : Screen()
    object AppSelection : Screen()
    object PinEntry : Screen()
    object ForgotPin : Screen()
    object ResetPin : Screen()
    object KioskActive : Screen()
    object Permissions : Screen()
}
