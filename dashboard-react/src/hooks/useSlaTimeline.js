import { useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api.js";

export function getMockSlaTimelineAppointments() {
  const now = new Date();
  
  const createPastTime = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();
  const createFutureTime = (minutesLater) => new Date(now.getTime() + minutesLater * 60 * 1000).toISOString();

  return [
    {
      id: "sla-demo-1",
      clientName: "Paula Gómez",
      serviceName: "Corte & Peinado Pro",
      workerName: "Ana Silva",
      status: "CONFIRMED",
      startsAt: createPastTime(10),
      arrivedAt: createPastTime(8),
      estimatedDurationMinutes: 45,
      actualDurationMinutes: null,
      slaStatus: "IN_PROGRESS",
      client: { firstName: "Paula", lastName: "Gómez", phone: "+54 9 11 5555-1234" },
      service: { name: "Corte & Peinado Pro", duration: 45, price: 45 },
      worker: { firstName: "Ana", lastName: "Silva" }
    },
    {
      id: "sla-demo-2",
      clientName: "Carlos Rodríguez",
      serviceName: "Barba & Perfilado",
      workerName: "Ana Silva",
      status: "CONFIRMED",
      startsAt: createFutureTime(30),
      arrivedAt: null,
      estimatedDurationMinutes: 30,
      actualDurationMinutes: null,
      slaStatus: "SCHEDULED",
      client: { firstName: "Carlos", lastName: "Rodríguez", phone: "+54 9 11 5555-5678" },
      service: { name: "Barba & Perfilado", duration: 30, price: 30 },
      worker: { firstName: "Ana", lastName: "Silva" }
    },
    {
      id: "sla-demo-3",
      clientName: "Sofía Martínez",
      serviceName: "Coloración & Balayage",
      workerName: "Carlos Gómez",
      status: "CONFIRMED",
      startsAt: createPastTime(40),
      arrivedAt: createPastTime(40),
      estimatedDurationMinutes: 120,
      actualDurationMinutes: null,
      slaStatus: "IN_PROGRESS",
      client: { firstName: "Sofía", lastName: "Martínez", phone: "+54 9 11 5555-9012" },
      service: { name: "Coloración & Balayage", duration: 120, price: 120 },
      worker: { firstName: "Carlos", lastName: "Gómez" }
    },
    {
      id: "sla-demo-4",
      clientName: "Lucía Fernández",
      serviceName: "Tratamiento Keratina",
      workerName: "Ana Silva",
      status: "COMPLETED",
      startsAt: createPastTime(90),
      arrivedAt: createPastTime(90),
      completedAt: createPastTime(30),
      estimatedDurationMinutes: 60,
      actualDurationMinutes: 60,
      slaStatus: "COMPLETED_ON_TIME",
      client: { firstName: "Lucía", lastName: "Fernández", phone: "+54 9 11 5555-3456" },
      service: { name: "Tratamiento Keratina", duration: 60, price: 80 },
      worker: { firstName: "Ana", lastName: "Silva" }
    }
  ];
}

export function useSlaTimeline() {
  const [appointments, setAppointments] = useState(() => getMockSlaTimelineAppointments());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/appointments/sla-today");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAppointments(res.data);
      } else {
        setAppointments(getMockSlaTimelineAppointments());
      }
    } catch (err) {
      console.warn("[useSlaTimeline] Fallback to mock SLA timeline for demo view:", err?.message);
      setAppointments(getMockSlaTimelineAppointments());
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Timer en vivo en el cliente cada 1s para actualizar reloj en tiempo real sin golpear el backend
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const markArrived = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/arrive`);
      await fetchTimeline();
    } catch (err) {
      console.warn("[useSlaTimeline] Updating local state for demo arrive:", err?.message);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, arrivedAt: new Date().toISOString(), slaStatus: "IN_PROGRESS" }
            : a
        )
      );
    }
  };

  const markCompleted = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/complete`);
      await fetchTimeline();
    } catch (err) {
      console.warn("[useSlaTimeline] Updating local state for demo complete:", err?.message);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, completedAt: new Date().toISOString(), slaStatus: "COMPLETED_ON_TIME" }
            : a
        )
      );
    }
  };

  return {
    appointments,
    loading,
    error,
    now,
    fetchTimeline,
    markArrived,
    markCompleted
  };
}
