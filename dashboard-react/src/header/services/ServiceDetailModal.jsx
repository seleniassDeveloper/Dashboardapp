import React, { useEffect, useState } from "react";
import { Modal, Row, Col, Badge, Button } from "react-bootstrap";
import { X, Calendar, Shield, Clock, Package, Info, TrendingUp, Users } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ServiceDetailModal({ show, onHide, service }) {
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  useEffect(() => {
    if (show && service?.id) {
      setLoadingAppts(true);
      api.get("/appointments")
        .then(res => {
          const appts = Array.isArray(res.data) ? res.data : [];
          const now = new Date();
          const filtered = appts
            .filter(a => a.serviceId === service.id && new Date(a.startsAt) > now && a.status !== "CANCELLED")
            .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
          setFutureAppointments(filtered);
        })
        .catch(err => console.error("Error loading future appointments:", err))
        .finally(() => setLoadingAppts(false));
    } else {
      setFutureAppointments([]);
    }
  }, [show, service]);

  if (!service) return null;

  const prep = Number(service.preparationMinutes || 0);
  const core = Number(service.duration || 0);
  const clean = Number(service.cleanupMinutes || 0);
  const totalDuration = prep + core + clean;
  const totalDurationSafe = totalDuration || 1;

  const getStatusBadge = (statusVal) => {
    switch (String(statusVal).toLowerCase()) {
      case "active":
      case "activo":
        return <Badge bg="success" className="px-3 py-1.5 rounded-pill fw-bold text-white bg-emerald-500">Activo</Badge>;
      case "hidden_online":
      case "hidden":
        return <Badge bg="warning" className="px-3 py-1.5 rounded-pill fw-bold text-white bg-amber-500">Oculto Online</Badge>;
      case "inactive":
      case "inactivo":
      default:
        return <Badge bg="danger" className="px-3 py-1.5 rounded-pill fw-bold text-white bg-red-500">Inactivo</Badge>;
    }
  };

  const getCommissionText = () => {
    if (service.commissionType === "ninguno" || !service.commissionValue) return "Sin comisión";
    if (service.commissionType === "porcentaje") return `${service.commissionValue}% de la Facturación`;
    return `${currency(service.commissionValue)} de Monto Fijo`;
  };

  // Cálculos comerciales
  const priceVal = Number(service.price || 0);
  const commType = service.commissionType || "ninguno";
  const commVal = Number(service.commissionValue || 0);

  let calculatedCommission = 0;
  if (commType === "porcentaje") {
    calculatedCommission = Math.round(priceVal * (commVal / 100));
  } else if (commType === "fijo") {
    calculatedCommission = commVal;
  }

  const netMargin = Math.max(0, priceVal - calculatedCommission);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      dialogClassName="hegemonic-modal border-0 shadow-lg"
    >
      <Modal.Body className="p-0 bg-white overflow-hidden" style={{ fontFamily: "var(--brand-font), Inter, sans-serif", borderRadius: "24px" }}>
        
        {/* BANNER DE CABECERA PREMIUM */}
        <div
          className="position-relative p-4 text-white overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${service.color || "#8b5cf6"} 0%, #0f172a 100%)`,
            minHeight: "145px",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
          }}
        >
          {/* Decorative Glow Bubble */}
          <div
            className="position-absolute rounded-circle"
            style={{
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
              top: "-70px",
              right: "-40px",
              pointerEvents: "none",
            }}
          />

          {/* Close Button */}
          <button
            type="button"
            className="position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center"
            onClick={onHide}
            aria-label="Close"
            style={{
              zIndex: 10,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="d-flex flex-column justify-content-between h-100 mt-2 position-relative" style={{ zIndex: 1 }}>
            <div>
              <span className="badge bg-white bg-opacity-20 text-white text-xxs uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 fw-bold">
                {service.category || "Sin categoría"}
              </span>
              <h2 className="h3 fw-black text-white m-0 d-flex align-items-center gap-2" style={{ letterSpacing: "-0.03em" }}>
                <span>{service.name}</span>
              </h2>
            </div>
            <div className="mt-3.5 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 px-2.5 py-1 rounded-pill">
                <span className="rounded-circle d-inline-block border border-white" style={{ width: 10, height: 10, backgroundColor: service.color || "#10b981" }} />
                <span className="text-xxs text-white text-opacity-90 fw-semibold">Color en Agenda</span>
              </div>
              <div>
                {getStatusBadge(service.status)}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO INTERNO CON PADDING */}
        <div className="p-4 d-flex flex-column gap-4">
          
          {/* CONTENEDOR GRID DE 2 COLUMNAS */}
          <Row className="g-4">
            
            {/* COLUMNA IZQUIERDA: TIEMPOS, PRECIOS Y COMERCIAL */}
            <Col md={7} className="d-flex flex-column gap-3.5">
              
              {/* 1. Descripción */}
              <div 
                className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300"
                style={{ borderLeft: `4px solid ${service.color || "#8b5cf6"}` }}
              >
                <div className="d-flex align-items-center gap-2.5 mb-2.5">
                  <span 
                    className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      backgroundColor: `${service.color || "#8b5cf6"}15`,
                      color: service.color || "#8b5cf6"
                    }}
                  >
                    <Info size={16} />
                  </span>
                  <h3 className="h6 fw-bold text-gray-900 m-0">Descripción del Servicio</h3>
                </div>
                <p className="text-gray-600 small mb-0 italic" style={{ lineHeight: "1.6" }}>
                  {service.description || "Sin descripción comercial registrada para este servicio."}
                </p>
              </div>

              {/* 2. Visualizador del Timeline de Duración */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
                <div className="d-flex align-items-center gap-2.5 mb-3">
                  <span 
                    className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      backgroundColor: "#ec489915",
                      color: "#ec4899"
                    }}
                  >
                    <Clock size={16} />
                  </span>
                  <h3 className="h6 fw-bold text-gray-900 m-0">
                    Desglose de Tiempos de Reserva (Total: {totalDuration} min)
                  </h3>
                </div>
                
                <div className="d-flex gap-1 rounded-2xl bg-gray-100 p-1 mb-3" style={{ height: "34px" }}>
                  {prep > 0 && (
                    <div
                      className="rounded-xl text-white text-center fw-bold text-xxs d-flex align-items-center justify-content-center transition-all hover-scale"
                      style={{ width: `${(prep / totalDurationSafe) * 100}%`, backgroundColor: "#64748b", fontSize: "10px", cursor: "default" }}
                      title={`Preparación: ${prep} min`}
                    >
                      {prep}m Prep
                    </div>
                  )}
                  <div
                    className="rounded-xl text-white text-center fw-bold text-xxs d-flex align-items-center justify-content-center transition-all hover-scale"
                    style={{ width: `${(core / totalDurationSafe) * 100}%`, backgroundColor: service.color || "#8b5cf6", fontSize: "10px", cursor: "default" }}
                    title={`Servicio: ${core} min`}
                  >
                    {core}m Servicio
                  </div>
                  {clean > 0 && (
                    <div
                      className="rounded-xl text-white text-center fw-bold text-xxs d-flex align-items-center justify-content-center transition-all hover-scale"
                      style={{ width: `${(clean / totalDurationSafe) * 100}%`, backgroundColor: "#f97316", fontSize: "10px", cursor: "default" }}
                      title={`Limpieza: ${clean} min`}
                    >
                      {clean}m Limp
                    </div>
                  )}
                </div>
                
                <div className="row g-2 text-center text-xxs font-semibold text-muted">
                  <div className="col-4">
                    <div className="p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-gray-400 block mb-0.5" style={{ fontSize: "9px" }}>PREPARACIÓN</span>
                      <span className="text-gray-700">{prep} min</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-1.5 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-purple-400 block mb-0.5" style={{ fontSize: "9px" }}>ATENCIÓN</span>
                      <span className="text-purple-700">{core} min</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-1.5 bg-orange-50 rounded-xl border border-orange-100">
                      <span className="text-orange-400 block mb-0.5" style={{ fontSize: "9px" }}>LIMPIEZA</span>
                      <span className="text-orange-700">{clean} min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Desglose Comercial */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
                <div className="d-flex align-items-center gap-2.5 mb-3">
                  <span 
                    className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      backgroundColor: "#10b98115",
                      color: "#10b981"
                    }}
                  >
                    <TrendingUp size={16} />
                  </span>
                  <h3 className="h6 fw-bold text-gray-900 m-0">Análisis Comercial & Margen</h3>
                </div>
                
                <Row className="g-3">
                  <Col xs={6}>
                    <div 
                      className="p-3 rounded-2xl border text-center shadow-xs"
                      style={{ 
                        backgroundColor: `${service.color || "#8b5cf6"}08`,
                        borderColor: `${service.color || "#8b5cf6"}20`
                      }}
                    >
                      <span 
                        className="text-xxs uppercase tracking-wider block fw-bold mb-1"
                        style={{ color: service.color || "#8b5cf6" }}
                      >
                        Precio de Venta
                      </span>
                      <span 
                        className="h4 fw-black block m-0"
                        style={{ color: service.color || "#8b5cf6" }}
                      >
                        {currency(service.price)}
                      </span>
                      <span className="text-xxs text-muted block mt-1.5 fw-semibold">
                        {service.depositRequired ? `Seña: ${currency(service.depositAmount)}` : "Sin seña previa"}
                      </span>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 bg-pink-50 bg-opacity-40 rounded-2xl border border-pink-100 text-center shadow-xs">
                      <span className="text-pink-800 text-xxs uppercase tracking-wider block fw-bold mb-1">Comisión Estimada</span>
                      <span className="h4 fw-black text-pink-700 block mt-1 m-0">{currency(calculatedCommission)}</span>
                      <span className="text-xxs text-pink-650 block mt-1.5 fw-semibold text-truncate" title={getCommissionText()}>
                        {getCommissionText()}
                      </span>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 d-flex justify-content-between align-items-center shadow-sm">
                      <div className="d-flex align-items-center gap-2">
                        <span className="p-1.5 bg-white rounded-lg text-emerald-600 shadow-xs">
                          <TrendingUp size={14} />
                        </span>
                        <div>
                          <span className="text-emerald-950 text-xxs uppercase tracking-wider fw-bold block">Margen Neto por Cita</span>
                          <span className="smaller text-emerald-700">Ingreso neto del negocio tras comisiones</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="h3 fw-black text-emerald-600 m-0">{currency(netMargin)}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

            </Col>

            {/* COLUMNA DERECHA: CONFIGURACIÓN ONLINE Y PROFESIONALES */}
            <Col md={5} className="d-flex flex-column gap-3.5">
              
              {/* 1. Profesionales Calificados */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 d-flex flex-column" style={{ minHeight: "220px" }}>
                <div className="d-flex align-items-center gap-2.5 mb-3">
                  <span 
                    className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      backgroundColor: "#8b5cf615",
                      color: "#8b5cf6"
                    }}
                  >
                    <Users size={16} />
                  </span>
                  <h3 className="h6 fw-bold text-gray-900 m-0">Colaboradores Calificados</h3>
                </div>
                
                <div className="d-flex flex-column gap-2 overflow-auto flex-grow-1" style={{ maxHeight: "170px", paddingRight: "2px" }}>
                  {service.workers && service.workers.length > 0 ? (
                    service.workers.map(({ worker }) => {
                      if (!worker) return null;
                      return (
                        <div key={worker.id} className="d-flex align-items-center gap-3 p-2.5 bg-light bg-opacity-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-xs">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" 
                            style={{ width: 32, height: 32, backgroundColor: service.color || "#8b5cf6", fontSize: "11px", flexShrink: 0 }}
                          >
                            {worker.firstName ? worker.firstName[0].toUpperCase() : ""}
                            {worker.lastName ? worker.lastName[0].toUpperCase() : ""}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="fw-bold text-gray-800 text-xs text-truncate">{worker.firstName} {worker.lastName}</div>
                            <div className="text-muted text-xxs text-truncate">{worker.roleTitle || "Profesional de sucursal"}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4 text-center border border-dashed rounded-xl bg-gray-50 text-muted gap-1.5" style={{ borderColor: "#cbd5e1 !important" }}>
                      <div className="p-2 bg-white rounded-circle shadow-xs">
                        <Users size={20} className="text-gray-400" />
                      </div>
                      <span className="smaller text-gray-700 fw-bold">Todo el personal habilitado</span>
                      <span className="text-xxs text-muted px-2" style={{ lineHeight: "1.4" }}>Cualquier colaborador puede realizar este servicio.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Configuración Reservas Online */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
                <div className="d-flex align-items-center gap-2.5 mb-3">
                  <span 
                    className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      backgroundColor: "#ec489915",
                      color: "#ec4899"
                    }}
                  >
                    <Shield size={16} />
                  </span>
                  <h3 className="h6 fw-bold text-gray-900 m-0">Portal de Reservas Online</h3>
                </div>
                
                <div className="d-grid gap-2">
                  {/* Switch Visibilidad */}
                  <div className="d-flex align-items-center justify-content-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-xs">
                    <div className="d-flex align-items-center gap-2.5">
                      <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: service.availableOnline ? "#10b981" : "#9ca3af" }} />
                      <span className="text-gray-800 text-xs fw-semibold">Disponibilidad Online</span>
                    </div>
                    <Badge bg={service.availableOnline ? "success-soft" : "secondary-soft"} className={service.availableOnline ? "text-emerald-700 bg-emerald-50 px-2.5 py-1" : "text-gray-600 bg-gray-100 px-2.5 py-1"}>
                      {service.availableOnline ? "Habilitado" : "Oculto"}
                    </Badge>
                  </div>

                  {/* Switch Aprobación */}
                  <div className="d-flex align-items-center justify-content-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-xs">
                    <div className="d-flex align-items-center gap-2.5">
                      <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: service.requiresApproval ? "#f59e0b" : "#10b981" }} />
                      <span className="text-gray-800 text-xs fw-semibold">Políticas de Agenda</span>
                    </div>
                    <Badge bg={service.requiresApproval ? "warning-soft" : "success-soft"} className={service.requiresApproval ? "text-amber-700 bg-amber-50 px-2.5 py-1" : "text-emerald-700 bg-emerald-50 px-2.5 py-1"}>
                      {service.requiresApproval ? "Aprobación Manual" : "Autoconfirmado"}
                    </Badge>
                  </div>
                </div>
              </div>

            </Col>
          </Row>

          {/* SECCIÓN FÓRMULAS & INSUMOS */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 mb-1">
            <div className="d-flex align-items-center gap-2.5 mb-3 pb-2.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <span 
                className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                style={{ 
                  width: "32px", 
                  height: "32px", 
                  backgroundColor: "#8b5cf615",
                  color: "#8b5cf6"
                }}
              >
                <Package size={16} />
              </span>
              <h3 className="h6 fw-bold text-gray-900 m-0">
                Fórmulas e Insumos Consumidos (Descuento Automático Stock FIFO)
              </h3>
            </div>
            
            {service.consumptionRules && service.consumptionRules.length > 0 ? (
              <div className="d-flex flex-column rounded-xl border border-gray-100 overflow-hidden bg-white">
                {service.consumptionRules.map(({ product, quantity, id }, idx) => {
                  if (!product) return null;
                  const isLast = idx === service.consumptionRules.length - 1;
                  return (
                    <div 
                      key={id} 
                      className="d-flex align-items-center justify-content-between p-2.5 transition-all hover:bg-gray-50"
                      style={{ borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}
                    >
                      <div className="d-flex flex-column align-items-start">
                        <span className="fw-bold text-gray-800 text-xs">{product.name}</span>
                        <div className="d-flex align-items-center gap-1.5 mt-0.5">
                          <span className="badge bg-light text-secondary border rounded-pill" style={{ fontSize: "9px" }}>{product.category}</span>
                          <span className="text-muted font-monospace" style={{ fontSize: "9px" }}>{product.unit}</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="fw-black text-purple-700 font-monospace text-xs">{quantity} {product.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center py-4 text-center border border-dashed rounded-xl bg-gray-50 text-muted gap-1.5" style={{ borderColor: "#cbd5e1 !important" }}>
                <div className="p-2 bg-white rounded-circle shadow-xs">
                  <Package size={20} className="text-gray-400" />
                </div>
                <span className="smaller text-gray-750 fw-bold">Sin insumos vinculados</span>
                <span className="text-xxs text-muted px-4" style={{ lineHeight: "1.4" }}>Este servicio no consume insumos técnicos del stock al completarse la cita.</span>
              </div>
            )}
            
            {service.consumptionRules && service.consumptionRules.length > 0 && (
              <div className="text-muted smaller mt-2.5 d-flex align-items-center gap-1.5 px-1" style={{ fontSize: "10.5px" }}>
                <span>💡 El inventario de estos insumos se descontará automáticamente cuando las citas correspondientes a este servicio se marquen como finalizadas.</span>
              </div>
            )}
          </div>

          {/* SECCIÓN CITAS FUTURAS */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
            <div className="d-flex align-items-center gap-2.5 mb-3 pb-2.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <span 
                className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                style={{ 
                  width: "32px", 
                  height: "32px", 
                  backgroundColor: "#ec489915",
                  color: "#ec4899"
                }}
              >
                <Calendar size={16} />
              </span>
              <h3 className="h6 fw-bold text-gray-900 m-0">
                Próximas Citas Agendadas con este Servicio
              </h3>
            </div>

            {loadingAppts ? (
              <div className="text-center py-4 text-muted smaller">Cargando turnos agendados...</div>
            ) : futureAppointments.length > 0 ? (
              <div className="d-flex flex-column rounded-xl border border-gray-100 overflow-hidden bg-white" style={{ maxHeight: "220px", overflowY: "auto" }}>
                {futureAppointments.map((appt, idx) => {
                  const isLast = idx === futureAppointments.length - 1;
                  return (
                    <div 
                      key={appt.id} 
                      className="d-flex align-items-center justify-content-between p-3 transition-all hover:bg-gray-50 gap-3"
                      style={{ borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="p-2 rounded-xl d-flex align-items-center justify-content-center" 
                          style={{ 
                            width: "38px", 
                            height: "38px", 
                            backgroundColor: `${service.color || "#8b5cf6"}10`,
                            color: service.color || "#8b5cf6"
                          }}
                        >
                          <Calendar size={16} />
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <span className="fw-bold text-gray-800 text-xs">
                            {new Date(appt.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })} a las {new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                          </span>
                          <span className="text-muted" style={{ fontSize: "10.5px" }}>
                            Cliente: <span className="text-gray-750 fw-semibold">{appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : "Cliente"}</span> • Prof: <span className="text-gray-700 fw-medium">{appt.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "Personal"}</span>
                          </span>
                        </div>
                      </div>
                      <div>
                        <Badge 
                          bg={appt.status === "CONFIRMED" ? "success-soft" : "warning-soft"}
                          className={`rounded-pill fw-bold px-2.5 py-1 ${
                            appt.status === "CONFIRMED" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                          }`}
                        >
                          {appt.status === "CONFIRMED" ? "Confirmado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center py-4 text-center border border-dashed rounded-xl bg-gray-50 text-muted gap-1.5" style={{ borderColor: "#cbd5e1 !important" }}>
                <div className="p-2 bg-white rounded-circle shadow-xs">
                  <Calendar size={20} className="text-gray-400" />
                </div>
                <span className="smaller text-gray-750 fw-bold">Sin citas futuras programadas</span>
                <span className="text-xxs text-muted">No existen reservas activas agendadas utilizando este servicio.</span>
              </div>
            )}
          </div>

        </div>

      </Modal.Body>

      <Modal.Footer className="border-0 bg-gray-50 py-3 px-4 d-flex justify-content-end gap-2" style={{ borderBottomLeftRadius: "24px", borderBottomRightRadius: "24px" }}>
        <Button variant="dark" onClick={onHide} className="rounded-xl px-4 py-2 text-xs fw-bold" style={{ backgroundColor: "#1e293b", borderColor: "#1e293b" }}>
          Cerrar Ficha
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
