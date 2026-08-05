import { useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api.js";

export function useSlaTimeline() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/appointments/sla-today");
      setAppointments(res.data || []);
    } catch (err) {
      console.error("[useSlaTimeline] Error fetching SLA timeline:", err);
      setError(err?.response?.data?.error || "Error al cargar citas del día.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Timer en vivo en el cliente cada 1s para actualizar relos en tiempo real sin golpear el backend
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
      console.error("[useSlaTimeline] Error marking arrived:", err);
      throw err;
    }
  };

  const markCompleted = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/complete`);
      await fetchTimeline();
    } catch (err) {
      console.error("[useSlaTimeline] Error marking completed:", err);
      throw err;
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
