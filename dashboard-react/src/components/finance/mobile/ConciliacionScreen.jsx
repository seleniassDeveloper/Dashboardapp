// src/components/finance/mobile/ConciliacionScreen.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, Check, AlertCircle, X, ChevronRight } from "lucide-react";
import { Modal, Button, Spinner } from "react-bootstrap";
import api from "../../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ConciliacionScreen() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, pending, discrepancy, conciliated
  const [updatingId, setUpdatingId] = useState("");

  // Modal / Action Sheet state
  const [selectedMov, setSelectedMov] = useState(null);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/bank-recon");
      setMovements(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleUpdateStatus = async (status) => {
    if (!selectedMov) return;
    try {
      setUpdatingId(selectedMov.id);
      await api.put(`/finances/bank-recon/${selectedMov.id}`, { status });
      setSelectedMov(null);
      fetchMovements();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar la conciliación.");
    } finally {
      setUpdatingId("");
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (activeTab === "all") return true;
      return m.status === activeTab;
    });
  }, [movements, activeTab]);

  const getStatusChip = (status) => {
    switch (status) {
      case "conciliated":
        return <span className="f-chip is-ok">Acreditado</span>;
      case "pending":
        return <span className="f-chip is-pend">Pendiente</span>;
      case "discrepancy":
        return <span className="f-chip is-diff">Diferencia</span>;
      default:
        return <span className="f-chip is-pend">Pendiente</span>;
    }
  };

  return (
    <div className="animate-fade-in pt-3">
      {/* Sub tabs bank status */}
      <nav className="f-statustabs">
        <button 
          className={`f-statustab-btn ${activeTab === "all" ? "is-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Todos
        </button>
        <button 
          className={`f-statustab-btn ${activeTab === "pending" ? "is-active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pendientes
        </button>
        <button 
          className={`f-statustab-btn ${activeTab === "discrepancy" ? "is-active" : ""}`}
          onClick={() => setActiveTab("discrepancy")}
        >
          Diferencias
        </button>
        <button 
          className={`f-statustab-btn ${activeTab === "conciliated" ? "is-active" : ""}`}
          onClick={() => setActiveTab("conciliated")}
        >
          Conciliados
        </button>
      </nav>

      {/* List content */}
      <div className="px-3 mt-3">
        {loading ? (
          <div className="text-center py-5 text-muted small">Cargando movimientos...</div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-center py-5 text-muted small border rounded-xl bg-white">No hay movimientos.</div>
        ) : (
          <ul className="f-list p-0 mb-3">
            {filteredMovements.map(m => (
              <li 
                className="f-mov bg-white rounded-xl border p-3 mb-2 d-flex justify-content-between align-items-center"
                key={m.id}
                onClick={() => setSelectedMov(m)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <div className="fw-bold text-dark">{m.description}</div>
                  <small className="text-muted mt-1 d-block">
                    {new Date(m.date).toLocaleDateString("es-AR")} · Ref: {m.reference || "—"}
                  </small>
                </div>
                <div className="f-mov__right">
                  <b className={m.type === "expense" ? "text-danger" : "text-success"}>
                    {m.type === "expense" ? "-" : "+"}{currency(m.amount)}
                  </b>
                  {getStatusChip(m.status)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ACTION SHEET MODAL */}
      <Modal show={!!selectedMov} onHide={() => setSelectedMov(null)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-dark">Acción de Conciliación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMov && (
            <div className="p-3 bg-light rounded-4 mb-3 border">
              <div className="fw-bold">{selectedMov.description}</div>
              <div className="mt-1 small text-muted">
                Monto: <strong>{currency(selectedMov.amount)}</strong> · Fecha: {new Date(selectedMov.date).toLocaleDateString("es-AR")}
              </div>
              <div className="mt-1 small text-muted">
                Estado actual: {getStatusChip(selectedMov.status)}
              </div>
            </div>
          )}
          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              className="rounded-xl fw-bold text-white d-flex align-items-center justify-content-center gap-2"
              onClick={() => handleUpdateStatus("conciliated")}
              disabled={updatingId}
            >
              <Check size={16} /> Conciliar / Acreditar
            </Button>
            <Button 
              variant="warning" 
              className="rounded-xl fw-bold text-dark d-flex align-items-center justify-content-center gap-2"
              onClick={() => handleUpdateStatus("discrepancy")}
              disabled={updatingId}
            >
              <AlertCircle size={16} /> Marcar Diferencia
            </Button>
            <Button 
              variant="secondary" 
              className="rounded-xl fw-bold d-flex align-items-center justify-content-center gap-2"
              onClick={() => handleUpdateStatus("pending")}
              disabled={updatingId}
            >
              <X size={16} /> Deshacer / Pendiente
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
