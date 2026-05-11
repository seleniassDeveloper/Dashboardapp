import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { Zap, MessageSquare, Mail, Bell, Globe, Bot } from "lucide-react";

const AUTO_SERVICES = [
  { id: 1, name: "WhatsApp Automático", desc: "Envía confirmaciones y recordatorios por WhatsApp.", icon: <MessageSquare />, active: true },
  { id: 2, name: "Email Marketing", desc: "Campañas automáticas de cumpleaños y promociones.", icon: <Mail />, active: true },
  { id: 3, name: "Notificaciones Push", desc: "Avisos directos al móvil de tus clientes.", icon: <Bell />, active: false },
  { id: 4, name: "Bot de Reservas 24/7", desc: "Un asistente IA que agenda citas por ti.", icon: <Bot />, active: false },
];

export default function AutomationsView() {
  return (
    <Container fluid className="p-0">
      <header className="mb-4">
        <h1 className="fw-bold h3">Centro de Automatización</h1>
        <p className="text-muted">Conecta tus herramientas favoritas y automatiza la comunicación.</p>
      </header>

      <Row className="g-4">
        {AUTO_SERVICES.map(service => (
          <Col md={6} key={service.id}>
            <div className="card-premium p-4 d-flex align-items-start justify-content-between hover-scale">
              <div className="d-flex gap-4">
                <div className="p-3 rounded-xl bg-light text-primary" style={{ height: 'fit-content' }}>
                  {React.cloneElement(service.icon, { size: 24 })}
                </div>
                <div>
                  <h3 className="h6 fw-bold mb-1">{service.name}</h3>
                  <p className="text-muted small mb-0" style={{ maxWidth: '300px' }}>{service.desc}</p>
                </div>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" checked={service.active} readOnly style={{ width: '40px', height: '20px', cursor: 'pointer' }} />
              </div>
            </div>
          </Col>
        ))}

        <Col md={12}>
          <div className="card-premium p-5 text-center bg-gradient-light border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <Zap size={40} className="text-warning mb-3" />
            <h4 className="fw-bold">Próximamente: Integración con Instagram & TikTok</h4>
            <p className="text-muted mb-4">Agenda citas directamente desde tus redes sociales con nuestro botón de reserva oficial.</p>
            <Badge bg="dark" className="px-3 py-2">Próxima Actualización</Badge>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
