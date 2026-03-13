import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useBrand } from "../../header/name/BrandProvider";

const API = "http://localhost:3001/api";

function withAlpha(hex, a = 1) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(60,60,60,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

export default function AIReports() {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#111";

  const [question, setQuestion] = useState(
    "Hacé un resumen semanal con gráficos de citas por servicio y por trabajador."
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const ask = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await axios.post(`${API}/ai/analytics`, {
        question,
        from: from || null,
        to: to || null,
      });
      setResult(res.data);
    } catch (e) {
      setErr(e?.response?.data?.error || "No pude generar el reporte IA.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const widgets = useMemo(() => safeArray(result?.widgets), [result]);
  const insights = useMemo(() => safeArray(result?.insights), [result]);

  return (
    <Card className="shadow-sm brand-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          <div className="brand-title">Reportes con IA</div>
          <Badge bg="secondary">Beta</Badge>
        </div>

        <Row className="g-2 mb-2">
          <Col md={6}>
            <Form.Control
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pedile algo a la IA..."
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Button
              variant="dark"
              className="w-100"
              onClick={ask}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" /> Generando
                </>
              ) : (
                "Generar"
              )}
            </Button>
          </Col>
        </Row>

        {err ? <Alert variant="danger">{err}</Alert> : null}

        {!result ? (
          <div className="text-muted" style={{ fontSize: 13 }}>
            Escribí una petición como: “torta por servicio + top 3 trabajadores +
            conclusiones”.
          </div>
        ) : (
          <div className="d-grid gap-3 mt-3">
            {/* HEADER REPORTE */}
            <Card className="brand-card">
              <Card.Body>
                <div className="fw-semibold">{result.title || "Reporte"}</div>
                {result.summaryText ? (
                  <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                    {result.summaryText}
                  </div>
                ) : null}
              </Card.Body>
            </Card>

            {/* INSIGHTS (opcional) */}
            {insights.length > 0 ? (
              <Card className="brand-card">
                <Card.Body>
                  <div className="fw-semibold mb-2">Conclusiones</div>
                  <ul className="mb-0" style={{ fontSize: 13 }}>
                    {insights.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            ) : null}

            {/* WIDGETS */}
      {widgets.length > 0 ? (
  <div className="d-grid gap-2 mt-2">
    {widgets.map((w, idx) => (
      <AIChart key={`${i}-${idx}`} widget={w} accent={accent} />
    ))}
  </div>
) : null}

            {widgets.map((w, idx) => (
              <Card key={idx} className="brand-card">
                <Card.Body>
                  <div className="fw-semibold mb-2">{w.title || w.type}</div>

                  {/* KPIs */}
                  {w.type === "kpis" && Array.isArray(w.items) ? (
                    <Row className="g-2">
                      {w.items.map((it, i) => (
                        <Col md={3} key={i}>
                          <div
                            className="p-3 rounded-3"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              className="text-muted"
                              style={{ fontSize: 12 }}
                            >
                              {it.label}
                            </div>
                            <div className="fw-bold" style={{ fontSize: 18 }}>
                              {it.value}
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  ) : null}

                  {/* PIE */}
                  {w.type === "pie" && Array.isArray(w.data) ? (
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={w.data}
                            dataKey={w.dataKey || "value"}
                            nameKey={w.nameKey || "name"}
                            outerRadius={95}
                          >
                            {w.data.map((_, i) => (
                              <Cell
                                key={i}
                                fill={withAlpha(accent, 0.18 + (i % 6) * 0.12)}
                                stroke={withAlpha(accent, 0.7)}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}

                  {/* BAR */}
                  {w.type === "bar" && Array.isArray(w.data) ? (
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={w.data}>
                          <XAxis dataKey={w.xKey || "name"} hide />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          {(w.series || [{ key: "value", name: "Valor" }]).map(
                            (s, i) => (
                              <Bar
                                key={s.key}
                                dataKey={s.key}
                                name={s.name}
                                fill={withAlpha(accent, 0.65 - i * 0.2)}
                              />
                            )
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}

                  {/* TABLE */}
                  {w.type === "table" && Array.isArray(w.rows) ? (
                    <div style={{ overflowX: "auto" }}>
                      <table className="table table-sm mb-0">
                        <thead>
                          <tr>
                            {(w.columns ||
                              Object.keys(w.rows?.[0] || {})).map((c) => (
                              <th key={c}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {w.rows.map((r, i) => (
                            <tr key={i}>
                              {(w.columns || Object.keys(r)).map((c) => (
                                <td key={c}>{String(r[c] ?? "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {/* FALLBACK si no matchea */}
                  {!["kpis", "pie", "bar", "table"].includes(w.type) ? (
                    <Alert variant="info" className="mb-0">
                      Widget no soportado: <b>{String(w.type)}</b>
                    </Alert>
                  ) : null}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}