import React, { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col, Spinner, Alert, InputGroup } from "react-bootstrap";
import { Link2, Copy, Check, Sparkles, Globe } from "lucide-react";
import api from "../../lib/api.js";

export default function BookingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const [business, setBusiness] = useState({
    name: "",
    slug: "mi-negocio",
    logo: "",
    description: "",
    bookingEnabled: true,
    bookingPrimaryColor: "#10b981",
    bookingConfirmationMessage: "¡Tu reserva ha sido confirmada con éxito!",
  });

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/appointments/business");
      if (res.data) {
        setBusiness({
          name: res.data.name || "",
          slug: res.data.slug || "mi-negocio",
          logo: res.data.logo || "",
          description: res.data.description || "",
          bookingEnabled: res.data.bookingEnabled !== false,
          bookingPrimaryColor: res.data.bookingPrimaryColor || "#10b981",
          bookingConfirmationMessage: res.data.bookingConfirmationMessage || "¡Tu reserva ha sido confirmada con éxito!",
        });
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la configuración de reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBusiness((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const slugClean = business.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
      const res = await api.put("/appointments/business", {
        ...business,
        slug: slugClean,
      });

      setBusiness(res.data);
      setSuccess("Configuración de reservas guardada correctamente.");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const bookingUrl = `${window.location.origin}/booking/${business.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card className="card-premium border-0 shadow-sm mt-3">
        <Card.Body className="p-5 text-center">
          <Spinner animation="border" className="text-primary mb-2" />
          <p className="text-muted small mb-0">Cargando ajustes de reserva…</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm mt-3">
      <Card.Body className="p-4">
        <div className="mb-4">
          <h2 className="h5 fw-bold mb-1">Configuración de Reservas Online</h2>
          <p className="text-muted small mb-0">
            Habilitá el agendamiento online público para tus clientes y personalizá las condiciones de reserva.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSave} className="custom-form d-grid gap-4">
          
          {/* Activar/Desactivar */}
          <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
            <div>
              <h3 className="h6 fw-bold mb-1">Habilitar Link de Agendamiento Público</h3>
              <p className="text-muted small mb-0">
                Si está desactivado, tus clientes no podrán reservar citas de forma autónoma.
              </p>
            </div>
            <Form.Check
              type="switch"
              id="bookingEnabled"
              name="bookingEnabled"
              checked={business.bookingEnabled}
              onChange={handleChange}
              style={{ cursor: "pointer", width: "40px" }}
              aria-label="Toggle Booking Online"
            />
          </div>

          {business.bookingEnabled && (
            <>
              {/* Copiar Link */}
              <div className="p-3 border rounded-3 bg-light">
                <Form.Label className="fw-semibold small d-flex align-items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  <span>Tu Link Público de Citas</span>
                </Form.Label>
                <InputGroup className="mb-2">
                  <Form.Control
                    readOnly
                    value={bookingUrl}
                    style={{ background: "#fff", fontSize: "13px" }}
                  />
                  <Button variant="outline-dark" onClick={copyToClipboard}>
                    {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted small">
                  Compartí este enlace en tus redes sociales (Instagram, WhatsApp) para que comiencen a agendar turnos.
                </Form.Text>
              </div>

              {/* Ajustes Generales */}
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Nombre del Negocio (Booking)</Form.Label>
                    <Form.Control
                      name="name"
                      value={business.name}
                      onChange={handleChange}
                      placeholder="Ej: Aura Studio"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Slug de URL Pública</Form.Label>
                    <InputGroup>
                      <InputGroup.Text style={{ fontSize: "12px" }}>/booking/</InputGroup.Text>
                      <Form.Control
                        name="slug"
                        value={business.slug}
                        onChange={handleChange}
                        placeholder="mi-estudio"
                        required
                      />
                    </InputGroup>
                    <Form.Text className="text-muted small">Solo letras, números y guiones.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group>
                <Form.Label className="fw-semibold small">Descripción o Mensaje de Bienvenida</Form.Label>
                <Form.Control
                  name="description"
                  as="textarea"
                  rows={2}
                  value={business.description}
                  onChange={handleChange}
                  placeholder="Ej: Bienvenidos a Aura Studio. Reservá tu turno seleccionando el profesional y la hora de tu preferencia."
                />
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Color Primario del Booking</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        name="bookingPrimaryColor"
                        type="color"
                        value={business.bookingPrimaryColor}
                        onChange={handleChange}
                        style={{ width: "60px", height: "38px", padding: "2px", cursor: "pointer" }}
                      />
                      <Form.Control
                        name="bookingPrimaryColor"
                        type="text"
                        value={business.bookingPrimaryColor}
                        onChange={handleChange}
                        style={{ width: "120px" }}
                        placeholder="#10b981"
                      />
                    </div>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Mensaje de Éxito al Confirmar</Form.Label>
                    <Form.Control
                      name="bookingConfirmationMessage"
                      value={business.bookingConfirmationMessage}
                      onChange={handleChange}
                      placeholder="¡Tu reserva ha sido confirmada con éxito!"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <Button
              type="submit"
              variant="dark"
              disabled={saving}
              className="rounded-pill px-4 btn-premium"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>

        </Form>
      </Card.Body>
    </Card>
  );
}
