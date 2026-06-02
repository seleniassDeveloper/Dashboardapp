import React, { useEffect, useState } from "react";
import { Modal, Row, Col, Badge, Table, Button, Card } from "react-bootstrap";
import { Calendar, User, Shield, Sparkles, Clock, DollarSign, Package, CheckCircle, Info, Heart, ArrowRight } from "lucide-react";
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

  const totalDuration = Number(service.duration || 0) + Number(service.preparationMinutes || 0) + Number(service.cleanupMinutes || 0);

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

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      dialogClassName="service-detail-modal border-0 shadow-lg"
    >
      <Modal.Header closeButton className="bg-light border-0 py-3.5 px-4 rounded-top">
        <Modal.Title className="fw-black text-gray-900 d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600" size={20} />
          <span>Ficha Técnica & Comercial de Servicio</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-white rounded-bottom">
        
        {/* Header visual con Nombre y Badge */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4 flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="rounded-circle d-inline-block" style={{ width: 14, height: 14, backgroundColor: service.color || "#10b981" }} />
              <h2 className="h4 fw-black text-gray-900 m-0">{service.name}</h2>
            </div>
            <p className="text-muted smaller mt-1 mb-0">{service.category || "Sin categoría asignada"}</p>
          </div>
          <div>
            {getStatusBadge(service.status)}
          </div>
        </div>

        {/* Panel General */}
        <Row className="g-4 mb-4">
          <Col md={7}>
            <div className="mb-4">
              <h3 className="h6 fw-black text-gray-900 d-flex align-items-center gap-2 mb-2">
                <Info size={16} className="text-purple-500" />
                <span>Descripción del Servicio</span>
              </h3>
              <p className="text-gray-700 small bg-light p-3 rounded-2xl border border-gray-100 min-h-60">
                {service.description || <i>Sin descripción comercial registrada.</i>}
              </p>
            </div>

            <Row className="g-3">
              {/* Card de Precio */}
              <Col xs={6}>
                <Card className="border border-gray-100 p-3 rounded-2xl bg-purple-50 bg-opacity-30 h-100">
                  <div className="text-muted smaller fw-bold uppercase tracking-wider text-xxs">Precio de Lista</div>
                  <h4 className="fw-black text-purple-800 m-0 mt-1 h4">{currency(service.price)}</h4>
                  {service.depositRequired ? (
                    <div className="text-xxs text-purple-700 fw-bold mt-1">Seña: {currency(service.depositAmount)}</div>
                  ) : (
                    <div className="text-xxs text-muted mt-1">Sin seña requerida</div>
                  )}
                </Card>
              </Col>

              {/* Card de Duración */}
              <Col xs={6}>
                <Card className="border border-gray-100 p-3 rounded-2xl bg-pink-50 bg-opacity-30 h-100">
                  <div className="text-muted smaller fw-bold uppercase tracking-wider text-xxs">Duración Total</div>
                  <h4 className="fw-black text-pink-700 m-0 mt-1 h4">{totalDuration} min</h4>
                  <div className="text-xxs text-muted mt-1 d-flex flex-wrap gap-1">
                    <span>Pro: {service.duration}m</span>
                    {Number(service.preparationMinutes) > 0 && <span>| Prep: {service.preparationMinutes}m</span>}
                    {Number(service.cleanupMinutes) > 0 && <span>| Limp: {service.cleanupMinutes}m</span>}
                  </div>
                </Card>
              </Col>

              {/* Card de Comisión */}
              <Col xs={12}>
                <Card className="border border-gray-100 p-3 rounded-2xl bg-light h-100">
                  <div className="text-muted smaller fw-bold uppercase tracking-wider text-xxs">Regla de Comisión del Staff</div>
                  <div className="fw-black text-gray-800 m-0 mt-1 d-flex align-items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span>{getCommissionText()}</span>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Lateral de Profesionales y Reservas */}
          <Col md={5}>
            <Card className="border p-3.5 rounded-2xl bg-gray-50 h-100">
              <h3 className="fw-bold text-gray-900 mb-2.5 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <User size={15} className="text-pink-500" />
                <span>Profesionales Calificados</span>
              </h3>
              
              <div className="d-flex flex-wrap gap-1.5 mb-4 overflow-auto" style={{ maxHeight: "110px" }}>
                {service.workers && service.workers.length > 0 ? (
                  service.workers.map(({ worker }) => (
                    <Badge 
                      key={worker.id}
                      bg="light" 
                      className="text-purple-700 border border-purple-100 rounded-pill px-3 py-1.5 fw-semibold text-xs d-flex align-items-center gap-1.5"
                    >
                      <User size={10} />
                      <span>{worker.firstName} {worker.lastName}</span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted small italic">Disponible para todos los profesionales de la sucursal.</span>
                )}
              </div>

              <h3 className="fw-bold text-gray-900 mb-2.5 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                <CheckCircle size={15} className="text-emerald-500" />
                <span>Configuración Reservas Online</span>
              </h3>
              
              <ul className="list-unstyled d-grid gap-2 mb-0 smaller text-gray-700">
                <li className="d-flex align-items-center gap-2">
                  <span className={`rounded-circle ${service.availableOnline ? "bg-emerald-500" : "bg-gray-400"}`} style={{ width: 6, height: 6 }} />
                  <span>{service.availableOnline ? "Visible en reservas online" : "No visible en reservas online"}</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <span className={`rounded-circle ${service.requiresApproval ? "bg-amber-500" : "bg-gray-400"}`} style={{ width: 6, height: 6 }} />
                  <span>{service.requiresApproval ? "Requiere aprobación manual de cita" : "Aprobación automática"}</span>
                </li>
              </ul>
            </Card>
          </Col>
        </Row>

        {/* Sección de Insumos y Consumo de Stock */}
        <div className="mb-4">
          <h3 className="h6 fw-black text-gray-900 d-flex align-items-center gap-2 border-bottom pb-2 mb-3">
            <Package size={16} className="text-purple-600 animate-pulse" />
            <span>Fórmulas e Insumos Consumidos (Descuento Automático Stock FIFO)</span>
          </h3>
          
          <Table responsive hover bordered className="align-middle text-center text-xs">
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
                service.consumptionRules.map(({ product, quantity, id }) => (
                  <tr key={id}>
                    <td className="text-start fw-bold text-gray-800 py-2.5">{product.name}</td>
                    <td><Badge bg="light" className="text-secondary border rounded-pill">{product.category}</Badge></td>
                    <td className="font-monospace text-muted">{product.unit}</td>
                    <td className="text-end fw-black text-purple-700 font-monospace" style={{ fontSize: "13px" }}>{quantity} {product.unit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-3 text-muted italic">
                    Este servicio no tiene insumos técnicos asociados. No se descontará stock al finalizar la cita.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Sección de Citas Futuras */}
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
