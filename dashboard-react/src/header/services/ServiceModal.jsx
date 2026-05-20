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

  const isEditing = Boolean(editService);

  const valid = useMemo(() => {
    const p = Number(String(price).replace(",", "."));
    const d = Number(duration);
    return name.trim().length > 0 && Number.isFinite(p) && p >= 0 && Number.isFinite(d) && d > 0;
  }, [name, price, duration]);

  useEffect(() => {
    if (!show) return;
    setError("");
    setSaving(false);

    if (editService) {
      setName(editService.name || "");
      setPrice(editService.price || "");
      setDuration(editService.duration || "30");
    } else {
      setName("");
      setPrice("");
      setDuration("30");
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
  }, [valid, name, price, duration, onHide, refreshAll, isEditing, editService]);

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