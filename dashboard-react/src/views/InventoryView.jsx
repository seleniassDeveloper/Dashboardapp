import React, { useState } from "react";
import { Container, Row, Col, Card, Table, Button, Badge, Form, Alert } from "react-bootstrap";
import { Package, AlertTriangle, CreditCard, DollarSign, Plus, ArrowRight, ShoppingCart, CheckCircle2, Scissors } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function InventoryView() {
  const [products, setProducts] = useState([
    { id: 1, name: "Tinta L'Oreal Majirel 7.1", category: "Coloración", stock: 3, limit: 8, cost: 4500, provider: "Distribuidora Belleza Sur", service: "Coloración Total" },
    { id: 2, name: "Shampoo PH Neutro Premium 5L", category: "Lavado", stock: 1, limit: 3, cost: 12000, provider: "L'Oreal Express", service: "Corte Diseñador" },
    { id: 3, name: "Keratina Hidrolizada 1L", category: "Tratamientos", stock: 6, limit: 5, cost: 28000, provider: "Distribuidora Belleza Sur", service: "Tratamiento Keratina" },
    { id: 4, name: "Esmalte Meliné Semipermanente", category: "Manicuría", stock: 14, limit: 5, cost: 3200, provider: "Manicura Pro", service: "Manicuría Rusa" },
    { id: 5, name: "Crema Oxidante 20 Vol 1L", category: "Coloración", stock: 2, limit: 4, cost: 6500, provider: "Distribuidora Belleza Sur", service: "Balayage Premium" },
  ]);

  const [relations, setRelations] = useState([
    { id: 1, service: "Coloración Total", product: "Tinta L'Oreal Majirel 7.1", qty: "1 tubo" },
    { id: 2, service: "Tratamiento Keratina", product: "Keratina Hidrolizada 1L", qty: "50 ml" },
    { id: 3, service: "Manicuría Rusa", product: "Esmalte Meliné Semipermanente", qty: "1/10 frasco" },
  ]);

  const [newProduct, setNewProduct] = useState({ name: "", category: "Coloración", stock: 5, limit: 3, cost: 1000, provider: "" });
  const [newRelation, setNewRelation] = useState({ service: "Coloración Total", product: "Tinta L'Oreal Majirel 7.1", qty: "1 unidad" });
  const [showOk, setShowOk] = useState("");

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name) return;
    setProducts(prev => [...prev, { ...newProduct, id: Date.now() }]);
    setShowOk(`Producto "${newProduct.name}" añadido exitosamente.`);
    setNewProduct({ name: "", category: "Coloración", stock: 5, limit: 3, cost: 1000, provider: "" });
    setTimeout(() => setShowOk(""), 4000);
  };

  const handleAddRelation = (e) => {
    e.preventDefault();
    setRelations(prev => [...prev, { ...newRelation, id: Date.now() }]);
    setShowOk(`Vínculo de consumo para "${newRelation.service}" configurado.`);
    setTimeout(() => setShowOk(""), 4000);
  };

  const updateStock = (id, delta) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextStock = p.stock + delta >= 0 ? p.stock + delta : 0;
        return { ...p, stock: nextStock };
      }
      return p;
    }));
  };

  // Métricas de Inventario
  const metrics = React.useMemo(() => {
    const lowStockCount = products.filter(p => p.stock < p.limit).length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const totalUnique = products.length;

    return { lowStockCount, totalValue, totalUnique };
  }, [products]);

  const handleDraftOrder = () => {
    const low = products.filter(p => p.stock < p.limit);
    if (low.length === 0) {
      alert("Todos los productos tienen niveles de stock saludables.");
      return;
    }
    const text = `Pedido de Insumos - Aura Studio:\n\n` + 
      low.map(p => `- ${p.name}: Comprar ${p.limit * 2} unidades (Stock actual: ${p.stock}/${p.limit} crítico).`).join("\n") +
      `\n\nPor favor, presupuestar a la brevedad.`;
    navigator.clipboard.writeText(text);
    alert("¡Pedido de reposición redactado y copiado al portapapeles con éxito! Podés enviárselo a tu distribuidor.");
  };

  return (
    <Container fluid className="py-4">
      <header className="mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-4">
            <Package size={28} />
          </div>
          <div>
            <h1 className="section-title">Control de Inventario</h1>
            <p className="section-subtitle mb-0">Controlá insumos, stock crítico, costos de compra y consumos automáticos por servicio.</p>
          </div>
        </div>
      </header>

      {showOk && <Alert variant="success" className="rounded-4 mb-4 shadow-sm">{showOk}</Alert>}

      {/* METRICAS DE CABECERA */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="card-premium p-4 border-0 shadow-sm">
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-danger bg-opacity-10 text-danger"><AlertTriangle size={20} /></div>
              {metrics.lowStockCount > 0 && <Badge bg="danger" className="rounded-pill px-2.5 py-1">Urgente</Badge>}
            </div>
            <div className="text-muted small">Insumos bajo Stock Crítico</div>
            <div className="h2 fw-black text-dark m-0">{metrics.lowStockCount} artículos</div>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-premium p-4 border-0 shadow-sm">
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-success bg-opacity-10 text-success"><DollarSign size={20} /></div>
              <span className="text-muted smaller">Valuación Real</span>
            </div>
            <div className="text-muted small">Valor total en Stock</div>
            <div className="h2 fw-black text-success m-0">{currency(metrics.totalValue)}</div>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-premium p-4 border-0 shadow-sm">
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-primary bg-opacity-10 text-primary"><Package size={20} /></div>
              <span className="text-muted smaller">Artículos Únicos</span>
            </div>
            <div className="text-muted small">Insumos en Catálogo</div>
            <div className="h2 fw-black text-dark m-0">{metrics.totalUnique} productos</div>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        
        {/* TABLA PRINCIPAL: STOCK EN TIEMPO REAL */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h3 className="h6 fw-black text-dark m-0">Stock del Salón</h3>
                <Button variant="danger" size="sm" onClick={handleDraftOrder} className="rounded-pill px-3 py-1.5 btn-premium bg-danger border-danger small">
                  <ShoppingCart size={13} className="me-1.5" />
                  <span>Redactar Pedido de Reposición</span>
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px" }}>
                      <th className="ps-3">Nombre</th>
                      <th>Categoría</th>
                      <th>Costo unitario</th>
                      <th>Proveedor</th>
                      <th>Servicio</th>
                      <th className="text-center">Stock Actual</th>
                      <th className="pe-3 text-end">Alertas</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px" }}>
                    {products.map(p => {
                      const isLow = p.stock < p.limit;
                      return (
                        <tr key={p.id}>
                          <td className="ps-3 fw-semibold text-dark">{p.name}</td>
                          <td>
                            <Badge bg="light" className="text-secondary border rounded-pill px-2.5">{p.category}</Badge>
                          </td>
                          <td className="fw-bold text-dark">{currency(p.cost)}</td>
                          <td className="text-muted small">{p.provider || "General"}</td>
                          <td className="fw-semibold text-dark">{p.service || "Varios"}</td>
                          <td className="text-center">
                            <div className="d-inline-flex align-items-center gap-2">
                              <Button variant="outline-dark" size="sm" className="rounded-circle px-2 py-0 border" style={{ fontSize: "11px" }} onClick={() => updateStock(p.id, -1)}>-</Button>
                              <strong className="text-dark px-1" style={{ fontSize: "13px" }}>{p.stock}</strong>
                              <Button variant="outline-dark" size="sm" className="rounded-circle px-2 py-0 border" style={{ fontSize: "11px" }} onClick={() => updateStock(p.id, 1)}>+</Button>
                            </div>
                          </td>
                          <td className="pe-3 text-end">
                            {isLow ? (
                              <Badge bg="danger-soft" className="text-danger rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1">
                                <AlertTriangle size={11} />
                                <span>Bajo Stock (Límite: {p.limit})</span>
                              </Badge>
                            ) : (
                              <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1">Óptimo</Badge>
                            )}
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

        {/* ACCIONES RÁPIDAS: AÑADIR PRODUCTO & ASOCIAR SERVICIO */}
        <Col lg={4}>
          <div className="d-grid gap-4">
            
            {/* AGREGAR NUEVO INSUMO */}
            <Card className="card-premium border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="h6 fw-black text-dark mb-3">Agregar Insumo al Catálogo</h3>
                <Form onSubmit={handleAddProduct} className="d-grid gap-3">
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Nombre del Producto</Form.Label>
                    <Form.Control
                      placeholder="Ej: Keratina Express 1L"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="modern-input"
                      required
                    />
                  </Form.Group>

                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Categoría</Form.Label>
                        <Form.Select value={newProduct.category} onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))} className="modern-input">
                          <option value="Coloración">Coloración</option>
                          <option value="Lavado">Lavado</option>
                          <option value="Tratamientos">Tratamientos</option>
                          <option value="Manicuría">Manicuría</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Precio Costo</Form.Label>
                        <Form.Control
                          type="number"
                          value={newProduct.cost}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, cost: Number(e.target.value) }))}
                          className="modern-input"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Stock Inicial</Form.Label>
                        <Form.Control
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                          className="modern-input"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Stock Límite</Form.Label>
                        <Form.Control
                          type="number"
                          value={newProduct.limit}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, limit: Number(e.target.value) }))}
                          className="modern-input"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button type="submit" variant="dark" className="btn-premium justify-content-center py-2.5 mt-2">
                    <Plus size={16} />
                    <span>Añadir Producto</span>
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {/* RELACIÓN SERVICIO ↔ PRODUCTO */}
            <Card className="card-premium border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="h6 fw-black text-dark mb-3 d-flex align-items-center gap-2">
                  <Scissors size={16} className="text-primary" />
                  <span>Consumo Automático por Servicio</span>
                </h3>
                <p className="text-muted smaller mb-3">Define qué insumo y qué cantidad se rebaja automáticamente al realizar cada servicio.</p>

                <Form onSubmit={handleAddRelation} className="d-grid gap-3 bg-light p-3 rounded-4 border mb-4">
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Elegir Servicio</Form.Label>
                    <Form.Select value={newRelation.service} onChange={(e) => setNewRelation(prev => ({ ...prev, service: e.target.value }))} className="modern-input">
                      <option value="Coloración Total">Coloración Total</option>
                      <option value="Balayage Premium">Balayage Premium</option>
                      <option value="Tratamiento Keratina">Tratamiento Keratina</option>
                      <option value="Manicuría Rusa">Manicuría Rusa</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Asociar Insumo</Form.Label>
                    <Form.Select value={newRelation.product} onChange={(e) => setNewRelation(prev => ({ ...prev, product: e.target.value }))} className="modern-input">
                      {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Cantidad de Consumo</Form.Label>
                    <Form.Control
                      placeholder="Ej: 50 ml, 1 tubo, 1 ampolla"
                      value={newRelation.qty}
                      onChange={(e) => setNewRelation(prev => ({ ...prev, qty: e.target.value }))}
                      className="modern-input"
                      required
                    />
                  </Form.Group>

                  <Button type="submit" variant="dark" className="btn-premium justify-content-center py-2 mt-1 small">
                    <CheckCircle2 size={13} className="me-1.5" />
                    <span>Vincular Insumo</span>
                  </Button>
                </Form>

                <h4 className="smaller text-dark fw-bold mb-2">Relaciones Existentes:</h4>
                <div className="d-grid gap-2 overflow-auto" style={{ maxHeight: "150px" }}>
                  {relations.map(r => (
                    <div key={r.id} className="p-2 border.soft rounded-3 bg-white d-flex align-items-center justify-content-between text-dark smaller">
                      <div>
                        <strong>{r.service}</strong>
                        <div className="text-muted smaller">Insumo: {r.product}</div>
                      </div>
                      <Badge bg="primary-soft" className="text-primary rounded-pill px-2.5">{r.qty}</Badge>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

          </div>
        </Col>
      </Row>
    </Container>
  );
}
