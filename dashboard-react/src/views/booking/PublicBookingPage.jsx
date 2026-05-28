import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from "react-bootstrap";
import { Calendar, User, Clock, CheckCircle2, ChevronRight, ArrowLeft, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/language/LanguageSwitcher.jsx";
import api from "../../lib/api.js";

function useCurrency() {
  const { i18n } = useTranslation();
  return (n) =>
    new Intl.NumberFormat(i18n.language === "es" ? "es-AR" : "en-US", {
      style: "currency",
      currency: i18n.language === "es" ? "ARS" : "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);
}

export default function PublicBookingPage() {
  const { t } = useTranslation("booking");
  const currency = useCurrency();
  const { businessSlug } = useParams();
  const navigate = useNavigate();

  // Estados de carga y negocio
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");

  // Catálogos
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);

  // Reservas - Flujo
  const [step, setStep] = useState(1); // 1: Servicio, 2: Profesional, 3: Fecha/Hora, 4: Datos Cliente

  // Selecciones
  const [selService, setSelService] = useState(null);
  const [selProfessional, setSelProfessional] = useState(null); // null significa "Cualquiera"
  const [selDate, setSelDate] = useState("");
  const [selTime, setSelTime] = useState("");

  // Slots e Info de Slots
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Formulario del cliente
  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar info del negocio, servicios y profesionales
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Obtener negocio
        const bizRes = await api.get(`/public/business/${businessSlug}`);
        setBusiness(bizRes.data);

        // 2. Obtener servicios y profesionales
        const [servicesRes, professionalsRes] = await Promise.all([
          api.get(`/public/business/${businessSlug}/services`),
          api.get(`/public/business/${businessSlug}/professionals`),
        ]);

        setServices(servicesRes.data);
        setProfessionals(professionalsRes.data);
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.error || t("errors.load"));
      } finally {
        setLoading(false);
      }
    };

    if (businessSlug) {
      loadBusinessData();
    }
  }, [businessSlug]);

  // Cargar disponibilidad horaria (slots) al cambiar fecha o profesional
  useEffect(() => {
    if (step === 3 && selService && selDate) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          setSlots([]);

          // Si es "Cualquiera", mandar el ID del primer profesional disponible que haga ese servicio
          const workerId = selProfessional
            ? selProfessional.id
            : professionals.find((p) => p.serviceIds.includes(selService.id))?.id;

          if (!workerId) {
            setSlots([]);
            return;
          }

          const res = await api.get(`/public/business/${businessSlug}/availability`, {
            params: {
              serviceId: selService.id,
              professionalId: workerId,
              date: selDate,
            },
          });
          setSlots(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSlots(false);
        }
      };

      fetchSlots();
    }
  }, [step, selService, selProfessional, selDate, professionals, businessSlug]);

  const handleNextStep = () => {
    setStep((s) => s + 1);
  };

  const handleBackStep = () => {
    setStep((s) => s - 1);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setClientForm((p) => ({ ...p, [name]: value }));
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      const workerId = selProfessional
        ? selProfessional.id
        : professionals.find((p) => p.serviceIds.includes(selService.id))?.id;

      const payload = {
        ...clientForm,
        serviceId: selService.id,
        professionalId: workerId,
        date: selDate,
        time: selTime,
      };

      const res = await api.post(`/public/business/${businessSlug}/bookings`, payload);
      
      // Ir a la pantalla de éxito
      navigate(`/booking/${businessSlug}/success`, {
        state: {
          message: res.data.message || t("form.successFallback"),
          booking: res.data.booking,
          color: business.bookingPrimaryColor,
        },
      });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || t("form.bookingError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#fafafa" }}>
        <Spinner animation="border" className="text-primary mb-3" />
        <p className="text-muted small">{t("public.loading")}</p>
      </div>
    );
  }

  if (error && !business) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mx-auto" style={{ maxWidth: "500px" }}>
          {error}
        </Alert>
        <Button variant="link" onClick={() => navigate("/")} className="text-muted">
          {t("public.backHome")}
        </Button>
      </Container>
    );
  }

  const primaryColor = business.bookingPrimaryColor || "#10b981";

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }} className="py-5">
      <Container style={{ maxWidth: "720px" }}>
        <div className="d-flex justify-content-end mb-3">
          <LanguageSwitcher />
        </div>

        {/* Encabezado del Negocio */}
        <div className="text-center mb-4">
          {business.logo && (
            <img
              src={business.logo}
              alt="Logo"
              className="rounded-circle mb-3 border shadow-sm"
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
          )}
          <h1 className="fw-black h3 mb-1">{business.name || "Aura Studio"}</h1>
          <p className="text-muted small mx-auto" style={{ maxWidth: "480px" }}>
            {business.description || t("public.defaultDescription")}
          </p>
        </div>

        <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          {/* Barra de Progreso */}
          <div className="px-4 py-2 border-bottom bg-light d-flex align-items-center justify-content-between">
            <span className="small text-muted fw-bold">{t("form.stepOf", { step, total: 4 })}</span>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "16px",
                    height: "6px",
                    borderRadius: "999px",
                    background: i <= step ? primaryColor : "#e5e7eb",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>

          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}

            {/* PASO 1: Selección de Servicio */}
            {step === 1 && (
              <div>
                <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                  <Heart size={16} style={{ color: primaryColor }} />
                  <span>{t("form.selectService")}</span>
                </h2>
                <div className="d-flex flex-column gap-2">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelService(s);
                        handleNextStep();
                      }}
                      className="p-3 border rounded-3 d-flex justify-content-between align-items-center hover-scale cursor-pointer"
                      style={{
                        borderColor: selService?.id === s.id ? primaryColor : "#e5e7eb",
                        background: selService?.id === s.id ? `${primaryColor}08` : "#fff",
                      }}
                    >
                      <div>
                        <div className="fw-bold text-dark">{s.name}</div>
                        <div className="text-muted small">{s.duration} {t("form.minutesService")}</div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-black text-dark" style={{ fontSize: "15px" }}>
                          {currency(s.price)}
                        </span>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PASO 2: Selección de Profesional */}
            {step === 2 && (
              <div>
                <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                  <User size={16} style={{ color: primaryColor }} />
                  <span>{t("form.selectProfessional")}</span>
                </h2>

                {/* Filtro: Solo mostrar los profesionales que hagan el servicio seleccionado */}
                <div className="d-flex flex-column gap-2">
                  {/* Opción "Cualquiera" */}
                  <div
                    onClick={() => {
                      setSelProfessional(null);
                      handleNextStep();
                    }}
                    className="p-3 border rounded-3 d-flex justify-content-between align-items-center hover-scale cursor-pointer"
                    style={{
                      borderColor: selProfessional === null ? primaryColor : "#e5e7eb",
                      background: selProfessional === null ? `${primaryColor}08` : "#fff",
                    }}
                  >
                    <div>
                      <div className="fw-bold">{t("form.anyProfessional")}</div>
                      <div className="text-muted small">{t("form.anyProfessionalHint")}</div>
                    </div>
                    <ChevronRight size={18} className="text-muted" />
                  </div>

                  {professionals
                    .filter((p) => p.serviceIds.includes(selService.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelProfessional(p);
                          handleNextStep();
                        }}
                        className="p-3 border rounded-3 d-flex justify-content-between align-items-center hover-scale cursor-pointer"
                        style={{
                          borderColor: selProfessional?.id === p.id ? primaryColor : "#e5e7eb",
                          background: selProfessional?.id === p.id ? `${primaryColor}08` : "#fff",
                        }}
                      >
                        <div>
                          <div className="fw-bold">{p.name}</div>
                          <div className="text-muted small">{p.roleTitle}</div>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PASO 3: Selección de Fecha y Hora */}
            {step === 3 && (
              <div>
                <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                  <Clock size={16} style={{ color: primaryColor }} />
                  <span>{t("form.selectDateAndTime")}</span>
                </h2>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("form.appointmentDate")}</Form.Label>
                      <Form.Control
                        type="date"
                        value={selDate}
                        onChange={(e) => {
                          setSelDate(e.target.value);
                          setSelTime("");
                        }}
                        min={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("form.availableTimes")}</Form.Label>

                      {!selDate ? (
                        <div className="text-muted small py-2">{t("form.pickDateHint")}</div>
                      ) : loadingSlots ? (
                        <div className="d-flex align-items-center gap-2 text-muted small py-2">
                          <Spinner size="sm" />
                          <span>{t("form.searchingSlots")}</span>
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="text-danger small py-2">
                          {t("form.noSlots")}
                        </div>
                      ) : (
                        <div
                          className="d-flex gap-2 flex-wrap mt-1 overflow-auto"
                          style={{ maxHeight: "180px" }}
                        >
                          {slots.map((t) => (
                            <Button
                              key={t}
                              size="sm"
                              variant={selTime === t ? "dark" : "outline-dark"}
                              onClick={() => setSelTime(t)}
                              style={{
                                borderRadius: "8px",
                                borderColor: selTime === t ? "black" : "#e5e7eb",
                              }}
                            >
                              {t}
                            </Button>
                          ))}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* PASO 4: Ingresar Información del Cliente */}
            {step === 4 && (
              <Form onSubmit={handleBook} className="d-grid gap-3">
                <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: primaryColor }} />
                  <span>{t("form.yourInfo")}</span>
                </h2>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("form.firstNameRequired")}</Form.Label>
                      <Form.Control
                        name="firstName"
                        value={clientForm.firstName}
                        onChange={handleFormChange}
                        placeholder={t("form.firstNamePlaceholder")}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("form.lastNameRequired")}</Form.Label>
                      <Form.Control
                        name="lastName"
                        value={clientForm.lastName}
                        onChange={handleFormChange}
                        placeholder={t("form.lastNamePlaceholder")}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("form.phone")}</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={clientForm.phone}
                        onChange={handleFormChange}
                        placeholder={t("form.phonePlaceholder")}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{t("form.email")}</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={clientForm.email}
                        onChange={handleFormChange}
                        placeholder={t("form.emailPlaceholder")}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label className="fw-semibold small">{t("form.notes")}</Form.Label>
                  <Form.Control
                    name="notes"
                    as="textarea"
                    rows={2}
                    value={clientForm.notes}
                    onChange={handleFormChange}
                    placeholder={t("form.notesPlaceholder")}
                  />
                </Form.Group>

                <div className="mt-3 p-3 bg-light rounded-3 small">
                  <div className="fw-bold mb-1">{t("form.summary")}</div>
                  <div className="text-muted">
                    {t("form.summaryService")} <strong>{selService.name}</strong> ({currency(selService.price)})<br />
                    {t("form.summaryProfessional")} <strong>{selProfessional ? selProfessional.name : t("form.anyAvailable")}</strong><br />
                    {t("form.summaryDate")} <strong>{selDate} {selTime}</strong>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top gap-2">
                  <Button variant="outline-secondary" onClick={handleBackStep} className="rounded-pill px-4">
                    {t("form.back")}
                  </Button>
                  <Button
                    type="submit"
                    variant="dark"
                    disabled={submitting}
                    className="rounded-pill px-4 btn-premium"
                    style={{ background: primaryColor, borderColor: primaryColor }}
                  >
                    {submitting ? t("form.submitting") : t("form.submit")}
                  </Button>
                </div>
              </Form>
            )}

            {/* Controles de Navegación del Paso 1, 2, 3 */}
            {step < 4 && (
              <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                {step > 1 ? (
                  <Button variant="outline-secondary" onClick={handleBackStep} className="rounded-pill px-4">
                    {t("form.back")}
                  </Button>
                ) : (
                  <div />
                )}

                {step === 3 && (
                  <Button
                    variant="dark"
                    disabled={!selDate || !selTime}
                    onClick={handleNextStep}
                    className="rounded-pill px-4 btn-premium"
                    style={{ background: primaryColor, borderColor: primaryColor }}
                  >
                    {t("form.next", { defaultValue: "Next" })}
                  </Button>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
