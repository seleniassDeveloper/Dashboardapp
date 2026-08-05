import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Alert } from "react-bootstrap";
import { 
  MessageCircle, Clock, Users, Plus, Check, Clipboard, Trash2, 
  Sparkles, AlertCircle, Phone, Calendar as CalendarIcon, DollarSign, Search
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppointmentsCalendar from "../gadgets/appointments/AppointmentsCalendar";
import AppointmentModal from "../gadgets/appointments/AppointmentModal";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider.jsx";
import CalendarHistoryView from "./booking/CalendarHistoryView";
import api from "../lib/api.js";
import { useIsMobile } from "../hooks/useIsMobile";
import AppointmentsSLA from "../components/appointments/mobile/AppointmentsSLA";
import AgendaSubNav from "../components/appointments/AgendaSubNav";
import AgendaSlaSidePanel from "../components/appointments/AgendaSlaSidePanel";

export default function CalendarView() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return <AppointmentsSLA />;
  }

  const { t } = useTranslation("views");
  const { appointments, services, fetchAppointments, business } = useAppointmentsStore();
  const [workers, setWorkers] = useState([]);
  const [showEmbeddedGoogle, setShowEmbeddedGoogle] = useState(false);

  // Cargar estilistas del backend
  useEffect(() => {
    api.get("/workers")
      .then(res => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(e => console.error(e));
  }, []);

  // Lista de espera reactiva y persistida en localStorage
  const [waitlist, setWaitlist] = useState(() => {
    const saved = localStorage.getItem("aura_waitlist");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, firstName: "Valentina", lastName: "Prieto", phone: "1143210987", serviceId: "", workerId: "", preferenceDate: "2026-06-12", preferenceTime: "10:00", priority: "Alta", status: "Esperando" },
      { id: 2, firstName: "Lucas", lastName: "Marino", phone: "1176549876", serviceId: "", workerId: "", preferenceDate: "2026-06-13", preferenceTime: "15:00", priority: "Media", status: "Esperando" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("aura_waitlist", JSON.stringify(waitlist));
  }, [waitlist]);

  // Formulario nuevo cliente en lista
  const [newWait, setNewWait] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    serviceId: "",
    workerId: "",
    preferenceDate: "",
    preferenceTime: "",
    priority: "Alta",
  });

  // Modal de Agendamiento rápido
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialAddData, setInitialAddData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // --- MAIN VIEW STATE ---
  const [mainView, setMainView] = useState("calendar"); // "calendar" | "waitlist" | "history"

  // --- MOTOR DE RECOMENDACIONES DE AURA AI ---
  const gaps = useMemo(() => {
    if (!workers.length) return [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const list = [];
    const w1 = workers[0];
    if (w1) list.push({
      dateStr: todayStr,
      timeStr: "11:00",
      workerId: w1.id,
      workerName: `${w1.firstName} ${w1.lastName}`,
      label: "Hoy, 11:00 hs"
    });

    const w2 = workers[1] || w1;
    if (w2) list.push({
      dateStr: tomorrowStr,
      timeStr: "15:30",
      workerId: w2.id,
      workerName: `${w2.firstName} ${w2.lastName}`,
      label: "Mañana, 15:30 hs"
    });

    return list;
  }, [workers]);

  const auraSuggestion = useMemo(() => {
    const safeWaitlist = Array.isArray(waitlist) ? waitlist : [];
    const safeServices = Array.isArray(services) ? services : [];
    const waitingClient = safeWaitlist.find(c => c.status === "Esperando");
    const activeGap = gaps[0];

    if (waitingClient && activeGap) {
      const svc = safeServices.find(s => s.id === waitingClient.serviceId) || { name: waitingClient.service || "Estética" };
      return {
        client: waitingClient,
        gap: activeGap,
        serviceName: svc.name,
        message: `✨ Aura AI: Hay un hueco libre hoy a las 11:00 hs con ${activeGap.workerName} ideal para ${waitingClient.firstName} ${waitingClient.lastName} (${svc.name}).`
      };
    }
    return null;
  }, [waitlist, gaps, services]);

  const handleAddToWaitlist = (e) => {
    e.preventDefault();
    if (!newWait.firstName || !newWait.lastName) return;

    const newItem = {
      ...newWait,
      id: Date.now(),
      status: "Esperando"
    };

    setWaitlist(prev => [...prev, newItem]);
    setNewWait({
      firstName: "",
      lastName: "",
      phone: "",
      serviceId: "",
      workerId: "",
      preferenceDate: "",
      preferenceTime: "",
      priority: "Alta",
    });
  };

  const handleMarkContacted = (id) => {
    setWaitlist(prev => 
      prev.map(c => c.id === id ? { ...c, status: "Contactado" } : c)
    );
  };

  const handleRemoveFromWaitlist = (id) => {
    setWaitlist(prev => prev.filter(c => c.id !== id));
  };

  const handleBookWaitlist = (client, dateStr, timeStr, workerId) => {
    const targetDate = dateStr || client.preferenceDate || new Date().toISOString().slice(0, 10);
    const targetTime = timeStr || client.preferenceTime || "11:00";
    const targetWorker = workerId || client.workerId || (workers[0]?.id || "");
    const startsAt = `${targetDate}T${targetTime}`;

    setInitialAddData({
      clientFirstName: client.firstName || "",
      clientLastName: client.lastName || "",
      phone: client.phone || "",
      serviceId: client.serviceId || "",
      workerId: targetWorker,
      startsAt: startsAt
    });
    setShowAddModal(true);
  };

  const handleModalSaved = () => {
    setShowAddModal(false);
    fetchAppointments();
    if (auraSuggestion) {
      setWaitlist(prev => 
        prev.map(c => c.id === auraSuggestion.client.id ? { ...c, status: "Reagendado" } : c)
      );
    }
  };

  const handleSendWhatsAppNotification = (client, gap) => {
    const svc = services.find(s => s.id === client.serviceId) || { name: client.service || "Estética" };
    const dateStr = gap 
      ? new Date(gap.dateStr).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
      : (client.preferenceDate ? new Date(`${client.preferenceDate}T12:00:00`).toLocaleDateString("es-AR") : "el día de tu preferencia");
    
    const timeStr = gap ? gap.timeStr : (client.preferenceTime || "");
    const workerName = gap ? gap.workerName : (workers.find(w => w.id === client.workerId)?.firstName || "Profesional");

    const text = `¡Hola ${client.firstName}! Se liberó un turno ideal en Aura Studio para realizarte ${svc.name} el ${dateStr} a las ${timeStr} hs con ${workerName}. ¿Te gustaría reservarlo?`;
    window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(text)}`, "_blank");

    setWaitlist(prev => 
      prev.map(c => c.id === client.id ? { ...c, status: "Contactado" } : c)
    );
  };

  return (
    <Container fluid className="p-0 pb-4">
      {/* Header Unificado de Agenda */}
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-black h3 text-dark mb-1" style={{ letterSpacing: "-0.02em" }}>Agenda</h1>
          <p className="text-muted mb-0 small">Gestiona tus citas, horarios y optimiza el tiempo de tu equipo.</p>
        </div>

        {/* Tabs Principales de Navegación de la Agenda */}
        <div className="d-flex bg-light p-1 rounded-pill border shadow-xs">
          <Button
            size="sm"
            variant="link"
            className={`rounded-pill px-4 py-1.5 fw-bold text-decoration-none transition-all ${
              mainView === "calendar" ? "bg-white text-purple-700 shadow-xs border" : "text-muted"
            }`}
            style={{
              color: mainView === "calendar" ? "#7c3aed" : "#6b7280",
              borderColor: mainView === "calendar" ? "#e9d5ff" : "transparent"
            }}
            onClick={() => setMainView("calendar")}
          >
            <CalendarIcon size={14} className="me-1.5 d-inline-block" style={{ marginTop: "-2px" }} />
            Calendario
          </Button>
          <Button
            size="sm"
            variant="link"
            className={`rounded-pill px-4 py-1.5 fw-bold text-decoration-none transition-all ${
              mainView === "history" ? "bg-white text-purple-700 shadow-xs border" : "text-muted"
            }`}
            style={{
              color: mainView === "history" ? "#7c3aed" : "#6b7280",
              borderColor: mainView === "history" ? "#e9d5ff" : "transparent"
            }}
            onClick={() => setMainView("history")}
          >
            <Clipboard size={14} className="me-1.5 d-inline-block" style={{ marginTop: "-2px" }} />
            Historial Avanzado
          </Button>
          <Button
            size="sm"
            variant="link"
            className="rounded-pill px-4 py-1.5 text-decoration-none fw-bold text-muted transition-all"
            onClick={() => navigate("/app/sla-today")}
          >
            <Clock size={14} className="me-1.5 d-inline-block" style={{ marginTop: "-2px" }} />
            Timeline SLA
          </Button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="primary"
            className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm border-0"
            style={{ backgroundColor: "#7c3aed" }}
            onClick={() => {
              setInitialAddData(null);
              setShowAddModal(true);
            }}
          >
            <Plus size={16} />
            <span>{t("calendar.newAppointment") || "Nueva Cita"}</span>
          </Button>
        </div>
      </header>

      {mainView === "calendar" ? (
        <Row className="g-4">
          {/* Grilla central de Agenda */}
          <Col lg={8}>
            <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm" style={{ minHeight: "calc(100vh - 200px)" }}>
              {showEmbeddedGoogle && business?.googleCalendarId ? (
                <div className="w-100 h-100" style={{ minHeight: "calc(100vh - 200px)" }}>
                  <iframe 
                    src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(business.googleCalendarId)}&ctz=America%2FArgentina%2FBuenos_Aires`}
                    style={{ border: 0, width: "100%", height: "calc(100vh - 200px)", minHeight: "560px" }}
                    frameBorder="0" 
                    scrolling="no"
                    title="Google Calendar Embebido"
                  />
                </div>
              ) : (
                <AppointmentsCalendar />
              )}
            </div>
          </Col>

          {/* Panel Lateral Unificado de SLA y Operativa */}
          <Col lg={4}>
            <AgendaSlaSidePanel 
              onOpenAlerts={() => navigate("/app/sla-today")}
              onOpenSuggestions={() => {
                if (auraSuggestion) {
                  handleBookWaitlist(auraSuggestion.client, auraSuggestion.gap.dateStr, auraSuggestion.gap.timeStr, auraSuggestion.gap.workerId);
                } else {
                  alert("Buscando los mejores huecos libres...");
                }
              }}
            />
          </Col>
        </Row>
      ) : (
        <CalendarHistoryView />
      )}

      {/* Modal para agregar/editar citas */}
      {showAddModal && (
        <AppointmentModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          initialData={initialAddData}
          onSaved={handleModalSaved}
        />
      )}
    </Container>
  );
}

