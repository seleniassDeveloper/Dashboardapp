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

export function getMockAppointments() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const createDate = (hour, min) => {
    const d = new Date(now);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "demo-1",
      clientName: "Paula Gómez",
      title: "Paula Gómez - Corte & Peinado Pro",
      serviceName: "Corte & Peinado Pro",
      date: todayStr,
      startTime: "10:00",
      endTime: "11:00",
      workerId: "w1",
      workerName: "Ana Silva",
      status: "CONFIRMED",
      depositStatus: "SENADO",
      totalPrice: 45,
      depositAmount: 15,
      startsAt: createDate(10, 0),
      duration: 60,
      client: { firstName: "Paula", lastName: "Gómez", phone: "+54 9 11 5555-1234" },
      service: { name: "Corte & Peinado Pro", price: 45, duration: 60 },
      worker: { id: "w1", firstName: "Ana", lastName: "Silva" }
    },
    {
      id: "demo-2",
      clientName: "Carlos Rodríguez",
      title: "Carlos Rodríguez - Barba & Perfilado",
      serviceName: "Barba & Perfilado",
      date: todayStr,
      startTime: "11:30",
      endTime: "12:15",
      workerId: "w1",
      workerName: "Ana Silva",
      status: "CONFIRMED",
      depositStatus: "SENADO",
      totalPrice: 30,
      depositAmount: 10,
      startsAt: createDate(11, 30),
      duration: 45,
      client: { firstName: "Carlos", lastName: "Rodríguez", phone: "+54 9 11 5555-5678" },
      service: { name: "Barba & Perfilado", price: 30, duration: 45 },
      worker: { id: "w1", firstName: "Ana", lastName: "Silva" }
    },
    {
      id: "demo-3",
      clientName: "Sofía Martínez",
      title: "Sofía Martínez - Coloración & Balayage",
      serviceName: "Coloración & Balayage",
      date: todayStr,
      startTime: "14:00",
      endTime: "16:00",
      workerId: "w2",
      workerName: "Carlos Gómez",
      status: "CONFIRMED",
      depositStatus: "SENADO",
      totalPrice: 120,
      depositAmount: 40,
      startsAt: createDate(14, 0),
      duration: 120,
      client: { firstName: "Sofía", lastName: "Martínez", phone: "+54 9 11 5555-9012" },
      service: { name: "Coloración & Balayage", price: 120, duration: 120 },
      worker: { id: "w2", firstName: "Carlos", lastName: "Gómez" }
    },
    {
      id: "demo-4",
      clientName: "Lucía Fernández",
      title: "Lucía Fernández - Tratamiento Keratina",
      serviceName: "Tratamiento Keratina",
      date: todayStr,
      startTime: "16:30",
      endTime: "17:30",
      workerId: "w1",
      workerName: "Ana Silva",
      status: "PENDING",
      depositStatus: "SIN_SENA",
      totalPrice: 80,
      depositAmount: 0,
      startsAt: createDate(16, 30),
      duration: 60,
      client: { firstName: "Lucía", lastName: "Fernández", phone: "+54 9 11 5555-3456" },
      service: { name: "Tratamiento Keratina", price: 80, duration: 60 },
      worker: { id: "w1", firstName: "Ana", lastName: "Silva" }
    },
    {
      id: "demo-5",
      clientName: "Martín Benítez",
      title: "Martín Benítez - Corte Masculino Premium",
      serviceName: "Corte Masculino Premium",
      date: todayStr,
      startTime: "18:00",
      endTime: "18:45",
      workerId: "w2",
      workerName: "Carlos Gómez",
      status: "DONE",
      depositStatus: "PAGADO_TOTAL",
      totalPrice: 35,
      depositAmount: 35,
      startsAt: createDate(18, 0),
      duration: 45,
      client: { firstName: "Martín", lastName: "Benítez", phone: "+54 9 11 5555-7890" },
      service: { name: "Corte Masculino Premium", price: 35, duration: 45 },
      worker: { id: "w2", firstName: "Carlos", lastName: "Gómez" }
    }
  ];
}

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState(() => getMockAppointments().map(normalizeAppointment));
  const [services, setServices] = useState([]);
  const [business, setBusiness] = useState({ name: "Aura Studio", slug: "aura-studio" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get(`/appointments`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(normalizeAppointment);
        list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        setAppointments(list);
      } else {
        const mockList = getMockAppointments().map(normalizeAppointment);
        mockList.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        setAppointments(mockList);
      }
      setError("");
    } catch (e) {
      console.warn("Using fallback demo appointments for visual rendering:", e?.message);
      const mockList = getMockAppointments().map(normalizeAppointment);
      mockList.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      setAppointments(mockList);
      setError("");
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
      setBusiness(res.data || { name: "Aura Studio", slug: "aura-studio" });
    } catch (e) {
      setBusiness({ name: "Aura Studio", slug: "aura-studio" });
    }
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments(true);
    fetchServices();
    fetchBusiness();

    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchAppointments, fetchServices, fetchBusiness]);

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