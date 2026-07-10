// src/components/finance/mobile/CierreCajaScreen.jsx
import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function CierreCajaScreen({ currentRevenue = 0 }) {
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [initialCash, setInitialCash] = useState("10000");
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const expectedCash = Number(initialCash) + currentRevenue;
  const difference = actualCash ? Number(actualCash) - expectedCash : 0;

  const fetchClosings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/cash-closings");
      setClosings(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosings();
  }, [fetchClosings]);

  const handleCloseCash = async (e) => {
    e.preventDefault();
    if (!actualCash) {
      setErrorMsg("Ingresa el efectivo físico contado.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setMsg("");

      const payload = {
        initialCash: Number(initialCash),
        expectedCash,
        actualCash: Number(actualCash),
        notes: notes.trim()
      };

      await api.post("/finances/cash-closings", payload);
      setMsg("Cierre realizado y auditado con éxito.");
      setActualCash("");
      setNotes("");
      fetchClosings();
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al guardar el cierre de caja.");
    } finally {
      setSaving(false);
    }
  };

  const getDifferenceStatusClass = () => {
    if (!actualCash) return "is-ok"; // Default before typing
    if (difference === 0) return "is-ok";
    if (difference > 0) return "is-over";
    return "is-short";
  };

  const getDifferenceText = () => {
    if (!actualCash) return "Esperando conteo...";
    if (difference === 0) return "Cuadrada (Diferencia: $0) ✓";
    if (difference > 0) return `Sobrante ${currency(difference)} ↑`;
    return `Faltante ${currency(Math.abs(difference))} ↓`;
  };

  return (
    <div className="animate-fade-in px-3 pt-3">
      {errorMsg && <div className="alert alert-danger py-2 rounded-xl small mb-3">{errorMsg}</div>}
      {msg && <div className="alert alert-success py-2 rounded-xl small mb-3">{msg}</div>}

      <div className="f-card f-cash">
        <h4 className="fw-bold mb-3 text-dark d-flex align-items-center justify-content-between">
          <span>Caja del día</span>
          <small className="text-muted fs-6">{new Date().toLocaleDateString("es-AR")}</small>
        </h4>

        <div className="f-line">
          <span className="text-muted">Caja inicial (apertura)</span>
          <input 
            type="number" 
            value={initialCash} 
            onChange={(e) => setInitialCash(e.target.value)} 
            style={{ width: "90px", fontSize: "13px" }}
          />
        </div>

        <div className="f-line">
          <span className="text-muted">Ingresos del día</span>
          <span className="fw-bold text-dark">{currency(currentRevenue)}</span>
        </div>

        <div className="f-line hl">
          <span>Efectivo teórico esperado</span>
          <span className="f-money">{currency(expectedCash)}</span>
        </div>

        <div className="f-line pt-3 border-0 align-items-center">
          <span className="fw-bold text-dark">Efectivo físico contado</span>
          <input 
            type="number" 
            placeholder="$ Contado" 
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
          />
        </div>
      </div>

      {/* Difference Feedback box */}
      <div className={`f-result ${getDifferenceStatusClass()}`}>
        <span>{getDifferenceText()}</span>
        {actualCash && difference === 0 && <CheckCircle2 size={18} />}
      </div>

      {/* Notes Textarea */}
      <div className="f-notes-area mb-3">
        <textarea 
          placeholder="Observaciones (opcional)... Ej: billetes deteriorados, discrepancias..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Close Cash Button */}
      <button className="f-btn-purple m-0 w-100" onClick={handleCloseCash} disabled={saving}>
        {saving ? "Cerrando..." : "Cerrar Caja"}
      </button>

      {/* Cierres Previos */}
      <div className="f-section mt-4 mb-2">
        <h3>Historial reciente</h3>
        <button className="btn btn-sm text-purple-600 p-0" onClick={fetchClosings}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted small">Cargando historial...</div>
      ) : closings.length === 0 ? (
        <div className="text-center py-4 text-muted small border rounded-xl bg-white">No hay cierres anteriores.</div>
      ) : (
        <div className="d-flex flex-column gap-2 mb-3">
          {closings.slice(0, 5).map(c => {
            const diffVal = c.actualCash - c.expectedCash;
            return (
              <div className="f-card p-3 mb-0 d-flex justify-content-between align-items-center bg-white" key={c.id}>
                <div>
                  <div className="small text-muted">{new Date(c.createdAt).toLocaleDateString("es-AR")}</div>
                  <div className="small text-truncate mt-1 text-secondary" style={{ maxWidth: "180px" }}>
                    {c.notes || "Sin observaciones"}
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">{currency(c.actualCash)}</div>
                  <div className={`small fw-bold ${diffVal >= 0 ? "text-success" : "text-danger"}`}>
                    {diffVal === 0 ? "Cuadrada" : diffVal > 0 ? `+${currency(diffVal)}` : currency(diffVal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
