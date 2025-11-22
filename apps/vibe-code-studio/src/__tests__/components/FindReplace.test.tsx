import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindReplace } from '../../components/FindReplace';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onFind: vi.fn(),
  onReplace: vi.fn(),
  onReplaceAll: vi.fn(),
  onFindNext: vi.fn(),
  onFindPrevious: vi.fn(),
  currentMatch: 1,
  totalMatches: 5,
};

describe('FindReplace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<FindReplace {...defaultProps} />);

      expect(screen.getByText('Find')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Find...')).toBeInTheDocument();
      expect(screen.getByText('1/5')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<FindReplace {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Find')).not.toBeInTheDocument();
    });

    it('should show match count information', () => {
      render(<FindReplace {...defaultProps} currentMatch={3} totalMatches={10} />);

      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('should show "No results" when no matches', () => {
      render(<FindReplace {...defaultProps} currentMatch={0} totalMatches={0} />);

      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    it('should focus find input when opened', () => {
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      expect(document.activeElement).toBe(findInput);
    });
  });

  describe('Find Functionality', () => {
    it('should call onFind when typing in find input', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'test');

      expect(findInput).toHaveValue('test');
    });

    it('should trigger find on Enter key', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'search term');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('search term', {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    });

    it('should trigger find previous on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'test');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(defaultProps.onFindPrevious).toHaveBeenCalledTimes(1);
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'test');
      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Controls', () => {
    it('should call onFindNext when next button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /chevron-down/i });
      await user.click(nextButton);

      expect(defaultProps.onFindNext).toHaveBeenCalledTimes(1);
    });

    it('should call onFindPrevious when previous button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /chevron-up/i });
      await user.click(prevButton);

      expect(defaultProps.onFindPrevious).toHaveBeenCalledTimes(1);
    });

    it('should disable navigation buttons when no matches', () => {
      render(<FindReplace {...defaultProps} totalMatches={0} />);

      const nextButton = screen.getByRole('button', { name: /chevron-down/i });
      const prevButton = screen.getByRole('button', { name: /chevron-up/i });

      expect(nextButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
    });

    it('should enable navigation buttons when matches exist', () => {
      render(<FindReplace {...defaultProps} totalMatches={5} />);

      const nextButton = screen.getByRole('button', { name: /chevron-down/i });
      const prevButton = screen.getByRole('button', { name: /chevron-up/i });

      expect(nextButton).not.toBeDisabled();
      expect(prevButton).not.toBeDisabled();
    });
  });

  describe('Replace Functionality', () => {
    it('should show replace controls when replace button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      expect(screen.getByText('Find & Replace')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Replace with...')).toBeInTheDocument();
      expect(screen.getByText('Replace')).toBeInTheDocument();
      expect(screen.getByText('Replace All')).toBeInTheDocument();
    });

    it('should hide replace controls when replace button clicked again', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);
      await user.click(replaceToggle);

      expect(screen.getByText('Find')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Replace with...')).not.toBeInTheDocument();
    });

    it('should call onReplace when Replace button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      // Enable replace mode
      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      // Type in find and replace inputs
      const findInput = screen.getByPlaceholderText('Find...');
      const replaceInput = screen.getByPlaceholderText('Replace with...');

      await user.type(findInput, 'old text');
      await user.type(replaceInput, 'new text');

      // Click replace button
      const replaceButton = screen.getByText('Replace');
      await user.click(replaceButton);

      expect(defaultProps.onReplace).toHaveBeenCalledWith('old text', 'new text', {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    });

    it('should call onReplaceAll when Replace All button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      // Enable replace mode
      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      // Type in inputs
      const findInput = screen.getByPlaceholderText('Find...');
      const replaceInput = screen.getByPlaceholderText('Replace with...');

      await user.type(findInput, 'find this');
      await user.type(replaceInput, 'replace with this');

      // Click replace all button
      const replaceAllButton = screen.getByText('Replace All');
      await user.click(replaceAllButton);

      expect(defaultProps.onReplaceAll).toHaveBeenCalledWith('find this', 'replace with this', {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    });

    it('should disable replace buttons when no matches', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} totalMatches={0} />);

      // Enable replace mode
      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      const replaceButton = screen.getByText('Replace');
      const replaceAllButton = screen.getByText('Replace All');

      expect(replaceButton).toBeDisabled();
      expect(replaceAllButton).toBeDisabled();
    });
  });

  describe('Search Options', () => {
    it('should render all search options', () => {
      render(<FindReplace {...defaultProps} />);

      expect(screen.getByLabelText('Match Case')).toBeInTheDocument();
      expect(screen.getByLabelText('Whole Word')).toBeInTheDocument();
      expect(screen.getByLabelText('Regex')).toBeInTheDocument();
    });

    it('should toggle case sensitive option', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const caseOption = screen.getByLabelText('Match Case');
      await user.click(caseOption);

      expect(caseOption).toBeChecked();

      // Type in find input and trigger search
      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'Test');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('Test', {
        caseSensitive: true,
        wholeWord: false,
        regex: false,
      });
    });

    it('should toggle whole word option', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const wholeWordOption = screen.getByLabelText('Whole Word');
      await user.click(wholeWordOption);

      expect(wholeWordOption).toBeChecked();

      // Trigger search
      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'word');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('word', {
        caseSensitive: false,
        wholeWord: true,
        regex: false,
      });
    });

    it('should toggle regex option', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const regexOption = screen.getByLabelText('Regex');
      await user.click(regexOption);

      expect(regexOption).toBeChecked();

      // Trigger search
      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, '\\d+');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('\\d+', {
        caseSensitive: false,
        wholeWord: false,
        regex: true,
      });
    });

    it('should handle multiple options enabled', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const caseOption = screen.getByLabelText('Match Case');
      const wholeWordOption = screen.getByLabelText('Whole Word');
      const regexOption = screen.getByLabelText('Regex');

      await user.click(caseOption);
      await user.click(wholeWordOption);
      await user.click(regexOption);

      // Trigger search
      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'pattern');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('pattern', {
        caseSensitive: true,
        wholeWord: true,
        regex: true,
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose on Escape key in replace input', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      // Enable replace mode
      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      const replaceInput = screen.getByPlaceholderText('Replace with...');
      await user.type(replaceInput, 'test');
      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should have proper labels for form controls', () => {
      render(<FindReplace {...defaultProps} />);

      expect(screen.getByLabelText('Match Case')).toBeInTheDocument();
      expect(screen.getByLabelText('Whole Word')).toBeInTheDocument();
      expect(screen.getByLabelText('Regex')).toBeInTheDocument();
    });

    it('should support keyboard navigation between inputs', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      // Enable replace mode
      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      const findInput = screen.getByPlaceholderText('Find...');
      const replaceInput = screen.getByPlaceholderText('Replace with...');

      expect(document.activeElement).toBe(findInput);

      await user.tab();
      // Tab should move through navigation controls and eventually to replace input
      await user.tab();
      await user.tab();
      await user.tab();

      expect(document.activeElement).toBe(replaceInput);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty find query', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      await user.keyboard('{Enter}');

      // Should not call onFind with empty query
      expect(defaultProps.onFind).not.toHaveBeenCalled();
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, '.*+?^${}()|[]\\');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('.*+?^${}()|[]\\', {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, '🚀 Hello 世界');
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith('🚀 Hello 世界', {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    });

    it('should handle very long search terms', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const longTerm = 'a'.repeat(1000);
      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, longTerm);
      await user.keyboard('{Enter}');

      expect(defaultProps.onFind).toHaveBeenCalledWith(longTerm, {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    });
  });

  describe('Visual Feedback', () => {
    it('should display match information correctly', () => {
      render(<FindReplace {...defaultProps} currentMatch={2} totalMatches={8} />);

      expect(screen.getByText('2/8')).toBeInTheDocument();
    });

    it('should handle edge case match numbers', () => {
      render(<FindReplace {...defaultProps} currentMatch={1} totalMatches={1} />);

      expect(screen.getByText('1/1')).toBeInTheDocument();
    });

    it('should show title changes when replace mode is toggled', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      expect(screen.getByText('Find')).toBeInTheDocument();

      const replaceToggle = screen.getByRole('button', { name: /replace/i });
      await user.click(replaceToggle);

      expect(screen.getByText('Find & Replace')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle rapid typing without issues', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');

      // Type rapidly
      await user.type(findInput, 'quicktypingtest');

      expect(findInput).toHaveValue('quicktypingtest');
    });

    it('should handle frequent option changes', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const caseOption = screen.getByLabelText('Match Case');
      const wholeWordOption = screen.getByLabelText('Whole Word');
      const regexOption = screen.getByLabelText('Regex');

      // Rapidly toggle options
      for (let i = 0; i < 10; i++) {
        await user.click(caseOption);
        await user.click(wholeWordOption);
        await user.click(regexOption);
      }

      expect(caseOption).toBeChecked();
      expect(wholeWordOption).toBeChecked();
      expect(regexOption).toBeChecked();
    });
  });

  describe('Input Validation', () => {
    it('should preserve input focus during typing', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');
      await user.type(findInput, 'test input');

      expect(document.activeElement).toBe(findInput);
      expect(findInput).toHaveValue('test input');
    });

    it('should handle copy and paste operations', async () => {
      const user = userEvent.setup();
      render(<FindReplace {...defaultProps} />);

      const findInput = screen.getByPlaceholderText('Find...');

      // Simulate paste operation
      await user.click(findInput);
      await user.paste('pasted content');

      expect(findInput).toHaveValue('pasted content');
    });
  });
});
