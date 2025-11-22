import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react';
import styled from 'styled-components';

import { logger } from '../../services/Logger';
import { telemetry } from '../../services/TelemetryService';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 2rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: #ff6b6b;
  margin-bottom: 2rem;

  svg {
    width: 64px;
    height: 64px;
  }
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;
  color: #a0a0a0;
`;

const ErrorDetails = styled.details`
  margin-bottom: 2rem;
  max-width: 800px;
  width: 100%;

  summary {
    cursor: pointer;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    margin-bottom: 1rem;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    text-align: left;
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === 'primary'
      ? `
    background: #8b5cf6;
    color: white;
    
    &:hover {
      background: #7c3aed;
      transform: translateY(-1px);
    }
  `
      : `
    background: rgba(255, 255, 255, 0.1);
    color: #d4d4d4;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }
`;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to telemetry service
    telemetry.trackError(
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
      },
      'critical'
    );

    // Store error info for display
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env['VITE_DEBUG_MODE'] === 'true') {
      logger.error('Error caught by boundary:', error);
      logger.error('Error info:', errorInfo);
    }
  }

  handleReload = () => {
    telemetry.trackEvent('error_boundary_reload', { errorId: this.state.errorId });
    window.location.reload();
  };

  handleGoHome = () => {
    telemetry.trackEvent('error_boundary_go_home', { errorId: this.state.errorId });
    window.location.href = '/';
  };

  handleReport = () => {
    telemetry.trackEvent('error_boundary_report', { errorId: this.state.errorId });

    const subject = encodeURIComponent(`Error Report: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}

Please describe what you were doing when this error occurred:

    `);

    window.open(`mailto:support@deepcode-editor.com?subject=${subject}&body=${body}`);
  };

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorIcon>
            <AlertTriangle />
          </ErrorIcon>

          <ErrorTitle>Oops! Something went wrong</ErrorTitle>

          <ErrorMessage>
            We&apos;re sorry, but DeepCode Editor encountered an unexpected error. The error has
            been automatically reported to help us fix it.
          </ErrorMessage>

          <ErrorDetails>
            <summary>Error Details (for developers)</summary>
            <pre>
              Error ID: {this.state.errorId}
              {'\n\n'}
              {this.state.error?.toString()}
              {'\n\n'}
              Stack Trace:
              {this.state.error?.stack}
              {'\n\n'}
              Component Stack:
              {this.state.errorInfo?.componentStack}
            </pre>
          </ErrorDetails>

          <ActionButtons>
            <Button $variant="primary" onClick={this.handleReload}>
              <RefreshCw />
              Reload Application
            </Button>

            <Button onClick={this.handleGoHome}>
              <Home />
              Go to Home
            </Button>

            <Button onClick={this.handleReport}>
              <Mail />
              Report Issue
            </Button>
          </ActionButtons>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Export a hook for functional components to report errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: Record<string, unknown>) => {
    telemetry.trackError(error, errorInfo, 'high');
    throw error; // Re-throw to be caught by error boundary
  };
}
