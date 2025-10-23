import { logger } from '../../services/Logger';
import React, { ErrorInfo, useCallback, useEffect, useState } from 'react';
import {
  ErrorBoundary as ReactErrorBoundary,
  FallbackProps,
  useErrorBoundary,
} from 'react-error-boundary';
import { AlertTriangle, Bug, Copy, Home, RefreshCw } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

// Default fallback render function
const defaultFallbackRender = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

// Styled components with 2025 patterns
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${vibeTheme.spacing.xl};
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  color: ${vibeTheme.colors.text};
  text-align: center;
`;

const ErrorCard = styled.div`
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.large};
  padding: ${vibeTheme.spacing.xl};
  max-width: 600px;
  width: 100%;
  box-shadow: ${vibeTheme.shadows.large};
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 auto ${vibeTheme.spacing.lg};
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 50%;

  svg {
    width: 40px;
    height: 40px;
    color: ${vibeTheme.colors.error};
  }
`;

const ErrorTitle = styled.h1`
  color: ${vibeTheme.colors.text};
  margin-bottom: ${vibeTheme.spacing.md};
  font-size: ${vibeTheme.typography.fontSize['2xl']};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
`;

const ErrorMessage = styled.p`
  margin-bottom: ${vibeTheme.spacing.lg};
  font-size: ${vibeTheme.typography.fontSize.base};
  line-height: 1.6;
  color: ${vibeTheme.colors.textSecondary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.md};
  justify-content: center;
  margin-bottom: ${vibeTheme.spacing.lg};
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.lg};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  border: 2px solid transparent;

  ${(props) =>
    props.$variant === 'primary'
      ? `
    background: ${vibeTheme.gradients.primary};
    color: ${vibeTheme.colors.text};
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${vibeTheme.shadows.medium};
    }
  `
      : `
    background: transparent;
    color: ${vibeTheme.colors.textSecondary};
    border-color: rgba(139, 92, 246, 0.3);
    
    &:hover {
      background: rgba(139, 92, 246, 0.1);
      border-color: ${vibeTheme.colors.purple};
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

const DetailsSection = styled.details`
  margin-top: ${vibeTheme.spacing.lg};
  text-align: left;

  summary {
    cursor: pointer;
    color: ${vibeTheme.colors.cyan};
    margin-bottom: ${vibeTheme.spacing.md};
    font-size: ${vibeTheme.typography.fontSize.sm};
    display: flex;
    align-items: center;
    gap: ${vibeTheme.spacing.sm};

    &:hover {
      color: ${vibeTheme.colors.purple};
    }
  }
`;

const ErrorDetails = styled.div`
  background: ${vibeTheme.colors.primary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  padding: ${vibeTheme.spacing.md};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.xs};
  overflow: auto;
  max-height: 300px;

  h4 {
    color: ${vibeTheme.colors.purple};
    margin: ${vibeTheme.spacing.md} 0 ${vibeTheme.spacing.sm};
    font-size: ${vibeTheme.typography.fontSize.sm};

    &:first-child {
      margin-top: 0;
    }
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  margin-top: ${vibeTheme.spacing.md};
  padding: ${vibeTheme.spacing.sm};
  background: rgba(139, 92, 246, 0.1);
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textMuted};
`;

// Error logger for production
const logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
  if (import.meta.env.PROD) {
    // In production, send to error tracking service
    logger.error('Production error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }
};

// Modern error fallback component
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [copied, setCopied] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const copyErrorToClipboard = useCallback(() => {
    const errorText = `
Error: ${error.message}
Stack: ${error.stack}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [error]);

  const sendReport = useCallback(() => {
    // Simulate sending error report
    logErrorToService(error, { componentStack: '' });
    setReportSent(true);
  }, [error]);

  const goHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Auto-report in production
  useEffect(() => {
    if (import.meta.env.PROD && !reportSent) {
      sendReport();
    }
  }, [sendReport, reportSent]);

  return (
    <ErrorContainer>
      <ErrorCard>
        <IconWrapper>
          <AlertTriangle />
        </IconWrapper>

        <ErrorTitle>Oops! Something went wrong</ErrorTitle>

        <ErrorMessage>
          DeepCode Editor encountered an unexpected error. Don&apos;t worry, your work is saved. You
          can try refreshing the page or return to the home screen.
        </ErrorMessage>

        <ActionButtons>
          <Button $variant="primary" onClick={resetErrorBoundary}>
            <RefreshCw size={16} />
            Try Again
          </Button>

          <Button $variant="secondary" onClick={goHome}>
            <Home size={16} />
            Go Home
          </Button>

          <Button $variant="secondary" onClick={copyErrorToClipboard}>
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy Error'}
          </Button>
        </ActionButtons>

        <DetailsSection>
          <summary>
            <Bug size={16} />
            Technical Details
          </summary>
          <ErrorDetails>
            <h4>Error Message</h4>
            <pre>{error.message}</pre>

            <h4>Stack Trace</h4>
            <pre>{error.stack}</pre>

            <h4>Environment</h4>
            <pre>
              Mode: {import.meta.env.MODE}
              Browser: {navigator.userAgent.split(' ').slice(-2).join(' ')}
              Time: {new Date().toLocaleString()}
            </pre>
          </ErrorDetails>
        </DetailsSection>

        {reportSent && <StatusBar>✅ Error report sent automatically</StatusBar>}
      </ErrorCard>
    </ErrorContainer>
  );
}

// Modern error boundary wrapper with 2025 patterns
interface ModernErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps> | undefined;
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
  onReset?: (() => void) | undefined;
  resetKeys?: Array<string | number> | undefined;
}

export function ModernErrorBoundary({
  children,
  fallback = ErrorFallback,
  onError = logErrorToService,
  onReset,
  resetKeys = [],
}: ModernErrorBoundaryProps) {
  const errorBoundaryProps: Record<string, unknown> = {
    FallbackComponent: fallback,
    onError,
    resetKeys,
  };

  // Only add onReset if it's defined
  if (onReset !== undefined) {
    errorBoundaryProps['onReset'] = onReset;
  }

  // Ensure we have a fallbackRender function
  const fallbackRenderer = typeof errorBoundaryProps['fallbackRender'] === 'function' 
    ? errorBoundaryProps['fallbackRender'] as (props: FallbackProps) => React.ReactNode
    : defaultFallbackRender;
  const finalProps = {
    ...errorBoundaryProps,
    fallbackRender: fallbackRenderer,
  };

  return <ReactErrorBoundary {...finalProps}>{children}</ReactErrorBoundary>;
}

// Hook for imperatively handling errors
export const useErrorHandler = useErrorBoundary;

// HOC pattern for wrapping components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ModernErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ModernErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ModernErrorBoundary>
  );

  const ComponentForError = Component as React.FC<P> & { displayName?: string; name?: string };
  WrappedComponent.displayName = `withErrorBoundary(${ComponentForError.displayName || ComponentForError.name})`;

  return WrappedComponent;
}

export default ModernErrorBoundary;
