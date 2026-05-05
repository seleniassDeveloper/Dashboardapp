import React from "react";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "./AuthProvider.jsx";
import LoginScreen from "./LoginScreen.jsx";

export default function LoginGate({ children }) {
  const { user, authLoading, firebaseConfigOk } = useAuth();

  if (authLoading) {
    return (
      <div
        className="d-flex min-vh-100 align-items-center justify-content-center"
        style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
      >
        <Spinner animation="border" variant="light" role="status">
          <span className="visually-hidden">Cargando…</span>
        </Spinner>
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
            Copiá las variables del proyecto Firebase (Ajustes del proyecto → Tus apps → Web) en{" "}
            <code className="text-warning">dashboard-react/.env</code> con prefijo{" "}
            <code className="text-warning">VITE_FIREBASE_*</code> y reiniciá <code>npm run dev</code>.
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
