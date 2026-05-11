import React, { useState } from "react";
import { Container, Row, Col, Button, Card, Table, Badge } from "react-bootstrap";
import { Plus, Edit2, Trash2, Scissors, Clock, Tag } from "lucide-react";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider";
import ServiceModal from "../header/services/ServiceModal";
import axios from "axios";

export default function ServicesView() {
  const { services, fetchServices } = useAppointmentsStore();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const handleAdd = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este servicio?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/services/${id}`);
      fetchServices();
    } catch (e) {
      alert("Error eliminando servicio");
    }
  };

  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold h3">Gestión de Servicios</h1>
          <p className="text-muted">Configura los tratamientos y precios que ofreces.</p>
        </div>
        <Button 
          variant="dark" 
          className="d-flex align-items-center gap-2 px-4 py-2"
          onClick={handleAdd}
          style={{ borderRadius: '10px' }}
        >
          <Plus size={18} />
          Nuevo Servicio
        </Button>
      </header>

      <div className="card-premium p-0 overflow-hidden">
        <Table hover responsive className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 border-0">Servicio</th>
              <th className="py-3 border-0">Duración</th>
              <th className="py-3 border-0">Precio</th>
              <th className="py-3 border-0">Estado</th>
              <th className="py-3 border-0 text-end px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)' }}>
                      <Scissors size={18} />
                    </div>
                    <span className="fw-semibold">{s.name}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <Clock size={16} />
                    {s.duration} min
                  </div>
                </td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2 fw-bold text-dark">
                    <Tag size={16} />
                    ${s.price}
                  </div>
                </td>
                <td className="py-3">
                  <Badge bg="success" className="px-2 py-1" style={{ borderRadius: '6px', fontWeight: '500' }}>
                    Activo
                  </Badge>
                </td>
                <td className="py-3 text-end px-4">
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="light" size="sm" onClick={() => handleEdit(s)} className="p-2">
                      <Edit2 size={16} className="text-primary" />
                    </Button>
                    <Button variant="light" size="sm" onClick={() => handleDelete(s.id)} className="p-2">
                      <Trash2 size={16} className="text-danger" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  No hay servicios configurados aún.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <ServiceModal 
        show={showModal} 
        onHide={() => {
          setShowModal(false);
          fetchServices();
        }} 
        editService={editingService}
      />
    </Container>
  );
}
