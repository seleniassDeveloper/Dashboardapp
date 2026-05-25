import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Container, Card, Button, Form, Spinner, Alert, Row, Col } from "react-bootstrap";
import { Calendar, User, Clock, CheckCircle2, Search, Plus, UserPlus, Sparkles, Home } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function QuickAddBookingPage() {
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkToken = searchParams.get("token") || searchParams.get("key");

  // Estados de carga y catálogos
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Búsqueda de clientes
  const [clientSearch, setClientSearch] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);

  // Formulario de Reserva
  const [formData, setFormData] = useState({
    clientId: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    serviceId: "",
    professionalId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    notes: "",
  });

  // Slots disponibles
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos del backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (linkToken) {
          api.defaults.headers.common["Authorization"] = `Bearer ${linkToken}`;
        }

        const bizRes = await api.get(`/public/business/${businessSlug}`);
        setBusiness(bizRes.data);

        const [servicesRes, professionalsRes, clientsRes] = await Promise.all([
          api.get(`/public/business/${businessSlug}/services`),
          api.get(`/public/business/${businessSlug}/professionals`),
          api.get("/clients"),
        ]);

        setServices(servicesRes.data);
        setProfessionals(professionalsRes.data);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      } catch (e) {
        console.error(e);
        setError("Error al conectar con la base de datos de la empresa.");
      } finally {
        setLoading(false);
      }
    };

    if (businessSlug) {
      loadData();
    }
  }, [businessSlug]);

  // Cargar disponibilidad horaria
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.serviceId || !formData.professionalId || !formData.date) {
        setSlots([]);
        return;
      }
      try {
        setLoadingSlots(true);
        setSlots([]);
        const res = await api.get(`/public/business/${businessSlug}/availability`, {
          params: {
            serviceId: formData.serviceId,
            professionalId: formData.professionalId,
            date: formData.date,
          },
        });
        setSlots(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.serviceId, formData.professionalId, formData.date, businessSlug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Autoselección de cliente existente
  const handleSelectClient = (client) => {
    setFormData((prev) => ({
      ...prev,
      clientId: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone || "",
      email: client.email || "",
    }));
    setClientSearch(`${client.firstName} ${client.lastName}`);
  };

  const handleToggleNewClient = (isNew) => {
    setIsNewClient(isNew);
    setFormData((prev) => ({
      ...prev,
      clientId: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    }));
    setClientSearch("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.serviceId || !formData.professionalId || !formData.date || !formData.time) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        serviceId: formData.serviceId,
        professionalId: formData.professionalId,
        date: formData.date,
        time: formData.time,
        notes: formData.notes || "Agendado rápidamente desde Link Administrativo.",
      };

      const res = await api.post(`/public/business/${businessSlug}/bookings`, payload);

      setSuccess("¡Cita agendada y guardada correctamente en la base de datos!");
      // Limpiar formulario excepto catálogos
      setFormData({
        clientId: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        serviceId: "",
        professionalId: "",
        date: new Date().toISOString().slice(0, 10),
        time: "",
        notes: "",
      });
      setClientSearch("");
      setIsNewClient(false);
      
      // Auto ocultar mensaje de éxito
      setTimeout(() => setSuccess(""), 5000);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Error al registrar la cita en la base de datos.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <Spinner animation="border" className="text-primary mb-3" />
        <p className="text-muted small">Conectando a la base de datos de la empresa…</p>
      </div>
    );
  }

  const filteredClients = clients.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.phone || ""}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedServiceObj = services.find((s) => s.id === formData.serviceId);
  const selectedWorkerObj = professionals.find((w) => w.id === formData.professionalId);

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }} className="py-4">
      <Container style={{ maxWidth: "640px" }}>
        
        {/* Encabezado Administrativo */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="light" size="sm" onClick={() => navigate("/app")} className="d-flex align-items-center gap-1.5 rounded-pill border">
            <Home size={14} />
            <span>Dashboard</span>
          </Button>
          <span className="badge bg-dark text-white rounded-pill px-3 py-1.5 small fw-bold">Acceso Administrativo</span>
        </div>

        <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="p-4 text-white text-center" style={{ background: business?.bookingPrimaryColor || "#111827" }}>
            <Sparkles size={32} className="mb-2" />
            <h1 className="fw-black h4 mb-1">Agendador Rápido de Citas</h1>
            <p className="small mb-0 text-white-50">Crea turnos al instante conectados a tu base de datos</p>
          </div>

          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit} className="d-grid gap-4">
              
              {/* SECCIÓN 1: Selección de Cliente */}
              <div>
                <div className="form-section-title">1. Información del Cliente</div>
                
                <div className="d-flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={!isNewClient ? "dark" : "outline-dark"}
                    onClick={() => handleToggleNewClient(false)}
                    className="rounded-pill flex-fill d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <Search size={14} />
                    <span>Buscar Existente</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={isNewClient ? "dark" : "outline-dark"}
                    onClick={() => handleToggleNewClient(true)}
                    className="rounded-pill flex-fill d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <UserPlus size={14} />
                    <span>Crear Nuevo</span>
                  </Button>
                </div>

                {!isNewClient ? (
                  <div className="position-relative">
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-semibold small">Buscar Cliente</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Escribí nombre o teléfono del cliente..."
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          if (formData.clientId) {
                            setFormData(prev => ({ ...prev, clientId: "", firstName: "", lastName: "", phone: "", email: "" }));
                          }
                        }}
                      />
                    </Form.Group>

                    {clientSearch.trim() !== "" && !formData.clientId && (
                      <div className="client-autocomplete-dropdown">
                        {filteredClients.length === 0 ? (
                          <div className="p-3 text-muted small text-center">No se encontraron clientes coincidentes.</div>
                        ) : (
                          filteredClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectClient(c)}
                              className="suggestion-item"
                            >
                              <div className="fw-bold small text-dark">{c.firstName} {c.lastName}</div>
                              <div className="text-muted smaller">{c.phone || "Sin teléfono"} | {c.email || "Sin email"}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="d-grid gap-2 p-3 bg-light rounded-3">
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Nombre *</Form.Label>
                          <Form.Control
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Ej: Laura"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Apellido *</Form.Label>
                          <Form.Control
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Ej: Pérez"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">WhatsApp / Tel *</Form.Label>
                          <Form.Control
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Ej: 1123456789"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Email (Opcional)</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="correo@ejemplo.com"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {formData.clientId && (
                  <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-20 rounded-3 small text-success fw-bold d-flex align-items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Cliente Seleccionado: {formData.firstName} {formData.lastName} ({formData.phone || "Sin tel"})</span>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: Detalles del Servicio y Profesional */}
              <div>
                <div className="form-section-title">2. Servicio & Profesional</div>
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Servicio *</Form.Label>
                      <Form.Select
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, serviceId: e.target.value, time: "" }));
                        }}
                        required
                      >
                        <option value="">-- Seleccionar --</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({currency(s.price)})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Profesional *</Form.Label>
                      <Form.Select
                        name="professionalId"
                        value={formData.professionalId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, professionalId: e.target.value, time: "" }));
                        }}
                        required
                      >
                        <option value="">-- Seleccionar --</option>
                        {professionals
                          .filter((p) => !formData.serviceId || p.serviceIds.includes(formData.serviceId))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* SECCIÓN 3: Fecha y Horas Disponibles */}
              <div>
                <div className="form-section-title">3. Fecha & Horarios Disponibles</div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Fecha del turno</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, date: e.target.value, time: "" }));
                        }}
                        min={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Slots Disponibles</Form.Label>
                      
                      {!formData.serviceId || !formData.professionalId ? (
                        <div className="text-muted smaller py-2">Elegí servicio y profesional primero.</div>
                      ) : loadingSlots ? (
                        <div className="d-flex align-items-center gap-2 text-muted smaller py-2">
                          <Spinner size="sm" />
                          <span>Calculando disponibilidad…</span>
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="text-danger smaller py-2 fw-semibold">
                          Sin turnos disponibles. Probá otra fecha.
                        </div>
                      ) : (
                        <div
                          className="d-flex gap-1.5 flex-wrap mt-1 overflow-auto"
                          style={{ maxHeight: "120px" }}
                        >
                          {slots.map((t) => (
                            <Button
                              key={t}
                              size="sm"
                              variant={formData.time === t ? "dark" : "outline-dark"}
                              onClick={() => setFormData(prev => ({ ...prev, time: t }))}
                              style={{
                                borderRadius: "6px",
                                fontSize: "11px",
                                borderColor: formData.time === t ? "black" : "#e5e7eb",
                              }}
                            >
                              {t}
                            </Button>
                          ))}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* SECCIÓN 4: Notas */}
              <Form.Group>
                <Form.Label className="fw-semibold small">Notas (Opcional)</Form.Label>
                <Form.Control
                  name="notes"
                  as="textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Instrucciones del estilista, preferencias, etc..."
                />
              </Form.Group>

              {/* Resumen */}
              {selectedServiceObj && selectedWorkerObj && formData.date && formData.time && (
                <div className="p-3 bg-light rounded-3 small">
                  <div className="fw-bold mb-1">Resumen del Turno:</div>
                  <div className="text-muted">
                    Servicio: <strong>{selectedServiceObj.name}</strong> ({currency(selectedServiceObj.price)})<br />
                    Profesional: <strong>{selectedWorkerObj.name}</strong><br />
                    Fecha/Hora: <strong className="text-dark">{formData.date} a las {formData.time} hs</strong>
                  </div>
                </div>
              )}

              {/* Botón de Envío */}
              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <Button
                  type="submit"
                  variant="dark"
                  disabled={submitting}
                  className="rounded-pill px-4 btn-premium w-100 justify-content-center"
                  style={{
                    background: business?.bookingPrimaryColor || "#111827",
                    borderColor: business?.bookingPrimaryColor || "#111827",
                  }}
                >
                  {submitting ? "Guardando cita..." : "Agendar Cita en la Base de Datos"}
                </Button>
              </div>

            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
