import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { CheckCircle, Rocket, Zap, BarChart3, Users, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import "./HowItWorks.css";

export default function HowItWorks() {
  return (
    <div className="guide-container">
      {/* Hero Section */}
      <section className="guide-hero">
        <Badge bg="dark" className="mb-3 px-3 py-2 rounded-pill">Guía de Onboarding</Badge>
        <h1 className="display-4 fw-black mb-3">Domina tu Dashboard OS</h1>
        <p className="lead text-secondary max-w-600 mx-auto">
          Aprende a gestionar tu negocio como las mejores empresas del mundo. 
          Una guía completa para dueños, administradores y equipos.
        </p>
      </section>

      {/* 01. Introducción */}
      <section className="guide-section">
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <div className="section-tag">01. INTRODUCCIÓN</div>
            <h2 className="fw-black mb-4">¿Qué es Dashboard OS?</h2>
            <p className="text-secondary mb-4">
              Es el sistema operativo definitivo para negocios basados en servicios. 
              Centralizamos tu agenda, finanzas y clientes en una sola interfaz premium 
              diseñada para la velocidad y la claridad.
            </p>
            <ul className="guide-list">
              <li><CheckCircle size={18} className="text-success" /> <span>Gestión centralizada de citas y clientes.</span></li>
              <li><CheckCircle size={18} className="text-success" /> <span>Análisis de rentabilidad en tiempo real.</span></li>
              <li><CheckCircle size={18} className="text-success" /> <span>Automatización de recordatorios y seguimientos.</span></li>
            </ul>
          </Col>
          <Col lg={6}>
            <div className="guide-img-placeholder shadow-lg">
               <div className="p-5 text-center text-muted">
                 [Screenshot del Dashboard Principal con leyendas: "Vista General", "KPIs", "Agenda"]
               </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* 02. Recorrido Visual */}
      <section className="guide-section bg-light-soft rounded-xl p-5">
        <div className="text-center mb-5">
          <div className="section-tag">02. NAVEGACIÓN</div>
          <h2 className="fw-black">Todo a un clic de distancia</h2>
        </div>
        <Row className="g-4">
          <Col md={4}>
            <div className="guide-card">
              <div className="icon-box"><Calendar size={24} /></div>
              <h4>Agenda Viva</h4>
              <p className="small text-secondary">Control visual de tus reservas diarias, semanales y mensuales.</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="guide-card">
              <div className="icon-box"><BarChart3 size={24} /></div>
              <h4>Métricas Real-Time</h4>
              <p className="small text-secondary">KPIs de ingresos y ocupación actualizados al instante.</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="guide-card">
              <div className="icon-box"><Users size={24} /></div>
              <h4>Gestión de Staff</h4>
              <p className="small text-secondary">Controla el rendimiento y horarios de todo tu equipo.</p>
            </div>
          </Col>
        </Row>
      </section>

      {/* 03. Flujo de Trabajo */}
      <section className="guide-section">
        <div className="section-tag text-center">03. FLUJO DE TRABAJO</div>
        <h2 className="fw-black text-center mb-5">El Ciclo de éxito</h2>
        <div className="workflow-steps">
          <div className="step-item">
            <div className="step-num">1</div>
            <h5>Crear Cliente</h5>
            <p className="small text-secondary">Registra los datos básicos y preferencias del cliente.</p>
          </div>
          <ArrowRight className="step-arrow d-none d-md-block" />
          <div className="step-item">
            <div className="step-num">2</div>
            <h5>Agendar Cita</h5>
            <p className="small text-secondary">Selecciona servicio, trabajador y hora en el calendario.</p>
          </div>
          <ArrowRight className="step-arrow d-none d-md-block" />
          <div className="step-item">
            <div className="step-num">3</div>
            <h5>Finalizar y Cobrar</h5>
            <p className="small text-secondary">El sistema registra el pago y actualiza tus finanzas.</p>
          </div>
        </div>
      </section>

      {/* 04. Automatizaciones */}
      <section className="guide-section bg-dark text-white rounded-xl p-5 shadow-lg">
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <Zap size={48} className="text-warning mb-4" />
            <h2 className="fw-black mb-4">Automatización de Nivel Superior</h2>
            <p className="text-light opacity-75 mb-4">
              Reduce las inasistencias en un 40% con recordatorios automáticos por WhatsApp y Email. 
              El sistema se encarga del seguimiento mientras tú te enfocas en el servicio.
            </p>
            <div className="d-flex gap-3">
               <div className="badge bg-secondary">WhatsApp</div>
               <div className="badge bg-secondary">Email</div>
               <div className="badge bg-secondary">Alertas Push</div>
            </div>
          </Col>
          <Col lg={6}>
            <div className="bg-white rounded-lg p-4 text-dark shadow">
               <h6 className="fw-bold mb-2">Previsualización de Alerta:</h6>
               <div className="p-3 bg-light rounded small italic">
                 "Hola [Nombre], te recordamos tu cita de [Servicio] para mañana a las [Hora]. ¡Te esperamos!"
               </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* 05. FAQ */}
      <section className="guide-section pb-5">
        <h2 className="fw-black mb-5 text-center">Preguntas Frecuentes</h2>
        <Row className="g-4">
          <Col md={6}>
            <div className="p-4 border rounded-xl h-100">
              <h6 className="fw-bold">¿Cómo personalizo mis colores?</h6>
              <p className="small text-secondary m-0">Ve a Configuración &gt; Marca. Selecciona tu color y el dashboard se adaptará automáticamente.</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="p-4 border rounded-xl h-100">
              <h6 className="fw-bold">¿Puedo exportar mis datos?</h6>
              <p className="small text-secondary m-0">Sí, todos tus listados de clientes y finanzas pueden exportarse a Excel o PDF en un clic.</p>
            </div>
          </Col>
        </Row>
      </section>

      {/* Cierre */}
      <footer className="guide-footer text-center py-5">
        <Rocket size={48} className="mb-4 text-primary" />
        <h2 className="fw-black mb-3">¿Listo para escalar?</h2>
        <p className="text-secondary mb-5">Dashboard OS está diseñado para crecer contigo.</p>
        <button className="btn-premium px-5 py-3">Empezar ahora</button>
      </footer>
    </div>
  );
}
