import React, { useEffect, useState } from "react";
import { Modal, Row, Col, Badge, Button, Table, Spinner } from "react-bootstrap";
import { Clock, DollarSign, Calendar, Users, Package, Link } from "lucide-react";
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

  const getStatusBadge = (statusVal) => {
    switch (String(statusVal).toLowerCase()) {
      case "active":
      case "activo":
        return <Badge bg="success">Activo</Badge>;
      case "hidden_online":
      case "hidden":
        return <Badge bg="warning" text="dark">Oculto Online</Badge>;
      case "inactive":
      case "inactivo":
      default:
        return <Badge bg="danger">Inactivo</Badge>;
    }
  };

  const getCommissionText = () => {
    if (service.commissionType === "ninguno" || !service.commissionValue) return "Sin comisión";
    if (service.commissionType === "porcentaje") return `${service.commissionValue}%`;
    return `${currency(service.commissionValue)}`;
  };

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
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <span className="rounded-circle d-inline-block" style={{ width: 12, height: 12, backgroundColor: service.color || "#10b981" }} />
          {service.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-4">
          <Col md={7}>
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                {getStatusBadge(service.status)}
                <Badge bg="secondary">{service.category || "Sin categoría"}</Badge>
              </div>
              <p className="text-muted mb-0">{service.description || "Sin descripción disponible."}</p>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3"><Clock size={16} /> Tiempos (Total: {totalDuration} min)</h6>
              <Row className="g-2 text-center text-muted small">
                <Col>
                  <div className="p-2 border rounded bg-light">
                    <div className="fw-semibold">Prep.</div>
                    <div>{prep} min</div>
                  </div>
                </Col>
                <Col>
                  <div className="p-2 border rounded bg-light border-primary border-opacity-25">
                    <div className="fw-semibold text-primary">Servicio</div>
                    <div className="text-primary">{core} min</div>
                  </div>
                </Col>
                <Col>
                  <div className="p-2 border rounded bg-light">
                    <div className="fw-semibold">Limp.</div>
                    <div>{clean} min</div>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3"><DollarSign size={16} /> Finanzas</h6>
              <Row className="g-2 text-center small">
                <Col>
                  <div className="p-2 border rounded">
                    <div className="text-muted fw-semibold">Precio</div>
                    <div className="fw-bold fs-6">{currency(service.price)}</div>
                    {service.depositRequired && <div className="text-muted" style={{fontSize: "10px"}}>Seña: {currency(service.depositAmount)}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="p-2 border rounded bg-danger bg-opacity-10 border-danger border-opacity-25">
                    <div className="text-danger fw-semibold">Comisión</div>
                    <div className="fw-bold fs-6 text-danger">{currency(calculatedCommission)}</div>
                    <div className="text-danger" style={{fontSize: "10px"}}>{getCommissionText()}</div>
                  </div>
                </Col>
                <Col>
                  <div className="p-2 border rounded bg-success bg-opacity-10 border-success border-opacity-25">
                    <div className="text-success fw-semibold">Margen Neto</div>
                    <div className="fw-bold fs-6 text-success">{currency(netMargin)}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          <Col md={5}>
            <div className="mb-4">
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3"><Link size={16} /> Configuración Online</h6>
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between p-2 border rounded bg-light">
                  <span>Disponibilidad</span>
                  <span className={service.availableOnline ? "text-success fw-semibold" : "text-muted"}>
                    {service.availableOnline ? "Habilitado" : "Oculto"}
                  </span>
                </div>
                <div className="d-flex justify-content-between p-2 border rounded bg-light">
                  <span>Confirmación</span>
                  <span className={service.requiresApproval ? "text-warning fw-semibold" : "text-success fw-semibold"}>
                    {service.requiresApproval ? "Manual" : "Automática"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3"><Users size={16} /> Colaboradores</h6>
              <div className="p-2 border rounded bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {service.workers && service.workers.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {service.workers.map(({ worker }) => worker ? (
                      <div key={worker.id} className="small">
                        • {worker.firstName} {worker.lastName}
                      </div>
                    ) : null)}
                  </div>
                ) : (
                  <div className="text-muted small text-center py-2">Todos los colaboradores habilitados.</div>
                )}
              </div>
            </div>

            <div>
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3"><Package size={16} /> Insumos (Auto-descuento)</h6>
              <div className="p-2 border rounded bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {service.consumptionRules && service.consumptionRules.length > 0 ? (
                  <Table size="sm" borderless className="mb-0 small">
                    <tbody>
                      {service.consumptionRules.map(({ product, quantity, id }) => product ? (
                        <tr key={id}>
                          <td>{product.name}</td>
                          <td className="text-end fw-semibold">{quantity} {product.unit}</td>
                        </tr>
                      ) : null)}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-muted small text-center py-2">Sin insumos vinculados.</div>
                )}
              </div>
            </div>
          </Col>
        </Row>
        
        <hr className="my-4" />

        <div>
          <h6 className="fw-bold d-flex align-items-center gap-2 mb-3"><Calendar size={16} /> Próximas Citas</h6>
          {loadingAppts ? (
            <div className="text-center py-3"><Spinner size="sm" /></div>
          ) : futureAppointments.length > 0 ? (
            <Table size="sm" hover className="small">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Profesional</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {futureAppointments.map(appt => (
                  <tr key={appt.id}>
                    <td>
                      {new Date(appt.startsAt).toLocaleDateString("es-AR")} {new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>{appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : "-"}</td>
                    <td>{appt.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "-"}</td>
                    <td>
                      <Badge bg={appt.status === "CONFIRMED" ? "success" : "warning"} text={appt.status === "CONFIRMED" ? "" : "dark"}>
                        {appt.status === "CONFIRMED" ? "Confirmado" : "Pendiente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-muted small text-center py-3 border rounded bg-light">No hay citas futuras programadas.</div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
