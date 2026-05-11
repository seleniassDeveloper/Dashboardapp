import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";
import "./LoginScreen.css";

export default function LoginScreen() {
  const {
    loginWithEmailPassword,
    registerWithEmailPassword,
    loginWithGooglePopup,
    sendPasswordReset,
    firebaseErrorMessage,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location?.state?.from || "/app";

  const [tab, setTab] = useState("login");
  const [forgotOpen, setForgotOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rFirst, setRFirst] = useState("");
  const [rLast, setRLast] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setSubmitting(true);
    try {
      await loginWithEmailPassword(email, password);
      // El redireccionamiento ocurrirá automáticamente a través de LoginGate -> user state change
      // Pero forzamos navegación por si acaso
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setErrorCode(err?.code || "");
      setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegisterSubmit(e) {
    e.preventDefault();
    setError("");
    setErrorCode("");
    if (rPassword !== rConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await registerWithEmailPassword({
        firstName: rFirst,
        lastName: rLast,
        email: rEmail,
        password: rPassword,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrorCode(err?.code || "");
      setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleClick() {
    setError("");
    setErrorCode("");
    setSubmitting(true);
    try {
      await loginWithGooglePopup();
      // Si es exitoso, LoginGate reaccionará al cambio de estado de 'user'
    } catch (err) {
      setErrorCode(err?.code || "");
      setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotSubmit(e) {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setForgotMessage("");
    setSubmitting(true);
    try {
      await sendPasswordReset(forgotEmail);
      setForgotMessage("Revisá tu bandeja de entrada para restablecer la clave.");
    } catch (err) {
      setErrorCode(err?.code || "");
      setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (forgotOpen) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">DS</div>
            <h1 className="login-title">Recuperar Acceso</h1>
            <p className="login-subtitle">Te enviaremos un correo para restablecer tu clave.</p>
          </div>

          <form onSubmit={onForgotSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}
            {forgotMessage && <div className="success-msg">{forgotMessage}</div>}

            <button type="submit" className="btn-primary-custom" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar enlace"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                className="forgot-link"
                onClick={() => {
                  setForgotOpen(false);
                  setError("");
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">DS</div>
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">Accede a tu panel de control avanzado.</p>
        </div>

        <div className="auth-tabs-nav">
          <div
            className={`auth-tab-item ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setError("");
            }}
          >
            Iniciar Sesión
          </div>
          <div
            className={`auth-tab-item ${tab === "register" ? "active" : ""}`}
            onClick={() => {
              setTab("register");
              setError("");
            }}
          >
            Crear Cuenta
          </div>
        </div>

        {tab === "login" ? (
          <form onSubmit={onLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="nombre@ejemplo.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Contraseña</label>
                <button
                  type="button"
                  className="forgot-link"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setForgotOpen(true)}
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="btn-primary-custom" disabled={submitting}>
              {submitting ? "Autenticando..." : "Entrar al Panel"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit}>
            <div className="row g-2">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-input"
                    value={rFirst}
                    onChange={(e) => setRFirst(e.target.value)}
                    placeholder="Juan"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input
                    className="form-input"
                    value={rLast}
                    onChange={(e) => setRLast(e.target.value)}
                    placeholder="Pérez"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={rEmail}
                onChange={(e) => setREmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                value={rPassword}
                onChange={(e) => setRPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Contraseña</label>
              <input
                type="password"
                className="form-input"
                value={rConfirm}
                onChange={(e) => setRConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                disabled={submitting}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="btn-primary-custom" disabled={submitting}>
              {submitting ? "Creando Cuenta..." : "Registrarse"}
            </button>
          </form>
        )}

        <div className="divider">
          <span>o continúa con</span>
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={onGoogleClick}
          disabled={submitting}
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
          Google
        </button>

        {errorCode === "auth/operation-not-allowed" && (
          <div className="error-msg mt-3" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
            Habilita Email/Password y Google en Firebase Console.
          </div>
        )}
      </div>
    </div>
  );
}
