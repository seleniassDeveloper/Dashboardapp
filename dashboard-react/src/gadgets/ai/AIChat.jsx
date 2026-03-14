import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:3001/api";

export default function AIChat({ embedded = false }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const sendPreset = async (preset) => {
    setQuestion(preset);
    await handleSend(preset);
  };

  const handleSend = async (customQuestion) => {
    const q = (customQuestion ?? question).trim();
    if (!q) return;

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API}/ai/report`, {
        question: q,
      });

      setReport(res.data);
    } catch (e) {
      console.error("AI chat error:", e?.response?.data || e);
      setError(e?.response?.data?.error || "No se pudo generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 12 }}>
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => sendPreset("Analiza mis ingresos")} style={btnMini}>
          Analiza mis ingresos
        </button>
        <button onClick={() => sendPreset("Detecta problemas operativos")} style={btnMini}>
          Detecta problemas operativos
        </button>
        <button onClick={() => sendPreset("Dame decisiones para esta semana")} style={btnMini}>
          Decisiones semanales
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", paddingRight: 4 }}>
        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}

        {!report && !loading ? (
          <div style={{ color: "#666" }}>
            Pregúntale algo al dashboard.
            <ul>
              <li>¿Qué servicio genera más ingresos?</li>
              <li>¿Qué trabajador está más cargado?</li>
              <li>¿Qué decisiones debería tomar esta semana?</li>
            </ul>
          </div>
        ) : null}

        {loading ? <div>Generando reporte...</div> : null}

        {report ? (
          <div>
            <section style={card}>
              <h4 style={{ marginTop: 0 }}>Resumen</h4>
              <p style={{ marginBottom: 0 }}>{report.summary}</p>
            </section>

            <section style={card}>
              <h4 style={{ marginTop: 0 }}>Insights</h4>
              <ul>
                {(report.insights || []).map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </section>

            <section style={card}>
              <h4 style={{ marginTop: 0 }}>KPIs</h4>
              <div style={{ display: "grid", gap: 8 }}>
                {(report.kpis || []).map((kpi, i) => (
                  <div key={i} style={kpiCard}>
                    <strong>{kpi.label}</strong>
                    <div>{kpi.value}</div>
                    <small>{kpi.delta}</small>
                  </div>
                ))}
              </div>
            </section>

            <section style={card}>
              <h4 style={{ marginTop: 0 }}>{report.chart?.title || "Gráfico"}</h4>
              {(report.chart?.data || []).length === 0 ? (
                <div style={{ color: "#666" }}>Sin datos para graficar.</div>
              ) : (
                <ul>
                  {report.chart.data.map((item, i) => (
                    <li key={i}>
                      {item.name}: {item.value}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={card}>
              <h4 style={{ marginTop: 0 }}>Acciones recomendadas</h4>
              <ul>
                {(report.actions || []).map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe una pregunta..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!question.trim() || loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

const btnMini = {
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 999,
  padding: "8px 12px",
  cursor: "pointer",
};

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  background: "#fff",
};

const kpiCard = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 10,
};