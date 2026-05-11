import React from "react";
import { Container } from "react-bootstrap";
import AppointmentsCalendar from "../gadgets/appointments/AppointmentsCalendar";

export default function CalendarView() {
  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold h3">Agenda de Citas</h1>
          <p className="text-muted">Gestiona tus horarios y reservas de forma visual.</p>
        </div>
      </header>

      <div className="card-premium p-0 overflow-hidden" style={{ minHeight: "calc(100vh - 200px)" }}>
        <AppointmentsCalendar />
      </div>
    </Container>
  );
}
