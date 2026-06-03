import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, Spinner } from "react-bootstrap";
import { 
  Zap, MessageSquare, Mail, Calendar, CreditCard, Share2, 
  Settings2, CheckCircle2, AlertTriangle, ShieldAlert, Key, Globe, Eye, EyeOff 
} from "lucide-react";
import { useTranslation } from "react-i18next";

const InstagramIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const INTEGRATION_DEFAULTS = {
  whatsapp: { status: "CONNECTED", nameEs: "WhatsApp Business", nameEn: "WhatsApp Business", key: "whatsapp", descEs: "Envía recordatorios y confirmaciones automáticas por WhatsApp.", descEn: "Send automatic confirmations and reminders via WhatsApp." },
  smtp: { status: "CONNECTED", nameEs: "Email SMTP", nameEn: "SMTP Email", key: "smtp", descEs: "Configura tu propio servidor de correos (Gmail, Outlook) para envíos masivos.", descEn: "Set up your own mail server (Gmail, Outlook) for bulk sending." },
  calendar: { status: "CONNECTED", nameEs: "Google Calendar", nameEn: "Google Calendar", key: "calendar", descEs: "Sincroniza citas bidireccionalmente con los calendarios de tu personal.", descEn: "Sync appointments bi-directionally with your staff's calendars." },
  stripe: { status: "DISCONNECTED", nameEs: "Stripe", nameEn: "Stripe Payments", key: "stripe", descEs: "Procesa pagos internacionales con tarjeta de crédito de manera segura.", descEn: "Process international credit card payments securely." },
  mercadopago: { status: "DISCONNECTED", nameEs: "Mercado Pago", nameEn: "Mercado Pago", key: "mercadopago", descEs: "Acepta tarjetas locales, transferencias y pagos con QR en Latinoamérica.", descEn: "Accept local credit cards, bank transfers, and QR codes in Latin America." },
  instagram: { status: "DISCONNECTED", nameEs: "Instagram Shop", nameEn: "Instagram Shop", key: "instagram", descEs: "Agrega botones de reserva oficial e interactúa directamente en DMs.", descEn: "Add official booking buttons and interact directly in Instagram DMs." },
  tiktok: { status: "COMING_SOON", nameEs: "TikTok Bookings", nameEn: "TikTok Bookings", key: "tiktok", descEs: "Permite reservar citas a través de tus videos y enlaces del perfil.", descEn: "Allow client bookings directly through your TikTok videos and bio link." },
  metaads: { status: "COMING_SOON", nameEs: "Meta Ads Pixel", nameEn: "Meta Ads Pixel", key: "metaads", descEs: "Mide las conversiones de tus campañas de Facebook e Instagram Ads.", descEn: "Measure the conversions of your Facebook and Instagram Ads campaigns." }
};

export default function AutomationsView() {
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem("crm_connected_integrations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...INTEGRATION_DEFAULTS };
        Object.keys(parsed).forEach((k) => {
          if (merged[k]) {
            merged[k] = {
              ...merged[k],
              status: parsed[k].status || merged[k].status,
            };
          }
        });
        return merged;
      } catch (e) {
        return INTEGRATION_DEFAULTS;
      }
    }
    return INTEGRATION_DEFAULTS;
  });

  const [activeModal, setActiveModal] = useState(null); // 'whatsapp' | 'smtp' | 'calendar' | 'stripe' | 'mercadopago' | 'instagram' | null
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    localStorage.setItem("crm_connected_integrations", JSON.stringify(integrations));
  }, [integrations]);

  const openConfigModal = (key) => {
    setActiveModal(key);
    setAlertMsg(null);
    setShowPassword(false);
    
    // Load existing config or defaults from localStorage
    const savedConfig = localStorage.getItem(`crm_config_${key}`);
    if (savedConfig) {
      try {
        setFormValues(JSON.parse(savedConfig));
      } catch (e) {
        setFormValues({});
      }
    } else {
      setFormValues({});
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Save configurations
    localStorage.setItem(`crm_config_${activeModal}`, JSON.stringify(formValues));

    // Update connection status
    setIntegrations(prev => ({
      ...prev,
      [activeModal]: {
        ...prev[activeModal],
        status: "CONNECTED"
      }
    }));

    setAlertMsg({ 
      type: "success", 
      text: isEs 
        ? `¡Conexión establecida con éxito para ${integrations[activeModal].nameEs}!`
        : `Connection established successfully for ${integrations[activeModal].nameEn}!`
    });
    setSaving(false);
    setTimeout(() => setActiveModal(null), 1000);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(`crm_config_${activeModal}`);
    setIntegrations(prev => ({
      ...prev,
      [activeModal]: {
        ...prev[activeModal],
        status: "DISCONNECTED"
      }
    }));
    setActiveModal(null);
  };

  const handleToggleIntegration = (key, checked) => {
    if (checked) {
      const savedConfig = localStorage.getItem(`crm_config_${key}`);
      if (savedConfig) {
        setIntegrations(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            status: "CONNECTED"
          }
        }));
      } else {
        openConfigModal(key);
      }
    } else {
      setIntegrations(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: "DISCONNECTED"
        }
      }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONNECTED":
        return <Badge bg="success-soft" className="text-success border border-success border-opacity-10 px-2.5 py-1.5" style={{ borderRadius: "8px" }}>{isEs ? "🟢 Conectado" : "🟢 Connected"}</Badge>;
      case "DISCONNECTED":
        return <Badge bg="danger-soft" className="text-danger border border-danger border-opacity-10 px-2.5 py-1.5" style={{ borderRadius: "8px" }}>{isEs ? "🔴 Desconectado" : "🔴 Disconnected"}</Badge>;
      case "INCOMPLETE":
        return <Badge bg="warning-soft" className="text-warning border border-warning border-opacity-10 px-2.5 py-1.5" style={{ borderRadius: "8px" }}>{isEs ? "🟡 Configuración incompleta" : "🟡 Incomplete configuration"}</Badge>;
      default:
        return <Badge bg="secondary-soft" className="text-muted border border-secondary border-opacity-10 px-2.5 py-1.5" style={{ borderRadius: "8px" }}>{isEs ? "⚪ Próximamente" : "⚪ Coming soon"}</Badge>;
    }
  };

  const getIntegrationIcon = (key) => {
    const size = 22;
    switch (key) {
      case "whatsapp":
        return <MessageSquare size={size} className="text-success" />;
      case "smtp":
        return <Mail size={size} className="text-primary" />;
      case "calendar":
        return <Calendar size={size} className="text-info" />;
      case "stripe":
        return <CreditCard size={size} className="text-purple-600" />;
      case "mercadopago":
        return <CreditCard size={size} className="text-primary" />;
      case "instagram":
        return <InstagramIcon size={size} className="text-danger" />;
      default:
        return <Share2 size={size} className="text-secondary" />;
    }
  };

  return (
    <Container fluid className="p-0 animate-fade-in">
      <header className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Globe className="text-purple-600 animate-pulse" size={28} />
          <h1 className="fw-bold h3 m-0">
            {isEs ? "Centro de Integraciones" : "Integrations Center"}
          </h1>
        </div>
        <p className="text-muted text-truncate" style={{ fontSize: "14px", opacity: 0.85 }}>
          {isEs 
            ? "Conecta herramientas y canales externos para potenciar tus automatizaciones."
            : "Connect external tools and communication channels to enhance your automations."
          }
        </p>
      </header>

      <Row className="g-4">
        {Object.values(integrations).map((item) => {
          const isComingSoon = item.status === "COMING_SOON";
          const isConnected = item.status === "CONNECTED";
          const name = isEs ? item.nameEs : item.nameEn;
          const desc = isEs ? item.descEs : item.descEn;

          return (
            <Col lg={4} md={6} key={item.key}>
              <Card className={`card-premium h-100 border bg-white p-4 rounded-2xl shadow-sm d-flex flex-column justify-content-between hover-scale ${isComingSoon ? "opacity-75" : ""}`}>
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3.5">
                    <div 
                      className="p-2.5 rounded-xl border bg-light bg-opacity-40 d-flex align-items-center justify-content-center"
                      style={{ width: "42px", height: "42px" }}
                    >
                      {getIntegrationIcon(item.key)}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {getStatusBadge(item.status)}
                      {!isComingSoon && (
                        <Form.Check 
                          type="switch"
                          id={`toggle-${item.key}`}
                          checked={isConnected}
                          onChange={(e) => handleToggleIntegration(item.key, e.target.checked)}
                          className="ms-1 animate-fade-in"
                        />
                      )}
                    </div>
                  </div>

                  <h3 className="h6 fw-black text-gray-900 mb-2">{name}</h3>
                  <p className="text-muted smaller mb-4" style={{ lineHeight: "1.45", minHeight: "55px" }}>
                    {desc}
                  </p>
                </div>

                {!isComingSoon && (
                  <Button
                    variant={isConnected ? "outline-dark" : "purple"}
                    size="sm"
                    className={isConnected ? "w-100 rounded-xl py-2 fw-bold border-gray-200" : "w-100 rounded-xl py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 btn-purple"}
                    onClick={() => openConfigModal(item.key)}
                  >
                    {isConnected 
                      ? (isEs ? "Configurar" : "Configure") 
                      : (isEs ? "Conectar" : "Connect")
                    }
                  </Button>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* CONFIGURATION MODALS */}
      <Modal 
        show={activeModal !== null} 
        onHide={() => setActiveModal(null)} 
        centered
        className="rounded-3xl"
        contentClassName="border-0 shadow-lg rounded-2xl"
      >
        {activeModal && (
          <Form onSubmit={handleSaveConfig}>
            <Modal.Header closeButton className="px-4 pt-4 border-0">
              <Modal.Title className="fw-black h5 d-flex align-items-center gap-2">
                {getIntegrationIcon(activeModal)}
                <span>
                  {isEs 
                    ? `Configurar ${integrations[activeModal].nameEs}`
                    : `Configure ${integrations[activeModal].nameEn}`
                  }
                </span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
              {alertMsg && (
                <Alert 
                  variant={alertMsg.type} 
                  className="rounded-xl border-0 shadow-sm small py-2.5 mb-3 d-flex align-items-center gap-2 animate-fade-in"
                  style={{
                    backgroundColor: alertMsg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: alertMsg.type === "success" ? "#065f46" : "#991b1b",
                    fontSize: "12.5px"
                  }}
                >
                  {alertMsg.type === "success" ? <CheckCircle2 size={16} className="text-success animate-bounce" /> : <ShieldAlert size={16} className="text-danger" />}
                  <span>{alertMsg.text}</span>
                </Alert>
              )}
              
              {/* WhatsApp Config Fields */}
              {activeModal === "whatsapp" && (
                <div className="d-flex flex-column gap-3">
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">ID del Teléfono (Phone Number ID) *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="Ej: 104928340294"
                      value={formValues.phoneId || ""}
                      onChange={(e) => setFormValues({ ...formValues, phoneId: e.target.value })}
                      className="rounded-xl border-gray-200 py-2"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">ID de Cuenta Comercial *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="Ej: 832940294024"
                      value={formValues.businessId || ""}
                      onChange={(e) => setFormValues({ ...formValues, businessId: e.target.value })}
                      className="rounded-xl border-gray-200 py-2"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">
                      {isEs ? "Token de Acceso Permanente *" : "Permanent Access Token *"}
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Meta permanent access token"
                        value={formValues.token || ""}
                        onChange={(e) => setFormValues({ ...formValues, token: e.target.value })}
                        className="rounded-xl border-gray-200 py-2 pe-5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="position-absolute border-0 bg-transparent text-secondary"
                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Form.Group>
                </div>
              )}

              {/* SMTP Config Fields */}
              {activeModal === "smtp" && (
                <div className="d-flex flex-column gap-3">
                  <Row className="g-2">
                    <Col xs={8}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">
                          {isEs ? "Servidor SMTP *" : "SMTP Server *"}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="smtp.gmail.com"
                          value={formValues.host || ""}
                          onChange={(e) => setFormValues({ ...formValues, host: e.target.value })}
                          className="rounded-xl border-gray-200 py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={4}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">
                          {isEs ? "Puerto *" : "Port *"}
                        </Form.Label>
                        <Form.Control
                          type="number"
                          required
                          placeholder="587"
                          value={formValues.port || ""}
                          onChange={(e) => setFormValues({ ...formValues, port: e.target.value })}
                          className="rounded-xl border-gray-200 py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">
                      {isEs ? "Usuario SMTP (Email) *" : "SMTP User (Email) *"}
                    </Form.Label>
                    <Form.Control
                      type="email"
                      required
                      placeholder="tunegocio@gmail.com"
                      value={formValues.user || ""}
                      onChange={(e) => setFormValues({ ...formValues, user: e.target.value })}
                      className="rounded-xl border-gray-200 py-2"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">
                      {isEs ? "Contraseña de Aplicación SMTP *" : "SMTP App Password *"}
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder={isEs ? "Contraseña de 16 dígitos" : "16-digit password"}
                        value={formValues.password || ""}
                        onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                        className="rounded-xl border-gray-200 py-2 pe-5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="position-absolute border-0 bg-transparent text-secondary"
                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Form.Group>
                </div>
              )}

              {/* Google Calendar Config Fields */}
              {activeModal === "calendar" && (
                <div className="d-flex flex-column gap-3 py-2 text-center">
                  <div className="p-4 rounded-2xl bg-light bg-opacity-50 border border-dashed d-grid gap-2 justify-content-center">
                    <Calendar size={32} className="text-info mx-auto animate-bounce" />
                    <strong className="text-gray-800 d-block">
                      {isEs ? "Sincronización Bidireccional Activa" : "Active Two-Way Sync"}
                    </strong>
                    <span className="smaller text-muted max-w-sm">
                      {isEs 
                        ? "Tu agenda de Dashboard OS se mantiene sincronizada con Google Calendar de tus estilistas automáticamente."
                        : "Your Dashboard OS schedule stays synchronized with your stylists' Google Calendar automatically."
                      }
                    </span>
                  </div>
                  <Form.Group className="text-start">
                    <Form.Check 
                      type="switch"
                      id="google-cal-sync"
                      label={isEs ? "Sincronizar ausencias y feriados automáticamente" : "Sync leaves and holidays automatically"}
                      checked={formValues.syncHoliday ?? true}
                      onChange={(e) => setFormValues({ ...formValues, syncHoliday: e.target.checked })}
                      className="small"
                    />
                  </Form.Group>
                </div>
              )}

              {/* Stripe / Mercado Pago Config Fields */}
              {(activeModal === "stripe" || activeModal === "mercadopago") && (
                <div className="d-flex flex-column gap-3">
                  <Form.Group className="d-flex justify-content-between align-items-center bg-light p-2.5 rounded-xl border border-light">
                    <span className="smaller text-muted fw-bold">{isEs ? "Modo de Entorno" : "Environment Mode"}</span>
                    <Form.Check 
                      type="switch"
                      id="gateway-mode"
                      label={formValues.liveMode ? "🔥 LIVE" : "🛠️ TEST"}
                      checked={formValues.liveMode || false}
                      onChange={(e) => setFormValues({ ...formValues, liveMode: e.target.checked })}
                      className="fw-bold small text-gray-800"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">
                      {isEs ? "Clave Pública (Public Key) *" : "Public Key *"}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder={activeModal === "stripe" ? "pk_test_..." : "APP_USR-..."}
                      value={formValues.publicKey || ""}
                      onChange={(e) => setFormValues({ ...formValues, publicKey: e.target.value })}
                      className="rounded-xl border-gray-200 py-2 font-mono small"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">
                      {isEs ? "Token de Acceso Privado (Secret Key) *" : "Secret Access Token (Secret Key) *"}
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder={activeModal === "stripe" ? "sk_test_..." : "TEST-..."}
                        value={formValues.secretKey || ""}
                        onChange={(e) => setFormValues({ ...formValues, secretKey: e.target.value })}
                        className="rounded-xl border-gray-200 py-2 pe-5 font-mono small"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="position-absolute border-0 bg-transparent text-secondary"
                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Form.Group>
                </div>
              )}

              {/* Instagram Config Fields */}
              {activeModal === "instagram" && (
                <div className="d-flex flex-column gap-3 py-2 text-center">
                  <div className="p-4 rounded-2xl bg-light bg-opacity-50 border border-dashed d-grid gap-2 justify-content-center">
                    <InstagramIcon size={32} className="text-danger mx-auto animate-pulse" />
                    <strong className="text-gray-800 d-block">{isEs ? "Vincular con tu Página de Instagram" : "Link with your Instagram Page"}</strong>
                    <span className="smaller text-muted max-w-sm">
                      {isEs 
                        ? "Vincula tu cuenta empresarial de Instagram para que tus clientes puedan reservar directamente desde tu biografía y mensajes directos."
                        : "Link your business Instagram account so your clients can book directly from your bio and direct messages."
                      }
                    </span>
                  </div>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold text-start w-100">
                      {isEs ? "Nombre de Usuario de Instagram (@)" : "Instagram Username (@)"}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="Ej: aura_studio_estetica"
                      value={formValues.username || ""}
                      onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
                      className="rounded-xl border-gray-200 py-2"
                    />
                  </Form.Group>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="px-4 pb-4 border-0 pt-0 d-flex gap-2 justify-content-between">
              {integrations[activeModal].status === "CONNECTED" ? (
                <Button
                  variant="outline-danger"
                  className="rounded-xl py-2 fw-bold"
                  onClick={handleDisconnect}
                >
                  {isEs ? "Desconectar" : "Disconnect"}
                </Button>
              ) : (
                <div />
              )}
              
              <div className="d-flex gap-2">
                <Button 
                  variant="light" 
                  className="rounded-xl py-2 border hover-bg-gray-100 font-semibold"
                  onClick={() => setActiveModal(null)}
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  variant="purple"
                  type="submit"
                  disabled={saving}
                  className="rounded-xl py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0"
                >
                  {saving ? <Spinner size="sm" animation="border" /> : (isEs ? "Guardar" : "Save")}
                </Button>
              </div>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      <style>{`
        .bg-success-soft {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .bg-danger-soft {
          background-color: rgba(239, 68, 68, 0.08) !important;
        }
        .bg-warning-soft {
          background-color: rgba(245, 158, 11, 0.08) !important;
        }
        .bg-secondary-soft {
          background-color: rgba(107, 114, 128, 0.08) !important;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </Container>
  );
}
