import React, { useEffect, useState } from "react";
import { Modal, Row, Col, Badge, Table, Button, Card } from "react-bootstrap";
import { Calendar, User, Shield, Sparkles, Clock, DollarSign, Package, CheckCircle, Info, TrendingUp, Users } from "lucide-react";
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
      dialogClassName="service-detail-modal border-0 shadow-lg"
    >
      <Modal.Header closeButton className="bg-light border-0 py-3.5 px-4 rounded-top">
        <Modal.Title className="fw-black text-gray-900 d-flex align-items-center gap-2" style={{ fontSize: "18px" }}>
          <Sparkles className="text-purple-600 animate-pulse" size={18} />
          <span>Ficha Técnica & Comercial de Servicio</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-white rounded-bottom" style={{ fontFamily: "var(--brand-font), Inter, sans-serif" }}>
        
        {/* CABECERA PRINCIPAL */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="rounded-circle d-inline-block shadow-sm" style={{ width: 14, height: 14, backgroundColor: service.color || "#10b981" }} />
              <h2 className="h4 fw-black text-gray-900 m-0" style={{ letterSpacing: "-0.02em" }}>{service.name}</h2>
            </div>
            <p className="text-muted smaller mt-1 mb-0 fw-semibold uppercase tracking-wider">
              {service.category || "Sin categoría asignada"}
            </p>
          </div>
          <div>
            {getStatusBadge(service.status)}
          </div>
        </div>

        {/* CONTENEDOR GRID DE 2 COLUMNAS */}
        <Row className="g-4 mb-4">
          
          {/* COLUMNA IZQUIERDA: TIEMPOS, PRECIOS Y COMERCIAL */}
          <Col md={7} className="d-flex flex-column gap-3">
            
            {/* 1. Descripción */}
            <div>
              <h3 className="fw-bold text-gray-900 mb-2 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <Info size={15} className="text-purple-600" />
                <span>Descripción del Servicio</span>
              </h3>
              <p className="text-gray-700 small bg-light p-3 rounded-xl border border-gray-100 mb-0 italic" style={{ lineHeight: "1.6" }}>
                {service.description || "Sin descripción comercial registrada para este servicio."}
              </p>
            </div>

            {/* 2. Visualizador del Timeline de Duración */}
            <div>
              <h3 className="fw-bold text-gray-900 mb-2 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <Clock size={15} className="text-pink-600" />
                <span>Desglose de Tiempos de Reserva (Total: {totalDuration} min)</span>
              </h3>
              <div className="d-flex rounded-xl overflow-hidden text-white text-center fw-bold text-xxs shadow-sm" style={{ height: "26px" }}>
                {prep > 0 && (
                  <div style={{ width: `${(prep / totalDurationSafe) * 100}%`, backgroundColor: "#475569", lineHeight: "26px" }} title={`Preparación: ${prep} min`}>
                    {prep}m Prep
                  </div>
                )}
                <div style={{ width: `${(core / totalDurationSafe) * 100}%`, backgroundColor: "#8b5cf6", lineHeight: "26px" }} title={`Servicio: ${core} min`}>
                  {core}m Servicio
                </div>
                {clean > 0 && (
                  <div style={{ width: `${(clean / totalDurationSafe) * 100}%`, backgroundColor: "#f97316", lineHeight: "26px" }} title={`Limpieza: ${clean} min`}>
                    {clean}m Limp.
                  </div>
                )}
              </div>
              <div className="d-flex justify-content-between mt-1.5 px-1 smaller text-muted fw-semibold" style={{ fontSize: "10px" }}>
                <span>Preparación previa: {prep} min</span>
                <span>Atención: {core} min</span>
                <span>Limpieza / Descanso: {clean} min</span>
              </div>
            </div>

            {/* 3. Desglose Comercial */}
            <div className="border rounded-2xl p-3 bg-light bg-opacity-40">
              <h3 className="fw-bold text-gray-900 mb-3 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <TrendingUp size={15} className="text-emerald-600" />
                <span>Análisis Comercial & Margen</span>
              </h3>
              <Row className="g-2.5">
                <Col xs={6}>
                  <div className="p-2 bg-white rounded-xl border border-gray-100 text-center shadow-sm">
                    <span className="text-muted text-xxs uppercase tracking-wider block fw-bold">Precio de Venta</span>
                    <span className="h4 fw-black text-purple-900 block mt-1 m-0">{currency(service.price)}</span>
                    <span className="text-xxs text-muted block mt-1">
                      {service.depositRequired ? `Seña: ${currency(service.depositAmount)}` : "Sin seña previa"}
                    </span>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="p-2 bg-white rounded-xl border border-gray-100 text-center shadow-sm">
                    <span className="text-muted text-xxs uppercase tracking-wider block fw-bold">Comisión Estimada</span>
                    <span className="h4 fw-black text-pink-700 block mt-1 m-0">{currency(calculatedCommission)}</span>
                    <span className="text-xxs text-muted block mt-1 text-truncate" title={getCommissionText()}>
                      {getCommissionText()}
                    </span>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="p-2.5 bg-white rounded-xl border border-gray-100 d-flex justify-content-between align-items-center shadow-sm">
                    <div>
                      <span className="text-muted text-xxs uppercase tracking-wider fw-bold block">Margen Neto Estimado por Cita</span>
                      <span className="smaller text-muted">Ingreso neto del negocio tras comisionar</span>
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
          <Col md={5} className="d-flex flex-column gap-3">
            
            {/* 1. Profesionales Calificados */}
            <div className="border p-3 rounded-2xl bg-gray-50 h-100 d-flex flex-column" style={{ minHeight: "200px" }}>
              <h3 className="fw-bold text-gray-900 mb-2.5 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <Users size={15} className="text-purple-600" />
                <span>Colaboradores Calificados</span>
              </h3>
              
              <div className="d-flex flex-column gap-2 overflow-auto flex-grow-1" style={{ maxHeight: "150px" }}>
                {service.workers && service.workers.length > 0 ? (
                  service.workers.map(({ worker }) => {
                    if (!worker) return null;
                    return (
                      <div key={worker.id} className="d-flex align-items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold animate-fade-in" 
                          style={{ width: 28, height: 28, backgroundColor: service.color || "#8b5cf6", fontSize: "10.5px" }}
                        >
                          {worker.firstName ? worker.firstName[0].toUpperCase() : ""}
                          {worker.lastName ? worker.lastName[0].toUpperCase() : ""}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="fw-bold text-gray-800 text-xs">{worker.firstName} {worker.lastName}</div>
                          <div className="text-muted text-xxs">{worker.roleTitle || "Profesional de sucursal"}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-dashed text-center text-muted small italic d-flex align-items-center justify-content-center h-100">
                    Habilitado para todo el personal de la sucursal.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Configuración Reservas Online */}
            <div className="border p-3 rounded-2xl bg-gray-50">
              <h3 className="fw-bold text-gray-900 mb-2.5 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <Shield size={15} className="text-pink-600" />
                <span>Portal de Reservas Online</span>
              </h3>
              
              <div className="d-grid gap-2">
                {/* Switch Visibilidad */}
                <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: service.availableOnline ? "#10b981" : "#9ca3af" }} />
                    <span className="text-gray-800 text-xs fw-semibold">Disponibilidad Online</span>
                  </div>
                  <Badge bg={service.availableOnline ? "success-soft" : "secondary-soft"} className={service.availableOnline ? "text-emerald-700" : "text-gray-600"}>
                    {service.availableOnline ? "Habilitado" : "Oculto"}
                  </Badge>
                </div>

                {/* Switch Aprobación */}
                <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: service.requiresApproval ? "#f59e0b" : "#10b981" }} />
                    <span className="text-gray-800 text-xs fw-semibold">Políticas de Agenda</span>
                  </div>
                  <Badge bg={service.requiresApproval ? "warning-soft" : "success-soft"} className={service.requiresApproval ? "text-amber-700" : "text-emerald-700"}>
                    {service.requiresApproval ? "Aprobación Manual" : "Autoconfirmado"}
                  </Badge>
                </div>
              </div>
            </div>

          </Col>
        </Row>

        {/* SECCIÓN FÓRMULAS & INSUMOS */}
        <div className="mb-4">
          <h3 className="h6 fw-black text-gray-900 d-flex align-items-center gap-2 border-bottom pb-2 mb-3">
            <Package size={16} className="text-purple-600" />
            <span>Fórmulas e Insumos Consumidos (Descuento Automático Stock FIFO)</span>
          </h3>
          
          <Table responsive hover bordered className="align-middle text-center text-xs mb-1">
            <thead>
              <tr className="bg-light text-muted" style={{ fontSize: "10.5px" }}>
                <th className="text-start py-2">Insumo / Producto</th>
                <th>Categoría</th>
                <th>Unidad Métrica</th>
                <th className="text-end">Cantidad Consumida</th>
              </tr>
            </thead>
            <tbody>
              {service.consumptionRules && service.consumptionRules.length > 0 ? (
                service.consumptionRules.map(({ product, quantity, id }) => {
                  if (!product) return null;
                  return (
                    <tr key={id}>
                      <td className="text-start fw-bold text-gray-800 py-2">{product.name}</td>
                      <td><Badge bg="light" className="text-secondary border rounded-pill">{product.category}</Badge></td>
                      <td className="font-monospace text-muted">{product.unit}</td>
                      <td className="text-end fw-black text-purple-700 font-monospace" style={{ fontSize: "13px" }}>{quantity} {product.unit}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-3 text-muted italic">
                    Este servicio no tiene insumos técnicos asociados. No se descontará stock al finalizar la cita.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          {service.consumptionRules && service.consumptionRules.length > 0 && (
            <div className="text-muted smaller mt-1">
              💡 El inventario de estos insumos se descontará automáticamente cuando las citas correspondientes a este servicio se marquen como finalizadas.
            </div>
          )}
        </div>

        {/* SECCIÓN CITAS FUTURAS */}
        <div>
          <h3 className="h6 fw-black text-gray-900 d-flex align-items-center gap-2 border-bottom pb-2 mb-3">
            <Calendar size={16} className="text-pink-500" />
            <span>Próximas Citas Agendadas con este Servicio</span>
          </h3>

          {loadingAppts ? (
            <div className="text-center py-3 text-muted smaller">Cargando turnos agendados...</div>
          ) : futureAppointments.length > 0 ? (
            <div className="overflow-auto border rounded-2xl bg-white scrollbar-none" style={{ maxHeight: "150px" }}>
              <Table borderless className="align-middle mb-0 text-center text-xs">
                <thead>
                  <tr className="bg-light text-muted border-bottom" style={{ fontSize: "10.5px" }}>
                    <th className="py-2 text-start ps-3">Fecha y Hora</th>
                    <th className="text-start">Cliente</th>
                    <th className="text-start">Profesional</th>
                    <th>Estado Cita</th>
                  </tr>
                </thead>
                <tbody>
                  {futureAppointments.map(appt => (
                    <tr key={appt.id} className="border-bottom">
                      <td className="py-2.5 ps-3 text-start fw-bold text-gray-800">
                        {new Date(appt.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })} a las {new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                      </td>
                      <td className="text-start fw-semibold text-gray-900">
                        {appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : "Cliente"}
                      </td>
                      <td className="text-start text-muted fw-medium">
                        {appt.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "Personal"}
                      </td>
                      <td>
                        <Badge 
                          bg="light" 
                          className={`rounded-pill text-white fw-bold px-2.5 py-1 ${
                            appt.status === "CONFIRMED" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        >
                          {appt.status === "CONFIRMED" ? "Confirmado" : "Pendiente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-3 text-muted smaller bg-light rounded-2xl border border-gray-100 italic">
              No hay citas futuras agendadas utilizando este servicio.
            </div>
          )}
        </div>

      </Modal.Body>

      <Modal.Footer className="border-0 bg-light py-2 rounded-bottom d-flex justify-content-end gap-2">
        <Button variant="dark" onClick={onHide} className="rounded-xl px-4 py-2 text-xs fw-bold">
          Cerrar Ficha
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
