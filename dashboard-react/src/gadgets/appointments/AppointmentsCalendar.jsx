import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Card,
  Modal,
  Button,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
  Form,
} from "react-bootstrap";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { useBrand } from "../../header/name/BrandProvider";
import { useAppointmentsStore } from "./AppointmentsProvider.jsx";
import AppointmentModal from "./AppointmentModal.jsx";
import Agenda from "./agenda/Agenda";
import AgendaSummary from "./agenda/AgendaSummary";
import AgendaSummaryDetailModal from "./agenda/AgendaSummaryDetailModal";
import FinalizeServiceModal from "../../components/clients/FinalizeServiceModal.jsx";
import axiosApi from "../../lib/api.js";
import { User, Calendar } from "lucide-react";

import "./styles/fullcalendar-fix.css";

// ---------- helpers ----------
function addMinutes(dateLike, minutes) {
  const d = new Date(dateLike);
  return new Date(d.getTime() + (Number(minutes) || 0) * 60000);
}

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function statusLabel(status) {
  const map = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    DONE: "Finalizada",
  };
  return map[status] || status || "—";
}

function statusVariant(status) {
  if (status === "CONFIRMED") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "DONE") return "secondary";
  return "warning";
}

function withAlpha(hex, alpha = 1) {
  const h = String(hex || "")
    .replace("#", "")
    .trim();
  if (h.length !== 6) return `rgba(60,60,60,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatCustomSpanishTitle = (viewType, start, end) => {
  if (!start) return "";
  
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const weekdays = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ];

  if (viewType === "timeGridDay") {
    const dayName = weekdays[start.getDay()];
    const dayNum = start.getDate();
    const monthName = months[start.getMonth()];
    const year = start.getFullYear();
    return `${dayName}, ${dayNum} de ${monthName} de ${year}`;
  } else if (viewType === "timeGridWeek") {
    const endAdjusted = new Date(end.getTime() - 12 * 60 * 60 * 1000);
    const startDay = start.getDate();
    const endDay = endAdjusted.getDate();
    const startMonth = months[start.getMonth()];
    const endMonth = months[endAdjusted.getMonth()];
    const startYear = start.getFullYear();
    const endYear = endAdjusted.getFullYear();

    if (startMonth === endMonth) {
      return `Semana del ${startDay} al ${endDay} de ${startMonth} de ${startYear}`;
    } else {
      return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${endYear}`;
    }
  } else {
    const monthName = months[start.getMonth()];
    const year = start.getFullYear();
    return `${monthName} de ${year}`;
  }
};

export default function AppointmentsCalendar() {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#d32f2f";

  const { appointments, services, loading, error, fetchAppointments, upsertAppointment, appointmentStatuses } = useAppointmentsStore();

  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    axiosApi.get("/workers")
      .then(res => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(e => console.error("Error loading workers", e));
  }, []);

  // console.log("appointments", appointments);

  const calRef = useRef(null);

  // ✅ controla vista + título arriba (sin depender del toolbar de FullCalendar)
  const [view, setView] = useState("dayGridMonth"); // "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Modal para agregar cita
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialAddData, setInitialAddData] = useState(null);

  const [summaryDetail, setSummaryDetail] = useState(null);

  // Modal para finalizar servicio (CRM)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizingAppt, setFinalizingAppt] = useState(null);

  // Modal de advertencia de datos de contacto faltantes
  const [contactWarning, setContactWarning] = useState({
    show: false,
    type: "email", // "email" | "phone"
    appointment: null,
    value: "",
    saving: false,
    error: ""
  });


  const appointmentsByWorker = useMemo(() => {
    const map = {};
    workers.forEach(w => { map[w.id] = []; });
    (appointments || []).forEach(appt => {
      if (map[appt.workerId]) {
        map[appt.workerId].push(appt);
      }
    });
    return map;
  }, [workers, appointments]);

  const handleEditAppointment = (appt) => {
    setSelected(appt);
    setShowDetail(true);
    setSummaryDetail(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;

    if (newStatus === "DONE") {
      setShowDetail(false);
      setFinalizingAppt(selected);
      setShowFinalizeModal(true);
      return;
    }

    try {
      const payload = {
        clientId: selected.clientId || selected.client?.id,
        workerId: selected.workerId || selected.worker?.id,
        serviceId: selected.serviceId || selected.service?.id,
        startsAt: selected.startsAt,
        notes: selected.notes ?? null,
        status: newStatus,
      };

      const res = await axiosApi.put(`/appointments/${selected.id}`, payload);
      upsertAppointment(res.data);
      setSelected(res.data);
      fetchAppointments();
    } catch (e) {
      console.error("Error updating status:", e);
      alert("No se pudo actualizar el estado de la cita.");
    }
  };

  const handleFinalizeCompleted = (updatedAppt) => {
    upsertAppointment(updatedAppt);
    fetchAppointments();
    setFinalizingAppt(null);
  };

  const handleSendWhatsApp = (appt) => {
    const clientPhone = appt.client?.phone || appt.phone;
    if (!clientPhone || !clientPhone.trim()) {
      setContactWarning({
        show: true,
        type: "phone",
        appointment: appt,
        value: "",
        saving: false,
        error: ""
      });
      return;
    }
    const worker = workers.find(w => w.id === appt.workerId);
    const startsDate = appt?.startsAt ? new Date(appt.startsAt) : null;
    const validStarts = startsDate && !isNaN(startsDate.getTime());
    const dateStr = validStarts ? startsDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : "—";
    const timeStr = validStarts ? startsDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "—";
    const text = `¡Hola ${appt.client?.firstName || "Cliente"}! Te confirmamos tu turno en Aura Studio para el día ${dateStr} a las ${timeStr} hs para el servicio de ${appt.service?.name || "Estética"}. Te atenderá ${worker?.firstName || "Profesional"}. ¡Te esperamos!`;
    window.open(`https://wa.me/${clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSendEmail = async (appt) => {
    const clientEmail = appt.client?.email || appt.email;
    if (!clientEmail || !clientEmail.trim()) {
      setContactWarning({
        show: true,
        type: "email",
        appointment: appt,
        value: "",
        saving: false,
        error: ""
      });
      return;
    }

    const googleAccessToken = localStorage.getItem("google_oauth_access_token");
    if (!googleAccessToken) {
      alert("Error: Tu sesión de Google no está activa. Iniciá sesión con Google para enviar correos.");
      return;
    }

    try {
      const startsDate = appt?.startsAt ? new Date(appt.startsAt) : null;
      if (!startsDate || isNaN(startsDate.getTime())) {
        alert("La fecha de la cita no es válida.");
        return;
      }
      const dateStr = startsDate.toLocaleDateString("es-AR");
      const timeStr = startsDate.toLocaleTimeString("es-AR", {hour: '2-digit', minute: '2-digit'});
      const payload = {
        appointmentId: appt.id,
        to: clientEmail.trim(),
        subject: `Confirmación de Turno - Aura Studio`,
        message: `Hola ${appt.client.firstName || "Cliente"},\n\nTe confirmamos tu turno para el día ${dateStr} a las ${timeStr} hs para realizarte: ${appt.service?.name || "Estética"}.\n¡Muchas gracias por elegirnos!\n\nDirección del Local: Av. Principal 1234, Aura Studio.`
      };

      await axiosApi.post(`/google/send-confirmation-email`, payload, {
        headers: {
          "X-Google-Access-Token": googleAccessToken
        }
      });
      alert("Email de confirmación enviado exitosamente con Gmail.");
    } catch (err) {
      alert(`Error al enviar: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSaveContactAndSend = async () => {
    const { type, appointment, value } = contactWarning;
    if (!value || !value.trim()) {
      setContactWarning(prev => ({ ...prev, error: "Este campo es obligatorio." }));
      return;
    }
    
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setContactWarning(prev => ({ ...prev, error: "El email no tiene un formato válido." }));
      return;
    }
    if (type === "phone") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length < 7 || cleaned.length > 15) {
        setContactWarning(prev => ({ ...prev, error: "El teléfono debe tener entre 7 y 15 dígitos." }));
        return;
      }
    }

    setContactWarning(prev => ({ ...prev, saving: true, error: "" }));
    try {
      const clientId = appointment.clientId || appointment.client?.id;
      if (!clientId) {
        throw new Error("No se pudo identificar al cliente.");
      }
      
      const patch = type === "email" ? { email: value.trim() } : { phone: value.trim() };
      const clientFirstName = appointment.client?.firstName || "Cliente";
      const clientLastName = appointment.client?.lastName || "Aura";
      
      await axiosApi.put(`/clients/${clientId}`, {
        firstName: clientFirstName,
        lastName: clientLastName,
        ...patch
      });

      const updatedAppt = {
        ...appointment,
        client: {
          ...(appointment.client || {}),
          ...patch
        }
      };

      upsertAppointment(updatedAppt);
      fetchAppointments();

      // Close modal
      setContactWarning({ show: false, type: "email", appointment: null, value: "", saving: false, error: "" });

      if (type === "email") {
        await handleSendEmail(updatedAppt);
      } else {
        handleSendWhatsApp(updatedAppt);
      }
    } catch (err) {
      console.error(err);
      setContactWarning(prev => ({ 
        ...prev, 
        saving: false, 
        error: err.response?.data?.error || err.message || "Error al actualizar los datos." 
      }));
    }
  };


  const handleMarkSenaPaid = async (appt) => {
    try {
      const price = Number(appt.service?.price || 0);
      const senaAmount = Math.round(price * 0.3); // 30% de seña
      
      const payload = {
        clientId: appt.clientId || appt.client?.id,
        serviceId: appt.serviceId || appt.service?.id,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: appt.status || "PENDING",
        senaStatus: "PAGADA",
        señaAmount: senaAmount
      };

      const res = await axiosApi.put(`/appointments/${appt.id}`, payload);
      
      // Actualizar en el almacén
      upsertAppointment({
        ...appt,
        ...res.data,
        senaStatus: "PAGADA",
        señaAmount: senaAmount
      });

      alert("¡Seña registrada con éxito! Se cobró un anticipo del 30%.");
      
      // Recargar para sincronizar
      fetchAppointments();
      setSummaryDetail(null); // cerrar modal detalle
    } catch (e) {
      console.error(e);
      alert("Error al registrar seña: " + (e?.response?.data?.error || e.message));
    }
  };

  const events = useMemo(() => {
    return (appointments || [])
      .filter((a) => {
        if (!a?.startsAt) return false;
        const d = new Date(a.startsAt);
        return !isNaN(d.getTime());
      })
      .map((a) => {
        const start = a.startsAt;
        const minutes = Number(a?.service?.duration) || 60;
        const end = addMinutes(start, minutes);

        const clientName =
          [a?.client?.firstName, a?.client?.lastName]
            .filter(Boolean)
            .join(" ") || "Cliente";

        const title = `${clientName} · ${a?.service?.name || "Servicio"}`;
        const statusObj = appointmentStatuses.find(s => s.key === a?.status);
        const color = statusObj?.color || accent;
        const bg = withAlpha(color, 0.20);
        const border = withAlpha(color, 0.85);

        return {
          id: String(a.id),
          title,
          start,
          end,
          backgroundColor: bg,
          borderColor: border,
          textColor: "#1f1f1f",
          extendedProps: { appt: a },
        };
      });
  }, [appointments, accent]);

  const onEventClick = useCallback((info) => {
    const appt = info?.event?.extendedProps?.appt;
    if (!appt) return;
    setSelected(appt);
    setShowDetail(true);
  }, []);

  const onDateClick = useCallback((info) => {
    setInitialAddData({ startsAt: info.dateStr });
    setShowAddModal(true);
  }, []);

  // ✅ helpers para controlar FullCalendar desde el header
  const api = () => calRef.current?.getApi();

  const goPrev = () => api()?.prev();
  const goNext = () => api()?.next();
  const goToday = () => api()?.today();

  const changeView = (nextView) => {
    setView(nextView);
    api()?.changeView(nextView);
  };

  return (
    <>
      <Card className="shadow-sm brand-card">
        <Card.Body>
          {/* ✅ HEADER PRO (Bootstrap) */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="brand-title">Calendario</div>

              <div className="d-flex align-items-center gap-2">
                <Button variant="outline-secondary" size="sm" onClick={goPrev}>
                  ‹
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={goNext}>
                  ›
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={goToday}>
                  Hoy
                </Button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="fw-semibold" style={{ fontSize: 18 }}>
                {title}
              </div>

              <ButtonGroup>
                <Button
                  size="sm"
                  variant={view === "dayGridMonth" ? "dark" : "outline-dark"}
                  onClick={() => changeView("dayGridMonth")}
                >
                  Mes
                </Button>
                <Button
                  size="sm"
                  variant={view === "timeGridWeek" ? "dark" : "outline-dark"}
                  onClick={() => changeView("timeGridWeek")}
                >
                  Semana
                </Button>
                <Button
                  size="sm"
                  variant={view === "timeGridDay" ? "dark" : "outline-dark"}
                  onClick={() => changeView("timeGridDay")}
                >
                  Día
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* KPIs Header Permanente */}
          <div className="mb-4">
            <AgendaSummary
              appointments={appointments}
              workers={workers}
              appointmentsByWorker={appointmentsByWorker}
              onSelectSummary={setSummaryDetail}
            />
          </div>

          {loading ? (
            <div
              className="d-flex align-items-center gap-2 text-muted"
              style={{ height: 560 }}
            >
              <Spinner size="sm" /> Cargando calendario...
            </div>
          ) : error ? (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          ) : (
            <>
              {view === "timeGridDay" && (
                <Agenda
                  selectedDate={selectedDate}
                  initialAppointments={appointments}
                  initialServices={services}
                  initialWorkers={workers}
                  onSaved={fetchAppointments}
                  onUpsert={upsertAppointment}
                />
              )}
              <div style={{ display: view !== "timeGridDay" ? "block" : "none", height: 560 }}>
                <FullCalendar
                  ref={calRef}
                  key={`cal-${accent}`}
                  plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  firstDay={1}
                  nowIndicator
                  allDaySlot={false}
                  slotMinTime="07:00:00"
                  slotMaxTime="22:00:00"
                  expandRows
                  height="100%"
                  events={events}
                  eventClick={onEventClick}
                  dateClick={onDateClick}
                  eventDisplay="block"
                  // ✅ IMPORTANTÍSIMO: quitamos el header interno para evitar duplicados
                  headerToolbar={false}
                  datesSet={(arg) => {
                    const refDate = arg.view.type === "dayGridMonth" ? (arg.view.currentStart || arg.start) : arg.start;
                    const customTitle = formatCustomSpanishTitle(arg.view.type, refDate, arg.end);
                    setTitle(customTitle);
                    setSelectedDate(arg.view.currentStart || arg.start);
                  }}
                  titleFormat={{ year: "numeric", month: "long" }}
                  slotLabelFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }}
                  eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }}
                  eventContent={(arg) => (
                    <div
                      style={{
                        padding: "2px 6px",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ opacity: 0.85, fontWeight: 700 }}>
                        {arg.timeText}
                      </div>
                      <div
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {arg.event.title}
                      </div>
                    </div>
                  )}
                />
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de cita</Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {!selected ? (
            <div className="text-muted">Sin selección</div>
          ) : (
            <div className="d-grid gap-4">
              <div>
                <span className="text-muted smaller uppercase d-block mb-1">Cliente</span>
                <h4 className="fw-bold text-dark mb-0">
                  {selected.client?.firstName} {selected.client?.lastName || ""}
                </h4>
                <div className="text-muted small mt-1">
                  {selected.client?.email || "Sin correo"} · {selected.client?.phone || "Sin teléfono"}
                </div>
              </div>

              <div className="p-3 bg-light rounded-4 border">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="text-muted smaller uppercase">Servicio</span>
                    <div className="fw-bold text-dark">{selected.service?.name || "Servicio"}</div>
                  </div>
                  <Badge bg="dark" className="fs-6 py-1 px-2.5">
                    {currency(selected.service?.price)}
                  </Badge>
                </div>
                <div className="text-muted small">
                  Duración del servicio: {selected.service?.duration || 60} minutos
                </div>
              </div>

              <div>
                <span className="text-muted smaller uppercase d-block mb-2">Colaborador</span>
                <div className="d-flex align-items-center gap-2 bg-light p-2.5 rounded-3">
                  <User size={16} className="text-muted" />
                  <span className="fw-semibold text-dark">
                    {selected.worker ? `${selected.worker.firstName} ${selected.worker.lastName}` : "Profesional no asignado"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted smaller uppercase d-block mb-2">Fecha y Horario</span>
                <div className="d-flex align-items-center gap-2 bg-light p-2.5 rounded-3">
                  <Calendar size={16} className="text-muted" />
                  <span className="fw-semibold text-dark">
                    {new Date(selected.startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    {" a las "}
                    {new Date(selected.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} {"hs"}
                  </span>
                </div>
              </div>

              {selected.notes && (
                <div>
                  <span className="text-muted smaller uppercase d-block mb-1">Notas del Turno</span>
                  <div className="p-2 border bg-light rounded-3 text-muted small">{selected.notes}</div>
                </div>
              )}

              <div>
                <span className="text-muted smaller uppercase d-block mb-2">Cambiar Estado</span>
                <Form.Select
                  value={selected.status || "PENDING"}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="modern-input"
                >
                  {appointmentStatuses.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 pb-3 d-flex justify-content-between">
          <Button
            variant="outline-primary"
            className="rounded-pill px-4"
            onClick={() => {
              setShowDetail(false);
              setInitialAddData(selected);
              setShowAddModal(true);
            }}
          >
            Editar Cita
          </Button>
          <Button variant="dark" className="rounded-pill px-4" onClick={() => setShowDetail(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <AppointmentModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        initialData={initialAddData}
        onSaved={() => {
          setShowAddModal(false);
          fetchAppointments();
        }}
      />

      <AgendaSummaryDetailModal
        show={Boolean(summaryDetail)}
        data={summaryDetail}
        onHide={() => setSummaryDetail(null)}
        onEdit={handleEditAppointment}
        onSendWhatsApp={handleSendWhatsApp}
        onSendEmail={handleSendEmail}
        onMarkSenaPaid={handleMarkSenaPaid}
      />

      <FinalizeServiceModal
        show={showFinalizeModal}
        onHide={() => {
          setShowFinalizeModal(false);
          setFinalizingAppt(null);
        }}
        appointment={finalizingAppt}
        onCompleted={handleFinalizeCompleted}
      />

      {/* Modal para ingresar datos de contacto faltantes */}
      <Modal 
        show={contactWarning.show} 
        onHide={() => setContactWarning(prev => ({ ...prev, show: false }))} 
        centered
        className="modern-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-black text-gray-900 fs-5 d-flex align-items-center gap-2">
            <span className="fs-4">{contactWarning.type === "email" ? "✉️" : "📱"}</span>
            <span>{contactWarning.type === "email" ? "Falta Correo Electrónico" : "Falta Teléfono de Contacto"}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p className="small text-muted mb-3">
            Para enviar la confirmación a <strong>{contactWarning.appointment?.client?.firstName} {contactWarning.appointment?.client?.lastName || ""}</strong>, necesitas ingresar su {contactWarning.type === "email" ? "correo electrónico" : "número de teléfono/WhatsApp"}.
          </p>
          <Form.Group>
            <Form.Label className="smaller text-muted fw-bold mb-1">
              {contactWarning.type === "email" ? "Correo Electrónico *" : "Número de Teléfono/WhatsApp *"}
            </Form.Label>
            <Form.Control
              type={contactWarning.type === "email" ? "email" : "text"}
              placeholder={contactWarning.type === "email" ? "ejemplo@correo.com" : "Ej: +5491123456789"}
              value={contactWarning.value}
              onChange={(e) => setContactWarning(prev => ({ ...prev, value: e.target.value }))}
              className="rounded-xl border-gray-200 py-2"
              disabled={contactWarning.saving}
              autoFocus
            />
          </Form.Group>
          {contactWarning.error && (
            <Alert variant="danger" className="py-2 small mb-0 mt-3 rounded-xl">
              {contactWarning.error}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4 justify-content-end gap-2">
          <Button 
            variant="light" 
            onClick={() => setContactWarning(prev => ({ ...prev, show: false }))}
            disabled={contactWarning.saving}
            className="rounded-xl px-4 py-2 small fw-bold"
          >
            Cancelar
          </Button>
          <Button 
            variant="purple" 
            onClick={handleSaveContactAndSend}
            disabled={contactWarning.saving}
            className="rounded-xl px-5 py-2 bg-purple-600 hover-bg-purple-700 text-white border-0 small fw-bold d-flex align-items-center gap-2 shadow-sm"
          >
            {contactWarning.saving ? "Guardando y enviando..." : "Guardar y Enviar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
