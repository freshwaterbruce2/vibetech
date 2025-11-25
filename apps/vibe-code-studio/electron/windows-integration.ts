/**
 * Windows 11 Native Integration
 *
 * Provides file associations, context menu integration, and Windows Search support
 * Optimized for Windows 11 with RTX 3060 and AMD Ryzen 7
 */

import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Register file associations for Vibe Code Studio
 * Associates common code file extensions with the app
 */
export async function registerFileAssociations(): Promise<void> {
  if (process.platform !== 'win32') {
    return;
  }

  try {
    const appPath = app.getPath('exe');
    const appName = 'Vibe Code Studio';
    const appId = 'com.vibetech.vibecodestudio';

    // File extensions to associate
    const extensions = [
      '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css', '.scss',
      '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs',
      '.xml', '.yaml', '.yml', '.sql', '.sh', '.ps1', '.bat', '.cmd'
    ];

    console.log('[Windows Integration] Registering file associations...');

    for (const ext of extensions) {
      try {
        // Register file type
        const fileTypeKey = `HKCU\\Software\\Classes\\${appId}${ext}`;
        await execAsync(`reg add "${fileTypeKey}" /ve /d "${appName}${ext} File" /f`);
        await execAsync(`reg add "${fileTypeKey}\\DefaultIcon" /ve /d "${appPath},0" /f`);
        await execAsync(`reg add "${fileTypeKey}\\shell\\open\\command" /ve /d "\\"${appPath}\\" \\"%1\\"" /f`);

        // Associate extension with file type
        await execAsync(`reg add "HKCU\\Software\\Classes\\${ext}" /ve /d "${appId}${ext}" /f`);

        console.log(`[Windows Integration] Registered association for ${ext}`);
      } catch (error) {
        console.warn(`[Windows Integration] Failed to register ${ext}:`, error);
      }
    }

    // Refresh shell to apply changes
    try {
      await execAsync('taskkill /F /IM explorer.exe && start explorer.exe');
      console.log('[Windows Integration] Shell refreshed to apply file associations');
    } catch {
      // Ignore errors - explorer restart is optional
    }

    console.log('[Windows Integration] File associations registered successfully');
  } catch (error) {
    console.error('[Windows Integration] Failed to register file associations:', error);
  }
}

/**
 * Add context menu entries for folders and files
 */
export async function registerContextMenu(): Promise<void> {
  if (process.platform !== 'win32') {
    return;
  }

  try {
    const appPath = app.getPath('exe');
    const appName = 'Vibe Code Studio';

    console.log('[Windows Integration] Registering context menu entries...');

    // Add "Open with Vibe Code Studio" for folders
    const folderMenuKey = 'HKCU\\Software\\Classes\\Directory\\shell\\VibeCodeStudio';
    await execAsync(`reg add "${folderMenuKey}" /ve /d "Open with ${appName}" /f`);
    await execAsync(`reg add "${folderMenuKey}\\command" /ve /d "\\"${appPath}\\" \\"%1\\"" /f`);

    // Add "Open with Vibe Code Studio" for background (empty space in folder)
    const backgroundMenuKey = 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\VibeCodeStudio';
    await execAsync(`reg add "${backgroundMenuKey}" /ve /d "Open with ${appName}" /f`);
    await execAsync(`reg add "${backgroundMenuKey}\\command" /ve /d "\\"${appPath}\\" \\"%V\\"" /f`);

    console.log('[Windows Integration] Context menu entries registered successfully');
  } catch (error) {
    console.error('[Windows Integration] Failed to register context menu:', error);
  }
}

/**
 * Register Windows Search integration
 * Makes Vibe Code Studio searchable in Windows Search
 */
export async function registerWindowsSearch(): Promise<void> {
  if (process.platform !== 'win32') {
    return;
  }

  try {
    const appPath = app.getPath('exe');
    const appName = 'Vibe Code Studio';
    const appId = 'com.vibetech.vibecodestudio';

    console.log('[Windows Integration] Registering Windows Search integration...');

    // Register application for Windows Search
    const searchKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\\Applications\\${appId}`;
    await execAsync(`reg add "${searchKey}" /v "AppPath" /d "${appPath}" /f`);
    await execAsync(`reg add "${searchKey}" /v "ApplicationName" /d "${appName}" /f`);
    await execAsync(`reg add "${searchKey}" /v "ApplicationDescription" /d "AI-powered code editor" /f`);

    console.log('[Windows Integration] Windows Search integration registered');
  } catch (error) {
    console.error('[Windows Integration] Failed to register Windows Search:', error);
  }
}

/**
 * Configure taskbar and system tray coordination
 */
export async function configureTaskbarIntegration(): Promise<void> {
  if (process.platform !== 'win32') {
    return;
  }

  try {
    const appId = 'com.vibetech.vibecodestudio';

    // Set app user model ID for proper taskbar grouping
    app.setAppUserModelId(appId);

    console.log('[Windows Integration] Taskbar integration configured');
  } catch (error) {
    console.error('[Windows Integration] Failed to configure taskbar:', error);
  }
}

/**
 * Initialize all Windows integrations
 */
export async function initializeWindowsIntegration(): Promise<void> {
  if (process.platform !== 'win32') {
    return;
  }

  console.log('[Windows Integration] Initializing Windows 11 native integrations...');

  try {
    // Configure taskbar first (required for other integrations)
    await configureTaskbarIntegration();

    // Register integrations (can be done asynchronously)
    Promise.all([
      registerFileAssociations(),
      registerContextMenu(),
      registerWindowsSearch(),
    ]).then(() => {
      console.log('[Windows Integration] All integrations initialized successfully');
    }).catch((error) => {
      console.error('[Windows Integration] Some integrations failed:', error);
    });
  } catch (error) {
    console.error('[Windows Integration] Initialization failed:', error);
  }
}

/**
 * Unregister all Windows integrations (for uninstall)
 */
export async function unregisterWindowsIntegration(): Promise<void> {
  if (process.platform !== 'win32') {
    return;
  }

  try {
    const appId = 'com.vibetech.vibecodestudio';

    console.log('[Windows Integration] Unregistering Windows integrations...');

    // Remove file associations
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];
    for (const ext of extensions) {
      try {
        await execAsync(`reg delete "HKCU\\Software\\Classes\\${ext}" /f`);
        await execAsync(`reg delete "HKCU\\Software\\Classes\\${appId}${ext}" /f`);
      } catch {
        // Ignore errors if keys don't exist
      }
    }

    // Remove context menu entries
    try {
      await execAsync(`reg delete "HKCU\\Software\\Classes\\Directory\\shell\\VibeCodeStudio" /f`);
      await execAsync(`reg delete "HKCU\\Software\\Classes\\Directory\\Background\\shell\\VibeCodeStudio" /f`);
    } catch {
      // Ignore errors
    }

    // Remove Windows Search registration
    try {
      await execAsync(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\\Applications\\${appId}" /f`);
    } catch {
      // Ignore errors
    }

    console.log('[Windows Integration] Unregistration complete');
  } catch (error) {
    console.error('[Windows Integration] Unregistration failed:', error);
  }
}

