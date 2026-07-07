import { useState, useEffect, useCallback } from "react";
import api from "../lib/api.js";

export default function useServices() {
  const [servicesList, setServicesList] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [slaStats, setSlaStats] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setServicesList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error loading services:", e);
      setError("No se pudieron cargar los servicios del catálogo.");
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
