import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Import components that don't depend on Monaco Editor
import Sidebar from '@/components/Sidebar';
import StatusBar from '@/components/StatusBar';
import WelcomeScreen from '@/components/WelcomeScreen';
import { Notification, NotificationContainer } from '@/components/Notification';
import Settings from '@/components/Settings';

// Mock complex dependencies
vi.mock('@/services/DeepSeekService');
vi.mock('@/services/FileSystemService');
vi.mock('@/services/GitService');

describe('Basic Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar Component', () => {
    const mockProps = {
      isOpen: true,
      onToggle: vi.fn(),
      files: [
        { name: 'test.ts', path: '/test.ts', type: 'file' as const },
        { name: 'components', path: '/components', type: 'directory' as const }
      ],
      onFileSelect: vi.fn(),
      onFileCreate: vi.fn(),
      onFileDelete: vi.fn(),
      onFileRename: vi.fn(),
      selectedFile: null,
      workspaceRoot: '/workspace'
    };

    it('should render sidebar with file tree', () => {
      render(<Sidebar {...mockProps} />);
      
      expect(screen.getByText('Explorer')).toBeInTheDocument();
      expect(screen.getByText('test.ts')).toBeInTheDocument();
      expect(screen.getByText('components')).toBeInTheDocument();
    });

    it('should handle file selection', () => {
      render(<Sidebar {...mockProps} />);
      
      const fileElement = screen.getByText('test.ts');
      fireEvent.click(fileElement);
      
      expect(mockProps.onFileSelect).toHaveBeenCalledWith('/test.ts');
    });

    it('should show context menu on right click', () => {
      render(<Sidebar {...mockProps} />);
      
      const fileElement = screen.getByText('test.ts');
      fireEvent.contextMenu(fileElement);
      
      // Check if context menu appears
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should handle workspace root display', () => {
      render(<Sidebar {...mockProps} />);
      
      expect(screen.getByText('workspace')).toBeInTheDocument();
    });
  });

  describe('StatusBar Component', () => {
    it('should render status bar without file', () => {
      render(<StatusBar />);
      
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should display file information', () => {
      const currentFile = {
        name: 'test.ts',
        path: '/test.ts',
        content: 'const test = 1;',
        saved: true,
        language: 'typescript'
      };

      render(
        <StatusBar 
          currentFile={currentFile}
          cursorPosition={{ line: 1, column: 5 }}
        />
      );
      
      expect(screen.getByText('test.ts')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Ln 1, Col 5')).toBeInTheDocument();
    });

    it('should show modified indicator for unsaved files', () => {
      const currentFile = {
        name: 'test.ts',
        path: '/test.ts',
        content: 'const test = 1;',
        saved: false,
        language: 'typescript'
      };

      render(<StatusBar currentFile={currentFile} />);
      
      expect(screen.getByText('●')).toBeInTheDocument(); // Modified indicator
    });
  });

  describe('WelcomeScreen Component', () => {
    const mockProps = {
      onOpenFolder: vi.fn(),
      onNewFile: vi.fn(),
      recentProjects: [
        { name: 'Recent Project 1', path: '/path/to/project1' },
        { name: 'Recent Project 2', path: '/path/to/project2' }
      ]
    };

    it('should render welcome screen', () => {
      render(<WelcomeScreen {...mockProps} />);
      
      expect(screen.getByText('Welcome to DeepCode Editor')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should display recent projects', () => {
      render(<WelcomeScreen {...mockProps} />);
      
      expect(screen.getByText('Recent Projects')).toBeInTheDocument();
      expect(screen.getByText('Recent Project 1')).toBeInTheDocument();
      expect(screen.getByText('Recent Project 2')).toBeInTheDocument();
    });

    it('should handle open folder action', () => {
      render(<WelcomeScreen {...mockProps} />);
      
      const openFolderButton = screen.getByText('Open Folder');
      fireEvent.click(openFolderButton);
      
      expect(mockProps.onOpenFolder).toHaveBeenCalled();
    });

    it('should handle new file action', () => {
      render(<WelcomeScreen {...mockProps} />);
      
      const newFileButton = screen.getByText('New File');
      fireEvent.click(newFileButton);
      
      expect(mockProps.onNewFile).toHaveBeenCalled();
    });

    it('should show getting started tips', () => {
      render(<WelcomeScreen {...mockProps} />);
      
      expect(screen.getByText(/Start coding/)).toBeInTheDocument();
      expect(screen.getByText(/AI assistance/)).toBeInTheDocument();
    });
  });

  describe('Notification System', () => {
    it('should render notification', () => {
      const notification = {
        id: 'test-1',
        type: 'info' as const,
        message: 'Test notification',
        timestamp: Date.now()
      };

      render(<Notification notification={notification} onDismiss={vi.fn()} />);
      
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    it('should handle notification dismissal', () => {
      const onDismiss = vi.fn();
      const notification = {
        id: 'test-1',
        type: 'info' as const,
        message: 'Test notification',
        timestamp: Date.now()
      };

      render(<Notification notification={notification} onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledWith('test-1');
    });

    it('should render notification container', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'info' as const,
          message: 'Info notification',
          timestamp: Date.now()
        },
        {
          id: 'test-2',
          type: 'error' as const,
          message: 'Error notification',
          timestamp: Date.now()
        }
      ];

      render(<NotificationContainer notifications={notifications} onDismiss={vi.fn()} />);
      
      expect(screen.getByText('Info notification')).toBeInTheDocument();
      expect(screen.getByText('Error notification')).toBeInTheDocument();
    });
  });

  describe('Settings Component', () => {
    const mockProps = {
      isOpen: true,
      onClose: vi.fn(),
      settings: {
        theme: 'dark' as const,
        fontSize: 14,
        tabSize: 2,
        autoSave: true,
        wordWrap: false,
        minimap: true,
        lineNumbers: true,
        aiModel: 'deepseek-chat',
        aiTemperature: 0.7,
        aiMaxTokens: 2048
      },
      onSettingsChange: vi.fn()
    };

    it('should render settings dialog', () => {
      render(<Settings {...mockProps} />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('should display current settings values', () => {
      render(<Settings {...mockProps} />);
      
      expect(screen.getByDisplayValue('14')).toBeInTheDocument(); // fontSize
      expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // tabSize
    });

    it('should handle settings changes', () => {
      render(<Settings {...mockProps} />);
      
      const fontSizeInput = screen.getByDisplayValue('14');
      fireEvent.change(fontSizeInput, { target: { value: '16' } });
      
      expect(mockProps.onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ fontSize: 16 })
      );
    });

    it('should handle dialog close', () => {
      render(<Settings {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should handle theme switching across components', () => {
      const settings = {
        theme: 'light' as const,
        fontSize: 14,
        tabSize: 2,
        autoSave: true,
        wordWrap: false,
        minimap: true,
        lineNumbers: true,
        aiModel: 'deepseek-chat',
        aiTemperature: 0.7,
        aiMaxTokens: 2048
      };

      render(
        <div>
          <StatusBar />
          <Settings
            isOpen={true}
            onClose={vi.fn()}
            settings={settings}
            onSettingsChange={vi.fn()}
          />
        </div>
      );
      
      // Both components should render without theme conflicts
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle file operations across components', () => {
      const mockFile = { name: 'test.ts', path: '/test.ts', type: 'file' as const };
      const onFileSelect = vi.fn();

      render(
        <div>
          <Sidebar
            isOpen={true}
            onToggle={vi.fn()}
            files={[mockFile]}
            onFileSelect={onFileSelect}
            onFileCreate={vi.fn()}
            onFileDelete={vi.fn()}
            onFileRename={vi.fn()}
            selectedFile={null}
            workspaceRoot="/workspace"
          />
          <StatusBar
            currentFile={{
              name: 'test.ts',
              path: '/test.ts',
              content: '',
              saved: true,
              language: 'typescript'
            }}
          />
        </div>
      );
      
      const fileElement = screen.getByText('test.ts');
      fireEvent.click(fileElement);
      
      expect(onFileSelect).toHaveBeenCalledWith('/test.ts');
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });
});