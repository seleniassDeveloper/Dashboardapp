import { Modal, Button } from "react-bootstrap";

export default function ConfirmDeleteModal({
  show,
  onHide,
  onConfirm,
  appointment,
  loading = false,
}) {
  if (!appointment) return null;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Confirmar eliminación</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>¿Estás segura de que quieres eliminar esta cita?</p>

        <div className="border rounded p-2 bg-light">
          <strong>Cliente:</strong> {appointment.client?.fullName || "—"} <br />
          <strong>Servicio:</strong> {appointment.service?.name || "—"} <br />
          <strong>Fecha:</strong>{" "}
          {appointment.startsAt
            ? new Date(appointment.startsAt).toLocaleString()
            : "—"}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Eliminando..." : "Eliminar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
