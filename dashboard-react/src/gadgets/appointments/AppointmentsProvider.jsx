import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../../lib/api.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments`);
      const list = Array.isArray(res.data) ? res.data : [];
      list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      setAppointments(list);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
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

  const { user } = useAuth();

  useEffect(() => {
    // Solo disparar request si auth está listo y hay usuario
    if (!user) return;
    
    fetchAppointments();
    fetchServices();
  }, [user, fetchAppointments, fetchServices]);

  const upsertAppointment = useCallback((appointment) => {
    if (!appointment?.id) return;
    setAppointments((prev) => {
      const exists = prev.some((x) => x.id === appointment.id);
      const next = exists ? prev.map((x) => (x.id === appointment.id ? appointment : x)) : [...prev, appointment];
      next.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      return next;
    });
  }, []);

  const removeAppointment = useCallback((id) => {
    if (!id) return;
    setAppointments((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      appointments,
      services,
      loading,
      error,
      setError,
      fetchAppointments,
      fetchServices,
      upsertAppointment,
      removeAppointment,
    }),
    [appointments, services, loading, error, fetchAppointments, fetchServices, upsertAppointment, removeAppointment]
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointmentsStore() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointmentsStore debe usarse dentro de <AppointmentsProvider />");
  return ctx;
}