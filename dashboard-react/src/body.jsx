import React from "react";
import Container from "react-bootstrap/Container";
import AppointmentsList from "./gadgets/appointments/AppointmentsList";

export default function Body() {
  return (
    <Container className="py-4">
      <AppointmentsList/>
    </Container>
  );
}