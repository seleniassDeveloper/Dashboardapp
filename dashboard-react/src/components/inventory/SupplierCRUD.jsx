import React, { useState } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Badge, Modal } from "react-bootstrap";
import { Plus, Edit3, Trash2, User, Phone, Mail, MapPin, Calendar, Clock, CreditCard } from "lucide-react";
import api from "../../lib/api.js";

export default function SupplierCRUD({ suppliers = [], onRefresh }) {
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("contado");
  const [avgDeliveryDays, setAvgDeliveryDays] = useState("5");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        contactName: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        paymentTerms,
        avgDeliveryDays: Number(avgDeliveryDays)
      };

      if (editingSupplier) {
        await api.put(`/inventory/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post("/inventory/suppliers", payload);
      }

      setShowModal(false);
      setName("");
      setContactName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setPaymentTerms("contado");
      setAvgDeliveryDays("5");
      setEditingSupplier(null);

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar proveedor.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (s) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactName(s.contactName || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setAddress(s.address || "");
    setPaymentTerms(s.paymentTerms || "contado");
    setAvgDeliveryDays(s.avgDeliveryDays || "5");
    setShowModal(true);
  };

  const handleDeleteClick = async (s) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar el proveedor "${s.name}"? Se desvincularán sus insumos asociados.`);
    if (!confirm) return;

    try {
      await api.delete(`/inventory/suppliers/${s.id}`);
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al borrar proveedor de la base de datos.");
    }
  };

  const triggerWhatsApp = (phoneStr, nameStr) => {
    const clean = phoneStr.replace(/\D/g, "");
    const msg = encodeURIComponent(`Hola ${nameStr}, te escribo desde el Salón Aura Studio para realizar un pedido de insumos...`);
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
  };

  return (
    <Row className="g-4 animate-fade-in">
      <Col lg={12} className="d-flex justify-content-between align-items-center mb-1">
        <div>
          <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
            <User className="text-purple-600" size={20} />
            <span>Directorio de Proveedores y Distribuidores</span>
          </h3>
          <p className="text-muted smaller mb-0">Administrá contactos de compra, plazos medios de entrega y pliegos de pago pactados.</p>
        </div>
        <Button
          variant="purple"
          className="rounded-xl px-4 py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2 shadow-sm border-0"
          onClick={() => {
            setEditingSupplier(null);
            setName("");
            setContactName("");
            setPhone("");
            setEmail("");
            setAddress("");
            setPaymentTerms("contado");
            setAvgDeliveryDays("5");
            setShowModal(true);
          }}
        >
          <Plus size={16} />
          <span>Añadir Proveedor</span>
        </Button>
      </Col>

      {suppliers.length === 0 ? (
        <Col xs={12}>
          <div className="text-center py-5 text-muted small bg-white rounded-2xl border p-5">
            Cargando directorio de distribuidores de belleza...
          </div>
        </Col>
      ) : (
        suppliers.map(s => (
          <Col lg={4} md={6} key={s.id}>
            <Card className="card-premium border-0 shadow-sm bg-white h-100 p-4 rounded-2xl d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3.5">
                  <Badge bg="purple-soft" className="text-purple rounded-pill px-3 py-1.5 fw-bold" style={{ fontSize: "11px" }}>
                    Distribuidor
                  </Badge>
                  <div className="d-flex align-items-center gap-1">
                    <Button variant="link" className="p-1 text-secondary hover-text-purple-600 bg-transparent border-0" onClick={() => handleEditClick(s)}><Edit3 size={15} /></Button>
                    <Button variant="link" className="p-1 text-red-500 hover-text-red-700 bg-transparent border-0" onClick={() => handleDeleteClick(s)}><Trash2 size={15} /></Button>
                  </div>
                </div>

                <h4 className="fw-black text-gray-900 h6 mb-1.5">{s.name}</h4>
                {s.contactName && <div className="small text-secondary mb-3">👤 Atención: <strong>{s.contactName}</strong></div>}

                <div className="d-grid gap-2 small text-muted mb-4">
                  {s.phone && (
                    <div className="d-flex align-items-center gap-2">
                      <Phone size={14} className="text-purple-500" />
                      <span className="cursor-pointer text-purple-600 fw-semibold" onClick={() => triggerWhatsApp(s.phone, s.contactName || s.name)}>
                        {s.phone} (WhatsApp)
                      </span>
                    </div>
                  )}
                  {s.email && (
                    <div className="d-flex align-items-center gap-2">
                      <Mail size={14} className="text-purple-500" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={14} className="text-purple-500" />
                      <span className="text-truncate">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-top pt-3 d-flex justify-content-between align-items-center gap-2 mt-auto">
                <div className="d-flex align-items-center gap-1 smaller text-muted">
                  <Clock size={13} />
                  <span>Entrega: <strong>{s.avgDeliveryDays} días</strong></span>
                </div>
                <div className="d-flex align-items-center gap-1 smaller text-muted">
                  <CreditCard size={13} />
                  <span className="capitalize-override" style={{ textTransform: "capitalize" }}><strong>{s.paymentTerms}</strong></span>
                </div>
              </div>
            </Card>
          </Col>
        ))
      )}

      {/* POPUP MODAL TO CREATE/EDIT SUPPLIER */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="border-0 shadow-lg">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            {editingSupplier ? <Edit3 className="text-purple-600" size={20} /> : <Plus className="text-purple-600" size={20} />}
            <span>{editingSupplier ? "Editar Proveedor" : "Añadir Proveedor"}</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Razón Social / Nombre Distribuidor *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Distribuidora Cosmética Profesional"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-200 rounded-xl"
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Persona de Contacto</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Mariela Sanchez"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">WhatsApp / Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 54911..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ej: ventas@proveedor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Dirección Física</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Florida 500, CABA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Plazos de Pago Pactados</Form.Label>
                  <Form.Select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="contado">Contado</option>
                    <option value="15d">15 días</option>
                    <option value="30d">30 días</option>
                    <option value="60d">60 días</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Plazo Promedio de Entrega (Días)</Form.Label>
                  <Form.Control
                    type="number"
                    value={avgDeliveryDays}
                    onChange={(e) => setAvgDeliveryDays(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="rounded-xl px-4" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
              {saving ? <Spinner size="sm" /> : "Guardar Proveedor"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Row>
  );
}
