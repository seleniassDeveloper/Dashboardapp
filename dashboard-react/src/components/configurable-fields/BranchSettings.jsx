import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Spinner, Alert, Row, Col } from "react-bootstrap";
import { Plus, Edit2, Trash2, MapPin, Phone, User, CheckCircle2, XCircle } from "lucide-react";
import api from "../../lib/api.js";

export default function BranchSettings() {
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/branches");
      setBranches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las sucursales.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get("/workers");
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchWorkers();
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setName("");
    setAddress("");
    setPhone("");
    setManagerId("");
    setIsMain(false);
    setActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setName(branch.name || "");
    setAddress(branch.address || "");
    setPhone(branch.phone || "");
    setManagerId(branch.managerId || "");
    setIsMain(!!branch.isMain);
    setActive(!!branch.active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        managerId: managerId || null,
        isMain,
        active
      };

      if (editingBranch) {
        await api.put(`/finances/branches/${editingBranch.id}`, payload);
      } else {
        await api.post("/finances/branches", payload);
      }

      setShowModal(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la sucursal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer y puede afectar citas asociadas.")) return;

    try {
      await api.delete(`/finances/branches/${id}`);
      fetchBranches();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la sucursal.");
    }
  };

  const getManagerName = (id) => {
    const worker = workers.find(w => w.id === id);
    return worker ? `${worker.firstName} ${worker.lastName}` : "Sin responsable asignado";
  };

  return (
    <div className="bg-white rounded-3 p-4 shadow-sm border">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h5 fw-black text-gray-900 mb-1">Gestión de Sucursales</h2>
          <p className="text-muted small mb-0">Configurá las sucursales, locales comerciales, responsables y estados de operación del negocio.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="rounded-xl px-3.5 py-2 fw-bold text-white d-flex align-items-center gap-1.5 border-0"
          style={{ backgroundColor: "#111827" }}
        >
          <Plus size={16} />
          <span>Agregar Sucursal</span>
        </Button>
      </div>

      {error && <Alert variant="danger" className="rounded-2xl">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" variant="purple" />
          Cargando sucursales...
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
          No hay sucursales registradas todavía. ¡Hacé click en Agregar Sucursal para comenzar!
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover responsive className="mb-0 align-middle">
            <thead>
              <tr className="table-header-small" style={{ fontSize: "11px" }}>
                <th className="ps-4">Nombre</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Responsable</th>
                <th>Principal</th>
                <th>Estado</th>
                <th className="pe-4 text-end">Acciones</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "13px" }}>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="ps-4 py-3 fw-bold text-gray-900">{b.name}</td>
                  <td className="text-muted">
                    {b.address ? (
                      <span className="d-flex align-items-center gap-1">
                        <MapPin size={13} className="text-secondary" />
                        <span>{b.address}</span>
                      </span>
                    ) : (
                      <span className="text-secondary smaller italic">No especificada</span>
                    )}
                  </td>
                  <td className="text-muted">
                    {b.phone ? (
                      <span className="d-flex align-items-center gap-1">
                        <Phone size={13} className="text-secondary" />
                        <span>{b.phone}</span>
                      </span>
                    ) : (
                      <span className="text-secondary smaller italic">No especificado</span>
                    )}
                  </td>
                  <td className="text-gray-700">
                    <span className="d-flex align-items-center gap-1">
                      <User size={13} className="text-secondary" />
                      <span>{getManagerName(b.managerId)}</span>
                    </span>
                  </td>
                  <td>
                    {b.isMain ? (
                      <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1">
                        Principal
                      </Badge>
                    ) : (
                      <span className="text-secondary smaller">—</span>
                    )}
                  </td>
                  <td>
                    {b.active ? (
                      <Badge bg="success-soft" className="text-success rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1">
                        <CheckCircle2 size={10} /> Activo
                      </Badge>
                    ) : (
                      <Badge bg="danger-soft" className="text-danger rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1">
                        <XCircle size={10} /> Inactivo
                      </Badge>
                    )}
                  </td>
                  <td className="pe-4 text-end">
                    <div className="d-inline-flex gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleOpenEdit(b)}
                        className="p-2 rounded-xl border d-inline-flex align-items-center justify-content-center text-gray-700"
                        style={{ width: "32px", height: "32px" }}
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleDelete(b.id)}
                        className="p-2 rounded-xl border d-inline-flex align-items-center justify-content-center text-red-500 hover-bg-red-50"
                        style={{ width: "32px", height: "32px" }}
                        title="Eliminar"
                        disabled={b.isMain}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal para Crear/Editar Sucursal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="border-0 shadow-lg">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark">
            {editingBranch ? "Editar Sucursal" : "Agregar Nueva Sucursal"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Nombre de la Sucursal *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Aura Palermo, Aura Belgrano..."
                className="border-gray-200 rounded-xl"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Dirección Física</Form.Label>
              <Form.Control
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Av. Santa Fe 3400, CABA"
                className="border-gray-200 rounded-xl"
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Teléfono de Contacto</Form.Label>
                  <Form.Control
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 11-5432-8765"
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Responsable / Manager</Form.Label>
                  <Form.Select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  >
                    <option value="">Sin responsable</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3 d-flex align-items-center gap-2">
              <Form.Check
                type="checkbox"
                id="isMain-checkbox"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="custom-checkbox"
              />
              <Form.Label htmlFor="isMain-checkbox" className="m-0 small fw-bold text-dark cursor-pointer">
                Definir como Sucursal Principal (Main Branch)
              </Form.Label>
            </Form.Group>

            <Form.Group className="mb-2 d-flex align-items-center gap-2">
              <Form.Check
                type="checkbox"
                id="active-checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="custom-checkbox"
              />
              <Form.Label htmlFor="active-checkbox" className="m-0 small fw-bold text-dark cursor-pointer">
                Sucursal Operativa / Activa
              </Form.Label>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button
              variant="light"
              onClick={() => setShowModal(false)}
              className="rounded-xl px-4 fw-bold"
              style={{ backgroundColor: "#ffffff", color: "#111827", border: "1px solid #d1d5db" }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="dark"
              disabled={saving}
              className="rounded-xl px-5 fw-bold shadow border-0 text-white"
              style={{ backgroundColor: "#111827" }}
            >
              {saving ? <Spinner size="sm" /> : "Guardar Sucursal"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
