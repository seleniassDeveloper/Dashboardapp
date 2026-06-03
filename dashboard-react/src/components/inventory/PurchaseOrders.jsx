import React, { useState, useEffect } from "react";
import { Card, Table, Button, Form, Row, Col, Spinner, Alert, Badge, Modal } from "react-bootstrap";
import { ShoppingCart, Plus, Calendar, User, Clock, FileText, Send, Check } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function PurchaseOrders({ products = [], suppliers = [], onRefresh }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Modal for new order
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState([]); // [{ productId, quantity, price }]
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/inventory/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las órdenes de compra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSupplierChange = (supId) => {
    setSelectedSupplierId(supId);
    if (!supId) {
      setOrderItems([]);
      return;
    }

    // Auto-suggest products below stock limit associated with this supplier
    const associatedLowProducts = products.filter(
      p => p.providerId === supId && p.stock < p.minStock
    );

    const initialItems = associatedLowProducts.map(p => ({
      productId: p.id,
      name: p.name,
      quantity: Math.max(1, p.maxStock - p.stock), // Suggest buying up to ideal stock (maxStock)
      price: p.costPrice
    }));

    setOrderItems(initialItems);
  };

  const handleAddItem = () => {
    setOrderItems(prev => [...prev, { productId: "", quantity: 1, price: 1000 }]);
  };

  const handleRemoveItem = (idx) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === idx) {
        if (field === "productId") {
          const matchedProd = products.find(p => p.id === val);
          return {
            ...item,
            productId: val,
            name: matchedProd?.name || "",
            price: matchedProd?.costPrice || 1000
          };
        }
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId || orderItems.length === 0) return;

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {
        supplierId: selectedSupplierId,
        notes: notes.trim(),
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          price: Number(item.price)
        }))
      };

      await api.post("/inventory/orders", payload);
      setOkMsg("¡Orden de compra generada con éxito! Estado: Borrador.");
      setShowAddModal(false);
      setSelectedSupplierId("");
      setNotes("");
      setOrderItems([]);
      await fetchOrders();
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError("Error al crear la orden de compra.");
    } finally {
      setSaving(false);
    }
  };

  const handleReceiveOrder = async (id) => {
    const confirm = window.confirm("¿Confirmas la recepción de este pedido? Se incrementará el stock real del salón y se crearán los lotes automáticamente.");
    if (!confirm) return;

    try {
      setLoading(true);
      await api.put(`/inventory/orders/${id}`, { status: "RECEIVED" });
      setOkMsg("¡Pedido recibido con éxito! Stock incrementado en Neon DB.");
      await fetchOrders();
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError("Error al registrar recepción de mercadería.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return <Badge bg="secondary" className="rounded-pill px-2.5">Borrador</Badge>;
      case "SENT":
        return <Badge bg="primary" className="rounded-pill px-2.5">Enviado</Badge>;
      case "RECEIVED":
        return <Badge bg="success" className="rounded-pill px-2.5">Recibido</Badge>;
      default:
        return <Badge bg="danger" className="rounded-pill px-2.5">Cancelado</Badge>;
    }
  };

  const triggerSend = (order) => {
    const cleanPhone = order.supplier.phone?.replace(/\D/g, "") || "";
    const itemsText = order.items.map(i => `- ${i.product.name}: ${i.quantity} ${i.product.unit || "unidad"}`).join("\n");
    const text = `Hola ${order.supplier.contactName || order.supplier.name}, te escribo del Salón Aura Studio para realizar un pedido de insumos:\n\n${itemsText}\n\nQuedamos a la espera del presupuesto. ¡Muchas gracias!`;
    
    // Switch status to SENT
    api.put(`/inventory/orders/${order.id}`, { status: "SENT" })
      .then(() => {
        fetchOrders();
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      })
      .catch(e => console.error(e));

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl animate-fade-in">
      <Card.Body className="p-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
              <ShoppingCart className="text-purple-600" size={20} />
              <span>Gestión de Pedidos de Reposición</span>
            </h3>
            <p className="text-muted smaller mb-0">Calculá compras sugeridas según el stock ideal y generá plantillas directas para tus proveedores.</p>
          </div>
          <Button
            variant="purple"
            className="rounded-xl px-4 py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2 shadow-sm border-0"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Crear Solicitud de Compra</span>
          </Button>
        </div>

        {error && <Alert variant="danger" className="rounded-2xl">{error}</Alert>}
        {okMsg && <Alert variant="success" className="rounded-2xl">{okMsg}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-2xl border border-gray-150">
            No se cargaron solicitudes de reabastecimiento en la bitácora contable.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                  <th className="ps-3 py-3">Código</th>
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Proveedor</th>
                  <th className="py-3">Artículos Solicitados</th>
                  <th className="py-3 text-end">Total Estimado</th>
                  <th className="py-3 text-center">Estado</th>
                  <th className="pe-3 py-3 text-center" style={{ width: "200px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {orders.map(order => (
                  <tr key={order.id} className="transition-all hover-row-focus">
                    <td className="ps-3 py-3 fw-bold text-dark">
                      OC-{order.id.slice(-4).toUpperCase()}
                    </td>
                    <td className="py-3 text-secondary">
                      {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-3">
                      <div className="fw-bold text-gray-900">{order.supplier.name}</div>
                      {order.supplier.contactName && <div className="smaller text-muted">👤 {order.supplier.contactName}</div>}
                    </td>
                    <td className="py-3 text-muted">
                      {order.items.map(i => `${i.product.name} (x${i.quantity})`).join(", ")}
                    </td>
                    <td className="py-3 text-end fw-bold text-gray-800">
                      {currency(order.totalAmount)}
                    </td>
                    <td className="py-3 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="pe-3 py-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1.5">
                        {order.status === "DRAFT" && (
                          <Button
                            variant="outline-purple"
                            size="sm"
                            className="rounded-xl px-3 py-1.5 fw-bold d-flex align-items-center gap-1 border-0 bg-transparent text-purple-600 hover-text-purple-800"
                            onClick={() => triggerSend(order)}
                            title="Enviar pedido por WhatsApp"
                          >
                            <Send size={13} />
                            <span>Enviar</span>
                          </Button>
                        )}
                        {order.status === "SENT" && (
                          <Button
                            variant="success"
                            size="sm"
                            className="rounded-xl px-3 py-1.5 fw-bold d-flex align-items-center gap-1 border-0 text-white bg-emerald-600 hover-bg-emerald-700"
                            onClick={() => handleReceiveOrder(order.id)}
                            title="Registrar mercadería recibida"
                          >
                            <Check size={13} />
                            <span>Recibir</span>
                          </Button>
                        )}
                        {order.status === "RECEIVED" && (
                          <span className="text-success smaller fw-bold d-flex align-items-center gap-1">
                            <Check size={14} /> Stock Ingresado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* MODAL TO CREATE ORDER */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered className="border-0 shadow-lg animate-fade-in">
          <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
            <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
              <ShoppingCart className="text-purple-600" size={20} />
              <span>Redactar Solicitud de Pedido Sugerida</span>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreateOrder}>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="smaller text-muted fw-bold">Seleccionar Proveedor *</Form.Label>
                <Form.Select
                  value={selectedSupplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="border-gray-200 rounded-xl"
                  required
                >
                  <option value="">Elegí un proveedor para auto-completar compras sugeridas...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedSupplierId && (
                <div>
                  <h4 className="smaller text-purple-950 fw-bold mb-3 d-flex align-items-center justify-content-between">
                    <span>Lista de Ítems a Comprar:</span>
                    <Button variant="outline-dark" size="sm" onClick={handleAddItem} className="rounded-pill px-2.5 py-1 small">
                      + Añadir Producto Manual
                    </Button>
                  </h4>

                  {orderItems.length === 0 ? (
                    <div className="text-center py-4 smaller text-muted bg-gray-50 border rounded-xl mb-3">
                      Este proveedor no tiene insumos bajo stock crítico. Podés añadirlos manualmente.
                    </div>
                  ) : (
                    <div className="d-grid gap-2 mb-3">
                      {orderItems.map((item, idx) => (
                        <Row className="g-2 align-items-center" key={idx}>
                          <Col md={6}>
                            <Form.Select
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                              className="border-gray-200 rounded-xl"
                              required
                            >
                              <option value="">Elegí producto...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}/{p.minStock})</option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Control
                              type="number"
                              placeholder="Cant"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              className="border-gray-200 rounded-xl"
                              required
                            />
                          </Col>
                          <Col md={2}>
                            <Form.Control
                              type="number"
                              placeholder="Costo"
                              value={item.price}
                              onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                              className="border-gray-200 rounded-xl"
                              required
                            />
                          </Col>
                          <Col md={1} className="text-center">
                            <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveItem(idx)}>X</Button>
                          </Col>
                        </Row>
                      ))}
                    </div>
                  )}

                  <Form.Group className="mb-2">
                    <Form.Label className="smaller text-muted fw-bold">Observaciones / Notas del Pedido</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Solicitar vencimiento mayor a 12 meses..."
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
              <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} className="rounded-xl px-4" disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="purple" disabled={saving || !selectedSupplierId} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
                {saving ? <Spinner size="sm" /> : "Guardar Pedido"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Card.Body>
    </Card>
  );
}
