import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string; info?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('🛑 ErrorBoundary atrapó un error:', error, errorInfo);
    this.setState({ info: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h2>Se produjo un error en la aplicación</h2>
          <p style={{ color: '#b91c1c' }}>{this.state.message}</p>
          {import.meta.env.DEV && (
            <pre style={{ background: '#fee2e2', padding: 12, borderRadius: 8, overflow: 'auto' }}>
              {this.state.info}
            </pre>
          )}
          <button onClick={() => location.reload()} style={{ marginTop: 12 }}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
