import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Card, Modal, Button, Badge, Spinner, Alert } from "react-bootstrap";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { useBrand } from "../../header/name/BrandProvider";

// ✅ si tenés css para FullCalendar (el que ya estabas usando)
import "./styles/fullcalendar-fix.css";

const API = "http://localhost:3001/api";

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
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(60,60,60,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AppointmentsCalendar() {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#d32f2f";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // ✅ GET citas
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError("");
        setLoading(true);
        const res = await axios.get(`${API}/appointments`);

        if (!alive) return;
        setAppointments(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!alive) return;
        setError("No pude traer las citas. Revisa que el backend esté en :3001.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ eventos: start + end
  const events = useMemo(() => {
    return (appointments || [])
      .filter((a) => a?.startsAt)
      .map((a) => {
        const start = a.startsAt;
        const minutes = Number(a?.service?.duration) || 60;
        const end = addMinutes(start, minutes);

        const title = `${a?.client?.fullName || "Cliente"} · ${a?.service?.name || "Servicio"}`;

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

  // ✅ click evento -> modal
  const onEventClick = useCallback((info) => {
    const appt = info?.event?.extendedProps?.appt;
    if (!appt) return;
    setSelected(appt);
    setShowDetail(true);
  }, []);

  return (
    <>
      <Card className="shadow-sm brand-card">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="brand-title">Calendario</div>
            <span className="brand-pill">Semana</span>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted" style={{ height: 560 }}>
              <Spinner size="sm" /> Cargando calendario...
            </div>
          ) : error ? (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          ) : (
            <div style={{ height: 560 }}>
              <FullCalendar
                key={`cal-${accent}`}
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"  // ✅ semana por defecto
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
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridWeek,timeGridDay,dayGridMonth",
                }}
                buttonText={{
                  today: "Hoy",
                  week: "Semana",
                  day: "Día",
                  month: "Mes",
                }}
                // ✅ evita “duplicados” visuales en botones/labels
                buttonHints={{
                  today: "Ir a hoy",
                  week: "Vista semanal",
                  day: "Vista diaria",
                  month: "Vista mensual",
                }}
                titleFormat={{ year: "numeric", month: "long" }}
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                eventContent={(arg) => (
                  <div style={{ padding: "2px 6px", fontSize: 11, fontWeight: 500 }}>
                    <div style={{ opacity: 0.85, fontWeight: 700 }}>{arg.timeText}</div>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                <div className="text-muted" style={{ fontSize: 12 }}>Cliente</div>
                <div className="fw-semibold">{selected?.client?.fullName || "—"}</div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Servicio</div>
                <div className="fw-semibold">{selected?.service?.name || "—"}</div>
              </div>

              <div className="d-flex gap-3">
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Inicio</div>
                  <div className="fw-semibold">
                    {selected?.startsAt ? new Date(selected.startsAt).toLocaleString() : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Duración</div>
                  <div className="fw-semibold">
                    {selected?.service?.duration ? `${selected.service.duration} min` : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Estado</div>
                <Badge bg={statusVariant(selected?.status)}>
                  {statusLabel(selected?.status)}
                </Badge>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>Notas</div>
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