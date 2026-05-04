import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { useAuth } from "./AuthProvider.jsx";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.response?.status === 401 ? "Credenciales incorrectas." : null) ||
        "No se pudo iniciar sesión. Revisá que el backend esté en marcha.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="d-flex min-vh-100 align-items-center justify-content-center px-3"
      style={{ background: "linear-gradient(160deg, #1a1d24 0%, #2d3340 100%)" }}
    >
      <Card style={{ width: "100%", maxWidth: 400 }} className="shadow">
        <Card.Body className="p-4">
          <Card.Title className="mb-3">Acceso al panel</Card.Title>
          <Card.Subtitle className="text-muted small mb-4">
            Ingresá con el usuario creado desde la terminal del backend.
          </Card.Subtitle>
          <Form onSubmit={onSubmit}>
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
            {error ? <div className="text-danger small mb-3">{error}</div> : null}
            <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
