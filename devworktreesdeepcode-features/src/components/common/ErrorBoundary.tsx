import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-screen items-center justify-center bg-aura-background">
          <div className="max-w-md p-8 text-center">
            <div className="mb-6 text-6xl">⚠️</div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-aura-textMuted">
              We apologize for the inconvenience. The error has been logged.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-aura-accent px-4 py-2 text-white transition-colors hover:bg-aura-accentSecondary"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-aura-accent px-4 py-2 text-aura-accent transition-colors hover:bg-aura-accent/10"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;