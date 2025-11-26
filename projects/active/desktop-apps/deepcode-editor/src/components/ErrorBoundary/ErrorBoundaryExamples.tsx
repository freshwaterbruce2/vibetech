import { logger } from '../../services/Logger';
import { useState } from 'react';
import styled from 'styled-components';

import { ModernErrorBoundary, useErrorHandler, withErrorBoundary } from './ModernErrorBoundary';

// Example components showing different error boundary patterns

const ExampleContainer = styled.div`
  padding: 20px;
  border: 1px solid #444;
  border-radius: 8px;
  margin: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  margin: 4px;
  border-radius: 4px;
  border: none;
  background: #61dafb;
  color: #1e1e1e;
  cursor: pointer;

  &:hover {
    background: #4fa8c5;
  }
`;

// Example 1: Component that throws an error
function BuggyComponent() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Component crashed! This is a test error.');
  }

  return (
    <ExampleContainer>
      <h3>Example 1: Basic Error Boundary</h3>
      <p>Click the button to trigger an error</p>
      <Button onClick={() => setShouldCrash(true)}>Trigger Error</Button>
    </ExampleContainer>
  );
}

// Example 2: Using useErrorHandler hook for async errors
function AsyncErrorComponent() {
  const { showBoundary } = useErrorHandler();

  const handleAsyncError = async () => {
    try {
      // Simulate async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async operation failed!'));
        }, 1000);
      });
    } catch (error) {
      // This will be caught by the error boundary
      showBoundary(error);
    }
  };

  return (
    <ExampleContainer>
      <h3>Example 2: Async Error Handling</h3>
      <p>Handle async errors with useErrorHandler hook</p>
      <Button onClick={handleAsyncError}>Trigger Async Error</Button>
    </ExampleContainer>
  );
}

// Example 3: Component wrapped with HOC
const BuggyButtonComponent = ({ label }: { label: string }) => {
  const triggerError = () => {
    throw new Error(`Error from ${label} button!`);
  };

  return (
    <ExampleContainer>
      <h3>Example 3: HOC Pattern</h3>
      <p>Component wrapped with withErrorBoundary HOC</p>
      <Button onClick={triggerError}>{label}</Button>
    </ExampleContainer>
  );
};

// Wrap component with error boundary HOC
const SafeBuggyButton = withErrorBoundary(BuggyButtonComponent, {
  onError: (error, _errorInfo) => {
    logger.debug('HOC Error caught:', error.message);
  },
  onReset: () => {
    logger.debug('HOC Error boundary reset');
  },
});

// Example 4: Custom error fallback
const CustomErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <ExampleContainer style={{ background: '#ff6b6b20' }}>
    <h3>🎨 Custom Error UI</h3>
    <p>Error: {error.message}</p>
    <Button onClick={resetErrorBoundary}>Reset Custom Boundary</Button>
  </ExampleContainer>
);

function CustomErrorComponent() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    throw new Error('Custom error with custom UI!');
  }

  return (
    <ExampleContainer>
      <h3>Example 4: Custom Error UI</h3>
      <p>Error boundary with custom fallback component</p>
      <Button onClick={() => setHasError(true)}>Trigger Custom Error</Button>
    </ExampleContainer>
  );
}

// Main examples component
export function ErrorBoundaryExamples() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Error Boundary Examples - 2025 Patterns</h1>

      <Button onClick={() => setResetKey((k) => k + 1)}>Reset All Error Boundaries</Button>

      {/* Example 1: Basic usage */}
      <ModernErrorBoundary resetKeys={[resetKey]}>
        <BuggyComponent />
      </ModernErrorBoundary>

      {/* Example 2: Async error handling */}
      <ModernErrorBoundary resetKeys={[resetKey]}>
        <AsyncErrorComponent />
      </ModernErrorBoundary>

      {/* Example 3: HOC pattern */}
      <SafeBuggyButton label="HOC Error Button" />

      {/* Example 4: Custom fallback */}
      <ModernErrorBoundary fallback={CustomErrorFallback} resetKeys={[resetKey]}>
        <CustomErrorComponent />
      </ModernErrorBoundary>
    </div>
  );
}

// Example usage in App.tsx:
/*
import { ModernErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ModernErrorBoundary>
      <Router>
        <YourAppContent />
      </Router>
    </ModernErrorBoundary>
  )
}
*/

// Example usage with specific error handling:
/*
<ModernErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    trackError(error, errorInfo)
  }}
  onReset={() => {
    // Clear error state in global store
    store.dispatch(clearErrors())
  }}
  resetKeys={[user.id]} // Reset when user changes
>
  <UserDashboard />
</ModernErrorBoundary>
*/
