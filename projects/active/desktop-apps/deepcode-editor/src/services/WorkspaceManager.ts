/**
 * WorkspaceManager Service
 *
 * Manages workspace folder selection, persistence, and switching.
 * Uses Electron's file dialog for folder access.
 *
 * Features:
 * - Folder selection dialog
 * - LocalStorage persistence
 * - Recent workspaces (max 5)
 * - Workspace switching
 * - Event notifications
 */
import { logger } from '../services/Logger';

import { ElectronService } from './ElectronService';

const STORAGE_CURRENT = 'workspace_current';
const STORAGE_RECENT = 'workspace_recent';
const MAX_RECENT_WORKSPACES = 5;

export class WorkspaceManager {
  private currentWorkspace: string | null = null;
  private recentWorkspaces: string[] = [];
  private electronService: ElectronService;

  constructor() {
    this.electronService = new ElectronService();
    this.loadFromStorage();
  }

  /**
   * Load workspace state from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load current workspace
      const current = localStorage.getItem(STORAGE_CURRENT);
      if (current) {
        this.currentWorkspace = current;
      }

      // Load recent workspaces
      const recent = localStorage.getItem(STORAGE_RECENT);
      if (recent) {
        this.recentWorkspaces = JSON.parse(recent);
      }
    } catch (error) {
      logger.error('[WorkspaceManager] Failed to load from storage:', error);
      this.recentWorkspaces = [];
    }
  }

  /**
   * Save workspace state to localStorage
   */
  private saveToStorage(): void {
    try {
      if (this.currentWorkspace) {
        localStorage.setItem(STORAGE_CURRENT, this.currentWorkspace);
      } else {
        localStorage.removeItem(STORAGE_CURRENT);
      }

      localStorage.setItem(STORAGE_RECENT, JSON.stringify(this.recentWorkspaces));
    } catch (error) {
      logger.error('[WorkspaceManager] Failed to save to storage:', error);
    }
  }

  /**
   * Add workspace to recent list
   */
  private addToRecent(path: string): void {
    // Remove if already exists
    this.recentWorkspaces = this.recentWorkspaces.filter((p) => p !== path);

    // Add to front
    this.recentWorkspaces.unshift(path);

    // Limit to max
    if (this.recentWorkspaces.length > MAX_RECENT_WORKSPACES) {
      this.recentWorkspaces = this.recentWorkspaces.slice(0, MAX_RECENT_WORKSPACES);
    }
  }

  /**
   * Emit workspace-changed event
   */
  private emitWorkspaceChanged(): void {
    const event = new CustomEvent('workspace-changed', {
      detail: {
        path: this.currentWorkspace,
        name: this.getWorkspaceName(),
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Open folder selection dialog and set as workspace
   *
   * @returns Selected folder path or null if cancelled
   */
  async selectWorkspaceFolder(): Promise<string | null> {
    try {
      if (!this.electronService.isElectron()) {
        logger.warn('[WorkspaceManager] Not running in Electron mode');
        return null;
      }

      const result = await this.electronService.openFolderDialog({
        title: 'Select Workspace Folder',
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selected = result.filePaths[0];
        this.currentWorkspace = selected;
        this.addToRecent(selected);
        this.saveToStorage();
        this.emitWorkspaceChanged();
        return selected;
      }

      return null;
    } catch (error) {
      logger.error('[WorkspaceManager] Failed to select folder:', error);
      return null;
    }
  }

  /**
   * Get current workspace path
   *
   * @returns Current workspace path or null
   */
  getCurrentWorkspace(): string | null {
    return this.currentWorkspace;
  }

  /**
   * Get list of recent workspaces
   *
   * @returns Array of recent workspace paths
   */
  getRecentWorkspaces(): string[] {
    return [...this.recentWorkspaces];
  }

  /**
   * Switch to a different workspace
   *
   * @param path - Workspace folder path
   */
  async switchWorkspace(path: string): Promise<void> {
    this.currentWorkspace = path;
    this.addToRecent(path);
    this.saveToStorage();
    this.emitWorkspaceChanged();
  }

  /**
   * Clear current workspace
   */
  clearWorkspace(): void {
    this.currentWorkspace = null;
    this.saveToStorage();
    this.emitWorkspaceChanged();
  }

  /**
   * Get workspace name from path
   *
   * @returns Workspace folder name or null
   */
  getWorkspaceName(): string | null {
    if (!this.currentWorkspace) return null;

    // Extract folder name from path
    const parts = this.currentWorkspace.split(/[/\\]/);
    return parts[parts.length - 1] || null;
  }

  /**
   * Check if workspace is set
   *
   * @returns True if workspace is set
   */
  hasWorkspace(): boolean {
    return this.currentWorkspace !== null;
  }
}
