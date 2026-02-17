import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, Row, Col, Spinner, Alert, Table, Badge } from "react-bootstrap";
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
  CartesianGrid,
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

function getWorkerName(a) {
  const fromRel = a?.worker
    ? `${a.worker.firstName || ""} ${a.worker.lastName || ""}`.trim()
    : "";
  if (fromRel) return fromRel;

  const fromSnap = `${a?.workerFirstName || ""} ${a?.workerLastName || ""}`.trim();
  if (fromSnap) return fromSnap;

  return (a?.workerName || "Sin trabajador").trim();
}

function getServiceName(a) {
  return (a?.service?.name || a?.serviceName || "Sin servicio").trim();
}

const STATUS_LABEL = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  DONE: "Finalizada",
  CANCELLED: "Cancelada",
};

export default function AnalisisServicio() {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#6b7280";
  const chartKey = useMemo(() => `charts-${accent}`, [accent]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const metrics = useMemo(() => {
    const list = safeArray(appointments);

    // ===========================
    // ✅ GLOBAL STATUS COUNTS
    // ===========================
    const total = list.length;
    const counts = {
      PENDING: list.filter((a) => a?.status === "PENDING").length,
      CONFIRMED: list.filter((a) => a?.status === "CONFIRMED").length,
      DONE: list.filter((a) => a?.status === "DONE").length,
      CANCELLED: list.filter((a) => a?.status === "CANCELLED").length,
    };

    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    const statusPie = [
      { name: STATUS_LABEL.PENDING, value: counts.PENDING, key: "PENDING", pct: pct(counts.PENDING) },
      { name: STATUS_LABEL.CONFIRMED, value: counts.CONFIRMED, key: "CONFIRMED", pct: pct(counts.CONFIRMED) },
      { name: STATUS_LABEL.DONE, value: counts.DONE, key: "DONE", pct: pct(counts.DONE) },
      { name: STATUS_LABEL.CANCELLED, value: counts.CANCELLED, key: "CANCELLED", pct: pct(counts.CANCELLED) },
    ].filter((x) => x.value > 0);

    // ===========================
    // ✅ BY SERVICE
    // ===========================
    const byService = new Map();
    for (const a of list) {
      const s = getServiceName(a);
      const st = a?.status || "PENDING";
      if (!byService.has(s)) byService.set(s, { name: s, total: 0, cancelled: 0, done: 0, confirmed: 0, pending: 0 });
      const e = byService.get(s);
      e.total += 1;
      if (st === "CANCELLED") e.cancelled += 1;
      if (st === "DONE") e.done += 1;
      if (st === "CONFIRMED") e.confirmed += 1;
      if (st === "PENDING") e.pending += 1;
    }

    const serviceRows = Array.from(byService.values()).sort((a, b) => b.total - a.total);
    const topService = serviceRows[0] || null;

    const worstCancel =
      serviceRows
        .filter((r) => r.total > 0)
        .map((r) => ({ ...r, cancelRate: r.cancelled / r.total }))
        .sort((a, b) => b.cancelRate - a.cancelRate)[0] || null;

    const servicePie = serviceRows.map((r) => ({
      name: r.name,
      value: r.total,
      pct: total ? Math.round((r.total / total) * 100) : 0,
    }));

    // ===========================
    // ✅ BY WORKER
    // ===========================
    const byWorker = new Map();
    for (const a of list) {
      const w = getWorkerName(a);
      const st = a?.status || "PENDING";
      if (!byWorker.has(w)) byWorker.set(w, { name: w, total: 0, cancelled: 0, done: 0, confirmed: 0, pending: 0 });
      const e = byWorker.get(w);
      e.total += 1;
      if (st === "CANCELLED") e.cancelled += 1;
      if (st === "DONE") e.done += 1;
      if (st === "CONFIRMED") e.confirmed += 1;
      if (st === "PENDING") e.pending += 1;
    }

    const workerRows = Array.from(byWorker.values()).sort((a, b) => b.total - a.total);
    const workerPie = workerRows.map((r) => ({
      name: r.name,
      value: r.total,
      pct: total ? Math.round((r.total / total) * 100) : 0,
    }));

    // ===========================
    // ✅ OPTIONAL: 1 BAR ONLY (Service: total vs cancelled)
    // ===========================
    const serviceCancelBar = serviceRows.map((r) => ({
      name: r.name,
      citas: r.total,
      canceladas: r.cancelled,
    }));

    // Rankings (Top 6)
    const topWorkers = workerRows.slice(0, 6).map((w) => ({
      ...w,
      cancelRate: w.total ? Math.round((w.cancelled / w.total) * 100) : 0,
      doneRate: w.total ? Math.round((w.done / w.total) * 100) : 0,
    }));

    const topServices = serviceRows.slice(0, 6).map((s) => ({
      ...s,
      cancelRate: s.total ? Math.round((s.cancelled / s.total) * 100) : 0,
      doneRate: s.total ? Math.round((s.done / s.total) * 100) : 0,
    }));

    return {
      total,
      counts,
      statusPie,

      topService,
      worstCancel,

      servicePie,
      workerPie,

      serviceCancelBar,

      topWorkers,
      topServices,
    };
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

  const stroke = withAlpha(accent, 0.22);

  const pieCell = (idx) => ({
    fill: withAlpha(accent, 0.18 + (idx % 5) * 0.12),
    stroke: withAlpha(accent, 0.65),
  });

  return (
    <Card className="mt-3 shadow-sm brand-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Card.Title className="mb-1 brand-title">Métricas de citas</Card.Title>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Total: <b>{metrics.total}</b>
            </div>
          </div>
          <span className="brand-pill">Resumen</span>
        </div>

        {/* ✅ KPIs */}
        <Row className="g-3 mt-2">
          {[
            { t: "Pendientes", v: metrics.counts.PENDING },
            { t: "Confirmadas", v: metrics.counts.CONFIRMED },
            { t: "Finalizadas", v: metrics.counts.DONE },
            { t: "Canceladas", v: metrics.counts.CANCELLED },
          ].map((k) => (
            <Col md={3} sm={6} key={k.t}>
              <Card className="brand-card h-100">
                <Card.Body>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {k.t}
                  </div>
                  <div style={{ fontSize: 22 }}>
                    <b className="brand-title">{k.v}</b>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ✅ TORTAS */}
        <Row className="g-3 mt-2">
          {/* Estado global */}
          <Col md={4}>
            <Card className="brand-card h-100">
              <Card.Body>
                <div className="fw-semibold brand-title">Estado global</div>
                <div style={{ height: 240 }} className="mt-2">
                  {metrics.statusPie.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" key={`st-${chartKey}`}>
                      <PieChart>
                        <Pie
                          data={metrics.statusPie}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={85}
                          label={(d) => `${d.pct}%`}
                        >
                          {metrics.statusPie.map((_, idx) => (
                            <Cell key={idx} {...pieCell(idx)} />
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

          {/* Servicios */}
          <Col md={4}>
            <Card className="brand-card h-100">
              <Card.Body>
                <div className="fw-semibold brand-title">Citas por servicio</div>
                <div style={{ height: 240 }} className="mt-2">
                  {metrics.servicePie.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" key={`svc-${chartKey}`}>
                      <PieChart>
                        <Pie
                          data={metrics.servicePie}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={85}
                          label={(d) => `${d.pct}%`}
                        >
                          {metrics.servicePie.map((_, idx) => (
                            <Cell key={idx} {...pieCell(idx)} />
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

          {/* Trabajadores */}
          <Col md={4}>
            <Card className="brand-card h-100">
              <Card.Body>
                <div className="fw-semibold brand-title">Citas por trabajador</div>
                <div style={{ height: 240 }} className="mt-2">
                  {metrics.workerPie.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" key={`wrk-${chartKey}`}>
                      <PieChart>
                        <Pie
                          data={metrics.workerPie}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={85}
                          label={(d) => `${d.pct}%`}
                        >
                          {metrics.workerPie.map((_, idx) => (
                            <Cell key={idx} {...pieCell(idx)} />
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
        </Row>

        {/* ✅ CARDS tipo “insight” */}
        <Row className="g-3 mt-2">
          <Col md={6}>
            <Card className="brand-card h-100">
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

          <Col md={6}>
            <Card className="brand-card h-100">
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
                      ({Math.round((metrics.worstCancel.cancelled / metrics.worstCancel.total) * 100)}%)
                    </div>
                  </div>
                ) : (
                  <div className="text-muted mt-2">No hay datos.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ✅ SOLO 1 BARRA (opcional) */}
        <Row className="g-3 mt-2">
          <Col md={12}>
            <Card className="brand-card">
              <Card.Body>
                <div className="fw-semibold brand-title">Citas vs Canceladas por servicio</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  (Si no la quieres, eliminas este bloque completo)
                </div>

                <div style={{ height: 260 }} className="mt-2">
                  {metrics.serviceCancelBar.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" key={`bar-${chartKey}`}>
                      <BarChart data={metrics.serviceCancelBar}>
                        <CartesianGrid stroke={stroke} vertical={false} />
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
        </Row>

        {/* ✅ RANKINGS (TABLAS) */}
        <Row className="g-3 mt-2">
          <Col md={6}>
            <Card className="brand-card h-100">
              <Card.Body>
                <div className="fw-semibold brand-title">Top trabajadores</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Total, finalizadas, canceladas y tasa
                </div>

                <div className="mt-2">
                  {metrics.topWorkers.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <Table responsive size="sm" className="mb-0">
                      <thead>
                        <tr className="text-muted" style={{ fontSize: 12 }}>
                          <th>Trabajador</th>
                          <th className="text-end">Total</th>
                          <th className="text-end">Done</th>
                          <th className="text-end">Cancel</th>
                          <th className="text-end">Tasa</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: 13 }}>
                        {metrics.topWorkers.map((w) => (
                          <tr key={w.name}>
                            <td>{w.name}</td>
                            <td className="text-end"><b>{w.total}</b></td>
                            <td className="text-end">{w.done}</td>
                            <td className="text-end">{w.cancelled}</td>
                            <td className="text-end">
                              <Badge bg="secondary">{w.cancelRate}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="brand-card h-100">
              <Card.Body>
                <div className="fw-semibold brand-title">Top servicios</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Total, finalizadas, canceladas y tasa
                </div>

                <div className="mt-2">
                  {metrics.topServices.length === 0 ? (
                    <div className="text-muted">No hay datos.</div>
                  ) : (
                    <Table responsive size="sm" className="mb-0">
                      <thead>
                        <tr className="text-muted" style={{ fontSize: 12 }}>
                          <th>Servicio</th>
                          <th className="text-end">Total</th>
                          <th className="text-end">Done</th>
                          <th className="text-end">Cancel</th>
                          <th className="text-end">Tasa</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: 13 }}>
                        {metrics.topServices.map((s) => (
                          <tr key={s.name}>
                            <td>{s.name}</td>
                            <td className="text-end"><b>{s.total}</b></td>
                            <td className="text-end">{s.done}</td>
                            <td className="text-end">{s.cancelled}</td>
                            <td className="text-end">
                              <Badge bg="secondary">{s.cancelRate}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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