import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Button, Card, Table, Badge, Form, InputGroup, Spinner, Alert } from "react-bootstrap";
import { Plus, Edit2, Trash2, Scissors, Clock, Tag, Search, Filter, RefreshCw, Eye, Copy, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ServiceModal from "../header/services/ServiceModal.jsx";
import ServiceDetailModal from "../header/services/ServiceDetailModal.jsx";
import api from "../lib/api.js";

import { useBusinessModel } from "../hooks/useBusinessModel.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ServicesView() {
  const { t } = useTranslation("views");
  const { serviceCategories } = useBusinessModel();
  const [servicesList, setServicesList] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailedService, setDetailedService] = useState(null);

  // Estados de Filtros
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [onlyVisibleOnline, setOnlyVisibleOnline] = useState(false);

  // Carga de Servicios con Filtros
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

  // Carga de colaboradores una sola vez al montar
  useEffect(() => {
    api.get("/workers")
      .then(res => setWorkersList(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading workers for filter:", err));
  }, []);

  // Recargar servicios al cambiar los filtros
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Acciones
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
      id: undefined, // limpia el ID para forzar creación
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

  const getStatusBadge = (statusVal) => {
    switch (String(statusVal).toLowerCase()) {
      case "active":
      case "activo":
        return <Badge bg="success" className="px-2.5 py-1 rounded-pill fw-bold text-white bg-emerald-500">Activo</Badge>;
      case "hidden_online":
      case "hidden":
        return <Badge bg="warning" className="px-2.5 py-1 rounded-pill fw-bold text-white bg-amber-500">Oculto Online</Badge>;
      case "inactive":
      case "inactivo":
      default:
        return <Badge bg="danger" className="px-2.5 py-1 rounded-pill fw-bold text-white bg-red-500">Inactivo</Badge>;
    }
  };

  const getCommissionText = (s) => {
    if (s.commissionType === "ninguno" || !s.commissionValue) return "—";
    if (s.commissionType === "porcentaje") return `${s.commissionValue}%`;
    return currency(s.commissionValue);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedWorkerId("");
    setOnlyVisibleOnline(false);
  };

  return (
    <Container fluid className="p-0 pb-4">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3 text-gray-900">Gestión de Servicios</h1>
          <p className="text-muted mb-0">Administra tu catálogo de servicios, precios, duración, profesionales asignados y reglas comerciales.</p>
        </div>
        <Button
          variant="dark"
          className="d-flex align-items-center gap-2 px-4 py-2.5 btn-premium shadow-sm border-0"
          onClick={handleAdd}
          style={{ borderRadius: "12px", background: "#111827" }}
        >
          <Plus size={18} />
          <span>Agregar Servicio</span>
        </Button>
      </header>

      {error && <Alert variant="danger" className="rounded-2xl border-0 shadow-sm mb-4">{error}</Alert>}

      {/* FILTROS SUPERIORES (Estilo SaaS Moderno) */}
      <Card className="border-0 shadow-sm rounded-2xl p-3.5 mb-4 bg-white">
        <Row className="g-3 align-items-end">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold text-xs text-muted block mb-1">Buscar servicio</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-gray-200 text-muted"><Search size={15} /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Ej: Corte capilar..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-r-xl border-gray-200"
                />
              </InputGroup>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label className="fw-semibold text-xs text-muted block mb-1">Categoría</Form.Label>
              <Form.Select
                size="sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border-gray-200 focus-ring-purple"
              >
                <option value="">Todas las categorías</option>
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label className="fw-semibold text-xs text-muted block mb-1">Estado</Form.Label>
              <Form.Select
                size="sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border-gray-200 focus-ring-purple"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="hidden_online">Oculto Online</option>
                <option value="inactive">Inactivo</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold text-xs text-muted block mb-1">Profesional asignado</Form.Label>
              <Form.Select
                size="sm"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="rounded-xl border-gray-200 focus-ring-purple"
              >
                <option value="">Todos los profesionales</option>
                {workersList.map(w => (
                  <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2} className="d-flex gap-2">
            <Button
              variant="light"
              size="sm"
              onClick={handleClearFilters}
              className="w-100 py-2 border rounded-xl fw-bold text-xs d-flex align-items-center justify-content-center gap-1.5 hover-bg-gray-100"
            >
              <RefreshCw size={13} />
              <span>Limpiar</span>
            </Button>
          </Col>

          <Col md={12} className="pt-2 border-top mt-2.5">
            <Form.Check
              type="switch"
              id="online-visibility-switch"
              label={<span className="fw-semibold text-gray-700 smaller">Mostrar solo visibles en Reservas Online</span>}
              checked={onlyVisibleOnline}
              onChange={(e) => setOnlyVisibleOnline(e.target.checked)}
              className="custom-switch"
            />
          </Col>
        </Row>
      </Card>

      {/* TABLA PRINCIPAL DE CATÁLOGO */}
      <div className="card-premium p-0 overflow-hidden bg-white shadow-sm border rounded-2xl">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" variant="purple" className="text-purple-600 mb-2" />
            <p className="fw-semibold">Cargando catálogo comercial en tiempo real...</p>
          </div>
        ) : (
          <Table hover responsive className="mb-0 align-middle">
            <thead className="bg-light border-bottom">
              <tr style={{ fontSize: "11px", color: "#6b7280" }}>
                <th className="px-4 py-3 border-0">Servicio / Tratamiento</th>
                <th className="py-3 border-0">Categoría</th>
                <th className="py-3 border-0 text-center">Duración</th>
                <th className="py-3 border-0 text-center">Precio Base</th>
                <th className="py-3 border-0">Profesionales Habilitados</th>
                <th className="py-3 border-0 text-center">Comisión</th>
                <th className="py-3 border-0 text-center" style={{ width: "130px" }}>Estado</th>
                <th className="py-3 border-0 text-end px-4">Acciones</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "13px" }}>
              {servicesList.map((s) => {
                const totalDuration = Number(s.duration || 0) + Number(s.preparationMinutes || 0) + Number(s.cleanupMinutes || 0);
                return (
                  <tr key={s.id} className="transition-all hover-bg-light">
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ 
                            width: "34px", 
                            height: "34px", 
                            backgroundColor: `${s.color || "#10b981"}1a`,
                            color: s.color || "#10b981"
                          }}
                        >
                          <Scissors size={15} />
                        </div>
                        <div>
                          <span className="fw-black text-gray-900 block">{s.name}</span>
                          {s.description && (
                            <small className="text-muted block text-xxs text-truncate mt-0.5" style={{ maxWidth: "180px" }}>
                              {s.description}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" className="text-secondary border rounded-pill px-2.5 py-1 text-xs fw-semibold">
                        {s.category || "Estilismo"}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <div className="d-inline-flex align-items-center gap-1.5 text-muted fw-semibold">
                        <Clock size={13} className="text-purple-500" />
                        <span>{s.duration} min</span>
                        {totalDuration !== Number(s.duration) && (
                          <span className="text-xxs text-pink-600 block">({totalDuration}m total)</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="fw-black text-purple-700 block" style={{ fontSize: "14.5px" }}>
                        {currency(s.price)}
                      </span>
                      {s.depositRequired && (
                        <small className="text-purple-900 block text-xxs mt-0.5 fw-bold">Seña: {currency(s.depositAmount)}</small>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "250px" }}>
                        {s.workers && s.workers.length > 0 ? (
                          s.workers.map(({ worker }) => (
                            <Badge 
                              key={worker.id}
                              bg="light" 
                              className="text-purple-700 border border-purple-100 rounded-pill px-2 py-1 text-xs fw-semibold"
                              style={{ fontSize: "10.5px" }}
                            >
                              {worker.firstName} {worker.lastName?.charAt(0)}.
                            </Badge>
                          ))
                        ) : (
                          <span className="text-emerald-700 smaller fw-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-pill">
                            Disponible para todos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center fw-bold text-gray-800">
                      {getCommissionText(s)}
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1.5">
                        <Form.Check 
                          type="switch"
                          id={`status-switch-${s.id}`}
                          checked={s.status === "active" || s.status === "hidden_online"}
                          onChange={() => handleToggleStatus(s)}
                          className={`custom-status-switch ${
                            s.status === "active" ? "switch-success" : 
                            s.status === "hidden_online" ? "switch-warning" : "switch-danger"
                          }`}
                          title={s.status === "active" || s.status === "hidden_online" ? "Desactivar servicio" : "Activar servicio"}
                        />
                        <span 
                          className={`fw-bold ${
                            s.status === "active" ? "text-emerald-500" : 
                            s.status === "hidden_online" ? "text-amber-500" : "text-red-600"
                          }`} 
                          style={{ fontSize: "12px", minWidth: "55px", textAlign: "left" }}
                        >
                          {s.status === "active" ? "Activo" : 
                           s.status === "hidden_online" ? "Oculto" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-end px-4">
                      <div className="d-flex justify-content-end gap-1.5">
                        <Button 
                          variant="light" 
                          size="sm" 
                          onClick={() => handleViewDetail(s)} 
                          className="p-2 border rounded-xl hover-bg-gray-100"
                          title="Ver Ficha Técnica"
                        >
                          <Eye size={14} className="text-gray-700" />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          onClick={() => handleEdit(s)} 
                          className="p-2 border rounded-xl hover-bg-gray-100"
                          title="Editar Servicio"
                        >
                          <Edit2 size={14} className="text-primary" />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          onClick={() => handleDuplicate(s)} 
                          className="p-2 border rounded-xl hover-bg-gray-100"
                          title="Duplicar / Clonar"
                        >
                          <Copy size={14} className="text-purple-600" />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          onClick={() => handleDelete(s.id, s.name)} 
                          className="p-2 border rounded-xl hover-bg-red-50"
                          title="Eliminar del Catálogo"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {servicesList.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No se encontraron servicios comerciales en base a los filtros provistos. ¡Hacé clic en "Agregar Servicio" para comenzar!
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      <ServiceModal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          loadServices();
        }}
        editService={editingService}
      />

      {/* MODAL DE VER DETALLE */}
      <ServiceDetailModal
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false);
          setDetailedService(null);
        }}
        service={detailedService}
      />
    </Container>
  );
}
