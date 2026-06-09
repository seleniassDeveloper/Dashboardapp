import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { AlertTriangle, Send, X } from "lucide-react";
import { api, setErrorListener } from "../../lib/api.js";

export default function GlobalErrorModal() {
  const [show, setShow] = useState(false);
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [stack, setStack] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setErrorListener((error) => {
      // Evitar abrir múltiples modales si hay errores simultáneos
      if (show) return;

      const method = error.config?.method?.toUpperCase() || "";
      const url = error.config?.url || "";
      const status = error.response?.status ? ` - Código ${error.response.status}` : "";
      
      setPath(`${window.location.pathname} (${method} ${url}${status})`);
      setStack(error.stack || error.message || String(error));
      setDescription("");
      setSuccess(false);
      setErrorText("");
      setShow(true);
    });

    return () => {
      setErrorListener(null);
    };
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorText("");
    
    try {
      await api.post("/public/support/report-error", {
        name,
        email,
        description: description || "Error técnico automático sin comentario del usuario.",
        path,
        stack
      });
      setSuccess(true);
      setTimeout(() => {
        setShow(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorText("No se pudo enviar el reporte de error. Inténtelo más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      centered
      backdrop="static"
      keyboard={false}
      style={{ zIndex: 1055 }}
    >
      <div className="card-premium p-1 bg-white" style={{ borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(15, 23, 42, 0.08)" }}>
        <Modal.Header className="border-0 px-4 pt-4 pb-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 text-danger">
            <AlertTriangle size={24} />
            <h3 className="h5 fw-black text-dark mb-0">🚨 Error del Sistema</h3>
          </div>
          <button 
            type="button" 
            className="btn-close-custom" 
            onClick={() => setShow(false)}
            style={{ border: "none", background: "transparent", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-3">
            <p className="text-muted small mb-4">
              Ha ocurrido un error al procesar tu solicitud. Describe qué estabas intentando hacer para ayudarnos a solucionarlo de inmediato.
            </p>

            {success && (
              <Alert variant="success" className="border-0 rounded-3 small py-2">
                ✓ ¡Reporte enviado! Lo revisaremos a la brevedad.
              </Alert>
            )}

            {errorText && (
              <Alert variant="danger" className="border-0 rounded-3 small py-2">
                ✗ {errorText}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Tu Nombre (Opcional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Juan Pérez"
                className="rounded-3 border-light bg-light text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting || success}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Tu Email (Opcional)</Form.Label>
              <Form.Control
                type="email"
                placeholder="ejemplo@correo.com"
                className="rounded-3 border-light bg-light text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || success}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">¿Qué estaba sucediendo?</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Ej. Estaba intentando cargar los clientes y la pantalla quedó en blanco..."
                className="rounded-3 border-light bg-light text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting || success}
                required
              />
            </Form.Group>

            <div className="bg-light p-3 rounded-4 mb-3 border" style={{ borderColor: "rgba(15, 23, 42, 0.05)" }}>
              <div className="small fw-bold text-muted mb-1">Ubicación del Error:</div>
              <div className="font-monospace text-xs text-danger text-break">{path}</div>
            </div>

            <details className="mt-2">
              <summary className="small text-muted cursor-pointer" style={{ outline: "none" }}>
                Ver detalles técnicos
              </summary>
              <pre className="mt-2 p-3 bg-dark text-white rounded-3 font-monospace text-xs overflow-auto" style={{ maxHeight: "150px" }}>
                {stack}
              </pre>
            </details>
          </Modal.Body>

          <Modal.Footer className="border-0 px-4 pb-4 pt-0">
            <Button 
              variant="light" 
              onClick={() => setShow(false)} 
              className="rounded-xl px-4 py-2 border small fw-semibold text-dark"
              disabled={submitting}
            >
              Cerrar
            </Button>
            <Button 
              type="submit" 
              className="btn-premium rounded-xl px-4 py-2 border-0 text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-1.5 small"
              style={{ background: "var(--lp-accent)" }}
              disabled={submitting || success}
            >
              {submitting ? "Enviando..." : (
                <>
                  <Send size={14} />
                  Enviar Reporte
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
}
