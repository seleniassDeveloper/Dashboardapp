import React, { useState } from "react";
import { Container, Row, Col, Button, Card, Table, Badge } from "react-bootstrap";
import { Plus, Edit2, Trash2, Scissors, Clock, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider";
import ServiceModal from "../header/services/ServiceModal";
import api from "../lib/api.js";

export default function ServicesView() {
  const { t } = useTranslation("views");
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
    if (!window.confirm(t("services.confirmDelete"))) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (e) {
      alert(t("services.deleteError"));
    }
  };

  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold h3">{t("services.title")}</h1>
          <p className="text-muted">{t("services.subtitle")}</p>
        </div>
        <Button
          variant="dark"
          className="d-flex align-items-center gap-2 px-4 py-2"
          onClick={handleAdd}
          style={{ borderRadius: '10px' }}
        >
          <Plus size={18} />
          {t("services.newService")}
        </Button>
      </header>

      <div className="card-premium p-0 overflow-hidden">
        <Table hover responsive className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 border-0">{t("services.table.service")}</th>
              <th className="py-3 border-0">{t("services.table.duration")}</th>
              <th className="py-3 border-0">{t("services.table.price")}</th>
              <th className="py-3 border-0">{t("services.table.professionals")}</th>
              <th className="py-3 border-0 text-end px-4">{t("services.table.actions")}</th>
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
                    {s.duration} {t("services.minShort")}
                  </div>
                </td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2 fw-bold text-dark">
                    <Tag size={16} />
                    ${s.price}
                  </div>
                </td>
                <td className="py-3">
                  <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "250px" }}>
                    {s.workers && s.workers.length > 0 ? (
                      s.workers.map(({ worker }) => (
                        <span
                          key={worker.id}
                          className="rounded-pill px-2.5 py-1 fw-bold border"
                          style={{
                            fontSize: "11.5px",
                            backgroundColor: "#f3e8ff",
                            color: "#6b21a8",
                            borderColor: "#d8b4fe",
                            display: "inline-block"
                          }}
                        >
                          {worker.firstName} {worker.lastName?.charAt(0) || ""}.
                        </span>
                      ))
                    ) : (
                      <span className="text-muted smaller italic">{t("services.noWorkers")}</span>
                    )}
                  </div>
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
                  {t("services.empty")}
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
