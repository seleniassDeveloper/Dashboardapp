import React, { useState, useEffect } from "react";
import { Card, Table, Button, Form, Spinner, Alert, Badge } from "react-bootstrap";
import { CheckCircle, AlertCircle, RefreshCw, Landmark, HelpCircle } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function BankReconciliation() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/finances/bank-recon");
      setMovements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los movimientos bancarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const handleReconcile = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      setError("");
      setOkMsg("");
      await api.put(`/finances/bank-recon/${id}`, { status: newStatus });
      setOkMsg("Conciliación de movimiento bancario actualizada con éxito.");
      fetchMovements();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado de conciliación.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <Card className="card-premium border-0 shadow-sm bg-white">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h3 className="h6 fw-black text-gray-900 m-0 d-flex align-items-center gap-2">
            <Landmark className="text-purple-600 animate-pulse" size={20} />
            <span>Conciliación Bancaria y Facturación MP/Crédito</span>
          </h3>
          <Button variant="light" size="sm" onClick={fetchMovements} disabled={loading} className="rounded-circle p-2">
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </Button>
        </div>
        <p className="text-muted smaller mb-4">Compará los depósitos acreditados en tu cuenta bancaria y MercadoPago con las reservas y turnos del sistema para asegurar que no falte dinero.</p>

        {error && <Alert variant="danger" className="rounded-xl smaller py-2 mb-3">{error}</Alert>}
        {okMsg && <Alert variant="success" className="rounded-xl smaller py-2 mb-3">{okMsg}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
            No hay movimientos bancarios registrados todavía.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px" }}>
                  <th className="ps-3">Fecha</th>
                  <th>Descripción Banco / MP</th>
                  <th>Referencia</th>
                  <th>Tipo</th>
                  <th>Importe</th>
                  <th>Estado Conciliación</th>
                  <th className="text-end pe-3">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="ps-3 text-secondary">{new Date(m.date).toLocaleDateString("es-AR")}</td>
                    <td className="fw-bold text-gray-900">{m.description}</td>
                    <td className="text-muted small">{m.reference || "—"}</td>
                    <td>
                      <Badge bg={m.type === "deposit" ? "success-soft" : "danger-soft"} className={m.type === "deposit" ? "text-success rounded-pill px-2.5 py-1" : "text-danger rounded-pill px-2.5 py-1"}>
                        {m.type === "deposit" ? "Acreditado" : "Débito"}
                      </Badge>
                    </td>
                    <td className={`fw-black ${m.amount > 0 ? "text-success" : "text-danger"}`}>
                      {currency(m.amount)}
                    </td>
                    <td>
                      <Badge 
                        bg={m.status === "conciliated" ? "success-soft" : m.status === "pending" ? "warning-soft" : "danger-soft"}
                        className={m.status === "conciliated" ? "text-success rounded-pill px-2.5 py-1 fw-bold" : m.status === "pending" ? "text-warning rounded-pill px-2.5 py-1 fw-bold" : "text-danger rounded-pill px-2.5 py-1 fw-bold"}
                      >
                        {m.status === "conciliated" ? "Conciliado" : m.status === "pending" ? "Pendiente" : "Diferencia"}
                      </Badge>
                    </td>
                    <td className="text-end pe-3">
                      <div className="d-inline-flex gap-1.5">
                        {m.status !== "conciliated" ? (
                          <Button 
                            variant="success" 
                            size="sm" 
                            disabled={updatingId === m.id}
                            className="rounded-xl py-1 px-2.5 text-white fw-bold d-flex align-items-center gap-1"
                            onClick={() => handleReconcile(m.id, "conciliated")}
                            style={{ fontSize: "11.5px" }}
                          >
                            <CheckCircle size={12} />
                            <span>Conciliar</span>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            disabled={updatingId === m.id}
                            className="rounded-xl py-1 px-2.5"
                            onClick={() => handleReconcile(m.id, "pending")}
                            style={{ fontSize: "11.5px" }}
                          >
                            <span>Deshacer</span>
                          </Button>
                        )}
                        {m.status === "pending" && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            disabled={updatingId === m.id}
                            className="rounded-xl py-1 px-2.5 text-white fw-bold d-flex align-items-center gap-1"
                            onClick={() => handleReconcile(m.id, "discrepancy")}
                            style={{ fontSize: "11.5px" }}
                          >
                            <AlertCircle size={12} />
                            <span>Diferencia</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
