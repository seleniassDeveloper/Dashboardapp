import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import axios from "axios";
import { WORKERS } from "../../data/workers";

const API = "http://localhost:3001/api";

const emptyForm = {
  clientName: "",
  email: "",
  phone: "",
  workerId: "",
  serviceKey: "",
  startsAt: "",
  notes: "",
  price: "",
};

const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISO = (dtLocal) => new Date(dtLocal).toISOString();

const parsePrice = (value) => {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

export default function AppointmentModal({ show, onHide, onSaved, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = useCallback((name, value) => {
    setDirty(true);
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const selectedWorker = useMemo(
    () => WORKERS.find((w) => w.id === form.workerId) || null,
    [form.workerId]
  );

  const workerServices = useMemo(() => selectedWorker?.services || [], [selectedWorker]);

  const selectedService = useMemo(
    () => workerServices.find((s) => s.key === form.serviceKey) || null,
    [workerServices, form.serviceKey]
  );

  const valid = useMemo(() => {
    return (
      form.clientName.trim().length > 0 &&
      Boolean(form.workerId) &&
      Boolean(form.serviceKey) &&
      Boolean(form.startsAt)
    );
  }, [form]);

  const saveDisabled = !valid || saving || (isEdit && !dirty);

  // --- helpers ---
  const findWorkerAndServiceKey = useCallback((serviceName) => {
    const name = String(serviceName || "").toLowerCase();
    for (const w of WORKERS) {
      const match = (w.services || []).find((s) => String(s.name).toLowerCase() === name);
      if (match) return { workerId: w.id, serviceKey: match.key };
    }
    return { workerId: "", serviceKey: "" };
  }, []);

  const hydrateFromInitial = useCallback(
    (appt) => {
      if (!appt) return emptyForm;
      const { workerId, serviceKey } = findWorkerAndServiceKey(appt?.service?.name);
      return {
        clientName: appt?.client?.fullName || "",
        email: appt?.client?.email || "",
        phone: appt?.client?.phone || "",
        workerId,
        serviceKey,
        startsAt: toDatetimeLocal(appt?.startsAt),
        notes: appt?.notes || "",
        price: appt?.service?.price != null ? String(appt.service.price) : "",
      };
    },
    [findWorkerAndServiceKey]
  );

  // 1) hydrate al abrir
  useEffect(() => {
    if (!show) return;
    setError("");
    setSaving(false);
    setDirty(false);
    setForm(isEdit ? hydrateFromInitial(initialData) : emptyForm);
  }, [show, isEdit, initialData?.id, hydrateFromInitial]);

  // 2) si cambia worker, validar serviceKey
  useEffect(() => {
    if (!form.workerId) return;
    const exists = WORKERS.find((w) => w.id === form.workerId)?.services?.some(
      (s) => s.key === form.serviceKey
    );
    if (!exists) setForm((p) => ({ ...p, serviceKey: "", price: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.workerId]);

  // 3) si cambia servicio, autocompletar precio
  useEffect(() => {
    if (!selectedService) return;
    setForm((p) => ({ ...p, price: String(selectedService.price ?? "") }));
  }, [selectedService]);

  // --- API helpers ---
  const ensureClient = useCallback(async () => {
    if (!isEdit) {
      const payload = {
        fullName: form.clientName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: null,
      };
      const res = await axios.post(`${API}/clients`, payload);
      return res.data;
    }

    // si editaste nombre/email/phone -> actualiza cliente
    const clientId = initialData?.client?.id;
    if (clientId) {
      const payload = {
        fullName: form.clientName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      };
      await axios.put(`${API}/clients/${clientId}`, payload);
    }
    return initialData.client;
  }, [isEdit, form, initialData]);

  const ensureService = useCallback(async () => {
    const serviceName = selectedService?.name || form.serviceKey;

    const listRes = await axios.get(`${API}/services`);
    const list = listRes.data || [];

    const existing = Array.isArray(list)
      ? list.find((s) => String(s.name || "").toLowerCase() === String(serviceName).toLowerCase())
      : null;

    if (existing) return existing;

    const parsed = parsePrice(form.price);
    if (parsed !== null && Number.isNaN(parsed)) throw new Error("El precio debe ser un número válido.");

    const payload = {
      name: String(serviceName),
      price: Number.isFinite(parsed) ? parsed : selectedService?.price ?? 0,
      duration: selectedService?.durationMin ?? 30,
      isActive: true,
    };

    const res = await axios.post(`${API}/services`, payload);
    return res.data;
  }, [form.price, form.serviceKey, selectedService]);

  const handleSave = useCallback(async () => {
    setError("");
    if (!valid) return setError("Completa: Cliente, Trabajador, Servicio y Fecha/Hora.");
    if (isEdit && !dirty) return setError("No hay cambios para guardar.");

    try {
      setSaving(true);

      const client = await ensureClient();
      const service = await ensureService();

      // ✅ payload válido para appointments
      const payload = {
        clientId: client.id,        // string
        serviceId: service.id,      // string
        startsAt: toISO(form.startsAt),
        notes: form.notes.trim() || null,
      };

      const url = isEdit ? `${API}/appointments/${initialData.id}` : `${API}/appointments`;
      const res = isEdit ? await axios.put(url, payload) : await axios.post(url, payload);

      onSaved?.({ mode: isEdit ? "edit" : "create", appointment: res.data });
      onHide?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Error guardando la cita.");
    } finally {
      setSaving(false);
    }
  }, [valid, isEdit, dirty, ensureClient, ensureService, form, initialData?.id, onSaved, onHide]);

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} centered backdrop="static" keyboard={!saving}>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEdit ? "Editar cita" : "Nueva cita"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Cliente *</Form.Label>
                <Form.Control value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Trabajador *</Form.Label>
                <Form.Select value={form.workerId} onChange={(e) => setField("workerId", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {WORKERS.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Servicio *</Form.Label>
                <Form.Select
                  value={form.serviceKey}
                  onChange={(e) => setField("serviceKey", e.target.value)}
                  disabled={!form.workerId}
                >
                  <option value="">{form.workerId ? "Seleccionar..." : "Elige trabajador primero"}</option>
                  {workerServices.map((s) => (
                    <option key={s.key} value={s.key}>{s.name} • ${s.price}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Fecha y hora *</Form.Label>
                <Form.Control type="datetime-local" value={form.startsAt} onChange={(e) => setField("startsAt", e.target.value)} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Precio</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control value={form.price} onChange={(e) => setField("price", e.target.value)} />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Notas</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>Cancelar</Button>
        <Button variant="dark" onClick={handleSave} disabled={saveDisabled}>
          {saving ? (<><Spinner size="sm" className="me-2" />Guardando...</>) : isEdit ? "Guardar cambios" : "Guardar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}