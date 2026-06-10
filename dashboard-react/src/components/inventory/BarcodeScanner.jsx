import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Alert, Badge } from "react-bootstrap";
import { Barcode, Scan, PlusCircle, MinusCircle, CheckCircle } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function BarcodeScanner({ products = [], onRefresh }) {
  const [scannedProduct, setScannedProduct] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [qtyChange, setQtyChange] = useState("1");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSimulateScan = (prodId) => {
    setErrorMsg("");
    setSuccessMsg("");
    const matched = products.find(p => p.id === prodId);
    if (matched) {
      setScannedProduct(matched);
      setBarcodeInput(matched.barcode || `779${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  const handleManualLookup = () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!barcodeInput.trim()) return;

    // Lookup by barcode
    const matched = products.find(p => p.barcode === barcodeInput.trim());
    if (matched) {
      setScannedProduct(matched);
    } else {
      setErrorMsg("Código de barras no registrado en el catálogo. Probá simular el escaneo con el selector superior.");
      setScannedProduct(null);
    }
  };

  const handleAdjustStock = async (isIncrement) => {
    if (!scannedProduct || !qtyChange) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const diff = isIncrement ? Number(qtyChange) : -Number(qtyChange);
      
      const payload = {
        productId: scannedProduct.id,
        diff,
        type: isIncrement ? "input" : "output",
        reason: isIncrement ? "Ingreso rápido por escáner de barras" : "Egreso rápido por escáner de barras"
      };

      const res = await api.post("/inventory/movements", payload);
      setSuccessMsg(`¡Movimiento registrado con éxito! Nuevo stock de ${scannedProduct.name}: ${res.data.newQty} unidades.`);
      
      // Update local product reference to show new stock
      setScannedProduct(prev => ({ ...prev, stock: res.data.newQty }));

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo realizar el ajuste rápido de stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="g-4 animate-fade-in">
      {/* Viewport de Escaneo Emulado (Columna izquierda) */}
      <Col lg={6}>
        <Card className="card-premium border-0 shadow-sm bg-dark text-white p-4 rounded-2xl h-100 position-relative overflow-hidden">
          <Card.Body className="p-0 d-flex flex-column align-items-center justify-content-between" style={{ minHeight: "340px" }}>
            <div className="w-100 text-center mb-3">
              <h3 className="h6 fw-black text-white mb-1 d-flex align-items-center justify-content-center gap-2">
                <Scan size={18} className="text-purple-400" />
                <span>Simulador de Escáner de Barra (Móvil)</span>
              </h3>
              <p className="smaller text-gray-400 mb-0">Emulá el uso de la cámara de tu celular apuntando a los insumos del salón.</p>
            </div>

            {/* Viewport Laser scanning visual effect */}
            <div className="w-100 rounded-2xl bg-black border border-gray-800 position-relative d-flex align-items-center justify-content-center flex-grow-1 mb-4" style={{ height: "180px", overflow: "hidden" }}>
              {/* Vertical red laser line */}
              <div 
                className="position-absolute bg-red-500 w-100 animate-pulse" 
                style={{ 
                  height: "2px", 
                  boxShadow: "0 0 10px #ef4444, 0 0 20px #ef4444",
                  top: "50%",
                  left: 0,
                  transform: "translateY(-50%)"
                }} 
              />
              
              <div className="text-center p-3 opacity-60">
                <Barcode size={64} className="text-gray-400 mb-2" />
                <div className="smaller text-gray-500">CÁMERA ACTIVA AURA SCANNER</div>
              </div>
            </div>

            <div className="w-100">
              <Form.Group className="mb-2">
                <Form.Label className="smaller text-gray-400 fw-bold">Elegir Insumo para Simular Disparo</Form.Label>
                <Form.Select 
                  className="bg-gray-900 border-gray-800 text-white rounded-xl"
                  onChange={(e) => handleSimulateScan(e.target.value)}
                >
                  <option value="">Selecciona el producto a escanear...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Barra: {p.barcode || "Sin código"})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Resultados y Acciones del Escaneo (Columna derecha) */}
      <Col lg={6}>
        <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl h-100">
          <Card.Body className="p-0 d-flex flex-column justify-content-between">
            <div>
              <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
                <Barcode className="text-purple-600" size={20} />
                <span>Resultados de Lectura de Barra</span>
              </h3>

              {successMsg && <Alert variant="success" className="rounded-xl smaller py-2 mb-3">{successMsg}</Alert>}
              {errorMsg && <Alert variant="danger" className="rounded-xl smaller py-2 mb-3">{errorMsg}</Alert>}

              {/* Búsqueda Manual */}
              <div className="p-3 bg-light rounded-2xl mb-4 border border-gray-150">
                <Form.Label className="smaller text-muted fw-bold d-block mb-1.5">Búsqueda Directa por Código de Barra</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    placeholder="Ej: 7790123456789"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                  <Button variant="dark" onClick={handleManualLookup} className="rounded-xl fw-bold text-white bg-gray-900 px-4">
                    Buscar
                  </Button>
                </div>
              </div>

              {scannedProduct ? (
                <div className="p-3 rounded-2xl mb-3 border border-purple-100 bg-purple-50 bg-opacity-30">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="smaller text-purple-950 fw-bold">{scannedProduct.category}</span>
                    <Badge bg="purple" className="rounded-pill px-2.5 py-1">Catálogo</Badge>
                  </div>
                  <h4 className="fw-black text-gray-900 h6 mb-1.5">{scannedProduct.name}</h4>
                  <div className="small text-muted mb-2">📍 Ubicación: <strong>{scannedProduct.location || "General"}</strong></div>
                  
                  <Row className="g-2 border-top border-purple-100 pt-3">
                    <Col xs={6}>
                      <span className="smaller text-muted d-block">Stock Actual:</span>
                      <strong className="text-gray-900" style={{ fontSize: "15px" }}>{scannedProduct.stock} {scannedProduct.unit}</strong>
                    </Col>
                    <Col xs={6}>
                      <span className="smaller text-muted d-block">Costo Unitario:</span>
                      <strong className="text-gray-900" style={{ fontSize: "15px" }}>{currency(scannedProduct.costPrice)}</strong>
                    </Col>
                  </Row>
                </div>
              ) : (
                <div className="text-center py-4 text-muted smaller bg-gray-50 rounded-2xl border border-gray-150">
                  Escaneá un producto desde el simulador de cámara o ingresá su código manualmente para interactuar con las existencias.
                </div>
              )}
            </div>

            {scannedProduct && (
              <div className="border-top pt-4 mt-4">
                <Form.Group className="mb-3">
                  <Form.Label className="smaller text-muted fw-bold">Cantidad de Unidades a Cargar o Retirar</Form.Label>
                  <Form.Control
                    type="number"
                    value={qtyChange}
                    onChange={(e) => setQtyChange(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Row className="g-2">
                    <Col xs={6}>
                      <Button
                        variant="success"
                        disabled={loading}
                        onClick={() => handleAdjustStock(true)}
                        className="w-100 rounded-xl py-3 fw-bold text-white bg-emerald-600 hover-bg-emerald-700 border-0 d-flex align-items-center justify-content-center gap-1.5"
                      >
                        <PlusCircle size={16} />
                        <span>Cargar</span>
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button
                        variant="danger"
                        disabled={loading || scannedProduct.stock <= 0}
                        onClick={() => handleAdjustStock(false)}
                        className="w-100 rounded-xl py-3 fw-bold text-white bg-red-600 hover-bg-red-700 border-0 d-flex align-items-center justify-content-center gap-1.5"
                      >
                        <MinusCircle size={16} />
                        <span>Descontar</span>
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
