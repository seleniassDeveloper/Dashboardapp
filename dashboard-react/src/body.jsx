import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppointmentsList from "./gadgets/appointments/AppointmentsList";
import AppointmentsCalendar from "./gadgets/appointments/AppointmentsCalendar";

import AnalisisServicio from "./gadgets/appointments/Metricas/AnalisisServicio";
import Rentabilidad from "./gadgets/appointments/Metricas/Rentabilidad";
import Eficiencia from "./gadgets/appointments/Metricas/Eficiencia";

// ✅ si hiciste el css limpio:
import "./styles/dashboard-clean.css";

function formatYMD(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Body() {
  const [range, setRange] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [dayDate, setDayDate] = useState(formatYMD(new Date()));
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");
  const [monthAnchor, setMonthAnchor] = useState(formatYMD(new Date()));

  return (
    <Container fluid className="py-4">
      <Row className="g-3">
        {/* IZQUIERDA: métricas + calendario */}
        <Col lg={8}>
          <div className="d-flex flex-column gap-3">
            {/* MÉTRICAS POR SERVICIO */}
            <AnalisisServicio
              range={range}
              status={status}
              dayDate={dayDate}
              weekFrom={weekFrom}
              weekTo={weekTo}
              monthAnchor={monthAnchor}
            />

            {/* CALENDARIO */}
            <AppointmentsCalendar />
          </div>
        </Col>

        {/* DERECHA: lista + rentabilidad + eficiencia */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3">
            <AppointmentsList
              range={range}
              setRange={setRange}
              status={status}
              setStatus={setStatus}
              dayDate={dayDate}
              setDayDate={setDayDate}
              weekFrom={weekFrom}
              setWeekFrom={setWeekFrom}
              weekTo={weekTo}
              setWeekTo={setWeekTo}
              monthAnchor={monthAnchor}
              setMonthAnchor={setMonthAnchor}
            />

            <Rentabilidad
              range={range}
              status={status}
              dayDate={dayDate}
              weekFrom={weekFrom}
              weekTo={weekTo}
              monthAnchor={monthAnchor}
            />

            <Eficiencia
              range={range}
              status={status}
              dayDate={dayDate}
              weekFrom={weekFrom}
              weekTo={weekTo}
              monthAnchor={monthAnchor}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}