import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { AutoUpdateService } from '../../services/AutoUpdateService';

// Mock environment variables
vi.mock('../../types/electron.d', () => ({}));

// Mock telemetry
vi.mock('../../services/TelemetryService', () => ({
  telemetry: {
    trackEvent: vi.fn(),
    trackError: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../services/Logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('AutoUpdateService', () => {
  let service: AutoUpdateService;
  let mockElectronAPI: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset the singleton
    // @ts-ignore - accessing private static field for testing
    AutoUpdateService.instance = undefined;

    // Mock environment variables
    import.meta.env = {
      ...import.meta.env,
      VITE_ENABLE_AUTO_UPDATE: 'false', // Disable auto-update by default in tests
      VITE_APP_VERSION: '1.0.0',
      VITE_UPDATE_SERVER_URL: 'https://updates.example.com',
    };

    // Mock electron API
    mockElectronAPI = {
      shellOpenExternal: vi.fn().mockResolvedValue(undefined),
      showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
      app: {
        restart: vi.fn(),
      },
    };

    // @ts-ignore
    global.window = {
      ...global.window,
      electronAPI: mockElectronAPI,
      electronEnv: {
        platform: 'win32',
        arch: 'x64',
      },
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AutoUpdateService.getInstance();
      const instance2 = AutoUpdateService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Version Comparison', () => {
    beforeEach(() => {
      import.meta.env.VITE_APP_VERSION = '1.0.0';
      service = AutoUpdateService.getInstance();
    });

    it('should detect newer major version', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '2.0.0',
          releaseDate: '2025-01-01',
          releaseNotes: 'Major update',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      service.enable();
      const update = await service.checkForUpdates();

      expect(update).toBeTruthy();
      expect(update?.version).toBe('2.0.0');
    });

    it('should detect newer minor version', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.1.0',
          releaseDate: '2025-01-01',
          releaseNotes: 'Minor update',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      service.enable();
      const update = await service.checkForUpdates();

      expect(update).toBeTruthy();
      expect(update?.version).toBe('1.1.0');
    });

    it('should detect newer patch version', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.1',
          releaseDate: '2025-01-01',
          releaseNotes: 'Patch update',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      service.enable();
      const update = await service.checkForUpdates();

      expect(update).toBeTruthy();
      expect(update?.version).toBe('1.0.1');
    });

    it('should not detect same version as update', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          releaseDate: '2025-01-01',
          releaseNotes: 'Same version',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      service.enable();
      const update = await service.checkForUpdates();

      expect(update).toBeNull();
    });

    it('should not detect older version as update', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '0.9.0',
          releaseDate: '2024-12-01',
          releaseNotes: 'Older version',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      service.enable();
      const update = await service.checkForUpdates();

      expect(update).toBeNull();
    });
  });

  describe('Update Checking', () => {
    beforeEach(() => {
      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      service = AutoUpdateService.getInstance();
    });

    it('should not check for updates when disabled', async () => {
      service.disable();
      const update = await service.checkForUpdates();

      expect(update).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should make HTTP request with correct parameters', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          releaseDate: '2025-01-01',
          releaseNotes: 'Update',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      await service.checkForUpdates();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://updates.example.com/check',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"currentVersion":"1.0.0"'),
        })
      );
    });

    it('should include platform and architecture in request', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          releaseDate: '2025-01-01',
          releaseNotes: 'Update',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });

      await service.checkForUpdates();

      const fetchCall = (global.fetch as Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.platform).toBe('win32');
      expect(body.arch).toBe('x64');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

      const update = await service.checkForUpdates();

      expect(update).toBeNull();
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
      });

      const update = await service.checkForUpdates();

      expect(update).toBeNull();
    });
  });

  describe('Download and Install', () => {
    beforeEach(() => {
      service = AutoUpdateService.getInstance();
    });

    it('should open download URL in external browser', async () => {
      const updateInfo = {
        version: '2.0.0',
        releaseDate: '2025-01-01',
        releaseNotes: 'Major update',
        downloadUrl: 'https://example.com/download/v2.0.0',
        mandatory: false,
      };

      await service.downloadAndInstallUpdate(updateInfo);

      expect(mockElectronAPI.shellOpenExternal).toHaveBeenCalledWith(
        'https://example.com/download/v2.0.0'
      );
    });

    it('should show message box after opening download', async () => {
      const updateInfo = {
        version: '2.0.0',
        releaseDate: '2025-01-01',
        releaseNotes: 'Major update',
        downloadUrl: 'https://example.com/download/v2.0.0',
        mandatory: false,
      };

      await service.downloadAndInstallUpdate(updateInfo);

      expect(mockElectronAPI.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'Update Available',
        })
      );
    });

    it('should warn when not in Electron environment', async () => {
      // @ts-ignore
      global.window.electron = undefined;

      const updateInfo = {
        version: '2.0.0',
        releaseDate: '2025-01-01',
        releaseNotes: 'Major update',
        downloadUrl: 'https://example.com/download/v2.0.0',
        mandatory: false,
      };

      await service.downloadAndInstallUpdate(updateInfo);

      // Should not throw, just log warning
      expect(mockElectronAPI.shellOpenExternal).not.toHaveBeenCalled();
    });
  });

  describe('Platform Detection', () => {
    it('should detect Windows platform from electronEnv', () => {
      // @ts-ignore
      global.window.electronEnv = { platform: 'win32', arch: 'x64' };
      service = AutoUpdateService.getInstance();
      expect(service.getCurrentVersion()).toBeDefined();
    });

    it('should detect macOS platform from navigator', () => {
      // @ts-ignore
      global.window.electronEnv = undefined;
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      service = AutoUpdateService.getInstance();
      expect(service.getCurrentVersion()).toBeDefined();
    });

    it('should fallback to linux for unknown platforms', () => {
      // @ts-ignore
      global.window.electronEnv = undefined;
      Object.defineProperty(navigator, 'platform', {
        value: 'Unknown',
        configurable: true,
      });

      service = AutoUpdateService.getInstance();
      expect(service.getCurrentVersion()).toBeDefined();
    });
  });

  describe('Enable/Disable', () => {
    beforeEach(() => {
      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'false';
      service = AutoUpdateService.getInstance();
    });

    it('should enable updates and start checking', () => {
      service.enable();

      // Fast-forward initial check (30 seconds)
      vi.advanceTimersByTime(30000);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should disable updates and stop checking', () => {
      service.enable();
      vi.clearAllMocks();

      service.disable();

      // Fast-forward past check interval
      vi.advanceTimersByTime(3600000);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should support toggling enable/disable', () => {
      service.enable();
      service.disable();
      service.enable();

      vi.advanceTimersByTime(30000);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Current Version', () => {
    it('should return current version', () => {
      import.meta.env.VITE_APP_VERSION = '2.5.3';
      service = AutoUpdateService.getInstance();

      expect(service.getCurrentVersion()).toBe('2.5.3');
    });

    it('should use default version if not set', () => {
      import.meta.env.VITE_APP_VERSION = undefined;
      service = AutoUpdateService.getInstance();

      expect(service.getCurrentVersion()).toBe('1.0.0');
    });
  });

  describe('Periodic Update Checks', () => {
    beforeEach(() => {
      import.meta.env.VITE_ENABLE_AUTO_UPDATE = 'true';
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          releaseDate: '2025-01-01',
          releaseNotes: 'Update',
          downloadUrl: 'https://example.com/download',
          mandatory: false,
        }),
      });
    });

    it('should check for updates every hour when enabled', () => {
      service = AutoUpdateService.getInstance();
      vi.clearAllMocks();

      // Fast-forward 1 hour
      vi.advanceTimersByTime(3600000);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Fast-forward another hour
      vi.advanceTimersByTime(3600000);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should stop checking when disabled', () => {
      service = AutoUpdateService.getInstance();
      vi.clearAllMocks();

      service.stopUpdateCheck();

      // Fast-forward 2 hours
      vi.advanceTimersByTime(7200000);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
