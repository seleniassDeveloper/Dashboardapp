import React from "react";
import { ListGroup, Button, Form } from "react-bootstrap";

function statusLabel(status) {
  const map = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    DONE: "Finalizada",
  };
  return map[status] || status || "—";
}

function statusColor(status) {
  if (status === "CONFIRMED") return "#198754";
  if (status === "CANCELLED") return "#dc3545";
  if (status === "DONE") return "#6c757d";
  return "#ffc107";
}

function formatDateTime(startsAt) {
  if (!startsAt) return "—";
  const d = new Date(startsAt);
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentItem({ appt, onEdit, onDelete, onChangeStatus }) {
  const client = appt?.client?.fullName || appt?.clientName || "Cliente";
  const service = appt?.service?.name || appt?.serviceName || "Servicio";
  const when = formatDateTime(appt?.startsAt);
  const notes = appt?.notes?.trim();
  const border = statusColor(appt?.status);

  return (
    <ListGroup.Item
      className="rounded-4 shadow-sm mb-2"
      style={{
        border: "1px solid #eef2f7",
        borderLeft: `6px solid ${border}`,
        padding: "14px",
      }}
    >
      {/* FILA 1: Cliente / Fecha */}
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div className="fw-semibold" style={{ fontSize: 14 }}>
          {client}
        </div>

        <div className="text-muted text-end" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {when}
        </div>
      </div>

      {/* FILA 2: Servicio / Descripción */}
      <div className="d-flex justify-content-between align-items-start gap-3 mt-1">
        <div className="text-muted" style={{ fontSize: 12 }}>
          {service}
        </div>

        <div className="text-muted text-end" style={{ fontSize: 12, maxWidth: 320 }}>
          {notes ? notes : "—"}
        </div>
      </div>

      {/* FILA 3: Select / Botones */}
      <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
        <div className="d-flex align-items-center gap-2">
          <div className="text-muted" style={{ fontSize: 11, width: 64 }}>
            Estado
          </div>

          <Form.Select
            size="sm"
            value={appt?.status || "PENDING"}
            onChange={(e) => onChangeStatus?.(appt, e.target.value)}
            style={{ minWidth: 170, borderRadius: 10 }}
          >
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="DONE">Finalizada</option>
            <option value="CANCELLED">Cancelada</option>
          </Form.Select>
        </div>

        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" style={{ borderRadius: 10 }} onClick={() => onEdit?.(appt)}>
            Editar
          </Button>

          <Button size="sm" variant="outline-danger" style={{ borderRadius: 10 }} onClick={() => onDelete?.(appt)}>
            Eliminar
          </Button>
        </div>
      </div>

      <div className="mt-2" style={{ fontSize: 11, color: "#6b7280" }}>
        Estado actual: <span style={{ fontWeight: 600, color: border }}>{statusLabel(appt?.status)}</span>
      </div>
    </ListGroup.Item>
  );
}