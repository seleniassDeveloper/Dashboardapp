import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Modal, InputGroup } from "react-bootstrap";
import { 
  Calendar, User, Clock, CheckCircle2, ChevronRight, ArrowLeft, Heart, 
  ShieldCheck, CreditCard, Lock, MessageSquare, Mail, Award, CheckCircle, 
  HelpCircle, Eye, EyeOff, Globe, Sparkles, AlertTriangle, ChevronDown, ChevronUp 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/language/LanguageSwitcher.jsx";
import api from "../../lib/api.js";
import { useFormSchema } from "../../hooks/useFormSchema.js";

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
  const { t, i18n } = useTranslation("booking");
  const isEs = i18n.language === "es";
  const currency = useCurrency();
  const { businessSlug } = useParams();
  const navigate = useNavigate();



  // Carga de formulario dinámico
  const { enabledFields, loading: schemaLoading, error: schemaError } = useFormSchema(
    "assign.appointment.form.modal",
    { enabled: true, isPublic: true }
  );

  // Estados de carga y negocio
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  // Catálogos
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);

  // Reservas - Flujo
  const [step, setStep] = useState(1); // 1: Servicio, 2: Profesional, 3: Fecha/Hora, 4: Datos Cliente, 5: Pago de Seña

  // Selecciones
  const [selServices, setSelServices] = useState([]);
  const [selProfessional, setSelProfessional] = useState(null); // null significa "Cualquiera"

  const handleToggleService = (service) => {
    setSelServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };
  const [selDate, setSelDate] = useState("");
  const [selTime, setSelTime] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

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

  // Estados de Seña (Paso 5)
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");
  const [cardForm, setCardForm] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [paying, setPaying] = useState(false);

  // === ESTADOS SIMULADOR MERCADO PAGO ===
  const [showMpCheckout, setShowMpCheckout] = useState(false);
  const [mpStep, setMpStep] = useState("select_method"); // select_method, account_login, otp_entry, balance_confirm, card_entry, debin_select, debin_auth, cash_receipt, processing, success
  const [mpEmail, setMpEmail] = useState("");
  const [mpPassword, setMpPassword] = useState("");
  const [mpOtp, setMpOtp] = useState(["", "", "", "", "", ""]);
  const [showMpPassword, setShowMpPassword] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [mpTxId, setMpTxId] = useState("");

  const getDownpaymentAmount = () => {
    if (!business || selServices.length === 0) return 0;
    if (business.bookingDownpaymentAmount) {
      return business.bookingDownpaymentAmount;
    }
    const totalPrice = selServices.reduce((sum, s) => sum + s.price, 0);
    return Math.round((totalPrice * (business.bookingDownpaymentPercent || 30)) / 100);
  };

  const displayFields = useMemo(() => {
    return enabledFields.length > 0 ? enabledFields : [
      { id: "clientFirstName", label: "Nombre", required: true },
      { id: "clientLastName", label: "Apellido", required: true },
      { id: "phone", label: "WhatsApp / Teléfono", required: true },
      { id: "email", label: "Correo Electrónico", required: false },
      { id: "notes", label: "Notas / Preferencias", required: false },
    ];
  }, [enabledFields]);

  const clientFieldsToDisplay = useMemo(() => {
    const list = displayFields.filter(f => ["clientFirstName", "clientLastName", "phone", "email", "notes"].includes(f.id));
    if (list.length === 0) {
      return [
        { id: "clientFirstName", label: "Nombre", required: true },
        { id: "clientLastName", label: "Apellido", required: true },
        { id: "phone", label: "WhatsApp / Teléfono", required: true },
        { id: "email", label: "Correo Electrónico", required: false },
        { id: "notes", label: "Notas / Preferencias", required: false },
      ];
    }
    return list;
  }, [displayFields]);

  const validateForm = () => {
    const errs = {};
    const firstNameField = clientFieldsToDisplay.find(f => f.id === "clientFirstName");
    const lastNameField = clientFieldsToDisplay.find(f => f.id === "clientLastName");
    const phoneField = clientFieldsToDisplay.find(f => f.id === "phone");
    const emailField = clientFieldsToDisplay.find(f => f.id === "email");
    const notesField = clientFieldsToDisplay.find(f => f.id === "notes");

    if (firstNameField && firstNameField.required && !clientForm.firstName.trim()) {
      errs.firstName = "El nombre es obligatorio.";
    }
    if (lastNameField && lastNameField.required && !clientForm.lastName.trim()) {
      errs.lastName = "El apellido es obligatorio.";
    }
    if (phoneField) {
      if (phoneField.required && !clientForm.phone.trim()) {
        errs.phone = "El teléfono es obligatorio.";
      } else if (clientForm.phone.trim()) {
        const cleaned = clientForm.phone.replace(/\D/g, "");
        if (cleaned.length < 7 || cleaned.length > 15) {
          errs.phone = "El teléfono debe tener entre 7 y 15 dígitos.";
        }
      }
    }
    if (emailField) {
      if (emailField.required && !clientForm.email.trim()) {
        errs.email = "El correo electrónico es obligatorio.";
      } else if (clientForm.email.trim() && !/\S+@\S+\.\S+/.test(clientForm.email.trim())) {
        errs.email = "El correo electrónico no tiene un formato válido.";
      }
    }
    if (notesField && notesField.required && !clientForm.notes.trim()) {
      errs.notes = "Las notas son obligatorias.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getNextDays = () => {
    const days = [];
    const daysOfWeekEs = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const daysOfWeekEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const baseDate = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(baseDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const dayNum = d.getDay();
      const dayName = isEs ? daysOfWeekEs[dayNum] : daysOfWeekEn[dayNum];
      const monthName = isEs ? monthsEs[d.getMonth()] : monthsEn[d.getMonth()];
      
      let label = dayName;
      if (i === 0) label = isEs ? "Hoy" : "Today";
      else if (i === 1) label = isEs ? "Mañana" : "Tomorrow";
      
      days.push({
        dateStr,
        label,
        dayOfMonth: d.getDate(),
        monthName
      });
    }
    return days;
  };

  const groupSlots = (slotsList) => {
    const morning = [];
    const afternoon = [];
    const evening = [];
    
    if (!Array.isArray(slotsList)) {
      return { morning, afternoon, evening };
    }
    
    slotsList.forEach((slot) => {
      if (typeof slot !== "string") return;
      const hour = parseInt(slot.split(":")[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 18) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });
    
    return { morning, afternoon, evening };
  };

  // Cargar info del negocio, servicios y profesionales
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true);
        setError("");

        const bizRes = await api.get(`/public/business/${businessSlug}`);
        setBusiness(bizRes.data);

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
    loadBusinessData();
  }, [businessSlug]);

  // Cargar slots cuando cambia la fecha o el profesional
  useEffect(() => {
    if (selServices.length === 0 || !selDate) return;
    const loadSlots = async () => {
      try {
        setLoadingSlots(true);
        const workerId = selProfessional ? selProfessional.id : "";
        const serviceIds = selServices.map((s) => s.id).join(",");
        const res = await api.get(
          `/public/business/${businessSlug}/slots?serviceId=${serviceIds}&workerId=${workerId}&date=${selDate}`
        );
        setSlots(res.data || []);
      } catch (e) {
        console.error(e);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selServices, selProfessional, selDate]);

  const handleNextStep = () => setStep((p) => p + 1);
  const handleBackStep = () => setStep((p) => p - 1);

  const handleBook = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      const workerId = selProfessional ? selProfessional.id : "any";
      const serviceIds = selServices.map((s) => s.id).join(",");

      const payload = {
        ...clientForm,
        serviceId: serviceIds,
        professionalId: workerId,
        date: selDate,
        time: selTime,
      };

      const res = await api.post(`/public/business/${businessSlug}/bookings`, payload);
      
      const mappedBookings = (res.data.bookings || [res.data.booking]).map((b) => ({
        ...b,
        service: selServices.find((s) => s.id === b.serviceId) || b.service,
        worker: selProfessional || professionals.find((p) => p.id === b.workerId),
      }));

      navigate(`/booking/${businessSlug}/success`, {
        state: {
          message: res.data.message || t("form.successFallback"),
          booking: mappedBookings[0],
          bookings: mappedBookings,
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

  const handleStep4Submit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    if (business?.bookingDownpaymentEnabled) {
      handleNextStep();
    } else {
      handleBook(e);
    }
  };

  const handlePaymentAndBook = async (customTxId = null) => {
    try {
      setPaying(true);
      setError("");

      const workerId = selProfessional ? selProfessional.id : "any";
      const serviceIds = selServices.map((s) => s.id).join(",");

      const downpayment = getDownpaymentAmount();
      const transactionId = customTxId || (paymentMethod === "mercadopago" 
        ? `MP-${Math.floor(10000000 + Math.random() * 90000000)}` 
        : `TX-${Math.floor(10000000 + Math.random() * 90000000)}`);

      const payload = {
        ...clientForm,
        serviceId: serviceIds,
        professionalId: workerId,
        date: selDate,
        time: selTime,
        downpaymentPaid: downpayment,
        downpaymentStatus: "PAID",
        downpaymentTransactionId: transactionId,
      };

      const res = await api.post(`/public/business/${businessSlug}/bookings`, payload);
      
      const mappedBookings = (res.data.bookings || [res.data.booking]).map((b) => ({
        ...b,
        service: selServices.find((s) => s.id === b.serviceId) || b.service,
        worker: selProfessional || professionals.find((p) => p.id === b.workerId),
      }));

      navigate(`/booking/${businessSlug}/success`, {
        state: {
          message: res.data.message || t("form.successFallback"),
          booking: mappedBookings[0],
          bookings: mappedBookings,
          color: business.bookingPrimaryColor,
        },
      });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || t("form.bookingError"));
      setShowMpCheckout(false);
    } finally {
      setPaying(false);
    }
  };

  const handleLaunchMpCheckout = () => {
    // Generate transaction ID
    const generatedId = `MP-${Math.floor(100000000 + Math.random() * 900000000)}`;
    setMpTxId(generatedId);
    setMpStep("select_method");
    setMpEmail("");
    setMpPassword("");
    setMpOtp(["", "", "", "", "", ""]);
    setShowMpCheckout(true);
  };

  const handleMpConfirmPayment = async () => {
    setMpStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setMpStep("success");
    // Show success confeti screen for 2 seconds before writing booking
    await new Promise((resolve) => setTimeout(resolve, 2200));
    setShowMpCheckout(false);
    handlePaymentAndBook(mpTxId);
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    let newOtp = [...mpOtp];
    newOtp[index] = element.value;
    setMpOtp(newOtp);

    // Auto-focus next field
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }

    // Auto-verify if all 6 digits entered
    if (newOtp.join("").length === 6) {
      setTimeout(() => {
        setMpStep("balance_confirm");
      }, 500);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !mpOtp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const getCardBrand = (num) => {
    const cleanNum = num.replace(/\s?/g, "");
    if (cleanNum.startsWith("4")) return "VISA";
    if (cleanNum.startsWith("5")) return "MASTERCARD";
    if (cleanNum.startsWith("3")) return "AMEX";
    if (cleanNum.startsWith("6")) return "CABAL";
    return "TARJETA";
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <Spinner animation="border" variant="dark" className="mb-2" />
          <p className="text-muted smaller mb-0">Cargando asistente de reserva…</p>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <Container style={{ maxWidth: "480px" }}>
          <Alert variant="danger" className="text-center rounded-3 shadow-sm">
            <h4 className="fw-bold mb-2">Error de Conexión</h4>
            <p className="smaller mb-0">{error}</p>
          </Alert>
        </Container>
      </div>
    );
  }

  const primaryColor = business?.bookingPrimaryColor || "#7c3aed";

  return (
    <div className="min-vh-100 bg-light py-4 py-md-5 position-relative" style={{ fontFamily: "Outfit, sans-serif" }}>
      
      {/* LANGUAGE & BRAND FLOATING BAR */}
      <Container className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: "720px" }}>
        <div className="d-flex align-items-center gap-2">
          {business?.logo ? (
            <img src={business.logo} alt="Logo" className="rounded-circle border" style={{ width: "36px", height: "36px", objectFit: "cover" }} translate="no" />
          ) : (
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" translate="no" style={{ width: "36px", height: "36px", background: `linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%)`, fontSize: "12px" }}>
              {business?.name?.substring(0, 2).toUpperCase() || "BIZ"}
            </div>
          )}
          <strong className="text-dark small" translate="no">{business?.name || "Reservas Online"}</strong>
        </div>
        <LanguageSwitcher />
      </Container>

      <Container style={{ maxWidth: "720px" }}>
        {business && (
          <div className="card-premium border bg-white p-3.5 rounded-2xl shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center small text-muted px-1 mb-3">
              <span>{isEs ? "Progreso de Reserva" : "Booking Progress"}</span>
              <strong className="text-dark">{step} de {business.bookingDownpaymentEnabled ? 5 : 4}</strong>
            </div>
            
            <div className="d-flex justify-content-between align-items-center position-relative mb-2 px-2">
              <div className="position-absolute start-0 end-0 bg-light rounded-pill" style={{ height: "4px", top: "50%", transform: "translateY(-50%)", zIndex: 0 }} />
              
              <div 
                className="position-absolute start-0 bg-light rounded-pill transition-all" 
                style={{ 
                  height: "4px", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  width: `${((step - 1) / (business.bookingDownpaymentEnabled ? 4 : 3)) * 100}%`,
                  backgroundColor: primaryColor,
                  zIndex: 1,
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              />
              
              {Array.from({ length: business.bookingDownpaymentEnabled ? 5 : 4 }).map((_, idx) => {
                const currentStepNum = idx + 1;
                const isActive = currentStepNum <= step;
                const isCurrent = currentStepNum === step;
                return (
                  <div 
                    key={idx}
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all"
                    style={{
                      width: "28px",
                      height: "28px",
                      fontSize: "11px",
                      zIndex: 2,
                      border: "2px solid",
                      borderColor: isCurrent ? primaryColor : (isActive ? primaryColor : "#cbd5e1"),
                      backgroundColor: isActive ? (isCurrent ? "#fff" : primaryColor) : "#fff",
                      color: isActive ? (isCurrent ? primaryColor : "#fff") : "#94a3b8",
                      boxShadow: isCurrent ? `0 0 0 4px ${primaryColor}20` : "none"
                    }}
                  >
                    {currentStepNum}
                  </div>
                );
              })}
            </div>
            
            <div className="d-flex justify-content-between text-muted px-1" style={{ fontSize: "10px", fontWeight: 700 }}>
              <span>{isEs ? "Servicio" : "Service"}</span>
              <span>{isEs ? "Profesional" : "Professional"}</span>
              <span>{isEs ? "Fecha & Hora" : "Date & Time"}</span>
              <span>{isEs ? "Tus Datos" : "Your Data"}</span>
              {business.bookingDownpaymentEnabled && <span>{isEs ? "Seña" : "Downpayment"}</span>}
            </div>
          </div>
        )}

        {error && <Alert variant="danger" className="rounded-2xl border-0 shadow-sm mb-4">{error}</Alert>}

        <Card className="card-premium border bg-white rounded-2xl shadow-sm overflow-hidden">
          <Card.Body className="p-4 p-md-5">
            
            {/* PASO 1: SELECCIONAR SERVICIO */}
            {step === 1 && (
              <div className="animate-fade-in d-grid gap-4">
                <div className="text-center pb-3 border-bottom mb-2">
                  <h2 className="h4 fw-black text-gray-900 mb-1">{isEs ? "Selecciona los Servicios" : "Select Services"}</h2>
                  <p className="text-muted smaller mb-0">{isEs ? "Elegí uno o más tratamientos que deseas agendar." : "Choose one or more treatments you want to schedule."}</p>
                </div>

                {business?.googleBookingUrl && (
                  <Card className="border-0 shadow-sm p-3.5 rounded-4" style={{ backgroundColor: "#f3e8ff", border: "1px solid #e9d5ff" }}>
                    <div className="d-flex align-items-start gap-3">
                      <div className="p-2 bg-white rounded-3 d-flex align-items-center justify-content-center text-primary" style={{ color: "#7c3aed", minWidth: "40px", height: "40px" }}>
                        <Calendar size={20} style={{ color: "#7c3aed" }} />
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="h6 fw-bold mb-1" style={{ color: "#5b21b6" }}>
                          {isEs ? "Reserva Directa desde Google Calendar" : "Direct Booking from Google Calendar"}
                        </h4>
                        <p className="text-secondary smaller mb-2.5 leading-relaxed">
                          {isEs 
                            ? "También puedes agendar tu turno oficial de forma interactiva y segura directamente desde nuestro Google Calendar oficial."
                            : "You can also schedule your official appointment interactively and securely directly from our official Google Calendar."}
                        </p>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          href={business.googleBookingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-pill px-4 py-1.5 fw-semibold border-0"
                          style={{ backgroundColor: "#7c3aed", backgroundImage: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", fontSize: "12px" }}
                        >
                          {isEs ? "Agendar en Google Calendar ↗" : "Book in Google Calendar ↗"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {schemaLoading ? (
                  <div className="py-5 text-center text-muted">
                    <Spinner animation="border" variant="dark" className="mb-3" />
                    <p className="fw-medium small">{isEs ? "Cargando configuración del formulario..." : "Loading form settings..."}</p>
                  </div>
                ) : (
                  <>
                    {services.length === 0 ? (
                      <div className="p-4 border border-dashed rounded-3xl text-center text-muted small bg-light">
                        <AlertTriangle size={24} className="mx-auto text-warning mb-2 opacity-75" />
                        <p className="smaller mb-0">{isEs ? "No hay servicios disponibles." : "No services available."}</p>
                      </div>
                    ) : (
                      <div className="d-grid gap-2">
                        <Form.Control
                          type="text"
                          placeholder={isEs ? "Buscar servicio..." : "Search service..."}
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="rounded-xl border-gray-200 py-2.5 px-3 mb-2"
                          style={{ fontSize: "13px" }}
                        />
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                          {services
                            .filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                            .map((s) => {
                              const isSelected = selServices.some((svc) => svc.id === s.id);
                              return (
                                <div 
                                  key={s.id}
                                  onClick={() => handleToggleService(s)}
                                  className="p-3 border rounded-2xl cursor-pointer transition-all hover-row-focus d-flex justify-content-between align-items-center gap-3"
                                  style={{
                                    borderColor: isSelected ? primaryColor : "#e2e8f0",
                                    backgroundColor: isSelected ? `${primaryColor}05` : "#fff",
                                    borderWidth: isSelected ? "2px" : "1px",
                                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <Form.Check 
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="me-2"
                                      style={{ accentColor: primaryColor }}
                                    />
                                    <div>
                                      <strong className="text-gray-900 d-block small fw-bold">{s.name}</strong>
                                      <span className="smaller text-muted d-block mt-0.5 d-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
                                        <Clock size={11} />
                                        <span>{s.duration} min</span>
                                      </span>
                                    </div>
                                  </div>
                                  <strong style={{ fontSize: "13px", color: isSelected ? primaryColor : "#475569" }} className="fw-black">{currency(s.price)}</strong>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    
                    {selServices.length > 0 && (
                      <div className="mt-4 p-3 bg-white border rounded-2xl d-flex justify-content-between align-items-center shadow-sm animate-fade-in" style={{ borderColor: primaryColor }}>
                        <div>
                          <strong className="d-block text-dark small">
                            {selServices.length} {selServices.length === 1 ? "servicio seleccionado" : "servicios seleccionados"}
                          </strong>
                          <span className="smaller text-muted">
                            Total: {currency(selServices.reduce((sum, s) => sum + s.price, 0))} • {selServices.reduce((sum, s) => sum + s.duration, 0)} min
                          </span>
                        </div>
                        <Button 
                          onClick={handleNextStep}
                          className="rounded-pill px-4 border-0 text-white font-semibold d-flex align-items-center gap-1 btn-premium"
                          style={{ background: primaryColor }}
                        >
                          <span>{isEs ? "Continuar" : "Continue"}</span>
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* PASO 2: SELECCIONAR PROFESIONAL */}
            {step === 2 && (
              <div className="animate-fade-in d-grid gap-4">
                <div className="text-center pb-3 border-bottom mb-2">
                  <h2 className="h4 fw-black text-gray-900 mb-1">{isEs ? "Selecciona el Profesional" : "Select Professional"}</h2>
                  <p className="text-muted smaller mb-0">{isEs ? "¿Quién te gustaría que realice el servicio?" : "Who would you like to perform the service?"}</p>
                </div>

                <div className="d-grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                  <div 
                    onClick={() => { setSelProfessional(null); handleNextStep(); }}
                    className="p-3 border rounded-2xl cursor-pointer transition-all hover-row-focus d-flex flex-column justify-content-between text-center gap-2"
                    style={{
                      borderColor: selProfessional === null ? primaryColor : "#e2e8f0",
                      backgroundColor: selProfessional === null ? `${primaryColor}05` : "#fff",
                      borderWidth: selProfessional === null ? "2px" : "1px",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                      minHeight: "140px"
                    }}
                  >
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white mx-auto mt-2" style={{ width: "48px", height: "48px", background: `linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%)` }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <strong className="text-gray-900 d-block small fw-bold">{isEs ? "Cualquier miembro" : "Any member"}</strong>
                      <span className="smaller text-muted d-block mt-0.5" style={{ fontSize: "11px" }}>{isEs ? "Asignación rápida" : "Fast assignment"}</span>
                    </div>
                  </div>

                  {professionals.length === 0 && (
                    <div className="w-100 col-span-full">
                      <Alert variant="warning" className="rounded-2xl border-0 shadow-sm text-center py-4 mb-0">
                        <AlertTriangle size={24} className="mx-auto text-warning mb-2" />
                        <strong className="d-block small text-dark mb-1">{isEs ? "No hay profesionales disponibles" : "No professionals available"}</strong>
                        <span className="smaller text-muted d-block">{isEs ? "Este negocio aún no ha publicado profesionales para reservas online." : "This business has not published professionals for online bookings yet."}</span>
                      </Alert>
                    </div>
                  )}

                  {professionals.length > 0 && professionals.filter((p) => selServices.every((s) => p.serviceIds.includes(s.id))).length === 0 && (
                    <div className="w-100 col-span-full">
                      <Alert variant="warning" className="rounded-2xl border-0 shadow-sm text-center py-4 mb-0">
                        <AlertTriangle size={24} className="mx-auto text-warning mb-2" />
                        <strong className="d-block small text-dark mb-1">{isEs ? "Ningún profesional realiza todos los servicios seleccionados" : "No professional performs all selected services"}</strong>
                        <span className="smaller text-muted d-block">{isEs ? "Intenta quitando algún servicio o reservándolos por separado." : "Try removing a service or booking them separately."}</span>
                      </Alert>
                    </div>
                  )}

                  {professionals
                    .filter((p) => selServices.every((s) => p.serviceIds.includes(s.id)))
                    .map((p) => {
                      const isSelected = selProfessional?.id === p.id;
                      return (
                        <div 
                          key={p.id}
                          onClick={() => { setSelProfessional(p); handleNextStep(); }}
                          className="p-3 border rounded-2xl cursor-pointer transition-all hover-row-focus d-flex flex-column justify-content-between text-center gap-2"
                          style={{
                            borderColor: isSelected ? primaryColor : "#e2e8f0",
                            backgroundColor: isSelected ? `${primaryColor}05` : "#fff",
                            borderWidth: isSelected ? "2px" : "1px",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                            minHeight: "140px"
                          }}
                        >
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto mt-2" style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", fontSize: "14px" }}>
                            {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-gray-900 d-block small fw-bold">{p.firstName} {p.lastName}</strong>
                            <span className="smaller text-primary d-block mt-0.5 fw-medium" style={{ fontSize: "11px" }}>
                              {p.roleTitle || (isEs ? "Profesional" : "Professional")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  <Button variant="outline-secondary" onClick={handleBackStep} className="rounded-pill px-4">
                    {t("form.back")}
                  </Button>
                </div>
              </div>
            )}

            {/* PASO 3: SELECCIONAR FECHA Y HORA */}
            {step === 3 && (
              <div className="animate-fade-in d-grid gap-4">
                <div className="text-center pb-3 border-bottom mb-2">
                  <h2 className="h4 fw-black text-gray-900 mb-1">{isEs ? "Selecciona Fecha y Hora" : "Select Date & Time"}</h2>
                  <p className="text-muted smaller mb-0">{isEs ? "Escoge el bloque de tiempo de tu preferencia." : "Choose the time block of your preference."}</p>
                </div>

                <div style={{ minWidth: 0 }}>
                  <span className="smaller text-muted fw-bold uppercase d-block mb-2.5" style={{ fontSize: "10.5px", letterSpacing: "0.05em" }}>
                    {isEs ? "Días disponibles" : "Available days"}
                  </span>
                  <div className="d-flex gap-2 overflow-auto pb-2 scrollbar-none" style={{ whiteSpace: "nowrap", WebkitOverflowScrolling: "touch" }}>
                    {getNextDays().map((day) => {
                      const isSelected = selDate === day.dateStr;
                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => { setSelDate(day.dateStr); setSelTime(""); }}
                          className="p-3 border rounded-2xl text-center cursor-pointer transition-all d-inline-block"
                          style={{
                            minWidth: "75px",
                            borderColor: isSelected ? primaryColor : "#e2e8f0",
                            backgroundColor: isSelected ? `${primaryColor}10` : "#fff",
                            borderWidth: isSelected ? "2px" : "1px",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)"
                          }}
                        >
                          <span className="smaller text-muted d-block uppercase fw-bold" style={{ fontSize: "10px", color: isSelected ? primaryColor : "#64748b" }}>{day.label}</span>
                          <strong className="h4 my-1 d-block" style={{ color: isSelected ? primaryColor : "#1e293b" }}>{day.dayOfMonth}</strong>
                          <span className="smaller text-muted d-block" style={{ fontSize: "10px" }}>{day.monthName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Row className="g-3">
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small">{isEs ? "O elegí otro día" : "Or choose another day"}</Form.Label>
                      <Form.Control
                        type="date"
                        value={selDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => { setSelDate(e.target.value); setSelTime(""); }}
                        className="rounded-xl border-gray-200 py-2.5"
                        style={{ fontSize: "13px" }}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={7}>
                    <Form.Label className="fw-semibold small">{isEs ? "Horarios Disponibles" : "Available Times"}</Form.Label>
                    {!selDate ? (
                      <div className="p-3 border border-dashed rounded-2xl text-center text-muted smaller bg-light">
                        {isEs ? "Selecciona primero una fecha para ver horarios." : "Select a date first to see available schedules."}
                      </div>
                    ) : loadingSlots ? (
                      <div className="text-center py-4">
                        <Spinner size="sm" className="me-2" /> {isEs ? "Buscando disponibilidad..." : "Searching availability..."}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="p-4 border border-dashed rounded-3xl text-center text-danger small bg-danger bg-opacity-5">
                        <AlertTriangle size={20} className="mx-auto mb-2 text-danger" />
                        <div>{isEs ? "No hay horarios disponibles." : "No schedules available."}</div>
                        <span className="smaller text-muted">{isEs ? "Intentá con otro día." : "Please try a different day."}</span>
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2 mt-1 overflow-auto bg-light bg-opacity-40 p-3 border rounded-3xl" style={{ maxHeight: "180px", paddingRight: "4px" }}>
                        {slots.map((t) => (
                          <Button
                            key={t}
                            size="sm"
                            variant={selTime === t ? "dark" : "outline-secondary"}
                            onClick={() => setSelTime(t)}
                            className="rounded-xl border-gray-200"
                            style={{
                              fontSize: "11px",
                              padding: "6px 12px",
                              backgroundColor: selTime === t ? "#1e293b" : "#fff",
                              color: selTime === t ? "#fff" : "#475569",
                              borderColor: selTime === t ? "#1e293b" : "#e2e8f0",
                            }}
                          >
                            {t} hs
                          </Button>
                        ))}
                      </div>
                    )}
                  </Col>
                </Row>

                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  <Button variant="outline-secondary" onClick={handleBackStep} className="rounded-pill px-4">
                    {t("form.back")}
                  </Button>
                  <Button
                    variant="dark"
                    disabled={!selDate || !selTime}
                    onClick={handleNextStep}
                    className="rounded-pill px-4 btn-premium border-0"
                    style={{ background: primaryColor }}
                  >
                    {t("form.next", { defaultValue: "Siguiente" })}
                  </Button>
                </div>
              </div>
            )}

            {/* PASO 4: COMPLETAR DATOS DEL CLIENTE */}
            {step === 4 && (
              <Form onSubmit={handleStep4Submit} className="animate-fade-in d-grid gap-4">
                <div className="text-center pb-3 border-bottom mb-2">
                  <h2 className="h4 fw-black text-gray-900 mb-1">{isEs ? "Tus Datos de Contacto" : "Your Contact Details"}</h2>
                  <p className="text-muted smaller mb-0">{isEs ? "Completá los campos para finalizar tu reserva." : "Complete the fields to finalize your booking."}</p>
                </div>

                {schemaError && <Alert variant="warning" className="small py-2">{schemaError}</Alert>}

                <Row className="g-3">
                  {clientFieldsToDisplay.map((field) => {
                    if (field.id === "clientFirstName") {
                      return (
                        <Col xs={6} key="clientFirstName">
                          <Form.Group>
                            <Form.Label className="fw-semibold small">{field.label} {field.required && "*"}</Form.Label>
                            <Form.Control
                              type="text"
                              required={field.required}
                              value={clientForm.firstName}
                              onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })}
                              placeholder={field.placeholder || "Juan"}
                              className="rounded-xl border-gray-200 py-2.5"
                              isInvalid={Boolean(errors.firstName)}
                            />
                            {errors.firstName && <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>}
                          </Form.Group>
                        </Col>
                      );
                    }
                    if (field.id === "clientLastName") {
                      return (
                        <Col xs={6} key="clientLastName">
                          <Form.Group>
                            <Form.Label className="fw-semibold small">{field.label} {field.required && "*"}</Form.Label>
                            <Form.Control
                              type="text"
                              required={field.required}
                              value={clientForm.lastName}
                              onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })}
                              placeholder={field.placeholder || "Pérez"}
                              className="rounded-xl border-gray-200 py-2.5"
                              isInvalid={Boolean(errors.lastName)}
                            />
                            {errors.lastName && <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>}
                          </Form.Group>
                        </Col>
                      );
                    }
                    if (field.id === "phone") {
                      return (
                        <Col xs={12} key="phone">
                          <Form.Group>
                            <Form.Label className="fw-semibold small">{field.label} {field.required && "*"}</Form.Label>
                            <Form.Control
                              type="tel"
                              required={field.required}
                              value={clientForm.phone}
                              onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                              placeholder={field.placeholder || "+54 9 11 ..."}
                              className="rounded-xl border-gray-200 py-2.5"
                              isInvalid={Boolean(errors.phone)}
                            />
                            {errors.phone && <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>}
                          </Form.Group>
                        </Col>
                      );
                    }
                    if (field.id === "email") {
                      return (
                        <Col xs={12} key="email">
                          <Form.Group>
                            <Form.Label className="fw-semibold small">{field.label} {field.required && "*"}</Form.Label>
                            <Form.Control
                              type="email"
                              required={field.required}
                              value={clientForm.email}
                              onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                              placeholder={field.placeholder || "juan.perez@email.com"}
                              className="rounded-xl border-gray-200 py-2.5"
                              isInvalid={Boolean(errors.email)}
                            />
                            {errors.email && <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>}
                          </Form.Group>
                        </Col>
                      );
                    }
                    if (field.id === "notes") {
                      return (
                        <Col xs={12} key="notes">
                          <Form.Group>
                            <Form.Label className="fw-semibold small">{field.label} {field.required && "*"}</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              required={field.required}
                              value={clientForm.notes}
                              onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                              placeholder={field.placeholder || "Ej: Alergia a tinturas"}
                              className="rounded-xl border-gray-200 py-2"
                              isInvalid={Boolean(errors.notes)}
                            />
                            {errors.notes && <Form.Control.Feedback type="invalid">{errors.notes}</Form.Control.Feedback>}
                          </Form.Group>
                        </Col>
                      );
                    }
                    return null;
                  })}
                </Row>

                {selServices.length > 0 && (
                  <div className="p-3 bg-light rounded-3 small mt-2">
                    <div className="fw-bold mb-1">{isEs ? "Resumen de la Cita:" : "Appointment Summary:"}</div>
                    <div className="text-muted">
                      {isEs ? "Servicios:" : "Services:"} <strong>{selServices.map(s => s.name).join(" + ")}</strong><br />
                      {isEs ? "Profesional:" : "Professional:"} <strong>{selProfessional ? `${selProfessional.firstName} ${selProfessional.lastName}` : (isEs ? "Cualquier miembro" : "Any member")}</strong><br />
                      {isEs ? "Total a Abonar:" : "Total Price:"} <strong>{currency(selServices.reduce((sum, s) => sum + s.price, 0))}</strong> ({selServices.reduce((sum, s) => sum + s.duration, 0)} min)<br />
                      {selDate && selTime && (
                        <>
                          {isEs ? "Horario:" : "Time:"} <strong className="text-success">{selDate} a las {selTime} hs</strong>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  <Button variant="outline-secondary" onClick={handleBackStep} className="rounded-pill px-4">
                    {t("form.back")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-pill px-4 btn-premium border-0 text-white fw-bold"
                    style={{ background: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-1" />
                        {isEs ? "Confirmando..." : "Confirming..."}
                      </>
                    ) : business?.bookingDownpaymentEnabled ? (
                      `${isEs ? "Proceder al Pago de Seña:" : "Proceed to Downpayment:"} ${currency(getDownpaymentAmount())}`
                    ) : (
                      isEs ? "Confirmar Reserva" : "Confirm Booking"
                    )}
                  </Button>
                </div>
              </Form>
            )}

            {/* PASO 5: PAGO DE SEÑA */}
            {step === 5 && (
              <div className="animate-fade-in">
                <h2 className="h5 fw-black text-gray-900 mb-1">{isEs ? "Abonar Pago de Seña Obligatoria" : "Pay Mandatory Downpayment"}</h2>
                <p className="text-muted smaller mb-4">{isEs ? "El establecimiento exige una seña previa para confirmar de manera efectiva tu turno." : "The establishment requires a pre-payment to effectively confirm your slot."}</p>

                <div className="p-3.5 border rounded-2xl bg-light bg-opacity-40 mb-4">
                  <div className="d-flex justify-content-between align-items-center pb-2 border-bottom mb-2">
                    <span className="smaller text-muted">{isEs ? `Total de Servicios (${selServices.length})` : `Total Services (${selServices.length})`}</span>
                    <strong className="text-gray-900">{currency(selServices.reduce((sum, s) => sum + s.price, 0))}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1">
                    <div>
                      <span className="smaller text-success d-block fw-bold">{isEs ? "Monto de Seña Requerido" : "Required Downpayment Amount"}</span>
                      <span className="smaller text-muted" style={{ fontSize: "10.5px" }}>{isEs ? "* Se cobra en línea ahora" : "* Charged online now"}</span>
                    </div>
                    <strong className="text-success h4 mb-0">{currency(getDownpaymentAmount())}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                    <span className="smaller text-muted">{isEs ? "Saldo restante en Salón" : "Remaining Balance at Salon"}</span>
                    <strong className="text-muted small">{currency(selServices.reduce((sum, s) => sum + s.price, 0) - getDownpaymentAmount())}</strong>
                  </div>
                  <div className="text-muted smaller mt-3" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                    {isEs 
                      ? "* Los pagos son procesados de forma 100% segura y encriptada. El monto abonado se descontará del precio final en el local."
                      : "* Payments are processed 100% securely. The amount paid will be discounted from the final bill."}
                  </div>
                </div>

                <div className="d-flex gap-2.5 mb-4">
                  <Button 
                    variant={paymentMethod === "mercadopago" ? "primary" : "outline-secondary"}
                    className="flex-fill rounded-xl py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 border-0"
                    onClick={() => setPaymentMethod("mercadopago")}
                    style={paymentMethod === "mercadopago" ? { background: "#00b1ea" } : { background: "#e2e8f0", color: "#475569" }}
                  >
                    <span>Mercado Pago</span>
                  </Button>
                  <Button 
                    variant={paymentMethod === "card" ? "dark" : "outline-secondary"}
                    className="flex-fill rounded-xl py-2.5 fw-bold"
                    onClick={() => setPaymentMethod("card")}
                    style={paymentMethod === "card" ? { background: "#1e293b", border: "0" } : { background: "#e2e8f0", color: "#475569", border: "0" }}
                  >
                    {isEs ? "Tarjeta de Crédito" : "Credit Card"}
                  </Button>
                </div>

                {paymentMethod === "mercadopago" ? (
                  <div className="text-center py-4 border rounded-2xl bg-white p-3.5 shadow-sm d-flex flex-column align-items-center gap-3">
                    <img 
                      src="https://img.icons8.com/color/96/000000/mercado-pago.png" 
                      alt="Mercado Pago" 
                      style={{ height: "46px", objectFit: "contain" }} 
                    />
                    <div>
                      <div className="fw-bold small text-gray-800 mb-1">{isEs ? "Aboná de forma segura con Mercado Pago" : "Pay securely with Mercado Pago"}</div>
                      <p className="text-muted smaller mb-0 max-w-sm mx-auto" style={{ fontSize: "11.5px" }}>
                        {isEs 
                          ? "Podés pagar usando tu saldo en cuenta de Mercado Pago, transferencias DEBIN inmediatas, o tarjetas de crédito/débito locales."
                          : "You can pay using Mercado Pago account balance, bank transfers, or local cards."}
                      </p>
                    </div>
                    <Button 
                      onClick={handleLaunchMpCheckout}
                      className="w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm border-0 btn-premium mt-2"
                      style={{ background: "#00b1ea", fontSize: "14.5px" }}
                    >
                      {isEs ? "Pagar con Mercado Pago:" : "Pay with Mercado Pago:"} {currency(getDownpaymentAmount())}
                    </Button>
                  </div>
                ) : (
                  <Form onSubmit={(e) => { e.preventDefault(); handlePaymentAndBook(); }} className="d-grid gap-3">
                    
                    <div 
                      className="p-4 rounded-4 text-white shadow-lg d-flex flex-column justify-content-between mb-2 overflow-hidden position-relative animate-fade-in"
                      style={{
                        minHeight: "165px",
                        background: `linear-gradient(135deg, ${primaryColor}, #1f2937)`,
                        fontFamily: "'Courier New', Courier, monospace",
                        borderRadius: "16px"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="small fw-semibold letter-spacing-1" style={{ fontSize: "10px" }}>SECURE CHECKOUT</div>
                        <div className="fw-bold" style={{ fontSize: "18px" }}>
                          {getCardBrand(cardForm.number)}
                        </div>
                      </div>
                      <div className="h5 my-3 text-center tracking-widest" style={{ letterSpacing: "2.5px", fontSize: "18px" }}>
                        {cardForm.number ? cardForm.number.replace(/(.{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                      </div>
                      <div className="d-flex justify-content-between align-items-center small">
                        <div>
                          <div className="text-muted" style={{ fontSize: "8px" }}>TITULAR</div>
                          <div className="fw-bold text-uppercase" style={{ fontSize: "12px" }}>{cardForm.name || "NOMBRE COMPLETO"}</div>
                        </div>
                        <div className="text-end">
                          <div className="text-muted" style={{ fontSize: "8px" }}>VENCE</div>
                          <div className="fw-bold" style={{ fontSize: "12px" }}>{cardForm.expiry || "MM/YY"}</div>
                        </div>
                      </div>
                    </div>

                    <Form.Group>
                      <Form.Label className="fw-semibold small">{isEs ? "Número de la Tarjeta" : "Card Number"}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="4517 8492 0012 3456"
                        maxLength={19}
                        value={cardForm.number}
                        required
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCardForm(p => ({ ...p, number: val }));
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </Form.Group>

                    <Row className="g-2">
                      <Col xs={8}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">{isEs ? "Nombre del Titular" : "Cardholder Name"}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Juan Pérez"
                            value={cardForm.name}
                            required
                            onChange={(e) => setCardForm(p => ({ ...p, name: e.target.value }))}
                            className="rounded-xl border-gray-200"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">{isEs ? "Vencimiento" : "Expiry"}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardForm.expiry}
                            required
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length === 2 && !val.includes("/")) val += "/";
                              setCardForm(p => ({ ...p, expiry: val }));
                            }}
                            className="rounded-xl border-gray-200"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group>
                      <Form.Label className="fw-semibold small">{isEs ? "Código de Seguridad (CVV)" : "Security Code (CVV)"}</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="•••"
                        maxLength={3}
                        value={cardForm.cvv}
                        required
                        onChange={(e) => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "") }))}
                        style={{ width: "100px" }}
                        className="rounded-xl border-gray-200"
                      />
                    </Form.Group>

                    <Button 
                      type="submit"
                      disabled={paying}
                      className="w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm mt-2 border-0 btn-premium"
                      style={{ background: primaryColor }}
                    >
                      {paying ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-1" />
                          {isEs ? "Procesando Pago..." : "Processing..."}
                        </>
                      ) : (
                        `${isEs ? "Pagar Seña:" : "Pay Downpayment:"} ${currency(getDownpaymentAmount())}`
                      )}
                    </Button>
                  </Form>
                )}

                <div className="d-flex justify-content-start mt-4 pt-3 border-top">
                  <Button variant="outline-secondary" onClick={() => setStep(4)} className="rounded-pill px-4">
                    {t("form.back")}
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* === SUPER SIMULADOR DE CHECKOUT DE MERCADO PAGO === */}
      {showMpCheckout && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-white"
          style={{ 
            zIndex: 9999, 
            overflowY: "auto", 
            backgroundColor: "#f4f5f7",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          }}
        >
          {/* Header Oficial Azul */}
          <header className="d-flex justify-content-between align-items-center px-4 py-3 text-white border-bottom shadow-sm" style={{ background: "#009ee3" }}>
            <div className="d-flex align-items-center gap-2.5">
              <span className="fw-black tracking-tighter fs-5 d-flex align-items-center">
                <span className="opacity-90">mercado</span>
                <span className="fw-bold text-white ms-0.5">pago</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white bg-opacity-20 text-white font-bold" style={{ fontSize: "9px", fontWeight: 700 }}>CHECKOUT PRO</span>
            </div>
            
            <div className="text-end">
              <span className="smaller opacity-80 d-block" translate="no" style={{ fontSize: "10.5px" }}>{isEs ? `Abonarás a ${business?.name || "Establecimiento"}` : `You will pay ${business?.name || "Establishment"}`}</span>
              <strong className="fs-5">{currency(getDownpaymentAmount())}</strong>
            </div>
          </header>

          {/* Secure lock indicator */}
          <div className="bg-light py-2 text-center text-muted small border-bottom d-flex align-items-center justify-content-center gap-1.5" style={{ fontSize: "11px" }}>
            <Lock size={12} className="text-success" />
            <span>{isEs ? "Conexión encriptada SSL de 256 bits • Compra 100% Protegida" : "Encrypted 256-bit SSL connection • 100% Protected Purchase"}</span>
          </div>

          <Container className="py-4 py-md-5" style={{ maxWidth: "800px" }}>
            
            {/* Step Selection screen */}
            {mpStep === "select_method" && (
              <div className="animate-fade-in">
                <h3 className="h5 fw-bold text-gray-800 mb-4 px-1">{isEs ? "¿Cómo querés pagar?" : "How would you like to pay?"}</h3>
                
                <Row className="g-3">
                  <Col md={8}>
                    <div className="d-flex flex-column gap-3">
                      {/* Opción 1: Dinero en Cuenta */}
                      <div 
                        onClick={() => setMpStep("account_login")}
                        className="p-3 bg-white border rounded-3 cursor-pointer hover-mp-card d-flex align-items-center justify-content-between transition-all"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2 bg-light bg-opacity-70 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                            <span className="fw-black text-info" style={{ fontSize: "13px" }}>MP</span>
                          </div>
                          <div>
                            <strong className="text-gray-800 d-block small">{isEs ? "Dinero en mi cuenta de Mercado Pago" : "Mercado Pago account balance"}</strong>
                            <span className="smaller text-muted d-block mt-0.5">{isEs ? "Iniciá sesión de forma segura y pagá con tu saldo disponible." : "Log in securely and pay with your available balance."}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                      </div>

                      {/* Opción 2: Nueva Tarjeta */}
                      <div 
                        onClick={() => setMpStep("card_entry")}
                        className="p-3 bg-white border rounded-3 cursor-pointer hover-mp-card d-flex align-items-center justify-content-between transition-all"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2 bg-light bg-opacity-70 text-purple-600 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <strong className="text-gray-800 d-block small">{isEs ? "Nueva Tarjeta de Crédito o Débito" : "New Credit or Debit Card"}</strong>
                            <span className="smaller text-muted d-block mt-0.5">Visa, Mastercard, American Express, Cabal, Naranja.</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                      </div>

                      {/* Opción 3: DEBIN / Transferencia */}
                      <div 
                        onClick={() => setMpStep("debin_select")}
                        className="p-3 bg-white border rounded-3 cursor-pointer hover-mp-card d-flex align-items-center justify-content-between transition-all"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2 bg-light bg-opacity-70 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                            <Globe size={18} />
                          </div>
                          <div>
                            <strong className="text-gray-800 d-block small">{isEs ? "Transferencia Bancaria (DEBIN inmediato)" : "Bank Transfer (Instant DEBIN)"}</strong>
                            <span className="smaller text-muted d-block mt-0.5">{isEs ? "Acreditación instantánea desde tu homebanking." : "Instant accreditation from your home banking."}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                      </div>

                      {/* Opción 4: Rapipago / Pago Fácil */}
                      <div 
                        onClick={() => setMpStep("cash_receipt")}
                        className="p-3 bg-white border rounded-3 cursor-pointer hover-mp-card d-flex align-items-center justify-content-between transition-all"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2 bg-light bg-opacity-70 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                            <Award size={18} />
                          </div>
                          <div>
                            <strong className="text-gray-800 d-block small">{isEs ? "Efectivo en Puntos de Pago" : "Cash at Payment Points"}</strong>
                            <span className="smaller text-muted d-block mt-0.5">{isEs ? "Generá un cupón de barra para abonar en Rapipago o Pago Fácil." : "Generate a barcode coupon to pay at Rapipago or Pago Fácil."}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-top d-flex gap-2">
                      <Button variant="outline-secondary" className="rounded-xl px-4 font-semibold" onClick={() => setShowMpCheckout(false)}>
                        {isEs ? "Volver al Salón" : "Return to Salon"}
                      </Button>
                    </div>
                  </Col>

                  {/* Detalle resumido lateral en Checkout */}
                  <Col md={4}>
                    <div className="bg-white border rounded-3 p-3 shadow-sm d-grid gap-2">
                      <strong className="text-gray-900 small d-block mb-1 border-bottom pb-1">{isEs ? "Resumen del Turno" : "Appointment Summary"}</strong>
                      <div className="small"><span className="text-muted">{isEs ? "Servicios:" : "Services:"}</span> <strong>{selServices.map(s => s.name).join(", ")}</strong></div>
                      <div className="small"><span className="text-muted">{isEs ? "Profesional:" : "Professional:"}</span> <strong>{selProfessional ? `${selProfessional.firstName}` : (isEs ? "Cualquiera" : "Any")}</strong></div>
                      <div className="small">
                        <span className="text-muted">{isEs ? "Fecha:" : "Date:"}</span>{" "}
                        <strong>
                          {selDate && !isNaN(new Date(selDate + "T00:00:00").getTime())
                            ? new Date(selDate + "T00:00:00").toLocaleDateString(isEs ? "es-AR" : "en-US", { weekday: 'long', day: 'numeric', month: 'long' })
                            : "—"}
                        </strong>
                      </div>
                      <div className="small"><span className="text-muted">{isEs ? "Hora:" : "Time:"}</span> <strong>{selTime} hs</strong></div>
                      <div className="small border-top pt-2 mt-1 d-flex justify-content-between align-items-center text-success">
                        <span>{isEs ? "Monto de Seña" : "Downpayment Amount"}</span>
                        <strong className="fs-6">{currency(getDownpaymentAmount())}</strong>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* MP PASO: LOGIN MP (Dinero en Cuenta) */}
            {mpStep === "account_login" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "420px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4">
                  <div className="text-center mb-4">
                    <span className="fw-black tracking-tighter fs-4 d-inline-flex align-items-center mb-1 text-info">
                      <span>mercado</span>
                      <span className="fw-bold ms-0.5">pago</span>
                    </span>
                    <h4 className="fw-bold h6 text-gray-800">{isEs ? "Iniciá sesión en Mercado Pago" : "Log in to Mercado Pago"}</h4>
                    <p className="text-muted smaller">{isEs ? "Ingresá tu cuenta comercial o personal de cobros." : "Enter your commercial or personal checkout account."}</p>
                  </div>

                  <Form onSubmit={(e) => { e.preventDefault(); setMpStep("otp_entry"); }} className="d-grid gap-3">
                    <Form.Group>
                      <Form.Label className="smaller text-muted fw-bold">{isEs ? "E-mail o Teléfono *" : "E-mail or Phone *"}</Form.Label>
                      <Form.Control
                        type="email"
                        required
                        value={mpEmail}
                        onChange={(e) => setMpEmail(e.target.value)}
                        placeholder="nombre@email.com"
                        className="rounded-xl border-gray-200 py-2"
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label className="smaller text-muted fw-bold">{isEs ? "Contraseña *" : "Password *"}</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showMpPassword ? "text" : "password"}
                          required
                          value={mpPassword}
                          onChange={(e) => setMpPassword(e.target.value)}
                          placeholder={isEs ? "Tu clave secreta" : "Your secret password"}
                          className="rounded-xl border-gray-200 py-2 pe-5"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMpPassword(!showMpPassword)}
                          className="position-absolute border-0 bg-transparent text-secondary"
                          style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                        >
                          {showMpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Form.Group>

                    <Button type="submit" className="w-100 py-2 rounded-xl fw-bold text-white border-0" style={{ background: "#009ee3" }}>
                      {isEs ? "Ingresar" : "Log In"}
                    </Button>
                    
                    <Button variant="link" size="sm" className="text-muted text-decoration-none" onClick={() => setMpStep("select_method")}>
                      {isEs ? "Cambiar método de pago" : "Change payment method"}
                    </Button>
                  </Form>
                </Card>
              </div>
            )}

            {/* MP PASO: SMS OTP (Dinero en Cuenta) */}
            {mpStep === "otp_entry" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "420px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4">
                  <div className="text-center mb-4">
                    <Lock className="text-info animate-bounce mb-2" size={28} />
                    <h4 className="fw-bold h6 text-gray-800">{isEs ? "Verificación de Identidad" : "Identity Verification"}</h4>
                    <p className="text-muted smaller px-2">
                      {isEs 
                        ? "Enviamos un código de seguridad de 6 dígitos vía SMS a tu teléfono terminado en " 
                        : "We sent a 6-digit verification code via SMS to your phone ending in "}
                      <strong>*3824</strong>.
                    </p>
                  </div>

                  <div className="d-flex justify-content-center gap-2.5 mb-4">
                    {mpOtp.map((data, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                        className="text-center fw-bold fs-5 rounded-xl border border-gray-300"
                        style={{ width: "42px", height: "45px", background: "#f8fafc" }}
                      />
                    ))}
                  </div>

                  <div className="text-center small text-muted">
                    {isEs ? "¿No recibiste el código?" : "Didn't receive the code?"} <Button variant="link" className="p-0 smaller font-semibold" style={{ color: "#009ee3" }} onClick={() => setMpOtp(["", "", "", "", "", ""])}>{isEs ? "Reenviar SMS" : "Resend SMS"}</Button>
                  </div>
                  
                  <hr className="my-3.5" />
                  
                  <Button variant="outline-secondary" className="w-100 py-2 rounded-xl" onClick={() => setMpStep("account_login")}>
                    {isEs ? "Atrás" : "Back"}
                  </Button>
                </Card>
              </div>
            )}

            {/* MP PASO: CONFIRMAR SALDO (Dinero en Cuenta) */}
            {mpStep === "balance_confirm" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "450px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4">
                  <div className="border-bottom pb-3 mb-3">
                    <span className="smaller text-muted d-block mb-1">{isEs ? "Monto de la Operación" : "Operation Amount"}</span>
                    <strong className="fs-3 text-gray-900">{currency(getDownpaymentAmount())}</strong>
                  </div>

                  <div className="p-3 bg-light bg-opacity-70 rounded-3 border d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <strong className="d-block small text-gray-800">{isEs ? "Saldo en Cuenta Mercado Pago" : "Mercado Pago Account Balance"}</strong>
                      <span className="smaller text-muted">{isEs ? "Disponible inmediato" : "Available immediately"}</span>
                    </div>
                    <div className="text-end">
                      <strong className="text-success d-block small">$34,500.00</strong>
                      <span className="smaller text-muted" style={{ fontSize: "10px" }}>{isEs ? "Pesos Argentinos" : "Argentine Pesos"}</span>
                    </div>
                  </div>

                  <Alert variant="info" className="rounded-xl border-0 shadow-sm small py-2.5 mb-4">
                    {isEs 
                      ? "✓ Al presionar Confirmar Pago, el importe de la seña se debitará de forma instantánea de tu cuenta." 
                      : "✓ By pressing Confirm Payment, the downpayment amount will be immediately debited from your account."}
                  </Alert>

                  <div className="d-grid gap-2.5">
                    <Button 
                      onClick={handleMpConfirmPayment}
                      className="w-100 py-2.5 rounded-xl fw-bold text-white border-0 shadow-sm" 
                      style={{ background: "#009ee3", fontSize: "14.5px" }}
                    >
                      {isEs ? "Confirmar Pago:" : "Confirm Payment:"} {currency(getDownpaymentAmount())}
                    </Button>
                    <Button variant="outline-secondary" className="w-100 py-2 rounded-xl" onClick={() => setMpStep("select_method")}>
                      {isEs ? "Cambiar medio de pago" : "Change payment method"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* MP PASO: TARJETA DE CRÉDITO DE MERCADO PAGO */}
            {mpStep === "card_entry" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "450px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4">
                  
                  {/* Tarjeta de Crédito 3D Interactiva */}
                  <div 
                    className="p-4 text-white shadow-lg d-flex flex-column justify-content-between mb-4 overflow-hidden position-relative card-mp-graphic"
                    style={{
                      minHeight: "165px",
                      background: isCardFlipped ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #009ee3, #005a9c)",
                      fontFamily: "'Courier New', Courier, monospace",
                      borderRadius: "16px",
                      transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                  >
                    {!isCardFlipped ? (
                      <>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="small fw-semibold letter-spacing-1" style={{ fontSize: "10px" }}>{isEs ? "MERCADO PAGO TARJETA" : "MERCADO PAGO CARD"}</div>
                          <strong className="fs-6 font-bold">{getCardBrand(cardForm.number)}</strong>
                        </div>
                        <div className="h5 my-3 text-center tracking-widest" style={{ letterSpacing: "2.5px", fontSize: "18px" }}>
                          {cardForm.number ? cardForm.number.replace(/(.{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                        </div>
                        <div className="d-flex justify-content-between align-items-center small">
                          <div>
                            <div className="text-muted" style={{ fontSize: "8px" }}>{isEs ? "TITULAR" : "HOLDER"}</div>
                            <div className="fw-bold text-uppercase" style={{ fontSize: "12px" }}>{cardForm.name || (isEs ? "NOMBRE COMPLETO" : "FULL NAME")}</div>
                          </div>
                          <div className="text-end">
                            <div className="text-muted" style={{ fontSize: "8px" }}>{isEs ? "VENCE" : "EXPIRY"}</div>
                            <div className="fw-bold" style={{ fontSize: "12px" }}>{cardForm.expiry || "MM/YY"}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-100 h-100 d-flex flex-column justify-content-between py-2">
                        <div className="bg-dark w-100 position-absolute" style={{ height: "38px", left: 0, top: "20px" }} />
                        <div className="text-end mt-5 pt-3 pe-4">
                          <span className="text-muted d-block mb-1" style={{ fontSize: "8px" }}>CVV</span>
                          <span className="bg-white text-dark px-3 py-1.5 rounded fw-bold font-mono">{cardForm.cvv || "•••"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Form onSubmit={(e) => { e.preventDefault(); handleMpConfirmPayment(); }} className="d-grid gap-3">
                    <Form.Group>
                      <Form.Label className="smaller text-muted fw-bold">{isEs ? "Número de Tarjeta *" : "Card Number *"}</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        maxLength={19}
                        value={cardForm.number}
                        onFocus={() => setIsCardFlipped(false)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCardForm({ ...cardForm, number: val });
                        }}
                        placeholder="0000 0000 0000 0000"
                        className="rounded-xl border-gray-200"
                      />
                    </Form.Group>

                    <Row className="g-2">
                      <Col xs={8}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted fw-bold">{isEs ? "Nombre del Titular *" : "Holder's Name *"}</Form.Label>
                          <Form.Control
                            type="text"
                            required
                            value={cardForm.name}
                            onFocus={() => setIsCardFlipped(false)}
                            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                            placeholder={isEs ? "Ej: Juan Pérez" : "e.g., John Doe"}
                            className="rounded-xl border-gray-200"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted fw-bold">{isEs ? "Vencimiento *" : "Expiry *"}</Form.Label>
                          <Form.Control
                            type="text"
                            required
                            maxLength={5}
                            value={cardForm.expiry}
                            onFocus={() => setIsCardFlipped(false)}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length === 2 && !val.includes("/")) val += "/";
                              setCardForm({ ...cardForm, expiry: val });
                            }}
                            placeholder="MM/YY"
                            className="rounded-xl border-gray-200"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group>
                      <Form.Label className="smaller text-muted fw-bold">{isEs ? "Código de Seguridad (CVV) *" : "Security Code (CVV) *"}</Form.Label>
                      <Form.Control
                        type="password"
                        required
                        maxLength={3}
                        value={cardForm.cvv}
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })}
                        placeholder="123"
                        style={{ width: "100px" }}
                        className="rounded-xl border-gray-200"
                      />
                    </Form.Group>

                    <div className="d-grid gap-2 mt-2">
                      <Button type="submit" className="w-100 py-2.5 rounded-xl fw-bold text-white border-0 shadow-sm" style={{ background: "#009ee3" }}>
                        {isEs ? "Confirmar y Pagar:" : "Confirm & Pay:"} {currency(getDownpaymentAmount())}
                      </Button>
                      <Button variant="outline-secondary" className="w-100 py-2 rounded-xl" onClick={() => setMpStep("select_method")}>
                        {isEs ? "Atrás" : "Back"}
                      </Button>
                    </div>
                  </Form>
                </Card>
              </div>
            )}

            {/* MP PASO: SELECTOR BANCO DEBIN */}
            {mpStep === "debin_select" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "480px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4">
                  <h4 className="fw-bold h6 text-gray-800 mb-3 text-center">{isEs ? "Selecciona tu Banco" : "Select your Bank"}</h4>
                  <p className="text-muted smaller text-center mb-4">{isEs ? "Te redirigiremos a tu portal bancario para autorizar el débito inmediato." : "We will redirect you to your bank portal to authorize the instant debit."}</p>

                  <div className="d-grid gap-2 mb-4" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    {["Banco Galicia", "Banco Santander", "BBVA Argentina", "Banco Macro", "Banco Provincia", "Banco Nación", "Brubank", "Ualá"].map((bank) => (
                      <div
                        key={bank}
                        onClick={() => { setSelectedBank(bank); setMpStep("debin_auth"); }}
                        className="p-3 border rounded-3 cursor-pointer hover-mp-card d-flex align-items-center justify-content-between transition-all"
                      >
                        <strong className="text-gray-800 small">{bank}</strong>
                        <ChevronRight size={15} className="text-muted" />
                      </div>
                    ))}
                  </div>

                  <Button variant="outline-secondary" className="w-100 py-2 rounded-xl" onClick={() => setMpStep("select_method")}>
                    {isEs ? "Atrás" : "Back"}
                  </Button>
                </Card>
              </div>
            )}

            {/* MP PASO: AUTORIZAR DEBIN */}
            {mpStep === "debin_auth" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "420px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4 text-center">
                  <Globe className="text-primary animate-spin mb-3 mx-auto" size={32} style={{ animationDuration: "6s" }} />
                  <strong className="text-gray-900 d-block mb-1">{isEs ? "Autorizando Débito Directo" : "Authorizing Direct Debit"}</strong>
                  <span className="smaller text-muted d-block mb-4">
                    {isEs ? "Conectando con la pasarela segura de " : "Connecting with the secure gateway of "}<strong>{selectedBank}</strong>...
                  </span>

                  <Alert variant="success" className="rounded-xl border-0 shadow-sm small py-2 mb-4">
                    {isEs ? "✓ Credenciales y token bancarios validados con éxito." : "✓ Banking credentials and token successfully validated."}
                  </Alert>

                  <Button 
                    onClick={handleMpConfirmPayment}
                    className="w-100 py-2.5 rounded-xl fw-bold text-white border-0 shadow-sm" 
                    style={{ background: "#009ee3" }}
                  >
                    {isEs ? "Confirmar Transferencia" : "Confirm Transfer"}
                  </Button>
                </Card>
              </div>
            )}

            {/* MP PASO: RAPIPAGO / PAGO FÁCIL CUPÓN */}
            {mpStep === "cash_receipt" && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: "480px" }}>
                <Card className="border bg-white rounded-3 shadow-sm p-4">
                  <div className="text-center mb-3">
                    <Award className="text-warning mb-2 animate-bounce" size={32} />
                    <strong className="text-gray-900 d-block">{isEs ? "Generación de Cupón de Pago" : "Payment Coupon Generation"}</strong>
                    <span className="smaller text-muted">{isEs ? "Aboná en efectivo en cualquier sucursal Rapipago o Pago Fácil." : "Pay in cash at any Rapipago or Pago Fácil branch."}</span>
                  </div>

                  {/* Cupón renderizado */}
                  <div className="p-3 border rounded-3 bg-light bg-opacity-40 d-grid gap-2.5 my-3.5" style={{ borderStyle: "dashed" }}>
                    <div className="d-flex justify-content-between text-muted smaller">
                      <span>{isEs ? "Convenio de Recaudación" : "Collection Agreement"}</span>
                      <strong className="text-dark">MP-RECAUDO-409</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted smaller">
                      <span>{isEs ? "Código de Pago Fácil / Rapipago" : "Pago Fácil / Rapipago Code"}</span>
                      <strong className="text-purple-600 font-mono">104 294 3849 0294</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted smaller border-top pt-2">
                      <span>{isEs ? "Monto de la Seña" : "Downpayment Amount"}</span>
                      <strong className="text-dark fs-6">{currency(getDownpaymentAmount())}</strong>
                    </div>

                    {/* Código de barra visual */}
                    <div className="bg-white border p-3 rounded-3 mt-2 text-center">
                      <div className="font-mono text-muted tracking-widest smaller" style={{ letterSpacing: "3px", fontSize: "11px" }}>
                        ||| | || || ||| || ||| || ||| || ||| || |||
                      </div>
                      <span className="smaller text-muted font-mono d-block mt-1" style={{ fontSize: "10px" }}>Ref: {mpTxId}</span>
                    </div>
                  </div>

                  <Alert variant="warning" className="rounded-xl border-0 shadow-sm small py-2 mb-4">
                    {isEs 
                      ? "⚠️ Tenés 48 horas hábiles para abonar en caja. La cita se agendará como confirmada de forma temporal." 
                      : "⚠️ You have 48 business hours to pay at the checkout. The appointment will be temporarily scheduled as confirmed."}
                  </Alert>

                  <div className="d-grid gap-2">
                    <Button 
                      onClick={handleMpConfirmPayment}
                      className="w-100 py-2.5 rounded-xl fw-bold text-white border-0 shadow-sm" 
                      style={{ background: "#009ee3" }}
                    >
                      {isEs ? "Confirmar y Descargar Cupón" : "Confirm and Download Coupon"}
                    </Button>
                    <Button variant="outline-secondary" className="w-100 py-2 rounded-xl" onClick={() => setMpStep("select_method")}>
                      {isEs ? "Cambiar método de pago" : "Change payment method"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* MP PASO: PROCESANDO CARGA DE SEÑA */}
            {mpStep === "processing" && (
              <div className="animate-fade-in text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-4" style={{ width: "3.5rem", height: "3.5rem", borderWidth: "4px" }} />
                <h4 className="fw-bold text-gray-800">{isEs ? "Procesando tu pago..." : "Processing your payment..."}</h4>
                <p className="text-muted smaller">{isEs ? "Conectando de forma segura con los servidores de Mercado Pago." : "Securely connecting to Mercado Pago servers."}</p>
              </div>
            )}

            {/* MP PASO: CHECK GREEN ANIMADO CON CONFETI */}
            {mpStep === "success" && (
              <div className="animate-fade-in text-center py-5 position-relative overflow-hidden">
                {/* Confeti Particle Simulation */}
                <div className="confetti-holder position-absolute w-100 h-100 top-0 start-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`confetti-particle p-${i%5} color-${i%3}`} 
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 1.5}s`
                      }}
                    />
                  ))}
                </div>

                <div 
                  className="mx-auto rounded-circle d-flex align-items-center justify-content-center text-white shadow-lg animate-elastic" 
                  style={{ 
                    width: "80px", 
                    height: "80px", 
                    backgroundColor: "#00a650",
                    animationDuration: "0.6s"
                  }}
                >
                  <CheckCircle size={44} />
                </div>
                
                <h3 className="fw-black text-gray-900 mt-4 mb-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>{isEs ? "¡Pago Completado!" : "Payment Completed!"}</h3>
                <p className="text-success small fw-bold mb-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>{isEs ? "✓ Operación Exitosa" : "✓ Operation Successful"}</p>
                <div className="p-3 border rounded-3 bg-white shadow-sm inline-block px-4 mb-2 animate-fade-in" style={{ animationDelay: "0.4s", display: "inline-block" }}>
                  <span className="smaller text-muted d-block">{isEs ? "ID de Transacción de Mercado Pago" : "Mercado Pago Transaction ID"}</span>
                  <strong className="font-mono text-gray-800 small">{mpTxId}</strong>
                </div>
              </div>
            )}

          </Container>

          <style>{`
            .hover-mp-card {
              transition: all 0.25s ease;
            }
            .hover-mp-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px -8px rgba(0,0,0,0.1);
              border-color: #009ee3 !important;
            }
            .animate-elastic {
              animation: elastic-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
            }
            @keyframes elastic-in {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.1); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1.0); opacity: 1; }
            }
            .confetti-particle {
              position: absolute;
              width: 8px;
              height: 12px;
              background-color: #fcd34d;
              opacity: 0.8;
              border-radius: 2px;
              animation: confetti-fall 2.5s linear infinite;
            }
            .confetti-particle.color-0 { background-color: #3b82f6; }
            .confetti-particle.color-1 { background-color: #10b981; }
            .confetti-particle.color-2 { background-color: #ec4899; }
            .confetti-particle.p-0 { transform: rotate(15deg); }
            .confetti-particle.p-1 { transform: rotate(-35deg); width: 10px; height: 10px; }
            .confetti-particle.p-2 { transform: rotate(45deg); }
            @keyframes confetti-fall {
              0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(300px) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

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
        .hover-row-focus {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .hover-row-focus:hover {
          background-color: rgba(248, 250, 252, 0.8) !important;
          border-color: #475569 !important;
        }
        .btn-premium {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-premium:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 16px -8px rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </div>
  );
}
