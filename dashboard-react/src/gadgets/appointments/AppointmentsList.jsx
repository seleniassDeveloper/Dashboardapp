import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Button,
  ListGroup,
  Spinner,
  Alert,
  Stack,
} from "react-bootstrap";
import axios from "axios";

import AppointmentItem from "./AppointmentItem";
import AppointmentModal from "./AppointmentModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const API = "http://localhost:3001/api";

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // create/edit
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  // delete
  const [showDelete, setShowDelete] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState(null);

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

  // 🔍 ESTE useEffect te dice el valor REAL de showDelete
  useEffect(() => {
    console.log("✅ showDelete cambió a:", showDelete);
  }, [showDelete]);

  // CREATE/EDIT
  const handleOpenCreate = useCallback(() => {
    setEditingAppt(null);
    setShowForm(true);
  }, []);

  const handleOpenEdit = useCallback((appt) => {
    setEditingAppt(appt);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingAppt(null);
  }, []);

  const handleSaved = useCallback(() => {
    handleCloseForm();
    fetchAppointments();
  }, [handleCloseForm]);

const handleOpenDelete = useCallback((appt) => {
  setDeletingAppt(appt);
  setShowDelete(true);
}, []);

  const handleCloseDelete = useCallback(() => {
    setShowDelete(false);
    setDeletingAppt(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingAppt?.id) return;

    try {
      setError("");
      await axios.delete(`${API}/appointments/${deletingAppt.id}`);
      setAppointments((prev) => prev.filter((a) => a.id !== deletingAppt.id));
      handleCloseDelete();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudo eliminar la cita.");
    }
  }, [deletingAppt, handleCloseDelete]);

  console.log("ConfirmDeleteModal import =", ConfirmDeleteModal);
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

            <Button variant="dark" onClick={handleOpenCreate}>
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
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </ListGroup>
            )}
          </div>
        </Card.Body>
      </Card>

      <AppointmentModal
        show={showForm}
        onHide={handleCloseForm}
        onSaved={handleSaved}
        mode={editingAppt ? "edit" : "create"}
        initialData={editingAppt}
      />

      <ConfirmDeleteModal
        show={showDelete}
        appt={deletingAppt}
        onHide={handleCloseDelete}
        onDeleted={(deletedId) => {
          setAppointments((prev) => prev.filter((a) => a.id !== deletedId));
          handleCloseDelete();
        }}
        onError={(msg) => setError(msg)}
      />
    </>
  );
}
