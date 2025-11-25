package com.kidesafe.applock.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.graphics.drawable.toBitmap
import com.kidesafe.applock.kiosk.AppBlockingMode
import com.kidesafe.applock.kiosk.AppInfo

/**
 * Enhanced App Selection Screen with support for three blocking modes:
 * - KIOSK_SINGLE: Lock to one app only
 * - WHITELIST: Allow only selected apps
 * - BLACKLIST: Block selected apps
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppSelectionScreenEnhanced(
    apps: List<AppInfo>,
    selectedApp: AppInfo?,
    selectedApps: List<AppInfo>,
    blockingMode: AppBlockingMode,
    isLoading: Boolean,
    errorMessage: String?,
    onAppSelected: (AppInfo) -> Unit,
    onModeChanged: (AppBlockingMode) -> Unit,
    onStartKioskMode: () -> Unit,
    onRefresh: () -> Unit
) {
    val hasSelection = when (blockingMode) {
        AppBlockingMode.KIOSK_SINGLE -> selectedApp != null
        AppBlockingMode.WHITELIST, AppBlockingMode.BLACKLIST -> selectedApps.isNotEmpty()
    }

    val selectedCount = when (blockingMode) {
        AppBlockingMode.KIOSK_SINGLE -> if (selectedApp != null) 1 else 0
        AppBlockingMode.WHITELIST, AppBlockingMode.BLACKLIST -> selectedApps.size
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("App Control") },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        bottomBar = {
            if (hasSelection) {
                BottomAppBar(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "$selectedCount app${if (selectedCount != 1) "s" else ""} selected",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Button(
                            onClick = onStartKioskMode,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp)
                        ) {
                            Text(getButtonText(blockingMode))
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Mode selector
            ModeSelector(
                currentMode = blockingMode,
                onModeSelected = onModeChanged,
                modifier = Modifier.padding(16.dp)
            )

            Divider()

            // App list
            Box(modifier = Modifier.fillMaxSize()) {
                when {
                    isLoading -> {
                        CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    errorMessage != null -> {
                        Column(
                            modifier = Modifier
                                .align(Alignment.Center)
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = errorMessage,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = onRefresh) {
                                Text("Retry")
                            }
                        }
                    }
                    apps.isEmpty() -> {
                        Text(
                            text = "No apps found",
                            modifier = Modifier.align(Alignment.Center),
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            item {
                                ModeDescriptionCard(blockingMode)
                            }

                            items(apps) { app ->
                                val isSelected = when (blockingMode) {
                                    AppBlockingMode.KIOSK_SINGLE -> app == selectedApp
                                    AppBlockingMode.WHITELIST, AppBlockingMode.BLACKLIST ->
                                        app.isSelected
                                }

                                AppListItem(
                                    app = app,
                                    isSelected = isSelected,
                                    blockingMode = blockingMode,
                                    onClick = { onAppSelected(app) }
                                )
                            }

                            // Bottom padding for BottomAppBar
                            item {
                                Spacer(modifier = Modifier.height(80.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ModeSelector(
    currentMode: AppBlockingMode,
    onModeSelected: (AppBlockingMode) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Select Control Mode:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            AppBlockingMode.values().forEach { mode ->
                FilterChip(
                    selected = currentMode == mode,
                    onClick = { onModeSelected(mode) },
                    label = {
                        Text(
                            text = mode.getDisplayName(),
                            style = MaterialTheme.typography.bodySmall
                        )
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun ModeDescriptionCard(mode: AppBlockingMode) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = mode.getDisplayName(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = mode.getDescription(),
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = when (mode) {
                    AppBlockingMode.KIOSK_SINGLE -> "Tap an app to select it"
                    AppBlockingMode.WHITELIST -> "Select all apps your child CAN use"
                    AppBlockingMode.BLACKLIST -> "Select all apps to BLOCK"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun AppListItem(
    app: AppInfo,
    isSelected: Boolean,
    blockingMode: AppBlockingMode,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) {
                when (blockingMode) {
                    AppBlockingMode.KIOSK_SINGLE, AppBlockingMode.WHITELIST ->
                        MaterialTheme.colorScheme.primaryContainer
                    AppBlockingMode.BLACKLIST ->
                        MaterialTheme.colorScheme.errorContainer
                }
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Image(
                bitmap = app.icon.toBitmap().asImageBitmap(),
                contentDescription = null,
                modifier = Modifier.size(48.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Text(
                text = app.appName,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )

            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Selected",
                    tint = when (blockingMode) {
                        AppBlockingMode.KIOSK_SINGLE, AppBlockingMode.WHITELIST ->
                            MaterialTheme.colorScheme.primary
                        AppBlockingMode.BLACKLIST ->
                            MaterialTheme.colorScheme.error
                    }
                )
            } else if (blockingMode != AppBlockingMode.KIOSK_SINGLE) {
                Icon(
                    imageVector = Icons.Default.Circle,
                    contentDescription = "Not selected",
                    tint = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                )
            }
        }
    }
}

private fun getButtonText(mode: AppBlockingMode): String = when (mode) {
    AppBlockingMode.KIOSK_SINGLE -> "Lock to This App"
    AppBlockingMode.WHITELIST -> "Allow Only These Apps"
    AppBlockingMode.BLACKLIST -> "Block These Apps"
}
