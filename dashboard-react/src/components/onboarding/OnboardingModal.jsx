import React, { useState } from "react";
import { Modal, Button, Row, Col, Card, Badge } from "react-bootstrap";
import { Sparkles, Settings2, BarChart2, CalendarDays, ArrowRight, ArrowLeft } from "lucide-react";

export default function OnboardingModal({ show, onHide, onEditBrand }) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleComplete = (configureBrand = false) => {
    localStorage.setItem("onboardingCompleted", "true");
    onHide();
    if (configureBrand) {
      setTimeout(() => {
        onEditBrand?.();
      }, 300);
    }
  };

  return (
    <Modal
      show={show}
      onHide={() => handleComplete(false)}
      centered
      backdrop="static"
      keyboard={false}
      size="lg"
      className="modal-premium border-0"
    >
      <Modal.Body className="p-5 text-dark bg-white rounded-4 overflow-hidden position-relative">
        
        {/* Step Indicator */}
        <div className="position-absolute top-0 start-0 w-100 p-3 px-5 d-flex justify-content-between align-items-center border-bottom bg-light">
          <div className="d-flex align-items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="fw-semibold small text-muted">Configuración Inicial</span>
          </div>
          <span className="small fw-bold text-muted">{step} / 4</span>
        </div>

        <div className="pt-4 mt-2">
          {step === 1 && (
            <div className="text-center py-3">
              <div className="p-3 bg-light rounded-circle d-inline-block text-primary mb-4 shadow-sm">
                <Sparkles size={48} className="animate-pulse" />
              </div>
              <h2 className="fw-black mb-3" style={{ fontSize: "1.85rem" }}>¡Bienvenido a tu Dashboard Inteligente!</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: "560px", fontSize: "14px" }}>
                Esta plataforma SaaS está diseñada para centralizar la gestión de tu negocio.
                Podrás organizar turnos en tiempo real, fidelizar clientes, administrar tu equipo, y optimizar tus ingresos con analíticas de precisión e Inteligencia Artificial.
              </p>
              <Card className="border-0 bg-light p-3 mt-4 text-start mx-auto" style={{ maxWidth: "480px" }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="p-2 bg-white rounded-3 text-primary fw-bold">✓</div>
                  <div className="small text-muted">
                    <strong>Consejo:</strong> Podés saltar este onboarding en cualquier momento presionando la cruz de cerrar.
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-4">
                <div className="p-3 bg-light rounded-circle d-inline-block text-primary mb-3 shadow-sm">
                  <Settings2 size={36} />
                </div>
                <h3 className="fw-bold mb-2">Personalización e Imagen de Marca</h3>
                <p className="text-muted small mx-auto" style={{ maxWidth: "520px" }}>
                  Alineá el dashboard con la identidad visual de tu negocio. Puedes personalizar la cabecera, logotipos, colores corporativos y tipografías.
                </p>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Card className="border-0 bg-light p-3 h-100">
                    <h5 className="fw-bold small mb-2">Nombre y Descripción</h5>
                    <p className="text-muted small mb-0">
                      Establecé el nombre oficial, el eslogan y la descripción de tu estudio. Estos datos se reflejarán tanto en tu panel como en el portal de reserva de clientes.
                    </p>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light p-3 h-100">
                    <h5 className="fw-bold small mb-2">Paleta y Diseño</h5>
                    <p className="text-muted small mb-0">
                      Elegí un color de acento y tipografía curada (ej: Spas, Clínicas, Barberías) para que todo el dashboard y botones tomen el estilo correspondiente.
                    </p>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-center mb-4">
                <div className="p-3 bg-light rounded-circle d-inline-block text-primary mb-3 shadow-sm">
                  <BarChart2 size={36} />
                </div>
                <h3 className="fw-bold mb-2">Métricas y Rejilla de Widgets</h3>
                <p className="text-muted small mx-auto" style={{ maxWidth: "520px" }}>
                  Tu panel cuenta con widgets interactivos de Recharts y KPIs en tiempo real. Podés moverlos, reordenarlos y ajustar sus dimensiones.
                </p>
              </div>

              <Row className="g-3">
                <Col md={4}>
                  <Card className="border-0 bg-light p-3 text-center">
                    <strong className="text-primary small d-block mb-1">KPIs Clave</strong>
                    <span className="text-muted small" style={{ fontSize: "11px" }}>
                      Monitoreá ingresos, citas del día, tasa de ausencias y total de clientes.
                    </span>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-light p-3 text-center">
                    <strong className="text-primary small d-block mb-1">Gráficos de Recharts</strong>
                    <span className="text-muted small" style={{ fontSize: "11px" }}>
                      Visualizá curvas de ventas o barras de carga de trabajo por profesional.
                    </span>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-light p-3 text-center">
                    <strong className="text-primary small d-block mb-1">Copilot de IA</strong>
                    <span className="text-muted small" style={{ fontSize: "11px" }}>
                      Hablale al chat para que analice tus tendencias o autogenere widgets en tu pantalla.
                    </span>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-2">
              <div className="p-3 bg-light rounded-circle d-inline-block text-primary mb-3 shadow-sm">
                <CalendarDays size={36} />
              </div>
              <h3 className="fw-bold mb-2">Reservas Online y Link Público</h3>
              <p className="text-muted small mx-auto" style={{ maxWidth: "540px" }}>
                ¡Facilitá la agenda de tus clientes! Tu negocio cuenta con una página pública de reservas sin autenticación. 
                Tus clientes seleccionan el servicio, el profesional, la hora disponible calculada automáticamente por el backend y completan sus datos.
              </p>
              <div className="border border-dashed rounded-3 p-3 bg-light mx-auto mt-4 text-start" style={{ maxWidth: "500px" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-muted small">Link público sugerido:</span>
                  <Badge bg="dark" className="opacity-75">Reserva Online Activa</Badge>
                </div>
                <code className="d-block mt-2 text-primary fw-semibold" style={{ fontSize: "13px" }}>
                  http://localhost:5173/booking/mi-negocio
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
          <Button
            variant="link"
            className="text-muted small p-0"
            onClick={() => handleComplete(false)}
            style={{ textDecoration: "none" }}
          >
            Saltar onboarding
          </Button>

          <div className="d-flex gap-2">
            {step > 1 && (
              <Button
                variant="outline-secondary"
                onClick={handleBack}
                className="rounded-pill px-4"
              >
                <ArrowLeft size={16} className="me-2" /> Atrás
              </Button>
            )}
            
            {step < 4 ? (
              <Button
                variant="dark"
                onClick={handleNext}
                className="rounded-pill px-4 btn-premium"
              >
                Siguiente <ArrowRight size={16} className="ms-2" />
              </Button>
            ) : (
              <div className="d-flex gap-2">
                <Button
                  variant="outline-dark"
                  onClick={() => handleComplete(true)}
                  className="rounded-pill px-3"
                >
                  Configurar Marca
                </Button>
                <Button
                  variant="dark"
                  onClick={() => handleComplete(false)}
                  className="rounded-pill px-3 btn-premium"
                >
                  Finalizar
                </Button>
              </div>
            )}
          </div>
        </div>

      </Modal.Body>
    </Modal>
  );
}
