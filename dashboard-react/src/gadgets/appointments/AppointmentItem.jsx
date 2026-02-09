import React from "react";
import { ListGroup, Badge } from "react-bootstrap";

export default function AppointmentItem({ appt }) {
  return (
    <ListGroup.Item className="d-flex justify-content-between align-items-start">
      <div>
        <div className="fw-semibold">
          {appt.client?.fullName || "Sin cliente"}
        </div>

        <div className="text-muted" style={{ fontSize: 12 }}>
          {new Date(appt.startsAt).toLocaleString()} •{" "}
          {appt.service?.name || "Sin servicio"}
        </div>

        {appt.notes ? (
          <div style={{ fontSize: 12 }} className="mt-1">
            {appt.notes}
          </div>
        ) : null}
      </div>

      <Badge bg="secondary" pill>
        {appt.status}
      </Badge>
    </ListGroup.Item>
  );
}