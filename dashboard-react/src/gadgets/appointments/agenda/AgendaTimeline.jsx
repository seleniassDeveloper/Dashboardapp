import React from "react";
import { Badge } from "react-bootstrap";
import WorkerColumn from "./WorkerColumn";

export default function AgendaTimeline({
  workers = [],
  appointmentsByWorker = {},
  scheduleBlocksByWorker = {},
  onEditAppointment,
  onUpdateStatus,
  onSendWhatsApp,
  onSendEmail,
  onMoveAppointment,
  onCreateAppointmentAt,
}) {
  // Horarios de la regla lateral (9 a 20 hs)
  const hours = Array.from({ length: 12 }, (_, i) => i + 9);

  // Valores seguros por defecto (defensa contra undefined/null)
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAppointmentsByWorker = appointmentsByWorker || {};
  const safeScheduleBlocksByWorker = scheduleBlocksByWorker || {};
  const safeHours = Array.isArray(hours) ? hours : [];

  // Evitar que rompa si no hay datos
  if (!safeWorkers.length) {
    return (
      <div className="agenda-empty p-5 text-center text-muted border border-dashed rounded-4 bg-light">
        No hay trabajadores configurados para la agenda de hoy.
      </div>
    );
  }

  if (!safeHours.length) {
    return (
      <div className="agenda-empty p-5 text-center text-muted border border-dashed rounded-4 bg-light">
        No hay horarios configurados en el timeline.
      </div>
    );
  }

  return (
    <div className="agenda-grid-container">
      {/* Cabecera de Trabajadores */}
      <div className="agenda-stylist-headers">
        {safeWorkers.map((w) => {
          if (!w) return null;
          const initials = `${w.firstName?.[0] || ""}${w.lastName?.[0] || ""}`.toUpperCase();
          const role = w.roleTitle || "Estilista";
          
          // Contar ocupación
          const appts = safeAppointmentsByWorker[w.id] || [];
          const occPercent = Math.min(Math.round((appts.length / 6) * 100), 100); // 6 turnos promedio de ocupación total

          return (
            <div key={w.id} className="stylist-header-cell text-dark">
              <div className="d-flex align-items-center gap-2">
                <div className="stylist-avatar-initials">{initials || "ST"}</div>
                <div className="text-start">
                  <div className="fw-bold small">{w.firstName} {w.lastName}</div>
                  <div className="text-muted smaller" style={{ fontSize: "10px" }}>{role}</div>
                </div>
              </div>
              <Badge 
                bg={occPercent > 70 ? "danger-soft" : occPercent > 30 ? "warning-soft" : "success-soft"} 
                className={`sena-badge-custom mt-1 ${occPercent > 70 ? "text-danger" : occPercent > 30 ? "text-warning" : "text-success"}`}
              >
                {occPercent}% Ocupado
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Regla de Horas y Lienzo de Columnas */}
      <div className="agenda-timeline-content">
        
        {/* Regla de Horas Lateral */}
        <div className="agenda-hours-rule">
          {safeHours.map((h) => (
            <div key={h} className="agenda-hour-label">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Lienzo de Columnas de Profesionales */}
        <div className="agenda-columns-wrapper">
          {safeWorkers.map((w) => {
            if (!w) return null;
            return (
              <WorkerColumn
                key={w.id}
                worker={w}
                appointments={safeAppointmentsByWorker[w.id] || []}
                scheduleBlocks={safeScheduleBlocksByWorker[w.id] || []}
                onEditAppointment={onEditAppointment}
                onUpdateStatus={onUpdateStatus}
                onSendWhatsApp={onSendWhatsApp}
                onSendEmail={onSendEmail}
                onMoveAppointment={onMoveAppointment}
                onCreateAppointmentAt={onCreateAppointmentAt}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
}
