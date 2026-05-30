import React, { useState } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { ShieldAlert, Key, UserCheck, Lock } from "lucide-react";
import api from "../../lib/api.js";
import { useAuth } from "../../auth/AuthProvider.jsx";

export default function RoleSwitchValidationModal({ show, onHide, requestedRole, onSuccess }) {
  const { business } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !requestedRole) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/validate-role-switch", {
        email: email.trim(),
        password,
        requestedRole: requestedRole.toUpperCase(),
        businessId: business?.id
      });

      if (res.data?.success && res.data?.authorized) {
        // Guardar mock role temporal en localStorage
        localStorage.setItem("x_mock_role", requestedRole.toLowerCase());
        
        onSuccess?.();
        setEmail("");
        setPassword("");
      } else {
        setError("Error de autorización desconocido.");
      }
    } catch (err) {
      console.error("Role switch verification error:", err);
      if (err.response?.status === 403) {
        setError("No tienes permisos para cambiar el modo de visualización.");
      } else {
        setError(err.response?.data?.error || "Error al verificar las credenciales del administrador.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      contentClassName="border-0 shadow-lg"
      style={{
        backdropFilter: "blur(16px) saturate(120%)",
        WebkitBackdropFilter: "blur(16px) saturate(120%)",
      }}
    >
      <div
        className="rounded-3 overflow-hidden p-1"
        style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.25)"
        }}
      >
        <Modal.Header className="border-0 bg-transparent py-4 text-center d-flex flex-column align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white mb-3 shadow-lg"
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
              border: "3px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)"
            }}
          >
            <Lock size={26} className="animate-pulse" />
          </div>
          <Modal.Title className="h4 fw-black text-dark block-text">Validar cambio de rol</Modal.Title>
          <p className="text-secondary small px-3 mt-2 mb-0" style={{ lineHeight: "1.5" }}>
            Para cambiar el modo de visualización debes ingresar credenciales de un usuario autorizado.
          </p>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="bg-transparent px-4 py-2">
            {error && (
              <Alert
                variant="danger"
                className="d-flex align-items-center gap-2 border-0 rounded-3 shadow-sm py-2 px-3 mb-3 small"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#dc2626" }}
              >
                <ShieldAlert size={16} className="flex-shrink-0" />
                <span className="fw-semibold">{error}</span>
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label htmlFor="admin-email" className="fw-bold text-dark small mb-1 d-flex align-items-center gap-1.5">
                <UserCheck size={14} className="text-primary" />
                <span>Email o usuario</span>
              </Form.Label>
              <Form.Control
                id="admin-email"
                type="email"
                required
                placeholder="ejemplo@negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="py-2.5 px-3 border-0 bg-white shadow-sm-hover"
                style={{
                  borderRadius: "12px",
                  fontSize: "14px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="admin-password" className="fw-bold text-dark small mb-1 d-flex align-items-center gap-1.5">
                <Key size={14} className="text-primary" />
                <span>Contraseña</span>
              </Form.Label>
              <Form.Control
                id="admin-password"
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="py-2.5 px-3 border-0 bg-white shadow-sm-hover"
                style={{
                  borderRadius: "12px",
                  fontSize: "14px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                }}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 bg-transparent py-4 px-4 gap-2 d-flex justify-content-end">
            <Button
              variant="light"
              onClick={onHide}
              disabled={loading}
              className="rounded-pill px-4 py-2 border-0 fw-semibold text-secondary shadow-sm hover-bg-gray-100 transition-all small"
              style={{ minWidth: "120px" }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-pill px-4 py-2 border-0 fw-bold text-white shadow-md hover-scale transition-all small d-flex align-items-center justify-content-center gap-1.5"
              style={{
                minWidth: "180px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                boxShadow: "0 4px 14px 0 rgba(124, 58, 237, 0.3)"
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  <span>Validando...</span>
                </>
              ) : (
                "Validar y cambiar rol"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
}
