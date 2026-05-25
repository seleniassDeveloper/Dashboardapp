import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";
import { CheckCircle2, Calendar, User, Clock, ArrowLeft } from "lucide-react";

export default function BookingSuccess() {
  const { businessSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { message, booking, color } = location.state || {
    message: "¡Tu reserva ha sido confirmada con éxito!",
    booking: null,
    color: "#10b981",
  };

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <CheckCircle2 size={48} className="text-success mb-3" />
        <h2 className="fw-bold mb-3">Reserva Procesada</h2>
        <p className="text-muted small">Tu turno ha sido procesado. Comunícate con el negocio para confirmar.</p>
        <Button variant="dark" onClick={() => navigate(`/booking/${businessSlug}`)} className="rounded-pill px-4">
          Hacer otra Reserva
        </Button>
      </Container>
    );
  }

  // Formatear fecha
  const apptDate = new Date(booking.startsAt);
  const formattedDate = apptDate.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = apptDate.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC", // Forzar UTC para coincidir con la selección
  });

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }} className="py-5 d-flex align-items-center">
      <Container style={{ maxWidth: "560px" }}>
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center bg-white">
          <div className="p-4 text-white" style={{ background: color }}>
            <CheckCircle2 size={56} className="mb-2" />
            <h2 className="fw-black h4 mb-0">¡Reserva Completada!</h2>
          </div>
          
          <Card.Body className="p-4 text-start">
            <h3 className="h6 fw-bold text-muted uppercase mb-3">Resumen de tu turno</h3>
            
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex gap-3 align-items-center">
                <div className="p-2 bg-light rounded-circle text-muted">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="small text-muted">Fecha</div>
                  <div className="fw-bold small text-capitalize">{formattedDate}</div>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="p-2 bg-light rounded-circle text-muted">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="small text-muted">Horario</div>
                  <div className="fw-bold small">{formattedTime} hs</div>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="p-2 bg-light rounded-circle text-muted">
                  <User size={18} />
                </div>
                <div>
                  <div className="small text-muted">Profesional</div>
                  <div className="fw-bold small">
                    {booking.worker ? `${booking.worker.firstName} ${booking.worker.lastName}` : "Asignado automáticamente"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 mb-4">
              <div className="fw-semibold small text-dark mb-1">Servicio contratado:</div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">{booking.service?.name}</span>
                <span className="fw-bold text-dark">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(booking.service?.price || 0)}</span>
              </div>
            </div>

            <p className="text-muted text-center small mb-4">
              {message} Te enviamos un correo electrónico y nos pondremos en contacto contigo en caso de reprogramaciones.
            </p>

            <div className="d-grid gap-2">
              <Button
                variant="dark"
                onClick={() => navigate(`/booking/${businessSlug}`)}
                className="rounded-pill py-2.5 btn-premium"
                style={{ background: color, borderColor: color }}
              >
                Volver a Reservas
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/")}
                className="rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
