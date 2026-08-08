import { useState, useEffect, useCallback } from "react";
import api from "../lib/api.js";

export function getMockServicesList() {
  return [
    {
      id: "s1",
      name: "Corte & Peinado Pro",
      category: "Peluquería",
      duration: 60,
      price: 4500,
      depositRequired: true,
      depositAmount: 1500,
      status: "active",
      color: "#10b981",
      description: "Corte de vanguardia, lavado tratante y peinado profesional."
    },
    {
      id: "s2",
      name: "Barba & Perfilado",
      category: "Barbería",
      duration: 45,
      price: 3000,
      depositRequired: true,
      depositAmount: 1000,
      status: "active",
      color: "#3b82f6",
      description: "Perfilado con navaja, toalla caliente y bálsamo."
    },
    {
      id: "s3",
      name: "Coloración & Balayage",
      category: "Color",
      duration: 120,
      price: 12000,
      depositRequired: true,
      depositAmount: 4000,
      status: "active",
      color: "#7c3aed",
      description: "Técnica de degradado natural con nutrición profunda."
    },
    {
      id: "s4",
      name: "Tratamiento Keratina",
      category: "Tratamientos",
      duration: 60,
      price: 8000,
      depositRequired: false,
      depositAmount: 0,
      status: "active",
      color: "#ec4899",
      description: "Alisado y reconstrucción de la fibra capilar."
    },
    {
      id: "s5",
      name: "Corte Masculino Premium",
      category: "Barbería",
      duration: 45,
      price: 3500,
      depositRequired: false,
      depositAmount: 0,
      status: "active",
      color: "#f59e0b",
      description: "Corte adaptado al estilo con lavado y asesoramiento."
    }
  ];
}

export default function useServices() {
  const [servicesList, setServicesList] = useState(() => getMockServicesList());
  const [workersList, setWorkersList] = useState([]);
  const [slaStats, setSlaStats] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailedService, setDetailedService] = useState(null);

  // Filters state
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [onlyVisibleOnline, setOnlyVisibleOnline] = useState(false);

  // Load Services list based on active filters
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {};
      if (searchText.trim()) params.search = searchText.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedWorkerId) params.workerId = selectedWorkerId;
      if (onlyVisibleOnline) params.visibleOnline = "true";

      const res = await api.get("/services", { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setServicesList(res.data);
      } else {
        setServicesList(getMockServicesList());
      }
    } catch (e) {
      console.warn("[useServices] Fallback to mock services for demo view:", e?.message);
      setServicesList(getMockServicesList());
      setError("");
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedCategory, selectedStatus, selectedWorkerId, onlyVisibleOnline]);

  // Load static lists and stats
  const loadStatsAndWorkers = useCallback(async () => {
    try {
      const [workersRes, slaRes, rulesRes] = await Promise.all([
        api.get("/workers").catch(err => {
          console.error("Error loading workers:", err);
          return { data: [] };
        }),
        api.get("/appointments/sla-service/stats").catch(err => {
          console.error("Error loading SLA stats:", err);
          return { data: null };
        }),
        api.get("/inventory/rules").catch(err => {
          console.error("Error loading consumption rules:", err);
          return { data: [] };
        })
      ]);

      setWorkersList(Array.isArray(workersRes.data) ? workersRes.data : []);
      setSlaStats(slaRes.data);
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : []);
    } catch (err) {
      console.error("Error in loadStatsAndWorkers:", err);
    }
  }, []);

  // Fetch workers, rules and SLA stats on mount
  useEffect(() => {
    loadStatsAndWorkers();
  }, [loadStatsAndWorkers]);

  // Fetch services when filters change
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Actions
  const handleAdd = () => {
    setEditingService(null);
    setShowFormModal(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setShowFormModal(true);
  };

  const handleDuplicate = (service) => {
    const duplicated = {
      ...service,
      id: undefined, // Clear ID to force creation
      name: `${service.name} (Copia)`,
      workers: service.workers || [],
      consumptionRules: service.consumptionRules || []
    };
    setEditingService(duplicated);
    setShowFormModal(true);
  };

  const handleToggleStatus = async (service) => {
    try {
      const newStatus = service.status === "active" ? "inactive" : "active";
      await api.patch(`/services/${service.id}/status`, { status: newStatus });
      loadServices();
    } catch (e) {
      console.error("Error toggling status:", e);
      setError("No se pudo cambiar el estado del servicio.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el servicio "${name}"? Esta acción borrará todas las citas asociadas para evitar conflictos.`)) return;
    try {
      setLoading(true);
      await api.delete(`/services/${id}`);
      loadServices();
    } catch (e) {
      console.error("Error deleting service:", e);
      setError(e?.response?.data?.error || "Error al eliminar el servicio del catálogo.");
      setLoading(false);
    }
  };

  const handleViewDetail = (service) => {
    setDetailedService(service);
    setShowDetailModal(true);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedWorkerId("");
    setOnlyVisibleOnline(false);
  };

  return {
    servicesList,
    workersList,
    slaStats,
    rules,
    loading,
    error,
    setError,
    
    // Filters and search
    searchText,
    setSearchText,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedWorkerId,
    setSelectedWorkerId,
    onlyVisibleOnline,
    setOnlyVisibleOnline,
    handleClearFilters,
    
    // Modals visibility control
    showFormModal,
    setShowFormModal,
    editingService,
    setEditingService,
    showDetailModal,
    setShowDetailModal,
    detailedService,
    setDetailedService,
    
    // Actions & reload
    loadServices,
    handleAdd,
    handleEdit,
    handleDuplicate,
    handleToggleStatus,
    handleDelete,
    handleViewDetail
  };
}
