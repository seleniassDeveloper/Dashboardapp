import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Alert, Badge } from "react-bootstrap";
import { Plus, Check, MessageSquare, Mail, Sparkles, AlertTriangle, Calendar } from "lucide-react";
import api from "../../../lib/api.js";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function AppointmentModal({
  show,
  onHide,
  onSave,
  appointment = null, // null significa CREAR, sino EDITAR
  workers = [],
  services = [],
  appointments = [], // Citas registradas para validación de choques en tiempo real
  initialWorkerId = "",
  initialHour = null,
  initialMinute = null,
}) {
  const isEdit = Boolean(appointment);

  // Estados de entrada
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [señaAmount, setSeñaAmount] = useState(0);
  const [senaStatus, setSenaStatus] = useState("SIN_SENA");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // null o { type: 'success'|'danger', message: string }
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState(null); // null o { type: 'success'|'danger', message: string }

  // Cargar datos del formulario al abrir
  useEffect(() => {
    if (!show) return;
    setEmailStatus(null);
    setEmailLoading(false);
    setCalendarStatus(null);
    setCalendarLoading(false);

    if (isEdit && appointment) {
      setClientFirstName(appointment.client?.firstName || "");
      setClientLastName(appointment.client?.lastName || "");
      setClientPhone(appointment.client?.phone || "");
      setClientEmail(appointment.client?.email || "");
      setWorkerId(appointment.workerId || "");
      
      const starts = appointment.startsAt ? new Date(appointment.startsAt) : null;
      if (starts && !isNaN(starts.getTime())) {
        const pad = (num) => String(num).padStart(2, "0");
        setAppointmentDate(`${starts.getFullYear()}-${pad(starts.getMonth() + 1)}-${pad(starts.getDate())}`);
        setAppointmentTime(`${pad(starts.getHours())}:${pad(starts.getMinutes())}`);
      } else {
        setAppointmentDate("");
        setAppointmentTime("");
      }
      let cleanNotes = appointment.notes || "";
      if (cleanNotes.startsWith("[Servicios:")) {
        cleanNotes = cleanNotes.replace(/^\[Servicios:\s*[^\]]+\]\s*/, "");
      }
      setNotes(cleanNotes);
      
      // Seña
      setSeñaAmount(appointment.señaAmount || 0);
      setSenaStatus(appointment.senaStatus || "SIN_SENA");
      
      // Servicios asociados (por defecto, el servicio principal de la cita)
      let initialServiceIds = appointment.serviceId ? [appointment.serviceId] : [];
      if (appointment.notes && appointment.notes.startsWith("[Servicios:")) {
        const servicesPart = appointment.notes.match(/^\[Servicios:\s*([^\]]+)\]/);
        if (servicesPart && servicesPart[1]) {
          const names = servicesPart[1].split(/\s*\+\s*/);
          const foundIds = services
            .filter(s => names.includes(s.name))
            .map(s => s.id);
          if (foundIds.length > 0) {
            initialServiceIds = foundIds;
          }
        }
      }
      setSelectedServiceIds(initialServiceIds);
    } else {
      // Valores por defecto para creación
      setClientFirstName("");
      setClientLastName("");
      setClientPhone("");
      setClientEmail("");
      
      const targetWorkerId = initialWorkerId || (workers[0]?.id || "");
      setWorkerId(targetWorkerId);
      
      const todayStr = new Date().toISOString().slice(0, 10);
      setAppointmentDate(todayStr);
      
      let finalTime = "";
      if (initialHour !== null && initialMinute !== null) {
        const hourStr = String(initialHour).padStart(2, "0");
        const minStr = String(initialMinute).padStart(2, "0");
        const checkTimeStr = `${hourStr}:${minStr}`;
        
        const workerObj = workers.find(w => w.id === targetWorkerId);
        if (workerObj) {
          const whs = workerObj.workingHours || {
            monday: { start: "09:00", end: "18:00" },
            tuesday: { start: "09:00", end: "18:00" },
            wednesday: { start: "09:00", end: "18:00" },
            thursday: { start: "09:00", end: "18:00" },
            friday: { start: "09:00", end: "18:00" },
            saturday: { start: "09:00", end: "18:00" },
            sunday: null
          };
          const dateObj = new Date(`${todayStr}T12:00:00`);
          const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const dayName = daysOfWeek[dateObj.getDay()];
          const wh = whs[dayName];
          if (wh) {
            const [startH, startM] = wh.start.split(":").map(Number);
            const [endH, endM] = wh.end.split(":").map(Number);
            const checkMin = initialHour * 60 + initialMinute;
            const startMin = startH * 60 + startM;
            const endMin = endH * 60 + endM;
            if (checkMin >= startMin && checkMin <= endMin) {
              finalTime = checkTimeStr;
            }
          }
        }
      }
      setAppointmentTime(finalTime);
      
      setNotes("");
      setSeñaAmount(0);
      setSenaStatus("SIN_SENA");
      
      // Primer servicio seleccionado
      setSelectedServiceIds(services[0]?.id ? [services[0].id] : []);
    }
  }, [show, isEdit, appointment, initialWorkerId, initialHour, initialMinute, workers, services]);

  // --- CÁLCULO EN TIEMPO REAL MULTI-SERVICIO ---
  // Suma de precios, sumas de duración, saldo pendiente y horario final
  const totals = useMemo(() => {
    let price = 0;
    let duration = 0;

    selectedServiceIds.forEach(id => {
      const svc = services.find(s => s.id === id);
      if (svc) {
        price += Number(svc.price || 0);
        duration += Number(svc.duration || 60);
      }
    });

    const pendingBalance = Math.max(price - señaAmount, 0);

    // Calcular hora de finalización
    let endTimeStr = "—";
    if (appointmentTime && duration) {
      const [h, m] = appointmentTime.split(":").map(Number);
      const totalMinutes = h * 60 + m + duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")} hs`;
    }

    return {
      price,
      duration,
      pendingBalance,
      endTimeStr
    };
  }, [selectedServiceIds, services, appointmentTime, señaAmount]);

  // Validaciones reactivas de horario laboral y choques de citas
  const laborHoursCheck = useMemo(() => {
    if (!workerId || !appointmentDate || !appointmentTime) return { valid: true };
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return { valid: true };

    const whs = worker.workingHours || {
      monday: { start: "09:00", end: "18:00" },
      tuesday: { start: "09:00", end: "18:00" },
      wednesday: { start: "09:00", end: "18:00" },
      thursday: { start: "09:00", end: "18:00" },
      friday: { start: "09:00", end: "18:00" },
      saturday: { start: "09:00", end: "18:00" },
      sunday: null
    };

    const date = new Date(`${appointmentDate}T12:00:00`);
    if (isNaN(date.getTime())) {
      return { valid: false, reason: "La fecha seleccionada no es válida." };
    }
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = daysOfWeek[date.getDay()];
    
    const wh = whs[dayName];
    if (!wh) {
      return { valid: false, reason: "La hora seleccionada está fuera del horario laboral." };
    }

    const [startH, startM] = wh.start.split(":").map(Number);
    const [endH, endM] = wh.end.split(":").map(Number);
    
    const [checkH, checkM] = appointmentTime.split(":").map(Number);
    const checkMin = checkH * 60 + checkM;
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (checkMin < startMin || checkMin > endMin) {
      return { valid: false, reason: "La hora seleccionada está fuera del horario laboral." };
    }

    return { valid: true };
  }, [workers, workerId, appointmentDate, appointmentTime]);

  const overlapCheck = useMemo(() => {
    if (!workerId || !appointmentDate || !appointmentTime || selectedServiceIds.length === 0) return { valid: true };
    
    const duration = totals.duration || 60;
    const checkStart = new Date(`${appointmentDate}T${appointmentTime}`);
    if (isNaN(checkStart.getTime())) {
      return { valid: false, reason: "La fecha u hora seleccionada no es válida." };
    }
    const checkEnd = new Date(checkStart.getTime() + duration * 60 * 1000);

    const excludeId = appointment?.id;

    for (const appt of appointments) {
      if (excludeId && appt.id === excludeId) continue;
      if (appt.status === "CANCELLED") continue;
      if (appt.workerId !== workerId) continue;

      const apptStart = new Date(appt.startsAt);
      const apptEnd = new Date(apptStart.getTime() + (appt.service?.duration || 60) * 60 * 1000);

      // Solapamiento
      if (checkStart < apptEnd && checkEnd > apptStart) {
        return { 
          valid: false, 
          reason: "Este profesional ya tiene una cita en ese horario." 
        };
      }
    }

    return { valid: true };
  }, [appointments, workerId, appointmentDate, appointmentTime, selectedServiceIds, totals.duration, appointment?.id]);

  const saveDisabled =
    !clientFirstName ||
    !clientLastName ||
    !workerId ||
    !appointmentDate ||
    !appointmentTime ||
    selectedServiceIds.length === 0 ||
    !laborHoursCheck.valid ||
    !overlapCheck.valid;

  // Manejo de clicks en checkbox de servicio
  const handleToggleService = (id) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(id)) {
        // Al menos un servicio debe quedar seleccionado
        if (prev.length === 1) return prev;
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  // Enviar a guardar
  const handleSubmit = (e) => {
    e.preventDefault();
    if (saveDisabled) return;

    // Crear la estructura de Cita en hora local
    const parsedDate = new Date(`${appointmentDate}T${appointmentTime}`);
    if (isNaN(parsedDate.getTime())) {
      return;
    }
    const startsAt = parsedDate.toISOString();
    
    // El servicio principal es el primero de la lista seleccionada
    const serviceId = selectedServiceIds[0] || "";

    const mainService = services.find(s => s.id === serviceId);
    const otherServices = selectedServiceIds.slice(1).map(id => services.find(s => s.id === id)?.name).filter(Boolean);
    let finalNotes = notes;
    if (otherServices.length > 0) {
      const prefix = `[Servicios: ${mainService?.name || "Servicio"} + ${otherServices.join(" + ")}]`;
      if (!notes.includes(prefix)) {
        finalNotes = `${prefix}\n${notes}`.trim();
      }
    }

    const savedAppt = {
      id: isEdit ? appointment.id : `new-${Date.now()}`,
      startsAt,
      status: isEdit ? appointment.status : "PENDING",
      notes: finalNotes,
      workerId,
      serviceId,
      senaStatus,
      señaAmount: Number(señaAmount),
      // Inyectar datos del cliente
      client: {
        firstName: clientFirstName,
        lastName: clientLastName,
        phone: clientPhone,
        email: clientEmail
      },
      // Inyectar datos de servicios concatenados y sumados
      service: {
        id: serviceId,
        name: selectedServiceIds.length > 1
          ? selectedServiceIds.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(" + ")
          : (services.find(s => s.id === serviceId)?.name || "Servicio"),
        price: totals.price,
        duration: totals.duration
      }
    };

    onSave(savedAppt, isEdit);
    onHide();
  };

  // --- RECORDATORIOS DE CONFIRMACIÓN DIRECTOS ---
  const handleSendWhatsApp = () => {
    const worker = workers.find(w => w.id === workerId);
    const service = services.find(s => s.id === selectedServiceIds[0]);
    const text = `¡Hola ${clientFirstName}! Te confirmamos tu turno en Aura Studio para el día ${appointmentDate} a las ${appointmentTime} hs para el servicio de ${service?.name || "Estética"}. Te atenderá ${worker?.firstName || "Profesional"}. ¡Te esperamos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSendEmail = async () => {
    if (!isEdit || !appointment?.id) {
      setEmailStatus({
        type: "danger",
        message: "Debe guardar la cita antes de poder enviar el email de confirmación desde el servidor."
      });
      return;
    }

    const googleAccessToken = localStorage.getItem("google_oauth_access_token");
    if (!googleAccessToken) {
      setEmailStatus({
        type: "danger",
        message: "Tu sesión de Google no está activa. Por favor, iniciá sesión con Google para enviar correos."
      });
      return;
    }

    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const service = services.find(s => s.id === selectedServiceIds[0]);
      const startsDate = new Date(appointment.startsAt);
      if (isNaN(startsDate.getTime())) {
        setEmailStatus({
          type: "danger",
          message: "La fecha de la cita no es válida para enviar confirmación."
        });
        return;
      }
      const dateStr = startsDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
      const timeStr = startsDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      
      const payload = {
        appointmentId: appointment.id,
        to: clientEmail.trim(),
        subject: `Confirmación de Turno - Aura Studio`,
        message: `Hola ${clientFirstName},\n\nTe confirmamos tu turno para el día ${dateStr} a las ${timeStr} hs para realizarte: ${service?.name || "Estética"}.\n¡Muchas gracias por elegirnos!\n\nDirección del Local: Av. Principal 1234, Aura Studio.`
      };

      const res = await api.post(`/google/send-confirmation-email`, payload, {
        headers: {
          "X-Google-Access-Token": googleAccessToken
        }
      });
      setEmailStatus({
        type: "success",
        message: res.data?.message || "Email de confirmación enviado exitosamente con Gmail."
      });
    } catch (err) {
      console.error("Error al enviar email de confirmación:", err);
      const errCode = err.response?.data?.error;
      const errMsg = err.response?.data?.message || err.message || "Error al enviar el email.";
      if (errCode === "GOOGLE_TOKEN_EXPIRED") {
        setEmailStatus({
          type: "danger",
          message: "Tu sesión de Google ha expirado. Por favor, cerrá sesión y volvé a ingresar con Google para otorgar permisos."
        });
      } else {
        setEmailStatus({
          type: "danger",
          message: errMsg
        });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!isEdit || !appointment?.id) {
      setCalendarStatus({
        type: "danger",
        message: "Debe guardar la cita antes de poder agregarla a Google Calendar."
      });
      return;
    }

    const googleAccessToken = localStorage.getItem("google_oauth_access_token");
    if (!googleAccessToken) {
      setCalendarStatus({
        type: "danger",
        message: "Tu sesión de Google no está activa. Por favor, iniciá sesión con Google para agregar al calendario."
      });
      return;
    }

    setCalendarLoading(true);
    setCalendarStatus(null);
    try {
      const service = services.find(s => s.id === selectedServiceIds[0]);
      
      // Calcular fecha/hora de fin en base a la duración del servicio
      const durationMin = service?.duration || 60;
      const starts = new Date(appointment.startsAt);
      if (isNaN(starts.getTime())) {
        setCalendarStatus({
          type: "danger",
          message: "La fecha de la cita no es válida para agregar al calendario."
        });
        return;
      }
      const ends = new Date(starts.getTime() + durationMin * 60000);

      const payload = {
        appointmentId: appointment.id,
        clientName: `${clientFirstName} ${clientLastName}`.trim(),
        serviceName: service?.name || "Servicio",
        startDateTime: starts.toISOString(),
        endDateTime: ends.toISOString(),
        clientEmail: clientEmail.trim(),
        description: `Turno de ${clientFirstName} ${clientLastName} para realizarse ${service?.name || "Servicio"}. Observaciones: ${notes}`
      };

      const res = await api.post(`/google/create-calendar-event`, payload, {
        headers: {
          "X-Google-Access-Token": googleAccessToken
        }
      });
      setCalendarStatus({
        type: "success",
        message: res.data?.message || "Evento agregado a Google Calendar con éxito."
      });
    } catch (err) {
      console.error("Error al crear evento en Google Calendar:", err);
      const errCode = err.response?.data?.error;
      const errMsg = err.response?.data?.message || err.message || "Error al crear el evento de Google Calendar.";
      if (errCode === "GOOGLE_TOKEN_EXPIRED") {
        setCalendarStatus({
          type: "danger",
          message: "Tu sesión de Google ha expirado. Por favor, cerrá sesión y volvé a ingresar con Google para otorgar permisos."
        });
      } else {
        setCalendarStatus({
          type: "danger",
          message: errMsg
        });
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="hegemonic-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-black h4 text-dark">
            {isEdit ? "Edición Avanzada de Cita" : "Nueva Reserva en Agenda"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-2">
          {emailStatus && (
            <Alert variant={emailStatus.type} className="rounded-4 border-0 shadow-sm mb-4 animate-fade-in" onClose={() => setEmailStatus(null)} dismissible>
              <div className="fw-semibold small">{emailStatus.message}</div>
            </Alert>
          )}

          {calendarStatus && (
            <Alert variant={calendarStatus.type} className="rounded-4 border-0 shadow-sm mb-4 animate-fade-in" onClose={() => setCalendarStatus(null)} dismissible>
              <div className="fw-semibold small">{calendarStatus.message}</div>
            </Alert>
          )}

          {/* Fila superior resumen interactivo de cálculo */}
          <div className="p-3 bg-light rounded-4 border-start border-success border-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="text-muted smaller fw-bold d-block">RESUMEN DEL TURNO</span>
              <strong className="text-dark small">
                Finaliza: {totals.endTimeStr} ({totals.duration} min)
              </strong>
            </div>
            <div className="text-end">
              <span className="text-muted smaller fw-bold d-block">SALDO PENDIENTE</span>
              <h5 className="fw-black text-success m-0">{currency(totals.pendingBalance)}</h5>
            </div>
          </div>

          {(!laborHoursCheck.valid || !overlapCheck.valid) && (
            <Alert variant="danger" className="rounded-4 border-0 shadow-sm mb-4 animate-fade-in">
              <div className="fw-semibold small">
                {!laborHoursCheck.valid && <div>⚠️ {laborHoursCheck.reason}</div>}
                {!overlapCheck.valid && <div>⚠️ {overlapCheck.reason}</div>}
              </div>
            </Alert>
          )}

          <Row className="g-4">
            
            {/* COLUMNA 1: CLIENTE & HORARIOS */}
            <Col lg={6}>
              <h6 className="form-section-title">Información del Cliente</h6>
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Nombre *</Form.Label>
                    <Form.Control
                      value={clientFirstName}
                      onChange={(e) => setClientFirstName(e.target.value)}
                      placeholder="Ej: María"
                      className="modern-input"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Apellido *</Form.Label>
                    <Form.Control
                      value={clientLastName}
                      onChange={(e) => setClientLastName(e.target.value)}
                      placeholder="Ej: García"
                      className="modern-input"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Teléfono (WhatsApp)</Form.Label>
                    <Form.Control
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="11 5432-9876"
                      className="modern-input"
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="maria@gmail.com"
                      className="modern-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h6 className="form-section-title mt-4">Fecha y Asignación</h6>
              <Form.Group className="mb-3">
                <Form.Label className="small-label">Profesional / Estilista *</Form.Label>
                <Form.Select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="modern-input"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName} ({w.roleTitle})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Fecha *</Form.Label>
                    <Form.Control
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="modern-input"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Hora *</Form.Label>
                    <Form.Control
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="modern-input"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Col>

            {/* COLUMNA 2: SERVICIOS & SEÑAS */}
            <Col lg={6}>
              <h6 className="form-section-title">Servicios a Realizar * (Selección Múltiple)</h6>
              <div className="d-grid gap-2 border p-3 rounded-4 bg-light overflow-auto mb-3" style={{ maxHeight: "175px" }}>
                {services.map(s => {
                  const active = selectedServiceIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleService(s.id)}
                      className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between cursor-pointer hover-scale text-dark small"
                      style={{ borderLeft: active ? "4px solid #10b981" : "1px solid #e2e8f0" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <Form.Check
                          type="checkbox"
                          checked={active}
                          onChange={() => {}} // Manejado por onClick de fila
                          className="m-0 cursor-pointer"
                        />
                        <span className="fw-semibold">{s.name}</span>
                      </div>
                      <div className="text-end">
                        <strong className="text-dark d-block">{currency(s.price)}</strong>
                        <span className="text-muted smaller">{s.duration} min</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h6 className="form-section-title mt-4">Estado de Seña (Anticipo)</h6>
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Importe Seña</Form.Label>
                    <Form.Control
                      type="number"
                      value={señaAmount}
                      onChange={(e) => setSeñaAmount(Number(e.target.value))}
                      className="modern-input"
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small-label">Estado Pago</Form.Label>
                    <Form.Select
                      value={senaStatus}
                      onChange={(e) => setSenaStatus(e.target.value)}
                      className="modern-input"
                    >
                      <option value="SIN_SENA">Sin Seña</option>
                      <option value="PAGADA">Seña Pagada</option>
                      <option value="PARCIAL">Pago Parcial</option>
                      <option value="PENDIENTE">Pendiente</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group>
                <Form.Label className="small-label">Observaciones Internas</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles de color, alergias, pedidos específicos..."
                  className="modern-input"
                />
              </Form.Group>
            </Col>

          </Row>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 pb-3 d-flex justify-content-between">
          <div className="d-flex gap-2">
            {/* Recordatorios directos */}
            <Button
              variant="outline-dark"
              onClick={handleSendWhatsApp}
              className="rounded-pill px-3 py-1.5 small fw-bold d-flex align-items-center gap-1.5 border"
            >
              <MessageSquare size={13} className="text-success" />
              <span>Confirmar WhatsApp</span>
            </Button>
            <Button
              variant="outline-dark"
              onClick={handleSendEmail}
              disabled={!clientEmail || emailLoading}
              className="rounded-pill px-3 py-1.5 small fw-bold d-flex align-items-center gap-1.5 border"
            >
              <Mail size={13} className="text-primary" />
              <span>{emailLoading ? "Enviando..." : "Confirmar Email"}</span>
            </Button>
            <Button
              variant="outline-dark"
              onClick={handleCreateCalendarEvent}
              disabled={calendarLoading}
              className="rounded-pill px-3 py-1.5 small fw-bold d-flex align-items-center gap-1.5 border"
            >
              <Calendar size={13} className="text-danger" />
              <span>{calendarLoading ? "Agregando..." : "Agregar a Calendar"}</span>
            </Button>
          </div>

          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={onHide} className="rounded-pill px-4">
              Cancelar
            </Button>
            <Button type="submit" variant="dark" className="rounded-pill btn-premium px-4 bg-success" disabled={saveDisabled}>
              <Check size={16} />
              <span>{isEdit ? "Guardar Cambios" : "Agendar Turno"}</span>
            </Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
