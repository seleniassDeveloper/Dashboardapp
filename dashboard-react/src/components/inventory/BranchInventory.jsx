import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { Building, ArrowRightLeft, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function BranchInventory({ products = [], onRefresh }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Transfer states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [destBranchId, setDestBranchId] = useState("");
  const [transferQty, setTransferQty] = useState("1");
  const [transferring, setTransferring] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/finances/branches");
      setBranches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las sucursales físicas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !sourceBranchId || !destBranchId || !transferQty) return;
    if (sourceBranchId === destBranchId) {
      setError("La sucursal de origen y destino deben ser diferentes.");
      return;
    }

    const matchedProd = products.find(p => p.id === selectedProductId);
    if (!matchedProd) return;

    // Check if source branch has enough stock
    const sourceInv = matchedProd.branchInventories?.find(bi => bi.branchId === sourceBranchId);
    const availableStock = sourceInv ? sourceInv.stock : 0;

    if (availableStock < Number(transferQty)) {
      setError(`Stock insuficiente en la sucursal de origen. Disponible: ${availableStock} ${matchedProd.unit}.`);
      return;
    }

    try {
      setTransferring(true);
      setError("");
      setOkMsg("");

      // Perform transfer as two movements (subtract from source, add to destination)
      const qtyNum = Number(transferQty);

      await api.post("/inventory/movements", {
        productId: selectedProductId,
        diff: -qtyNum,
        type: "output",
        reason: "Transferencia entre sucursales (Salida de origen)",
        observation: `Destino: ${branches.find(b => b.id === destBranchId)?.name}`,
        branchId: sourceBranchId
      });

      await api.post("/inventory/movements", {
        productId: selectedProductId,
        diff: qtyNum,
        type: "input",
        reason: "Transferencia entre sucursales (Ingreso a destino)",
        observation: `Origen: ${branches.find(b => b.id === sourceBranchId)?.name}`,
        branchId: destBranchId
      });

      setOkMsg(`¡Transferencia de ${transferQty} ${matchedProd.unit} de "${matchedProd.name}" realizada con éxito!`);
      setSelectedProductId("");
      setSourceBranchId("");
      setDestBranchId("");
      setTransferQty("1");

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError("Error al realizar la transferencia contable.");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Row className="g-4 animate-fade-in">
      {/* Stock por Sucursal (Columna izquierda) */}
      <Col lg={8}>
        <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl">
          <Card.Body className="p-0">
            <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
              <Building className="text-purple-600" size={20} />
              <span>Niveles de Existencias Multi-Sucursal</span>
            </h3>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="purple" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-4 text-muted small">Cargando catálogo...</div>
            ) : (
              <div className="table-responsive">
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                      <th className="ps-3 py-3">Insumo</th>
                      {branches.map(b => (
                        <th className="py-3 text-center" key={b.id}>{b.name}</th>
                      ))}
                      <th className="pe-3 py-3 text-end">Total Global</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13.5px" }}>
                    {products.map(p => (
                      <tr key={p.id} className="transition-all hover-row-focus">
                        <td className="ps-3 py-3 fw-bold text-gray-900">{p.name}</td>
                        {branches.map(b => {
                          const branchInv = p.branchInventories?.find(bi => bi.branchId === b.id);
                          const stockVal = branchInv ? branchInv.stock : 0;
                          const isLow = stockVal < p.minStock;
                          return (
                            <td className="py-3 text-center" key={b.id}>
                              <strong className={isLow ? "text-danger fw-black" : "text-gray-800 fw-bold"}>
                                {stockVal} {p.unit}
                              </strong>
                              {isLow && <div className="smaller text-danger-soft fw-semibold" style={{ fontSize: "9px" }}>Bajo Stock</div>}
                            </td>
                          );
                        })}
                        <td className="pe-3 py-3 text-end fw-black text-purple-700">
                          {p.stock} {p.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* Transferencia Interna (Columna derecha) */}
      <Col lg={4}>
        <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl h-100">
          <Card.Body className="p-0 d-flex flex-column justify-content-between">
            <div>
              <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
                <ArrowRightLeft className="text-purple-600" size={20} />
                <span>Solicitud de Transferencia Interna</span>
              </h3>
              <p className="text-muted smaller mb-4">Transferí stock excedente de una sucursal a otra para evitar quiebres y optimizar los costos de compra.</p>

              {error && <Alert variant="danger" className="rounded-xl smaller py-2 mb-3">{error}</Alert>}
              {okMsg && <Alert variant="success" className="rounded-xl smaller py-2 mb-3">{okMsg}</Alert>}

              <Form onSubmit={handleTransfer} className="d-grid gap-3">
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Insumo a Transferir *</Form.Label>
                  <Form.Select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  >
                    <option value="">Elegí el producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Unidad: {p.unit})</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Sucursal de Origen *</Form.Label>
                  <Form.Select
                    value={sourceBranchId}
                    onChange={(e) => setSourceBranchId(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  >
                    <option value="">Elegí sucursal origen...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Sucursal de Destino *</Form.Label>
                  <Form.Select
                    value={destBranchId}
                    onChange={(e) => setDestBranchId(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  >
                    <option value="">Elegí sucursal destino...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="smaller text-muted fw-bold">Cantidad a Transferir *</Form.Label>
                  <Form.Control
                    type="number"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="purple"
                  disabled={transferring || !selectedProductId || !sourceBranchId || !destBranchId}
                  className="rounded-xl py-3 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow border-0 d-flex align-items-center justify-content-center gap-1.5"
                >
                  {transferring ? <Spinner size="sm" /> : <ArrowRightLeft size={16} />}
                  <span>Ejecutar Transferencia</span>
                </Button>
              </Form>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
