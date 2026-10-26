import { Component, ReactNode } from 'react';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <main className="container">
          <h1>Midagi läks viltu</h1>
          <pre style={{ color: '#fca5a5', fontSize: 12, overflow: 'auto', padding: 12, background: '#1e293b', borderRadius: 6 }}>
            {this.state.error.message}
          </pre>
          <button className="btn primary" onClick={() => window.location.reload()}>
            Lae leht uuesti
          </button>
          <a href="/" style={{ marginLeft: 10 }} className="btn">Avalehele</a>
        </main>
      </div>
    );
  }
}
