import React, { useState } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Badge, Modal } from "react-bootstrap";
import { Plus, Edit3, Trash2, Tag, DollarSign, Package, AlertTriangle, Building, Barcode } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ProductForm({ products = [], suppliers = [], onRefresh }) {
  // Modal for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states for Create/Edit
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Coloración");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("5");
  const [minStock, setMinStock] = useState("3");
  const [maxStock, setMaxStock] = useState("10");
  const [unit, setUnit] = useState("unidad");
  const [barcode, setBarcode] = useState("");
  const [location, setLocation] = useState("");
  const [providerId, setProviderId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !costPrice || !minStock) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        category,
        costPrice: Number(costPrice),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock),
        minStock: Number(minStock),
        maxStock: Number(maxStock),
        unit,
        barcode: barcode.trim() || null,
        location: location.trim() || null,
        providerId: providerId || null
      };

      if (editingProduct) {
        await api.put(`/inventory/products/${editingProduct.id}`, payload);
        setShowEditModal(false);
      } else {
        await api.post("/inventory/products", payload);
        // Clear create form
        setName("");
        setCostPrice("");
        setSalePrice("");
        setStock("5");
        setMinStock("3");
        setMaxStock("10");
        setBarcode("");
        setLocation("");
        setProviderId("");
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar el insumo en catálogo.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSalePrice(p.salePrice || "");
    setStock(p.stock);
    setMinStock(p.minStock);
    setMaxStock(p.maxStock || 10);
    setUnit(p.unit || "unidad");
    setBarcode(p.barcode || "");
    setLocation(p.location || "");
    setProviderId(p.providerId || "");
    setShowEditModal(true);
  };

  const handleDeleteClick = async (p) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar "${p.name}" del catálogo?`);
    if (!confirm) return;

    try {
      await api.delete(`/inventory/products/${p.id}`);
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el producto del inventario.");
    }
  };

  return (
    <Row className="g-4 animate-fade-in">
      {/* List of Products (Left column) */}
      <Col lg={8}>
        <Card className="card-premium border-0 shadow-sm bg-white">
          <Card.Body className="p-4">
            <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
              <Package className="text-purple-600" size={20} />
              <span>Stock General del Salón</span>
            </h3>

            <div className="table-responsive">
              <Table hover responsive className="mb-0 align-middle">
                <thead>
                  <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                    <th className="ps-3 py-3">Nombre del Insumo</th>
                    <th className="py-3">Categoría</th>
                    <th className="py-3">Costo</th>
                    <th className="py-3">Proveedor</th>
                    <th className="py-3 text-center">Stock Físico</th>
                    <th className="py-3 text-center">Alertas</th>
                    <th className="pe-3 py-3 text-center" style={{ width: "90px" }}>Acción</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13.5px" }}>
                  {products.map(p => {
                    const isLow = p.stock < p.minStock;
                    return (
                      <tr key={p.id} className="transition-all hover-row-focus">
                        <td className="ps-3 py-3">
                          <div className="fw-bold text-gray-900">{p.name}</div>
                          {p.location && <div className="smaller text-muted">📍 Ubicación: {p.location}</div>}
                        </td>
                        <td className="py-3">
                          <Badge bg="light" className="text-secondary border rounded-pill px-2.5 py-1.5" style={{ fontSize: "10.5px" }}>
                            {p.category}
                          </Badge>
                        </td>
                        <td className="py-3 fw-bold text-gray-800">{currency(p.costPrice)}</td>
                        <td className="py-3 text-muted small">{p.provider?.name || "Sin Proveedor"}</td>
                        <td className="py-3 text-center">
                          <strong style={{ fontSize: "14px" }} className={isLow ? "text-danger fw-black" : "text-gray-900 fw-bold"}>
                            {p.stock} {p.unit}
                          </strong>
                        </td>
                        <td className="py-3 text-center">
                          {isLow ? (
                            <Badge bg="danger-soft" className="text-danger rounded-pill px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
                              <AlertTriangle size={11} />
                              <span>Crítico (Límite: {p.minStock})</span>
                            </Badge>
                          ) : (
                            <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1.5 fw-bold">Óptimo</Badge>
                          )}
                        </td>
                        <td className="pe-3 py-3 text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <Button 
                              variant="link" 
                              className="text-purple-600 hover-text-purple-800 p-1 bg-transparent border-0"
                              onClick={() => handleEditClick(p)}
                            >
                              <Edit3 size={15} />
                            </Button>
                            <Button 
                              variant="link" 
                              className="text-red-500 hover-text-red-700 p-1 bg-transparent border-0"
                              onClick={() => handleDeleteClick(p)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Create Product Form (Right column) */}
      <Col lg={4}>
        <Card className="card-premium border-0 shadow-sm bg-white">
          <Card.Body className="p-4">
            <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
              <Plus className="text-purple-600" size={18} />
              <span>Añadir Insumo al Catálogo</span>
            </h3>
            
            <Form onSubmit={handleSubmit} className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">Nombre del Producto *</Form.Label>
                <Form.Control
                  placeholder="Ej: Keratina Express 1L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-gray-200 rounded-xl"
                  required
                />
              </Form.Group>

              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Categoría *</Form.Label>
                    <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} className="border-gray-200 rounded-xl">
                      <option value="Coloración">Coloración</option>
                      <option value="Lavado">Lavado</option>
                      <option value="Tratamientos">Tratamientos</option>
                      <option value="Manicuría">Manicuría</option>
                      <option value="Estética">Estética</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Unidad de Medida *</Form.Label>
                    <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)} className="border-gray-200 rounded-xl">
                      <option value="unidad">Unidad</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="gr">Gramos (gr)</option>
                      <option value="litro">Litro</option>
                      <option value="caja">Caja</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Precio Costo ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="4500"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Precio Venta (Opcional)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="9000"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-2">
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Stock Inicial</Form.Label>
                    <Form.Control
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Stock Min</Form.Label>
                    <Form.Control
                      type="number"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Stock Ideal</Form.Label>
                    <Form.Control
                      type="number"
                      value={maxStock}
                      onChange={(e) => setMaxStock(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">Proveedor Asociado</Form.Label>
                <Form.Select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="border-gray-200 rounded-xl">
                  <option value="">Ninguno (Comprado en varios locales)</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Ubicación Interna</Form.Label>
                    <Form.Control
                      placeholder="Ej: Estante A1"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Código Barras/QR</Form.Label>
                    <Form.Control
                      placeholder="Ej: 779012..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button type="submit" variant="purple" disabled={saving} className="rounded-xl py-2.5 mt-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow-sm border-0 d-flex align-items-center justify-content-center gap-2">
                {saving ? <Spinner size="sm" /> : <Plus size={16} />}
                <span>Añadir Producto</span>
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      {/* EDIT PRODUCT DIALOG MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="border-0 shadow-lg animate-fade-in">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Edit3 className="text-purple-600" size={20} />
            <span>Editar Ficha Técnica de Insumo</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Nombre del Insumo *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-200 rounded-xl"
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Categoría *</Form.Label>
                  <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="Coloración">Coloración</option>
                    <option value="Lavado">Lavado</option>
                    <option value="Tratamientos">Tratamientos</option>
                    <option value="Manicuría">Manicuría</option>
                    <option value="Estética">Estética</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Unidad de Medida *</Form.Label>
                  <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="unidad">Unidad</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="gr">Gramos (gr)</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Precio Costo ($) *</Form.Label>
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
                  <Form.Label className="smaller text-muted fw-bold">Precio Venta ($)</Form.Label>
                  <Form.Control
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Actual *</Form.Label>
                  <Form.Control
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Mínimo *</Form.Label>
                  <Form.Control
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Ideal *</Form.Label>
                  <Form.Control
                    type="number"
                    value={maxStock}
                    onChange={(e) => setMaxStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Proveedor Principal</Form.Label>
              <Form.Select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="border-gray-200 rounded-xl">
                <option value="">Ninguno</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Ubicación Almacén</Form.Label>
                  <Form.Control
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Código Barras</Form.Label>
                  <Form.Control
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button variant="outline-secondary" onClick={() => setShowEditModal(false)} className="rounded-xl px-4" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
              {saving ? <Spinner size="sm" /> : "Guardar Cambios"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Row>
  );
}
