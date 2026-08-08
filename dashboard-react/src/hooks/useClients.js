import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
import { useTranslation } from "react-i18next";

export function getMockClients() {
  return [
    {
      id: "client-demo-1",
      firstName: "Paula",
      lastName: "Gómez",
      email: "paula.gomez@gmail.com",
      phone: "+54 9 11 5555-1234",
      notes: "Prefiere turnos por la mañana. Alérgica a amoníaco.",
      totalAppointments: 12,
      lastAppointmentDate: "2026-08-01T10:00:00.000Z",
      createdAt: "2026-01-15T12:00:00.000Z"
    },
    {
      id: "client-demo-2",
      firstName: "Carlos",
      lastName: "Rodríguez",
      email: "carlos.rodriguez@hotmail.com",
      phone: "+54 9 11 5555-5678",
      notes: "Cliente recurrente de barbería.",
      totalAppointments: 8,
      lastAppointmentDate: "2026-07-28T14:30:00.000Z",
      createdAt: "2026-02-10T15:30:00.000Z"
    },
    {
      id: "client-demo-3",
      firstName: "Sofía",
      lastName: "Martínez",
      email: "sofia.martinez@gmail.com",
      phone: "+54 9 11 5555-9012",
      notes: "Tratamientos de coloración y Balayage.",
      totalAppointments: 15,
      lastAppointmentDate: "2026-08-05T11:00:00.000Z",
      createdAt: "2025-11-20T10:00:00.000Z"
    },
    {
      id: "client-demo-4",
      firstName: "Lucía",
      lastName: "Fernández",
      email: "lucia.fernandez@yahoo.com",
      phone: "+54 9 11 5555-3456",
      notes: "Consultó por tratamiento de keratina.",
      totalAppointments: 4,
      lastAppointmentDate: "2026-07-15T16:00:00.000Z",
      createdAt: "2026-03-01T09:15:00.000Z"
    },
    {
      id: "client-demo-5",
      firstName: "Martín",
      lastName: "Benítez",
      email: "martin.benitez@outlook.com",
      phone: "+54 9 11 5555-7890",
      notes: "Corte masculino y perfilado de barba.",
      totalAppointments: 6,
      lastAppointmentDate: "2026-07-20T18:00:00.000Z",
      createdAt: "2026-02-25T11:45:00.000Z"
    }
  ];
}

const safeArray = (x) => (Array.isArray(x) ? x : []);

export function useClients() {
  const { t } = useTranslation("views");
  const [clients, setClients] = useState(() => getMockClients());
  const [appointments, setAppointments] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    api.get("/appointments")
      .then((res) => setAppointments(safeArray(res.data)))
      .catch((e) => console.error("Error cargando citas:", e));
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setError(""); 
      setOkMsg(""); 
      setLoading(true);
      const res = await api.get(`/clients`, {
        params: q.trim() ? { search: q.trim() } : {},
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setClients(res.data);
      } else {
        setClients(getMockClients());
      }
    } catch (e) {
      console.warn("[useClients] Fallback to mock clients for demo view:", e?.message);
      setClients(getMockClients());
      setError("");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(), 250);
    return () => clearTimeout(timer);
  }, [q, fetchClients]);

  const sorted = useMemo(() => {
    return [...clients].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  }, [clients]);

  const handleSaved = useCallback((saved) => {
    setClients((prev) => {
      const id = saved?.id;
      if (!id) return prev;
      return prev.some((c) => c.id === id)
        ? prev.map((c) => (c.id === id ? saved : c))
        : [saved, ...prev];
    });
  }, []);

  const handleDelete = useCallback(async (client) => {
    if (!client?.id) return;
    try {
      setBusyId(client.id);
      await api.delete(`/clients/${client.id}`);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setOkMsg(t("clients.success.deleted", { defaultValue: "Cliente eliminado correctamente." }));
    } catch (e) {
      setError(e?.response?.data?.error || t("clients.errors.delete", { defaultValue: "Error al eliminar cliente." }));
    } finally {
      setBusyId("");
    }
  }, [t]);

  return {
    clients: sorted, appointments, q, setQ, loading, busyId,
    error, okMsg, fetchClients, handleSaved, handleDelete,
    setClients, setError, setOkMsg,
  };
}
