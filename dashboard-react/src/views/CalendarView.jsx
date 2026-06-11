import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Alert } from "react-bootstrap";
import { 
  MessageCircle, Clock, Users, Plus, Check, Clipboard, Trash2, 
  Sparkles, AlertCircle, Phone, Calendar as CalendarIcon, DollarSign 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppointmentsCalendar from "../gadgets/appointments/AppointmentsCalendar";
import AppointmentModal from "../gadgets/appointments/AppointmentModal";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../lib/api.js";

export default function CalendarView() {
  const { t } = useTranslation("views");
  const { appointments, services, fetchAppointments, business } = useAppointmentsStore();
  const [workers, setWorkers] = useState([]);
  const [showEmbeddedGoogle, setShowEmbeddedGoogle] = useState(false);

  // Cargar estilistas del backend
  useEffect(() => {
    api.get("/workers")
      .then(res => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(e => console.error(e));
  }, []);

  // Lista de espera reactiva y persistida en localStorage
  const [waitlist, setWaitlist] = useState(() => {
    const saved = localStorage.getItem("aura_waitlist");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, firstName: "Valentina", lastName: "Prieto", phone: "1143210987", serviceId: "", workerId: "", preferenceDate: "2026-06-12", preferenceTime: "10:00", priority: "Alta", status: "Esperando" },
      { id: 2, firstName: "Lucas", lastName: "Marino", phone: "1176549876", serviceId: "", workerId: "", preferenceDate: "2026-06-13", preferenceTime: "15:00", priority: "Media", status: "Esperando" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("aura_waitlist", JSON.stringify(waitlist));
  }, [waitlist]);

  // Formulario nuevo cliente en lista
  const [newWait, setNewWait] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    serviceId: "",
    workerId: "",
    preferenceDate: "",
    preferenceTime: "",
    priority: "Alta",
  });

  // Modal de Agendamiento rápido
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialAddData, setInitialAddData] = useState(null);

  // --- MOTOR DE RECOMENDACIONES DE AURA AI (Punto 6) ---
  // Detector de huecos libres (Mock determinista e interactivo en tiempo real)
  const gaps = useMemo(() => {
    const list = [];
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const w1 = workers[0] || { id: "w1", firstName: "María", lastName: "Gómez" };
    const w2 = workers[1] || { id: "w2", firstName: "Ana", lastName: "Rodríguez" };

    list.push({
      id: "gap-1",
      dateStr: todayStr,
      timeStr: "11:00",
      workerId: w1.id,
      workerName: `${w1.firstName} ${w1.lastName}`,
      label: "Hoy, 11:00 hs"
    });

    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    list.push({
      id: "gap-2",
      dateStr: tomorrowStr,
      timeStr: "15:30",
      workerId: w2.id,
      workerName: `${w2.firstName} ${w2.lastName}`,
      label: "Mañana, 15:30 hs"
    });

    return list;
  }, [workers]);

  // Coincidencias de Aura AI
  const auraSuggestion = useMemo(() => {
    const waitingClient = waitlist.find(c => c.status === "Esperando");
    const activeGap = gaps[0];

    if (waitingClient && activeGap) {
      const svc = services.find(s => s.id === waitingClient.serviceId) || { name: waitingClient.service || "Estética" };
      return {
        client: waitingClient,
        gap: activeGap,
        serviceName: svc.name,
        message: `✨ Aura AI: Hay un hueco libre hoy a las 11:00 hs con ${activeGap.workerName} ideal para ${waitingClient.firstName} ${waitingClient.lastName} (${svc.name}).`
      };
    }
    return null;
  }, [waitlist, gaps, services]);

  // Manejadores Lista
  const handleAddToWaitlist = (e) => {
    e.preventDefault();
    if (!newWait.firstName || !newWait.lastName) return;

    const newItem = {
      ...newWait,
      id: Date.now(),
      status: "Esperando"
    };

    setWaitlist(prev => [...prev, newItem]);
    setNewWait({
      firstName: "",
      lastName: "",
      phone: "",
      serviceId: "",
      workerId: "",
      preferenceDate: "",
      preferenceTime: "",
      priority: "Alta",
    });
  };

  const handleMarkContacted = (id) => {
    setWaitlist(prev => 
      prev.map(c => c.id === id ? { ...c, status: "Contactado" } : c)
    );
  };

  const handleRemoveFromWaitlist = (id) => {
    setWaitlist(prev => prev.filter(c => c.id !== id));
  };

  // Reservar turno desde la lista
  const handleBookWaitlist = (client, dateStr, timeStr, workerId) => {
    const targetDate = dateStr || client.preferenceDate || new Date().toISOString().slice(0, 10);
    const targetTime = timeStr || client.preferenceTime || "11:00";
    const targetWorker = workerId || client.workerId || (workers[0]?.id || "");

    const startsAt = `${targetDate}T${targetTime}`;

    setInitialAddData({
      clientFirstName: client.firstName || "",
      clientLastName: client.lastName || "",
      phone: client.phone || "",
      serviceId: client.serviceId || "",
      workerId: targetWorker,
      startsAt: startsAt
    });
    setShowAddModal(true);
  };

  const handleModalSaved = () => {
    setShowAddModal(false);
    fetchAppointments();
    
    // Si había una sugerencia, marcar ese cliente como Reagendado o asignado
    if (auraSuggestion) {
      setWaitlist(prev => 
        prev.map(c => c.id === auraSuggestion.client.id ? { ...c, status: "Reagendado" } : c)
      );
    }
  };

  // Enviar mensaje de WhatsApp
  const handleSendWhatsAppNotification = (client, gap) => {
    const svc = services.find(s => s.id === client.serviceId) || { name: client.service || "Estética" };
    const dateStr = gap 
      ? new Date(gap.dateStr).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
      : (client.preferenceDate ? new Date(`${client.preferenceDate}T12:00:00`).toLocaleDateString("es-AR") : "el día de tu preferencia");
    
    const timeStr = gap ? gap.timeStr : (client.preferenceTime || "");
    const workerName = gap ? gap.workerName : (workers.find(w => w.id === client.workerId)?.firstName || "Profesional");

    const text = `¡Hola ${client.firstName}! Se liberó un turno ideal en Aura Studio para realizarte ${svc.name} el ${dateStr} a las ${timeStr} hs con ${workerName}. ¿Te gustaría reservarlo?`;
    window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(text)}`, "_blank");

    setWaitlist(prev => 
      prev.map(c => c.id === client.id ? { ...c, status: "Contactado" } : c)
    );
  };

  // Enviar correo de notificación
  const handleSendEmailNotification = (client, gap) => {
    alert(`Notificación enviada por correo electrónico a ${client.firstName} ${client.lastName}.`);
    setWaitlist(prev => 
      prev.map(c => c.id === client.id ? { ...c, status: "Contactado" } : c)
    );
  };

  // Clases y colores
  const getPriorityColor = (priority) => {
    if (priority === "Alta") return "danger";
    if (priority === "Media") return "warning";
    return "primary";
  };

  const getStatusBadge = (status) => {
    if (status === "Esperando") return "warning-soft text-warning border-warning";
    if (status === "Contactado") return "success-soft text-success border-success";
    if (status === "Reagendado") return "primary-soft text-primary border-primary";
    return "secondary-soft text-muted border-secondary";
  };

  return (
    <Container fluid className="p-0 pb-4">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3">{t("calendar.title")}</h1>
          <p className="text-muted mb-0">{t("calendar.subtitle")}</p>
        </div>

        <div className="d-flex align-items-center gap-3">
          <Button
            variant="dark"
            className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold btn-premium shadow-sm"
            onClick={() => {
              setInitialAddData(null);
              setShowAddModal(true);
            }}
          >
            <Plus size={16} />
            <span>{t("calendar.newAppointment") || "Nueva Cita"}</span>
          </Button>

          {business?.googleCalendarId && business?.googleRefreshToken && (
            <div className="d-flex bg-light p-1 rounded-3">
              <Button
                size="sm"
                variant={!showEmbeddedGoogle ? "white" : "link"}
                className={`rounded-2 px-3 py-1.5 text-dark small ${!showEmbeddedGoogle ? "shadow-sm border fw-bold bg-white" : "text-muted border-0"}`}
                onClick={() => setShowEmbeddedGoogle(false)}
                style={{ fontSize: "12px" }}
              >
                Calendario Local (Sincronizado)
              </Button>
              <Button
                size="sm"
                variant={showEmbeddedGoogle ? "white" : "link"}
                className={`rounded-2 px-3 py-1.5 text-dark small ${showEmbeddedGoogle ? "shadow-sm border fw-bold bg-white" : "text-muted border-0"}`}
                onClick={() => setShowEmbeddedGoogle(true)}
                style={{ fontSize: "12px" }}
              >
                Google Calendar (Embebido)
              </Button>
            </div>
          )}
        </div>
      </header>

      <Row className="g-4">
        {/* Calendario central */}
        <Col lg={8}>
          <div className="card-premium p-0 overflow-hidden shadow-sm" style={{ minHeight: "calc(100vh - 200px)" }}>
            {showEmbeddedGoogle && business?.googleCalendarId ? (
              <div className="w-100 h-100" style={{ minHeight: "calc(100vh - 200px)" }}>
                <iframe 
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(business.googleCalendarId)}&ctz=America%2FArgentina%2FBuenos_Aires`}
                  style={{ border: 0, width: "100%", height: "calc(100vh - 200px)", minHeight: "560px" }}
                  frameBorder="0" 
                  scrolling="no"
                  title="Google Calendar Embebido"
                />
              </div>
            ) : (
              <AppointmentsCalendar />
            )}
          </div>
        </Col>

        {/* Panel lateral Operativo y de Lista de Espera */}
        <Col lg={4}>
          <div className="d-grid gap-4">
            
            {/* AURA AI SUGGESTER BLOCK */}
            {auraSuggestion && (
              <Card 
                className="border-0 shadow-premium overflow-hidden animate-fade-in"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  borderRadius: "20px"
                }}
              >
                <Card.Body className="p-4 text-white">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Sparkles size={20} className="animate-pulse" />
                    <strong className="h6 fw-black m-0" style={{ letterSpacing: "-0.01em" }}>Aura Copilot AI</strong>
                  </div>
                  <p className="small mb-3" style={{ opacity: 0.95, lineHeight: "1.4" }}>
                    {auraSuggestion.message}
                  </p>
                  <div className="d-flex gap-2">
                    <Button 
                      size="sm" 
                      variant="light" 
                      className="rounded-pill px-3 py-1.5 fw-bold text-success"
                      onClick={() => handleBookWaitlist(auraSuggestion.client, auraSuggestion.gap.dateStr, auraSuggestion.gap.timeStr, auraSuggestion.gap.workerId)}
                    >
                      Asignar Turno
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-light" 
                      className="rounded-pill px-3 py-1.5 fw-bold border-white"
                      onClick={() => handleSendWhatsAppNotification(auraSuggestion.client, auraSuggestion.gap)}
                    >
                      Notificar WhatsApp
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* LISTA DE ESPERA PRINCIPAL */}
            <Card className="card-premium border-0 shadow-sm rounded-4 bg-white">
              <Card.Body className="p-4">
                <h3 className="h6 fw-black text-dark mb-3 d-flex align-items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <span>Lista de Espera Inteligente</span>
                </h3>

                {/* Formulario registro */}
                <Form onSubmit={handleAddToWaitlist} className="d-grid gap-2 mb-4 bg-light p-3 rounded-4 border">
                  <div className="smaller text-muted fw-bold mb-1">Registrar Cliente en Espera</div>
                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Control
                        placeholder="Nombre *"
                        value={newWait.firstName}
                        onChange={(e) => setNewWait(prev => ({ ...prev, firstName: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                        required
                      />
                    </Col>
                    <Col xs={6}>
                      <Form.Control
                        placeholder="Apellido *"
                        value={newWait.lastName}
                        onChange={(e) => setNewWait(prev => ({ ...prev, lastName: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                        required
                      />
                    </Col>
                  </Row>
                  
                  <Row className="g-2">
                    <Col xs={12}>
                      <Form.Control
                        placeholder="WhatsApp (Cels) *"
                        value={newWait.phone}
                        onChange={(e) => setNewWait(prev => ({ ...prev, phone: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                        required
                      />
                    </Col>
                  </Row>

                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Select
                        value={newWait.serviceId}
                        onChange={(e) => setNewWait(prev => ({ ...prev, serviceId: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                      >
                        <option value="">Servicio...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={6}>
                      <Form.Select
                        value={newWait.workerId}
                        onChange={(e) => setNewWait(prev => ({ ...prev, workerId: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                      >
                        <option value="">Estilista...</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.firstName}</option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Control
                        type="date"
                        value={newWait.preferenceDate}
                        onChange={(e) => setNewWait(prev => ({ ...prev, preferenceDate: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                      />
                    </Col>
                    <Col xs={6}>
                      <Form.Control
                        type="time"
                        value={newWait.preferenceTime}
                        onChange={(e) => setNewWait(prev => ({ ...prev, preferenceTime: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                      />
                    </Col>
                  </Row>

                  <Row className="g-2">
                    <Col xs={12}>
                      <Form.Select
                        value={newWait.priority}
                        onChange={(e) => setNewWait(prev => ({ ...prev, priority: e.target.value }))}
                        className="modern-input px-2 py-1.5"
                        style={{ fontSize: "12px" }}
                      >
                        <option value="Alta">Prioridad Alta</option>
                        <option value="Media">Prioridad Media</option>
                        <option value="Baja">Prioridad Baja</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <Button type="submit" variant="dark" size="sm" className="w-100 rounded-pill btn-premium justify-content-center py-2 mt-1 small bg-dark">
                    <Plus size={14} />
                    <span>Agregar a la Lista</span>
                  </Button>
                </Form>

                {/* Listado tarjetas */}
                <div className="d-grid gap-3 overflow-auto" style={{ maxHeight: "380px", paddingRight: "4px" }}>
                  {waitlist.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      <AlertCircle size={24} className="mb-2 text-muted" />
                      <div>Lista de espera vacía.</div>
                    </div>
                  ) : (
                    waitlist.map(w => {
                      const svc = services.find(s => s.id === w.serviceId);
                      const stylist = workers.find(work => work.id === w.workerId);

                      return (
                        <div 
                          key={w.id} 
                          className="p-3 border rounded-4 bg-white shadow-premium-hover animate-fade-in position-relative"
                          style={{
                            borderLeft: `5px solid var(--bs-${getPriorityColor(w.priority)})`
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <strong className="text-dark small d-block" style={{ fontSize: "13.5px" }}>
                                {w.firstName} {w.lastName}
                              </strong>
                              <span className="text-muted smaller d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: "11px" }}>
                                <Phone size={10} /> {w.phone || "Sin celular"}
                              </span>
                            </div>
                            <div className="d-flex gap-1.5 align-items-center">
                              <Badge bg={getPriorityColor(w.priority)} className="rounded-pill smaller" style={{ fontSize: "9px" }}>
                                {w.priority}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline-danger" 
                                onClick={() => handleRemoveFromWaitlist(w.id)}
                                className="p-1 rounded-circle border-0 text-danger hover-bg-danger"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>

                          <div className="d-grid gap-1 mb-3 text-dark small" style={{ fontSize: "11.5px" }}>
                            <div>
                              <strong>Servicio:</strong> <span className="badge bg-light text-dark border">{svc?.name || w.service || "Cualquiera"}</span>
                            </div>
                            <div>
                              <strong>Preferencia:</strong> {stylist?.firstName || "Cualquier profesional"}
                              {(w.preferenceDate || w.preferenceTime) && (
                                <span className="text-muted"> (el {w.preferenceDate ? new Date(`${w.preferenceDate}T12:00:00`).toLocaleDateString("es-AR") : ""} {w.preferenceTime})</span>
                              )}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center border-top pt-2 flex-wrap gap-2">
                            <div>
                              <span className={`badge border ${getStatusBadge(w.status)}`} style={{ fontSize: "9.5px" }}>
                                {w.status}
                              </span>
                            </div>
                            
                            <div className="d-flex gap-1.5">
                              {w.status === "Esperando" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline-success" 
                                    onClick={() => handleSendWhatsAppNotification(w)}
                                    title="Notificar por WhatsApp"
                                    className="p-1.5 rounded-circle border"
                                  >
                                    <MessageCircle size={12} className="text-success" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="success" 
                                    onClick={() => handleBookWaitlist(w)}
                                    title="Agendar Turno Rápido"
                                    className="p-1.5 rounded-circle bg-success text-white border-0"
                                  >
                                    <Plus size={12} />
                                  </Button>
                                </>
                              )}
                              {w.status !== "Contactado" && w.status !== "Reagendado" && (
                                <Button 
                                  size="sm" 
                                  variant="outline-secondary" 
                                  onClick={() => handleMarkContacted(w.id)}
                                  title="Marcar Contactado"
                                  className="p-1.5 rounded-circle border"
                                >
                                  <Check size={12} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card.Body>
            </Card>

          </div>
        </Col>
      </Row>

      {/* AppointmentModal para agendar rápido */}
      <AppointmentModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        initialData={initialAddData}
        onSaved={handleModalSaved}
      />
    </Container>
  );
}
