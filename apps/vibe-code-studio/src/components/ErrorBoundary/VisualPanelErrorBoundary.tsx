/**
 * Visual Panel Error Boundary
 * Specialized error boundary for visual components like Screenshot-to-Code, Component Library, etc.
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import styled from 'styled-components';

import { logger } from '../../services/Logger';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  margin: 1rem;
`;

const ErrorIcon = styled(AlertTriangle as any)`
  color: #ef4444;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h3`
  color: #ef4444;
  margin: 0.5rem 0;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.p`
  color: #a8a9ad;
  margin: 0.5rem 0;
  text-align: center;
  max-width: 500px;
`;

const ErrorDetails = styled.details`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  max-width: 600px;
  width: 100%;

  summary {
    cursor: pointer;
    color: #6b7280;
    font-size: 0.9rem;
    user-select: none;

    &:hover {
      color: #9ca3af;
    }
  }

  pre {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    font-size: 0.8rem;
    color: #9ca3af;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CloseButton = styled(ActionButton)`
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.2);

  &:hover {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }
`;

interface Props {
  children: ReactNode;
  componentName: string;
  onClose?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class VisualPanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`[${this.props.componentName}] Error caught by boundary:`, error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Report to telemetry/analytics if available
    try {
      if ((window as any).telemetry) {
        (window as any).telemetry.reportError({
          component: this.props.componentName,
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }
    } catch (telemetryError) {
      logger.error('Failed to report error to telemetry:', telemetryError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    } else {
      this.handleReset();
    }
  };

  override render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{ this.props.fallback } </>;
      }

      return (
        <ErrorContainer>
        <ErrorIcon size= { 48} />
        <ErrorTitle>{ this.props.componentName } Error </ErrorTitle>
          <ErrorMessage>
      { error?.message || 'An unexpected error occurred in this component.' }
      </ErrorMessage>

      {
        errorCount > 2 && (
          <ErrorMessage style={ { color: '#fbbf24', marginTop: '0.5rem' } }>
              ⚠️ This component has crashed { errorCount } times.Consider reloading the application.
            </ErrorMessage>
          )
      }

      <ErrorDetails>
        <summary>Error Details </summary>
          <pre>
      { error?.stack || 'No stack trace available' }
      {
        errorInfo?.componentStack && (
          <>
          { '\n\n'}Component Stack:
        { errorInfo.componentStack }
        </>
              )
      }
      </pre>
        </ErrorDetails>

        < ActionButtons >
        <ActionButton onClick={ this.handleReset }>
          <RefreshCw />
              Try Again
        </ActionButton>
      {
        this.props.onClose && (
          <CloseButton onClick={ this.handleClose }>
            <X />
                Close Panel
          </CloseButton>
            )
      }
      </ActionButtons>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Convenient wrapper function for visual panels
export const withVisualErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  onClose?: () => void
) => {
  return (props: P) => (
    <VisualPanelErrorBoundary componentName= { componentName } onClose = { onClose } >
      <Component { ...props } />
      </VisualPanelErrorBoundary>
  );
};