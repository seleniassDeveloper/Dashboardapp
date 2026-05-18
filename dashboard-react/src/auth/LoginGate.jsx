import React from "react";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "./AuthProvider.jsx";
import LoginScreen from "./LoginScreen.jsx";

export default function LoginGate({ children }) {
  const { user, authLoading, firebaseConfigOk, authDisabled } = useAuth();

  if (authDisabled) {
    return children;
  }

  const googleRedirectPending =
    typeof sessionStorage !== "undefined" && sessionStorage.getItem("authRedirectPending") === "1";

  if (authLoading) {
    return (
      <div
        className="d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3"
        style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
      >
        <Spinner animation="border" variant="light" role="status">
          <span className="visually-hidden">Cargando…</span>
        </Spinner>
        {googleRedirectPending && (
          <p className="text-white-50 small mb-0">Completando inicio de sesión con Google…</p>
        )}
      </div>
    );
  }

  if (!firebaseConfigOk) {
    return (
      <div
        className="d-flex min-vh-100 align-items-center justify-content-center px-3"
        style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
      >
        <div className="text-white text-center" style={{ maxWidth: 480 }}>
          <h1 className="h5 mb-3">Falta configurar Firebase en el frontend</h1>
          <p className="small text-white-50 mb-0">
            En <strong>local</strong>: copiá las claves de Firebase en{" "}
            <code className="text-warning">dashboard-react/.env</code> (<code>VITE_FIREBASE_*</code>).
            <br />
            En <strong>Vercel</strong>: Settings → Environment Variables → mismas variables →{" "}
            <strong>Redeploy</strong> (sin redeploy el build queda sin API key).
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return children;
}
