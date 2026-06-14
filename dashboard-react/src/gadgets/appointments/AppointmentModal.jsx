// src/gadgets/appointments/AppointmentModal.jsx
import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import api from "../../lib/api.js";
import { useFormSchema } from "../../hooks/useFormSchema.js";
import { useAppointmentsStore } from "./AppointmentsProvider.jsx";
import FinalizeServiceModal from "../../components/clients/FinalizeServiceModal.jsx";
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
  status: "PENDING",
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

const toISO = (dtLocal) => {
  if (!dtLocal) return "";
  const d = new Date(dtLocal);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

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

  // Inyectar horarios por defecto si no existen
  const workingHours = w.workingHours || {
    monday: { start: "09:00", end: "18:00" },
    tuesday: { start: "09:00", end: "18:00" },
    wednesday: { start: "09:00", end: "18:00" },
    thursday: { start: "09:00", end: "18:00" },
    friday: { start: "09:00", end: "18:00" },
    saturday: { start: "09:00", end: "18:00" },
    sunday: null
  };

  return {
    id: String(w.id || ""),
    firstName: w.firstName || "",
    lastName: w.lastName || "",
    name: `${w.firstName || ""} ${w.lastName || ""}`.trim() || "Trabajador",
    serviceIds: idsFromWorker,
    services: finalServices,
    schedules: safeArray(w.schedules),
    workingHours
  };
}

function checkLaborHoursLocal(worker, dateStr, timeStr) {
  if (!worker || !dateStr || !timeStr) return { valid: true };
  
  // Usamos mediodía para evitar cualquier desfase de huso horario
  const date = new Date(`${dateStr}T12:00:00`);
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = daysOfWeek[date.getDay()];
  
  const wh = worker.workingHours?.[dayName];
  if (!wh) return { valid: false };

  const [startH, startM] = wh.start.split(":").map(Number);
  const [endH, endM] = wh.end.split(":").map(Number);
  
  const [checkH, checkM] = timeStr.split(":").map(Number);
  const checkMin = checkH * 60 + checkM;
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  return { valid: checkMin >= startMin && checkMin <= endMin };
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
  const { appointmentStatuses } = useAppointmentsStore();

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizingAppt, setFinalizingAppt] = useState(null);

  const handleFinalizeCompleted = (updatedAppt) => {
    setShowFinalizeModal(false);
    setFinalizingAppt(null);
    onSaved?.({ mode: isEdit ? "edit" : "create", appointment: updatedAppt });
    onHide?.();
  };

  const handleFinalizeCancel = () => {
    setShowFinalizeModal(false);
    setFinalizingAppt(null);
    onSaved?.({ mode: isEdit ? "edit" : "create", appointment: finalizingAppt });
    onHide?.();
  };

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

  // SLA de Ejecución
  const [liveData, setLiveData] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (show && isEdit && initialData?.sla && initialData.sla.status === "incompleto") {
      api.get(`/appointments/sla-service/live/${initialData.id}`)
        .then(res => {
          setLiveData(res.data);
          setSecondsElapsed(res.data.actualSec);
        })
        .catch(err => console.error("Error fetching live SLA:", err));
    } else {
      setLiveData(null);
    }
  }, [show, isEdit, initialData?.sla, initialData?.id, form.status]);

  useEffect(() => {
    let interval = null;
    if (liveData && liveData.isActive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveData]);

  const formatLiveDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExceeded = liveData && secondsElapsed > liveData.estimatedSec;
  const isHardExceeded = liveData && liveData.hardLimitSec && secondsElapsed > liveData.hardLimitSec;

  const [workers, setWorkers] = useState([]);
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [selServiceIds, setSelServiceIds] = useState([]);
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

  const selectedServices = useMemo(() => {
    return selServiceIds.map((id) => servicesCatalog.find((s) => s.id === id)).filter(Boolean);
  }, [selServiceIds, servicesCatalog]);

  const selectedService = selectedServices[0] || null;

  useEffect(() => {
    setForm((p) => ({ ...p, serviceId: selServiceIds.join(",") }));
  }, [selServiceIds]);

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

  const laborHoursCheck = useMemo(() => {
    if (!form.workerId || !form.appointmentDate || !form.appointmentTime) return { valid: true };
    const worker = workers.find(w => w.id === form.workerId);
    if (!worker) return { valid: true };

    const date = new Date(`${form.appointmentDate}T12:00:00`);
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = daysOfWeek[date.getDay()];
    
    const wh = worker.workingHours?.[dayName];
    if (!wh) {
      return { valid: false, reason: "La hora seleccionada está fuera del horario laboral." };
    }

    const [startH, startM] = wh.start.split(":").map(Number);
    const [endH, endM] = wh.end.split(":").map(Number);
    
    const [checkH, checkM] = form.appointmentTime.split(":").map(Number);
    const checkMin = checkH * 60 + checkM;
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (checkMin < startMin || checkMin > endMin) {
      return { valid: false, reason: "La hora seleccionada está fuera del horario laboral." };
    }

    return { valid: true };
  }, [workers, form.workerId, form.appointmentDate, form.appointmentTime]);

  const saveDisabled =
    !valid || 
    saving || 
    (isEdit && !dirty) || 
    availability.loading || 
    (slotComplete && availability.available === false);

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
        const iso = toISO(startsAtLocal);
        if (!iso) {
          setAvailability({ loading: false, available: null, reason: "", availableWorkers: [] });
          return;
        }
        const params = {
          workerId: form.workerId,
          serviceId: form.serviceId,
          startsAt: iso,
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
      if (initialData?.startsAt) {
        const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(initialData.startsAt);
        let appointmentDate = "";
        let finalTime = "";

        if (isDateOnly) {
          appointmentDate = initialData.startsAt;
          finalTime = "";
        } else {
          const parsed = splitDatetimeLocal(toDatetimeLocal(initialData.startsAt));
          appointmentDate = parsed.date;
          finalTime = parsed.time === "00:00" ? "" : parsed.time;
          
          const targetWorkerId = initialData.workerId || (workers[0]?.id || "");
          const worker = workers.find(w => w.id === targetWorkerId);
          if (finalTime && worker) {
            const check = checkLaborHoursLocal(worker, appointmentDate, finalTime);
            if (!check.valid) {
              finalTime = "";
            }
          }
        }

        const targetWorkerId = initialData.workerId || (workers[0]?.id || "");

        setForm({
          ...emptyForm,
          clientFirstName: initialData?.clientFirstName || "",
          clientLastName: initialData?.clientLastName || "",
          phone: initialData?.phone || "",
          serviceId: initialData?.serviceId || "",
          workerId: targetWorkerId,
          appointmentDate: appointmentDate || "",
          appointmentTime: finalTime,
          status: "PENDING",
        });
        setSelServiceIds(initialData?.serviceId ? [String(initialData.serviceId)] : []);
      } else {
        setForm({
          ...emptyForm,
          clientFirstName: initialData?.clientFirstName || "",
          clientLastName: initialData?.clientLastName || "",
          phone: initialData?.phone || "",
          serviceId: initialData?.serviceId || "",
          workerId: initialData?.workerId || "",
        });
        setSelServiceIds(initialData?.serviceId ? [String(initialData.serviceId)] : []);
      }
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
      status: appt?.status || "PENDING",
    });
    setSelServiceIds(svcId ? [svcId] : []);
  }, [show, isEdit, initialData, workers]);

  // si cambia worker, resetea servicio si no pertenece
  useEffect(() => {
    if (!form.workerId) {
      setSelServiceIds([]);
      return;
    }
    const eligibleIds = workerServices.map((s) => s.id);
    setSelServiceIds((prev) => prev.filter((id) => eligibleIds.includes(id)));
  }, [form.workerId, workerServices]);

  // autoprecio
  useEffect(() => {
    if (selectedServices.length === 0) return;
    const total = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    setForm((p) => ({
      ...p,
      price: String(total),
    }));
  }, [selectedServices]);

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

    if (form.phone.trim()) {
      const cleaned = form.phone.replace(/\D/g, "");
      if (!/^[+0-9()\-.\s]+$/.test(form.phone) || cleaned.length < 7 || cleaned.length > 15) {
        fieldErrors["phone"] = "El teléfono debe tener entre 7 y 15 dígitos.";
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
        status: form.status,
      };

      const url = isEdit ? `/appointments/${initialData.id}` : `/appointments`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);

      if (form.status === "DONE") {
        setFinalizingAppt(res.data);
        setShowFinalizeModal(true);
      } else {
        onSaved?.({ mode: isEdit ? "edit" : "create", appointment: res.data });
        onHide?.();
      }
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
  const handleCancelAppointment = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    try {
      setSaving(true);
      setError("");
      
      const payload = {
        clientId: form.clientId,
        workerId: form.workerId,
        workerFirstName: form.workerFirstName?.trim() ? form.workerFirstName.trim() : null,
        workerLastName: form.workerLastName?.trim() ? form.workerLastName.trim() : null,
        serviceId: form.serviceId,
        startsAt: toISO(startsAtLocal),
        notes: notesField ? (form.notes.trim() || null) : null,
        status: "CANCELLED",
      };

      const url = `/appointments/${initialData.id}`;
      const res = await api.put(url, payload);

      onSaved?.({ mode: "edit", appointment: res.data });
      onHide?.();
    } catch (e) {
      console.error("Error al cancelar la cita:", e?.response?.data || e);
      setError(e?.response?.data?.error || "Error al cancelar la cita.");
    } finally {
      setSaving(false);
    }
  };

  const attendingLabel = selectedWorker?.name || "Sin asignar";
  const serviceLabel = selectedServices.length > 0 ? selectedServices.map((s) => s.name).join(" + ") : "—";
  const whenLabel = formatDateTimeLocalLabel(startsAtLocal);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0);

  return (
    <>
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
          <Form className="custom-form" ref={clientBoxRef}>
            {slotComplete && (
              <div
                className="mb-3 p-3 rounded-3"
                style={{
                  background:
                    availability.available === false
                      ? "rgba(220,53,69,0.08)"
                      : availability.available === true
                      ? "rgba(25,135,84,0.08)"
                      : "rgba(108,117,125,0.08)",
                  border: `1px solid ${
                    availability.available === false
                      ? "rgba(220,53,69,0.25)"
                      : availability.available === true
                      ? "rgba(25,135,84,0.25)"
                      : "rgba(108,117,125,0.25)"
                  }`,
                }}
              >
                <div className="text-muted small mb-1">Resumen de la cita</div>
                <div className="fw-semibold">
                  Atiende: <span className="text-dark">{attendingLabel}</span>
                </div>
                <div className="small text-muted mt-1">
                  {serviceLabel} · {whenLabel}
                  {totalDuration ? ` · ${totalDuration} min` : ""}
                </div>
                {availability.loading && (
                  <div className="small text-muted mt-2 d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Verificando disponibilidad…
                  </div>
                )}
                {!availability.loading && availability.available === false && (
                  <div className="small text-danger mt-2 fw-medium">
                    {availability.reason || "Este profesional no está disponible en este horario."}
                    {availability.availableWorkers?.length > 0 && (
                      <div className="mt-1 fw-normal text-muted">
                        Profesionales alternativos disponibles:{" "}
                        <span className="fw-semibold text-danger">
                          {availability.availableWorkers.map((w) => w.name).join(", ")}
                        </span>
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
              {enabledFields.map((field) => {
                if (field.id === "clientFirstName") {
                  return (
                    <Col md={6} key="clientFirstName" className="position-relative">
                      <Form.Group>
                        <Form.Label className="small-label" htmlFor="appt-client-first">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="appt-client-first"
                          className="modern-input"
                          placeholder={field.placeholder || "Ej: María"}
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

                      {/* Dropdown de Sugerencias */}
                      {clientOpen && (clientLoading || clientSug.length > 0) && (
                        <div className="client-autocomplete-dropdown shadow-premium" style={{ zIndex: 1000, position: "absolute", width: "calc(100% - 24px)" }}>
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
                    </Col>
                  );
                }

                if (field.id === "clientLastName") {
                  return (
                    <Col md={6} key="clientLastName">
                      <Form.Group>
                        <Form.Label className="small-label" htmlFor="appt-client-last">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="appt-client-last"
                          className="modern-input"
                          placeholder={field.placeholder || "Ej: García"}
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
                  );
                }

                if (field.id === "workerId") {
                  return (
                    <Col md={6} key="workerId">
                      <Form.Group>
                        <Form.Label className="small-label" htmlFor="appt-worker">
                          {field.label} {field.required && "*"}
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
                          {workers.length === 0 && (
                            <option value="" disabled>⚠️ No hay profesionales. Debes agregar uno en la sección Equipo.</option>
                          )}
                          {workers.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </Form.Select>
                        {errors.workerId && <div className="text-danger small mt-1">{errors.workerId}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "serviceId") {
                  return (
                    <Col md={6} key="serviceId">
                      <Form.Group>
                        <Form.Label className="small-label">
                          {field.label} {field.required && "*"}
                        </Form.Label>

                        {/* List of selected services */}
                        <div className="d-flex flex-column gap-2 mb-2">
                          {selectedServices.map((svc) => (
                            <div 
                              key={svc.id} 
                              className="d-flex justify-content-between align-items-center px-3 py-2 border rounded-xl"
                              style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                            >
                              <span className="small fw-semibold text-dark">
                                {svc.name} <span className="text-muted">(${svc.price})</span>
                              </span>
                              {!isEdit && (
                                <button
                                  type="button"
                                  className="btn-close"
                                  style={{ fontSize: "10px" }}
                                  onClick={() => setSelServiceIds((prev) => prev.filter((id) => id !== svc.id))}
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Selector para agregar servicio */}
                        {!isEdit && (
                          <Form.Select
                            id="appt-service"
                            className="modern-input"
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                setSelServiceIds((prev) => [...prev, val]);
                              }
                            }}
                            disabled={!form.workerId}
                            isInvalid={Boolean(errors.serviceId)}
                          >
                            <option value="">
                              {!form.workerId
                                ? "Elige trabajador primero"
                                : workerServices.length === 0
                                ? "⚠️ Este trabajador no tiene servicios asignados"
                                : "+ Agregar servicio..."}
                            </option>
                            {workerServices
                              .filter((s) => !selServiceIds.includes(s.id))
                              .map((s) => (
                                <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                              ))}
                          </Form.Select>
                        )}
                        {errors.serviceId && <div className="text-danger small mt-1">{errors.serviceId}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "startsAt") {
                  return (
                    <React.Fragment key="startsAt">
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
                    </React.Fragment>
                  );
                }

                if (field.id === "price") {
                  return (
                    <Col md={6} key="price">
                      <Form.Group>
                        <Form.Label className="small-label" htmlFor="appt-price">
                          {field.label} {field.required && "*"}
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
                  );
                }

                if (field.id === "phone") {
                  return (
                    <Col md={6} key="phone">
                      <Form.Group>
                        <Form.Label className="small-label" htmlFor="appt-phone">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="appt-phone"
                          className="modern-input"
                          type="tel"
                          placeholder={field.placeholder || "Ej: +54 9 11..."}
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          isInvalid={Boolean(errors.phone)}
                        />
                        {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                if (field.id === "notes") {
                  return (
                    <Col md={12} key="notes">
                      <Form.Group>
                        <Form.Label className="small-label" htmlFor="appt-notes">
                          {field.label} {field.required && "*"}
                        </Form.Label>
                        <Form.Control
                          id="appt-notes"
                          className="modern-input"
                          as="textarea"
                          rows={2}
                          placeholder={field.placeholder || "Preferencias, recordatorios..."}
                          value={form.notes}
                          onChange={(e) => setField("notes", e.target.value)}
                          isInvalid={Boolean(errors.notes)}
                        />
                        {errors.notes && <div className="text-danger small mt-1">{errors.notes}</div>}
                      </Form.Group>
                    </Col>
                  );
                }

                return null;
              })}

              {isEdit && (
                <Col md={12}>
                  <hr className="my-4" />

                  {/* Panel de SLA de Ejecución */}
                  {initialData?.sla && (
                    <div className="mb-4 p-3 rounded-xl border bg-light bg-opacity-30">
                      <h6 className="fw-bold text-gray-900 mb-2 small text-uppercase tracking-wider">
                        SLA de Ejecución de Servicio
                      </h6>
                      
                      {/* Caso 1: Completado */}
                      {initialData.sla.status !== "incompleto" && (
                        <div className="d-grid gap-2 small">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Estado de SLA:</span>
                            <span className={`fw-bold text-${initialData.sla.status === "excedido" ? "danger" : initialData.sla.status === "antes" ? "primary" : "success"}`}>
                              {initialData.sla.status === "a_tiempo" && "A Tiempo"}
                              {initialData.sla.status === "excedido" && "Excedido"}
                              {initialData.sla.status === "antes" && "Finalizado Antes"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Tiempo Estimado:</span>
                            <strong className="text-dark">{Math.round(initialData.sla.estimatedSec / 60)} min</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Tiempo Real de Ejecución:</span>
                            <strong className="text-dark">{Math.round(initialData.sla.actualSec / 60)} min</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Variación:</span>
                            <strong className={`font-mono text-${initialData.sla.varianceSec > 0 ? "danger" : "success"}`}>
                              {initialData.sla.varianceSec > 0 ? "+" : ""}{Math.round(initialData.sla.varianceSec / 60)} min
                            </strong>
                          </div>
                          {initialData.sla.pausedSec > 0 && (
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Tiempo Pausado:</span>
                              <strong className="text-muted">{Math.round(initialData.sla.pausedSec / 60)} min</strong>
                            </div>
                          )}
                          {!initialData.sla.withinLimit && (
                            <div className="text-danger fw-bold mt-1 text-end">
                              ⚠️ Superó el límite máximo de tolerancia
                            </div>
                          )}
                        </div>
                      )}

                      {/* Caso 2: Incompleto / Activo con Temporizador en Vivo */}
                      {initialData.sla.status === "incompleto" && liveData && (
                        <div className="d-grid gap-2 small">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Estado de Ejecución:</span>
                            <span className={`d-flex align-items-center gap-1.5 fw-bold ${liveData.isActive ? "text-success" : "text-muted"}`}>
                              <span className={liveData.isActive ? "animate-pulse" : ""} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: liveData.isActive ? "#10b981" : "#64748b" }} />
                              {liveData.isActive ? "En ejecución" : "En pausa / Espera"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Estimado Base:</span>
                            <strong className="text-dark">{Math.round(liveData.estimatedSec / 60)} min</strong>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Cronómetro Activo:</span>
                            <span className={`fw-black fs-6 ${isHardExceeded ? "text-danger animate-pulse" : isExceeded ? "text-warning" : "text-success"}`}>
                              {formatLiveDuration(secondsElapsed)}
                            </span>
                          </div>
                          {isHardExceeded && (
                            <div className="text-danger fw-bold mt-1 text-end">
                              ⚠️ Excedió el límite máximo tolerado
                            </div>
                          )}
                        </div>
                      )}

                      {/* Caso 3: SLA Inicializado pero sin Datos de Live Cargados aún */}
                      {initialData.sla.status === "incompleto" && !liveData && (
                        <div className="text-muted text-center py-2 smaller">
                          <Spinner size="sm" className="me-2" /> Cargando temporizador en vivo...
                        </div>
                      )}
                    </div>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="small-label fw-bold" htmlFor="appt-status">
                      Estado de la Cita
                    </Form.Label>
                    <Form.Select
                      id="appt-status"
                      className="modern-input"
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                    >
                      {appointmentStatuses.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 pb-4 pe-4 d-flex justify-content-between align-items-center w-100">
        <div className="d-flex align-items-center gap-2">
          <Button variant="link" className="text-muted text-decoration-none" onClick={onHide} disabled={saving}>
            Cerrar
          </Button>
          {isEdit && (
            <Button
              variant="outline-danger"
              className="rounded-xl px-3 py-2 fw-semibold small"
              onClick={handleCancelAppointment}
              disabled={saving}
            >
              Cancelar Turno
            </Button>
          )}
        </div>

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

      {showFinalizeModal && finalizingAppt && (
        <FinalizeServiceModal
          show={showFinalizeModal}
          onHide={handleFinalizeCancel}
          appointment={finalizingAppt}
          onCompleted={handleFinalizeCompleted}
        />
      )}
    </>
  );
}