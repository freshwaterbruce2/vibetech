/**
 * Auto-update service for keeping the application up to date
 */

// Import electron types
import '../types/electron.d';

import { telemetry } from './TelemetryService';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  mandatory: boolean;
}

export class AutoUpdateService {
  private static instance: AutoUpdateService;
  private checkInterval: number = 3600000; // 1 hour
  private enabled: boolean;
  private currentVersion: string;
  private updateCheckTimer?: NodeJS.Timeout | undefined;

  private constructor() {
    this.enabled = import.meta.env['VITE_ENABLE_AUTO_UPDATE'] === 'true';
    this.currentVersion = import.meta.env['VITE_APP_VERSION'] || '1.0.0';

    if (this.enabled) {
      this.startUpdateCheck();
    }
  }

  static getInstance(): AutoUpdateService {
    if (!AutoUpdateService.instance) {
      AutoUpdateService.instance = new AutoUpdateService();
    }
    return AutoUpdateService.instance;
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      telemetry.trackEvent('update_check_started');

      const response = await fetch(`${import.meta.env['VITE_UPDATE_SERVER_URL']}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentVersion: this.currentVersion,
          platform: this.getPlatform(),
          arch: this.getArchitecture(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.statusText}`);
      }

      const updateInfo: UpdateInfo = await response.json();

      if (this.isNewerVersion(updateInfo.version)) {
        telemetry.trackEvent('update_available', {
          newVersion: updateInfo.version,
          currentVersion: this.currentVersion,
        });
        return updateInfo;
      }

      telemetry.trackEvent('update_check_completed', { upToDate: true });
      return null;
    } catch (error) {
      telemetry.trackError(error as Error, {
        context: 'update_check',
        currentVersion: this.currentVersion,
      });
      console.error('Update check failed:', error);
      return null;
    }
  }

  /**
   * Download and install update
   */
  async downloadAndInstallUpdate(updateInfo: UpdateInfo): Promise<void> {
    if (!window.electronAPI) {
      console.warn('Updates only available in Electron app');
      return;
    }

    try {
      telemetry.trackEvent('update_download_started', { version: updateInfo.version });

      // In Electron, we would need to implement auto-updater functionality
      // For now, open the download URL in the browser
      await window.electronAPI.shellOpenExternal(updateInfo.downloadUrl);

      telemetry.trackEvent('update_download_initiated', { version: updateInfo.version });

      // Show user instructions
      await window.electronAPI.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `Version ${updateInfo.version} is available`,
        detail:
          'The download has been started in your browser. Please install the update manually.',
      });
    } catch (error) {
      telemetry.trackError(
        error as Error,
        {
          context: 'update_download',
          version: updateInfo.version,
        },
        'high'
      );
      throw error;
    }
  }

  /**
   * Schedule application restart
   */
  private async scheduleRestart(): Promise<void> {
    if (!window.electronAPI) {
      return;
    }

    // Show notification to user
    const result = await window.electronAPI.showMessageBox({
      type: 'question',
      title: 'Restart Required',
      message: 'Update downloaded successfully. Restart now to apply the update?',
      buttons: ['Restart Now', 'Later'],
    });

    if (result.response === 0) {
      telemetry.trackEvent('update_restart_accepted');
      await window.electronAPI.app.restart();
    } else {
      telemetry.trackEvent('update_restart_deferred');
      // Remind user later
      setTimeout(() => this.scheduleRestart(), 3600000); // 1 hour
    }
  }

  /**
   * Start periodic update checks
   */
  private startUpdateCheck(): void {
    // Initial check after 30 seconds
    setTimeout(() => this.checkForUpdates(), 30000);

    // Periodic checks
    this.updateCheckTimer = setInterval(() => this.checkForUpdates(), this.checkInterval);
  }

  /**
   * Stop update checks
   */
  stopUpdateCheck(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = undefined;
    }
  }

  /**
   * Compare version strings
   */
  private isNewerVersion(newVersion: string): boolean {
    const current = this.parseVersion(this.currentVersion);
    const newer = this.parseVersion(newVersion);

    if (newer.major > current.major) {
      return true;
    }
    if (newer.major < current.major) {
      return false;
    }

    if (newer.minor > current.minor) {
      return true;
    }
    if (newer.minor < current.minor) {
      return false;
    }

    return newer.patch > current.patch;
  }

  /**
   * Parse version string
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const [major = 0, minor = 0, patch = 0] = version.split('.').map((v) => parseInt(v, 10));

    return { major, minor, patch };
  }

  /**
   * Get current platform
   */
  private getPlatform(): string {
    if (window.electronEnv) {
      return window.electronEnv.platform;
    }

    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) {
      return 'win32';
    }
    if (platform.includes('mac')) {
      return 'darwin';
    }
    return 'linux';
  }

  /**
   * Get system architecture
   */
  private getArchitecture(): string {
    if (window.electronEnv) {
      return window.electronEnv.arch;
    }

    // Best guess from user agent
    return navigator.userAgent.includes('x64') ? 'x64' : 'x86';
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Enable auto-updates
   */
  enable(): void {
    this.enabled = true;
    this.startUpdateCheck();
  }

  /**
   * Disable auto-updates
   */
  disable(): void {
    this.enabled = false;
    this.stopUpdateCheck();
  }
}

// Export singleton instance
export const autoUpdater = AutoUpdateService.getInstance();
