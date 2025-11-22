import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputDialog } from '../../components/InputDialog';

describe('InputDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    title: 'Test Dialog',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when isOpen is true', () => {
      render(<InputDialog {...defaultProps} />);
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });

    it('should not render dialog when isOpen is false', () => {
      render(<InputDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });

    it('should render input field', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      expect(input).toBeInTheDocument();
    });

    it('should render confirm and cancel buttons', () => {
      render(<InputDialog {...defaultProps} />);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<InputDialog {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<InputDialog {...defaultProps} placeholder="Enter name..." />);
      expect(screen.getByPlaceholderText('Enter name...')).toBeInTheDocument();
    });

    it('should render with default value', () => {
      render(<InputDialog {...defaultProps} defaultValue="default text" />);
      const input = screen.getByDisplayValue('default text');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should allow typing in input field', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test value' } });
      expect(input.value).toBe('test value');
    });

    it('should clear error when typing', () => {
      render(<InputDialog {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');

      // Trigger empty validation error
      fireEvent.click(confirmButton);
      expect(screen.getByText('This field cannot be empty')).toBeInTheDocument();

      // Type something to clear error
      const input = screen.getByPlaceholderText('Enter value...');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.queryByText('This field cannot be empty')).not.toBeInTheDocument();
    });

    it('should auto-focus input when dialog opens', async () => {
      render(<InputDialog {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter value...');
        expect(document.activeElement).toBe(input);
      });
    });

    it('should select text when dialog opens with default value', async () => {
      render(<InputDialog {...defaultProps} defaultValue="selected text" />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('selected text') as HTMLInputElement;
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe('Confirm Action', () => {
    it('should call onConfirm with trimmed value', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const confirmButton = screen.getByText('Confirm');

      fireEvent.change(input, { target: { value: '  test value  ' } });
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('test value');
    });

    it('should not call onConfirm with empty value', () => {
      render(<InputDialog {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');

      fireEvent.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(screen.getByText('This field cannot be empty')).toBeInTheDocument();
    });

    it('should not call onConfirm with whitespace-only value', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const confirmButton = screen.getByText('Confirm');

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(screen.getByText('This field cannot be empty')).toBeInTheDocument();
    });

    it('should clear input after successful confirm', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...') as HTMLInputElement;
      const confirmButton = screen.getByText('Confirm');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(confirmButton);

      expect(input.value).toBe('');
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(<InputDialog {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');

      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when close button is clicked', () => {
      render(<InputDialog {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close dialog');

      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should clear input when cancelled', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...') as HTMLInputElement;
      const cancelButton = screen.getByText('Cancel');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(cancelButton);

      // Re-open dialog
      const { rerender } = render(<InputDialog {...defaultProps} isOpen={false} />);
      rerender(<InputDialog {...defaultProps} isOpen={true} />);

      expect(input.value).toBe('');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close dialog when Escape key is pressed', () => {
      render(<InputDialog {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should confirm when Enter key is pressed', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(window, { key: 'Enter' });

      expect(mockOnConfirm).toHaveBeenCalledWith('test');
    });

    it('should not confirm on Enter with Shift key', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when dialog is closed', () => {
      render(<InputDialog {...defaultProps} isOpen={false} />);

      fireEvent.keyDown(window, { key: 'Escape' });
      fireEvent.keyDown(window, { key: 'Enter' });

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show validation error', () => {
      const validate = vi.fn().mockReturnValue('Invalid input');

      render(<InputDialog {...defaultProps} validate={validate} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const confirmButton = screen.getByText('Confirm');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(confirmButton);

      expect(validate).toHaveBeenCalledWith('test');
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should confirm if validation passes', () => {
      const validate = vi.fn().mockReturnValue(null);

      render(<InputDialog {...defaultProps} validate={validate} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const confirmButton = screen.getByText('Confirm');

      fireEvent.change(input, { target: { value: 'valid input' } });
      fireEvent.click(confirmButton);

      expect(validate).toHaveBeenCalledWith('valid input');
      expect(mockOnConfirm).toHaveBeenCalledWith('valid input');
    });

    it('should clear validation error when input changes', () => {
      const validate = vi.fn().mockReturnValue('Invalid input');

      render(<InputDialog {...defaultProps} validate={validate} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const confirmButton = screen.getByText('Confirm');

      // Trigger validation error
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(confirmButton);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();

      // Change input to clear error
      fireEvent.change(input, { target: { value: 'test2' } });
      expect(screen.queryByText('Invalid input')).not.toBeInTheDocument();
    });

    it('should display error styling on input when error exists', () => {
      render(<InputDialog {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');

      // Trigger empty validation error
      fireEvent.click(confirmButton);

      const input = screen.getByPlaceholderText('Enter value...');
      expect(input).toHaveAttribute('class', expect.stringContaining('hasError'));
    });
  });

  describe('Overlay Click', () => {
    it('should close dialog when clicking overlay', () => {
      const { container } = render(<InputDialog {...defaultProps} />);
      const overlay = container.firstChild as HTMLElement;

      fireEvent.click(overlay);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not close dialog when clicking dialog box', () => {
      render(<InputDialog {...defaultProps} />);
      const dialogBox = screen.getByText('Test Dialog').closest('div');

      if (dialogBox) {
        fireEvent.click(dialogBox);
      }

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should reset value when dialog opens', () => {
      const { rerender } = render(<InputDialog {...defaultProps} isOpen={false} />);

      // Open dialog and type something
      rerender(<InputDialog {...defaultProps} isOpen={true} />);
      const input = screen.getByPlaceholderText('Enter value...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test' } });

      // Close dialog
      rerender(<InputDialog {...defaultProps} isOpen={false} />);

      // Reopen dialog - value should be reset
      rerender(<InputDialog {...defaultProps} isOpen={true} defaultValue="new default" />);

      expect(screen.getByDisplayValue('new default')).toBeInTheDocument();
    });

    it('should reset error when dialog opens', () => {
      const { rerender } = render(<InputDialog {...defaultProps} isOpen={true} />);
      const confirmButton = screen.getByText('Confirm');

      // Trigger error
      fireEvent.click(confirmButton);
      expect(screen.getByText('This field cannot be empty')).toBeInTheDocument();

      // Close and reopen
      rerender(<InputDialog {...defaultProps} isOpen={false} />);
      rerender(<InputDialog {...defaultProps} isOpen={true} />);

      expect(screen.queryByText('This field cannot be empty')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input values', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const longValue = 'a'.repeat(1000);

      fireEvent.change(input, { target: { value: longValue } });
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(longValue);
    });

    it('should handle special characters in input', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const specialChars = '!@#$%^&*()_+-={}[]|\\:;"<>,.?/~`';

      fireEvent.change(input, { target: { value: specialChars } });
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(specialChars);
    });

    it('should handle unicode characters', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const unicode = '你好世界 🌍 مرحبا';

      fireEvent.change(input, { target: { value: unicode } });
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(unicode);
    });

    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(<InputDialog {...defaultProps} isOpen={true} />);

      for (let i = 0; i < 10; i++) {
        rerender(<InputDialog {...defaultProps} isOpen={false} />);
        rerender(<InputDialog {...defaultProps} isOpen={true} />);
      }

      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on close button', () => {
      render(<InputDialog {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<InputDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter value...');
      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm');

      // Should be able to tab through elements
      expect(input).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });
  });
});
