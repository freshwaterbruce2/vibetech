import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const ErrorTitle = styled.h1`
  font-size: 48px;
  color: ${props => props.theme.error};
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  font-size: 18px;
  text-align: center;
  max-width: 600px;
  margin-bottom: 32px;
  color: ${props => props.theme.textSecondary};
`;

const ErrorDetails = styled.pre`
  background: ${props => props.theme.surface};
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  max-width: 800px;
  overflow-x: auto;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
`;

const ReloadButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 24px;
  
  &:hover {
    opacity: 0.9;
  }
`;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Oops!</ErrorTitle>
          <ErrorMessage>
            Something went wrong. The application encountered an unexpected error.
          </ErrorMessage>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <ErrorDetails>{this.state.error.stack}</ErrorDetails>
          )}
          <ReloadButton onClick={this.handleReload}>
            Reload Application
          </ReloadButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;