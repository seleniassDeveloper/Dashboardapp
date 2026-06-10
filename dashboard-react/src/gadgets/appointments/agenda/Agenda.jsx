import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Container, Alert } from "react-bootstrap";
import AgendaSummary from "./AgendaSummary";
import AgendaFilters from "./AgendaFilters";
import AgendaTimeline from "./AgendaTimeline";
import AppointmentModal from "./AppointmentModal";
import ConfirmMoveModal from "./ConfirmMoveModal";
import AgendaSummaryDetailModal from "./AgendaSummaryDetailModal";
import FinalizeServiceModal from "../../../components/clients/FinalizeServiceModal.jsx";
import { useAppointmentsStore } from "../AppointmentsProvider.jsx";
import api from "../../../lib/api.js";
import "../styles/agenda.css";

// Lista inicial de bloques horarios bloqueados (Mock)
const INITIAL_SCHEDULE_BLOCKS = [
  { id: "b1", workerId: "w1", startTime: "13:00", endTime: "14:00", reason: "Almuerzo" },
  { id: "b2", workerId: "w2", startTime: "15:00", endTime: "16:30", reason: "Capacitación" },
  { id: "b3", workerId: "w3", startTime: "12:30", endTime: "13:30", reason: "Descanso" },
  { id: "b4", workerId: "w4", startTime: "17:00", endTime: "18:00", reason: "Mantenimiento" }
];

export default function Agenda({
  initialAppointments = [],
  initialServices = [],
  initialWorkers = [],
  selectedDate = new Date(),
  onSaved,
  onUpsert,
}) {
  const { appointments, upsertAppointment, appointmentStatuses } = useAppointmentsStore();
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  
  // Alerta flotante de error/validación
  const [alertMessage, setAlertMessage] = useState("");

  // Estados de Filtros
  const [filters, setFilters] = useState({
    search: "",
    workerId: "",
    serviceId: "",
    status: "",
    onlyNoSena: false
  });

  // Estados de Modales
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [modalWorkerId, setModalWorkerId] = useState("");
  const [modalHour, setModalHour] = useState(null);
  const [modalMinute, setModalMinute] = useState(null);

  // Estado para la confirmación de arrastre (Drag & Drop)
  const [pendingMove, setPendingMove] = useState(null);

  // Estado para el modal de detalle del resumen
  const [summaryDetail, setSummaryDetail] = useState(null);

  // Estados para finalización de servicio (CRM)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizingAppt, setFinalizingAppt] = useState(null);

  // Sincronizar y cargar referencias del backend y locales
  useEffect(() => {
    // Si el backend trae estilistas y servicios, los usamos; sino usamos mocks enriquecidos
    setServices(initialServices.length > 0 ? initialServices : [
      { id: "s1", name: "Corte Diseñador", price: 12000, duration: 45 },
      { id: "s2", name: "Coloración Aura", price: 28000, duration: 90 },
      { id: "s3", name: "Tratamiento Keratina", price: 35000, duration: 120 },
      { id: "s4", name: "Manicuría Semipermanente", price: 8500, duration: 60 }
    ]);

    const fallbackWorkers = [
      { id: "w1", firstName: "María", lastName: "Gómez", roleTitle: "Estilista Colorista", workingHours: { monday: { start: "09:00", end: "18:00" }, tuesday: { start: "09:00", end: "18:00" }, wednesday: { start: "09:00", end: "18:00" }, thursday: { start: "09:00", end: "18:00" }, friday: { start: "09:00", end: "18:00" }, saturday: { start: "09:00", end: "18:00" } } },
      { id: "w2", firstName: "Ana", lastName: "Rodríguez", roleTitle: "Especialista Keratinas", workingHours: { monday: { start: "10:00", end: "19:00" }, tuesday: { start: "10:00", end: "19:00" }, wednesday: { start: "10:00", end: "19:00" }, thursday: { start: "10:00", end: "19:00" }, friday: { start: "10:00", end: "19:00" }, saturday: { start: "10:00", end: "19:00" } } },
      { id: "w3", firstName: "Nicolás", lastName: "Vázquez", roleTitle: "Estilista Masculino", workingHours: { monday: { start: "09:00", end: "20:00" }, tuesday: { start: "09:00", end: "20:00" }, wednesday: { start: "09:00", end: "20:00" }, thursday: { start: "09:00", end: "20:00" }, friday: { start: "09:00", end: "20:00" }, saturday: { start: "09:00", end: "20:00" } } },
      { id: "w4", firstName: "Sofía", lastName: "Díaz", roleTitle: "Manicurista Pro", workingHours: { monday: { start: "10:00", end: "18:00" }, tuesday: { start: "10:00", end: "18:00" }, wednesday: { start: "10:00", end: "18:00" }, thursday: { start: "10:00", end: "18:00" }, friday: { start: "10:00", end: "18:00" }, saturday: { start: "10:00", end: "18:00" } } }
    ];

    if (initialWorkers.length > 0) {
      // Inyectar horarios laborables configurables a los workers reales si no los tienen
      const enrichedWorkers = initialWorkers.map((w, idx) => ({
        ...w,
        workingHours: w.workingHours || fallbackWorkers[idx % fallbackWorkers.length].workingHours,
        roleTitle: w.roleTitle || fallbackWorkers[idx % fallbackWorkers.length].roleTitle
      }));
      setWorkers(enrichedWorkers);
      
      // Sincronizar bloques horarios asignados a IDs de workers reales
      const mappedBlocks = INITIAL_SCHEDULE_BLOCKS.map((block, idx) => ({
        ...block,
        workerId: enrichedWorkers[idx % enrichedWorkers.length]?.id || block.workerId
      }));
      setScheduleBlocks(mappedBlocks);
    } else {
      setWorkers(fallbackWorkers);
      setScheduleBlocks(INITIAL_SCHEDULE_BLOCKS);
    }
  }, [initialAppointments, initialServices, initialWorkers]);

  // Limpiador automático de alertas
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Cambiar un filtro
  const handleChangeFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- FILTRADO DE CITAS DE LA AGENDA ---
  const filteredAppointments = useMemo(() => {
    const pad = (n) => String(n).padStart(2, "0");
    const targetDate = new Date(selectedDate);
    const targetDateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

    return appointments.filter((appt) => {
      // 0. Filtrar por fecha seleccionada de la grilla
      if (appt.date !== targetDateStr) return false;

      // 1. Filtrar por Estilista
      if (filters.workerId && appt.workerId !== filters.workerId) return false;

      // 2. Filtrar por Servicio
      if (filters.serviceId && appt.serviceId !== filters.serviceId) return false;

      // 3. Filtrar por Estado
      if (filters.status && appt.status !== filters.status) return false;

      // 4. Filtrar por Seña vacía
      if (filters.onlyNoSena) {
        const sena = appt.senaStatus || (appt.notes?.toLowerCase().includes("seña") ? "PAGADA" : "SIN_SENA");
        if (sena !== "SIN_SENA") return false;
      }

      // 5. Búsqueda por palabra clave (nombre, mail, teléfono)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const clientName = `${appt.client?.firstName || ""} ${appt.client?.lastName || ""}`.toLowerCase();
        const clientEmail = (appt.client?.email || "").toLowerCase();
        const clientPhone = (appt.client?.phone || "").toLowerCase();
        if (!clientName.includes(q) && !clientEmail.includes(q) && !clientPhone.includes(q)) return false;
      }

      return true;
    });
  }, [appointments, filters, selectedDate]);

  // Agrupar citas por estilista para un mapeado veloz en el timeline
  const appointmentsByWorker = useMemo(() => {
    const map = {};
    workers.forEach(w => { map[w.id] = []; });
    filteredAppointments.forEach(appt => {
      if (map[appt.workerId]) {
        map[appt.workerId].push(appt);
      }
    });
    return map;
  }, [workers, filteredAppointments]);

  // Agrupar bloques de descanso por estilista
  const scheduleBlocksByWorker = useMemo(() => {
    const map = {};
    workers.forEach(w => { map[w.id] = []; });
    scheduleBlocks.forEach(block => {
      if (map[block.workerId]) {
        map[block.workerId].push(block);
      }
    });
    return map;
  }, [workers, scheduleBlocks]);

  // --- LÓGICA DE VALIDACIÓN DE CHOQUE DE HORARIOS & BLOQUEOS (Puntos 3, 6, 7) ---
  const validateSlotAvailability = useCallback((workerId, startsAtDate, durationMinutes, excludeApptId = null, serviceId = null) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return { valid: false, reason: "Profesional no encontrado." };

    // 0. Validar si el profesional realiza el servicio
    let targetServiceId = serviceId;
    let serviceName = "Servicio";
    
    if (excludeApptId) {
      const appt = appointments.find(a => a.id === excludeApptId);
      if (appt) {
        targetServiceId = targetServiceId || appt.serviceId || appt.service?.id;
        serviceName = appt.service?.name || serviceName;
      }
    }

    if (targetServiceId && Array.isArray(worker.serviceIds)) {
      if (!worker.serviceIds.includes(targetServiceId)) {
        const svc = services.find(s => s.id === targetServiceId);
        const nameToShow = svc?.name || serviceName;
        return {
          valid: false,
          reason: `El profesional ${worker.firstName} ${worker.lastName} no realiza el servicio de "${nameToShow}".`
        };
      }
    }

    const checkStart = new Date(startsAtDate);
    const checkEnd = new Date(checkStart.getTime() + durationMinutes * 60 * 1000);
    
    // 1. Validar horario laboral del estilista (Punto 7)
    if (!worker.workingHours) return { valid: false, reason: "Profesional sin horario laboral asignado." };
    
    // Obtener día de la semana en español
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = daysOfWeek[checkStart.getDay()];
    const workingHours = worker.workingHours[dayName];
    
    if (!workingHours) {
      return { valid: false, reason: `El profesional no trabaja el día de hoy.` };
    }

    const [startH, startM] = workingHours.start.split(":").map(Number);
    const [endH, endM] = workingHours.end.split(":").map(Number);
    
    const laborStart = new Date(checkStart);
    laborStart.setHours(startH, startM, 0, 0);
    
    const laborEnd = new Date(checkStart);
    laborEnd.setHours(endH, endM, 0, 0);

    if (checkStart < laborStart || checkEnd > laborEnd) {
      return { 
        valid: false, 
        reason: `Fuera del horario laboral del profesional (${workingHours.start} a ${workingHours.end} hs).` 
      };
    }

    // 2. Validar choque con bloques de descanso/almuerzo (Punto 6)
    const workerBlocks = scheduleBlocksByWorker[workerId] || [];
    for (const block of workerBlocks) {
      const [bStartH, bStartM] = block.startTime.split(":").map(Number);
      const [bEndH, bEndM] = block.endTime.split(":").map(Number);
      
      const blockStart = new Date(checkStart);
      blockStart.setHours(bStartH, bStartM, 0, 0);
      
      const blockEnd = new Date(checkStart);
      blockEnd.setHours(bEndH, bEndM, 0, 0);

      // Solapamiento de intervalos
      if (checkStart < blockEnd && checkEnd > blockStart) {
        return { valid: false, reason: `Choque de horario con bloque bloqueado: "${block.reason}".` };
      }
    }

    // 3. Validar choque con otras citas del estilista (Punto 3)
    const workerAppts = appointmentsByWorker[workerId] || [];
    for (const appt of workerAppts) {
      if (excludeApptId && appt.id === excludeApptId) continue;
      if (appt.status === "CANCELLED") continue;

      const apptStart = new Date(appt.startsAt);
      const apptEnd = new Date(apptStart.getTime() + (appt.service?.duration || 60) * 60 * 1000);

      // Solapamiento
      if (checkStart < apptEnd && checkEnd > apptStart) {
        return { 
          valid: false, 
          reason: `Choque de horario con otra cita de ${appt.client?.firstName} a las ${apptStart.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} hs.` 
        };
      }
    }

    return { valid: true };
  }, [workers, appointmentsByWorker, scheduleBlocksByWorker]);



  const getFormattedTime = (dateStr) => {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getFormattedDate = (dateStr) => {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // --- ARRASTRAR Y SOLTAR: MOVER CITA (Punto 3) ---
  const handleMoveAppointment = async (apptId, targetWorkerId, targetHour, targetMinute) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const originalDateStr = getFormattedDate(appt.startsAt);
    const originalTimeStr = getFormattedTime(appt.startsAt);
    const targetDateStr = getFormattedDate(selectedDate);
    const targetTimeStr = `${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}`;

    setPendingMove({
      appointment: appt,
      originalWorkerId: appt.workerId,
      originalStartTime: originalTimeStr,
      originalDate: originalDateStr,
      newWorkerId: targetWorkerId,
      newDate: targetDateStr,
      newStartTime: targetTimeStr,
    });
  };

  const handleCancelMove = () => {
    setPendingMove(null);
    setAlertMessage("Movimiento de cita cancelado.");
  };

  const handleConfirmMove = async (confirmedWorkerId) => {
    if (!pendingMove) return;

    const { appointment: appt, newDate, newStartTime } = pendingMove;

    // Calcular la nueva fecha/hora en zona horaria local
    const checkStart = new Date(`${newDate}T${newStartTime}`);
    
    // Validar disponibilidad final
    const duration = appt.service?.duration || 60;
    const checkAvailability = validateSlotAvailability(confirmedWorkerId, checkStart, duration, appt.id);
    
    if (!checkAvailability.valid) {
      setAlertMessage(checkAvailability.reason);
      setPendingMove(null);
      return;
    }

    try {
      setAlertMessage("Guardando reubicación...");

      let resolvedClientId = appt.clientId || appt.client?.id;
      if (!resolvedClientId) {
        resolvedClientId = await ensureClient(
          appt.client?.firstName || "Cliente",
          appt.client?.lastName || "Aura",
          appt.client?.phone,
          appt.client?.email
        );
      }

      const payload = {
        clientId: resolvedClientId,
        serviceId: appt.serviceId || appt.service?.id,
        workerId: confirmedWorkerId,
        startsAt: checkStart.toISOString(),
        notes: appt.notes,
        status: appt.status || "PENDING"
      };

      // Intentar guardar en base de datos
      const res = await api.put(`/appointments/${appt.id}`, payload);
      
      const updated = {
        ...appt,
        ...res.data,
        clientId: resolvedClientId,
        workerId: confirmedWorkerId,
        worker: workers.find(w => w.id === confirmedWorkerId)
      };

      // Actualizar globalmente en el store tras éxito real en DB
      upsertAppointment(updated);
      setAlertMessage("¡Cita reubicada y guardada con éxito!");

      // Sincronizar con el calendario real
      onSaved?.();
    } catch (e) {
      console.error("Error guardando el movimiento en la base de datos:", e);
      const backendError = e?.response?.data?.error || "No se pudo guardar la reubicación en la base de datos.";
      setAlertMessage(`Error: ${backendError}`);
    } finally {
      setPendingMove(null);
    }
  };

  // --- ACTUALIZAR ESTADO DE CITA DIRECTAMENTE ---
  const handleUpdateStatus = async (apptId, newStatus) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    if (newStatus === "DONE") {
      setFinalizingAppt(appt);
      setShowFinalizeModal(true);
      return;
    }

    const updated = { ...appt, status: newStatus };
    upsertAppointment(updated);
    
    const statusObj = appointmentStatuses.find(s => s.key === newStatus);
    const label = statusObj ? statusObj.label : newStatus;
    setAlertMessage(`Cita marcada como ${label}.`);

    // Sincronizar
    onSaved?.();

    try {
      await api.put(`/appointments/${apptId}`, {
        clientId: appt.clientId || appt.client?.id,
        serviceId: appt.serviceId || appt.service?.id,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: newStatus
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinalizeCompleted = (updatedAppt) => {
    upsertAppointment(updatedAppt);
    setAlertMessage("¡Servicio finalizado y registrado en la ficha del cliente con éxito!");
    onSaved?.();
  };

  // --- BUSCAR O CREAR CLIENTE DE FORMA INTELIGENTE EN LA BASE DE DATOS ---
  const ensureClient = async (firstName, lastName, phone, email) => {
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new Error("El nombre y apellido del cliente son obligatorios.");
    }
    
    const phoneVal = phone?.trim() || null;
    const emailVal = email?.trim() || null;

    try {
      // 1. Intentar buscar por coincidencia de nombre y apellido
      const searchRes = await api.get(`/clients?search=${encodeURIComponent(firstName.trim())}`);
      const clients = Array.isArray(searchRes.data) ? searchRes.data : [];
      const match = clients.find(c => 
        c.firstName.toLowerCase() === firstName.trim().toLowerCase() && 
        c.lastName.toLowerCase() === lastName.trim().toLowerCase()
      );

      if (match) {
        // Encontrado! Actualizamos teléfono o mail si vino alguno nuevo y no estaba registrado
        const needsUpdate = (phoneVal && match.phone !== phoneVal) || (emailVal && match.email !== emailVal);
        if (needsUpdate) {
          try {
            await api.put(`/clients/${match.id}`, {
              firstName: match.firstName,
              lastName: match.lastName,
              phone: phoneVal || match.phone,
              email: emailVal || match.email
            });
          } catch (err) {
            console.warn("No se pudo actualizar teléfono/email del cliente existente:", err);
          }
        }
        return match.id;
      }
    } catch (e) {
      console.warn("Búsqueda de cliente existente falló o no soportada, creando uno nuevo...", e);
    }

    // 2. Si no existe coincidencia, lo creamos
    try {
      const createRes = await api.post(`/clients`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneVal,
        email: emailVal
      });
      return createRes.data.id;
    } catch (e) {
      console.error("Error creando nuevo cliente:", e);
      throw e;
    }
  };

  // --- CREAR Y GUARDAR CITA DESDE MODAL ---
  const handleSaveAppointment = async (appt, isEdit) => {
    // Validar choque antes de guardar
    const checkAvailability = validateSlotAvailability(appt.workerId, appt.startsAt, appt.service?.duration || 60, isEdit ? appt.id : null, appt.serviceId);
    if (!checkAvailability.valid) {
      setAlertMessage(checkAvailability.reason);
      return;
    }

    try {
      setAlertMessage("Guardando cita...");
      
      // Resolver clientId real buscando o creando el cliente
      const resolvedClientId = await ensureClient(
        appt.client?.firstName || "Cliente",
        appt.client?.lastName || "Aura",
        appt.client?.phone,
        appt.client?.email
      );

      const payload = {
        clientId: resolvedClientId,
        serviceId: appt.serviceId,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: appt.status || "PENDING"
      };

      if (isEdit) {
        const res = await api.put(`/appointments/${appt.id}`, payload);
        const savedRecord = { 
          ...appt, 
          ...res.data, 
          clientId: resolvedClientId,
          client: { ...appt.client, id: resolvedClientId }
        };

        upsertAppointment(savedRecord);
        setAlertMessage("Cita actualizada exitosamente.");

        // Sincronizar
        onSaved?.();
      } else {
        const res = await api.post(`/appointments`, payload);
        const savedRecord = { 
          ...appt, 
          ...res.data, 
          clientId: resolvedClientId,
          client: { ...appt.client, id: resolvedClientId }
        };

        upsertAppointment(savedRecord);
        setAlertMessage("Nueva cita agendada exitosamente.");

        // Sincronizar
        onSaved?.();
      }
    } catch (e) {
      console.error("Error guardando cita en la base de datos:", e?.response?.data || e);
      setAlertMessage(`Error: ${e?.response?.data?.error || "No se pudo registrar la cita en la base de datos."}`);
    }
  };

  // Click en horario vacío
  const handleCreateAppointmentAt = (workerId, hour, minute) => {
    setModalWorkerId(workerId);
    setModalHour(hour);
    setModalMinute(minute);
    setSelectedAppt(null);
    setShowModal(true);
  };

  // Click en cita para editar
  const handleEditAppointment = (appt) => {
    setSelectedAppt(appt);
    setShowModal(true);
  };

  // --- DISPARAR WHATSAPP / EMAIL RECORDATORIOS ---
  const handleSendWhatsApp = (appt) => {
    const worker = workers.find(w => w.id === appt.workerId);
    const dateStr = new Date(appt.startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const text = `¡Hola ${appt.client?.firstName || "Cliente"}! Te confirmamos tu turno en Aura Studio para el día ${dateStr} a las ${timeStr} hs para el servicio de ${appt.service?.name || "Estética"}. Te atenderá ${worker?.firstName || "Profesional"}. ¡Te esperamos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSendEmail = async (appt) => {
    if (!appt.client?.email) {
      setAlertMessage("El cliente no posee un correo electrónico configurado.");
      setTimeout(() => setAlertMessage(""), 5000);
      return;
    }

    const googleAccessToken = localStorage.getItem("google_oauth_access_token");
    if (!googleAccessToken) {
      setAlertMessage("Error: Tu sesión de Google no está activa. Iniciá sesión con Google para enviar correos.");
      setTimeout(() => setAlertMessage(""), 5000);
      return;
    }

    setAlertMessage("Enviando email de confirmación...");
    try {
      const biz = appt.business || { name: "Aura Studio" };
      const dateStr = new Date(appt.startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
      const timeStr = new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      
      const payload = {
        appointmentId: appt.id,
        to: appt.client.email.trim(),
        subject: `Confirmación de Turno - Aura Studio`,
        message: `Hola ${appt.client.firstName || "Cliente"},\n\nTe confirmamos tu turno para el día ${dateStr} a las ${timeStr} hs para realizarte: ${appt.service?.name || "Estética"}.\n¡Muchas gracias por elegirnos!\n\nDirección del Local: Av. Principal 1234, Aura Studio.`
      };

      const res = await api.post(`/google/send-confirmation-email`, payload, {
        headers: {
          "X-Google-Access-Token": googleAccessToken
        }
      });
      setAlertMessage(res.data?.message || "Email de confirmación enviado exitosamente con Gmail.");
    } catch (err) {
      console.error("Error al enviar email de confirmación:", err);
      const errCode = err.response?.data?.error;
      const errMsg = err.response?.data?.message || err.message || "Error al enviar el email.";
      if (errCode === "GOOGLE_TOKEN_EXPIRED") {
        setAlertMessage("Tu sesión de Google ha expirado. Por favor, volvé a iniciar sesión con Google para renovar permisos.");
      } else {
        setAlertMessage(`Error: ${errMsg}`);
      }
    } finally {
      setTimeout(() => setAlertMessage(""), 5000);
    }
  };

  const handleMarkSenaPaid = async (appt) => {
    try {
      const price = Number(appt.service?.price || 0);
      const senaAmount = Math.round(price * 0.3); // 30% de seña
      
      const payload = {
        clientId: appt.clientId || appt.client?.id,
        serviceId: appt.serviceId || appt.service?.id,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: appt.status || "PENDING",
        senaStatus: "PAGADA",
        señaAmount: senaAmount
      };

      const res = await api.put(`/appointments/${appt.id}`, payload);
      
      upsertAppointment({
        ...appt,
        ...res.data,
        senaStatus: "PAGADA",
        señaAmount: senaAmount
      });

      setAlertMessage("¡Seña registrada con éxito! Cobro del 30% completado.");
      onSaved?.();
      setSummaryDetail(null);
    } catch (e) {
      console.error(e);
      setAlertMessage("Error al registrar seña: " + (e?.response?.data?.error || e.message));
    }
  };

  return (
    <Container fluid className="px-0 py-2">
      {/* Alerta de avisos y colisiones flotante */}
      {alertMessage && (
        <Alert variant={alertMessage.includes("error") || alertMessage.includes("Choque") || alertMessage.includes("Fuera") ? "danger" : "success"} className="rounded-xl border-0 shadow-sm mb-4 animate-fade-in">
          <div className="fw-semibold small">{alertMessage}</div>
        </Alert>
      )}

      {/* 1. Grilla de la Línea de Tiempo y Columnas (AgendaTimeline) - AHORA PRIMERO */}
      <AgendaTimeline
        workers={workers}
        appointmentsByWorker={appointmentsByWorker}
        scheduleBlocksByWorker={scheduleBlocksByWorker}
        onEditAppointment={handleEditAppointment}
        onUpdateStatus={handleUpdateStatus}
        onSendWhatsApp={handleSendWhatsApp}
        onSendEmail={handleSendEmail}
        onMoveAppointment={handleMoveAppointment}
        onCreateAppointmentAt={handleCreateAppointmentAt}
      />

      {/* 4. Modal Avanzado de Creación y Edición */}
      <AppointmentModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveAppointment}
        appointment={selectedAppt}
        workers={workers}
        services={services}
        appointments={appointments}
        initialWorkerId={modalWorkerId}
        initialHour={modalHour}
        initialMinute={modalMinute}
      />

      {/* 5. Modal de Confirmación de Reubicación (Drag & Drop) */}
      <ConfirmMoveModal
        show={Boolean(pendingMove)}
        pendingMove={pendingMove}
        workers={workers}
        onCancel={handleCancelMove}
        onConfirm={handleConfirmMove}
        validateSlotAvailability={validateSlotAvailability}
      />

      {/* 6. Modal de Detalle de Resumen de KPIs */}
      <AgendaSummaryDetailModal
        show={Boolean(summaryDetail)}
        data={summaryDetail}
        onHide={() => setSummaryDetail(null)}
        onEdit={handleEditAppointment}
        onSendWhatsApp={handleSendWhatsApp}
        onSendEmail={handleSendEmail}
        onMarkSenaPaid={handleMarkSenaPaid}
      />

      {/* 7. Modal de Finalización de Servicio (CRM) */}
      <FinalizeServiceModal
        show={showFinalizeModal}
        onHide={() => {
          setShowFinalizeModal(false);
          setFinalizingAppt(null);
        }}
        appointment={finalizingAppt}
        onCompleted={handleFinalizeCompleted}
      />
    </Container>
  );
}
