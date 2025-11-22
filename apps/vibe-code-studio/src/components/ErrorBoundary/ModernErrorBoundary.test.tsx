import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernErrorBoundary, useErrorHandler, withErrorBoundary } from './ModernErrorBoundary';
import { useEffect } from 'react';

// Mock console methods
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component for async errors
const AsyncError = () => {
  const { showBoundary } = useErrorHandler();

  const triggerAsyncError = async () => {
    try {
      await Promise.reject(new Error('Async test error'));
    } catch (error) {
      showBoundary(error as Error);
    }
  };

  return <button onClick={triggerAsyncError}>Trigger Async Error</button>;
};

// Test component with useEffect error
const EffectError = ({ shouldError = false }) => {
  const { showBoundary } = useErrorHandler();

  useEffect(() => {
    if (shouldError) {
      try {
        throw new Error('Effect error');
      } catch (error) {
        showBoundary(error as Error);
      }
    }
  }, [shouldError, showBoundary]);

  return <div>Effect component</div>;
};

describe('ModernErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ModernErrorBoundary>
        <div>Test content</div>
      </ModernErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays error fallback when error is thrown', () => {
    render(
      <ModernErrorBoundary>
        <ThrowError shouldThrow />
      </ModernErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('resets error boundary when Try Again is clicked', () => {
    let shouldThrow = true;

    const ControlledThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    render(
      <ModernErrorBoundary>
        <ControlledThrow />
      </ModernErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Change state before clicking Try Again
    shouldThrow = false;

    // Click Try Again - will re-render children with shouldThrow=false
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ModernErrorBoundary onError={onError}>
        <ThrowError shouldThrow />
      </ModernErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('shows technical details when expanded', () => {
    render(
      <ModernErrorBoundary>
        <ThrowError shouldThrow />
      </ModernErrorBoundary>
    );

    // Click on technical details
    fireEvent.click(screen.getByText('Technical Details'));

    expect(screen.getByText('Error Message')).toBeInTheDocument();
    expect(screen.getByText('Stack Trace')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('copies error to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(
      <ModernErrorBoundary>
        <ThrowError shouldThrow />
      </ModernErrorBoundary>
    );

    fireEvent.click(screen.getByText('Copy Error'));

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error')
      );
    });

    // Check for "Copied!" feedback
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('handles async errors with useErrorHandler', async () => {
    render(
      <ModernErrorBoundary>
        <AsyncError />
      </ModernErrorBoundary>
    );

    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });

  it('resets on resetKeys change', () => {
    const { rerender } = render(
      <ModernErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow />
      </ModernErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Change reset key
    rerender(
      <ModernErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ModernErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('uses custom fallback component', () => {
    const CustomFallback = ({ error }: { error: Error }) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ModernErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow />
      </ModernErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });

  it('handles errors in useEffect with useErrorHandler', async () => {
    const { rerender } = render(
      <ModernErrorBoundary>
        <EffectError shouldError={false} />
      </ModernErrorBoundary>
    );

    expect(screen.getByText('Effect component')).toBeInTheDocument();

    rerender(
      <ModernErrorBoundary>
        <EffectError shouldError={true} />
      </ModernErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => {
      throw new Error('HOC test error');
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });

  it('passes props to wrapped component', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Test message" />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('uses custom error boundary props', () => {
    const onError = vi.fn();
    const TestComponent = () => {
      throw new Error('HOC error with custom props');
    };

    const WrappedComponent = withErrorBoundary(TestComponent, {
      onError,
    });

    render(<WrappedComponent />);

    expect(onError).toHaveBeenCalled();
  });
});
