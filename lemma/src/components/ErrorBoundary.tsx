import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort boundary for render errors. Progress lives in localStorage, so a
 * reload is always safe; this screen exists so a blank page never happens.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Lemma render error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="page not-found">
        <div className="container narrow">
          <p className="eyebrow">500 — unexpected state</p>
          <h1>This page failed to render.</h1>
          <p className="page-lede">
            Your saved progress is still in this browser. Reload to try again, or head back to the problem bank.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a className="btn btn-secondary" href="/">
              Back home
            </a>
          </div>
          <p className="error-detail">
            <code>{this.state.error.message}</code>
          </p>
        </div>
      </div>
    );
  }
}
