import React, { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert, Badge } from "react-bootstrap";
import { ShieldAlert, RefreshCw } from "lucide-react";
import api from "../../lib/api.js";

export default function FinancialAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/finances/audit");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los registros de auditoría.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <Card className="card-premium border-0 shadow-sm bg-white">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h3 className="h6 fw-black text-gray-900 m-0 d-flex align-items-center gap-2">
            <ShieldAlert className="text-purple-600" size={20} />
            <span>Bitácora de Auditoría Financiera de Seguridad</span>
          </h3>
          <button onClick={fetchAuditLogs} disabled={loading} className="btn btn-light btn-sm rounded-circle p-2">
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
        </div>
        <p className="text-muted smaller mb-4">Registro inmutable de movimientos significativos: modificaciones de cobros, precios de lista de tratamientos, liquidaciones de comisiones o cierres de caja.</p>

        {error && <Alert variant="danger" className="rounded-xl py-2 small">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
            No hay registros de auditoría de seguridad todavía.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px" }}>
                  <th className="ps-3">Fecha y Hora</th>
                  <th>Operación / Acción</th>
                  <th>Actor / Responsable</th>
                  <th className="pe-3">Detalles Auditados</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="ps-3 text-secondary" style={{ fontSize: "12.5px" }}>
                      {new Date(log.createdAt).toLocaleDateString("es-AR")} • {new Date(log.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                    </td>
                    <td>
                      <Badge 
                        bg={log.action.includes("error") ? "danger-soft" : log.action.includes("close") ? "secondary-soft" : "primary-soft"}
                        className={log.action.includes("error") ? "text-danger rounded-pill px-2.5 py-1 fw-bold" : "text-purple-700 bg-purple-50 border border-purple-100 rounded-pill px-2.5 py-1 fw-bold"}
                        style={{ fontSize: "11px" }}
                      >
                        {log.action.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="fw-bold text-gray-800">{log.actor}</td>
                    <td className="text-gray-700 pe-3 smaller">{log.details}</td>
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
