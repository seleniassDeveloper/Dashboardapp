import React, { useState } from "react";
import { Offcanvas, Form, Button, Row, Col, Badge, ListGroup } from "react-bootstrap";
import { 
  Menu, Bell, Search, Sliders, Scissors, Clock, Star, TrendingUp, 
  LayoutGrid, SlidersHorizontal, FileText, Plus, Barcode, BarChart3, ChevronRight 
} from "lucide-react";
import CatalogTab from "./CatalogTab.jsx";
import "./ServicesMobile.css";

export default function ServicesMobile({ state }) {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "rules" | "sla" | "history"
  const [showFilters, setShowFilters] = useState(false);

  const {
    servicesList,
    workersList,
    slaStats,
    rules,
    loading,
    error,
    
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
    
    // Actions
    handleAdd,
    handleViewDetail,
    handleEdit
  } = state;

  // Compute Categories from service categories or list
  const categories = React.useMemo(() => {
    const set = new Set(servicesList.map(s => s.category).filter(Boolean));
    return Array.from(set);
  }, [servicesList]);

  // KPIs Calculations
  const kpis = React.useMemo(() => {
    const activeCount = servicesList.filter(s => s.status === "active" || s.status === "hidden_online").length;
    
    return [
      {
        id: "active-services",
        value: activeCount || 36,
        label: "Servicios activos",
        icon: <Scissors size={20} />,
        iconClass: "s-kpi__icon--purple"
      },
      {
        id: "reservations-today",
        value: 12,
        label: "En reservas hoy",
        icon: <Clock size={20} />,
        iconClass: "s-kpi__icon--green"
      },
      {
        id: "rating",
        value: "4.8",
        label: "Satisfacción promedio",
        icon: <Star size={20} />,
        iconClass: "s-kpi__icon--orange"
      },
      {
        id: "sla-compliance",
        value: `${slaStats?.pctOnTime ?? 92}%`,
        label: "SLA cumplido",
        icon: <TrendingUp size={20} />,
        iconClass: "s-kpi__icon--purple"
      }
    ];
  }, [servicesList, slaStats]);

  // Tab content render switcher
  const renderTabContent = () => {
    if (activeTab === "catalog") {
      return <CatalogTab state={state} />;
    }

    if (activeTab === "rules") {
      return (
        <div className="s-card p-4 bg-white mb-4 animate-fade-in">
          <h4 className="fw-black h6 text-gray-900 mb-3 text-uppercase tracking-wider">Reglas de Consumo de Insumo</h4>
          <p className="text-muted smaller mb-3.5">Fórmulas de descuento automático de stock de almacén por servicio finalizado.</p>
          
          <ListGroup variant="flush" className="gap-2">
            {rules.length > 0 ? (
              rules.map(r => (
                <ListGroup.Item key={r.id} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="text-gray-900 small d-block">{r.product?.name || "Insumo"}</strong>
                    <span className="smaller text-muted">Servicio: {r.service?.name || "Tratamiento"}</span>
                  </div>
                  <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2.5 py-1 fw-bold smaller">
                    -{r.quantity} {r.product?.unit || "ml"}
                  </Badge>
                </ListGroup.Item>
              ))
            ) : (
              <div className="text-center py-5 text-muted smaller">No hay reglas de consumo configuradas.</div>
            )}
          </ListGroup>
        </div>
      );
    }

    if (activeTab === "sla") {
      return (
        <div className="d-grid gap-3 animate-fade-in">
          {/* SLA Overview Panel */}
          <div className="s-card p-4 bg-white">
            <h4 className="fw-black h6 text-gray-900 mb-3 text-uppercase tracking-wider">Métricas de SLA de Ejecución</h4>
            <div className="d-grid grid-cols-2 gap-3 mb-2.5 text-center">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-muted smaller d-block mb-1">A tiempo</span>
                <strong className="text-purple-700 h4 block m-0">{slaStats?.pctOnTime ?? 92}%</strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-muted smaller d-block mb-1">Total completados</span>
                <strong className="text-emerald-700 h4 block m-0">{slaStats?.totalCompleted ?? 124}</strong>
              </div>
            </div>
            {slaStats?.bottleneckService && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center small text-amber-950">
                ⚠️ cuello de botella: <strong>{slaStats.bottleneckService.serviceName}</strong> (Desviación prom. +{Math.round(slaStats.bottleneckService.avgVariance / 60)}m)
              </div>
            )}
          </div>

          {/* Average Times list */}
          <div className="s-card p-4 bg-white">
            <h4 className="fw-black h6 text-gray-900 mb-3 text-uppercase tracking-wider">Tiempos Promedio de Servicio</h4>
            <ListGroup variant="flush" className="gap-2">
              {slaStats?.serviceStats ? (
                slaStats.serviceStats.map(s => (
                  <ListGroup.Item key={s.serviceId} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-gray-900 small d-block">{s.serviceName}</strong>
                      <span className="smaller text-muted">Ejecuciones: {s.count} veces</span>
                    </div>
                    <div className="text-end">
                      <strong className="text-purple-600 small block">{Math.round(s.avgActual / 60)} min prom.</strong>
                      <span className="smaller text-muted">Límite: {Math.round(s.avgEstimated / 60)} min</span>
                    </div>
                  </ListGroup.Item>
                ))
              ) : (
                <div className="text-center py-4 text-muted smaller">Cargando métricas de servicios...</div>
              )}
            </ListGroup>
          </div>
        </div>
      );
    }

    if (activeTab === "history") {
      return (
        <div className="s-card p-4 bg-white animate-fade-in">
          <h4 className="fw-black h6 text-gray-900 mb-3.5 text-uppercase tracking-wider">Historial de Ejecuciones</h4>
          <ListGroup variant="flush" className="gap-2">
            {slaStats?.recentSlas ? (
              slaStats.recentSlas.map(h => {
                const isDelayed = h.status === "demorado" || h.status === "critico";
                return (
                  <ListGroup.Item key={h.id} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-gray-900 small d-block">{h.serviceName}</strong>
                      <span className="smaller text-muted">Cliente: {h.clientName}</span>
                      <span className="smaller text-muted d-block">Colaborador: {h.professionalName}</span>
                    </div>
                    <div className="text-end">
                      <Badge bg={isDelayed ? "danger-soft text-danger" : "success-soft text-success"} className="rounded-pill px-2 py-0.5 smaller fw-bold mb-1 block">
                        {isDelayed ? "Demorado" : "A tiempo"}
                      </Badge>
                      <strong className="text-gray-800 small block">{Math.round((h.actualSec || 0) / 60)} min</strong>
                    </div>
                  </ListGroup.Item>
                );
              })
            ) : (
              <div className="text-center py-5 text-muted smaller">No se registran ejecuciones recientes.</div>
            )}
          </ListGroup>
        </div>
      );
    }
  };

  return (
    <div className="svc-mobile animate-fade-in">
      {/* SECCIÓN 1 — Header + buscador + filtros */}
      <header className="s-header">
        <button className="btn p-0 border-0 text-dark bg-transparent">
          <Menu size={22} />
        </button>
        <div className="s-header__title">
          <b>Servicios</b>
          <span>Gestión de tu catálogo</span>
        </div>
        <button className="s-bell">
          <Bell size={20} />
        </button>
      </header>

      {/* Buscador + Botón Filtros */}
      <div className="s-searchrow">
        <div className="s-search">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar servicios..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button className="s-filters-btn" onClick={() => setShowFilters(true)}>
          <Sliders size={16} />
          <span>Filtros</span>
        </button>
      </div>

      {/* SECCIÓN 2 — KPIs (carrusel horizontal de 4) */}
      <section className="s-kpis">
        {kpis.map(k => (
          <div key={k.id} className="s-kpi">
            <div className={`s-kpi__icon ${k.iconClass}`}>
              {k.icon}
            </div>
            <div className="s-kpi__value">{k.value}</div>
            <div className="s-kpi__label">{k.label}</div>
          </div>
        ))}
      </section>

      {/* SECCIÓN 3 — Pestañas (Tabs) */}
      <nav className="s-tabs">
        <button 
          onClick={() => setActiveTab("catalog")} 
          className={`s-tab ${activeTab === "catalog" ? "s-tab--active" : ""}`}
        >
          <LayoutGrid size={16} />
          <span>Catálogo</span>
        </button>
        <button 
          onClick={() => setActiveTab("rules")} 
          className={`s-tab ${activeTab === "rules" ? "s-tab--active" : ""}`}
        >
          <SlidersHorizontal size={16} />
          <span>Reglas</span>
        </button>
        <button 
          onClick={() => setActiveTab("sla")} 
          className={`s-tab ${activeTab === "sla" ? "s-tab--active" : ""}`}
        >
          <Clock size={16} />
          <span>SLA</span>
        </button>
        <button 
          onClick={() => setActiveTab("history")} 
          className={`s-tab ${activeTab === "history" ? "s-tab--active" : ""}`}
        >
          <FileText size={16} />
          <span>Historial</span>
        </button>
      </nav>

      {/* SECCIÓN 4 — Acciones rápidas (grid) */}
      <h3 className="s-section-title">Acciones rápidas</h3>
      <section className="s-quick">
        {/* Accion 1: + Nuevo servicio */}
        <button className="s-quick__item" onClick={handleAdd}>
          <Plus size={20} />
          <div className="s-quick__label">Nuevo servicio</div>
        </button>

        {/* Accion 2: Escanear formula */}
        <button className="s-quick__item" onClick={() => {}}>
          <Barcode size={20} />
          <div className="s-quick__label">Escanear fórmula</div>
        </button>

        {/* Accion 3: Ajustar tiempos */}
        <button className="s-quick__item" onClick={() => {}}>
          <Clock size={20} />
          <div className="s-quick__label">Ajustar tiempos</div>
        </button>

        {/* Accion 4: Ver SLA resumen */}
        <button className="s-quick__item" onClick={() => setActiveTab("sla")}>
          <BarChart3 size={20} />
          <div className="s-quick__label">Ver SLA resumen</div>
        </button>
      </section>

      {/* Active Tab Screen Render */}
      <div className="tab-render-container">
        {renderTabContent()}
      </div>

      {/* Filters Bottom Sheet Drawer */}
      <Offcanvas 
        show={showFilters} 
        onHide={() => setShowFilters(false)} 
        placement="bottom" 
        className="svc-filters-sheet rounded-top-3xl border-0 shadow-lg"
        style={{ height: "auto" }}
      >
        <Offcanvas.Header closeButton className="p-3.5 border-bottom bg-light">
          <Offcanvas.Title className="fw-black h6 text-gray-900 m-0">Filtrar Catálogo</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-grid gap-3">
          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">Categoría</Form.Label>
            <Form.Select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border-gray-250"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">Estado del Servicio</Form.Label>
            <Form.Select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border-gray-250"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="hidden_online">Oculto Online</option>
              <option value="inactive">Inactivo</option>
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">Profesional Asignado</Form.Label>
            <Form.Select 
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="rounded-xl border-gray-250"
            >
              <option value="">Todos los profesionales</option>
              {workersList.map(w => (
                <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="py-1">
            <Form.Check
              type="switch"
              id="online-visibility-switch-mobile"
              label={<span className="fw-semibold text-gray-700 smaller">Solo visibles en Reservas Online</span>}
              checked={onlyVisibleOnline}
              onChange={(e) => setOnlyVisibleOnline(e.target.checked)}
              className="custom-switch"
            />
          </Form.Group>

          <div className="d-grid gap-2.5 mt-2">
            <Button 
              variant="purple" 
              onClick={() => setShowFilters(false)}
              className="rounded-xl py-2.5 text-white bg-purple-600 hover-bg-purple-700 border-0 fw-bold"
            >
              Aplicar Filtros
            </Button>
            <Button 
              variant="light" 
              onClick={() => { handleClearFilters(); setShowFilters(false); }}
              className="rounded-xl py-2.5 text-gray-800 bg-white border"
            >
              Limpiar Filtros
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
