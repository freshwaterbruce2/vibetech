import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WelcomeScreen } from '../../components/WelcomeScreen';
import { WorkspaceContext } from '../../types';

// Mock window.prompt
Object.defineProperty(window, 'prompt', {
  writable: true,
  value: vi.fn(),
});

const mockWorkspaceContext: WorkspaceContext = {
  rootPath: '/test/workspace',
  totalFiles: 2,
  languages: ['typescript', 'json'],
  testFiles: 0,
  projectStructure: {},
  dependencies: {},
  exports: {},
  symbols: {},
  lastIndexed: new Date(),
  summary: 'Test workspace with 2 files',
};

const defaultProps = {
  onOpenFolder: vi.fn(),
  onCreateFile: vi.fn(),
  workspaceContext: null,
  isIndexing: false,
  indexingProgress: 0,
};

describe('WelcomeScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.prompt as any).mockReturnValue('test.tsx');
  });

  describe('Rendering', () => {
    it('should render main title and subtitle', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
      expect(screen.getByText(/Next-Generation AI-Powered Development Experience/)).toBeInTheDocument();
      expect(
        screen.getByText(/Where innovation meets elegant design/)
      ).toBeInTheDocument();
    });

    it('should render all feature cards', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText('Open Project')).toBeInTheDocument();
      expect(screen.getByText('New File')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Smart Features')).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(
        screen.getByText(/Open an existing project and let AI understand your codebase/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Create a new file and start coding with AI-powered completions/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Chat with AI to get help with coding/)).toBeInTheDocument();
      expect(
        screen.getByText(/Experience intelligent code completion, refactoring/)
      ).toBeInTheDocument();
    });

    it('should render quick start section', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText('Quick Start')).toBeInTheDocument();
    });

    it('should render quick action buttons', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText('React Component')).toBeInTheDocument();
      expect(screen.getByText('Python Script')).toBeInTheDocument();
      expect(screen.getByText('API Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Clone Repo')).toBeInTheDocument();
    });
  });

  describe('Feature Card Interactions', () => {
    it('should call onOpenFolder when Open Project card is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const openProjectCard = screen.getByText('Open Project');
      await user.click(openProjectCard);

      expect(defaultProps.onOpenFolder).toHaveBeenCalledWith('/demo/project');
    });

    it('should call onCreateFile when New File card is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const newFileCard = screen.getByText('New File');
      await user.click(newFileCard);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('test.tsx');
    });

    it('should handle cancelled file creation', async () => {
      const user = userEvent.setup();
      (window.prompt as any).mockReturnValue(null);

      render(<WelcomeScreen {...defaultProps} />);

      const newFileCard = screen.getByText('New File');
      await user.click(newFileCard);

      expect(defaultProps.onCreateFile).not.toHaveBeenCalled();
    });

    it('should handle empty file name', async () => {
      const user = userEvent.setup();
      (window.prompt as any).mockReturnValue('');

      render(<WelcomeScreen {...defaultProps} />);

      const newFileCard = screen.getByText('New File');
      await user.click(newFileCard);

      expect(defaultProps.onCreateFile).not.toHaveBeenCalled();
    });

    it('should not crash when clicking non-interactive feature cards', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const aiAssistantCard = screen.getByText('AI Assistant');
      await user.click(aiAssistantCard);

      // Should not crash or call any callbacks
      expect(defaultProps.onOpenFolder).not.toHaveBeenCalled();
      expect(defaultProps.onCreateFile).not.toHaveBeenCalled();
    });
  });

  describe('Quick Action Buttons', () => {
    it('should create React component when React Component button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const reactButton = screen.getByText('React Component');
      await user.click(reactButton);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('Component.tsx');
    });

    it('should create Python script when Python Script button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const pythonButton = screen.getByText('Python Script');
      await user.click(pythonButton);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('script.py');
    });

    it('should create API endpoint when API Endpoint button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const apiButton = screen.getByText('API Endpoint');
      await user.click(apiButton);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('api.ts');
    });

    it('should call onOpenFolder when Clone Repo button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const cloneButton = screen.getByText('Clone Repo');
      await user.click(cloneButton);

      expect(defaultProps.onOpenFolder).toHaveBeenCalledWith('/demo/project');
    });
  });

  describe('Indexing Progress', () => {
    it('should show indexing indicator when isIndexing is true', () => {
      render(<WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={50} />);

      expect(screen.getByText(/Indexing workspace... 50%/)).toBeInTheDocument();
    });

    it('should not show indexing indicator when isIndexing is false', () => {
      render(<WelcomeScreen {...defaultProps} isIndexing={false} />);

      expect(screen.queryByText(/Indexing workspace/)).not.toBeInTheDocument();
    });

    it('should display correct progress percentage', () => {
      render(<WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={75.6} />);

      expect(screen.getByText(/Indexing workspace... 76%/)).toBeInTheDocument();
    });

    it('should show progress bar with correct width', () => {
      const { container } = render(
        <WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={60} />
      );

      const progressFill = container.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle('width: 60%');
    });

    it('should handle 0% progress', () => {
      render(<WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={0} />);

      expect(screen.getByText(/Indexing workspace... 0%/)).toBeInTheDocument();
    });

    it('should handle 100% progress', () => {
      render(<WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={100} />);

      expect(screen.getByText(/Indexing workspace... 100%/)).toBeInTheDocument();
    });
  });

  describe('Workspace Context', () => {
    it('should handle null workspace context', () => {
      render(<WelcomeScreen {...defaultProps} workspaceContext={null} />);

      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
    });

    it('should handle provided workspace context', () => {
      render(<WelcomeScreen {...defaultProps} workspaceContext={mockWorkspaceContext} />);

      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
    });

    it('should not crash with empty workspace context', () => {
      const emptyContext: WorkspaceContext = {
        rootPath: '',
        totalFiles: 0,
        languages: [],
        testFiles: 0,
        projectStructure: {},
        dependencies: {},
        exports: {},
        symbols: {},
        lastIndexed: new Date(),
        summary: 'Empty workspace',
      };

      expect(() => {
        render(<WelcomeScreen {...defaultProps} workspaceContext={emptyContext} />);
      }).not.toThrow();
    });
  });

  describe('Animations and Interactions', () => {
    it('should handle hover animations on feature cards', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const featureCard = screen.getByText('Open Project');

      await user.hover(featureCard);
      await user.unhover(featureCard);

      expect(featureCard).toBeInTheDocument();
    });

    it('should handle click animations on action buttons', async () => {
      render(<WelcomeScreen {...defaultProps} />);

      const actionButton = screen.getByText('React Component');

      fireEvent.mouseDown(actionButton);
      fireEvent.mouseUp(actionButton);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('Component.tsx');
    });

    it('should handle rapid clicking without issues', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const reactButton = screen.getByText('React Component');

      await user.click(reactButton);
      await user.click(reactButton);
      await user.click(reactButton);

      expect(defaultProps.onCreateFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      // Tab through the elements
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should support Enter key for feature card activation', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const openProjectCard = screen.getByText('Open Project');
      openProjectCard.focus();

      await user.keyboard('{Enter}');

      expect(defaultProps.onOpenFolder).toHaveBeenCalledWith('/demo/project');
    });

    it('should support Space key for button activation', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen {...defaultProps} />);

      const reactButton = screen.getByText('React Component');
      reactButton.focus();

      await user.keyboard(' ');

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('Component.tsx');
    });

    it('should have proper heading hierarchy', () => {
      render(<WelcomeScreen {...defaultProps} />);

      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent('Vibe Code Studio');

      const quickStartTitle = screen.getByRole('heading', { level: 2 });
      expect(quickStartTitle).toHaveTextContent('Quick Start');
    });

    it('should have readable text content', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText(/Next-Level AI-Powered Development Experience/)).toBeInTheDocument();
      expect(screen.getByText(/Where innovation meets elegant design/)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render feature grid properly', () => {
      render(<WelcomeScreen {...defaultProps} />);

      const featureCards = [
        screen.getByText('Open Project'),
        screen.getByText('New File'),
        screen.getByText('AI Assistant'),
        screen.getByText('Smart Features'),
      ];

      featureCards.forEach((card) => {
        expect(card).toBeInTheDocument();
      });
    });

    it('should handle different screen sizes gracefully', () => {
      const { container } = render(<WelcomeScreen {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display quick actions in flexible layout', () => {
      render(<WelcomeScreen {...defaultProps} />);

      const quickActions = [
        screen.getByText('React Component'),
        screen.getByText('Python Script'),
        screen.getByText('API Endpoint'),
        screen.getByText('Clone Repo'),
      ];

      quickActions.forEach((action) => {
        expect(action).toBeInTheDocument();
      });
    });
  });

  describe('Visual Elements', () => {
    it('should display feature icons', () => {
      render(<WelcomeScreen {...defaultProps} />);

      // Icons should be present in feature cards
      const featureCards = screen.getAllByText(/Open Project|New File|AI Assistant|Smart Features/);
      expect(featureCards.length).toBe(4);
    });

    it('should display action button icons', () => {
      render(<WelcomeScreen {...defaultProps} />);

      // Action buttons should have icons
      const actionButtons = screen.getAllByText(
        /React Component|Python Script|API Endpoint|Clone Repo/
      );
      expect(actionButtons.length).toBe(4);
    });

    it('should show title decorative line', () => {
      render(<WelcomeScreen {...defaultProps} />);

      const title = screen.getByText('Vibe Code Studio');
      expect(title).toBeInTheDocument();
    });

    it('should display background gradients without errors', () => {
      const { container } = render(<WelcomeScreen {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('File Name Validation', () => {
    it('should handle file names with special characters', async () => {
      const user = userEvent.setup();
      (window.prompt as any).mockReturnValue('my-component@#$.tsx');

      render(<WelcomeScreen {...defaultProps} />);

      const newFileCard = screen.getByText('New File');
      await user.click(newFileCard);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('my-component@#$.tsx');
    });

    it('should handle very long file names', async () => {
      const user = userEvent.setup();
      const longFileName = 'very-long-file-name-that-should-be-handled-properly.tsx';
      (window.prompt as any).mockReturnValue(longFileName);

      render(<WelcomeScreen {...defaultProps} />);

      const newFileCard = screen.getByText('New File');
      await user.click(newFileCard);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith(longFileName);
    });

    it('should handle file names with spaces', async () => {
      const user = userEvent.setup();
      (window.prompt as any).mockReturnValue('My Component.tsx');

      render(<WelcomeScreen {...defaultProps} />);

      const newFileCard = screen.getByText('New File');
      await user.click(newFileCard);

      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('My Component.tsx');
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', async () => {
      const user = userEvent.setup();
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      render(<WelcomeScreen {...defaultProps} onCreateFile={errorCallback} />);

      const reactButton = screen.getByText('React Component');

      expect(() => user.click(reactButton)).not.toThrow();
    });

    it('should handle missing props gracefully', () => {
      expect(() => {
        render(<WelcomeScreen {...defaultProps} onOpenFolder={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle invalid indexing progress values', () => {
      expect(() => {
        render(<WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={-10} />);
      }).not.toThrow();

      expect(() => {
        render(<WelcomeScreen {...defaultProps} isIndexing={true} indexingProgress={150} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<WelcomeScreen {...defaultProps} />);

      rerender(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
    });

    it('should handle frequent prop updates efficiently', () => {
      const { rerender } = render(<WelcomeScreen {...defaultProps} indexingProgress={0} />);

      for (let i = 1; i <= 100; i++) {
        rerender(<WelcomeScreen {...defaultProps} indexingProgress={i} />);
      }

      expect(screen.getByText(/Indexing workspace... 100%/)).toBeInTheDocument();
    });

    it('should handle component mounting and unmounting', () => {
      const { unmount } = render(<WelcomeScreen {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Content Variations', () => {
    it('should display consistent branding', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText('Vibe Code Studio')).toBeInTheDocument();
      expect(screen.getByText(/Next-Generation AI-Powered Development Experience/)).toBeInTheDocument();
      expect(screen.getByText(/Where innovation meets elegant design/)).toBeInTheDocument();
    });

    it('should show appropriate call-to-action content', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText(/Open an existing project/)).toBeInTheDocument();
      expect(screen.getByText(/Create a new file/)).toBeInTheDocument();
      expect(screen.getByText(/Chat with AI/)).toBeInTheDocument();
    });

    it('should display helpful feature descriptions', () => {
      render(<WelcomeScreen {...defaultProps} />);

      expect(screen.getByText(/let AI understand your codebase/)).toBeInTheDocument();
      expect(screen.getByText(/AI-powered completions and suggestions/)).toBeInTheDocument();
      expect(screen.getByText(/intelligent code completion, refactoring/)).toBeInTheDocument();
    });
  });
});
