import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import AnalisisServicio from "../gadgets/appointments/Metricas/analisisServicio";
import AppointmentsList from "../gadgets/appointments/AppointmentsList";
import { Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import AppointmentModal from "../gadgets/appointments/AppointmentModal";
import { useState } from "react";

export default function DashboardView() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="dashboard-view">
      <header className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h1 className="section-title">Resumen de Hoy</h1>
        </div>
        <Button 
          variant="dark" 
          className="btn-premium d-flex align-items-center gap-2 px-4 py-3"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} />
          Nueva Cita
        </Button>
      </header>

      <Row className="g-4">
        {/* Lado Izquierdo: Métricas y Análisis */}
        <Col xl={8} lg={7}>
          <div className="d-flex flex-column gap-5">
            {/* Métricas Principales */}
            <div className="card-premium shadow-premium">
              <AnalisisServicio />
            </div>
          </div>
        </Col>

        {/* Lado Derecho: Agenda */}
        <Col xl={4} lg={5}>
          <div className="card-premium h-100">
            <h3 className="h4 fw-bold mb-4">Agenda del Día</h3>
            <AppointmentsList />
          </div>
        </Col>
      </Row>

      <AppointmentModal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
      />
    </div>
  );
}
