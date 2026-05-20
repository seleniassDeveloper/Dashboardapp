// src/header/clients/ClientModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import api from "../../lib/api.js";

export default function ClientModal({
  show,
  onHide,
  mode = "create",     // "create" | "edit"
  initialData = null,  // {id, firstName, lastName, phone, email, notes}
  onSaved,
}) {
  const isEdit = mode === "edit" && Boolean(initialData?.id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!show) return;

    setError("");
    setSaving(false);

    if (isEdit) {
      setFirstName(initialData?.firstName || "");
      setLastName(initialData?.lastName || "");
      setPhone(initialData?.phone || "");
      setEmail(initialData?.email || "");
      setNotes(initialData?.notes || "");
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isEdit, initialData?.id]);

  const valid = useMemo(() => {
    return firstName.trim().length > 0 && lastName.trim().length > 0;
  }, [firstName, lastName]);

  const handleSave = async () => {
    try {
      setError("");
      if (!valid) return setError("Nombre y Apellido son obligatorios.");

      setSaving(true);

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      };

      const url = isEdit ? `/clients/${initialData.id}` : `/clients`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);

      onSaved?.(res.data);
      onHide?.();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || (isEdit ? "No se pudo actualizar el cliente." : "No se pudo crear el cliente."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} centered backdrop="static" keyboard={!saving}>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEdit ? "Editar cliente" : "Nuevo cliente"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form className="custom-form">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="client-first">Nombre del cliente *</Form.Label>
                <Form.Control
                  id="client-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej: María"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="client-last">Apellido del cliente *</Form.Label>
                <Form.Control
                  id="client-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej: García"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="client-phone">Teléfono / WhatsApp</Form.Label>
                <Form.Control
                  id="client-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 11..."
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label htmlFor="client-email">Correo electrónico</Form.Label>
                <Form.Control
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label htmlFor="client-notes">Notas internas</Form.Label>
                <Form.Control
                  id="client-notes"
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferencias, historial, observaciones..."
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
              Guardando…
            </>
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Crear"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}