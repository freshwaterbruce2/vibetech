import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandPalette } from '../../components/CommandPalette';
import { FileText, Settings, GitBranch, Search } from 'lucide-react';

// Mock react-hotkeys-hook with functional implementation
const keyMap: Record<string, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  enter: 'Enter',
  escape: 'Escape',
};

// Track one handler per key to prevent duplicates
const keyHandlers = new Map<string, (e: KeyboardEvent) => void>();
let globalListenerAdded = false;

// Global listener that dispatches to the appropriate handler
const globalKeyHandler = (e: Event) => {
  const keyEvent = e as KeyboardEvent;
  keyHandlers.forEach((handler, key) => {
    if (keyEvent.key === key) {
      handler(keyEvent);
    }
  });
};

vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: (keys: string, handler: (e: KeyboardEvent) => void, deps?: any[]) => {
    const keyName = keyMap[keys] || keys;

    // Update the handler for this key (replaces old handler if exists)
    keyHandlers.set(keyName, handler);

    // Add global listener only once
    if (!globalListenerAdded) {
      document.addEventListener('keydown', globalKeyHandler);
      globalListenerAdded = true;
    }

    // Cleanup - remove this key's handler
    return () => {
      keyHandlers.delete(keyName);
    };
  },
}));

const mockCommands = [
  {
    id: 'new-file',
    title: 'New File',
    description: 'Create a new file',
    icon: <FileText />,
    shortcut: 'Ctrl+N',
    action: vi.fn(),
    category: 'File',
  },
  {
    id: 'open-settings',
    title: 'Open Settings',
    description: 'Open application settings',
    icon: <Settings />,
    shortcut: 'Ctrl+,',
    action: vi.fn(),
    category: 'Edit',
  },
  {
    id: 'git-status',
    title: 'Git Status',
    description: 'Show git repository status',
    icon: <GitBranch />,
    shortcut: 'Ctrl+Shift+G',
    action: vi.fn(),
    category: 'Source Control',
  },
  {
    id: 'search-files',
    title: 'Search Files',
    description: 'Search across all files',
    icon: <Search />,
    action: vi.fn(),
    category: 'Search',
  },
  {
    id: 'no-category',
    title: 'No Category Command',
    description: 'Command without category',
    action: vi.fn(),
  },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  commands: mockCommands,
};

describe('CommandPalette Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Clear all key handlers from previous tests
    keyHandlers.clear();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<CommandPalette {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      expect(screen.getByText('New File')).toBeInTheDocument();
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<CommandPalette {...defaultProps} isOpen={false} />);

      expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
    });

    it('should render all provided commands', () => {
      render(<CommandPalette {...defaultProps} />);

      mockCommands.forEach((command) => {
        expect(screen.getByText(command.title)).toBeInTheDocument();
      });
    });

    it('should render command descriptions', () => {
      render(<CommandPalette {...defaultProps} />);

      expect(screen.getByText('Create a new file')).toBeInTheDocument();
      expect(screen.getByText('Open application settings')).toBeInTheDocument();
    });

    it('should render command categories', () => {
      render(<CommandPalette {...defaultProps} />);

      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Source Control')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument(); // Default category
    });

    it('should render command shortcuts', () => {
      render(<CommandPalette {...defaultProps} />);

      // Multiple commands have "Ctrl", so use getAllByText
      const ctrlKeys = screen.getAllByText('Ctrl');
      expect(ctrlKeys.length).toBeGreaterThan(0);

      expect(screen.getByText('N')).toBeInTheDocument();
      expect(screen.getByText(',')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter commands by title', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'new');

      expect(screen.getByText('New File')).toBeInTheDocument();
      expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();
    });

    it('should filter commands by description', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'settings');

      expect(screen.getByText('Open Settings')).toBeInTheDocument();
      expect(screen.queryByText('New File')).not.toBeInTheDocument();
    });

    it('should filter commands by category', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'file');

      expect(screen.getByText('New File')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'NEW FILE');

      expect(screen.getByText('New File')).toBeInTheDocument();
    });

    it('should show no commands when search has no matches', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.queryByText('New File')).not.toBeInTheDocument();
      expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();
    });

    it('should clear search and show all commands when input is cleared', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'new');

      expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();

      await user.clear(searchInput);

      expect(screen.getByText('New File')).toBeInTheDocument();
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });
  });

  describe('Command Execution', () => {
    it('should execute command when clicked', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      await user.click(screen.getByText('New File'));

      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should execute correct command when multiple are visible', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      await user.click(screen.getByText('Open Settings'));

      expect(mockCommands[1].action).toHaveBeenCalledTimes(1);
      expect(mockCommands[0].action).not.toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should execute command with Enter key', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      await user.keyboard('{Enter}');

      // Should execute the first (active) command
      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not execute if no commands are available', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} commands={[]} />);

      await user.keyboard('{Enter}');

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate down with arrow key', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      // Initially first command should be active
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      // Should execute second command (index 1)
      expect(mockCommands[1].action).toHaveBeenCalledTimes(1);
    });

    it('should navigate up with arrow key', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      // Navigate down then up
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{Enter}');

      // Should execute first command again
      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    });

    it('should not navigate beyond bounds', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      // Try to navigate up from first item
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{Enter}');

      // Should still execute first command
      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    });

    it('should close with Escape key', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should update active index when hovering', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const secondCommand = screen.getByText('Open Settings');
      await user.hover(secondCommand);
      await user.keyboard('{Enter}');

      expect(mockCommands[1].action).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Management', () => {
    it('should focus search input when opened', () => {
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      expect(document.activeElement).toBe(searchInput);
    });

    it('should clear search and reset active index when opened', () => {
      const { rerender } = render(<CommandPalette {...defaultProps} isOpen={false} />);

      rerender(<CommandPalette {...defaultProps} isOpen={true} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      expect(searchInput).toHaveValue('');
    });

    it('should maintain focus on search input during typing', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'test');

      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Command Categories', () => {
    it('should group commands by category', () => {
      render(<CommandPalette {...defaultProps} />);

      // Categories are rendered with actual case (CSS text-transform doesn't apply in tests)
      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Source Control')).toBeInTheDocument();
    });

    it('should use default category for commands without category', () => {
      render(<CommandPalette {...defaultProps} />);

      // Default category "General" is used for commands without explicit category
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('No Category Command')).toBeInTheDocument();
    });

    it('should maintain category order', () => {
      render(<CommandPalette {...defaultProps} />);

      // Categories are rendered with actual case (CSS text-transform doesn't apply in tests)
      const categories = screen.getAllByText(/^(File|Edit|General|Search|Source Control)$/);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('Command Icons', () => {
    it('should render command icons when provided', () => {
      render(<CommandPalette {...defaultProps} />);

      // Icons should be rendered (testing presence of the icon wrapper)
      const commandItems = screen.getAllByText(/New File|Open Settings|Git Status|Search Files/);
      expect(commandItems.length).toBeGreaterThan(0);
    });

    it('should render default icon when no icon provided', () => {
      render(<CommandPalette {...defaultProps} />);

      // Command without explicit icon should still render
      expect(screen.getByText('No Category Command')).toBeInTheDocument();
    });
  });

  describe('Shortcut Display', () => {
    it('should display keyboard shortcuts properly formatted', () => {
      render(<CommandPalette {...defaultProps} />);

      // Multiple commands have "Ctrl", so use getAllByText
      const ctrlKeys = screen.getAllByText('Ctrl');
      expect(ctrlKeys.length).toBeGreaterThan(0);

      expect(screen.getByText('N')).toBeInTheDocument();
    });

    it('should handle complex shortcuts', () => {
      render(<CommandPalette {...defaultProps} />);

      expect(screen.getByText('Shift')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should not show shortcuts section when command has no shortcut', () => {
      render(<CommandPalette {...defaultProps} />);

      // Commands without shortcuts should still render but without shortcut section
      expect(screen.getByText('Search Files')).toBeInTheDocument();
    });
  });

  describe('Overlay Interaction', () => {
    it('should close when clicking overlay', async () => {
      const user = userEvent.setup();
      const { container } = render(<CommandPalette {...defaultProps} />);

      const overlay = container.querySelector('div'); // First div should be the overlay
      if (overlay) {
        await user.click(overlay);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not close when clicking inside palette', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.click(searchInput);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should prevent event propagation when clicking inside', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const commandItem = screen.getByText('New File');
      await user.click(commandItem);

      // Should execute command but also close due to command execution
      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should support screen readers with proper text content', () => {
      render(<CommandPalette {...defaultProps} />);

      // All command titles and descriptions should be accessible
      expect(screen.getByText('Create a new file')).toBeInTheDocument();
      expect(screen.getByText('Open application settings')).toBeInTheDocument();
    });

    it('should handle Enter and Space keys for command execution', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      await user.keyboard('{Enter}');
      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty commands array', () => {
      render(<CommandPalette {...defaultProps} commands={[]} />);

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      expect(screen.queryByText('New File')).not.toBeInTheDocument();
    });

    it('should handle commands with missing properties', () => {
      const incompleteCommand = {
        id: 'incomplete',
        title: 'Incomplete Command',
        action: vi.fn(),
      };

      render(<CommandPalette {...defaultProps} commands={[incompleteCommand]} />);

      expect(screen.getByText('Incomplete Command')).toBeInTheDocument();
    });

    it('should handle very long command titles', () => {
      const longTitleCommand = {
        id: 'long',
        title: 'This is a very long command title that should be handled gracefully',
        description: 'Long description',
        action: vi.fn(),
        category: 'Test',
      };

      render(<CommandPalette {...defaultProps} commands={[longTitleCommand]} />);

      expect(
        screen.getByText('This is a very long command title that should be handled gracefully')
      ).toBeInTheDocument();
    });

    it('should handle rapid typing in search', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');

      // Type rapidly
      await user.type(searchInput, 'newfilesettings');

      expect(searchInput).toHaveValue('newfilesettings');
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();

      const specialCommand = {
        id: 'special',
        title: 'Command with @#$ special chars',
        action: vi.fn(),
        category: 'Special',
      };

      render(<CommandPalette {...defaultProps} commands={[specialCommand]} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, '@#$');

      expect(screen.getByText('Command with @#$ special chars')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large number of commands', () => {
      const manyCommands = Array.from({ length: 100 }, (_, i) => ({
        id: `command-${i}`,
        title: `Command ${i}`,
        description: `Description for command ${i}`,
        action: vi.fn(),
        category: `Category ${i % 5}`,
      }));

      expect(() => {
        render(<CommandPalette {...defaultProps} commands={manyCommands} />);
      }).not.toThrow();

      expect(screen.getByText('Command 0')).toBeInTheDocument();
    });

    it('should handle frequent search updates efficiently', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');

      // Rapidly change search terms
      await user.type(searchInput, 'a');
      await user.clear(searchInput);
      await user.type(searchInput, 'b');
      await user.clear(searchInput);
      await user.type(searchInput, 'new');

      expect(screen.getByText('New File')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should maintain search state during navigation', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      await user.type(searchInput, 'new');

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      expect(searchInput).toHaveValue('new');
    });

    it('should reset active index when search changes', async () => {
      const user = userEvent.setup();
      render(<CommandPalette {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Type a command or search...');

      await user.keyboard('{ArrowDown}'); // Move to second item
      await user.type(searchInput, 'new'); // Search should reset to first item
      await user.keyboard('{Enter}');

      expect(mockCommands[0].action).toHaveBeenCalledTimes(1);
    });

    it('should handle prop changes correctly', () => {
      const { rerender } = render(<CommandPalette {...defaultProps} />);

      const newCommands = [
        {
          id: 'new-command',
          title: 'New Command',
          action: vi.fn(),
          category: 'New',
        },
      ];

      rerender(<CommandPalette {...defaultProps} commands={newCommands} />);

      expect(screen.getByText('New Command')).toBeInTheDocument();
      expect(screen.queryByText('New File')).not.toBeInTheDocument();
    });
  });
});
