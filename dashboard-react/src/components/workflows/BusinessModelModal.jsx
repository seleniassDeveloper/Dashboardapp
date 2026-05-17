import React, { useState } from "react";
import axios from "axios";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { TRIGGER_META, ACTION_META } from "../../config/workflowCatalog.js";

const API = "http://localhost:3001/api";

export default function BusinessModelModal({ show, onHide, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggers, setTriggers] = useState(["appointment_before", "appointment_created"]);
  const [actions, setActions] = useState(["send_whatsapp", "send_email"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (list, setList, value) => {
    setList((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const handleSave = async () => {
    if (!name.trim()) return setError("Nombre obligatorio.");
    if (!triggers.length || !actions.length) return setError("Elegí al menos un disparador y una acción.");
    try {
      setSaving(true);
      setError("");
      const res = await axios.post(`${API}/business-models`, {
        name: name.trim(),
        description: description.trim(),
        allowedTriggers: triggers,
        allowedActions: actions,
      });
      onSaved?.(res.data);
      onHide?.();
      setName("");
      setDescription("");
    } catch (e) {
      setError(e?.response?.data?.error || "Error creando modelo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Nuevo modelo de negocio</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Nombre *</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Veterinaria" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Descripción</Form.Label>
          <Form.Control as="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Form.Group>
        <Form.Label className="small fw-semibold">Disparadores permitidos</Form.Label>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {Object.keys(TRIGGER_META).map((t) => (
            <Form.Check
              key={t}
              type="checkbox"
              id={`tr-${t}`}
              label={TRIGGER_META[t].label}
              checked={triggers.includes(t)}
              onChange={() => toggle(triggers, setTriggers, t)}
            />
          ))}
        </div>
        <Form.Label className="small fw-semibold">Acciones permitidas</Form.Label>
        <div className="d-flex flex-wrap gap-2">
          {Object.keys(ACTION_META).map((a) => (
            <Form.Check
              key={a}
              type="checkbox"
              id={`ac-${a}`}
              label={ACTION_META[a].label}
              checked={actions.includes(a)}
              onChange={() => toggle(actions, setActions, a)}
            />
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="sm" /> : "Crear modelo"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
