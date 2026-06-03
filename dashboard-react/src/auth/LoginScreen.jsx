import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider.jsx";
import LanguageSwitcher from "../components/language/LanguageSwitcher.jsx";
import { Shield } from "lucide-react";
import "./LoginScreen.css";

export default function LoginScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const {
    loginWithGoogle,
    firebaseErrorMessage,
    authError,
    clearAuthError,
    loginDemo,
  } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");

  async function onGoogleClick() {
    setError("");
    setErrorCode("");
    clearAuthError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Google Auth error:", err);
      setErrorCode(err?.code || "");
      setError(firebaseErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div 
      className="login-container d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "radial-gradient(circle at 50% 50%, #fcfbff 0%, #f3ebff 100%)",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      <div 
        className="login-card p-5 rounded-5 shadow-lg text-center"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 20px 50px rgba(124, 58, 237, 0.06)",
        }}
      >
        <div className="login-lang-floater" style={{ position: "absolute", top: "20px", right: "20px" }}>
          <LanguageSwitcher />
        </div>

        <div className="login-header mb-4">
          <div 
            className="login-logo mx-auto mb-3.5 d-flex align-items-center justify-content-center rounded-circle text-white shadow-sm"
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)"
            }}
          >
            <Shield size={28} />
          </div>
          <h1 className="fw-black text-dark h3 mb-2" style={{ letterSpacing: "-0.02em" }}>
            Aura Studio
          </h1>
          <p className="text-secondary small px-3">
            Inicia sesión de forma segura usando tu cuenta comercial de Google.
          </p>
        </div>

        {(authError || error) && (
          <div className="error-msg mb-4 p-2.5 rounded-3 text-danger small bg-danger bg-opacity-10 border border-danger border-opacity-10">
            {authError || error}
          </div>
        )}

        <button
          type="button"
          className="btn-google w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-2 border shadow-sm fw-bold transition-all hover-scale-subtle"
          onClick={onGoogleClick}
          disabled={submitting}
          style={{
            background: "#ffffff",
            borderColor: "rgba(0, 0, 0, 0.08)",
            color: "#1e1b4b",
            fontSize: "14px",
            transition: "all 0.2s ease"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
            />
          </svg>
          {submitting ? "Redireccionando a Google..." : "Iniciar sesión con Google"}
        </button>

        <div className="d-flex align-items-center my-4">
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}></div>
          <span className="mx-3 text-secondary" style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>o bien</span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}></div>
        </div>

        <button
          type="button"
          className="btn-demo-bypass w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-2 border-0 shadow-sm fw-bold transition-all text-white hover-scale-subtle"
          onClick={loginDemo}
          style={{
            fontSize: "14px",
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            transition: "all 0.2s ease"
          }}
        >
          Iniciar sesión con Prueba Gratis (Demo)
        </button>

        {errorCode === "auth/unauthorized-domain" && (
          <div
            className="error-msg mt-4 p-2.5 rounded-3 text-warning small"
            style={{ background: "rgba(251, 191, 36, 0.1)", color: "#d97706", borderColor: "rgba(251, 191, 36, 0.2)" }}
            dangerouslySetInnerHTML={{ __html: t("errors.unauthorizedDomain") }}
          />
        )}

        <div className="mt-4 pt-3.5 border-top border-opacity-10 text-muted" style={{ fontSize: "11px", letterSpacing: "0.01em" }}>
          Al ingresar aceptas los términos de servicio y políticas de seguridad de datos.
        </div>
      </div>
    </div>
  );
}
