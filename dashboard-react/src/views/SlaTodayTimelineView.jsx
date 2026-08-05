import React from "react";
import { Container, Row, Col, Spinner, Alert, Button, Card } from "react-bootstrap";
import { Clock, RefreshCw, Calendar, Sparkles } from "lucide-react";
import { useSlaTimeline } from "../hooks/useSlaTimeline";
import SlaTimelineCard from "../components/appointments/SlaTimelineCard";

export default function SlaTodayTimelineView() {
  const {
    appointments,
    loading,
    error,
    now,
    fetchTimeline,
    markArrived,
    markCompleted
  } = useSlaTimeline();

  const formattedDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <Container fluid className="py-4 px-md-4">
      {/* Header de la Vista */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill bg-purple-100 text-purple-700 px-3 py-1 fw-bold smaller text-uppercase">
              <Sparkles size={12} className="me-1 inline" /> Avance Intra-Cita (Modelo Mixto)
            </span>
          </div>
          <h2 className="fw-black text-dark mb-1 h3" style={{ letterSpacing: "-0.02em" }}>
            Timeline de SLA por Cita del Día
          </h2>
          <p className="text-muted small mb-0">
            Medición de avance en vivo por cita. El reloj inicia al marcar la llegada de la clienta.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            className="rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold bg-white shadow-xs"
            onClick={fetchTimeline}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="rounded-4 mb-4">
          {error}
        </Alert>
      )}

      {loading && appointments.length === 0 ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted fw-medium">Cargando citas de hoy...</p>
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-4 text-center p-5 bg-white">
          <div className="p-3 rounded-circle bg-light d-inline-flex align-items-center justify-content-center text-muted mb-3 mx-auto" style={{ width: "60px", height: "60px" }}>
            <Calendar size={32} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Sin citas programadas para hoy</h4>
          <p className="text-muted small mb-0" style={{ maxWidth: "420px", margin: "0 auto" }}>
            No hay citas agendadas para el día de hoy ({formattedDate}). Las nuevas citas registradas aparecerán automáticamente aquí.
          </p>
        </Card>
      ) : (
        <Row className="g-3">
          <Col lg={8} xl={9}>
            <div className="mb-3 d-flex align-items-center justify-content-between">
              <span className="text-muted small fw-semibold uppercase" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
                Citas de Hoy ({appointments.length})
              </span>
              <span className="text-muted smaller">
                Fecha: <b>{formattedDate}</b>
              </span>
            </div>

            {appointments.map((appt) => (
              <SlaTimelineCard
                key={appt.id}
                appointment={appt}
                now={now}
                onArrive={markArrived}
                onComplete={markCompleted}
              />
            ))}
          </Col>

          {/* Panel Lateral Informativo / Leyenda SLA */}
          <Col lg={4} xl={3}>
            <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Clock size={16} className="text-purple-600" />
                <span>Estados del Reloj SLA</span>
              </h6>
              <div className="d-flex flex-column gap-2.5 small">
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light">
                  <span className="fw-semibold text-secondary">Esperando llegada</span>
                  <span className="badge bg-secondary rounded-pill">0% Avance</span>
                </div>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-emerald-50 text-emerald-800">
                  <span className="fw-semibold">A tiempo</span>
                  <span className="badge bg-success rounded-pill">Dentro de tiempo</span>
                </div>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-amber-50 text-amber-800">
                  <span className="fw-semibold">En riesgo</span>
                  <span className="badge bg-warning text-dark rounded-pill">Próximo al límite</span>
                </div>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-red-50 text-red-800">
                  <span className="fw-semibold">Retrasado</span>
                  <span className="badge bg-danger rounded-pill">Tiempo superado</span>
                </div>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-purple-50 text-purple-800">
                  <span className="fw-semibold">Completado</span>
                  <span className="badge bg-info rounded-pill">Servicio Finalizado</span>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 p-3 bg-purple-50 text-purple-900">
              <h6 className="fw-bold mb-2 small text-uppercase" style={{ letterSpacing: "0.05em" }}>
                💡 Modelo Mixto de Avance
              </h6>
              <p className="smaller mb-0" style={{ fontSize: "12px", lineHeight: "1.5" }}>
                El personal del salón solo debe presionar <b>"Marcar llegada"</b> al recibir a la clienta y <b>"Terminó"</b> al finalizar. Las sub-etapas intermedias (Recepción, En servicio, Cierre) se proyectan y calculan automáticamente.
              </p>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}
