import React from "react";
import { Container, Row, Col, Badge, Button } from "react-bootstrap";
import { Play, Settings, Plus, GitBranch, Zap, Clock, CheckCircle2 } from "lucide-react";

const WORKFLOWS = [
  { id: 1, name: "Recordatorio de Cita (24h)", status: "active", triggers: "24h antes", actions: "Enviar WhatsApp", runs: 124 },
  { id: 2, name: "Fidelización Post-Cita", status: "active", triggers: "Al finalizar", actions: "Cupón Descuento", runs: 45 },
  { id: 3, name: "Re-activación Clientes", status: "paused", triggers: "30 días inactivo", actions: "Email Marketing", runs: 0 },
];

export default function WorkflowsView() {
  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold h3">Workflows & Automatizaciones</h1>
          <p className="text-muted">Diseña procesos automáticos para ahorrar tiempo.</p>
        </div>
        <Button variant="dark" className="d-flex align-items-center gap-2 px-4 py-2" style={{ borderRadius: '10px' }}>
          <Plus size={18} />
          Crear Workflow
        </Button>
      </header>

      <Row className="g-4">
        {/* Estadísticas Rápidas */}
        <Col md={12}>
          <div className="card-premium p-4 d-flex gap-5 overflow-auto">
            <div>
              <div className="text-muted small mb-1">Total Ejecuciones</div>
              <div className="h3 fw-bold m-0">1,284</div>
            </div>
            <div className="vr" />
            <div>
              <div className="text-muted small mb-1">Ahorro de Tiempo</div>
              <div className="h3 fw-bold m-0 text-success">42h</div>
            </div>
            <div className="vr" />
            <div>
              <div className="text-muted small mb-1">Tasa de Éxito</div>
              <div className="h3 fw-bold m-0 text-primary">99.2%</div>
            </div>
          </div>
        </Col>

        {/* Lista de Workflows */}
        <Col md={12}>
          <div className="d-flex flex-column gap-3">
            {WORKFLOWS.map((wf) => (
              <div key={wf.id} className="card-premium p-4 d-flex align-items-center justify-content-between hover-scale">
                <div className="d-flex align-items-center gap-4">
                  <div className="p-3 rounded-xl bg-light" style={{ color: wf.status === 'active' ? 'var(--brand-accent)' : 'var(--text-muted)' }}>
                    <GitBranch size={24} />
                  </div>
                  <div>
                    <h3 className="h6 fw-bold m-0">{wf.name}</h3>
                    <div className="d-flex align-items-center gap-2 text-muted small mt-1">
                      <Zap size={14} /> {wf.triggers}
                      <span className="text-muted opacity-50">•</span>
                      <Settings size={14} /> {wf.actions}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-4">
                  <div className="text-end">
                    <div className="fw-bold small">{wf.runs} runs</div>
                    <Badge bg={wf.status === 'active' ? 'success' : 'secondary'} className="small opacity-75">
                      {wf.status.toUpperCase()}
                    </Badge>
                  </div>
                  <Button variant="light" className="p-2 border">
                    <Play size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Col>

        {/* Builder Preview (Estilo Linear) */}
        <Col md={12}>
          <div className="card-premium p-5 text-center bg-light border-dashed">
            <GitBranch size={48} className="text-muted mb-3 opacity-20" />
            <h4 className="fw-bold">Editor Visual de Procesos</h4>
            <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
              Arrastra y suelta disparadores y acciones para crear flujos de trabajo inteligentes que trabajen por ti 24/7.
            </p>
            <Button variant="outline-dark" className="mt-2">Ver Galería de Plantillas</Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
