import React from 'react';

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: String((error as any)?.message ?? error) };
  }

  componentDidCatch(error: unknown) {
    // No-op: could log to a file or telemetry later
    void error;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
          <h2>Something went wrong.</h2>
          <div style={{ color: '#b91c1c' }}>{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
