import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Alert } from "react-bootstrap";
import { MessageCircle, Clock, Users, Plus, Check, Clipboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppointmentsCalendar from "../gadgets/appointments/AppointmentsCalendar";
import api from "../lib/api.js";

export default function CalendarView() {
  const { t } = useTranslation("views");
  const [appointments, setAppointments] = useState([]);
  const [selectedApptId, setSelectedApptId] = useState("");
  const [copied, setCopied] = useState(false);

  // Lista de espera
  const [waitlist, setWaitlist] = useState([
    { id: 1, name: "Valentina Prieto", phone: "1143210987", service: "Balayage", date: "Sábado Mañana" },
    { id: 2, name: "Lucas Marino", phone: "1176549876", service: "Corte Masculino", date: "Jueves Tarde" }
  ]);
  const [newWait, setNewWait] = useState({ name: "", phone: "", service: "", date: "" });

  // Cargar citas para el generador de WhatsApp
  useEffect(() => {
    api.get("/appointments")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setAppointments(list.filter(a => a.status === "CONFIRMED" || a.status === "PENDING"));
        if (list.length > 0) {
          setSelectedApptId(list[0].id);
        }
      })
      .catch(e => console.error(e));
  }, []);

  const selectedAppt = appointments.find(a => a.id === selectedApptId);

  const whatsappMessage = selectedAppt ? 
    `¡Hola ${selectedAppt.client?.firstName || "Cliente"}! Te confirmamos tu turno en Aura Studio para el ${new Date(selectedAppt.startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las ${new Date(selectedAppt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} hs para el servicio de ${selectedAppt.service?.name || "Estética"}. Profesional: ${selectedAppt.worker?.firstName || "Profesional"}. ¡Te esperamos!` 
    : "Selecciona una cita confirmada para generar el recordatorio automático...";

  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToWaitlist = (e) => {
    e.preventDefault();
    if (!newWait.name || !newWait.service) return;
    setWaitlist(prev => [...prev, { ...newWait, id: Date.now() }]);
    setNewWait({ name: "", phone: "", service: "", date: "" });
  };

  return (
    <Container fluid className="p-0 pb-4">
      <header className="mb-4">
        <div>
          <h1 className="fw-bold h3">{t("calendar.title")}</h1>
          <p className="text-muted mb-0">{t("calendar.subtitle")}</p>
        </div>
      </header>

      <Row className="g-4">
        {/* Calendario central */}
        <Col lg={8}>
          <div className="card-premium p-0 overflow-hidden shadow-sm" style={{ minHeight: "calc(100vh - 200px)" }}>
            <AppointmentsCalendar />
          </div>
        </Col>

        {/* Panel lateral Asistente Inteligente */}
        <Col lg={4}>
          <div className="d-grid gap-4">
            
            {/* HERRAMIENTA 1: Confirmaciones por WhatsApp */}
            <Card className="card-premium border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="h6 fw-black text-dark mb-3 d-flex align-items-center gap-2">
                  <MessageCircle size={18} className="text-success" />
                  <span>Confirmación por WhatsApp</span>
                </h3>

                <Form.Group className="mb-3">
                  <Form.Label className="smaller text-muted fw-bold">Elegir cita a recordar</Form.Label>
                  <Form.Select 
                    value={selectedApptId} 
                    onChange={(e) => setSelectedApptId(e.target.value)} 
                    className="modern-input"
                    style={{ fontSize: "12.5px" }}
                  >
                    {appointments.length === 0 ? (
                      <option value="">-- No hay citas activas hoy --</option>
                    ) : (
                      appointments.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.client?.firstName} {a.client?.lastName} - {a.service?.name}
                        </option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>

                {selectedAppt && (
                  <div className="p-3 bg-light rounded-3 small text-muted border mb-3" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                    {whatsappMessage}
                  </div>
                )}

                <Button 
                  variant="dark" 
                  disabled={!selectedAppt} 
                  onClick={handleCopyText} 
                  className="btn-premium w-100 justify-content-center py-2"
                  style={{ background: "#25d366", borderColor: "#25d366" }}
                >
                  {copied ? (
                    <>
                      <Check size={16} className="me-1.5" />
                      <span>¡Copiado con éxito!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard size={16} className="me-1.5" />
                      <span>Copiar Recordatorio</span>
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>

            {/* HERRAMIENTA 2: Huecos Libres Optimizados */}
            <Card className="card-premium border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="h6 fw-black text-dark mb-3 d-flex align-items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <span>Huecos Libres Sugeridos</span>
                </h3>
                <p className="text-muted smaller mb-3">Horarios vacíos recomendados hoy para maximizar ingresos.</p>

                <div className="d-grid gap-2">
                  <div className="p-2 border.soft rounded-3 bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold small text-dark">Hoy, 11:00 hs</div>
                      <div className="text-muted smaller">Andrea - Disponible (Coloración)</div>
                    </div>
                    <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1">Ideal</Badge>
                  </div>
                  <div className="p-2 border.soft rounded-3 bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold small text-dark">Mañana, 15:30 hs</div>
                      <div className="text-muted smaller">Nicolás - Disponible (Corte)</div>
                    </div>
                    <Badge bg="primary-soft" className="text-primary rounded-pill px-2.5 py-1">Recomendado</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* HERRAMIENTA 3: Lista de Espera Inteligente */}
            <Card className="card-premium border-0 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="h6 fw-black text-dark mb-3 d-flex align-items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <span>Lista de Espera</span>
                </h3>

                <Form onSubmit={handleAddToWaitlist} className="d-grid gap-2 mb-3 bg-light p-2.5 rounded-3 border">
                  <Row className="g-1">
                    <Col xs={6}>
                      <Form.Control
                        placeholder="Nombre..."
                        value={newWait.name}
                        onChange={(e) => setNewWait(prev => ({ ...prev, name: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "11px" }}
                        required
                      />
                    </Col>
                    <Col xs={6}>
                      <Form.Control
                        placeholder="Servicio..."
                        value={newWait.service}
                        onChange={(e) => setNewWait(prev => ({ ...prev, service: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "11px" }}
                        required
                      />
                    </Col>
                  </Row>
                  <Row className="g-1">
                    <Col xs={6}>
                      <Form.Control
                        placeholder="WhatsApp..."
                        value={newWait.phone}
                        onChange={(e) => setNewWait(prev => ({ ...prev, phone: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "11px" }}
                      />
                    </Col>
                    <Col xs={6}>
                      <Form.Control
                        placeholder="Preferencia (Día)..."
                        value={newWait.date}
                        onChange={(e) => setNewWait(prev => ({ ...prev, date: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "11px" }}
                      />
                    </Col>
                  </Row>
                  <Button type="submit" variant="dark" size="sm" className="w-100 rounded-pill btn-premium justify-content-center py-1 mt-1 small">
                    <Plus size={12} />
                    <span>Agregar a Espera</span>
                  </Button>
                </Form>

                <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: "140px" }}>
                  {waitlist.map(w => (
                    <ListGroup.Item key={w.id} className="px-1 py-2 bg-transparent d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold small text-dark">{w.name}</div>
                        <div className="text-muted smaller">{w.service} | {w.date || "Cualquier momento"}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline-primary" 
                        onClick={() => {
                          alert(`Se notificará por WhatsApp a ${w.name} (${w.phone || ""}) en cuanto se libere un hueco.`);
                          setWaitlist(prev => prev.filter(item => item.id !== w.id));
                        }} 
                        className="rounded-pill border-0 smaller py-1 px-2.5 bg-primary-soft text-primary fw-bold"
                      >
                        Notificar
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>

          </div>
        </Col>
      </Row>
    </Container>
  );
}
