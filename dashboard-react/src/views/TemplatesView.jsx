import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { Sparkles, MessageSquare, Mail, Award, CheckCircle, Zap, ShieldAlert, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";

const TEMPLATES = [
  {
    id: "template-1",
    nameEs: "Confirmación de cita",
    nameEn: "Appointment confirmation",
    descEs: "Envía un mensaje automático al cliente cuando su cita es agendada y confirmada en la agenda.",
    descEn: "Sends an automatic message to the client when their appointment is scheduled and confirmed.",
    complexityEs: "Bajo",
    complexityEn: "Low",
    complexityColor: "success",
    channels: ["whatsapp", "email"],
    triggerType: "cita-confirmada",
    steps: [
      {
        id: "node-trigger",
        name: "📅 Cita Confirmada",
        type: "trigger",
        subtype: "cita-confirmada",
        x: 120,
        y: 220,
        description: "Se ejecuta al confirmar cita."
      },
      {
        id: "node-whatsapp",
        name: "📱 Enviar WhatsApp",
        type: "action",
        subtype: "whatsapp",
        x: 420,
        y: 220,
        config: { message: "Hola {{cliente}}! Tu cita de {{servicio}} con {{profesional}} está confirmada." },
        description: "Manda mensaje por enlace WhatsApp."
      },
      {
        id: "node-email",
        name: "✉️ Enviar Correo",
        type: "action",
        subtype: "email",
        x: 720,
        y: 220,
        config: { message: "Hola {{cliente}}, tu cita para el {{fecha}} ha sido confirmada con éxito. ¡Te esperamos!" },
        description: "Envía un email formal por Gmail API."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-whatsapp" },
      { id: "trans-2", from: "node-whatsapp", to: "node-email" }
    ]
  },
  {
    id: "template-2",
    nameEs: "Recordatorio 24h",
    nameEn: "24-Hour Reminder",
    descEs: "Envía un recordatorio amistoso por WhatsApp 24 horas antes de la cita para reducir inasistencias.",
    descEn: "Sends a friendly reminder via WhatsApp 24 hours before the appointment to reduce no-shows.",
    complexityEs: "Bajo",
    complexityEn: "Low",
    complexityColor: "success",
    channels: ["whatsapp"],
    triggerType: "cita-confirmada",
    steps: [
      {
        id: "node-trigger",
        name: "📅 Cita Confirmada",
        type: "trigger",
        subtype: "cita-confirmada",
        x: 120,
        y: 220,
        description: "Se ejecuta al confirmar cita."
      },
      {
        id: "node-delay",
        name: "⏳ Esperar 24 Horas",
        type: "delay",
        subtype: "delay",
        x: 420,
        y: 220,
        config: { timeValue: 24, timeUnit: "horas" },
        description: "Espera antes de avanzar."
      },
      {
        id: "node-whatsapp",
        name: "📱 WhatsApp Recordatorio",
        type: "action",
        subtype: "whatsapp",
        x: 720,
        y: 220,
        config: { message: "Hola {{cliente}}, te recordamos tu cita de {{servicio}} para mañana en {{empresa}}." },
        description: "Manda mensaje por enlace WhatsApp."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-delay" },
      { id: "trans-2", from: "node-delay", to: "node-whatsapp" }
    ]
  },
  {
    id: "template-3",
    nameEs: "Cumpleaños",
    nameEn: "Birthday Greeting",
    descEs: "Felicita a tus clientes automáticamente en su día especial y regálales un descuento exclusivo.",
    descEn: "Automatically greet your clients on their special day and gift them an exclusive discount.",
    complexityEs: "Medio",
    complexityEn: "Medium",
    complexityColor: "warning",
    channels: ["email", "whatsapp"],
    triggerType: "cliente-nuevo",
    steps: [
      {
        id: "node-trigger",
        name: "👤 Cumpleaños del Cliente",
        type: "trigger",
        subtype: "cliente-nuevo",
        x: 120,
        y: 220,
        description: "Se ejecuta al detectar aniversario del cliente."
      },
      {
        id: "node-whatsapp",
        name: "📱 Saludo por WhatsApp",
        type: "action",
        subtype: "whatsapp",
        x: 420,
        y: 220,
        config: { message: "¡Feliz cumpleaños {{cliente}}! Queremos regalarte un 15% de descuento en tu próximo servicio en {{empresa}}." },
        description: "Manda mensaje por enlace WhatsApp."
      },
      {
        id: "node-email",
        name: "✉️ Email de Celebración",
        type: "action",
        subtype: "email",
        x: 720,
        y: 220,
        config: { message: "Feliz Cumpleaños {{cliente}}! Disfruta de un regalo especial de nuestra parte: Cupón REGALO15." },
        description: "Envía un email formal por Gmail API."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-whatsapp" },
      { id: "trans-2", from: "node-whatsapp", to: "node-email" }
    ]
  },
  {
    id: "template-4",
    nameEs: "Encuesta NPS",
    nameEn: "NPS Survey",
    descEs: "Mide la satisfacción de tus clientes enviando una encuesta de opinión 1 hora después del servicio.",
    descEn: "Measure your clients' satisfaction by sending a feedback survey 1 hour after the service.",
    complexityEs: "Medio",
    complexityEn: "Medium",
    complexityColor: "warning",
    channels: ["email"],
    triggerType: "cita-finalizada",
    steps: [
      {
        id: "node-trigger",
        name: "🏁 Cita Finalizada",
        type: "trigger",
        subtype: "cita-finalizada",
        x: 120,
        y: 220,
        description: "Se ejecuta al marcar cita DONE."
      },
      {
        id: "node-delay",
        name: "⏳ Esperar 1 Hora",
        type: "delay",
        subtype: "delay",
        x: 420,
        y: 220,
        config: { timeValue: 1, timeUnit: "horas" },
        description: "Espera antes de avanzar."
      },
      {
        id: "node-email",
        name: "✉️ Correo NPS",
        type: "action",
        subtype: "email",
        x: 720,
        y: 220,
        config: { message: "Hola {{cliente}}, ¿cómo calificarías tu experiencia hoy con {{profesional}} de 1 al 10?" },
        description: "Envía un email formal por Gmail API."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-delay" },
      { id: "trans-2", from: "node-delay", to: "node-email" }
    ]
  },
  {
    id: "template-5",
    nameEs: "Cliente inactivo 30 días",
    nameEn: "30-Day Inactive Client",
    descEs: "Detecta clientes que no han agendado citas en el último mes e incentívalos a volver con promociones.",
    descEn: "Detect clients who haven't booked in the last month and incentivize them to return with promos.",
    complexityEs: "Alto",
    complexityEn: "High",
    complexityColor: "danger",
    channels: ["whatsapp", "email"],
    triggerType: "cliente-inactivo",
    steps: [
      {
        id: "node-trigger",
        name: "⚠️ Cliente Inactivo",
        type: "trigger",
        subtype: "cliente-inactivo",
        x: 120,
        y: 220,
        description: "Se ejecuta si cliente no asiste en 60d."
      },
      {
        id: "node-whatsapp",
        name: "📱 Mensaje de Reactivación",
        type: "action",
        subtype: "whatsapp",
        x: 420,
        y: 220,
        config: { message: "Hola {{cliente}}, hace un mes que no nos visitas en {{empresa}}. Te extrañamos mucho. Agendá online y obtén una sorpresa." },
        description: "Manda mensaje por enlace WhatsApp."
      },
      {
        id: "node-email",
        name: "✉️ Email de Retorno",
        type: "action",
        subtype: "email",
        x: 720,
        y: 220,
        config: { message: "Te extrañamos, {{cliente}}. Queremos ofrecerte una hidratación capilar de regalo en tu próximo corte. Válido por 7 días." },
        description: "Envía un email formal por Gmail API."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-whatsapp" },
      { id: "trans-2", from: "node-whatsapp", to: "node-email" }
    ]
  },
  {
    id: "template-6",
    nameEs: "Seguimiento post-servicio",
    nameEn: "Post-Service Follow-up",
    descEs: "Envía consejos útiles y agradece la visita 2 horas después de finalizar el tratamiento.",
    descEn: "Sends useful tips and thanks the visit 2 hours after completing the treatment.",
    complexityEs: "Bajo",
    complexityEn: "Low",
    complexityColor: "success",
    channels: ["whatsapp"],
    triggerType: "cita-finalizada",
    steps: [
      {
        id: "node-trigger",
        name: "🏁 Cita Finalizada",
        type: "trigger",
        subtype: "cita-finalizada",
        x: 120,
        y: 220,
        description: "Se ejecuta al marcar cita DONE."
      },
      {
        id: "node-delay",
        name: "⏳ Esperar 2 Horas",
        type: "delay",
        subtype: "delay",
        x: 420,
        y: 220,
        config: { timeValue: 2, timeUnit: "horas" },
        description: "Espera antes de avanzar."
      },
      {
        id: "node-whatsapp",
        name: "📱 Consejos Post-Servicio",
        type: "action",
        subtype: "whatsapp",
        x: 720,
        y: 220,
        config: { message: "Hola {{cliente}}, gracias por visitarnos hoy. Recordá no mojar tu cabello en las próximas 24 horas para mayor durabilidad." },
        description: "Manda mensaje por enlace WhatsApp."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-delay" },
      { id: "trans-2", from: "node-delay", to: "node-whatsapp" }
    ]
  },
  {
    id: "template-7",
    nameEs: "Fidelización VIP",
    nameEn: "VIP Loyalty Program",
    descEs: "Premia a tus clientes más recurrentes con beneficios exclusivos cuando son categorizados VIP.",
    descEn: "Reward your most recurring clients with exclusive benefits when they are marked VIP.",
    complexityEs: "Alto",
    complexityEn: "High",
    complexityColor: "danger",
    channels: ["email"],
    triggerType: "pago-recibido",
    steps: [
      {
        id: "node-trigger",
        name: "💸 Pago Recibido",
        type: "trigger",
        subtype: "pago-recibido",
        x: 120,
        y: 220,
        description: "Se ejecuta al registrar cobro."
      },
      {
        id: "node-condition",
        name: "🧠 Evaluar VIP",
        type: "condition",
        subtype: "condition",
        x: 420,
        y: 220,
        config: { property: "cliente.vip", operator: "==", value: "true" },
        description: "Bifurca el camino lógico."
      },
      {
        id: "node-email",
        name: "✉️ Email Felicitación VIP",
        type: "action",
        subtype: "email",
        x: 720,
        y: 220,
        config: { message: "Felicidades {{cliente}}, has alcanzado la membresía VIP de {{empresa}}. Disfruta de turnos prioritarios y bebidas de cortesía en cada visita." },
        description: "Envía un email formal por Gmail API."
      }
    ],
    transitions: [
      { id: "trans-1", from: "node-trigger", to: "node-condition" },
      { id: "trans-2", from: "node-condition", to: "node-email" }
    ]
  }
];

export default function TemplatesView() {
  const navigate = useNavigate();
  const [installingId, setInstallingId] = useState(null);
  const [alert, setAlert] = useState(null);
  
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  const handleInstall = async (tpl) => {
    try {
      setInstallingId(tpl.id);
      setAlert(null);

      const name = isEs ? `${tpl.nameEs} (Instalado)` : `${tpl.nameEn} (Installed)`;
      const description = isEs ? tpl.descEs : tpl.descEn;

      // Create workflow via REST API
      const payload = {
        name,
        description,
        status: "ACTIVE",
        trigger: {
          type: tpl.triggerType,
          config: {}
        },
        steps: tpl.steps,
        transitions: tpl.transitions,
        screens: []
      };

      await api.post("/workflows", payload);

      setAlert({
        type: "success",
        message: isEs 
          ? `¡Excelente! La plantilla "${tpl.nameEs}" ha sido instalada y activada con éxito en tu Centro de Flujos.`
          : `Great! The template "${tpl.nameEn}" has been successfully installed and activated in your Flows Center.`
      });

      // Redirect to flows after 1.5 seconds
      setTimeout(() => {
        navigate("/app/workflows");
      }, 1500);
    } catch (e) {
      console.error(e);
      setAlert({
        type: "danger",
        message: isEs 
          ? "No pudimos instalar la plantilla. Por favor, vuelve a intentarlo."
          : "We couldn't install the template. Please, try again."
      });
    } finally {
      setInstallingId(null);
    }
  };

  const getChannelIcon = (ch) => {
    switch (ch) {
      case "whatsapp":
        return <MessageSquare size={14} className="text-success" />;
      case "email":
        return <Mail size={14} className="text-primary" />;
      default:
        return <Zap size={14} className="text-warning" />;
    }
  };

  return (
    <Container fluid className="p-0 animate-fade-in">
      <header className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Sparkles className="text-purple-600 animate-pulse" size={28} />
          <h1 className="fw-bold h3 m-0">
            {isEs ? "Plantillas de Flujos" : "Flow Templates"}
          </h1>
        </div>
        <p className="text-muted">
          {isEs 
            ? "Instala al instante flujos operativos y de marketing pre-diseñados para automatizar los procesos de tu negocio."
            : "Instantly install pre-designed operational and marketing flows to automate your business processes."
          }
        </p>
      </header>

      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="rounded-2xl border-0 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-2">
            {alert.type === "success" ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
            <span>{alert.message}</span>
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {TEMPLATES.map((tpl) => (
          <Col lg={4} md={6} key={tpl.id}>
            <Card className="card-premium h-100 border bg-white p-4 rounded-2xl shadow-sm d-flex flex-column justify-content-between hover-scale">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex gap-1">
                    {tpl.channels.map((ch) => (
                      <span
                        key={ch}
                        className="p-2 rounded-xl border bg-light d-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px" }}
                        title={`Channel: ${ch.toUpperCase()}`}
                      >
                        {getChannelIcon(ch)}
                      </span>
                    ))}
                  </div>
                  <Badge bg={`${tpl.complexityColor}-soft`} className={`text-${tpl.complexityColor} px-2.5 py-1.5 border border-${tpl.complexityColor} border-opacity-10`} style={{ borderRadius: "8px", fontSize: "10.5px" }}>
                    {isEs ? "Complejidad" : "Complexity"}: {isEs ? tpl.complexityEs : tpl.complexityEn}
                  </Badge>
                </div>

                <h3 className="h6 fw-black text-gray-900 mb-2">
                  {isEs ? tpl.nameEs : tpl.nameEn}
                </h3>
                <p className="text-muted smaller mb-4" style={{ lineHeight: "1.45", minHeight: "60px" }}>
                  {isEs ? tpl.descEs : tpl.descEn}
                </p>
              </div>

              <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-auto">
                <div className="smaller text-muted d-flex align-items-center gap-1">
                  <Clock size={13} />
                  <span>
                    {isEs ? "Configuración en 1s" : "Set up in 1s"}
                  </span>
                </div>
                
                <Button
                  variant="dark"
                  size="sm"
                  className="rounded-xl px-3 py-2 fw-bold d-flex align-items-center gap-1.5 border-0"
                  style={{ background: "#111827" }}
                  disabled={installingId !== null}
                  onClick={() => handleInstall(tpl)}
                >
                  {installingId === tpl.id ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-1" />
                      <span>{isEs ? "Instalando..." : "Installing..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEs ? "Usar plantilla" : "Use template"}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <style>{`
        .bg-success-soft {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .bg-warning-soft {
          background-color: rgba(245, 158, 11, 0.08) !important;
        }
        .bg-danger-soft {
          background-color: rgba(239, 68, 68, 0.08) !important;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </Container>
  );
}
