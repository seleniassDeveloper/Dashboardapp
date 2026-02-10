import React, { useEffect, useState } from "react";
import { Modal, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

const API = "http://localhost:3001/api";

export default function ConfirmDeleteModal({
  show,
  onHide,
  appt,
  onDeleted,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (show) setLocalError("");
  }, [show]);

  async function handleDelete() {
    if (!appt?.id) return;

    try {
      setLoading(true);
      setLocalError("");

      await axios.delete(`${API}/appointments/${appt.id}`);

      onDeleted?.(appt.id);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || "No se pudo eliminar la cita.";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  const client = appt?.client?.fullName ?? "—";
  const service = appt?.service?.name ?? "—";
  const when = appt?.startsAt ? new Date(appt.startsAt).toLocaleString() : "—";

  return (
    <Modal show={show} onHide={loading ? undefined : onHide} centered backdrop="static">
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Confirmar eliminación</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {localError ? <Alert variant="danger">{localError}</Alert> : null}

        {!appt ? (
          <div className="text-muted">Cargando...</div>
        ) : (
          <>
            <p className="mb-3">¿Seguro que quieres eliminar esta cita?</p>

            <div className="p-3 rounded border bg-light">
              <div><strong>Cliente:</strong> {client}</div>
              <div><strong>Servicio:</strong> {service}</div>
              <div><strong>Fecha:</strong> {when}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>ID: {appt.id}</div>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>

        <Button variant="danger" onClick={handleDelete} disabled={loading || !appt?.id}>
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Eliminando...
            </>
          ) : (
            "Eliminar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}