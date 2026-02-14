import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import axios from "axios";
import { useAppointmentsStore } from "../../gadgets/appointments/AppointmentsProvider.jsx";

const API = "http://localhost:3001/api";

export default function ServiceModal({ show, onHide }) {
  const store = useAppointmentsStore?.();
  const refreshAll = store?.fetchAppointments; // si existe

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");

  const valid = useMemo(() => {
    const p = Number(String(price).replace(",", "."));
    const d = Number(duration);
    return name.trim().length > 0 && Number.isFinite(p) && p >= 0 && Number.isFinite(d) && d > 0;
  }, [name, price, duration]);

  useEffect(() => {
    if (!show) return;
    setError("");
    setSaving(false);
    setName("");
    setPrice("");
    setDuration("30");
  }, [show]);

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

      await axios.post(`${API}/services`, payload);

      // opcional: refrescar data global si lo estás usando para métricas/citas
      if (typeof refreshAll === "function") refreshAll();

      onHide?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Error creando servicio.");
    } finally {
      setSaving(false);
    }
  }, [valid, name, price, duration, onHide, refreshAll]);

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} centered backdrop="static" keyboard={!saving}>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>Agregar servicio</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Nombre *</Form.Label>
                <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Corte, Uñas..." />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Precio *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 10" />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Duración (min) *</Form.Label>
                <Form.Control
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