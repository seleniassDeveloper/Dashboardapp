import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Button, Form, Spinner, Alert, Badge } from "react-bootstrap";

const API = "http://localhost:3001/api";

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

export default function AIChat({ embedded = false }) {
  const [input, setInput] = useState("kpis y torta por servicio");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [messages, setMessages] = useState([]); // {role:"user"|"assistant", text}

  const canSend = useMemo(() => input.trim().length >= 2 && !loading, [input, loading]);

  const listRef = useRef(null);

  // auto-scroll al final
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const send = async () => {
    if (!canSend) return;

    const question = input.trim();
    setInput("");
    setErr("");
    setLoading(true);

    setMessages((p) => [...p, { role: "user", text: question }]);

    try {
      const res = await axios.post(`${API}/ai/analytics`, {
        question,
        from: from || null,
        to: to || null,
      });

      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          text: res.data?.summaryText || "Listo.",
        },
      ]);
    } catch (e) {
      const msg = e?.response?.data?.error || "No pude generar el reporte IA.";
      setErr(msg);
      setMessages((p) => [...p, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#fff",
        padding: embedded ? 12 : 0,
      }}
    >
      {/* Top bar mini dentro */}
      <div className="d-flex align-items-center justify-content-between mb-2" style={{ flex: "0 0 auto" }}>
        <div className="fw-bold">Reportes IA</div>
        <Badge bg="secondary">Beta</Badge>
      </div>

      {/* filtros */}
      <div className="d-flex gap-2 mb-2" style={{ flex: "0 0 auto" }}>
        <Form.Control type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Form.Control type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {err ? (
        <div style={{ flex: "0 0 auto" }}>
          <Alert variant="danger" className="py-2 mb-2">
            {err}
          </Alert>
        </div>
      ) : null}

      {/* Mensajes */}
      <div
        ref={listRef}
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12,
          padding: 12,
          display: "grid",
          gap: 10,
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ fontSize: 13, color: "#666" }}>
            Escribí algo tipo: “kpis y torta por servicio”.
          </div>
        ) : null}

        {safeArray(messages).map((m, i) => (
          <div
            key={i}
            style={{
              justifySelf: m.role === "user" ? "end" : "start",
              maxWidth: "85%",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.08)",
              background: m.role === "user" ? "rgba(0,0,0,0.06)" : "#fff",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 2 }}>
              {m.role === "user" ? "Vos" : "IA"}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}

        {loading ? (
          <div style={{ justifySelf: "start", fontSize: 13, color: "#666" }}>
            <Spinner size="sm" className="me-2" />
            Generando...
          </div>
        ) : null}
      </div>

      {/* Input fijo abajo */}
      <div style={{ flex: "0 0 auto", marginTop: 10, display: "flex", gap: 8 }}>
        <Form.Control
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pedile algo a la IA..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button variant="dark" onClick={send} disabled={!canSend} style={{ minWidth: 96 }}>
          {loading ? "..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}