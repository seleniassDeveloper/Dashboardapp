import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { Scissors, Briefcase, Plus, Heart, Sparkles, Layout, Globe, Image } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";

const RUBROS = [
  { id: "Estética", label: "Estética y Bienestar", icon: Heart },
  { id: "Barbería", label: "Barbería y Peluquería", icon: Scissors },
  { id: "Clínica", label: "Clínica o Consultorio", icon: Plus },
  { id: "Gimnasio", label: "Gimnasio o Fitness", icon: Sparkles },
  { id: "Otro", label: "Otro Rubro de Servicios", icon: Layout }
];

export default function OnboardingView() {
  const { switchBusiness } = useAuth();
  
  const [name, setName] = useState("");
  const [rubro, setRubro] = useState("Estética");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generación de slug dinámico en tiempo real
  useEffect(() => {
    const generated = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remover acentos
      .replace(/[^a-z0-9\s-]/g, "") // remover caracteres especiales
      .trim()
      .replace(/\s+/g, "-"); // reemplazar espacios por guiones
    setSlug(generated);
  }, [name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/businesses", {
        name,
        rubro,
        slug,
        logo: logo || null
      });

      if (res.data?.success) {
        const newBizId = res.data.business.id;
        // Cambiar al negocio recién creado para entrar al Dashboard
        await switchBusiness(newBizId);
        window.location.reload(); // Recargar para sincronizar contextos de marca y staff
      }
    } catch (err) {
      console.error("Error al registrar el negocio en onboarding:", err);
      setError(
        err.response?.data?.error || "Ocurrió un error al configurar tu negocio. El slug podría estar en uso."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        background: "radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.08) 0%, rgba(255, 255, 255, 0) 90%), linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)"
      }}
    >
      <Container style={{ maxWidth: "680px" }}>
        <Card 
          className="border-0 shadow-lg position-relative overflow-hidden p-4 p-md-5 rounded-4"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 255, 255, 0.3)"
          }}
        >
          {/* Glow effect */}
          <div 
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(30px)",
              pointerEvents: "none"
            }}
          />

          <div className="text-center mb-5">
            <span 
              className="badge bg-primary-soft text-primary px-3 py-2 rounded-pill fw-bold mb-3 border border-primary border-opacity-10"
              style={{ backgroundColor: "rgba(124, 58, 237, 0.12)", color: "#7c3aed" }}
            >
              🚀 Configuración Inicial
            </span>
            <h1 className="fw-black h2 text-dark mb-2" style={{ letterSpacing: "-0.03em" }}>
              ¡Creá tu Negocio en Dashboard OS!
            </h1>
            <p className="text-secondary small max-w-500 mx-auto">
              Completá los detalles iniciales para activar tu espacio de trabajo premium multiempresa al instante.
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="rounded-3 shadow-sm mb-4">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              {/* Nombre */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small text-dark mb-2">Nombre del Negocio *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Ej: Aura Studio Estética"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="py-2.5 px-3 border border-opacity-25 rounded-3 bg-white"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
              </Col>

              {/* Rubro */}
              <Col md={12}>
                <Form.Label className="fw-semibold small text-dark mb-2">Rubro Comercial *</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {RUBROS.map((r) => {
                    const IconComp = r.icon;
                    const isSelected = rubro === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRubro(r.id)}
                        className="btn d-flex align-items-center gap-2 py-2 px-3 rounded-pill border transition-all"
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          background: isSelected ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "rgba(255,255,255,0.7)",
                          color: isSelected ? "#fff" : "var(--text-secondary)",
                          borderColor: isSelected ? "transparent" : "rgba(0,0,0,0.12)",
                          boxShadow: isSelected ? "0 4px 10px rgba(124, 58, 237, 0.2)" : "none"
                        }}
                      >
                        <IconComp size={16} />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </Col>

              {/* Slug dinámico */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small text-dark mb-2 d-flex align-items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Slug de Reservas Online *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="ej-aura-studio"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                    className="py-2.5 px-3 border border-opacity-25 rounded-3 bg-white"
                    style={{ fontSize: "14px", fontFamily: "monospace" }}
                  />
                  <Form.Text className="text-muted smaller block-text mt-1.5">
                    Tus clientes reservarán citas en: <code>/booking/{slug || "slug-negocio"}</code>
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* URL Logo */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small text-dark mb-2 d-flex align-items-center gap-2">
                    <Image size={16} className="text-primary" />
                    URL del Logo del Negocio (Opcional)
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://ejemplo.com/logo.png"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="py-2.5 px-3 border border-opacity-25 rounded-3 bg-white"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button
              type="submit"
              disabled={loading || !name}
              className="w-100 py-2.5 rounded-pill border-0 shadow-sm mt-5 fw-bold d-flex align-items-center justify-content-center gap-2"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                fontSize: "15px"
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Configurando tu espacio...</span>
                </>
              ) : (
                <>
                  <span>Crear mi Negocio</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </Form>
        </Card>
      </Container>
    </div>
  );
}
