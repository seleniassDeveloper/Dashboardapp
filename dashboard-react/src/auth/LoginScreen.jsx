import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

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
      navigate(redirectTo, { replace: true });
    } catch (err) {
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
    if (rPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres (regla de Firebase).");
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
      setForgotMessage("Si el email existe, Firebase envió las instrucciones. Revisá tu bandeja (y spam).");
    } catch (err) {
      setErrorCode(err?.code || "");
      setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (forgotOpen) {
    return (
      <div
        className="d-flex min-vh-100 align-items-center justify-content-center px-3 py-4"
        style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
      >
        <Card style={{ width: "100%", maxWidth: 440 }} className="shadow">
          <Card.Body className="p-4">
            <Card.Title className="mb-3">Recuperar contraseña</Card.Title>
            <Card.Subtitle className="text-muted small mb-3">
              Te enviamos un correo desde Firebase para restablecer la clave.
            </Card.Subtitle>
            <Form onSubmit={onForgotSubmit}>
              <Form.Group className="mb-3" controlId="forgot-email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </Form.Group>
              {error ? <div className="text-danger small mb-3">{error}</div> : null}
              {forgotMessage ? <div className="text-success small mb-3">{forgotMessage}</div> : null}
              <Button type="submit" variant="primary" className="w-100 mb-2" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar enlace"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-100 p-0"
                onClick={() => {
                  setForgotOpen(false);
                  setError("");
                  setErrorCode("");
                  setForgotMessage("");
                }}
              >
                Volver al inicio de sesión
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="d-flex min-vh-100 align-items-center justify-content-center px-3 py-4"
      style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
    >
      <Card style={{ width: "100%", maxWidth: 440 }} className="shadow">
        <Card.Body className="p-4">
          <Card.Title className="mb-1">Acceso al panel</Card.Title>
          <Card.Subtitle className="text-muted small mb-3">
            Autenticación con Firebase (email, Google y recuperación de contraseña).
          </Card.Subtitle>

          <Tabs
            id="auth-tabs"
            activeKey={tab}
            onSelect={(k) => {
              setTab(k || "login");
              setError("");
              setErrorCode("");
            }}
            className="mb-3"
            justify
          >
            <Tab eventKey="login" title="Iniciar sesión">
              <Form onSubmit={onLoginSubmit} className="mt-3">
                <Form.Group className="mb-3" controlId="login-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="login-password">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
                <div className="mb-3 text-end">
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0"
                    onClick={() => {
                      setForgotOpen(true);
                      setForgotEmail(email);
                      setError("");
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
                  {submitting ? "Entrando…" : "Entrar"}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="register" title="Crear cuenta">
              <Form onSubmit={onRegisterSubmit} className="mt-3">
                <div className="row g-2">
                  <div className="col-md-6">
                    <Form.Group className="mb-3" controlId="reg-first">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control
                        value={rFirst}
                        onChange={(e) => setRFirst(e.target.value)}
                        autoComplete="given-name"
                        required
                        disabled={submitting}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3" controlId="reg-last">
                      <Form.Label>Apellido</Form.Label>
                      <Form.Control
                        value={rLast}
                        onChange={(e) => setRLast(e.target.value)}
                        autoComplete="family-name"
                        required
                        disabled={submitting}
                      />
                    </Form.Group>
                  </div>
                </div>
                <Form.Group className="mb-3" controlId="reg-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={submitting}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="reg-password">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={rPassword}
                    onChange={(e) => setRPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">Mínimo 6 caracteres (Firebase).</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3" controlId="reg-confirm">
                  <Form.Label>Repetir contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={rConfirm}
                    onChange={(e) => setRConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                  />
                </Form.Group>
                <Button type="submit" variant="success" className="w-100" disabled={submitting}>
                  {submitting ? "Creando cuenta…" : "Crear cuenta"}
                </Button>
              </Form>
            </Tab>
          </Tabs>

          {error ? <div className="text-danger small mb-3">{error}</div> : null}
          {errorCode === "auth/operation-not-allowed" ? (
            <div className="alert alert-warning py-2 small mb-3">
              <div className="fw-semibold mb-1">Cómo habilitarlo en Firebase</div>
              <ol className="mb-0 ps-3">
                <li>
                  Firebase Console → <strong>Authentication</strong> → <strong>Método de acceso</strong>
                </li>
                <li>
                  Activá <strong>Email/Password</strong> (para el formulario) y/o <strong>Google</strong>
                </li>
                <li>
                  En <strong>Dominios autorizados</strong>, asegurate de tener <code>localhost</code>
                </li>
                <li>
                  Recargá la página y probá de nuevo
                </li>
              </ol>
            </div>
          ) : null}

          <div className="d-flex align-items-center gap-2 my-3">
            <hr className="flex-grow-1" />
            <span className="text-muted small text-nowrap">o</span>
            <hr className="flex-grow-1" />
          </div>

          <Button
            type="button"
            variant="outline-secondary"
            className="w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={onGoogleClick}
            disabled={submitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continuar con Google
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
