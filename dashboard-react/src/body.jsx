import React, { useState } from "react";
import Container from "react-bootstrap/Container";

import AppointmentsList from "./gadgets/appointments/AppointmentsList";
import AnalisisServicio from "./gadgets/appointments/Metricas/AnalisisServicio";

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
    <Container className="py-4">
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

      <AnalisisServicio
        range={range}
        status={status}
        dayDate={dayDate}
        weekFrom={weekFrom}
        weekTo={weekTo}
        monthAnchor={monthAnchor}
      />
    </Container>
  );
}