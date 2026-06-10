import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../../lib/api.js";
import { useAuth } from "../../auth/AuthProvider.jsx";

export function normalizeAppointment(a) {
  if (!a) return null;
  const startsAtVal = a.startsAt || a.start;
  const starts = new Date(startsAtVal);
  const pad = (n) => String(n).padStart(2, "0");
  
  const date = `${starts.getFullYear()}-${pad(starts.getMonth() + 1)}-${pad(starts.getDate())}`;
  const startTime = `${pad(starts.getHours())}:${pad(starts.getMinutes())}`;
  
  const duration = a.service?.duration || a.duration || 60;
  const end = new Date(starts.getTime() + duration * 60 * 1000);
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  const clientName = [a.client?.firstName, a.client?.lastName].filter(Boolean).join(" ") || a.title || "Cliente";
  const workerName = [a.worker?.firstName, a.worker?.lastName].filter(Boolean).join(" ") || "Profesional";
  const workerId = a.workerId || a.professionalId || a.stylistId;

  return {
    ...a,
    id: String(a.id),
    clientName,
    serviceName: a.service?.name || a.serviceName || "Servicio",
    services: a.services || (a.service ? [a.service] : []),
    date,
    startTime,
    endTime,
    workerId,
    workerName,
    status: a.status || "PENDING",
    depositStatus: a.senaStatus || a.depositStatus || "SIN_SENA",
    totalPrice: Number(a.service?.price || a.totalPrice || 0),
    depositAmount: Number(a.señaAmount || a.depositAmount || 0),
    startsAt: startsAtVal
  };
}

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get(`/appointments`);
      const list = Array.isArray(res.data) ? res.data.map(normalizeAppointment) : [];
      list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      setAppointments(list);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las citas.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get(`/services`);
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching services", e);
    }
  }, []);

  const fetchBusiness = useCallback(async () => {
    try {
      const res = await api.get(`/appointments/business`);
      setBusiness(res.data || null);
    } catch (e) {
      console.error("Error fetching business configuration", e);
    }
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    // Solo disparar request si auth está listo y hay usuario
    if (!user) return;
    
    fetchAppointments(true);
    fetchServices();
    fetchBusiness();

    // Polling automático en segundo plano cada 10 segundos (sincroniza reservas en vivo sin parpadeos)
    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [user, fetchAppointments, fetchServices, fetchBusiness]);

  const upsertAppointment = useCallback((appointment) => {
    if (!appointment?.id) return;
    setAppointments((prev) => {
      const normalized = normalizeAppointment(appointment);
      const exists = prev.some((x) => x.id === normalized.id);
      const next = exists ? prev.map((x) => (x.id === normalized.id ? normalized : x)) : [...prev, normalized];
      next.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      return next;
    });
  }, []);

  const removeAppointment = useCallback((id) => {
    if (!id) return;
    setAppointments((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const appointmentStatuses = useMemo(() => {
    if (business && Array.isArray(business.appointmentStatuses) && business.appointmentStatuses.length > 0) {
      return business.appointmentStatuses;
    }
    return [
      { key: "PENDING", label: "Pendiente", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmada", color: "#10b981" },
      { key: "CANCELLED", label: "Cancelada", color: "#ef4444" },
      { key: "DONE", label: "Finalizada", color: "#6b7280" }
    ];
  }, [business]);

  const value = useMemo(
    () => ({
      appointments,
      services,
      business,
      appointmentStatuses,
      loading,
      error,
      setError,
      fetchAppointments,
      fetchServices,
      fetchBusiness,
      upsertAppointment,
      removeAppointment,
    }),
    [appointments, services, business, appointmentStatuses, loading, error, fetchAppointments, fetchServices, fetchBusiness, upsertAppointment, removeAppointment]
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointmentsStore() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointmentsStore debe usarse dentro de <AppointmentsProvider />");
  return ctx;
}