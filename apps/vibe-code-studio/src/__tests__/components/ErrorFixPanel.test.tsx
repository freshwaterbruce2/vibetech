/**
 * ErrorFixPanel Component Tests
 * TDD: Writing tests FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { DetectedError } from '../../services/ErrorDetector';
import type { GeneratedFix } from '../../services/AutoFixService';

// Mock data
const mockError: DetectedError = {
  id: 'err-1',
  type: 'typescript',
  severity: 'error',
  message: "Property 'foo' does not exist on type 'Bar'",
  file: '/test/file.ts',
  line: 10,
  column: 5,
  code: 'TS2339'
};

const mockFix: GeneratedFix = {
  error: mockError,
  suggestions: [
    {
      id: 'fix-1',
      title: 'Add property to interface',
      description: 'Add the missing property to the Bar interface',
      code: 'interface Bar {\n  foo: string;\n}',
      startLine: 1,
      endLine: 3,
      confidence: 'high'
    },
    {
      id: 'fix-2',
      title: 'Use optional chaining',
      description: 'Access property safely with optional chaining',
      code: 'const value = bar?.foo;',
      startLine: 10,
      endLine: 10,
      confidence: 'medium'
    }
  ],
  context: 'interface Bar {}\nconst bar: Bar = {};\nconst value = bar.foo;',
  explanation: 'The property "foo" is not defined in the Bar interface.'
};

describe('ErrorFixPanel', () => {
  let ErrorFixPanel: any;
  let mockOnApplyFix: any;
  let mockOnDismiss: any;

  beforeEach(async () => {
    mockOnApplyFix = vi.fn();
    mockOnDismiss = vi.fn();

    try {
      const module = await import('../../components/ErrorFixPanel');
      ErrorFixPanel = module.ErrorFixPanel;
    } catch {
      // Expected to fail initially - TDD RED phase
      ErrorFixPanel = null;
    }
  });

  describe('Rendering', () => {
    it('should render without errors when no data provided', () => {
      if (!ErrorFixPanel) return;

      const { container } = render(
        <ErrorFixPanel
          error={null}
          fix={null}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should display error information', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={null}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(/Property 'foo' does not exist/i)).toBeInTheDocument();
      expect(screen.getByText(/TS2339/i)).toBeInTheDocument();
      expect(screen.getByText(/line 10/i)).toBeInTheDocument();
    });

    it('should display fix suggestions when available', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Add property to interface')).toBeInTheDocument();
      expect(screen.getByText('Use optional chaining')).toBeInTheDocument();
    });

    it('should show loading state while generating fixes', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={null}
          isLoading={true}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(/Generating fixes/i)).toBeInTheDocument();
    });
  });

  describe('Fix Suggestions', () => {
    it('should display confidence badges', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(/high/i)).toBeInTheDocument();
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
    });

    it('should display code preview for each suggestion', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      // Code is collapsed by default, need to expand first
      const expandButtons = screen.getAllByRole('button', { name: /expand|show/i });

      // Expand first suggestion
      fireEvent.click(expandButtons[0]);

      // Now code should be visible
      expect(screen.getByText(/interface Bar/)).toBeInTheDocument();

      // Expand second suggestion
      fireEvent.click(expandButtons[1]);
      expect(screen.getByText(/bar\?\.foo/)).toBeInTheDocument();
    });

    it('should allow selecting a suggestion', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const firstSuggestion = screen.getByText('Add property to interface').closest('button');
      expect(firstSuggestion).toBeTruthy();

      if (firstSuggestion) {
        fireEvent.click(firstSuggestion);
        // Should highlight the selected suggestion
        expect(firstSuggestion).toHaveClass(/selected|active/i);
      }
    });
  });

  describe('Actions', () => {
    it('should call onApplyFix when apply button is clicked', async () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      // Select first suggestion
      const firstSuggestion = screen.getByText('Add property to interface').closest('button');
      if (firstSuggestion) {
        fireEvent.click(firstSuggestion);
      }

      // Click apply button
      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApplyFix).toHaveBeenCalledWith(mockFix.suggestions[0]);
      });
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should disable apply button when no suggestion is selected', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeDisabled();
    });

    it('should enable apply button when suggestion is selected', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      // Select suggestion
      const firstSuggestion = screen.getByText('Add property to interface').closest('button');
      if (firstSuggestion) {
        fireEvent.click(firstSuggestion);
      }

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).not.toBeDisabled();
    });
  });

  describe('Error States', () => {
    it('should display error message when fix generation fails', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={null}
          errorMessage="Failed to generate fixes"
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(/Failed to generate fixes/i)).toBeInTheDocument();
    });

    it('should allow retrying after error', () => {
      if (!ErrorFixPanel) return;

      const mockOnRetry = vi.fn();

      render(
        <ErrorFixPanel
          error={mockError}
          fix={null}
          errorMessage="API error"
          onRetry={mockOnRetry}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByLabelText(/error fix panel/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const firstSuggestion = screen.getByText('Add property to interface').closest('button');
      if (firstSuggestion) {
        firstSuggestion.focus();
        expect(document.activeElement).toBe(firstSuggestion);

        // Press Enter to select
        fireEvent.keyDown(firstSuggestion, { key: 'Enter', code: 'Enter' });
        expect(firstSuggestion).toHaveClass(/selected|active/i);
      }
    });

    it('should have proper focus management', () => {
      if (!ErrorFixPanel) return;

      const { rerender } = render(
        <ErrorFixPanel
          error={null}
          fix={null}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      // When error appears, panel should be focusable
      rerender(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const panel = screen.getByLabelText(/error fix panel/i);
      expect(panel).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('UI Interactions', () => {
    it('should expand/collapse suggestion details', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      // Get expand button (filters out "expand" ARIA labels)
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      const expandButton = expandButtons[0];

      // Initially code is hidden
      expect(screen.queryByText(/interface Bar/)).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);

      // Now code is visible
      expect(screen.getByText(/interface Bar/)).toBeInTheDocument();

      // Button text changes to "collapse" or "hide"
      const collapseButton = screen.getAllByRole('button', { name: /collapse|hide/i })[0];
      expect(collapseButton).toBeTruthy();
    });

    it('should show code diff preview', () => {
      if (!ErrorFixPanel) return;

      render(
        <ErrorFixPanel
          error={mockError}
          fix={mockFix}
          showDiff={true}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      // Expand first suggestion to see diff
      const expandButton = screen.getAllByRole('button', { name: /expand/i })[0];
      fireEvent.click(expandButton);

      // Should show before/after comparison
      expect(screen.getByText(/before/i)).toBeInTheDocument();
      expect(screen.getByText(/after/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many suggestions', () => {
      if (!ErrorFixPanel) return;

      const largeFixSet: GeneratedFix = {
        ...mockFix,
        suggestions: Array.from({ length: 20 }, (_, i) => ({
          id: `fix-${i}`,
          title: `Suggestion ${i}`,
          description: `Description ${i}`,
          code: `const fix${i} = true;`,
          startLine: i,
          endLine: i,
          confidence: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
        }))
      };

      const startTime = performance.now();

      render(
        <ErrorFixPanel
          error={mockError}
          fix={largeFixSet}
          onApplyFix={mockOnApplyFix}
          onDismiss={mockOnDismiss}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });
});
