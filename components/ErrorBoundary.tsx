import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console so main process picks it up via console listeners
    console.error('Uncaught error in React render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', position: 'fixed', inset: 0, background: 'rgba(11,12,21,0.95)', color: 'white', padding: 20, zIndex: 9999, overflowY: 'auto' }}>
          <h2 style={{ fontSize: '18px', marginBottom: 8 }}>SpectraScope — Crash Detected</h2>
          <div style={{ fontSize: '13px', color: '#ffd3d3', marginBottom: 12 }}>{this.state.error?.message}</div>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ffb3b3', fontSize: 12 }}>{this.state.error?.stack}</pre>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => location.reload()} style={{ marginRight: 10, padding: '8px 12px', background: '#00f0ff', color: '#001', border: 'none', borderRadius: 4 }}>Reload</button>
            <button onClick={() => { navigator.clipboard.writeText(`${this.state.error?.message}\n\n${this.state.error?.stack}`); }} style={{ padding: '8px 12px', background: '#444', color: 'white', border: 'none', borderRadius: 4 }}>Copy Error</button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
