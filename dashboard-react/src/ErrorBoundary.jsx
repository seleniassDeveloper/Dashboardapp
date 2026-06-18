import React from "react";
import { useTranslation } from "react-i18next";

function ErrorFallback({ error }) {
  const { t } = useTranslation("common");
  return (
    <div className="auth-loading-screen d-flex min-vh-100 align-items-center justify-content-center px-3">
      <div className="bg-white rounded shadow p-4" style={{ width: "100%", maxWidth: 720 }}>
        <div className="fw-semibold mb-2">{t("errorBoundary.title")}</div>
        <div className="text-muted small mb-3">{t("errorBoundary.subtitle")}</div>
        <pre className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>
          {String(error?.stack || error?.message || error)}
        </pre>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    // Detect dynamic import failure (Vite chunk hash changes after deployments)
    const isChunkError = 
      error?.name === 'ChunkLoadError' || 
      /Failed to fetch dynamically imported module/i.test(error?.message) ||
      /Importing a module script failed/i.test(error?.message) ||
      /fallado la carga del m.dulo/i.test(error?.message);

    if (isChunkError) {
      // Avoid infinite reload loops
      if (!sessionStorage.getItem('chunk_reloaded')) {
        sessionStorage.setItem('chunk_reloaded', 'true');
        window.location.reload();
        return { error: null };
      }
    }

    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("UI crashed:", error, errorInfo);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return <ErrorFallback error={error} />;
    }

    return this.props.children;
  }
}
