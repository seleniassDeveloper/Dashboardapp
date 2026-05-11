import React from "react";
import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { UserPlus, Mail, Phone, Calendar, Star, MoreHorizontal, ShieldCheck } from "lucide-react";

const TEAM = [
  { id: 1, name: "Selenia Sanchez", role: "Directora / Estética", status: "available", rating: 5.0, phone: "+1 234 567", email: "selenia@business.com" },
  { id: 2, name: "Andrea Paez", role: "Estilista Senior", status: "busy", rating: 4.8, phone: "+1 987 654", email: "andrea@business.com" },
  { id: 3, name: "Victor Xu", role: "Barbero / Colorista", status: "available", rating: 4.9, phone: "+1 555 444", email: "victor@business.com" },
];

export default function TeamView() {
  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold h3">Tu Equipo</h1>
          <p className="text-muted">Gestiona el talento y los horarios de tus colaboradores.</p>
        </div>
        <Button variant="dark" className="d-flex align-items-center gap-2 px-4 py-2" style={{ borderRadius: '10px' }}>
          <UserPlus size={18} />
          Añadir Miembro
        </Button>
      </header>

      <Row className="g-4">
        {TEAM.map(member => (
          <Col xl={4} md={6} key={member.id}>
            <div className="card-premium p-4 h-100 hover-scale">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="position-relative">
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-primary" style={{ width: 64, height: 64, fontSize: 24 }}>
                    {member.name.charAt(0)}
                  </div>
                  <div className={`position-absolute bottom-0 end-0 p-1 rounded-circle border border-white ${member.status === 'available' ? 'bg-success' : 'bg-warning'}`} style={{ width: 14, height: 14 }} />
                </div>
                <Button variant="light" size="sm" className="p-1"><MoreHorizontal size={16} /></Button>
              </div>

              <div className="mb-3">
                <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2">
                  {member.name}
                  {member.id === 1 && <ShieldCheck size={14} className="text-primary" />}
                </h3>
                <div className="text-muted small">{member.role}</div>
              </div>

              <div className="d-flex align-items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.floor(member.rating) ? "var(--warning)" : "transparent"} stroke={i < Math.floor(member.rating) ? "var(--warning)" : "var(--text-muted)"} />
                ))}
                <span className="small text-muted ms-1">{member.rating}</span>
              </div>

              <div className="d-flex flex-column gap-2 border-top pt-3">
                <div className="d-flex align-items-center gap-3 text-muted small">
                  <Mail size={14} /> {member.email}
                </div>
                <div className="d-flex align-items-center gap-3 text-muted small">
                  <Phone size={14} /> {member.phone}
                </div>
                <div className="d-flex align-items-center gap-3 text-muted small">
                  <Calendar size={14} /> Ver Horarios
                </div>
              </div>
            </div>
          </Col>
        ))}
        
        {/* Placeholder para invitar */}
        <Col xl={4} md={6}>
          <div className="card-premium p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center bg-light border-dashed" style={{ minHeight: 250 }}>
            <div className="p-3 rounded-circle bg-white shadow-sm mb-3">
              <UserPlus size={32} className="text-muted" />
            </div>
            <h4 className="h6 fw-bold">¿Necesitas más ayuda?</h4>
            <p className="text-muted small px-3">Invita a nuevos colaboradores y expande la capacidad de tu negocio.</p>
            <Button variant="outline-dark" size="sm">Invitar via Email</Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
