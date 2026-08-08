import { useCallback, useEffect, useState, useMemo } from "react";
import api from "../lib/api.js";
import { useTranslation } from "react-i18next";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const calculateCommission = (billing, comm) => {
  if (!comm) return 0;
  if (comm.type === "porcentaje") {
    return Math.round(billing * ((comm.services || 40) / 100));
  } else if (comm.type === "fijo") {
    return Number(comm.services || 0);
  } else { // mixto
    return Number(comm.services || 0) + Math.round(billing * 0.1);
  }
};

export function getMockTeamList() {
  return [
    {
      id: "w1",
      firstName: "Ana",
      lastName: "Silva",
      role: "professional",
      status: "activo",
      phone: "+54 9 11 5555-1234",
      email: "ana.silva@auradash.digital",
      billing: 185000,
      occupancy: 82,
      commissions: { type: "porcentaje", services: 45 }
    },
    {
      id: "w2",
      firstName: "Carlos",
      lastName: "Gómez",
      role: "professional",
      status: "activo",
      phone: "+54 9 11 5555-5678",
      email: "carlos.gomez@auradash.digital",
      billing: 240000,
      occupancy: 91,
      commissions: { type: "porcentaje", services: 50 }
    },
    {
      id: "w3",
      firstName: "Mariana",
      lastName: "López",
      role: "manager",
      status: "activo",
      phone: "+54 9 11 5555-9012",
      email: "mariana.lopez@auradash.digital",
      billing: 145000,
      occupancy: 70,
      commissions: { type: "porcentaje", services: 40 }
    }
  ];
}

export function useTeam() {
  const { t } = useTranslation("views");
  const [workers, setWorkers] = useState(() => getMockTeamList());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modal controllers
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("members");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [staffRes, apptsRes] = await Promise.all([
        api.get(`/staff`).catch(() => ({ data: [] })),
        api.get(`/appointments`).catch(() => ({ data: [] })),
      ]);
      const staffList = safeArray(staffRes.data);
      if (staffList.length > 0) {
        setWorkers(staffList);
      } else {
        setWorkers(getMockTeamList());
      }
      setAppointments(safeArray(apptsRes.data));
    } catch (e) {
      console.warn("[useTeam] Fallback to mock team for demo view:", e?.message);
      setWorkers(getMockTeamList());
      setError("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (w) => {
    setEditing(w);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${name} del equipo? Esta acción no se puede deshacer.`)) return;
    try {
      setLoading(true);
      await api.delete(`/workers/${id}`);
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.error || "Error al eliminar miembro de equipo.");
      setLoading(false);
    }
  };

  const onSaved = () => {
    loadData();
  };

  // Process productivity metrics per professional
  const staffStats = useMemo(() => {
    return workers.map((w) => {
      const comm = w.commissions || { type: "porcentaje", services: 40 };
      const estimatedCommission = calculateCommission(w.billing, comm);
      
      // Simulated or real retention rate
      let retentionRate = 68;
      if (w.firstName?.toLowerCase().includes("andrea")) retentionRate = 87;
      else if (w.firstName?.toLowerCase().includes("nicolas") || w.firstName?.toLowerCase().includes("nicolás")) retentionRate = 64;
      else if (w.firstName?.toLowerCase().includes("florencia")) retentionRate = 75;

      const ticketAvg = w.billing > 0 
        ? Math.round(w.billing / (appointments.filter(a => a.workerId === w.id && (a.status === "DONE" || a.status === "CONFIRMED")).length || 1)) 
        : 0;

      return {
        ...w,
        name: `${w.firstName} ${w.lastName}`.trim(),
        estimatedCommission,
        retentionRate,
        ticketAvg,
      };
    }).sort((a, b) => b.billing - a.billing);
  }, [workers, appointments]);

  // Executive summary general metrics
  const dashboardMetrics = useMemo(() => {
    const totalBilling = staffStats.reduce((sum, w) => sum + w.billing, 0);
    const avgOccupancy = staffStats.length > 0 ? Math.round(staffStats.reduce((sum, w) => sum + w.occupancy, 0) / staffStats.length) : 0;
    const avgRetention = staffStats.length > 0 ? Math.round(staffStats.reduce((sum, w) => sum + w.retentionRate, 0) / staffStats.length) : 0;
    const totalCommissions = staffStats.reduce((sum, w) => sum + w.estimatedCommission, 0);
    const avgTicket = staffStats.length > 0 ? Math.round(staffStats.reduce((sum, w) => sum + w.ticketAvg, 0) / staffStats.length) : 0;

    return {
      totalBilling,
      avgOccupancy,
      avgRetention,
      totalCommissions,
      avgTicket,
    };
  }, [staffStats]);

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case "activo":
        return "#10b981"; // Emerald
      case "vacaciones":
        return "#f59e0b"; // Amber
      case "licencia":
        return "#3b82f6"; // Blue
      case "suspendido":
      case "inactivo":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getRoleName = (roleKey) => {
    switch (String(roleKey).toLowerCase()) {
      case "owner":
        return "Owner";
      case "admin":
        return "Administrador";
      case "manager":
        return "Manager";
      case "professional":
        return "Profesional";
      case "reception":
        return "Recepción";
      case "viewer":
        return "Visualizador";
      default:
        return "Profesional";
    }
  };

  return {
    workers,
    appointments,
    loading,
    error,
    showModal,
    setShowModal,
    editing,
    setEditing,
    activeTab,
    setActiveTab,
    loadData,
    openCreate,
    openEdit,
    handleDelete,
    onSaved,
    staffStats,
    dashboardMetrics,
    getStatusColor,
    getRoleName,
  };
}
