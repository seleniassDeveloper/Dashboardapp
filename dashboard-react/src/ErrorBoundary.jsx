import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("UI crashed:", error, errorInfo);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          className="d-flex min-vh-100 align-items-center justify-content-center px-3"
          style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
        >
          <div className="bg-white rounded shadow p-4" style={{ width: "100%", maxWidth: 720 }}>
            <div className="fw-semibold mb-2">Se rompió la pantalla al cargar el dashboard</div>
            <div className="text-muted small mb-3">
              Copiá este error (o abrí la consola) y lo corregimos.
            </div>
            <pre className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>
              {String(error?.stack || error?.message || error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

