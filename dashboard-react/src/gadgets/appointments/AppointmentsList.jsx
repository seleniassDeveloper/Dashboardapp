import React, { useEffect, useState } from "react";
import { Card, Button, ListGroup, Spinner, Alert, Stack } from "react-bootstrap";
import axios from "axios";
import AppointmentItem from "./AppointmentItem";
import AppointmentModal from "./AppointmentModal";

const API = "http://localhost:3001/api";

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  async function fetchAppointments(signal) {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API}/appointments`, { signal });
      setAppointments(res.data || []);
    } catch (e) {
      if (e.name === "CanceledError") return;
      console.error(e);
      setError("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchAppointments(controller.signal);
    return () => controller.abort();
  }, []);

  function openCreate() {
    setEditingAppt(null);
    setShowModal(true);
  }

  function openEdit(appt) {
    setEditingAppt(appt);
    setShowModal(true);
  }

  async function handleDelete(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar esta cita?");
    if (!ok) return;

    try {
      setError("");
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      await axios.delete(`${API}/appointments/${id}`);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudo eliminar la cita.");
      fetchAppointments();
    }
  }

  function handleSaved() {
    setShowModal(false);
    setEditingAppt(null);
    fetchAppointments();
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Body>
          <Stack direction="horizontal" className="justify-content-between">
            <div>
              <Card.Title className="mb-1">Próximas citas</Card.Title>
              <Card.Text className="text-muted mb-0" style={{ fontSize: 13 }}>
                Lista alimentada desde el formulario
              </Card.Text>
            </div>

            <Button variant="dark" onClick={openCreate}>
              + Nueva cita
            </Button>
          </Stack>

          <div className="mt-3">
            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner size="sm" />
                Cargando...
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-muted">Aún no hay citas.</div>
            ) : (
              <ListGroup>
                {appointments.map((appt) => (
                  <AppointmentItem
                    key={appt.id}
                    appt={appt}
                    onEdit={() => openEdit(appt)}
                    onDelete={() => handleDelete(appt.id)}
                  />
                ))}
              </ListGroup>
            )}
          </div>
        </Card.Body>
      </Card>

      <AppointmentModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingAppt(null);
        }}
        onSaved={handleSaved}
        mode={editingAppt ? "edit" : "create"}
        initialData={editingAppt}
      />
    </>
  );
}