import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge, Modal } from "react-bootstrap";
import { Layers, Plus, Calendar, Tag, ShieldAlert, Award, Clock } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function BatchControl({ products = [], suppliers = [], onRefresh }) {
  const [batches, setBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Modal form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [productId, setProductId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [initialQty, setInitialQty] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [branchId, setBranchId] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [batchRes, branchRes] = await Promise.all([
        api.get("/inventory/batches"),
        api.get("/finances/branches")
      ]);

      setBatches(Array.isArray(batchRes.data) ? batchRes.data : []);
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los lotes contables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleProductChange = (prodId) => {
    setProductId(prodId);
    const matched = products.find(p => p.id === prodId);
    if (matched) {
      setCostPrice(matched.costPrice);
      setSupplierId(matched.providerId || "");
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!productId || !batchNumber || !initialQty || !costPrice) return;

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {
        productId,
        batchNumber: batchNumber.trim(),
        supplierId: supplierId || null,
        initialQty: Number(initialQty),
        costPrice: Number(costPrice),
        branchId: branchId || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null
      };

      await api.post("/inventory/batches", payload);
      setOkMsg(`¡Lote "${batchNumber}" cargado con éxito! Stock general actualizado.`);
      
      setShowAddModal(false);
      setProductId("");
      setBatchNumber("");
      setSupplierId("");
      setInitialQty("");
      setCostPrice("");
      setBranchId("");
      setExpirationDate("");

      await fetchBatches();

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError("Error al crear el lote físico en base de datos.");
    } finally {
      setSaving(false);
    }
  };

  const getExpirationBadge = (expDate) => {
    if (!expDate) return <Badge bg="light" className="text-secondary border rounded-pill">Sin Vencimiento</Badge>;

    const now = Date.now();
    const exp = new Date(expDate).getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return <Badge bg="danger-soft" className="text-danger rounded-pill px-2.5 py-1.5 fw-bold">⚠️ VENCIDO</Badge>;
    } else if (diffDays <= 30) {
      return <Badge bg="warning-soft" className="text-warning rounded-pill px-2.5 py-1.5 fw-bold">⚠️ Por vencer ({diffDays}d)</Badge>;
    } else {
      return <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1.5 fw-bold">Óptimo ({diffDays}d)</Badge>;
    }
  };

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl animate-fade-in">
      <Card.Body className="p-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
              <Layers className="text-purple-600" size={20} />
              <span>Control de Lotes y Trazabilidad (FIFO)</span>
            </h3>
            <p className="text-muted smaller mb-0">Rastreá ingresos por partida, controlá vencimientos críticos y despachá de forma automática el lote más antiguo.</p>
          </div>
          <Button
            variant="purple"
            className="rounded-xl px-4 py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2 shadow-sm border-0"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Ingresar Lote Técnico</span>
          </Button>
        </div>

        {error && <Alert variant="danger" className="rounded-2xl">{error}</Alert>}
        {okMsg && <Alert variant="success" className="rounded-2xl">{okMsg}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-2xl border">
            No hay lotes ingresados en esta base de datos.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                  <th className="ps-3 py-3">Código Lote</th>
                  <th className="py-3">Insumo / Tratamiento</th>
                  <th className="py-3">Proveedor</th>
                  <th className="py-3 text-center">Cantidad Inicial</th>
                  <th className="py-3 text-center">Disponible Actual</th>
                  <th className="py-3 text-center">Estado Lote</th>
                  <th className="py-3">Costo Lote</th>
                  <th className="pe-3 py-3">Sucursal</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {batches.map(b => (
                  <tr key={b.id} className="transition-all hover-row-focus">
                    <td className="ps-3 py-3 fw-bold text-dark">
                      {b.batchNumber}
                    </td>
                    <td className="py-3">
                      <div className="fw-bold text-gray-900">{b.product.name}</div>
                      <div className="smaller text-muted">Ingreso: {new Date(b.purchaseDate).toLocaleDateString("es-AR")}</div>
                    </td>
                    <td className="py-3 text-secondary">
                      {b.supplier?.name || "Sin Proveedor"}
                    </td>
                    <td className="py-3 text-center text-muted">
                      {b.initialQty} {b.product.unit}
                    </td>
                    <td className="py-3 text-center fw-black text-gray-900">
                      {b.actualQty} {b.product.unit}
                    </td>
                    <td className="py-3 text-center">
                      {getExpirationBadge(b.expirationDate)}
                    </td>
                    <td className="py-3 fw-semibold text-gray-700">
                      {currency(b.costPrice)}
                    </td>
                    <td className="pe-3 py-3 text-muted">
                      {b.branch?.name || "General"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* MODAL TO CREATE BATCH */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered className="border-0 shadow-lg animate-fade-in">
          <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
            <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
              <Layers className="text-purple-600" size={20} />
              <span>Ingresar Nuevo Lote Físico</span>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreateBatch}>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="smaller text-muted fw-bold">Elegir Insumo *</Form.Label>
                <Form.Select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="border-gray-200 rounded-xl"
                  required
                >
                  <option value="">Selecciona el insumo a cargar...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Unidad: {p.unit})</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Número de Lote *</Form.Label>
                    <Form.Control
                      placeholder="Ej: LOTE-8890"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Cantidad de Unidades *</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Ej: 10"
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Precio de Costo Unitario ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Fecha de Vencimiento</Form.Label>
                    <Form.Control
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Distribuidor / Proveedor</Form.Label>
                    <Form.Select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="border-gray-200 rounded-xl"
                    >
                      <option value="">Ninguno</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Sucursal Destinataria</Form.Label>
                    <Form.Select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="border-gray-200 rounded-xl"
                    >
                      <option value="">General (Todas)</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
              <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} className="rounded-xl px-4" disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="purple" disabled={saving} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
                {saving ? <Spinner size="sm" /> : "Guardar Lote"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Card.Body>
    </Card>
  );
}

