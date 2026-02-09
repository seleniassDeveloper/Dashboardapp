import React, { useEffect, useState } from "react";
import { Card, Button, ListGroup, Spinner, Alert, Stack } from "react-bootstrap";
import axios from "axios";
import AppointmentItem from "./AppointmentItem";
import AppointmentModal from "./AppointmentModal";

const API = "http://localhost:3001/api";

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function fetchAppointments() {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API}/appointments`);
      setAppointments(res.data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

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

            <Button variant="dark" onClick={() => setShowModal(true)}>
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
                  <AppointmentItem key={appt.id} appt={appt} />
                ))}
              </ListGroup>
            )}
          </div>
        </Card.Body>
      </Card>

      <AppointmentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onCreated={() => {
          setShowModal(false);
          fetchAppointments();
        }}
      />
    </>
  );
}