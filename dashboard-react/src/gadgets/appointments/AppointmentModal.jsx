// src/gadgets/appointments/AppointmentModal.jsx
import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import api from "../../lib/api.js";
import { useFormSchema } from "../../hooks/useFormSchema.js";
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
  appointmentDate: "",
  appointmentTime: "",
  notes: "",
  price: "",
};

const safeArray = (x) => (Array.isArray(x) ? x : []);

const pad2 = (n) => String(n).padStart(2, "0");

const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
};

const splitDatetimeLocal = (dtLocal) => {
  if (!dtLocal) return { date: "", time: "" };
  const [date, timePart] = dtLocal.split("T");
  return { date: date || "", time: (timePart || "").slice(0, 5) };
};

const combineDateTime = (date, time) => {
  if (!date?.trim() || !time?.trim()) return "";
  return `${date}T${time}`;
};

const toISO = (dtLocal) => new Date(dtLocal).toISOString();

function normalizeService(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id || ""),
    name: raw.name || "Servicio",
    price: raw.price ?? null,
    duration: raw.duration ?? null,
  };
}

function normalizeWorker(raw, servicesById = {}) {
  const w = raw || {};

  // Caso A: backend trae services completos
  const nestedServices = safeArray(w.services)
    .map((s) => s?.service || s)
    .filter(Boolean)
    .map(normalizeService)
    .filter(Boolean);

  // Caso B: backend trae solo serviceIds
  const idsFromWorker =
    safeArray(w.serviceIds).map(String).filter(Boolean);

  const derivedFromIds = idsFromWorker
    .map((id) => servicesById[id])
    .filter(Boolean)
    .map(normalizeService)
    .filter(Boolean);

  const finalServices = nestedServices.length > 0 ? nestedServices : derivedFromIds;

  return {
    id: String(w.id || ""),
    firstName: w.firstName || "",
    lastName: w.lastName || "",
    name: `${w.firstName || ""} ${w.lastName || ""}`.trim() || "Trabajador",
    serviceIds: idsFromWorker,
    services: finalServices,
    schedules: safeArray(w.schedules),
  };
}

function formatDateTimeLocalLabel(dtLocal) {
  if (!dtLocal) return "—";
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentModal({ show, onHide, onSaved, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const { enabledFields, loading: schemaLoading, error: schemaError } = useFormSchema(
    "assign.appointment.form.modal",
    { enabled: show }
  );

  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const [workers, setWorkers] = useState([]);
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [availability, setAvailability] = useState({
    loading: false,
    available: null,
    reason: "",
    availableWorkers: [],
  });

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

  const servicesById = useMemo(() => {
    return safeArray(servicesCatalog).reduce((acc, svc) => {
      acc[String(svc.id)] = svc;
      return acc;
    }, {});
  }, [servicesCatalog]);

  const clientFirstNameField = useMemo(() => enabledFields.find((f) => f.id === "clientFirstName"), [enabledFields]);
  const clientLastNameField = useMemo(() => enabledFields.find((f) => f.id === "clientLastName"), [enabledFields]);
  const workerIdField = useMemo(() => enabledFields.find((f) => f.id === "workerId"), [enabledFields]);
  const serviceIdField = useMemo(() => enabledFields.find((f) => f.id === "serviceId"), [enabledFields]);
  const startsAtField = useMemo(() => enabledFields.find((f) => f.id === "startsAt"), [enabledFields]);
  const priceField = useMemo(() => enabledFields.find((f) => f.id === "price"), [enabledFields]);
  const notesField = useMemo(() => enabledFields.find((f) => f.id === "notes"), [enabledFields]);
  const phoneField = useMemo(() => enabledFields.find((f) => f.id === "phone"), [enabledFields]);

  // cerrar dropdown click afuera
  useEffect(() => {
    function onClickOutside(e) {
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(e.target)) setClientOpen(false);
    }
    if (clientOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [clientOpen]);

  // cargar workers + services al abrir
  useEffect(() => {
    if (!show) return;

    (async () => {
      try {
        setError("");
        setLoadingRefs(true);

        const [wRes, sRes] = await Promise.all([
          api.get(`/workers`),
          api.get(`/services`),
        ]);

        const services = safeArray(sRes.data).map(normalizeService);
        setServicesCatalog(services);

        const map = services.reduce((acc, svc) => {
          acc[String(svc.id)] = svc;
          return acc;
        }, {});

        const normalizedWorkers = safeArray(wRes.data).map((w) => normalizeWorker(w, map));
        setWorkers(normalizedWorkers);
      } catch (e) {
        console.error("Error cargando refs de cita:", e?.response?.data || e);
        setWorkers([]);
        setServicesCatalog([]);
        setError(e?.response?.data?.error || "No pude cargar trabajadores o servicios.");
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
        const res = await api.get(`/clients`, { params: { search: q } });
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

  const workerServices = useMemo(() => {
    if (!selectedWorker) return [];

    // si ya tiene services completos, usar eso
    if (safeArray(selectedWorker.services).length > 0) {
      return selectedWorker.services;
    }

    // fallback por serviceIds
    return safeArray(selectedWorker.serviceIds)
      .map((id) => servicesById[String(id)])
      .filter(Boolean);
  }, [selectedWorker, servicesById]);

  const selectedService = useMemo(
    () => workerServices.find((s) => s.id === form.serviceId) || null,
    [workerServices, form.serviceId]
  );

  const startsAtLocal = useMemo(
    () => combineDateTime(form.appointmentDate, form.appointmentTime),
    [form.appointmentDate, form.appointmentTime]
  );

  const slotComplete = Boolean(form.workerId) && Boolean(form.serviceId) && Boolean(startsAtLocal);

  // validación
  const valid = useMemo(() => {
    for (const field of enabledFields) {
      let val = "";
      if (field.id === "clientFirstName") val = form.clientFirstName;
      else if (field.id === "clientLastName") val = form.clientLastName;
      else if (field.id === "workerId") val = form.workerId;
      else if (field.id === "serviceId") val = form.serviceId;
      else if (field.id === "startsAt") {
        val = form.appointmentDate && form.appointmentTime ? "ok" : "";
      }
      else if (field.id === "price") val = form.price;
      else if (field.id === "notes") val = form.notes;
      else if (field.id === "phone") val = form.phone;

      if (field.required && !String(val || "").trim()) {
        return false;
      }
    }
    const slotOk = availability.available !== false;
    return slotOk;
  }, [enabledFields, form, availability.available]);

  const saveDisabled =
    !valid || saving || (isEdit && !dirty) || availability.loading || (slotComplete && availability.available === false);

  // verificar disponibilidad del profesional al cambiar hora/servicio/trabajador
  useEffect(() => {
    if (!show || !slotComplete) {
      setAvailability({ loading: false, available: null, reason: "", availableWorkers: [] });
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setAvailability((p) => ({ ...p, loading: true }));
        const params = {
          workerId: form.workerId,
          serviceId: form.serviceId,
          startsAt: toISO(startsAtLocal),
        };
        if (isEdit && initialData?.id) params.excludeId = initialData.id;

        const res = await api.get(`/appointments/availability`, { params });
        if (cancelled) return;

        setAvailability({
          loading: false,
          available: Boolean(res.data?.available),
          reason: res.data?.reason || "",
          availableWorkers: safeArray(res.data?.availableWorkers),
        });
      } catch {
        if (!cancelled) {
          setAvailability({ loading: false, available: null, reason: "", availableWorkers: [] });
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [show, form.workerId, form.serviceId, startsAtLocal, slotComplete, isEdit, initialData?.id]);

  // hydrate edit
  useEffect(() => {
    if (!show) return;

    setError("");
    setErrors({});
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
    const { date: appointmentDate, time: appointmentTime } = splitDatetimeLocal(
      toDatetimeLocal(appt?.startsAt)
    );
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
      appointmentDate,
      appointmentTime,
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

    const phoneVal = phoneField ? (form.phone.trim() || null) : undefined;

    if (form.clientId) {
      await api.put(`/clients/${form.clientId}`, {
        firstName,
        lastName,
        phone: phoneVal,
      });
      return { id: form.clientId };
    }

    const res = await api.post(`/clients`, {
      firstName,
      lastName,
      phone: phoneVal,
      notes: null,
    });

    return res.data;
  }, [form.clientFirstName, form.clientLastName, form.clientId, form.phone, phoneField]);

  const handleSave = useCallback(async () => {
    setError("");
    setErrors({});

    const fieldErrors = {};
    for (const field of enabledFields) {
      let val = "";
      if (field.id === "clientFirstName") val = form.clientFirstName;
      else if (field.id === "clientLastName") val = form.clientLastName;
      else if (field.id === "workerId") val = form.workerId;
      else if (field.id === "serviceId") val = form.serviceId;
      else if (field.id === "startsAt") {
        val = form.appointmentDate && form.appointmentTime ? "ok" : "";
      }
      else if (field.id === "price") val = form.price;
      else if (field.id === "notes") val = form.notes;
      else if (field.id === "phone") val = form.phone;

      if (field.required && !String(val || "").trim()) {
        fieldErrors[field.id] = "Este campo es obligatorio.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setError("Revisá los campos marcados.");
      return;
    }

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
        startsAt: toISO(startsAtLocal),
        notes: notesField ? (form.notes.trim() || null) : null,
      };

      const url = isEdit ? `/appointments/${initialData.id}` : `/appointments`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);

      onSaved?.({ mode: isEdit ? "edit" : "create", appointment: res.data });
      onHide?.();
    } catch (e) {
      console.error("Appointment save error:", e?.response?.data || e);

      if (e?.response?.status === 409) {
        const data = e?.response?.data || {};
        const alts = safeArray(data.availableWorkers)
          .map((w) => w.name)
          .filter(Boolean);
        const altText =
          alts.length > 0 ? ` Profesionales disponibles: ${alts.join(", ")}.` : "";
        setError((data.error || "El profesional no está disponible en ese horario.") + altText);
        setAvailability({
          loading: false,
          available: false,
          reason: data.error || "",
          availableWorkers: safeArray(data.availableWorkers),
        });
        return;
      }

      setError(e?.response?.data?.error || e.message || "Error guardando la cita.");
    } finally {
      setSaving(false);
    }
  }, [
    enabledFields,
    valid,
    isEdit,
    dirty,
    ensureClient,
    form.workerId,
    form.workerFirstName,
    form.workerLastName,
    form.serviceId,
    startsAtLocal,
    form.notes,
    notesField,
    initialData?.id,
    onSaved,
    onHide,
  ]);
  const attendingLabel = selectedWorker?.name || "Sin asignar";
  const serviceLabel = selectedService?.name || "—";
  const whenLabel = formatDateTimeLocalLabel(startsAtLocal);

  return (
    <Modal 
      show={show} 
      onHide={saving ? undefined : onHide} 
      centered 
      size="lg"
      className="hegemonic-modal"
      backdrop="static" 
      keyboard={!saving}
    >
      <Modal.Header className="border-0 pb-0" closeButton={!saving}>
        <Modal.Title className="fw-black h4 brand-title">
          {isEdit ? "Refinar Cita" : "Nueva Reserva"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-4">
        {schemaError && <Alert variant="warning">{schemaError}</Alert>}
        {error && (
          <Alert variant="danger" className="rounded-xl border-0 shadow-sm mb-4">
            <div className="fw-bold mb-1">Hubo un problema:</div>
            {error}
          </Alert>
        )}

        {loadingRefs || schemaLoading ? (
          <div className="py-5 text-center text-muted">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="fw-medium">Preparando agenda...</p>
          </div>
        ) : (
          <Form className="custom-form">
            {(clientFirstNameField || clientLastNameField) && (
              <div className="form-section mb-4">
                <h6 className="form-section-title">Información del Cliente</h6>
                <div className="form-section-content" ref={clientBoxRef}>
                  <Row className="g-3">
                    {clientFirstNameField && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-client-first">
                            {clientFirstNameField.label} {clientFirstNameField.required && "*"}
                          </Form.Label>
                          <Form.Control
                            id="appt-client-first"
                            className="modern-input"
                            placeholder={clientFirstNameField.placeholder || "Ej: María"}
                            value={form.clientFirstName}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDirty(true);
                              setClientOpen(true);
                              setForm((p) => ({ ...p, clientFirstName: v, clientId: "" }));
                            }}
                            onFocus={() => setClientOpen(true)}
                            autoComplete="off"
                            isInvalid={Boolean(errors.clientFirstName)}
                          />
                          {errors.clientFirstName && <div className="text-danger small mt-1">{errors.clientFirstName}</div>}
                        </Form.Group>
                      </Col>
                    )}
                    {clientLastNameField && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-client-last">
                            {clientLastNameField.label} {clientLastNameField.required && "*"}
                          </Form.Label>
                          <Form.Control
                            id="appt-client-last"
                            className="modern-input"
                            placeholder={clientLastNameField.placeholder || "Ej: García"}
                            value={form.clientLastName}
                            onChange={(e) => {
                              setField("clientLastName", e.target.value);
                              setForm((p) => ({ ...p, clientId: "" }));
                              setClientOpen(true);
                            }}
                            onFocus={() => setClientOpen(true)}
                            autoComplete="off"
                            isInvalid={Boolean(errors.clientLastName)}
                          />
                          {errors.clientLastName && <div className="text-danger small mt-1">{errors.clientLastName}</div>}
                        </Form.Group>
                      </Col>
                    )}
                  </Row>

                  {/* Dropdown de Sugerencias mejorado */}
                  {clientOpen && (clientLoading || clientSug.length > 0) && (
                    <div className="client-autocomplete-dropdown shadow-premium">
                      {clientLoading ? (
                        <div className="p-3 text-center text-muted small">
                          <Spinner size="sm" className="me-2" /> Buscando...
                        </div>
                      ) : (
                        clientSug.map((c) => (
                          <button key={c.id} type="button" onClick={() => pickClient(c)} className="suggestion-item">
                            <div className="fw-bold text-dark">{c.firstName} {c.lastName}</div>
                            <div className="text-muted smaller">{c.phone || "Sin teléfono"} · {c.email || "Sin email"}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(workerIdField || serviceIdField || startsAtField || priceField) && (
              <div className="form-section mb-4">
                <h6 className="form-section-title">Detalles del Servicio</h6>
                <div className="form-section-content">
                  {slotComplete && (
                    <div
                      className="mb-3 p-3 rounded-3"
                      style={{
                        background:
                          availability.available === false
                            ? "rgba(220,53,69,0.08)"
                            : "rgba(25,135,84,0.08)",
                        border: `1px solid ${
                          availability.available === false
                            ? "rgba(220,53,69,0.25)"
                            : "rgba(25,135,84,0.25)"
                        }`,
                      }}
                    >
                      <div className="text-muted small mb-1">Resumen de la cita</div>
                      <div className="fw-semibold">
                        Atiende: <span className="text-dark">{attendingLabel}</span>
                      </div>
                      <div className="small text-muted mt-1">
                        {serviceLabel} · {whenLabel}
                        {selectedService?.duration ? ` · ${selectedService.duration} min` : ""}
                      </div>
                      {availability.loading && (
                        <div className="small text-muted mt-2 d-flex align-items-center gap-2">
                          <Spinner size="sm" /> Verificando disponibilidad…
                        </div>
                      )}
                      {!availability.loading && availability.available === false && (
                        <div className="small text-danger mt-2 fw-medium">
                          {availability.reason || "No disponible en ese horario."}
                          {availability.availableWorkers.length > 0 && (
                            <div className="mt-1 fw-normal">
                              Disponibles:{" "}
                              {availability.availableWorkers.map((w) => w.name).join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                      {!availability.loading && availability.available === true && (
                        <div className="small text-success mt-2">
                          Horario disponible para este profesional.
                        </div>
                      )}
                    </div>
                  )}

                  <Row className="g-3">
                    {workerIdField && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-worker">
                            {workerIdField.label} {workerIdField.required && "*"}
                          </Form.Label>
                          <Form.Select
                            id="appt-worker"
                            className="modern-input"
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
                            isInvalid={Boolean(errors.workerId)}
                          >
                            <option value="">Seleccionar...</option>
                            {workers.map((w) => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </Form.Select>
                          {errors.workerId && <div className="text-danger small mt-1">{errors.workerId}</div>}
                        </Form.Group>
                      </Col>
                    )}
                    {serviceIdField && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-service">
                            {serviceIdField.label} {serviceIdField.required && "*"}
                          </Form.Label>
                          <Form.Select
                            id="appt-service"
                            className="modern-input"
                            value={form.serviceId}
                            onChange={(e) => setField("serviceId", e.target.value)}
                            disabled={!form.workerId}
                            isInvalid={Boolean(errors.serviceId)}
                          >
                            <option value="">{form.workerId ? "Seleccionar..." : "Elige trabajador primero"}</option>
                            {workerServices.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </Form.Select>
                          {errors.serviceId && <div className="text-danger small mt-1">{errors.serviceId}</div>}
                        </Form.Group>
                      </Col>
                    )}
                    {startsAtField && (
                      <>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small-label" htmlFor="appt-date">
                              Fecha de la cita *
                            </Form.Label>
                            <Form.Control
                              id="appt-date"
                              className="modern-input"
                              type="date"
                              value={form.appointmentDate}
                              onChange={(e) => setField("appointmentDate", e.target.value)}
                              isInvalid={Boolean(errors.startsAt)}
                            />
                            {errors.startsAt && <div className="text-danger small mt-1">{errors.startsAt}</div>}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small-label" htmlFor="appt-time">
                              Hora de la cita *
                            </Form.Label>
                            <Form.Control
                              id="appt-time"
                              className="modern-input"
                              type="time"
                              value={form.appointmentTime}
                              onChange={(e) => setField("appointmentTime", e.target.value)}
                              isInvalid={Boolean(errors.startsAt)}
                            />
                            {errors.startsAt && <div className="text-danger small mt-1">{errors.startsAt}</div>}
                          </Form.Group>
                        </Col>
                      </>
                    )}
                    {priceField && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-price">
                            {priceField.label} {priceField.required && "*"}
                          </Form.Label>
                          <InputGroup className="modern-input-group">
                            <InputGroup.Text className="bg-transparent border-0 text-muted ps-3">$</InputGroup.Text>
                            <Form.Control
                              id="appt-price"
                              className="border-0 ps-1 py-3 bg-transparent shadow-none"
                              placeholder="0.00"
                              inputMode="decimal"
                              value={form.price}
                              onChange={(e) => setField("price", e.target.value)}
                              isInvalid={Boolean(errors.price)}
                            />
                          </InputGroup>
                          {errors.price && <div className="text-danger small mt-1">{errors.price}</div>}
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            )}

            {(phoneField || notesField) && (
              <div className="form-section">
                <h6 className="form-section-title">Información Adicional</h6>
                <div className="form-section-content">
                  <Row className="g-3">
                    {phoneField && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-phone">
                            {phoneField.label} {phoneField.required && "*"}
                          </Form.Label>
                          <Form.Control
                            id="appt-phone"
                            className="modern-input"
                            type="tel"
                            placeholder={phoneField.placeholder || "Ej: +54 9 11..."}
                            value={form.phone}
                            onChange={(e) => setField("phone", e.target.value)}
                            isInvalid={Boolean(errors.phone)}
                          />
                          {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                        </Form.Group>
                      </Col>
                    )}
                    {notesField && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small-label" htmlFor="appt-notes">
                            {notesField.label} {notesField.required && "*"}
                          </Form.Label>
                          <Form.Control
                            id="appt-notes"
                            className="modern-input"
                            as="textarea"
                            rows={2}
                            placeholder={notesField.placeholder || "Preferencias, recordatorios..."}
                            value={form.notes}
                            onChange={(e) => setField("notes", e.target.value)}
                            isInvalid={Boolean(errors.notes)}
                          />
                          {errors.notes && <div className="text-danger small mt-1">{errors.notes}</div>}
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            )}
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 pb-4 pe-4">
        <Button variant="link" className="text-muted text-decoration-none me-auto ps-4" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>

        <Button 
          variant="dark" 
          className="btn-premium px-5 py-3"
          onClick={handleSave} 
          disabled={saveDisabled || loadingRefs || schemaLoading}
        >
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Procesando...
            </>
          ) : isEdit ? "Actualizar Cita" : "Agendar Cita"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}