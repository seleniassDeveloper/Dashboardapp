import React, { useCallback, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppointmentsList from "./gadgets/appointments/AppointmentsList";
import AppointmentsCalendar from "./gadgets/appointments/AppointmentsCalendar";

import AnalisisServicio from "./gadgets/appointments/Metricas/analisisServicio";
import Rentabilidad from "./gadgets/appointments/Metricas/rentabilidad";
import Eficiencia from "./gadgets/appointments/Metricas/Eficiencia";

import "./styles/dashboard-clean.css";
import AIChatFloating from "./gadgets/ai/AIChatFloating";
import DynamicAIGadget from "./gadgets/ai/DynamicAIGadget";
import { normalizeViewPreferences } from "./gadgets/ai/gadgetViewPreferences";

function formatYMD(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function normalizeAiReport(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    mirrorGadget: raw.mirrorGadget || "none",
  };
}

export default function Body() {
  const [range, setRange] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [dayDate, setDayDate] = useState(formatYMD(new Date()));
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");
  const [monthAnchor, setMonthAnchor] = useState(formatYMD(new Date()));

  const [aiGadgets, setAiGadgets] = useState([]);

  const addAiGadget = useCallback(
    ({ question, report, viewPreferences, gadgetIntent }) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setAiGadgets((prev) => [
        ...prev,
        {
          id,
          question,
          report: normalizeAiReport(report),
          viewPreferences: normalizeViewPreferences(viewPreferences),
          gadgetIntent: gadgetIntent || null,
        },
      ]);
    },
    []
  );

  const mirrorSlots = useMemo(
    () => ({
      appointments_list: (
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
      ),
      calendar: <AppointmentsCalendar />,
      rentabilidad: (
        <Rentabilidad
          range={range}
          status={status}
          dayDate={dayDate}
          weekFrom={weekFrom}
          weekTo={weekTo}
          monthAnchor={monthAnchor}
        />
      ),
      eficiencia: (
        <Eficiencia
          range={range}
          status={status}
          dayDate={dayDate}
          weekFrom={weekFrom}
          weekTo={weekTo}
          monthAnchor={monthAnchor}
        />
      ),
      analisis_servicio: <AnalisisServicio />,
    }),
    [range, status, dayDate, weekFrom, weekTo, monthAnchor]
  );

  return (
    <Container fluid className="py-4">
      <Row className="g-3">
        <Col lg={8}>
          <div className="d-flex flex-column gap-3">
            <AnalisisServicio
              range={range}
              status={status}
              dayDate={dayDate}
              weekFrom={weekFrom}
              weekTo={weekTo}
              monthAnchor={monthAnchor}
            />

            <AppointmentsCalendar />
          </div>
        </Col>

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

      {aiGadgets.length > 0 ? (
        <Row className="g-3 mt-4">
          <Col xs={12}>
            <div className="fw-semibold mb-1">Pedidos desde IA</div>
            <div className="text-muted small mb-2">
              Cada consulta agrega un bloque nuevo. Configurás el gadget con listas en{" "}
              <strong>Opciones del gadget</strong> o con el{" "}
              <strong>Asistente · paso a paso</strong>; solo escribís lo que debe hacer la
              IA en el mensaje final.
            </div>
          </Col>
          {aiGadgets.map((g) => (
            <Col xs={12} key={g.id}>
              <DynamicAIGadget
                question={g.question}
                report={g.report}
                mirrorSlots={mirrorSlots}
                viewPreferences={g.viewPreferences}
                gadgetIntent={g.gadgetIntent}
                onRemove={() =>
                  setAiGadgets((prev) => prev.filter((x) => x.id !== g.id))
                }
              />
            </Col>
          ))}
        </Row>
      ) : null}

      <AIChatFloating onReportAdded={addAiGadget} />
    </Container>
  );
}
