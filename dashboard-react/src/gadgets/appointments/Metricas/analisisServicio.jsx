import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useBrand } from "../../../header/name/BrandProvider";


const API = "http://localhost:3001/api";

function safeArray(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function withAlpha(hex, alpha = 1) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AnalisisServicio() {
  const { brand } = useBrand();

  // ✅ color global del dashboard
  const accent = brand?.accentColor || brand?.textColor || "#ffffff";

  // ✅ clave ÚNICA para forzar remount cuando cambia el color
  const chartKey = useMemo(() => `charts-${accent}`, [accent]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ GET citas SOLO una vez
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
        setError(
          e?.response?.data?.error ||
            "No pude traer las citas. ¿Está corriendo el backend en http://localhost:3001 ?"
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ métricas SOLO dependen de appointments
  const metrics = useMemo(() => {
    const list = safeArray(appointments);

    const byService = new Map();
    for (const a of list) {
      const name = a?.service?.name || "Sin servicio";
      const status = a?.status || "PENDING";
      const duration = a?.service?.duration ?? null;

      if (!byService.has(name)) {
        byService.set(name, { name, total: 0, cancelled: 0, duration });
      }
      const entry = byService.get(name);
      entry.total += 1;
      if (status === "CANCELLED") entry.cancelled += 1;
      if (entry.duration == null && duration != null) entry.duration = duration;
    }

    const rows = Array.from(byService.values()).sort((a, b) => b.total - a.total);
    const totalAppointments = list.length || 0;

    const pieData = rows.map((r) => ({
      name: r.name,
      value: r.total,
      pct: totalAppointments ? Math.round((r.total / totalAppointments) * 100) : 0,
    }));

    const topService = rows[0] || null;

    const worstCancel =
      rows
        .filter((r) => r.total > 0)
        .map((r) => ({ ...r, cancelRate: r.cancelled / r.total }))
        .sort((a, b) => b.cancelRate - a.cancelRate)[0] || null;

    const barData = rows.map((r) => ({
      name: r.name,
      citas: r.total,
      canceladas: r.cancelled,
    }));

    const durationData = rows.map((r) => ({
      name: r.name,
      duracionMin: Number.isFinite(Number(r.duration)) ? Number(r.duration) : null,
    }));

    return { totalAppointments, pieData, topService, worstCancel, barData, durationData };
  }, [appointments]);

  if (loading) {
    return (
      <Card className="mt-3 shadow-sm brand-card">
        <Card.Body className="d-flex align-items-center gap-2 text-muted">
          <Spinner size="sm" /> Cargando métricas...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-3 shadow-sm brand-card">
        <Card.Body>
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3 shadow-sm brand-card">
      <Card.Body>
        <Card.Title className="mb-1 brand-title">Métricas por servicio</Card.Title>
        <Card.Text className="text-muted" style={{ fontSize: 13 }}>
          Total citas: <b>{metrics.totalAppointments}</b>
        </Card.Text>

        <Row className="g-3">
          {/* PIE */}
          <Col md={6}>
            <Card className="h-100 brand-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-semibold brand-title">% de citas por servicio</div>
                  <span className="brand-pill">Distribución</span>
                </div>

                <div style={{ height: 260 }} className="mt-2">
                  {metrics.pieData.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" key={`pie-${chartKey}`}>
                      <PieChart key={`piechart-${chartKey}`}>
                        <Pie
                          data={metrics.pieData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={90}
                          label={(d) => `${d.pct}%`}
                        >
                          {metrics.pieData.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={withAlpha(accent, 0.18 + (idx % 5) * 0.12)}
                              stroke={withAlpha(accent, 0.65)}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* TOP / CANCEL */}
          <Col md={6}>
            <Row className="g-3">
              <Col md={12}>
                <Card className="brand-card">
                  <Card.Body>
                    <div className="fw-semibold brand-title">Servicio más vendido</div>
                    {metrics.topService ? (
                      <div className="mt-2">
                        <div style={{ fontSize: 18 }}>
                          <b className="brand-title">{metrics.topService.name}</b>
                        </div>
                        <div className="text-muted">
                          Citas: <b>{metrics.topService.total}</b>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted mt-2">No hay datos.</div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                <Card className="brand-card">
                  <Card.Body>
                    <div className="fw-semibold brand-title">Mayor cancelación (tasa)</div>
                    {metrics.worstCancel ? (
                      <div className="mt-2">
                        <div style={{ fontSize: 18 }}>
                          <b className="brand-title">{metrics.worstCancel.name}</b>
                        </div>
                        <div className="text-muted">
                          Canceladas: <b>{metrics.worstCancel.cancelled}</b> /{" "}
                          <b>{metrics.worstCancel.total}</b>{" "}
                          ({Math.round(metrics.worstCancel.cancelRate * 100)}%)
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted mt-2">No hay datos.</div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* BARRAS */}
          <Col md={12}>
            <Card className="brand-card">
              <Card.Body>
                <div className="fw-semibold brand-title">Citas vs Canceladas por servicio</div>

                <div style={{ height: 280 }} className="mt-2">
                  {metrics.barData.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" key={`bar-${chartKey}`}>
                      <BarChart data={metrics.barData} key={`barchart-${chartKey}`}>
                        <XAxis dataKey="name" hide />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="citas" fill={withAlpha(accent, 0.65)} />
                        <Bar dataKey="canceladas" fill={withAlpha(accent, 0.25)} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* DURACIÓN */}
          <Col md={12}>
            <Card className="brand-card">
              <Card.Body>
                <div className="fw-semibold brand-title">Duración aproximada por servicio</div>

                <div className="mt-2">
                  {metrics.durationData.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <Row className="g-2">
                      {metrics.durationData.map((d) => (
                        <Col md={4} key={d.name}>
                          <div
                            className="brand-card"
                            style={{
                              borderRadius: 10,
                              padding: 10,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "var(--brand-accent-soft)",
                            }}
                          >
                            <span className="brand-title">{d.name}</span>
                            <b className="brand-title">
                              {d.duracionMin != null ? `${d.duracionMin} min` : "—"}
                            </b>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}