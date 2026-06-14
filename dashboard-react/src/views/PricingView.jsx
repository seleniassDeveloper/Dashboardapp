import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Alert } from "react-bootstrap";
import { Check, ShieldCheck, ArrowRight, Sparkles, LogOut, Info } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import api from "../lib/api.js";

export default function PricingView({ blocked = false, subscriptionStatus = "" }) {
  const { logout, user } = useAuth();
  const [billingCycle, setBillingCycle] = useState("month"); // 'month' | 'year'
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const plans = [
    {
      code: "starter",
      name: "Starter",
      description: "Ideal para profesionales independientes y salones pequeños.",
      priceMonth: 19,
      priceYear: 190,
      features: [
        "Agenda y Calendario Premium",
        "Ficha del Cliente & CRM básico",
        "Gestión de Servicios y Categorías",
        "Hasta 3 profesionales / usuarios",
        "1 Sucursal física",
        "Soporte por email"
      ],
      popular: false,
      color: "#6366f1"
    },
    {
      code: "pro",
      name: "Pro",
      description: "Perfecto para salones en crecimiento y clínicas estéticas.",
      priceMonth: 49,
      priceYear: 490,
      features: [
        "Todo lo de Starter",
        "Módulo de Finanzas Completo (Gastos, Nóminas)",
        "Control de Inventario y Stock (ERP básico)",
        "Flujos de Trabajo (Workflows)",
        "Hasta 10 profesionales / usuarios",
        "Hasta 3 sucursales físicas",
        "Soporte prioritario"
      ],
      popular: true,
      color: "#7c3aed"
    },
    {
      code: "business",
      name: "Business",
      description: "El poder total de la IA y marketing automatizado.",
      priceMonth: 99,
      priceYear: 990,
      features: [
        "Todo lo de Pro",
        "Automatizaciones con IA y recordatorios avanzados",
        "Generador de Marketing para Instagram",
        "Profesionales ilimitados",
        "Sucursales ilimitadas",
        "Integración con Google Sheets Sync",
        "Soporte dedicado 24/7"
      ],
      popular: false,
      color: "#ec4899"
    }
  ];

  const handleSelectPlan = async (planCode) => {
    setLoadingPlan(planCode);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/billing/checkout", {
        planCode,
        interval: billingCycle
      });

      if (res.data?.success) {
        if (res.data.isRequest) {
          setSuccess(res.data.message);
        } else if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          throw new Error("No se recibió la URL de pago.");
        }
      } else {
        throw new Error("Error desconocido al procesar el plan.");
      }
    } catch (err) {
      console.error("Error setting up payment checkout:", err);
      setError(
        err.response?.data?.error || 
        err.message || 
        "Hubo un problema al iniciar la pasarela de pago. Intenta de nuevo."
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div 
      className="d-flex flex-column min-vh-100"
      style={{
        background: "radial-gradient(circle at 50% 50%, #fdfcff 0%, #f4ecff 100%)",
        fontFamily: "'Outfit', sans-serif",
        padding: "40px 15px"
      }}
    >
      <Container className="my-auto">
        {/* Blocker alert if user account is past_due or suspended */}
        {blocked && (
          <Row className="justify-content-center mb-5">
            <Col lg={8}>
              <Alert variant="danger" className="border-0 shadow rounded-4 p-4 text-center">
                <div className="d-inline-flex p-3 bg-danger bg-opacity-10 text-danger rounded-circle mb-3">
                  <Info size={32} />
                </div>
                <h3 className="fw-black h4 text-dark mb-2">Cuenta Suspendida / Suscripción requerida</h3>
                <p className="text-secondary small mb-4">
                  El período de prueba o suscripción de tu salón ha expirado (Estado: <strong className="text-danger">{subscriptionStatus}</strong>). 
                  Para reactivar el acceso y continuar utilizando las funciones del dashboard, selecciona uno de nuestros planes a continuación.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={logout}
                    className="rounded-pill px-4 py-2 small fw-bold d-flex align-items-center gap-2"
                  >
                    <LogOut size={16} />
                    Cerrar sesión activa
                  </Button>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Heading */}
        <div className="text-center mb-5">
          <h1 className="fw-black text-dark tracking-tight mb-2 h2">Planes flexibles para tu negocio</h1>
          <p className="text-muted small max-w-500 mx-auto mb-4">
            Elige el plan ideal según el tamaño de tu equipo y las herramientas que necesites. Cancela en cualquier momento.
          </p>

          {/* Toggle Cycle */}
          <div className="d-inline-flex align-items-center bg-white p-1.5 rounded-pill shadow-sm border mb-2">
            <button
              onClick={() => setBillingCycle("month")}
              className={`btn px-4 py-1.5 rounded-pill fw-bold Transition-all ${billingCycle === "month" ? "bg-purple-600 text-white shadow-sm" : "text-muted bg-transparent border-0"}`}
              style={billingCycle === "month" ? { backgroundColor: "#7c3aed", border: 0 } : { fontSize: "13px" }}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle("year")}
              className={`btn px-4 py-1.5 rounded-pill fw-bold Transition-all ${billingCycle === "year" ? "bg-purple-600 text-white shadow-sm" : "text-muted bg-transparent border-0"}`}
              style={billingCycle === "year" ? { backgroundColor: "#7c3aed", border: 0 } : { fontSize: "13px" }}
            >
              Anual <span className="badge bg-success bg-opacity-20 text-success ms-1 small" style={{ fontSize: "10px" }}>Ahorra 20%</span>
            </button>
          </div>
        </div>

        {error && (
          <Row className="justify-content-center mb-4">
            <Col lg={8}>
              <Alert variant="danger" className="border-0 shadow-sm rounded-3 py-2.5 px-3 small">
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {success && (
          <Row className="justify-content-center mb-4">
            <Col lg={8}>
              <Alert variant="success" className="border-0 shadow-sm rounded-3 py-2.5 px-3 small fw-semibold text-center">
                <Sparkles size={16} className="me-2" />
                {success}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Cards */}
        <Row className="g-4 justify-content-center align-items-stretch">
          {plans.map((p) => {
            const price = billingCycle === "month" ? p.priceMonth : p.priceYear;
            const isLoading = loadingPlan === p.code;

            return (
              <Col key={p.code} md={6} lg={4}>
                <Card 
                  className={`border-0 h-100 shadow rounded-4 position-relative overflow-hidden transition-all hover-translate-y`}
                  style={{
                    border: p.popular ? "2px solid #7c3aed" : "1px solid rgba(0, 0, 0, 0.05)",
                    background: "#fff"
                  }}
                >
                  {p.popular && (
                    <span 
                      className="position-absolute px-4 py-1 text-white fw-bold text-uppercase"
                      style={{
                        backgroundColor: "#7c3aed",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        top: "16px",
                        right: "-32px",
                        transform: "rotate(45deg)",
                        width: "140px",
                        textAlign: "center"
                      }}
                    >
                      Popular
                    </span>
                  )}

                  <Card.Body className="p-4.5 d-flex flex-column">
                    <div className="mb-4">
                      <h3 className="fw-black h5 text-dark mb-1">{p.name}</h3>
                      <p className="text-muted small mb-3.5" style={{ minHeight: "40px" }}>{p.description}</p>
                      
                      <div className="d-flex align-items-baseline mb-2">
                        <span className="h1 fw-black text-dark mb-0">${price}</span>
                        <span className="text-muted ms-1.5 small">/ {billingCycle === "month" ? "mes" : "año"}</span>
                      </div>
                      <span className="text-muted smaller bg-light px-2.5 py-1 rounded-pill" style={{ fontSize: "10.5px" }}>
                        Equivale a ${(price / (billingCycle === "month" ? 1 : 12)).toFixed(1)} / mes
                      </span>
                    </div>

                    <hr className="my-4 border-opacity-10" />

                    <div className="mb-5 flex-grow-1">
                      <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                        {p.features.map((f, idx) => (
                          <li key={idx} className="d-flex align-items-start gap-2.5 small text-secondary">
                            <Check size={16} className="text-success mt-0.5 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      variant={p.popular ? "purple" : "outline-purple"}
                      disabled={isLoading}
                      onClick={() => handleSelectPlan(p.code)}
                      className="w-100 rounded-pill py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 border-purple-opacity shadow-sm"
                      style={p.popular ? { backgroundColor: "#7c3aed", color: "#fff", border: 0 } : { fontSize: "13px" }}
                    >
                      {isLoading ? "Cargando..." : (blocked ? "Reactivar Cuenta" : "Empezar Plan")}
                      <ArrowRight size={15} />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        <div className="text-center mt-5 text-muted small d-flex align-items-center justify-content-center gap-2">
          <ShieldCheck size={16} className="text-success" />
          <span>Pagos protegidos de forma segura por MercadoPago.</span>
        </div>
      </Container>
    </div>
  );
}
