import React, { useCallback, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useAuth } from "./AuthProvider.jsx";
import GoogleSignInButton from "./GoogleSignInButton.jsx";

function parseApiError(err, fallback) {
  return err.response?.data?.error || fallback;
}

export default function LoginScreen() {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rFirst, setRFirst] = useState("");
  const [rLast, setRLast] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        parseApiError(err, err.response?.status === 401 ? "Credenciales incorrectas." : null) ||
          "No se pudo iniciar sesión. Revisá que el backend esté en marcha."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegisterSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({
        firstName: rFirst,
        lastName: rLast,
        email: rEmail,
        password: rPassword,
        confirmPassword: rConfirm,
      });
    } catch (err) {
      setError(
        parseApiError(err, null) ||
          "No se pudo crear la cuenta. Revisá los datos o probá con otro email."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const onGoogleCredential = useCallback(
    async (credential) => {
      setError("");
      setSubmitting(true);
      try {
        await loginWithGoogle(credential);
      } catch (err) {
        setError(
          parseApiError(err, null) ||
            "No se pudo iniciar sesión con Google. Revisá la configuración del servidor."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [loginWithGoogle]
  );

  return (
    <div
      className="d-flex min-vh-100 align-items-center justify-content-center px-3 py-4"
      style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
    >
      <Card style={{ width: "100%", maxWidth: 440 }} className="shadow">
        <Card.Body className="p-4">
          <Card.Title className="mb-1">Acceso al panel</Card.Title>
          <Card.Subtitle className="text-muted small mb-3">
            Creá una cuenta o entrá con email y contraseña o con Google.
          </Card.Subtitle>

          <Tabs
            id="auth-tabs"
            activeKey={tab}
            onSelect={(k) => {
              setTab(k || "login");
              setError("");
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
                <Form.Group className="mb-3" controlId="login-password">
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
                    minLength={8}
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">Mínimo 8 caracteres.</Form.Text>
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
                  {submitting ? "Creando cuenta…" : "Crear cuenta y entrar"}
                </Button>
              </Form>
            </Tab>
          </Tabs>

          {error ? <div className="text-danger small mb-3">{error}</div> : null}

          <div className="d-flex align-items-center gap-2 my-3">
            <hr className="flex-grow-1" />
            <span className="text-muted small text-nowrap">o</span>
            <hr className="flex-grow-1" />
          </div>

          <GoogleSignInButton onCredential={onGoogleCredential} disabled={submitting} />
        </Card.Body>
      </Card>
    </div>
  );
}
