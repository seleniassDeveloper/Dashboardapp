import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, Row, Col, ProgressBar, Spinner, Alert } from "react-bootstrap";
import { useBrand } from "../../../header/name/BrandProvider";

const API = "http://localhost:3001/api";

function safeArray(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function withAlpha(hex, alpha = 1) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- helpers de fecha (mismos criterios que tu lista) ---
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function endOfMonth(d) {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  return endOfDay(x);
}

export default function Eficiencia({
  range = "ALL",
  status = "ALL",
  dayDate,
  weekFrom,
  weekTo,
  monthAnchor,
}) {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#ffffff";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ GET una vez (no depende de brand)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError("");
        setLoading(true);
        const res = await axios.get(`${API}/appointments`);
        if (!alive) return;
        setAppointments(safeArray(res.data));
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.error || "No pude traer las citas.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ aplicar filtros igual que tu lista
  const filtered = useMemo(() => {
    let list = safeArray(appointments);

    if (status !== "ALL") list = list.filter((a) => a.status === status);

    if (range === "DAY" && dayDate) {
      const base = new Date(`${dayDate}T12:00:00`);
      const from = startOfDay(base);
      const to = endOfDay(base);
      list = list.filter((a) => {
        const d = new Date(a.startsAt);
        return d >= from && d <= to;
      });
    }

    if (range === "WEEK" && weekFrom && weekTo) {
      const from = startOfDay(new Date(`${weekFrom}T12:00:00`));
      const to = endOfDay(new Date(`${weekTo}T12:00:00`));
      list = list.filter((a) => {
        const d = new Date(a.startsAt);
        return d >= from && d <= to;
      });
    }

    if (range === "MONTH" && monthAnchor) {
      const base = new Date(`${monthAnchor}T12:00:00`);
      const from = startOfMonth(base);
      const to = endOfMonth(base);
      list = list.filter((a) => {
        const d = new Date(a.startsAt);
        return d >= from && d <= to;
      });
    }

    return list;
  }, [appointments, range, status, dayDate, weekFrom, weekTo, monthAnchor]);

  // ✅ métricas correctas
  const metrics = useMemo(() => {
    const list = safeArray(filtered);

    const total = list.length;
    if (!total) {
      return { cancelPct: 0, avgDuration: 0, deadHours: 0, metaPct: 0, donePct: 0 };
    }

    const cancelled = list.filter((a) => a.status === "CANCELLED").length;
    const done = list.filter((a) => a.status === "DONE").length;

    const cancelPct = Math.round((cancelled / total) * 100);
    const donePct = Math.round((done / total) * 100);

    const durations = list
      .map((a) => Number(a?.service?.duration))
      .filter((n) => Number.isFinite(n) && n > 0);

    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // ✅ horarios muertos: gap entre FIN de anterior e INICIO de la siguiente
    const sorted = list
      .slice()
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    let deadMinutes = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prevStart = new Date(sorted[i - 1].startsAt);
      const prevDur = Number(sorted[i - 1]?.service?.duration) || 0;
      const prevEnd = new Date(prevStart.getTime() + prevDur * 60000);

      const currentStart = new Date(sorted[i].startsAt);
      const gap = (currentStart - prevEnd) / 60000;

      if (gap > 30) deadMinutes += gap; // umbral: 30 min (ajustable)
    }

    const deadHours = Number(deadMinutes / 60).toFixed(1);

    // meta ejemplo: 100 citas (luego lo hacemos dinámico)
    const meta = 100;
    const metaPct = Math.min(100, Math.round((total / meta) * 100));

    return { cancelPct, avgDuration, deadHours, metaPct, donePct };
  }, [filtered]);

  if (loading) {
    return (
      <Card className="shadow-sm brand-card">
        <Card.Body className="d-flex align-items-center gap-2 text-muted">
          <Spinner size="sm" /> Cargando eficiencia...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm brand-card">
        <Card.Body>
          <Alert variant="danger" className="mb-0">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm brand-card" key={accent}>
      <Card.Body>
        <Card.Title className="brand-title mb-3">Eficiencia</Card.Title>

        <Row className="g-3">
          <Col md={6}>
            <div className="brand-title fw-semibold">% Cancelaciones</div>
            <h4 className="brand-title">{metrics.cancelPct}%</h4>
          </Col>

          <Col md={6}>
            <div className="brand-title fw-semibold">Tiempo promedio</div>
            <h4 className="brand-title">{metrics.avgDuration} min</h4>
          </Col>

          <Col md={6}>
            <div className="brand-title fw-semibold">Horarios muertos</div>
            <h4 className="brand-title">{metrics.deadHours} h</h4>
          </Col>

          <Col md={6}>
            <div className="brand-title fw-semibold">Meta vs resultado</div>
            <ProgressBar
              now={metrics.metaPct}
              label={`${metrics.metaPct}%`}
              style={{ backgroundColor: withAlpha(accent, 0.15) }}
            >
              <ProgressBar
                now={metrics.metaPct}
                key={`bar-${accent}`}
                style={{ backgroundColor: withAlpha(accent, 0.75) }}
              />
            </ProgressBar>
          </Col>

          {/* extra útil */}
          <Col md={12}>
            <div className="brand-title fw-semibold mb-1">Citas finalizadas (DONE)</div>
            <ProgressBar
              now={metrics.donePct}
              label={`${metrics.donePct}%`}
              style={{ backgroundColor: withAlpha(accent, 0.15) }}
            >
              <ProgressBar
                now={metrics.donePct}
                key={`done-${accent}`}
                style={{ backgroundColor: withAlpha(accent, 0.45) }}
              />
            </ProgressBar>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}