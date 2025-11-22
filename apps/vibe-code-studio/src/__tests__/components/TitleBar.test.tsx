import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import TitleBar from '../../components/TitleBar';
import { ElectronService } from '../../services/ElectronService';

// Mock ElectronService
vi.mock('../../services/ElectronService');
const MockedElectronService = ElectronService as any;

// Mock document methods for fullscreen API
const mockRequestFullscreen = vi.fn();
const mockExitFullscreen = vi.fn();
Object.defineProperty(document.documentElement, 'requestFullscreen', {
  value: mockRequestFullscreen,
  writable: true,
});
Object.defineProperty(document, 'exitFullscreen', {
  value: mockExitFullscreen,
  writable: true,
});

// Mock window methods
const mockAlert = vi.fn();
const mockConfirm = vi.fn();
const mockClose = vi.fn();
Object.defineProperty(window, 'alert', { value: mockAlert, writable: true });
Object.defineProperty(window, 'confirm', { value: mockConfirm, writable: true });
Object.defineProperty(window, 'close', { value: mockClose, writable: true });

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
console.log = vi.fn();

describe('TitleBar Component', () => {
  let mockElectronService: any;
  const defaultProps = {
    onSettingsClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock instance
    mockElectronService = {
      isElectron: false,
      minimizeWindow: vi.fn(),
      maximizeWindow: vi.fn(),
      closeWindow: vi.fn(),
      openFolderDialog: vi.fn(),
      saveFileDialog: vi.fn(),
      saveFile: vi.fn(),
      getVersion: vi.fn(),
      getSystemInfo: vi.fn(),
    } as any;

    MockedElectronService.mockImplementation(() => mockElectronService);
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  describe('Rendering', () => {
    it('should render title bar with all sections', () => {
      render(<TitleBar {...defaultProps} />);

      // Check main sections exist
      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek AI Ready')).toBeInTheDocument();

      // Check action buttons
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should display status indicator with online status', () => {
      render(<TitleBar {...defaultProps} />);

      const statusIndicator = screen.getByText('DeepSeek AI Ready');
      expect(statusIndicator).toBeInTheDocument();

      // Check for status dot (should be green for online)
      const statusContainer = statusIndicator.closest('div');
      expect(statusContainer).toBeInTheDocument();
    });

    it('should render without onSettingsClick prop', () => {
      render(<TitleBar />);

      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onSettingsClick when settings button is clicked', async () => {
      render(<TitleBar {...defaultProps} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      expect(defaultProps.onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('should log message when settings clicked without handler', async () => {
      render(<TitleBar />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      expect(console.log).toHaveBeenCalledWith('Settings clicked - no handler provided');
    });

    it('should log message when menu button is clicked', async () => {
      render(<TitleBar {...defaultProps} />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      await userEvent.click(menuButton);

      expect(console.log).toHaveBeenCalledWith('Menu clicked - feature coming soon');
    });
  });

  describe('Window Controls - Electron Mode', () => {
    beforeEach(() => {
      mockElectronService.isElectron = true;
    });

    it('should call minimize window in Electron', async () => {
      render(<TitleBar {...defaultProps} />);

      const minimizeButton = screen.getByRole('button', { name: /minimize/i });
      await userEvent.click(minimizeButton);

      expect(mockElectronService.minimizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should call maximize window in Electron', async () => {
      render(<TitleBar {...defaultProps} />);

      const maximizeButton = screen.getByRole('button', { name: /maximize/i });
      await userEvent.click(maximizeButton);

      expect(mockElectronService.maximizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should call close window in Electron', async () => {
      render(<TitleBar {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      expect(mockElectronService.closeWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Window Controls - Web Mode', () => {
    beforeEach(() => {
      mockElectronService.isElectron = false;
    });

    it('should log message for minimize in web mode', async () => {
      render(<TitleBar {...defaultProps} />);

      const minimizeButton = screen.getByRole('button', { name: /minimize/i });
      await userEvent.click(minimizeButton);

      expect(console.log).toHaveBeenCalledWith('Minimize not available in web mode');
    });

    it('should request fullscreen when not in fullscreen mode', async () => {
      // Mock not being in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
      });

      render(<TitleBar {...defaultProps} />);

      const maximizeButton = screen.getByRole('button', { name: /maximize/i });
      await userEvent.click(maximizeButton);

      expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should exit fullscreen when in fullscreen mode', async () => {
      // Mock being in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
      });

      render(<TitleBar {...defaultProps} />);

      const maximizeButton = screen.getByRole('button', { name: /maximize/i });
      await userEvent.click(maximizeButton);

      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should show confirm dialog and close if confirmed', async () => {
      mockConfirm.mockReturnValue(true);

      render(<TitleBar {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to close DeepCode Editor?');
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should not close if user cancels confirmation', async () => {
      mockConfirm.mockReturnValue(false);

      render(<TitleBar {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to close DeepCode Editor?');
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Accessibility', () => {
    it('should have drag regions properly configured', () => {
      render(<TitleBar {...defaultProps} />);

      const titleBar = screen.getByText('Vibe Code Studio').closest('div');
      expect(titleBar).toHaveStyle('-webkit-app-region: drag');
    });

    it('should have no-drag regions for interactive elements', () => {
      render(<TitleBar {...defaultProps} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      const buttonSection = settingsButton.closest('div');
      expect(buttonSection).toHaveStyle('-webkit-app-region: no-drag');
    });

    it('should be keyboard accessible', async () => {
      render(<TitleBar {...defaultProps} />);

      // Tab through buttons
      await userEvent.tab();
      expect(screen.getByRole('button', { name: /menu/i })).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByRole('button', { name: /settings/i })).toHaveFocus();
    });

    it('should handle button hover states', async () => {
      render(<TitleBar {...defaultProps} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.hover(settingsButton);

      // Button should have hover styles applied
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle ElectronService errors gracefully', async () => {
      mockElectronService.isElectron = true;
      mockElectronService.minimizeWindow.mockRejectedValue(new Error('Electron error'));

      render(<TitleBar {...defaultProps} />);

      const minimizeButton = screen.getByRole('button', { name: /minimize/i });

      // Should not throw error
      await expect(userEvent.click(minimizeButton)).resolves.not.toThrow();
    });

    it('should handle fullscreen API errors in web mode', async () => {
      mockRequestFullscreen.mockRejectedValue(new Error('Fullscreen error'));

      render(<TitleBar {...defaultProps} />);

      const maximizeButton = screen.getByRole('button', { name: /maximize/i });

      // Should not throw error
      await expect(userEvent.click(maximizeButton)).resolves.not.toThrow();
    });
  });

  describe('Component State', () => {
    it('should maintain ElectronService instance', () => {
      render(<TitleBar {...defaultProps} />);

      // Component should create ElectronService instance
      expect(MockedElectronService).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid button clicks', async () => {
      render(<TitleBar {...defaultProps} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });

      // Click multiple times rapidly
      await userEvent.click(settingsButton);
      await userEvent.click(settingsButton);
      await userEvent.click(settingsButton);

      expect(defaultProps.onSettingsClick).toHaveBeenCalledTimes(3);
    });
  });
});
