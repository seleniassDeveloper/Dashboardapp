import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
import { useTranslation } from "react-i18next";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export function useClients() {
  const { t } = useTranslation("views");
  const [clients, setClients] = useState([]);
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
      setClients(safeArray(res.data));
    } catch (e) {
      setError(e?.response?.data?.error || t("clients.errors.load", { defaultValue: "Error al cargar clientes." }));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [q, t]);

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
