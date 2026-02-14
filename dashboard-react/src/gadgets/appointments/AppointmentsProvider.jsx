import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:3001/api";

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API}/appointments`);
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

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
      loading,
      error,
      setError,
      fetchAppointments,
      upsertAppointment,
      removeAppointment,
    }),
    [appointments, loading, error, fetchAppointments, upsertAppointment, removeAppointment]
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointmentsStore() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointmentsStore debe usarse dentro de <AppointmentsProvider />");
  return ctx;
}