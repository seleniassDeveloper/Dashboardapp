import React, { useMemo } from "react";
import { Modal, Row, Col, Card, Badge, Table, Button, Form } from "react-bootstrap";
import { Calendar, CreditCard, Clock, MessageCircle, Cake, Sparkles, AlertTriangle, ArrowRight, BookOpen } from "lucide-react";

// Fotos mock antes/después para simular el registro estético del salón
const BEFORE_AFTER_IMAGES = [
  { 
    id: 1, 
    title: "Balayage Premium & Ondas", 
    date: "12 de Mayo, 2026",
    before: "https://images.unsplash.com/photo-1595476108010-b4d1f1029c5a?w=400&q=80", // Cabello desordenado/seco
    after: "https://images.unsplash.com/photo-1560869713-7d0a29430f23?w=400&q=80"  // Ondas brillantes
  },
  { 
    id: 2, 
    title: "Corte Bob & Nutrición", 
    date: "04 de Abril, 2026",
    before: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80", // Cabello largo opaco
    after: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&q=80"  // Corte bob fresco
  }
];

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ClientDetailModal({ show, onHide, client, appointments = [] }) {
  if (!client) return null;

  // Filtrar citas del cliente
  const clientAppts = useMemo(() => {
    return appointments
      .filter((a) => a.clientId === client.id)
      .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  }, [appointments, client.id]);

  // Citas concretadas (para métricas financieras)
  const doneAppts = useMemo(() => {
    return clientAppts.filter((a) => a.status === "DONE" || a.status === "CONFIRMED");
  }, [clientAppts]);

  // Cálculos financieros avanzados
  const stats = useMemo(() => {
    const totalSpent = doneAppts.reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
    const visitsCount = doneAppts.length;
    const avgTicket = visitsCount > 0 ? Math.round(totalSpent / visitsCount) : 0;
    
    let lastVisitDate = "—";
    let isInactive = false;
    let daysSinceLastVisit = 0;

    if (visitsCount > 0) {
      const last = new Date(doneAppts[0].startsAt);
      lastVisitDate = last.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
      
      const diffTime = Math.abs(new Date() - last);
      daysSinceLastVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Si tiene más de 45 días sin ir, se clasifica como Inactivo
      if (daysSinceLastVisit > 45) {
        isInactive = true;
      }
    } else {
      isInactive = true; // Sin visitas es inactivo por definición
    }

    return {
      totalSpent,
      visitsCount,
      avgTicket,
      lastVisitDate,
      isInactive,
      daysSinceLastVisit
    };
  }, [doneAppts]);

  const handleSendWhatsApp = () => {
    const text = `¡Hola ${client.firstName}! Te escribimos de Aura Studio. Notamos que pasaron unos ${stats.daysSinceLastVisit || 60} días desde tu último servicio de ${doneAppts[0]?.service?.name || "Balayage"}. Queremos ofrecerte un 15% de descuento en tu próximo tratamiento para volver a mimar tu cabello. ¿Te reservamos un turno para este sábado?`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${client.phone ? client.phone.replace(/\D/g, "") : ""}?text=${encoded}`, "_blank");
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="hegemonic-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-black text-dark d-flex align-items-center gap-2">
          <Sparkles className="text-primary" size={22} />
          <span>Ficha Técnica de Cliente</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {/* SECCIÓN 1: Perfil Básicos */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-primary-soft text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: 56, height: 56, fontSize: 20 }}>
              {client.firstName[0]}{client.lastName[0]}
            </div>
            <div>
              <h2 className="h5 fw-bold text-dark m-0">{client.firstName} {client.lastName}</h2>
              <p className="text-muted small mb-0">{client.email || "Sin correo"} · {client.phone || "Sin teléfono"}</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="light" className="text-dark border rounded-pill px-3 py-2 small d-flex align-items-center gap-1.5">
              <Cake size={13} className="text-pink" />
              <span>Cumpleaños: 18 de Nov</span>
            </Badge>
            {stats.isInactive ? (
              <Badge bg="danger-soft" className="text-danger rounded-pill px-3 py-2 small d-flex align-items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>Inactivo ({stats.daysSinceLastVisit || "—"} días)</span>
              </Badge>
            ) : (
              <Badge bg="success-soft" className="text-success rounded-pill px-3 py-2 small d-flex align-items-center gap-1.5">
                <div className="rounded-circle bg-success" style={{ width: 6, height: 6 }} />
                <span>Cliente Activo</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Campaña de Marketing de Reactivación */}
        {stats.isInactive && (
          <Alert variant="danger" className="rounded-4 mb-4 border-0 d-flex align-items-center justify-content-between flex-wrap gap-2.5 shadow-sm bg-danger bg-opacity-10 text-danger">
            <div className="d-flex align-items-center gap-2.5">
              <AlertTriangle size={20} />
              <div className="small">
                <strong>Oportunidad de Reactivación:</strong> {client.firstName} no visita el salón hace <strong>{stats.daysSinceLastVisit || 60} días</strong>.
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleSendWhatsApp} className="rounded-pill d-flex align-items-center gap-1.5 px-3 py-1.5 fw-bold border-0 bg-danger text-white">
              <MessageCircle size={14} />
              <span>Enviar Descuento por WhatsApp</span>
            </Button>
          </Alert>
        )}

        {/* SECCIÓN 2: Métricas Financieras y Recurrencia */}
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 bg-light p-3 rounded-4 text-center">
              <div className="text-muted smaller fw-bold mb-1 uppercase">Gasto Total</div>
              <div className="h4 fw-black text-dark mb-0">{currency(stats.totalSpent)}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 bg-light p-3 rounded-4 text-center">
              <div className="text-muted smaller fw-bold mb-1 uppercase">Visitas Atendidas</div>
              <div className="h4 fw-black text-dark mb-0">{stats.visitsCount} turnos</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 bg-light p-3 rounded-4 text-center">
              <div className="text-muted smaller fw-bold mb-1 uppercase">Ticket Promedio</div>
              <div className="h4 fw-black text-dark mb-0">{currency(stats.avgTicket)}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 bg-light p-3 rounded-4 text-center">
              <div className="text-muted smaller fw-bold mb-1 uppercase">Última Visita</div>
              <div className="h6 fw-bold text-dark mb-0 py-1">{stats.lastVisitDate}</div>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          
          {/* Historial Técnico / Notas Especiales */}
          <Col md={6}>
            <Card className="border-0 border bg-white p-3 rounded-4 h-100 shadow-sm">
              <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                <BookOpen size={16} className="text-primary" />
                <span>Notas Clínicas y Fórmulas</span>
              </h3>
              
              <Form.Group className="mb-3">
                <Form.Label className="smaller text-muted fw-semibold">Fórmulas Químicas / Preferencias Estilista</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  className="modern-input"
                  style={{ fontSize: "12.5px" }}
                  defaultValue={client.notes || "Fórmula color: 40g L'Oreal Premium 7.1 + 60ml oxidante 20vol. Pose: 35 min. Prefiere champú neutro sin parabenos y lavado suave. Es zurda y suele elegir tratamientos de keratina."}
                  placeholder="Escribí notas de fórmulas químicas, preferencias, etc..."
                />
              </Form.Group>
            </Card>
          </Col>

          {/* Galería Antes / Después */}
          <Col md={6}>
            <Card className="border-0 border bg-white p-3 rounded-4 h-100 shadow-sm">
              <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                <Sparkles size={16} className="text-primary" />
                <span>Galería Antes y Después</span>
              </h3>
              
              <div className="d-grid gap-3 overflow-auto" style={{ maxHeight: "220px" }}>
                {BEFORE_AFTER_IMAGES.map((img) => (
                  <div key={img.id} className="p-2 border.soft rounded-3 bg-light d-flex gap-3 align-items-center">
                    <div className="d-flex gap-1.5 align-items-center">
                      <div className="position-relative" style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden" }}>
                        <img src={img.before} alt="Antes" className="w-100 h-100 object-fit-cover" />
                        <span className="position-absolute bottom-0 end-0 bg-dark text-white rounded px-1 fw-bold" style={{ fontSize: "7px" }}>Antes</span>
                      </div>
                      <ArrowRight size={12} className="text-muted" />
                      <div className="position-relative" style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden" }}>
                        <img src={img.after} alt="Después" className="w-100 h-100 object-fit-cover" />
                        <span className="position-absolute bottom-0 end-0 bg-success text-white rounded px-1 fw-bold" style={{ fontSize: "7px" }}>Dps</span>
                      </div>
                    </div>
                    <div>
                      <div className="fw-semibold small text-dark">{img.title}</div>
                      <div className="text-muted smaller">{img.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* Listado Completo de Citas */}
          <Col xs={12}>
            <Card className="border-0 border bg-white p-3 rounded-4 shadow-sm">
              <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                <Calendar size={16} className="text-primary" />
                <span>Historial de Citas del Cliente</span>
              </h3>
              
              {clientAppts.length === 0 ? (
                <div className="text-muted smaller py-3 text-center">No hay citas registradas para este cliente.</div>
              ) : (
                <div className="table-responsive">
                  <Table size="sm" hover className="mb-0 align-middle">
                    <thead>
                      <tr className="table-header-small" style={{ fontSize: "10px" }}>
                        <th>Fecha y Hora</th>
                        <th>Servicio</th>
                        <th>Estilista</th>
                        <th>Importe</th>
                        <th>Estado</th>
                        <th>Notas de la cita</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {clientAppts.map((a) => (
                        <tr key={a.id}>
                          <td className="text-secondary">{new Date(a.startsAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} hs</td>
                          <td className="fw-semibold text-dark">{a.service?.name}</td>
                          <td className="text-muted">{a.worker?.firstName}</td>
                          <td className="fw-bold text-dark">{currency(a.service?.price)}</td>
                          <td>
                            <Badge bg={a.status === "DONE" ? "secondary" : a.status === "CONFIRMED" ? "success" : a.status === "CANCELLED" ? "danger" : "warning"} className="rounded-pill">
                              {a.status === "DONE" ? "Finalizada" : a.status === "CONFIRMED" ? "Confirmada" : a.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                            </Badge>
                          </td>
                          <td className="text-muted smaller">{a.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          </Col>

        </Row>
      </Modal.Body>
    </Modal>
  );
}
