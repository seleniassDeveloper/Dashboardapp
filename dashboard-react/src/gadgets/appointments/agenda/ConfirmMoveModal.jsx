import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Alert, Badge } from "react-bootstrap";
import { ArrowRight, Check, X, AlertTriangle, User, Clock, Calendar } from "lucide-react";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ConfirmMoveModal({
  show,
  pendingMove,
  workers = [],
  onCancel,
  onConfirm,
  validateSlotAvailability,
}) {
  if (!pendingMove) return null;

  const {
    appointment,
    originalWorkerId,
    originalStartTime,
    originalDate,
    newWorkerId,
    newDate,
    newStartTime,
  } = pendingMove;

  // 1. Selector local para Nuevo Profesional
  const [selectedWorkerId, setSelectedWorkerId] = useState(newWorkerId);
  const [validationError, setValidationError] = useState("");

  // Estilistas actual y sugerido
  const originalWorker = useMemo(() => workers.find(w => w.id === originalWorkerId), [workers, originalWorkerId]);
  const newWorker = useMemo(() => workers.find(w => w.id === selectedWorkerId), [workers, selectedWorkerId]);

  // Duración y cálculos
  const duration = appointment.service?.duration || 60;

  // Recalcular hora de fin y validar choque reactivamente
  const totals = useMemo(() => {
    let endTimeStr = "—";
    if (newStartTime && duration) {
      const [h, m] = newStartTime.split(":").map(Number);
      const totalMinutes = h * 60 + m + duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")} hs`;
    }
    return { endTimeStr };
  }, [newStartTime, duration]);

  // Ejecutar validación reactiva al cambiar de estilista
  useEffect(() => {
    if (!show) return;

    // Crear la fecha/hora en formato local para validación
    const checkStart = new Date(`${newDate}T${newStartTime}`);
    
    // Llamar al validador reactivo
    const validation = validateSlotAvailability(
      selectedWorkerId,
      checkStart,
      duration,
      appointment.id
    );

    if (!validation.valid) {
      setValidationError(validation.reason);
    } else {
      setValidationError("");
    }
  }, [selectedWorkerId, newDate, newStartTime, duration, appointment.id, validateSlotAvailability, show]);

  // Confirmar reubicación
  const handleConfirm = () => {
    if (validationError) return;
    onConfirm(selectedWorkerId);
  };

  const clientName = `${appointment.client?.firstName || "Cliente"} ${appointment.client?.lastName || ""}`.trim();
  const serviceName = appointment.service?.name || "Servicio";

  return (
    <Modal show={show} onHide={onCancel} centered size="lg" className="hegemonic-modal confirmation-move-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-black h4 text-dark d-flex align-items-center gap-2">
          <AlertTriangle className="text-warning animate-pulse" size={24} />
          <span>¿Estás seguro de que querés cambiar esta cita?</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {/* Detalle de la cita */}
        <div className="p-3 bg-light rounded-4 border-start border-dark border-4 mb-4">
          <Row className="align-items-center">
            <Col md={7}>
              <span className="text-muted smaller fw-bold d-block">DETALLES DE LA CITA</span>
              <strong className="text-dark h5 fw-black m-0">{clientName}</strong>
              <div className="text-muted smaller mt-1 d-flex flex-wrap gap-2">
                <span className="badge bg-secondary-soft text-dark border">{serviceName}</span>
                <span className="badge bg-secondary-soft text-dark border">Duración: {duration} min</span>
              </div>
            </Col>
            <Col md={5} className="text-md-end mt-2 mt-md-0">
              <span className="text-muted smaller fw-bold d-block">TOTAL DEL TURNO</span>
              <strong className="text-dark h5 fw-black">{currency(appointment.service?.price)}</strong>
            </Col>
          </Row>
        </div>

        {/* Comparador Antes vs Después */}
        <Row className="g-3">
          {/* ANTES */}
          <Col md={5}>
            <div className="p-3 border rounded-4 bg-white h-100 position-relative opacity-75">
              <span className="badge bg-secondary text-white position-absolute top-0 end-0 m-3 px-2.5 py-1 text-uppercase fw-bold" style={{ fontSize: 9 }}>Antes</span>
              <h6 className="text-muted smaller fw-bold mb-3">ESTADO ACTUAL</h6>
              
              <div className="d-grid gap-2.5">
                <div className="d-flex align-items-center gap-2 text-dark small">
                  <User size={14} className="text-muted" />
                  <span><strong>Profesional:</strong> {originalWorker ? `${originalWorker.firstName} ${originalWorker.lastName}` : "No asignado"}</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-dark small">
                  <Calendar size={14} className="text-muted" />
                  <span><strong>Fecha:</strong> {new Date(originalDate + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-dark small">
                  <Clock size={14} className="text-muted" />
                  <span><strong>Horario:</strong> {originalStartTime} hs</span>
                </div>
              </div>
            </div>
          </Col>

          {/* FLECHA DE CAMBIO */}
          <Col md={2} className="d-flex align-items-center justify-content-center py-2">
            <div className="rounded-circle bg-light p-3 d-flex align-items-center justify-content-center shadow-sm border">
              <ArrowRight className="text-dark" size={20} />
            </div>
          </Col>

          {/* DESPUÉS */}
          <Col md={5}>
            <div className="p-3 border rounded-4 bg-light-success h-100 position-relative" style={{ border: "1.5px solid #10b981" }}>
              <span className="badge bg-success text-white position-absolute top-0 end-0 m-3 px-2.5 py-1 text-uppercase fw-bold" style={{ fontSize: 9 }}>Después</span>
              <h6 className="text-success smaller fw-bold mb-3">NUEVO ESTADO</h6>

              <div className="d-grid gap-2.5">
                {/* Nuevo Profesional Selector */}
                <Form.Group className="mb-1">
                  <Form.Label className="small-label fw-bold d-flex align-items-center gap-1">
                    <User size={13} className="text-success" />
                    <span>Nuevo Profesional:</span>
                  </Form.Label>
                  <Form.Select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="modern-input border-success py-1 px-2 text-dark font-medium"
                    style={{ fontSize: 12.5 }}
                  >
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.firstName} {w.lastName} ({w.roleTitle || "Estilista"})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className="d-flex align-items-center gap-2 text-dark small">
                  <Calendar size={14} className="text-success" />
                  <span><strong>Fecha:</strong> {new Date(newDate + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</span>
                </div>
                
                <div className="d-flex align-items-center gap-2 text-dark small">
                  <Clock size={14} className="text-success" />
                  <span><strong>Horario:</strong> {newStartTime} a {totals.endTimeStr}</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Alerta de validación reactiva de choques */}
        {validationError && (
          <Alert variant="danger" className="rounded-xl border-0 shadow-sm mt-4 animate-fade-in d-flex align-items-center gap-2 mb-0">
            <AlertTriangle size={16} className="text-danger flex-shrink-0" />
            <div className="fw-semibold small">{validationError}</div>
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-2 pb-3 d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          onClick={onCancel}
          className="rounded-pill px-4 py-1.5 fw-bold text-dark border"
        >
          <X size={15} className="me-1" />
          <span>Cancelar</span>
        </Button>
        <Button
          variant="dark"
          onClick={handleConfirm}
          disabled={Boolean(validationError)}
          className="rounded-pill btn-premium px-4 py-1.5 bg-success border-0 fw-bold"
        >
          <Check size={15} className="me-1" />
          <span>Confirmar Cambio</span>
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
