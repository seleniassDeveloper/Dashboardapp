import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Badge } from "react-bootstrap";
import { 
  Scissors, Heart, Plus, Sparkles, Layout, Globe, Image, 
  User, Calendar, Check, AlertCircle, Trash2, ArrowLeft, Clock, DollarSign
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";

const RUBROS = [
  { id: "Estética", label: "Estética y Bienestar", icon: Heart, color: "#ec4899" },
  { id: "Barbería", label: "Barbería y Peluquería", icon: Scissors, color: "#3b82f6" },
  { id: "Clínica", label: "Clínica o Consultorio", icon: Plus, color: "#10b981" },
  { id: "Gimnasio", label: "Gimnasio o Fitness", icon: Sparkles, color: "#f59e0b" },
  { id: "Otro", label: "Otro Rubro de Servicios", icon: Layout, color: "#6b7280" }
];

const SERVICE_TEMPLATES_ES = {
  "Estética": [
    { name: "Manicuría Básica", duration: 40, price: 12000, category: "Manicuría" },
    { name: "Limpieza Facial Profunda", duration: 60, price: 25000, category: "Facial" },
    { name: "Masaje Descontracturante", duration: 60, price: 30000, category: "Masajes" },
    { name: "Perfilado de Cejas", duration: 20, price: 8000, category: "Cejas y Pestañas" }
  ],
  "Barbería": [
    { name: "Corte de Cabello Clásico", duration: 45, price: 15000, category: "Cabello" },
    { name: "Afeitado y Perfilado de Barba", duration: 30, price: 8000, category: "Barba" },
    { name: "Corte + Barba Premium", duration: 75, price: 20000, category: "Combos" },
    { name: "Coloración Completa", duration: 90, price: 35000, category: "Color" }
  ],
  "Clínica": [
    { name: "Consulta Médica General", duration: 30, price: 20000, category: "Consulta" },
    { name: "Chequeo Preventivo Completo", duration: 45, price: 25000, category: "Evaluación" },
    { name: "Consulta Especializada", duration: 30, price: 35000, category: "Especialidad" }
  ],
  "Gimnasio": [
    { name: "Sesión Personal Trainer", duration: 60, price: 15000, category: "Entrenamiento" },
    { name: "Evaluación Física Inicial", duration: 45, price: 12000, category: "Evaluación" },
    { name: "Clase de Pilates Reformer", duration: 60, price: 10000, category: "Clases" }
  ],
  "Otro": [
    { name: "Servicio Estándar", duration: 30, price: 8000, category: "General" },
    { name: "Servicio Premium", duration: 60, price: 15000, category: "General" }
  ]
};

const SERVICE_TEMPLATES_EN = {
  "Estética": [
    { name: "Basic Manicure", duration: 40, price: 15, category: "Manicure" },
    { name: "Deep Facial Cleansing", duration: 60, price: 35, category: "Facial" },
    { name: "Decontracting Massage", duration: 60, price: 45, category: "Massage" },
    { name: "Eyebrow Shaping", duration: 20, price: 12, category: "Brows & Lashes" }
  ],
  "Barbería": [
    { name: "Classic Haircut", duration: 45, price: 20, category: "Hair" },
    { name: "Shave & Beard Trim", duration: 30, price: 12, category: "Beard" },
    { name: "Premium Cut + Beard Combo", duration: 75, price: 30, category: "Combos" },
    { name: "Full Hair Coloring", duration: 90, price: 50, category: "Color" }
  ],
  "Clínica": [
    { name: "General Medical Consultation", duration: 30, price: 40, category: "Consultation" },
    { name: "Full Preventive Checkup", duration: 45, price: 55, category: "Evaluation" },
    { name: "Specialized Consultation", duration: 30, price: 70, category: "Specialty" }
  ],
  "Gimnasio": [
    { name: "Personal Trainer Session", duration: 60, price: 25, category: "Training" },
    { name: "Initial Physical Evaluation", duration: 45, price: 20, category: "Evaluation" },
    { name: "Pilates Reformer Class", duration: 60, price: 15, category: "Classes" }
  ],
  "Otro": [
    { name: "Standard Service", duration: 30, price: 15, category: "General" },
    { name: "Premium Service", duration: 60, price: 25, category: "General" }
  ]
};

const DEFAULT_SCHEDULES_ES = [
  { dayOfWeek: 1, dayName: "Lunes", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, dayName: "Martes", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, dayName: "Miércoles", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, dayName: "Jueves", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, dayName: "Viernes", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 6, dayName: "Sábado", enabled: true, startTime: "09:00", endTime: "13:00" },
  { dayOfWeek: 7, dayName: "Domingo", enabled: false, startTime: "09:00", endTime: "18:00" }
];

const DEFAULT_SCHEDULES_EN = [
  { dayOfWeek: 1, dayName: "Monday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, dayName: "Tuesday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, dayName: "Wednesday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, dayName: "Thursday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, dayName: "Friday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 6, dayName: "Saturday", enabled: true, startTime: "09:00", endTime: "13:00" },
  { dayOfWeek: 7, dayName: "Sunday", enabled: false, startTime: "09:00", endTime: "18:00" }
];

export default function OnboardingView() {
  const { user, switchBusiness } = useAuth();
  const { t, i18n } = useTranslation("views");
  const isEn = i18n.language === "en";
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- PASO 1: Datos de Negocio ---
  const [bizName, setBizName] = useState("");
  const [rubro, setRubro] = useState("Estética");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");

  // Auto-generación de slug dinámico
  useEffect(() => {
    const generated = bizName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remover acentos
      .replace(/[^a-z0-9\s-]/g, "") // remover caracteres especiales
      .trim()
      .replace(/\s+/g, "-"); // reemplazar espacios por guiones
    setSlug(generated);
  }, [bizName]);

  // --- PASO 2: Servicios ---
  const [services, setServices] = useState([]);

  // Cargar plantilla por defecto al cambiar rubro o idioma
  useEffect(() => {
    const templates = isEn ? SERVICE_TEMPLATES_EN : SERVICE_TEMPLATES_ES;
    const currentTemplates = templates[rubro] || templates["Otro"];
    setServices(currentTemplates.map(s => ({ ...s, checked: true, id: Math.random().toString() })));
  }, [rubro, isEn]);

  const handleToggleService = (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const handleServiceChange = (id, field, value) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddCustomService = () => {
    setServices(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        name: t("onboarding.customServiceDefaultName", { defaultValue: "Servicio Nuevo" }),
        duration: 30,
        price: isEn ? 15 : 5000,
        category: t("onboarding.customServiceCategory", { defaultValue: "Personalizado" }),
        checked: true
      }
    ]);
  };

  const handleDeleteService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // --- PASO 3: Profesionales ---
  const [workers, setWorkers] = useState([]);

  // Inicializar dueño como profesional inicial
  useEffect(() => {
    if (user) {
      const parts = user.displayName ? user.displayName.split(" ") : ["", ""];
      setWorkers([
        {
          id: "owner-worker",
          firstName: parts[0] || (isEn ? "My" : "Mi"),
          lastName: parts.slice(1).join(" ") || (isEn ? "Name" : "Nombre"),
          roleTitle: isEn ? "Owner / Professional" : "Dueño / Profesional",
          services: [] // se asocian abajo
        }
      ]);
    }
  }, [user, isEn]);

  const handleAddWorker = () => {
    setWorkers(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        firstName: "",
        lastName: "",
        roleTitle: t("onboarding.errorWorkerDefault", { defaultValue: "Profesional" }),
        services: []
      }
    ]);
  };

  const handleWorkerChange = (id, field, value) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const handleToggleWorkerService = (workerId, serviceName) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      const alreadyHas = w.services.includes(serviceName);
      return {
        ...w,
        services: alreadyHas 
          ? w.services.filter(name => name !== serviceName)
          : [...w.services, serviceName]
      };
    }));
  };

  const handleDeleteWorker = (id) => {
    if (id === "owner-worker") return; // No permitir borrar al dueño
    setWorkers(prev => prev.filter(w => w.id !== id));
  };

  // --- PASO 4: Horarios ---
  const [schedules, setSchedules] = useState(isEn ? DEFAULT_SCHEDULES_EN : DEFAULT_SCHEDULES_ES);

  // Cargar horarios al cambiar el idioma
  useEffect(() => {
    const defaultSchedules = isEn ? DEFAULT_SCHEDULES_EN : DEFAULT_SCHEDULES_ES;
    setSchedules(prev => prev.map(s => {
      const match = defaultSchedules.find(ds => ds.dayOfWeek === s.dayOfWeek);
      return match ? { ...s, dayName: match.dayName } : s;
    }));
  }, [isEn]);

  const handleScheduleToggle = (dayOfWeek) => {
    setSchedules(prev => prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, enabled: !s.enabled } : s));
  };

  const handleScheduleTimeChange = (dayOfWeek, field, value) => {
    setSchedules(prev => prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s));
  };

  // --- ACCIONES DE NAVEGACION ---
  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!bizName.trim()) {
        setError(t("onboarding.errorNameRequired"));
        return;
      }
      if (!slug.trim()) {
        setError(t("onboarding.errorSlugRequired"));
        return;
      }
    }
    if (step === 2) {
      const selectedCount = services.filter(s => s.checked).length;
      if (selectedCount === 0) {
        setError(t("onboarding.errorServiceRequired"));
        return;
      }
    }
    if (step === 3) {
      // Validar nombres de trabajadores
      const invalidWorker = workers.some(w => !w.firstName.trim());
      if (invalidWorker) {
        setError(t("onboarding.errorWorkerNameRequired"));
        return;
      }
      
      // Auto-asociar todos los servicios activos a los profesionales que no tengan servicios seleccionados
      const activeServiceNames = services.filter(s => s.checked).map(s => s.name);
      setWorkers(prev => prev.map(w => {
        if (w.services.length === 0) {
          return { ...w, services: activeServiceNames };
        }
        return w;
      }));
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(prev => prev - 1);
  };

  // --- GUARDADO FINAL ---
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Filtrar servicios activos
      const activeServices = services
        .filter(s => s.checked)
        .map(s => ({
          name: s.name.trim(),
          duration: Number(s.duration),
          price: Number(s.price),
          category: s.category || rubro
        }));

      // Filtrar profesionales activos
      const activeWorkers = workers.map(w => ({
        firstName: w.firstName.trim(),
        lastName: w.lastName.trim(),
        roleTitle: w.roleTitle.trim() || t("onboarding.errorWorkerDefault"),
        services: w.services
      }));

      // Filtrar horarios activos
      const activeSchedules = schedules
        .filter(s => s.enabled)
        .map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        }));

      const payload = {
        name: bizName.trim(),
        rubro,
        slug: slug.trim().toLowerCase(),
        logo: logo.trim() || null,
        services: activeServices,
        workers: activeWorkers,
        schedules: activeSchedules
      };

      const res = await api.post("/businesses/setup", payload);

      if (res.data?.success) {
        const newBizId = res.data.business.id;
        await switchBusiness(newBizId);
        window.location.reload(); // Recargar para sincronizar e iniciar sesión en el nuevo negocio
      }
    } catch (err) {
      console.error("Error completando el setup:", err);
      setError(
        err.response?.data?.error || t("onboarding.errorGeneralSetup")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center min-vh-100 p-3 p-md-5"
      style={{
        background: "radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.08) 0%, rgba(255, 255, 255, 0) 90%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      <Container style={{ maxWidth: "800px" }}>
        {/* Stepper Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="d-flex align-items-center flex-grow-1 last-step-no-line">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm"
                style={{
                  width: "36px",
                  height: "36px",
                  fontSize: "14px",
                  background: step === s 
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" 
                    : step > s ? "#10b981" : "#fff",
                  color: (step >= s) ? "#fff" : "#94a3b8",
                  border: step >= s ? "none" : "2px solid #e2e8f0",
                  transition: "all 0.3s ease"
                }}
              >
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 5 && (
                <div 
                  className="flex-grow-1 mx-2"
                  style={{
                    height: "3px",
                    background: step > s ? "#10b981" : "#e2e8f0",
                    transition: "all 0.3s ease"
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <Card 
          className="border-0 shadow-lg position-relative overflow-hidden p-4 p-md-5 rounded-4"
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.4)"
          }}
        >
          {/* Neon Top Blur */}
          <div 
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(40px)",
              pointerEvents: "none"
            }}
          />

          {error && (
            <Alert variant="danger" className="border-0 shadow-sm rounded-3 d-flex align-items-center gap-2 mb-4 py-2.5">
              <AlertCircle size={18} />
              <span className="small">{error}</span>
            </Alert>
          )}

          {/* STEP 1: Datos de Negocio */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-5">
                <span className="badge px-3 py-2 rounded-pill fw-bold mb-2.5" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
                  {t("onboarding.stepBadge", { step: 1 })}
                </span>
                <h2 className="fw-black text-dark tracking-tight mb-2 h3">{t("onboarding.step1Title")}</h2>
                <p className="text-secondary small max-w-500 mx-auto">
                  {t("onboarding.step1Desc")}
                </p>
              </div>

              <Form>
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-dark mb-1.5">{t("onboarding.businessNameLabel")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("onboarding.businessNamePlaceholder")}
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        className="py-2.5 px-3 border border-opacity-25 rounded-3 bg-white"
                        style={{ fontSize: "14px" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Label className="fw-semibold small text-dark mb-2.5">{t("onboarding.industryLabel")}</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {RUBROS.map((r) => {
                        const Icon = r.icon;
                        const active = rubro === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRubro(r.id)}
                            className="btn d-flex align-items-center gap-2 py-2 px-3.5 rounded-pill border transition-all"
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              background: active ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "#fff",
                              color: active ? "#fff" : "#475569",
                              borderColor: active ? "transparent" : "#cbd5e1",
                              boxShadow: active ? "0 4px 12px rgba(124, 58, 237, 0.15)" : "none"
                            }}
                          >
                            <Icon size={15} style={{ color: active ? "#fff" : r.color }} />
                            {t("onboarding.rubros." + r.id, { defaultValue: r.label })}
                          </button>
                        );
                      })}
                    </div>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-dark mb-1.5 d-flex align-items-center gap-1.5">
                        <Globe size={15} className="text-primary" />
                        {t("onboarding.slugLabel")}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="ej-aura-studio"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                        className="py-2.5 px-3 border border-opacity-25 rounded-3 bg-white font-monospace"
                        style={{ fontSize: "14px" }}
                      />
                      <Form.Text className="text-muted smaller mt-1.5 d-block">
                        {t("onboarding.slugHint")}<code style={{ color: "#7c3aed" }}>/booking/{slug || "slug-negocio"}</code>
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-dark mb-1.5 d-flex align-items-center gap-1.5">
                        <Image size={15} className="text-primary" />
                        {t("onboarding.logoUrlLabel")}
                      </Form.Label>
                      <Form.Control
                        type="url"
                        placeholder={t("onboarding.logoUrlPlaceholder")}
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        className="py-2.5 px-3 border border-opacity-25 rounded-3 bg-white"
                        style={{ fontSize: "14px" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </div>
          )}

          {/* STEP 2: Configuración de Servicios */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <span className="badge px-3 py-2 rounded-pill fw-bold mb-2.5" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
                  {t("onboarding.stepBadge", { step: 2 })}
                </span>
                <h2 className="fw-black text-dark tracking-tight mb-2 h3">{t("onboarding.step2Title")}</h2>
                <p className="text-secondary small max-w-500 mx-auto">
                  {t("onboarding.step2Desc")}
                </p>
              </div>

              <div className="mb-4 max-h-350 overflow-y-auto px-1">
                {services.map((s) => (
                  <Card 
                    key={s.id} 
                    className="border-0 shadow-sm mb-3 rounded-3"
                    style={{
                      background: s.checked ? "rgba(124, 58, 237, 0.03)" : "#fff",
                      border: s.checked ? "1px solid rgba(124, 58, 237, 0.15)" : "1px solid #e2e8f0"
                    }}
                  >
                    <Card.Body className="p-3">
                      <Row className="align-items-center g-3">
                        <Col xs="auto">
                          <Form.Check 
                            type="checkbox"
                            checked={s.checked}
                            onChange={() => handleToggleService(s.id)}
                            style={{ cursor: "pointer", transform: "scale(1.2)" }}
                          />
                        </Col>
                        
                        <Col>
                          <Form.Control 
                            type="text"
                            value={s.name}
                            onChange={(e) => handleServiceChange(s.id, "name", e.target.value)}
                            disabled={!s.checked}
                            className="fw-bold border-0 bg-transparent p-0 text-dark"
                            style={{ fontSize: "14px" }}
                            placeholder="Nombre del servicio"
                          />
                          <span className="text-muted smaller bg-light px-2 py-0.5 rounded text-uppercase fw-semibold" style={{ fontSize: "10px" }}>
                            {s.category}
                          </span>
                        </Col>

                        <Col xs={4} sm={3}>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-end-0 text-muted"><Clock size={13} /></span>
                            <Form.Control 
                              type="number"
                              value={s.duration}
                              onChange={(e) => handleServiceChange(s.id, "duration", e.target.value)}
                              disabled={!s.checked}
                              className="border-start-0 text-center fw-semibold"
                              placeholder="Duración"
                            />
                            <span className="input-group-text bg-white smaller text-muted">min</span>
                          </div>
                        </Col>

                        <Col xs={4} sm={3}>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-end-0 text-muted">
                              {isEn ? "$" : "$"}
                            </span>
                            <Form.Control 
                              type="number"
                              value={s.price}
                              onChange={(e) => handleServiceChange(s.id, "price", e.target.value)}
                              disabled={!s.checked}
                              className="border-start-0 text-end fw-semibold"
                              placeholder="Precio"
                            />
                          </div>
                        </Col>

                        <Col xs="auto">
                          <button 
                            type="button" 
                            onClick={() => handleDeleteService(s.id)} 
                            className="btn btn-link text-danger p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              <div className="d-flex justify-content-center mb-4">
                <Button 
                  variant="outline-purple"
                  onClick={handleAddCustomService}
                  className="rounded-pill px-4 py-2 border-purple-opacity fw-semibold d-flex align-items-center gap-2"
                  style={{ fontSize: "13px" }}
                >
                  <Plus size={16} />
                  <span>{t("onboarding.addCustomServiceBtn")}</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Configuración de Profesionales */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <span className="badge px-3 py-2 rounded-pill fw-bold mb-2.5" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
                  {t("onboarding.stepBadge", { step: 3 })}
                </span>
                <h2 className="fw-black text-dark tracking-tight mb-2 h3">{t("onboarding.step3Title")}</h2>
                <p className="text-secondary small max-w-500 mx-auto">
                  {t("onboarding.step3Desc")}
                </p>
              </div>

              <div className="mb-4 max-h-350 overflow-y-auto px-1">
                {workers.map((w, index) => (
                  <Card key={w.id} className="border-0 shadow-sm mb-4 rounded-3 p-3" style={{ background: "#fff" }}>
                    <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <User size={16} className="text-primary" />
                        <span className="fw-bold text-dark small">
                          {index === 0 ? t("onboarding.ownerLabel") : t("onboarding.workerLabel", { number: index + 1 })}
                        </span>
                      </div>
                      {index > 0 && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteWorker(w.id)} 
                          className="btn btn-link text-danger p-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <Row className="g-3">
                      <Col md={5}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted mb-1">{t("onboarding.firstNameLabel")}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={t("onboarding.firstNameLabel").replace(" *", "")}
                            value={w.firstName}
                            onChange={(e) => handleWorkerChange(w.id, "firstName", e.target.value)}
                            className="py-1.5 px-2.5 border border-opacity-25 rounded bg-white text-dark small"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted mb-1">{t("onboarding.lastNameLabel")}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={t("onboarding.lastNameLabel")}
                            value={w.lastName}
                            onChange={(e) => handleWorkerChange(w.id, "lastName", e.target.value)}
                            className="py-1.5 px-2.5 border border-opacity-25 rounded bg-white text-dark small"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted mb-1">{t("onboarding.roleTitleLabel")}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={t("onboarding.roleTitlePlaceholder")}
                            value={w.roleTitle}
                            onChange={(e) => handleWorkerChange(w.id, "roleTitle", e.target.value)}
                            className="py-1.5 px-2.5 border border-opacity-25 rounded bg-white text-dark small"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Label className="smaller text-muted mb-1.5 d-block">{t("onboarding.servicesPerformedLabel")}</Form.Label>
                        <div className="d-flex flex-wrap gap-2">
                          {services.filter(s => s.checked).map(s => {
                            const selected = w.services.includes(s.name) || w.services.length === 0;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleToggleWorkerService(w.id, s.name)}
                                className="btn py-1 px-2.5 rounded-pill border text-start transition-all"
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  background: selected ? "rgba(124, 58, 237, 0.1)" : "#fff",
                                  color: selected ? "#7c3aed" : "#475569",
                                  borderColor: selected ? "#7c3aed" : "#cbd5e1"
                                }}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                        {w.services.length === 0 && (
                          <Form.Text className="text-muted smaller d-block mt-1">
                            {t("onboarding.allServicesAssignedHint")}
                          </Form.Text>
                        )}
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>

              <div className="d-flex justify-content-center mb-4">
                <Button 
                  variant="outline-purple"
                  onClick={handleAddWorker}
                  className="rounded-pill px-4 py-2 border-purple-opacity fw-semibold d-flex align-items-center gap-2"
                  style={{ fontSize: "13px" }}
                >
                  <Plus size={16} />
                  <span>{t("onboarding.addWorkerBtn")}</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Horarios de Atención */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-4">
                <span className="badge px-3 py-2 rounded-pill fw-bold mb-2.5" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
                  {t("onboarding.stepBadge", { step: 4 })}
                </span>
                <h2 className="fw-black text-dark tracking-tight mb-2 h3">{t("onboarding.step4Title")}</h2>
                <p className="text-secondary small max-w-500 mx-auto">
                  {t("onboarding.step4Desc")}
                </p>
              </div>

              <div className="mb-4 max-h-350 overflow-y-auto px-1">
                {schedules.map((s) => (
                  <div 
                    key={s.dayOfWeek}
                    className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 border bg-white"
                    style={{
                      borderColor: s.enabled ? "rgba(124, 58, 237, 0.15)" : "#e2e8f0"
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Form.Check 
                        type="switch"
                        id={`switch-day-${s.dayOfWeek}`}
                        checked={s.enabled}
                        onChange={() => handleScheduleToggle(s.dayOfWeek)}
                        style={{ cursor: "pointer" }}
                      />
                      <span className={`fw-bold small ${s.enabled ? "text-dark" : "text-muted"}`} style={{ width: "80px" }}>
                        {s.dayName}
                      </span>
                    </div>

                    {s.enabled ? (
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control 
                          type="time"
                          value={s.startTime}
                          onChange={(e) => handleScheduleTimeChange(s.dayOfWeek, "startTime", e.target.value)}
                          className="py-1 px-2 border rounded text-center small"
                          style={{ width: "100px" }}
                        />
                        <span className="text-muted smaller">a</span>
                        <Form.Control 
                          type="time"
                          value={s.endTime}
                          onChange={(e) => handleScheduleTimeChange(s.dayOfWeek, "endTime", e.target.value)}
                          className="py-1 px-2 border rounded text-center small"
                          style={{ width: "100px" }}
                        />
                      </div>
                    ) : (
                      <span className="text-muted smaller italic">{t("onboarding.closedLabel")}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Resumen & Lanzamiento */}
          {step === 5 && (
            <div className="animate-fade-in text-center">
              <div className="mb-4">
                <span className="badge px-3 py-2 rounded-pill fw-bold mb-2.5" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  {t("onboarding.allSetBadge")}
                </span>
                <h2 className="fw-black text-dark tracking-tight mb-2 h3">{t("onboarding.step5Title")}</h2>
                <p className="text-secondary small max-w-500 mx-auto">
                  {t("onboarding.step5Desc")}
                </p>
              </div>

              <div 
                className="text-start mx-auto p-4 rounded-4 mb-5 shadow-sm"
                style={{
                  maxWidth: "500px",
                  background: "rgba(255, 255, 255, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.6)"
                }}
              >
                <h4 className="fw-bold h6 text-uppercase tracking-wider text-muted mb-3.5">{t("onboarding.summaryTitle")}</h4>
                
                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2.5 border-bottom border-purple-opacity">
                  <span className="text-secondary small fw-medium">{t("onboarding.bizNameSummary")}</span>
                  <span className="fw-bold text-dark small">{bizName}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2.5 border-bottom border-purple-opacity">
                  <span className="text-secondary small fw-medium">{t("onboarding.industrySummary")}</span>
                  <span className="fw-bold text-dark small">
                    {t("onboarding.rubros." + rubro, { defaultValue: rubro })}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2.5 border-bottom border-purple-opacity">
                  <span className="text-secondary small fw-medium">{t("onboarding.slugSummary")}</span>
                  <span className="fw-bold text-primary small font-monospace">/booking/{slug}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2.5 border-bottom border-purple-opacity">
                  <span className="text-secondary small fw-medium">{t("onboarding.servicesSummary")}</span>
                  <span className="fw-bold text-dark small">
                    {t("onboarding.servicesCount", { count: services.filter(s => s.checked).length })}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2.5 border-bottom border-purple-opacity">
                  <span className="text-secondary small fw-medium">{t("onboarding.workersSummary")}</span>
                  <span className="fw-bold text-dark small">
                    {t("onboarding.workersCount", { count: workers.length })}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary small fw-medium">{t("onboarding.daysSummary")}</span>
                  <span className="fw-bold text-dark small">
                    {t("onboarding.daysCount", { count: schedules.filter(s => s.enabled).length })}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="py-2.5 px-5 rounded-pill border-0 shadow-sm fw-bold d-inline-flex align-items-center gap-2 hover-scale"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  fontSize: "15px",
                  color: "#fff"
                }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" />
                    <span>{t("onboarding.launchingLoading")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("onboarding.launchBtn")}</span>
                    <span>🚀</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          {step < 5 && (
            <div className="d-flex justify-content-between mt-5 pt-4 border-top">
              {step > 1 ? (
                <Button
                  variant="outline-secondary"
                  onClick={prevStep}
                  disabled={loading}
                  className="rounded-pill px-4 py-2 small fw-bold d-flex align-items-center gap-1.5"
                  style={{ fontSize: "13px" }}
                >
                  <ArrowLeft size={14} />
                  <span>{t("onboarding.backBtn")}</span>
                </Button>
              ) : (
                <div />
              )}

              <Button
                variant="purple"
                onClick={nextStep}
                disabled={loading}
                className="rounded-pill px-4 py-2 text-white bg-purple-600 hover-bg-purple-700 border-0 shadow-sm fw-bold d-flex align-items-center gap-1.5"
                style={{ fontSize: "13px" }}
              >
                <span>{t("onboarding.nextBtn")}</span>
                <span>→</span>
              </Button>
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}
