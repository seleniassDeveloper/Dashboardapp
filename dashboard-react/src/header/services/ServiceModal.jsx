import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import { useAppointmentsStore } from "../../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../../lib/api.js";

export default function ServiceModal({ show, onHide, editService = null }) {
  const store = useAppointmentsStore?.();
  const refreshAll = store?.fetchAppointments;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  
  // List of professionals (workers)
  const [workersList, setWorkersList] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);

  const isEditing = Boolean(editService);

  const valid = useMemo(() => {
    const p = Number(String(price).replace(",", "."));
    const d = Number(duration);
    return name.trim().length > 0 && Number.isFinite(p) && p >= 0 && Number.isFinite(d) && d > 0;
  }, [name, price, duration]);

  // Fetch workers list on show
  useEffect(() => {
    if (show) {
      api.get("/workers")
        .then(res => setWorkersList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Error loading workers:", err));
    }
  }, [show]);

  // Setup form fields on mount or change
  useEffect(() => {
    if (!show) return;
    setError("");
    setSaving(false);

    if (editService) {
      setName(editService.name || "");
      setPrice(editService.price || "");
      setDuration(editService.duration || "30");
      if (editService.workers && Array.isArray(editService.workers)) {
        setSelectedWorkerIds(editService.workers.map(w => w.workerId));
      } else {
        setSelectedWorkerIds([]);
      }
    } else {
      setName("");
      setPrice("");
      setDuration("30");
      setSelectedWorkerIds([]);
    }
  }, [show, editService]);

  const handleSave = useCallback(async () => {
    try {
      setError("");
      if (!valid) return setError("Completa nombre, precio y duración.");

      setSaving(true);
      const payload = {
        name: name.trim(),
        price: Number(String(price).replace(",", ".")),
        duration: Number(duration),
        workerIds: selectedWorkerIds
      };

      if (isEditing) {
        await api.put(`/services/${editService.id}`, payload);
      } else {
        await api.post(`/services`, payload);
      }

      if (typeof refreshAll === "function") refreshAll();
      onHide?.();
    } catch (e) {
      setError(e?.response?.data?.error || `Error ${isEditing ? "editando" : "creando"} servicio.`);
    } finally {
      setSaving(false);
    }
  }, [valid, name, price, duration, selectedWorkerIds, onHide, refreshAll, isEditing, editService]);

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} centered backdrop="static" keyboard={!saving}>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEditing ? "Editar" : "Agregar"} servicio</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form className="custom-form">
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label htmlFor="service-name">Nombre del servicio *</Form.Label>
                <Form.Control
                  id="service-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Corte, Uñas..."
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="service-price">Precio de lista ($) *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    id="service-price"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej: 10000"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="service-duration">Duración estimada (minutos) *</Form.Label>
                <Form.Control
                  id="service-duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* List of professionals */}
            <Col md={12}>
              <Form.Group className="mt-2">
                <Form.Label className="fw-bold text-gray-700">Profesionales que realizan este servicio</Form.Label>
                <div 
                  className="p-3 border rounded-3 bg-light overflow-auto" 
                  style={{ maxHeight: "160px" }}
                >
                  {workersList.length === 0 ? (
                    <small className="text-muted d-block py-1">No hay profesionales registrados o cargando...</small>
                  ) : (
                    workersList.map(worker => {
                      const isChecked = selectedWorkerIds.includes(worker.id);
                      return (
                        <Form.Check 
                          key={worker.id}
                          type="checkbox"
                          id={`worker-checkbox-${worker.id}`}
                          label={`${worker.firstName} ${worker.lastName}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkerIds(prev => [...prev, worker.id]);
                            } else {
                              setSelectedWorkerIds(prev => prev.filter(id => id !== worker.id));
                            }
                          }}
                          className="mb-2 cursor-pointer fw-semibold text-gray-700"
                        />
                      );
                    })
                  )}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} disabled={!valid || saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}