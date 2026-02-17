// src/gadgets/appointments/AppointmentModal.jsx
import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import axios from "axios";

const API = "http://localhost:3001/api";

const emptyForm = {
  clientFirstName: "",
  clientLastName: "",
  clientId: "",
  email: "",
  phone: "",
  workerId: "",
  workerFirstName: "",
  workerLastName: "",
  serviceId: "",
  startsAt: "",
  notes: "",
  price: "",
};

const safeArray = (x) => (Array.isArray(x) ? x : []);

const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const toISO = (dtLocal) => new Date(dtLocal).toISOString();

function normalizeWorker(raw) {
  const w = raw || {};
  const services = safeArray(w.services)
    .map((s) => s?.service || s)
    .filter(Boolean);

  return {
    id: String(w.id || ""),
    firstName: w.firstName || "",
    lastName: w.lastName || "",
    name: `${w.firstName || ""} ${w.lastName || ""}`.trim() || "Trabajador",
    services: services.map((svc) => ({
      id: String(svc.id || ""),
      name: svc.name || "Servicio",
      price: svc.price ?? null,
      duration: svc.duration ?? null,
    })),
  };
}

export default function AppointmentModal({ show, onHide, onSaved, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState("");

  const [workers, setWorkers] = useState([]);

  // --- autocomplete cliente ---
  const [clientOpen, setClientOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientSug, setClientSug] = useState([]);
  const clientBoxRef = useRef(null);

  const setField = useCallback((name, value) => {
    setDirty(true);
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const clientSearchText = useMemo(() => {
    return `${form.clientFirstName} ${form.clientLastName}`.trim();
  }, [form.clientFirstName, form.clientLastName]);

  // cerrar dropdown click afuera
  useEffect(() => {
    function onClickOutside(e) {
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(e.target)) setClientOpen(false);
    }
    if (clientOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [clientOpen]);

  // cargar workers al abrir
  useEffect(() => {
    if (!show) return;

    (async () => {
      try {
        setError("");
        setLoadingRefs(true);
        const wRes = await axios.get(`${API}/workers`);
        setWorkers(safeArray(wRes.data).map(normalizeWorker));
      } catch (e) {
        console.error(e);
        setWorkers([]);
        setError(e?.response?.data?.error || "No pude cargar trabajadores.");
      } finally {
        setLoadingRefs(false);
      }
    })();
  }, [show]);

  // buscar sugerencias cliente (debounce)
  useEffect(() => {
    if (!show) return;

    const q = clientSearchText.trim();
    if (q.length < 2) {
      setClientSug([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setClientLoading(true);
        const res = await axios.get(`${API}/clients`, { params: { search: q } });
        setClientSug(Array.isArray(res.data) ? res.data : []);
      } catch {
        setClientSug([]);
      } finally {
        setClientLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [clientSearchText, show]);

  // worker/service
  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === form.workerId) || null,
    [workers, form.workerId]
  );

  const workerServices = useMemo(() => safeArray(selectedWorker?.services), [selectedWorker]);

  const selectedService = useMemo(
    () => workerServices.find((s) => s.id === form.serviceId) || null,
    [workerServices, form.serviceId]
  );

  // validación
  const valid = useMemo(() => {
    const hasClient = form.clientFirstName.trim() && form.clientLastName.trim();
    return Boolean(hasClient) && Boolean(form.workerId) && Boolean(form.serviceId) && Boolean(form.startsAt);
  }, [form]);

  const saveDisabled = !valid || saving || (isEdit && !dirty);

  // hydrate edit
  useEffect(() => {
    if (!show) return;

    setError("");
    setSaving(false);
    setDirty(false);

    if (!isEdit) {
      setForm(emptyForm);
      return;
    }

    const appt = initialData;

    const clientFirstName = appt?.client?.firstName || "";
    const clientLastName = appt?.client?.lastName || "";
    const clientId = appt?.client?.id ? String(appt.client.id) : "";

    const email = appt?.client?.email || "";
    const phone = appt?.client?.phone || "";
    const startsAt = toDatetimeLocal(appt?.startsAt);
    const notes = appt?.notes || "";
    const price = appt?.service?.price != null ? String(appt.service.price) : "";

    const svcId = appt?.service?.id ? String(appt.service.id) : "";
    const workerId = appt?.workerId ? String(appt.workerId) : "";

    const workerFirstName = appt?.worker?.firstName || appt?.workerFirstName || "";
    const workerLastName = appt?.worker?.lastName || appt?.workerLastName || "";

    setForm({
      clientFirstName,
      clientLastName,
      clientId,
      email,
      phone,
      workerId,
      workerFirstName,
      workerLastName,
      serviceId: svcId,
      startsAt,
      notes,
      price,
    });
  }, [show, isEdit, initialData]);

  // si cambia worker, resetea servicio si no pertenece
  useEffect(() => {
    if (!form.workerId) return;
    const exists = workerServices.some((s) => s.id === form.serviceId);
    if (!exists) setForm((p) => ({ ...p, serviceId: "", price: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.workerId, workerServices]);

  // autoprecio
  useEffect(() => {
    if (!selectedService) return;
    setForm((p) => ({
      ...p,
      price: selectedService.price != null ? String(selectedService.price) : p.price,
    }));
  }, [selectedService]);

  // seleccionar sugerencia cliente
  const pickClient = (c) => {
    setDirty(true);
    setClientOpen(false);
    setForm((p) => ({
      ...p,
      clientId: String(c.id),
      clientFirstName: c.firstName || "",
      clientLastName: c.lastName || "",
      email: c.email || p.email,
      phone: c.phone || p.phone,
    }));
  };

  // crear/actualizar cliente
  const ensureClient = useCallback(async () => {
    const firstName = form.clientFirstName.trim();
    const lastName = form.clientLastName.trim();

    if (!firstName || !lastName) throw new Error("Completa nombre y apellido del cliente.");

    if (form.clientId) {
      await axios.put(`${API}/clients/${form.clientId}`, {
        firstName,
        lastName,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      });
      return { id: form.clientId };
    }

    const res = await axios.post(`${API}/clients`, {
      firstName,
      lastName,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: null,
    });

    return res.data;
  }, [form.clientFirstName, form.clientLastName, form.clientId, form.email, form.phone]);

  const handleSave = useCallback(async () => {
    setError("");
    if (!valid) return setError("Completa: Cliente, Trabajador, Servicio y Fecha/Hora.");
    if (isEdit && !dirty) return setError("No hay cambios para guardar.");

    try {
      setSaving(true);

      const client = await ensureClient();

      const payload = {
        clientId: client.id,
        workerId: form.workerId,
        workerFirstName: form.workerFirstName?.trim() ? form.workerFirstName.trim() : null,
        workerLastName: form.workerLastName?.trim() ? form.workerLastName.trim() : null,
        serviceId: form.serviceId,
        startsAt: toISO(form.startsAt),
        notes: form.notes.trim() || null,
      };

      const url = isEdit ? `${API}/appointments/${initialData.id}` : `${API}/appointments`;
      const res = isEdit ? await axios.put(url, payload) : await axios.post(url, payload);

      onSaved?.({ mode: isEdit ? "edit" : "create", appointment: res.data });
      onHide?.();
    } catch (e) {
      console.error(e);

      // ✅ ESTE ES EL CATCH QUE BUSCAS: manejar solapamiento
      if (e?.response?.status === 409) {
        setError(
          e?.response?.data?.error ||
            "Horario ocupado: este trabajador ya tiene una cita que se solapa con esa hora."
        );
        return;
      }

      setError(e?.response?.data?.error || e.message || "Error guardando la cita.");
    } finally {
      setSaving(false);
    }
  }, [
    valid,
    isEdit,
    dirty,
    ensureClient,
    form.workerId,
    form.workerFirstName,
    form.workerLastName,
    form.serviceId,
    form.startsAt,
    form.notes,
    initialData?.id,
    onSaved,
    onHide,
  ]);

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} centered backdrop="static" keyboard={!saving}>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEdit ? "Editar cita" : "Nueva cita"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        {loadingRefs ? (
          <div className="d-flex align-items-center gap-2 text-muted" style={{ minHeight: 120 }}>
            <Spinner size="sm" /> Cargando trabajadores…
          </div>
        ) : (
          <Form>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Cliente *</Form.Label>

                <div ref={clientBoxRef} style={{ position: "relative" }}>
                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Control
                        placeholder="Nombre"
                        value={form.clientFirstName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDirty(true);
                          setClientOpen(true);
                          setForm((p) => ({ ...p, clientFirstName: v, clientId: "" }));
                        }}
                        onFocus={() => setClientOpen(true)}
                        autoComplete="off"
                      />
                    </Col>

                    <Col md={6}>
                      <Form.Control
                        placeholder="Apellido"
                        value={form.clientLastName}
                        onChange={(e) => {
                          setField("clientLastName", e.target.value);
                          setForm((p) => ({ ...p, clientId: "" }));
                          setClientOpen(true);
                        }}
                        onFocus={() => setClientOpen(true)}
                        autoComplete="off"
                      />
                    </Col>
                  </Row>

                  {clientOpen && (clientLoading || clientSug.length > 0) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        maxHeight: 220,
                        overflow: "auto",
                        zIndex: 20,
                      }}
                    >
                      {clientLoading ? (
                        <div className="p-2 text-muted d-flex align-items-center gap-2">
                          <Spinner size="sm" /> Buscando…
                        </div>
                      ) : (
                        clientSug.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => pickClient(c)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              border: "none",
                              background: "transparent",
                            }}
                          >
                            <div className="fw-semibold">
                              {c.firstName} {c.lastName}
                            </div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {c.phone || "—"} {c.email ? `· ${c.email}` : ""}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Si existe te lo sugiere. Si no, se crea al guardar.
                  {form.clientId ? " (Seleccionado de la base)" : ""}
                </div>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Trabajador *</Form.Label>
                  <Form.Select
                    value={form.workerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = workers.find((w) => w.id === id);

                      setDirty(true);
                      setForm((p) => ({
                        ...p,
                        workerId: id,
                        workerFirstName: selected?.firstName || "",
                        workerLastName: selected?.lastName || "",
                      }));
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {workers.map((w) => (
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
                    value={form.serviceId}
                    onChange={(e) => setField("serviceId", e.target.value)}
                    disabled={!form.workerId}
                  >
                    <option value="">
                      {form.workerId ? "Seleccionar..." : "Elige trabajador primero"}
                    </option>
                    {workerServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.price != null ? ` • $${s.price}` : ""}
                      </option>
                    ))}
                  </Form.Select>

                  {form.workerId && workerServices.length === 0 ? (
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      Este trabajador no tiene servicios asignados.
                    </div>
                  ) : null}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Fecha y hora *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setField("startsAt", e.target.value)}
                  />
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
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Se autocompleta según el servicio (podés ajustarlo si querés).
                  </div>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Notas</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
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

        <Button variant="dark" onClick={handleSave} disabled={saveDisabled || loadingRefs}>
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