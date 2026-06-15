import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Accordion } from "react-bootstrap";
import { Send, X, AlertOctagon, TerminalSquare, Info } from "lucide-react";
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
      <div className="border-0 shadow-lg" style={{ borderRadius: "24px", overflow: "hidden", backgroundColor: "#fff" }}>
        <Modal.Header className="border-0 px-4 pt-4 pb-2 d-flex justify-content-between align-items-start">
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-2 text-warning mb-1">
              <AlertOctagon size={28} className="text-orange-500" style={{ color: "#f97316" }} />
              <h3 className="h5 fw-bold text-dark mb-0">¡Ups! Algo no salió como esperábamos</h3>
            </div>
            <p className="text-muted small mb-0" style={{ lineHeight: "1.5" }}>
              Nuestro equipo técnico ya ha sido notificado, pero nos ayudaría mucho saber qué estabas intentando hacer.
            </p>
          </div>
          <button 
            type="button" 
            className="btn-close-custom p-2 bg-light rounded-circle hover-bg-gray-200 transition-all" 
            onClick={() => setShow(false)}
            style={{ border: "none", color: "#64748b", marginTop: "-4px", marginRight: "-4px" }}
          >
            <X size={18} />
          </button>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-3">
            {success && (
              <Alert variant="success" className="border-0 rounded-4 small py-3 px-4 d-flex align-items-center gap-2 shadow-sm bg-success bg-opacity-10 text-success">
                <Info size={18} />
                <span className="fw-medium">¡Gracias por tu reporte! Lo revisaremos pronto.</span>
              </Alert>
            )}

            {errorText && (
              <Alert variant="danger" className="border-0 rounded-4 small py-3 px-4 shadow-sm bg-danger bg-opacity-10 text-danger">
                ✗ {errorText}
              </Alert>
            )}

            <div className="bg-light bg-opacity-50 p-3 rounded-4 mb-4 border border-light">
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary mb-1">Tu Nombre (Opcional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej. María Pérez"
                  className="rounded-3 border-gray-200 px-3 py-2 text-sm shadow-none focus-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting || success}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary mb-1">Tu Email (Opcional)</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="rounded-3 border-gray-200 px-3 py-2 text-sm shadow-none focus-ring"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || success}
                />
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label className="small fw-semibold text-secondary mb-1">¿Qué estabas haciendo cuando ocurrió el error?</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Ej. Estaba intentando agendar un turno para el servicio de corte..."
                  className="rounded-3 border-gray-200 px-3 py-2 text-sm shadow-none focus-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting || success}
                  required
                />
              </Form.Group>
            </div>

            <Accordion flush className="rounded-4 overflow-hidden border border-gray-100">
              <Accordion.Item eventKey="0" className="border-0 bg-light">
                <Accordion.Header className="custom-accordion-header text-muted small">
                  <div className="d-flex align-items-center gap-2 small text-secondary fw-medium">
                    <TerminalSquare size={14} />
                    <span>Ver detalles técnicos (Avanzado)</span>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="bg-dark text-light p-3">
                  <div className="small fw-bold text-gray-400 mb-1">Ruta:</div>
                  <div className="font-monospace text-warning text-break mb-3" style={{ fontSize: "11px" }}>{path}</div>
                  <div className="small fw-bold text-gray-400 mb-1">Stack Trace:</div>
                  <pre className="m-0 font-monospace text-white overflow-auto" style={{ fontSize: "10px", maxHeight: "150px" }}>
                    {stack}
                  </pre>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Modal.Body>

          <Modal.Footer className="border-0 px-4 pb-4 pt-2 d-flex justify-content-end gap-2 bg-white">
            <Button 
              variant="light" 
              onClick={() => setShow(false)} 
              className="rounded-pill px-4 py-2 border-0 bg-gray-100 hover-bg-gray-200 text-secondary fw-semibold small transition-all"
              disabled={submitting}
            >
              Cerrar
            </Button>
            <Button 
              type="submit" 
              className="rounded-pill px-4 py-2 border-0 text-white d-flex align-items-center gap-2 fw-semibold small shadow-sm transition-all"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
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
