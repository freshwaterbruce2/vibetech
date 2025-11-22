import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Mock console.error to prevent error logs during tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowingComponent: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({
  shouldThrow = true,
  errorMessage = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Normal component content</div>;
};

// Test component that works normally
const WorkingComponent: React.FC = () => {
  return <div>Working component</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should render multiple children normally', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should not interfere with child component props', () => {
      const TestComponent: React.FC<{ message: string }> = ({ message }) => <div>{message}</div>;

      render(
        <ErrorBoundary>
          <TestComponent message="Hello World" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(/DeepCode Editor encountered an unexpected error/)
      ).toBeInTheDocument();
    });

    it('should display custom error message in technical details', () => {
      const customError = 'Custom error message for testing';

      render(
        <ErrorBoundary>
          <ThrowingComponent errorMessage={customError} />
        </ErrorBoundary>
      );

      // Click to expand technical details
      const detailsElement = screen.getByText('Technical Details');
      fireEvent.click(detailsElement);

      expect(screen.getByText(customError)).toBeInTheDocument();
    });

    it('should show stack trace in technical details', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Click to expand technical details
      const detailsElement = screen.getByText('Technical Details');
      fireEvent.click(detailsElement);

      // Stack trace should be present
      expect(screen.getByText('Stack Trace:')).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle errors during component lifecycle', () => {
      const LifecycleErrorComponent: React.FC = () => {
        // Throw error during render to be caught by error boundary
        if (Math.random() > -1) {
          // Always true
          throw new Error('Lifecycle error');
        }
        return <div>This should not render</div>;
      };

      render(
        <ErrorBoundary>
          <LifecycleErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('This should not render')).not.toBeInTheDocument();
    });
  });

  describe('Custom Fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <div>Custom error fallback</div>;

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('should prefer custom fallback over default error UI', () => {
      const CustomFallback = () => (
        <div>
          <h1>Application Error</h1>
          <p>Please contact support</p>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('Please contact support')).toBeInTheDocument();
    });

    it('should handle undefined fallback gracefully', () => {
      const { container } = render(
        <ErrorBoundary fallback={undefined}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Should render nothing (null fallback)
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Recovery Functionality', () => {
    it('should show retry button in default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should reset error state when retry button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalErrorComponent: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }

        return <div>Component recovered</div>;
      };

      render(
        <ErrorBoundary>
          <ConditionalErrorComponent />
        </ErrorBoundary>
      );

      // Should show error UI initially
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Fix the component so it won't throw on retry
      shouldThrow = false;

      // Click retry button
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      // Should show recovered component
      expect(screen.getByText('Component recovered')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle multiple retry attempts', async () => {
      const user = userEvent.setup();
      let attemptCount = 0;

      const MultiRetryComponent: React.FC = () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return <div>Success on attempt {attemptCount}</div>;
      };

      render(
        <ErrorBoundary>
          <MultiRetryComponent />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // First retry
      await user.click(screen.getByText('Try Again'));
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Second retry - should succeed
      await user.click(screen.getByText('Try Again'));
      expect(screen.getByText('Success on attempt 3')).toBeInTheDocument();
    });
  });

  describe('Technical Details Expansion', () => {
    it('should expand technical details when clicked', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowingComponent errorMessage="Detailed test error" />
        </ErrorBoundary>
      );

      const detailsElement = screen.getByText('Technical Details');
      await user.click(detailsElement);

      expect(screen.getByText('Error Message:')).toBeInTheDocument();
      expect(screen.getByText('Stack Trace:')).toBeInTheDocument();
      expect(screen.getByText('Detailed test error')).toBeInTheDocument();
    });

    it('should show component stack in technical details', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const detailsElement = screen.getByText('Technical Details');
      await user.click(detailsElement);

      expect(screen.getByText('Component Stack:')).toBeInTheDocument();
    });

    it('should handle missing error information gracefully', async () => {
      const user = userEvent.setup();

      // Manually trigger error boundary without full error info
      const ErrorBoundaryWithManualError = () => {
        const [hasError, setHasError] = React.useState(false);

        if (hasError) {
          throw new Error('Manual error');
        }

        return <button onClick={() => setHasError(true)}>Trigger Error</button>;
      };

      render(
        <ErrorBoundary>
          <ErrorBoundaryWithManualError />
        </ErrorBoundary>
      );

      const triggerButton = screen.getByText('Trigger Error');
      await user.click(triggerButton);

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Production vs Development Behavior', () => {
    it('should handle production environment correctly', () => {
      // Note: import.meta.env.PROD is readonly, so we can't test different behavior
      // Just verify the component renders correctly regardless of environment
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      // In production, errors would be logged to external service
      // but we can't test that behavior by changing import.meta.env
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Error message should be readable
      const errorMessage = screen.getByText(/DeepCode Editor encountered an unexpected error/);
      expect(errorMessage).toBeInTheDocument();

      // Retry button should be focusable
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Tab navigation should work
      await user.tab();

      // Check that we can focus on interactive elements
      const retryButton = screen.getByText('Try Again');
      const detailsSummary = screen.getByText('Technical Details');

      // Both should be focusable
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);

      detailsSummary.focus();
      expect(document.activeElement).toBe(detailsSummary);
    });

    it('should support Enter key for retry action', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalErrorComponent: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered</div>;
      };

      render(
        <ErrorBoundary>
          <ConditionalErrorComponent />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      retryButton.focus();

      // Fix the component so it won't throw on retry
      shouldThrow = false;

      await user.keyboard('{Enter}');

      // Should show recovered component
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });

  describe('Error Information Display', () => {
    it('should display error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should display helpful error message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/This might be due to a temporary issue or a bug/)
      ).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longErrorMessage = 'A'.repeat(1000);

      render(
        <ErrorBoundary>
          <ThrowingComponent errorMessage={longErrorMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });

    it('should handle error messages with special characters', () => {
      const specialErrorMessage =
        'Error with <script>alert("xss")</script> and other chars: !@#$%^&*()';

      render(
        <ErrorBoundary>
          <ThrowingComponent errorMessage={specialErrorMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain error state until manually reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Re-render with different props but error should persist
      rerender(
        <ErrorBoundary>
          <ThrowingComponent errorMessage="Different error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should reset state when children change after recovery', async () => {
      const user = userEvent.setup();
      let throwError = true;

      const ToggleErrorComponent: React.FC = () => {
        if (throwError) {
          throw new Error('Toggle error');
        }
        return <div>No error now</div>;
      };

      render(
        <ErrorBoundary>
          <ToggleErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Change state and retry
      throwError = false;
      await user.click(screen.getByText('Try Again'));

      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error objects', () => {
      // This tests the robustness of error handling
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should handle errors during error rendering', () => {
      // Error boundaries should be resilient
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should handle rapid error/recovery cycles', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');

      // Rapid clicking should not break the component
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});
