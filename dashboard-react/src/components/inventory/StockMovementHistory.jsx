import React, { useState, useEffect } from "react";
import { Card, Table, Form, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { Activity, Search, Filter, Calendar, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import api from "../../lib/api.js";

export default function StockMovementHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/inventory/movements");
      setMovements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudo leer el historial de auditoría de inventario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getMovementMeta = (type) => {
    switch (type) {
      case "input":
        return { label: "Ingreso Stock", style: { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }, icon: <ArrowDownLeft size={14} /> };
      case "output":
        return { label: "Egreso / Retiro", style: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }, icon: <ArrowUpRight size={14} /> };
      case "adjustment":
        return { label: "Ajuste Auditor", style: { backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }, icon: <Activity size={14} /> };
      case "automatic":
        return { label: "Consumo Servicio", style: { backgroundColor: "rgba(147, 51, 234, 0.1)", color: "#9333ea" }, icon: <Activity size={14} /> };
      case "loss":
        return { label: "Pérdida / Rotura", style: { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }, icon: <ArrowUpRight size={14} /> };
      default:
        return { label: "Devolución", style: { backgroundColor: "rgba(107, 114, 128, 0.1)", color: "#6b7280" }, icon: <Activity size={14} /> };
    }
  };

  const filtered = movements.filter(m => {
    const matchesSearch = m.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType ? m.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl animate-fade-in">
      <Card.Body className="p-0">
        <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
          <Activity className="text-purple-600" size={20} />
          <span>Bitácora de Auditoría de Movimientos de Insumos</span>
        </h3>
        <p className="text-muted smaller mb-4">Registro inmutable de todas las cargas, mermas de insumos, auditorías y egresos automáticos por citas finalizadas.</p>

        {error && <Alert variant="danger" className="rounded-xl">{error}</Alert>}

        {/* Filter bar */}
        <Row className="g-3 mb-4">
          <Col md={7}>
            <Form.Group className="d-flex align-items-center gap-2">
              <div className="position-relative flex-grow-1">
                <Search size={16} className="position-absolute text-muted" style={{ left: 12, top: 12 }} />
                <Form.Control
                  placeholder="Buscar por insumo o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-200 rounded-xl ps-5"
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border-gray-200 rounded-xl"
            >
              <option value="">Todos los Tipos de Movimiento</option>
              <option value="input">Ingreso de Lote / Compra</option>
              <option value="output">Salida Manual</option>
              <option value="adjustment">Ajuste de Auditoría</option>
              <option value="automatic">Consumo Automático Citas</option>
              <option value="loss">Pérdida / Vencimiento / Rotura</option>
            </Form.Select>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
            No se registraron movimientos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: "400px" }}>
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                  <th className="ps-3 py-3">Fecha y Hora</th>
                  <th className="py-3">Producto / Insumo</th>
                  <th className="py-3">Tipo</th>
                  <th className="py-3 text-center">Variación</th>
                  <th className="py-3 text-center">Stock Resultante</th>
                  <th className="py-3">Motivo / Auditoría</th>
                  <th className="pe-3 py-3">Autor</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {filtered.map(m => {
                  const meta = getMovementMeta(m.type);
                  return (
                    <tr key={m.id}>
                      <td className="ps-3 py-2.5 text-secondary">
                        {new Date(m.createdAt).toLocaleDateString("es-AR")} • {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                      </td>
                      <td className="py-2.5 text-dark fw-bold">{m.product?.name || "Insumo Eliminado"}</td>
                      <td className="py-2.5">
                        <span 
                          className="badge rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1"
                          style={meta.style}
                        >
                          {meta.icon}
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td className={`py-2.5 text-center fw-black ${m.diff > 0 ? "text-success" : "text-danger"}`}>
                        {m.diff > 0 ? `+${m.diff}` : m.diff}
                      </td>
                      <td className="py-2.5 text-center fw-bold text-gray-800">{m.newQty}</td>
                      <td className="py-2.5 text-secondary">
                        <div className="fw-medium text-gray-900">{m.reason}</div>
                        {m.observation && <div className="smaller text-muted italic">{m.observation}</div>}
                      </td>
                      <td className="pe-3 py-2.5 text-muted smaller">
                        <span className="d-inline-flex align-items-center gap-1">
                          <User size={12} />
                          <span>{m.user}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
