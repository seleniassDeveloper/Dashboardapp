import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import axios from "axios";
import { WORKERS } from "../../data/workers";

const API = "http://localhost:3001/api";

function parsePrice(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

// ISO -> "YYYY-MM-DDTHH:mm" para input datetime-local
function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function AppointmentModal({ show, onHide, onSaved, mode = "create", initialData = null }) {
  const isEdit = mode === "edit" && initialData?.id;

  // form
  const [clientName, setClientName] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");

  // extras
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");

  // ui
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedWorker = useMemo(
    () => WORKERS.find((w) => w.id === workerId) || null,
    [workerId]
  );

  const workerServices = useMemo(() => selectedWorker?.services || [], [selectedWorker]);

  const selectedService = useMemo(
    () => workerServices.find((s) => s.key === serviceKey) || null,
    [workerServices, serviceKey]
  );

  const valid = clientName.trim().length > 0 && workerId && serviceKey && startsAt;

  // ---------- hidratar formulario ----------
  useEffect(() => {
    if (!show) return;

    setError("");
    setSaving(false);

    if (!isEdit) {
      // CREATE: limpiar
      setClientName("");
      setWorkerId("");
      setServiceKey("");
      setStartsAt("");
      setNotes("");
      setEmail("");
      setPhone("");
      setIsPaid(false);
      setPrice("");
      return;
    }

    // EDIT: precargar
    setClientName(initialData?.client?.fullName || "");
    setEmail(initialData?.client?.email || "");
    setPhone(initialData?.client?.phone || "");
    setNotes(initialData?.notes || "");
    setStartsAt(toDatetimeLocal(initialData?.startsAt));

    // intentar mapear workerId/serviceKey según nombre del service (si existe en tu WORKERS)
    const serviceName = initialData?.service?.name || "";
    let foundWorkerId = "";
    let foundServiceKey = "";

    for (const w of WORKERS) {
      const match = (w.services || []).find(
        (s) => String(s.name).toLowerCase() === String(serviceName).toLowerCase()
      );
      if (match) {
        foundWorkerId = w.id;
        foundServiceKey = match.key;
        break;
      }
    }

    setWorkerId(foundWorkerId);
    setServiceKey(foundServiceKey);

    // precio desde service DB si existe
    setPrice(
      initialData?.service?.price != null ? String(initialData.service.price) : ""
    );

    // estos no existen en DB, los dejamos default
    setIsPaid(false);
  }, [show, isEdit, initialData]);

  // si cambia worker: en CREATE sí conviene resetear; en EDIT solo si la usuaria cambia worker manualmente
  useEffect(() => {
    // si no hay worker, limpia
    if (!workerId) {
      setServiceKey("");
      setPrice("");
      return;
    }
    // si el serviceKey actual no existe en este worker, limpiar
    const exists = WORKERS.find((w) => w.id === workerId)?.services?.some((s) => s.key === serviceKey);
    if (!exists) {
      setServiceKey("");
      setPrice("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  // autocompletar precio al elegir servicio
  useEffect(() => {
    if (!selectedService) return;
    setPrice(String(selectedService.price ?? ""));
  }, [selectedService]);

  // ---------- API helpers ----------
  async function apiPost(path, payload, label) {
    console.log(`📤 POST ${path} payload:`, payload);
    const res = await axios.post(`${API}${path}`, payload);
    console.log(`✅ ${label} OK:`, res.data);
    return res.data;
  }

  async function apiPut(path, payload, label) {
    console.log(`📤 PUT ${path} payload:`, payload);
    const res = await axios.put(`${API}${path}`, payload);
    console.log(`✅ ${label} OK:`, res.data);
    return res.data;
  }

  async function apiGet(path) {
    const res = await axios.get(`${API}${path}`);
    return res.data;
  }

  function toISO(dtLocal) {
    return new Date(dtLocal).toISOString();
  }

  async function createClient() {
    const fullName = clientName.trim();
    return apiPost(
      "/clients",
      {
        fullName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: null,
      },
      "CLIENT"
    );
  }

  // en EDIT: NO creamos cliente nuevo. usamos el clientId existente.
  async function getClientForSave() {
    if (isEdit) return initialData.client; // ya viene con id
    return createClient();
  }

  async function findOrCreateService() {
    const serviceName = selectedService?.name || serviceKey;

    let list = [];
    try {
      list = await apiGet("/services");
    } catch {
      list = [];
    }

    const existing = Array.isArray(list)
      ? list.find(
          (s) =>
            String(s.name || "").toLowerCase() ===
            String(serviceName).toLowerCase()
        )
      : null;

    if (existing) return existing;

    const parsed = parsePrice(price);
    if (parsed !== null && Number.isNaN(parsed)) throw new Error("El precio debe ser un número válido.");

    return apiPost(
      "/services",
      {
        name: String(serviceName),
        price: Number.isFinite(parsed) ? parsed : selectedService?.price ?? 0,
        duration: selectedService?.durationMin ?? 30,
        isActive: true,
      },
      "SERVICE"
    );
  }

  async function createAppointment({ clientId, serviceId }) {
    return apiPost(
      "/appointments",
      {
        clientId,
        serviceId,
        startsAt: toISO(startsAt),
        notes: notes.trim() || null,
      },
      "APPOINTMENT"
    );
  }

  async function updateAppointment({ clientId, serviceId }) {
    return apiPut(
      `/appointments/${initialData.id}`,
      {
        clientId,
        serviceId,
        startsAt: toISO(startsAt),
        notes: notes.trim() || null,
      },
      "APPOINTMENT UPDATE"
    );
  }

  async function handleSave() {
    setError("");

    if (!valid) {
      setError("Completa: Cliente, Trabajador, Servicio y Fecha/Hora.");
      return;
    }

    try {
      setSaving(true);

      const client = await getClientForSave();
      const service = await findOrCreateService();

      const result = isEdit
        ? await updateAppointment({ clientId: client.id, serviceId: service.id })
        : await createAppointment({ clientId: client.id, serviceId: service.id });

      onSaved?.(result);
      onHide?.();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e.message || "Error guardando la cita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? "Editar cita" : "Nueva cita"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Cliente *</Form.Label>
                <Form.Control
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Selenia Sánchez"
                />
                {isEdit ? (
                  <Form.Text className="text-muted">
                    Edita el nombre solo si quieres crear otro cliente (por ahora no actualizamos Client en DB).
                  </Form.Text>
                ) : null}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Trabajador *</Form.Label>
                <Form.Select value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {WORKERS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Servicio *</Form.Label>
                <Form.Select
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  disabled={!workerId}
                >
                  <option value="">
                    {workerId ? "Seleccionar..." : "Elige trabajador primero"}
                  </option>
                  {workerServices.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name} • ${s.price}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Fecha y hora *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6} className="d-flex align-items-end">
              <Form.Check
                type="switch"
                id="paidSwitch"
                label="Pagado"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              />
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 114256..."
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Precio</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej: 13000"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Notas</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
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
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}