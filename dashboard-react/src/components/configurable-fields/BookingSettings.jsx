import React, { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col, Spinner, Alert, InputGroup } from "react-bootstrap";
import { Link2, Copy, Check, Sparkles, Globe, AlertTriangle, CheckCircle2, CreditCard, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";

export default function BookingSettings({ onNavigateToGoogleSync }) {
  const { t } = useTranslation("booking");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedGoogle, setCopiedGoogle] = useState(false);

  const [business, setBusiness] = useState({
    name: "",
    slug: "mi-negocio",
    logo: "",
    description: "",
    bookingEnabled: true,
    bookingPrimaryColor: "#10b981",
    bookingConfirmationMessage: "¡Tu reserva ha sido confirmada con éxito!",
    bookingDownpaymentEnabled: false,
    bookingDownpaymentPercent: 30,
    bookingDownpaymentAmount: "",
    bookingDownpaymentMethod: "mock_mercadopago",
    googleBookingUrl: "",
  });

  const [isMpConnected, setIsMpConnected] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    alias: "TU.ALIAS.AQUI",
    cbu: "0000000000000000000000",
    holder: "Nombre Titular",
    bank: "Banco",
    mpLink: "",
  });

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/appointments/business");
      if (res.data) {
        setBusiness({
          name: res.data.name || "",
          slug: res.data.slug || "mi-negocio",
          logo: res.data.logo || "",
          description: res.data.description || "",
          bookingEnabled: res.data.bookingEnabled !== false,
          bookingPrimaryColor: res.data.bookingPrimaryColor || "#10b981",
          bookingConfirmationMessage: res.data.bookingConfirmationMessage || "¡Tu reserva ha sido confirmada con éxito!",
          bookingDownpaymentEnabled: res.data.bookingDownpaymentEnabled === true,
          bookingDownpaymentPercent: typeof res.data.bookingDownpaymentPercent !== "undefined" ? res.data.bookingDownpaymentPercent : 30,
          bookingDownpaymentAmount: res.data.bookingDownpaymentAmount || "",
          bookingDownpaymentMethod: res.data.bookingDownpaymentMethod || "mock_mercadopago",
          googleBookingUrl: res.data.googleBookingUrl || "",
        });
      }
    } catch (e) {
      console.error(e);
      setError(t("settings.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();

    // Check Mercado Pago connection status
    const savedIntegrations = localStorage.getItem("crm_connected_integrations");
    if (savedIntegrations) {
      try {
        const parsed = JSON.parse(savedIntegrations);
        if (parsed.mercadopago?.status === "CONNECTED") {
          setIsMpConnected(true);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Load Billing Info
    const savedBilling = localStorage.getItem("crm_payment_ar");
    if (savedBilling) {
      try {
        setBillingInfo(JSON.parse(savedBilling));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBusiness((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const slugClean = business.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
      
      // If MP is connected and they had "mock_mercadopago", automatically upgrade it to "real_mercadopago" if preferred
      let selectedMethod = business.bookingDownpaymentMethod;
      if (isMpConnected && selectedMethod === "mock_mercadopago") {
        selectedMethod = "real_mercadopago";
      } else if (!isMpConnected && selectedMethod === "real_mercadopago") {
        selectedMethod = "mock_mercadopago";
      }

      const res = await api.put("/appointments/business", {
        ...business,
        slug: slugClean,
        bookingDownpaymentMethod: selectedMethod,
        bookingDownpaymentAmount: business.bookingDownpaymentAmount ? Number(business.bookingDownpaymentAmount) : null,
        bookingDownpaymentPercent: Number(business.bookingDownpaymentPercent),
      });

      // Save billing info to local storage
      localStorage.setItem("crm_payment_ar", JSON.stringify(billingInfo));

      setBusiness(res.data);
      setSuccess(t("settings.saveSuccess"));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const bookingUrl = `${window.location.origin}/booking/${business.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyGoogleToClipboard = () => {
    if (business.googleBookingUrl) {
      navigator.clipboard.writeText(business.googleBookingUrl);
      setCopiedGoogle(true);
      setTimeout(() => setCopiedGoogle(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card className="card-premium border-0 shadow-sm mt-3">
        <Card.Body className="p-5 text-center">
          <Spinner animation="border" className="text-primary mb-2" />
          <p className="text-muted small mb-0">{t("settings.loadingText")}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm mt-3">
      <Card.Body className="p-4">
        <div className="mb-4">
          <h2 className="h5 fw-bold mb-1">{t("settings.title")}</h2>
          <p className="text-muted small mb-0">
            {t("settings.subtitle")}
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSave} className="custom-form d-grid gap-4">
          
          {/* Activar/Desactivar */}
          <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
            <div>
              <h3 className="h6 fw-bold mb-1">{t("settings.enableLink")}</h3>
              <p className="text-muted small mb-0">
                {t("settings.enableLinkHint")}
              </p>
            </div>
            <Form.Check
              type="switch"
              id="bookingEnabled"
              name="bookingEnabled"
              checked={business.bookingEnabled}
              onChange={handleChange}
              style={{ cursor: "pointer", width: "40px" }}
              aria-label="Toggle Booking Online"
            />
          </div>

          {business.bookingEnabled && (
            <>
              {/* Copiar Link */}
              <div className="p-3 border rounded-3 bg-light">
                <Form.Label className="fw-semibold small d-flex align-items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  <span>{t("settings.yourLink")}</span>
                </Form.Label>
                <InputGroup className="mb-2">
                  <Form.Control
                    readOnly
                    value={bookingUrl}
                    style={{ background: "#fff", fontSize: "13px" }}
                  />
                  <Button variant="outline-dark" onClick={copyToClipboard}>
                    {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted small">
                  {t("settings.yourLinkHint")}
                </Form.Text>
              </div>

              {/* Copiar Link de Google Calendar */}
              {business.googleBookingUrl && (
                <div className="p-3 border rounded-3 bg-light mt-3" style={{ borderLeft: "4px solid #7c3aed" }}>
                  <Form.Label className="fw-semibold small d-flex align-items-center gap-2" style={{ color: "#7c3aed" }}>
                    <Calendar size={16} />
                    <span>Link de Reservas de Google Calendar (Citas Oficiales)</span>
                  </Form.Label>
                  <InputGroup className="mb-2">
                    <Form.Control
                      readOnly
                      value={business.googleBookingUrl}
                      style={{ background: "#fff", fontSize: "13px", color: "#5b21b6" }}
                    />
                    <Button variant="outline-dark" onClick={copyGoogleToClipboard}>
                      {copiedGoogle ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted small">
                    Este es el enlace de reservas generado por tu Google Calendar (Calendario de citas). Compártelo con tus clientes para que agenden directamente desde Google y los turnos se sincronicen de manera automática en tu panel.
                  </Form.Text>
                </div>
              )}

              {/* Conectar Google Calendar Banner */}
              <Card className="border-0 shadow-sm p-3.5 rounded-4" style={{ backgroundColor: "#f3e8ff", border: "1px solid #e9d5ff" }}>
                <div className="d-flex align-items-start gap-3">
                  <div className="p-2.5 bg-white rounded-3 d-flex align-items-center justify-content-center text-primary" style={{ color: "#7c3aed", minWidth: "42px", height: "42px" }}>
                    <Calendar size={22} style={{ color: "#7c3aed" }} />
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="h6 fw-bold mb-1" style={{ color: "#5b21b6" }}>¿Quieres vincular tu Google Calendar?</h4>
                    <p className="text-secondary small mb-3 leading-relaxed">
                      Puedes conectar la cuenta de tu salón a Google Calendar para usar tu propio enlace de citas de Google (Appointment Schedule) o el del Dashboard. Ambas agendas se mantendrán sincronizadas en tiempo real de forma bidireccional y automática sin perder ningún dato.
                    </p>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={onNavigateToGoogleSync}
                      className="rounded-pill px-3.5 py-1.5 fw-semibold border-0"
                      style={{ backgroundColor: "#7c3aed", backgroundImage: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
                    >
                      Configurar Google Calendar
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Ajustes de Seña (Downpayment) */}
              <div className="p-3 border rounded-3 bg-light">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h3 className="h6 fw-bold mb-1 d-flex align-items-center gap-2">
                      <Sparkles size={16} className="text-warning" />
                      <span>{t("settings.downpaymentTitle")}</span>
                    </h3>
                    <p className="text-muted small mb-0">
                      {t("settings.downpaymentSubtitle")}
                    </p>
                  </div>
                  <Form.Check
                    type="switch"
                    id="bookingDownpaymentEnabled"
                    name="bookingDownpaymentEnabled"
                    checked={business.bookingDownpaymentEnabled}
                    onChange={handleChange}
                    style={{ cursor: "pointer", width: "40px" }}
                    aria-label="Toggle Booking Downpayment"
                  />
                </div>

                {business.bookingDownpaymentEnabled && (
                  <>
                    <Row className="g-3 mt-1 pt-2 border-top">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">{t("settings.percent")}</Form.Label>
                          <Form.Control
                            type="number"
                            name="bookingDownpaymentPercent"
                            value={business.bookingDownpaymentPercent}
                            onChange={handleChange}
                            min={1}
                            max={100}
                            placeholder="30"
                            required
                          />
                          <Form.Text className="text-muted small">{t("settings.percentHint")}</Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">{t("settings.amount")}</Form.Label>
                          <Form.Control
                            type="number"
                            name="bookingDownpaymentAmount"
                            value={business.bookingDownpaymentAmount}
                            onChange={handleChange}
                            placeholder={t("settings.amountPlaceholder")}
                          />
                          <Form.Text className="text-muted small">{t("settings.amountHint")}</Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">{t("settings.processor")}</Form.Label>
                          <Form.Select
                            name="bookingDownpaymentMethod"
                            value={business.bookingDownpaymentMethod}
                            onChange={handleChange}
                            style={{ fontSize: "13px" }}
                          >
                            {isMpConnected ? (
                              <option value="real_mercadopago">{t("settings.mpReal")}</option>
                            ) : (
                              <option value="mock_mercadopago">{t("settings.mpMock")}</option>
                            )}
                            <option value="mock_stripe">{t("settings.stripeMock")}</option>
                          </Form.Select>
                          <Form.Text className="text-muted small">{t("settings.processorHint")}</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Alertas de Conexión de Mercado Pago */}
                    {!isMpConnected ? (
                      <div className="mt-3 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 d-flex align-items-center gap-2">
                        <AlertTriangle size={18} className="text-warning flex-shrink-0 animate-bounce" />
                        <span className="smaller text-warning" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                          <strong>{t("settings.simActive")}</strong> {t("settings.simActiveText")}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center gap-2">
                        <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                        <span className="smaller text-success" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                          <strong>{t("settings.realActive")}</strong> {t("settings.realActiveText")}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Datos de Facturación en Salón */}
              <div className="p-3 border rounded-3 bg-light">
                <h3 className="h6 fw-bold mb-1 d-flex align-items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  <span>{t("settings.billingTitle")}</span>
                </h3>
                <p className="text-muted small mb-3">
                  {t("settings.billingSubtitle")}
                </p>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("settings.holder")}</Form.Label>
                      <Form.Control
                        type="text"
                        value={billingInfo.holder}
                        onChange={(e) => setBillingInfo({ ...billingInfo, holder: e.target.value })}
                        placeholder={t("settings.holderPlaceholder")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("settings.bank")}</Form.Label>
                      <Form.Control
                        type="text"
                        value={billingInfo.bank}
                        onChange={(e) => setBillingInfo({ ...billingInfo, bank: e.target.value })}
                        placeholder={t("settings.bankPlaceholder")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("settings.alias")}</Form.Label>
                      <Form.Control
                        type="text"
                        value={billingInfo.alias}
                        onChange={(e) => setBillingInfo({ ...billingInfo, alias: e.target.value })}
                        placeholder={t("settings.aliasPlaceholder")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("settings.cbu")}</Form.Label>
                      <Form.Control
                        type="text"
                        maxLength={22}
                        value={billingInfo.cbu}
                        onChange={(e) => setBillingInfo({ ...billingInfo, cbu: e.target.value.replace(/\D/g, "") })}
                        placeholder="0000000000000000000000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("settings.mpLink")}</Form.Label>
                      <InputGroup>
                        <InputGroup.Text style={{ fontSize: "11px" }}>link.mercadopago.com.ar/</InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={billingInfo.mpLink.replace("https://link.mercadopago.com.ar/", "")}
                          onChange={(e) => setBillingInfo({ ...billingInfo, mpLink: e.target.value.trim() ? `https://link.mercadopago.com.ar/${e.target.value.trim()}` : "" })}
                          placeholder={t("settings.mpLinkPlaceholder")}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted smaller" style={{ fontSize: "11px" }}>
                        {t("settings.mpLinkHint")}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Ajustes Generales */}
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{t("settings.businessName")}</Form.Label>
                    <Form.Control
                      name="name"
                      value={business.name}
                      onChange={handleChange}
                      placeholder={t("settings.businessNamePlaceholder")}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{t("settings.slug")}</Form.Label>
                    <InputGroup>
                      <InputGroup.Text style={{ fontSize: "12px" }}>/booking/</InputGroup.Text>
                      <Form.Control
                        name="slug"
                        value={business.slug}
                        onChange={handleChange}
                        placeholder="mi-estudio"
                        required
                      />
                    </InputGroup>
                    <Form.Text className="text-muted small">{t("settings.slugHint")}</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group>
                <Form.Label className="fw-semibold small">{t("settings.welcomeMessage")}</Form.Label>
                <Form.Control
                  name="description"
                  as="textarea"
                  rows={2}
                  value={business.description}
                  onChange={handleChange}
                  placeholder={t("settings.welcomeMessagePlaceholder")}
                />
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{t("settings.primaryColor")}</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        name="bookingPrimaryColor"
                        type="color"
                        value={business.bookingPrimaryColor}
                        onChange={handleChange}
                        style={{ width: "60px", height: "38px", padding: "2px", cursor: "pointer" }}
                      />
                      <Form.Control
                        name="bookingPrimaryColor"
                        type="text"
                        value={business.bookingPrimaryColor}
                        onChange={handleChange}
                        style={{ width: "120px" }}
                        placeholder="#10b981"
                      />
                    </div>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{t("settings.successMessage")}</Form.Label>
                    <Form.Control
                      name="bookingConfirmationMessage"
                      value={business.bookingConfirmationMessage}
                      onChange={handleChange}
                      placeholder={t("settings.successMessagePlaceholder")}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <Button
              type="submit"
              variant="dark"
              disabled={saving}
              className="rounded-pill px-4 btn-premium"
            >
              {saving ? t("settings.saving") : t("settings.save")}
            </Button>
          </div>

        </Form>
      </Card.Body>
    </Card>
  );
}
