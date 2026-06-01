import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Card,
  Modal,
  Button,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
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
import axiosApi from "../../lib/api.js";

import "./styles/fullcalendar-fix.css";

// ---------- helpers ----------
function addMinutes(dateLike, minutes) {
  const d = new Date(dateLike);
  return new Date(d.getTime() + (Number(minutes) || 0) * 60000);
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

  const { appointments, services, loading, error, fetchAppointments, upsertAppointment } = useAppointmentsStore();

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

  const handleSendWhatsApp = (appt) => {
    const worker = workers.find(w => w.id === appt.workerId);
    const dateStr = new Date(appt.startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const text = `¡Hola ${appt.client?.firstName || "Cliente"}! Te confirmamos tu turno en Aura Studio para el día ${dateStr} a las ${timeStr} hs para el servicio de ${appt.service?.name || "Estética"}. Te atenderá ${worker?.firstName || "Profesional"}. ¡Te esperamos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSendEmail = async (appt) => {
    if (!appt.client?.email) {
      alert("El cliente no posee un correo electrónico configurado.");
      return;
    }

    const googleAccessToken = localStorage.getItem("google_oauth_access_token");
    if (!googleAccessToken) {
      alert("Error: Tu sesión de Google no está activa. Iniciá sesión con Google para enviar correos.");
      return;
    }

    try {
      const payload = {
        appointmentId: appt.id,
        to: appt.client.email.trim(),
        subject: `Confirmación de Turno - Aura Studio`,
        message: `Hola ${appt.client.firstName || "Cliente"},\n\nTe confirmamos tu turno para el día ${new Date(appt.startsAt).toLocaleDateString("es-AR")} a las ${new Date(appt.startsAt).toLocaleTimeString("es-AR", {hour: '2-digit', minute: '2-digit'})} hs para realizarte: ${appt.service?.name || "Estética"}.\n¡Muchas gracias por elegirnos!\n\nDirección del Local: Av. Principal 1234, Aura Studio.`
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
      .filter((a) => a?.startsAt)
      .map((a) => {
        const start = a.startsAt;
        const minutes = Number(a?.service?.duration) || 60;
        const end = addMinutes(start, minutes);

        const clientName =
          [a?.client?.firstName, a?.client?.lastName]
            .filter(Boolean)
            .join(" ") || "Cliente";

        const title = `${clientName} · ${a?.service?.name || "Servicio"}`;
        const bg =
          a?.status === "CANCELLED"
            ? "rgba(220,53,69,0.22)"
            : a?.status === "CONFIRMED"
              ? "rgba(25,135,84,0.20)"
              : a?.status === "DONE"
                ? "rgba(108,117,125,0.20)"
                : withAlpha(accent, 0.22);

        const border =
          a?.status === "CANCELLED"
            ? "rgba(220,53,69,0.85)"
            : a?.status === "CONFIRMED"
              ? "rgba(25,135,84,0.85)"
              : a?.status === "DONE"
                ? "rgba(108,117,125,0.85)"
                : withAlpha(accent, 0.85);

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

        <Modal.Body>
          {!selected ? (
            <div className="text-muted">Sin selección</div>
          ) : (
            <div className="d-grid gap-2">
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Cliente
                </div>
                <div className="fw-semibold">
                  {[selected?.client?.firstName, selected?.client?.lastName]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Servicio
                </div>
                <div className="fw-semibold">
                  {selected?.service?.name || "—"}
                </div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Profesional que atiende
                </div>
                <div className="fw-semibold">
                  {selected?.worker
                    ? `${selected.worker.firstName || ""} ${selected.worker.lastName || ""}`.trim()
                    : "—"}
                </div>
              </div>

              <div className="d-flex gap-3">
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    Inicio
                  </div>
                  <div className="fw-semibold">
                    {selected?.startsAt
                      ? new Date(selected.startsAt).toLocaleString()
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    Duración
                  </div>
                  <div className="fw-semibold">
                    {selected?.service?.duration
                      ? `${selected.service.duration} min`
                      : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Estado
                </div>
                <Badge bg={statusVariant(selected?.status)}>
                  {statusLabel(selected?.status)}
                </Badge>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Notas
                </div>
                <div>{selected?.notes || "—"}</div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowDetail(false)}>
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
    </>
  );
}
