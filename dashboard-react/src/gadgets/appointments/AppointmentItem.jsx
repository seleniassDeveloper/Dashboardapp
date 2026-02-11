import React, { useMemo, useState } from "react";
import { ListGroup, Button, Stack, Badge, Form, Spinner } from "react-bootstrap";

const STATUS_CHOICES = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "DONE", label: "Finalizada" },
];

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadgeVariant(status) {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "DONE":
      return "secondary";
    default:
      return "warning";
  }
}

export default function AppointmentItem({ appt, onEdit, onDelete, onChangeStatus }) {
  const [savingStatus, setSavingStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState(appt.status);

  // si el appt cambia por props (ej. refrescar), sincroniza
  React.useEffect(() => {
    setLocalStatus(appt.status);
  }, [appt.status]);

  const serviceName = appt?.service?.name ?? "Servicio";
  const clientName = appt?.client?.fullName ?? "Cliente";

  const currentLabel = useMemo(() => {
    return STATUS_CHOICES.find((s) => s.value === localStatus)?.label || localStatus;
  }, [localStatus]);

  async function handleStatusSelect(e) {
    const next = e.target.value;
    if (!next || next === localStatus) return;

    // optimistic UI
    const prev = localStatus;
    setLocalStatus(next);
    setSavingStatus(true);

    try {
      await onChangeStatus?.(appt, next); // ← hace PUT en el padre
    } catch (err) {
      // rollback si algo falla (por si tu handler no captura)
      setLocalStatus(prev);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <ListGroup.Item className="py-3">
      <Stack direction="horizontal" className="justify-content-between" gap={3}>
        <div style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2">
            <div className="fw-semibold text-truncate">{clientName}</div>
            <Badge bg={statusBadgeVariant(localStatus)}>{currentLabel}</Badge>
          </div>

          <div className="text-muted" style={{ fontSize: 13 }}>
            {serviceName} • {formatDateTime(appt.startsAt)}
          </div>

          {appt.notes ? (
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              {appt.notes}
            </div>
          ) : null}
        </div>

        <Stack direction="horizontal" gap={2}>
          {/* ✅ selector estado */}
          <div style={{ width: 170 }}>
            <Form.Select
              size="sm"
              value={localStatus}
              onChange={handleStatusSelect}
              disabled={savingStatus}
            >
              {STATUS_CHOICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Form.Select>
          </div>

          {savingStatus ? (
            <Button variant="outline-secondary" size="sm" disabled>
              <Spinner animation="border" size="sm" className="me-2" />
              Guardando
            </Button>
          ) : (
            <>
              <Button variant="outline-secondary" size="sm" onClick={() => onEdit?.(appt)}>
                Editar
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => onDelete?.(appt)}>
                Eliminar
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </ListGroup.Item>
  );
}