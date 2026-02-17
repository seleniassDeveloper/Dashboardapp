import React, { useMemo, useState, useCallback, useRef } from "react";
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

export default function AppointmentsCalendar() {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#d32f2f";

  const { appointments, loading, error } = useAppointmentsStore();

  // console.log("appointments", appointments);

  const calRef = useRef(null);

  // ✅ controla vista + título arriba (sin depender del toolbar de FullCalendar)
  const [view, setView] = useState("dayGridMonth"); // "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  const [title, setTitle] = useState("");

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

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
            <div style={{ height: 560 }}>
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
                eventDisplay="block"
                // ✅ IMPORTANTÍSIMO: quitamos el header interno para evitar duplicados
                headerToolbar={false}
                // ✅ actualiza el título arriba cuando cambias de mes/semana/día
                datesSet={(arg) => setTitle(arg.view.title)}
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
    </>
  );
}
