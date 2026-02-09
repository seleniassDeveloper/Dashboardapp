import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import { WORKERS } from "../../data/workers"; // ajusta ruta

const API = "http://localhost:3001/api";

function parsePrice(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function AppointmentModal({ show, onHide, onCreated }) {
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

  // referencias seleccionadas
  const selectedWorker = useMemo(
    () => WORKERS.find((w) => w.id === workerId) || null,
    [workerId]
  );

  const workerServices = useMemo(
    () => selectedWorker?.services || [],
    [selectedWorker]
  );

  const selectedService = useMemo(
    () => workerServices.find((s) => s.key === serviceKey) || null,
    [workerServices, serviceKey]
  );

  const valid =
    clientName.trim().length > 0 && workerId && serviceKey && startsAt;

  // reset al abrir
  useEffect(() => {
    if (!show) return;

    setClientName("");
    setWorkerId("");
    setServiceKey("");
    setStartsAt("");
    setNotes("");

    setEmail("");
    setPhone("");
    setIsPaid(false);
    setPrice("");

    setSaving(false);
    setError("");
  }, [show]);

  // cuando cambia worker => limpiar servicio y precio
  useEffect(() => {
    setServiceKey("");
    setPrice("");
  }, [workerId]);

  // cuando elige servicio => autocompleta precio
  useEffect(() => {
    if (!selectedService) return;
    setPrice(String(selectedService.price ?? ""));
  }, [selectedService]);

  // ---------- API helpers ----------

  async function createClientIfNeeded() {
    const fullName = clientName.trim();

    // si tu backend no soporta buscar por nombre, igual funciona:
    // creará siempre un client nuevo (no pasa nada para probar).
    // Si quieres evitar duplicados: agrega un GET /clients?q=...
    const payload = {
      fullName,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: null,
    };

    console.log("📤 POST /clients payload:", payload);

    const res = await axios.post(`${API}/clients`, payload);
    console.log("✅ Client creado:", res.data);

    return res.data; // { id, ... }
  }

  async function findOrCreateService() {
    const serviceName = selectedService?.name || serviceKey;

    let existing = null;
    try {
      const list = await axios.get(`${API}/services`);
      existing = Array.isArray(list.data)
        ? list.data.find(
            (s) =>
              String(s.name || "").toLowerCase() ===
              String(serviceName).toLowerCase()
          )
        : null;
    } catch {
      existing = null;
    }

    if (existing) return existing;

    const parsed = parsePrice(price);
    if (parsed !== null && Number.isNaN(parsed)) {
      throw new Error("El precio debe ser un número válido.");
    }

    const payload = {
      name: String(serviceName),
      price: Number.isFinite(parsed) ? parsed : selectedService?.price ?? 0,
      duration: selectedService?.durationMin ?? 30,
      isActive: true,
    };

    console.log("📤 POST /services payload:", payload);

    const res = await axios.post(`${API}/services`, payload);
    console.log("✅ Service creado:", res.data);

    return res.data; // { id, ... }
  }

  async function postAppointment(payload) {
    console.log("📤 POST /appointments payload REAL:", payload);
    const res = await axios.post(`${API}/appointments`, payload);
    console.log("✅ Appointment creado:", res.data);
    return res.data;
  }

  // ---------- submit ----------

  async function handleSave() {
    setError("");

    if (!valid) {
      setError("Completa: Cliente, Trabajador, Servicio y Fecha/Hora.");
      return;
    }

    try {
      setSaving(true);

      // 1) crea client (simple)
      const client = await createClientIfNeeded();

      // 2) busca/crea service
      const service = await findOrCreateService();

      // 3) payload FINAL compatible con tu Prisma (Appointment)
      const payload = {
        clientId: client.id,
        serviceId: service.id,
        startsAt: new Date(startsAt).toISOString(),
        notes: notes.trim() || null,
        // (si luego quieres guardar isPaid/price/workerId en DB,
        // hay que agregar columnas a Prisma + migrations)
      };

      const created = await postAppointment(payload);

      onCreated?.(created);
      onHide?.();
    } catch (e) {
      const backendError = e?.response?.data?.error;
      console.log("❌ Error backend:", e?.response?.status, e?.response?.data);
      setError(backendError || e.message || "Error creando la cita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Nueva cita</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Row className="g-3">
            {/* Cliente */}
            <Col md={12}>
              <Form.Group>
                <Form.Label>Cliente *</Form.Label>
                <Form.Control
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Selenia Sánchez"
                />
              </Form.Group>
            </Col>

            {/* Trabajador */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Trabajador *</Form.Label>
                <Form.Select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {WORKERS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedWorker?.schedule?.mon?.length ? (
                <div className="mt-2 small text-muted">
                  Horarios (Lun): {selectedWorker.schedule.mon.join(" / ")}
                </div>
              ) : null}
            </Col>

            {/* Servicio */}
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

              {selectedService ? (
                <div className="mt-2 small text-muted">
                  Duración: {selectedService.durationMin} min
                </div>
              ) : null}
            </Col>

            {/* Fecha */}
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

            {/* Pagado */}
            <Col md={6} className="d-flex align-items-end">
              <Form.Check
                type="switch"
                id="paidSwitch"
                label="Pagado"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              />
            </Col>

            {/* Email / Phone */}
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

            {/* Precio */}
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
                <Form.Text className="text-muted">
                  Se autocompleta con el servicio, pero puedes editarlo.
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Notas */}
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

        <Button
          variant="dark"
          onClick={handleSave}
          disabled={!valid || saving}
        >
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