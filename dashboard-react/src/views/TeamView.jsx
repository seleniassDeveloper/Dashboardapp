import React, { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { UserPlus, Mail, Phone, Calendar, Pencil } from "lucide-react";
import WorkerFormModal from "../header/workers/WorkerFormModal.jsx";
import api from "../lib/api.js";

function memberInitials(firstName, lastName) {
  const a = (firstName || "").charAt(0);
  const b = (lastName || "").charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

function compactSchedule(schedules) {
  const days = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return (schedules || [])
    .slice(0, 3)
    .map((s) => `${days[s.dayOfWeek] || "?"} ${s.startTime}–${s.endTime}`)
    .join(" · ");
}

export default function TeamView() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/workers`);
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "No se pudo cargar el equipo.");
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (w) => {
    setEditing(w);
    setShowModal(true);
  };

  const onSaved = () => {
    loadWorkers();
  };

  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3">Tu Equipo</h1>
          <p className="text-muted mb-0">Gestiona el talento, horarios, servicios y tarifas de tus colaboradores.</p>
        </div>
        <Button
          variant="dark"
          className="d-flex align-items-center gap-2 px-4 py-2"
          style={{ borderRadius: "10px" }}
          onClick={openCreate}
        >
          <UserPlus size={18} />
          Añadir Miembro
        </Button>
      </header>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />
          Cargando equipo…
        </div>
      ) : (
        <Row className="g-4">
          {workers.map((member) => {
            const name = `${member.firstName} ${member.lastName}`.trim();
            const serviceCount = member.serviceIds?.length || 0;
            const scheduleText = compactSchedule(member.schedules);

            return (
              <Col xl={4} md={6} key={member.id}>
                <div className="card-premium p-4 h-100 hover-scale">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-primary"
                      style={{ width: 64, height: 64, fontSize: 22 }}>
                      {memberInitials(member.firstName, member.lastName)}
                    </div>
                    <Button variant="light" size="sm" className="p-1" onClick={() => openEdit(member)} title="Editar">
                      <Pencil size={16} />
                    </Button>
                  </div>

                  <div className="mb-3">
                    <h3 className="h6 fw-bold m-0">{name}</h3>
                    <div className="text-muted small">{member.roleTitle || "Colaborador"}</div>
                  </div>

                  <div className="small text-muted mb-3">
                    {serviceCount} servicio{serviceCount !== 1 ? "s" : ""} asignado{serviceCount !== 1 ? "s" : ""}
                    {scheduleText ? ` · ${scheduleText}` : ""}
                  </div>

                  <div className="d-flex flex-column gap-2 border-top pt-3">
                    {member.email && (
                      <div className="d-flex align-items-center gap-3 text-muted small">
                        <Mail size={14} /> {member.email}
                      </div>
                    )}
                    {member.phone && (
                      <div className="d-flex align-items-center gap-3 text-muted small">
                        <Phone size={14} /> {member.phone}
                      </div>
                    )}
                    <div className="d-flex align-items-center gap-3 text-muted small">
                      <Calendar size={14} />
                      {member.schedules?.length ? scheduleText || "Horario configurado" : "Sin horario"}
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}

          <Col xl={4} md={6}>
            <button
              type="button"
              className="card-premium p-4 h-100 w-100 d-flex flex-column align-items-center justify-content-center text-center bg-light border-dashed border-0"
              style={{ minHeight: 250, cursor: "pointer" }}
              onClick={openCreate}
            >
              <div className="p-3 rounded-circle bg-white shadow-sm mb-3">
                <UserPlus size={32} className="text-muted" />
              </div>
              <h4 className="h6 fw-bold">Añadir colaborador</h4>
              <p className="text-muted small px-3 mb-0">
                Completá horarios, servicios y tarifas según el formulario configurado.
              </p>
            </button>
          </Col>
        </Row>
      )}

      <WorkerFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        mode={editing ? "edit" : "create"}
        initialData={editing}
        onSaved={onSaved}
      />
    </Container>
  );
}
