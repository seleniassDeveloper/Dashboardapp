import React from "react";
import { ListGroup, Button, Stack, Badge } from "react-bootstrap";

export default function AppointmentItem({ appt, onEdit, onDelete }) {
  const clientName = appt?.client?.fullName || "—";
  const serviceName = appt?.service?.name || "—";
  const when = appt?.startsAt ? new Date(appt.startsAt).toLocaleString() : "—";

  function handleEditClick() {
    onEdit?.(appt);
  }

  function handleDeleteClick() {
    console.log("console de la funcions que ejecuta delete del padre")
    console.log("appt en delete click:", appt);
    onDelete?.(appt); 
  }

  return (
    <ListGroup.Item>
      <Stack direction="horizontal" className="justify-content-between gap-3">
        <div>
          <div className="fw-semibold">
            {clientName} <span className="text-muted">•</span> {serviceName}
          </div>

          <div className="text-muted" style={{ fontSize: 13 }}>
            {when}
            {appt?.status ? (
              <Badge bg="secondary" className="ms-2">
                {appt.status}
              </Badge>
            ) : null}
          </div>

          {appt?.notes ? (
            <div className="text-muted" style={{ fontSize: 13 }}>
              {appt.notes}
            </div>
          ) : null}
        </div>

        <Stack direction="horizontal" gap={2}>
          <Button variant="outline-secondary" size="sm" onClick={handleEditClick}>
            Editar
          </Button>

          <Button variant="outline-danger" size="sm" onClick={handleDeleteClick}>
            Eliminar
          </Button>
        </Stack>
      </Stack>
    </ListGroup.Item>
  );
}