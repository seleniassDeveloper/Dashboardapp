// src/header/clients/ClientModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import api from "../../lib/api.js";
import { useFormSchema } from "../../hooks/useFormSchema.js";
import { useTranslation } from "react-i18next";

export default function ClientModal({
  show,
  onHide,
  mode = "create",     // "create" | "edit"
  initialData = null,  // {id, firstName, lastName, phone, email, notes}
  onSaved,
}) {
  const isEdit = mode === "edit" && Boolean(initialData?.id);
  const schemaKey = isEdit ? "assign.client.form.edit" : "assign.client.form.create";
  const { t } = useTranslation("views");

  const { enabledFields, loading: schemaLoading, error: schemaError } = useFormSchema(schemaKey, {
    enabled: show,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const firstNameField = useMemo(() => enabledFields.find((f) => f.id === "firstName"), [enabledFields]);
  const lastNameField = useMemo(() => enabledFields.find((f) => f.id === "lastName"), [enabledFields]);
  const phoneField = useMemo(() => enabledFields.find((f) => f.id === "phone"), [enabledFields]);
  const emailField = useMemo(() => enabledFields.find((f) => f.id === "email"), [enabledFields]);
  const notesField = useMemo(() => enabledFields.find((f) => f.id === "notes"), [enabledFields]);

  useEffect(() => {
    if (!show) return;

    setError("");
    setErrors({});
    setSaving(false);

    if (isEdit) {
      setFirstName(initialData?.firstName || "");
      setLastName(initialData?.lastName || "");
      setPhone((initialData?.phone === "—" ? "" : initialData?.phone) || "");
      setEmail((initialData?.email === "—" ? "" : initialData?.email) || "");
      setNotes((initialData?.notes === "—" ? "" : initialData?.notes) || "");
      setMarketingConsent(initialData?.marketingConsent ?? false);
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setMarketingConsent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isEdit, initialData?.id]);

  const valid = useMemo(() => {
    for (const field of enabledFields) {
      let value = "";
      if (field.id === "firstName") value = firstName;
      else if (field.id === "lastName") value = lastName;
      else if (field.id === "phone") value = phone;
      else if (field.id === "email") value = email;
      else if (field.id === "notes") value = notes;

      if (field.required && !value.trim()) {
        return false;
      }
    }
    return true;
  }, [enabledFields, firstName, lastName, phone, email, notes]);

  const handleSave = async () => {
    try {
      setError("");
      setErrors({});

      const fieldErrors = {};
      for (const field of enabledFields) {
        let value = "";
        if (field.id === "firstName") value = firstName;
        else if (field.id === "lastName") value = lastName;
        else if (field.id === "phone") value = phone;
        else if (field.id === "email") value = email;
        else if (field.id === "notes") value = notes;

        if (field.required && !value.trim()) {
          fieldErrors[field.id] = "Este campo es obligatorio.";
        }
      }

      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        fieldErrors["email"] = "El email no tiene un formato válido.";
      }

      if (phone.trim()) {
        const cleaned = phone.replace(/\D/g, "");
        if (!/^[+0-9()\-.\s]+$/.test(phone) || cleaned.length < 7 || cleaned.length > 15) {
          fieldErrors["phone"] = "El teléfono debe tener entre 7 y 15 dígitos.";
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return setError("Revisá los campos marcados.");
      }

      setSaving(true);

      const payload = {
        firstName: firstNameField ? firstName.trim() : null,
        lastName: lastNameField ? lastName.trim() : null,
        phone: phoneField ? (phone.trim() || null) : null,
        email: emailField ? (email.trim() || null) : null,
        notes: notesField ? (notes.trim() || null) : null,
        marketingConsent,
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
        {schemaError && <Alert variant="warning">{schemaError}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {schemaLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="text-muted mt-2 small">Cargando formulario…</p>
          </div>
        ) : (
          <Form className="custom-form">
            <Row className="g-3">
              {enabledFields.map((field) => {
                if (field.id === "firstName") {
                  return (
                    <Col md={6} key="firstName">
                      <Form.Group>
                        <Form.Label htmlFor="client-first">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="client-first"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder={field.placeholder || "Ej: María"}
                          isInvalid={Boolean(errors.firstName)}
                        />
                        {errors.firstName && <div className="text-danger small mt-1">{errors.firstName}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "lastName") {
                  return (
                    <Col md={6} key="lastName">
                      <Form.Group>
                        <Form.Label htmlFor="client-last">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="client-last"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder={field.placeholder || "Ej: García"}
                          isInvalid={Boolean(errors.lastName)}
                        />
                        {errors.lastName && <div className="text-danger small mt-1">{errors.lastName}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "phone") {
                  return (
                    <Col md={6} key="phone">
                      <Form.Group>
                        <Form.Label htmlFor="client-phone">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="client-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={field.placeholder || "Ej: +54 11..."}
                          isInvalid={Boolean(errors.phone)}
                        />
                        {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "email") {
                  return (
                    <Col md={6} key="email">
                      <Form.Group>
                        <Form.Label htmlFor="client-email">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="client-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={field.placeholder || "cliente@email.com"}
                          isInvalid={Boolean(errors.email)}
                        />
                        {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "notes") {
                  return (
                    <Col md={12} key="notes">
                      <Form.Group>
                        <Form.Label htmlFor="client-notes">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="client-notes"
                          as="textarea"
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={field.placeholder || "Preferencias, historial, observaciones..."}
                          isInvalid={Boolean(errors.notes)}
                        />
                        {errors.notes && <div className="text-danger small mt-1">{errors.notes}</div>}
                      </Form.Group>
                    </Col>
                  );
                }
                return null;
              })}
            </Row>

            <Row className="mt-3">
              <Col md={12}>
                <Form.Group className="p-3 rounded-xl border" style={{ backgroundColor: "#f8f9fa" }}>
                  <Form.Label className="fw-bold d-block mb-2" style={{ fontSize: "13px" }}>
                    {t("clients.marketingConsentLabel", { defaultValue: "Permite uso de imágenes para marketing" })}
                  </Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="marketing-consent-yes"
                      name="marketingConsent"
                      label={t("common.yes", { defaultValue: "Sí" })}
                      checked={marketingConsent === true}
                      onChange={() => setMarketingConsent(true)}
                      className="small"
                    />
                    <Form.Check
                      type="radio"
                      id="marketing-consent-no"
                      name="marketingConsent"
                      label={t("common.no", { defaultValue: "No" })}
                      checked={marketingConsent === false}
                      onChange={() => setMarketingConsent(false)}
                      className="small"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} disabled={!valid || saving || schemaLoading}>
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