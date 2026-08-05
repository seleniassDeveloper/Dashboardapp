import React, { useState, useEffect } from "react";
import { Card, Form, Button, Badge, Alert, Spinner, Modal, InputGroup } from "react-bootstrap";
import { MessageSquare, CheckCircle2, AlertTriangle, Send, Eye, EyeOff, Key, Phone, UserCheck, ShieldCheck, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";

export default function WhatsAppSettings() {
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [phoneId, setPhoneId] = useState("");
  const [wpBusinessId, setWpBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [hasToken, setHasToken] = useState(false);
  
  const [showToken, setShowToken] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modal mensaje de prueba
  const [showTestModal, setShowTestModal] = useState(false);
  const [targetPhone, setTargetPhone] = useState("");
  const [testResult, setTestResult] = useState(null);

  const fetchWhatsAppConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get("/businesses/me/integrations/whatsapp");
      if (res.data?.success && res.data?.whatsapp) {
        const wp = res.data.whatsapp;
        setPhoneId(wp.phoneId || "");
        setWpBusinessId(wp.businessId || "");
        setStaffPhone(wp.staffPhone || "");
        setToken(wp.token || "");
        setHasToken(Boolean(wp.hasToken));
        setSlug(wp.slug || "");
        setTargetPhone(wp.staffPhone || "");
      }
    } catch (err) {
      console.error("Error al cargar configuración de WhatsApp:", err);
      setFeedback({ type: "danger", message: "No se pudo cargar la configuración actual de WhatsApp." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppConfig();
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);

      const payload = {
        phoneId: phoneId.trim(),
        businessId: wpBusinessId.trim(),
        token: token.trim(),
        staffPhone: staffPhone.trim()
      };

      const res = await api.put("/businesses/me/integrations/whatsapp", payload);
      if (res.data?.success) {
        setFeedback({ type: "success", message: "Configuración de WhatsApp guardada exitosamente." });
        fetchWhatsAppConfig();
      }
    } catch (err) {
      console.error("Error al guardar WhatsApp:", err);
      setFeedback({ type: "danger", message: err.response?.data?.error || "Error al guardar la integración de WhatsApp." });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!targetPhone.trim()) {
      setTestResult({ type: "danger", message: "Por favor ingresa un número de teléfono válido." });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const res = await api.post("/businesses/me/integrations/whatsapp/test-message", {
        targetPhone: targetPhone.trim()
      });

      if (res.data?.success) {
        setTestResult({ type: "success", message: res.data.message || "Mensaje de prueba enviado con éxito." });
      }
    } catch (err) {
      console.error("Error al enviar mensaje de prueba:", err);
      setTestResult({
        type: "danger",
        message: err.response?.data?.error || "Error al enviar el mensaje de prueba. Verifica las credenciales."
      });
    } finally {
      setTesting(false);
    }
  };

  const isConnected = Boolean(phoneId.trim() && (hasToken || token.trim()));

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2 small">{isEs ? "Cargando integración de WhatsApp..." : "Loading WhatsApp integration..."}</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "#ffffff" }}>
        <Card.Body className="p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-4 d-flex align-items-center justify-content-center text-white">
              <MessageSquare size={32} />
            </div>
            <div>
              <h4 className="fw-bold mb-1 text-white">WhatsApp Cloud API (Negocio)</h4>
              <p className="mb-0 text-white-50 small" style={{ fontSize: "13px" }}>
                Conecta tu número oficial de WhatsApp para agendado automático directo en el Dashboard y avisos al personal.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Badge
              bg={isConnected ? "light" : "danger"}
              className={`px-3 py-2 rounded-pill fw-bold text-uppercase ${isConnected ? "text-success" : "text-white"}`}
              style={{ fontSize: "11px", letterSpacing: "0.05em" }}
            >
              {isConnected ? (
                <span className="d-flex align-items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-success" /> CONECTADO
                </span>
              ) : (
                <span className="d-flex align-items-center gap-1.5">
                  <AlertTriangle size={14} /> FALTAN DATOS
                </span>
              )}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {feedback && (
        <Alert variant={feedback.type} dismissible onClose={() => setFeedback(null)} className="rounded-3 shadow-xs">
          {feedback.message}
        </Alert>
      )}

      {/* Main Settings Card */}
      <Card className="border-0 shadow-sm rounded-4 bg-white">
        <Card.Body className="p-4">
          <Form onSubmit={handleSave}>
            <div className="row g-4">
              {/* Left Column: Credentials */}
              <div className="col-lg-7 d-flex flex-column gap-3">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <Key size={18} className="text-emerald-600" />
                  Credenciales de Meta Cloud API
                </h6>

                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">
                    Phone Number ID <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 104829104810294"
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    className="rounded-3 font-monospace smaller"
                  />
                  <Form.Text className="text-muted smaller">
                    Identificador de teléfono generado en la consola Meta Developers.
                  </Form.Text>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">
                    WhatsApp Business Account ID
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 109849201948201"
                    value={wpBusinessId}
                    onChange={(e) => setWpBusinessId(e.target.value)}
                    className="rounded-3 font-monospace smaller"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">
                    Token Permanente de Meta <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showToken ? "text" : "password"}
                      placeholder="EAAG..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="rounded-start-3 font-monospace smaller"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowToken(!showToken)}
                      className="rounded-end-3"
                    >
                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted smaller">
                    El token nunca se muestra completo una vez guardado por razones de seguridad.
                  </Form.Text>
                </Form.Group>
              </div>

              {/* Right Column: Staff & Webhook info */}
              <div className="col-lg-5 d-flex flex-column gap-3 border-start-lg ps-lg-4">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600" />
                  Personal & Webhook Multi-Tenant
                </h6>

                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">
                    WhatsApp del Personal / Staff (`staffPhone`)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 5491122334455"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="rounded-3 font-monospace smaller"
                  />
                  <Form.Text className="text-muted smaller">
                    Número donde el personal recibirá notificaciones o desvíos de atención.
                  </Form.Text>
                </Form.Group>

                <div className="p-3 bg-light rounded-3 border">
                  <span className="small text-muted fw-semibold d-block mb-1">Slug del negocio para reservas:</span>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="secondary" className="px-2.5 py-1.5 font-monospace fw-bold" style={{ fontSize: "12px" }}>
                      {slug || "sin-slug"}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-3 text-emerald-900 smaller">
                  <div className="d-flex align-items-center gap-1.5 fw-bold mb-1">
                    <ShieldCheck size={16} className="text-emerald-600" /> Webhook de Meta
                  </div>
                  <span>Configura tu Webhook en Meta apuntando a:</span>
                  <code className="d-block mt-1 p-1 bg-white rounded border text-emerald-800 word-break-all" style={{ fontSize: "11px" }}>
                    {window.location.origin}/api/webhooks/whatsapp
                  </code>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-4 mt-4 border-top">
              <Button
                variant="outline-emerald"
                className="rounded-pill px-4 fw-bold d-flex align-items-center gap-2 border-emerald-600 text-emerald-700"
                onClick={() => {
                  setTestResult(null);
                  setShowTestModal(true);
                }}
                disabled={!isConnected}
              >
                <Send size={16} /> Enviar mensaje de prueba
              </Button>

              <Button
                type="submit"
                variant="success"
                disabled={saving}
                className="rounded-pill px-4 py-2 fw-bold text-white shadow-xs d-flex align-items-center gap-2"
                style={{ backgroundColor: "#059669", borderColor: "#059669" }}
              >
                {saving ? <Spinner size="sm" animation="border" /> : <CheckCircle2 size={18} />}
                <span>{isEs ? "Guardar Configuración" : "Save Integration"}</span>
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Modal Mensaje de Prueba */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2 text-dark">
            <Send size={18} className="text-emerald-600" />
            Enviar Mensaje de Prueba por WhatsApp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p className="small text-muted mb-3">
            Ingresa un número de WhatsApp (con código de país sin +) para enviar un mensaje de prueba utilizando tus credenciales de Meta Cloud API.
          </p>

          {testResult && (
            <Alert variant={testResult.type} className="rounded-3 smaller py-2 mb-3">
              {testResult.message}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-secondary">
              Número de WhatsApp Destino (E.164)
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: 5491122334455"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="rounded-3 font-monospace smaller"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="rounded-pill px-3 fw-semibold smaller" onClick={() => setShowTestModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            className="rounded-pill px-4 fw-bold smaller d-flex align-items-center gap-1.5"
            style={{ backgroundColor: "#059669", borderColor: "#059669" }}
            onClick={handleSendTestMessage}
            disabled={testing}
          >
            {testing ? <Spinner size="sm" animation="border" /> : <Send size={14} />}
            <span>Enviar mensaje</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
