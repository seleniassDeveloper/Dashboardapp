import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Spinner, Badge } from "react-bootstrap";
import { Check, ShieldCheck, ArrowRight, Sparkles, LogOut, Info } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider.jsx";
import api from "../lib/api.js";

function CustomPlanBuilder({ billingCycle, isEs, onSelectCustom }) {
  const [selectedModules, setSelectedModules] = useState({
    agenda: true,
    clients: true,
    services: true,
    finances: false,
    inventory: false,
    workflows: false,
    ai_marketing: false,
    sheets_sync: false,
  });

  const moduleCatalog = [
    {
      id: "agenda",
      name: isEs ? "Módulo Agenda & Citas (Plan Base)" : "Schedule & Appointments (Base Plan)",
      description: isEs ? "Calendario, agendamiento de turnos, ficha de clientes y métricas básicas de citas." : "Calendar, booking system, client records & basic appointment metrics.",
      price: 15,
      required: true,
      icon: "📅"
    },
    {
      id: "finances",
      name: isEs ? "Módulo de Finanzas Completo" : "Full Finance Module",
      description: isEs ? "Gastos operativos, nóminas de equipo, cierre de caja y conciliación bancaria." : "Operating expenses, team payroll, cash closing & bank reconciliation.",
      price: 15,
      required: false,
      icon: "💳"
    },
    {
      id: "inventory",
      name: isEs ? "Módulo de Inventario & Stock" : "Inventory & Stock Module",
      description: isEs ? "Control de insumos, gestión de lotes, órdenes de compra y proveedores." : "Supply control, batch management, purchase orders & supplier management.",
      price: 15,
      required: false,
      icon: "📦"
    },
    {
      id: "workflows",
      name: isEs ? "Módulo de Workflows & Automatizaciones" : "Workflows & Automations Module",
      description: isEs ? "Diseñador visual de automatizaciones para correos, recordatorios y alertas." : "Visual automation builder for emails, reminders & status alerts.",
      price: 15,
      required: false,
      icon: "⚡"
    },
    {
      id: "ai_marketing",
      name: isEs ? "Módulo de IA & Generador de Marketing" : "AI & Marketing Generator Module",
      description: isEs ? "Asistente inteligente con sugerencias y creador de contenidos para Instagram." : "AI smart assistant & Instagram content generator for your business.",
      price: 15,
      required: false,
      icon: "🪄"
    },
    {
      id: "sheets_sync",
      name: isEs ? "Sincronización en vivo Google Sheets" : "Live Google Sheets Sync",
      description: isEs ? "Exportación y sincronización en tiempo real de tus datos en hojas de cálculo." : "Real-time sync & auto-export of all operational data into spreadsheets.",
      price: 10,
      required: false,
      icon: "📊"
    }
  ];

  const monthlyTotal = moduleCatalog.reduce((sum, mod) => {
    return sum + (selectedModules[mod.id] ? mod.price : 0);
  }, 0);

  const annualTotal = Math.round(monthlyTotal * 12 * 0.8);
  const finalPrice = billingCycle === "month" ? monthlyTotal : annualTotal;

  const toggleModule = (id) => {
    if (id === "agenda") return;
    setSelectedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmCustom = () => {
    const activeModuleKeys = Object.keys(selectedModules).filter(k => selectedModules[k]);
    onSelectCustom({
      enabledModules: activeModuleKeys,
      monthlyPrice: monthlyTotal,
      finalPrice,
      billingCycle
    });
  };

  return (
    <Card className="border-0 shadow-lg rounded-5 p-4 mb-5 overflow-hidden" style={{ background: "#ffffff" }}>
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <span className="badge px-3 py-2 rounded-pill bg-purple-100 text-purple-700 fw-bold mb-2" style={{ backgroundColor: "#f3e8ff", color: "#7e22ce", fontSize: "11px" }}>
              ✨ {isEs ? "ARMA TU PLAN A LA MEDIDA" : "BUILD YOUR CUSTOM PLAN"}
            </span>
            <h2 className="h3 fw-black text-dark mb-1">
              {isEs ? "Selecciona solo los módulos que necesita tu empresa" : "Select only the modules your business needs"}
            </h2>
            <p className="text-muted small mb-0">
              {isEs ? "Paga únicamente por las herramientas que utilizas. Puedes agregar o quitar módulos en cualquier momento." : "Pay only for the tools you use. You can add or remove modules anytime."}
            </p>
          </div>
          <div className="bg-light p-3.5 rounded-4 text-center border" style={{ minWidth: "220px" }}>
            <span className="text-muted smaller d-block fw-bold text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              {isEs ? "Precio Total Calculado" : "Total Calculated Price"}
            </span>
            <div className="d-flex align-items-baseline justify-content-center my-1">
              <span className="h1 fw-black text-dark mb-0">${finalPrice}</span>
              <span className="text-muted ms-1 small">/ {billingCycle === "month" ? (isEs ? "mes" : "mo") : (isEs ? "año" : "yr")}</span>
            </div>
            {billingCycle === "year" && (
              <span className="badge bg-success bg-opacity-15 text-success rounded-pill px-2 py-1 smaller" style={{ fontSize: "10px" }}>
                {isEs ? "Ahorro anual aplicado (-20%)" : "Annual savings (-20%)"}
              </span>
            )}
          </div>
        </div>

        <Row className="g-3">
          {moduleCatalog.map((mod) => {
            const isChecked = selectedModules[mod.id];
            return (
              <Col key={mod.id} md={6}>
                <div 
                  onClick={() => toggleModule(mod.id)}
                  className={`p-3.5 rounded-4 border transition-all d-flex align-items-start gap-3 cursor-pointer`}
                  style={{
                    borderColor: isChecked ? "#c4b5fd" : "#f1f5f9",
                    backgroundColor: isChecked ? "#f5f3ff" : "#fff",
                    cursor: mod.required ? "default" : "pointer"
                  }}
                >
                  <Form.Check 
                    type="checkbox"
                    id={`mod-${mod.id}`}
                    checked={isChecked}
                    disabled={mod.required}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                        <span>{mod.icon}</span> {mod.name}
                      </span>
                      <span className="badge bg-white text-purple-700 border border-purple-200 rounded-pill small fw-bold px-2 py-1" style={{ color: "#7e22ce" }}>
                        +${mod.price}/mes
                      </span>
                    </div>
                    <p className="text-muted smaller mb-0" style={{ fontSize: "11.5px", lineHeight: "1.4" }}>
                      {mod.description}
                    </p>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>

        <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="text-muted smaller">
            🔒 {isEs ? "Sin permanencia mínima. Modifica tu suscripción desde Configuración cuando quieras." : "No lock-in contract. Modify your subscription in Settings anytime."}
          </div>
          <Button 
            onClick={handleConfirmCustom}
            className="rounded-pill px-4 py-2.5 fw-bold shadow-sm d-flex align-items-center gap-2"
            style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed", color: "#fff" }}
          >
            <Sparkles size={16} />
            {isEs ? `Contratar Mi Plan a la Medida ($${finalPrice})` : `Subscribe to My Custom Plan ($${finalPrice})`}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function PricingView({ blocked = false, subscriptionStatus = "" }) {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";
  const { logout, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingCycle, setBillingCycle] = useState("month"); // 'month' | 'year'
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const plans = [
    {
      code: "starter",
      name: "Starter",
      description: isEs ? "Ideal para profesionales independientes y salones pequeños." : "Ideal for independent professionals and small salons.",
      priceMonth: 19,
      priceYear: 190,
      features: isEs ? [
        "Agenda y Calendario Premium",
        "Ficha del Cliente & CRM básico",
        "Gestión de Servicios y Categorías",
        "Hasta 3 profesionales / usuarios",
        "1 Sucursal física",
        "Soporte por email"
      ] : [
        "Premium Schedule & Calendar",
        "Client Profile & Basic CRM",
        "Services & Categories Management",
        "Up to 3 professionals / users",
        "1 Physical branch",
        "Email support"
      ],
      popular: false,
      color: "#6366f1"
    },
    {
      code: "pro",
      name: "Pro",
      description: isEs ? "Perfecto para salones en crecimiento y clínicas estéticas." : "Perfect for growing salons and aesthetic clinics.",
      priceMonth: 49,
      priceYear: 490,
      features: isEs ? [
        "Todo lo de Starter",
        "Módulo de Finanzas Completo (Gastos, Nóminas)",
        "Control de Inventario y Stock (ERP básico)",
        "Flujos de Trabajo (Workflows)",
        "Hasta 10 profesionales / usuarios",
        "Hasta 3 sucursales físicas",
        "Soporte prioritario"
      ] : [
        "Everything in Starter",
        "Full Finance Module (Expenses, Payroll)",
        "Inventory & Stock Control (Basic ERP)",
        "Automated Workflows",
        "Up to 10 professionals / users",
        "Up to 3 physical branches",
        "Priority support"
      ],
      popular: true,
      color: "#7c3aed"
    },
    {
      code: "business",
      name: "Business",
      description: isEs ? "El poder total de la IA y marketing automatizado." : "Full power of AI and automated marketing.",
      priceMonth: 99,
      priceYear: 990,
      features: isEs ? [
        "Todo lo de Pro",
        "Automatizaciones con IA y recordatorios avanzados",
        "Generador de Marketing para Instagram",
        "Profesionales ilimitados",
        "Sucursales ilimitadas",
        "Integración con Google Sheets Sync",
        "Soporte dedicado 24/7"
      ] : [
        "Everything in Pro",
        "AI Automations & Advanced Reminders",
        "Instagram Marketing Generator",
        "Unlimited professionals",
        "Unlimited branches",
        "Google Sheets Sync integration",
        "Dedicated 24/7 support"
      ],
      popular: false,
      color: "#ec4899"
    }
  ];

  const [checkoutConfig, setCheckoutConfig] = useState(() => {
    try {
      const stored = sessionStorage.getItem("pending_custom_plan") || localStorage.getItem("pending_custom_plan");
      return stored ? JSON.parse(stored) : {
        planCode: "custom",
        enabledModules: ["agenda", "clients", "services"],
        price: 15,
        billingCycle: "month"
      };
    } catch {
      return {
        planCode: "custom",
        enabledModules: ["agenda", "clients", "services"],
        price: 15,
        billingCycle: "month"
      };
    }
  });
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  const handleSelectPlan = async (planCode, customData = null) => {
    setLoadingPlan(planCode);
    setError("");
    setSuccess("");

    if (planCode === "custom" || customData) {
      const config = customData || checkoutConfig || {
        planCode: "custom",
        enabledModules: ["agenda", "clients", "services"],
        price: 15,
        billingCycle
      };
      setCheckoutConfig(config);
      setShowCheckoutModal(true);
      setLoadingPlan(null);
      return;
    }

    try {
      const res = await api.post("/billing/checkout", {
        planCode,
        interval: billingCycle,
        provider: "stripe"
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

  const handleConfirmCheckoutAndProceedToOnboarding = async () => {
    setProcessingCheckout(true);
    setError("");

    try {
      const configToUse = checkoutConfig || {
        planCode: "custom",
        enabledModules: ["agenda", "clients", "services"],
        price: 15,
        billingCycle: "month"
      };

      const res = await api.post("/billing/checkout", {
        planCode: "custom",
        interval: configToUse.billingCycle || billingCycle || "month",
        enabledModules: configToUse.enabledModules || ["agenda", "clients", "services"],
        price: configToUse.price || 15,
        provider: "manual"
      });

      if (res.data?.success) {
        sessionStorage.removeItem("pending_custom_plan");
        localStorage.removeItem("pending_custom_plan");
        setShowCheckoutModal(false);
        setSuccess(isEs ? "¡Cobro confirmado exitosamente! Redirigiendo al formulario de tu negocio..." : "Payment confirmed! Redirecting to setup...");
        
        setTimeout(() => {
          window.location.href = "/app/onboarding";
        }, 1000);
      } else {
        throw new Error(res.data?.error || "Error al procesar el cobro.");
      }
    } catch (err) {
      console.error("Error confirmando cobro de plan:", err);
      setError(err.response?.data?.error || err.message || "Error al procesar el pago.");
    } finally {
      setProcessingCheckout(false);
    }
  };

  React.useEffect(() => {
    const planParam = searchParams.get("plan");
    const checkoutParam = searchParams.get("checkout") === "true";

    if (planParam === "custom" || checkoutParam) {
      setShowCheckoutModal(true);
    } else if (planParam && ["starter", "pro", "business"].includes(planParam)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("plan");
      setSearchParams(nextParams, { replace: true });
      handleSelectPlan(planParam);
    }
  }, [searchParams]);

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
          <h1 className="fw-black text-dark tracking-tight mb-2 h2">
            {isEs ? "Planes flexibles y a la medida para tu negocio" : "Flexible & Custom Plans for Your Business"}
          </h1>
          <p className="text-muted small max-w-500 mx-auto mb-4">
            {isEs 
              ? "Elige uno de nuestros planes recomendados o arma tu plan personalizado seleccionando solo los módulos que necesitas." 
              : "Choose a recommended plan or build your custom plan by selecting only the modules you need."}
          </p>

          {/* Toggle Cycle */}
          <div className="d-inline-flex align-items-center bg-white p-1.5 rounded-pill shadow-sm border mb-2">
            <button
              onClick={() => setBillingCycle("month")}
              className={`btn px-4 py-1.5 rounded-pill fw-bold Transition-all ${billingCycle === "month" ? "bg-purple-600 text-white shadow-sm" : "text-muted bg-transparent border-0"}`}
              style={billingCycle === "month" ? { backgroundColor: "#7c3aed", border: 0 } : { fontSize: "13px" }}
            >
              {isEs ? "Mensual" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingCycle("year")}
              className={`btn px-4 py-1.5 rounded-pill fw-bold Transition-all ${billingCycle === "year" ? "bg-purple-600 text-white shadow-sm" : "text-muted bg-transparent border-0"}`}
              style={billingCycle === "year" ? { backgroundColor: "#7c3aed", border: 0 } : { fontSize: "13px" }}
            >
              {isEs ? "Anual" : "Annual"} <span className="badge bg-success bg-opacity-20 text-success ms-1 small" style={{ fontSize: "10px" }}>{isEs ? "Ahorra 20%" : "Save 20%"}</span>
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

        {/* Custom Plan Builder Component */}
        <CustomPlanBuilder 
          billingCycle={billingCycle} 
          isEs={isEs} 
          onSelectCustom={(customConfig) => {
            handleSelectPlan("custom", customConfig);
          }} 
        />

        <div className="text-center my-5">
          <h2 className="h4 fw-black text-dark mb-1">{isEs ? "O elige un plan predefinido" : "Or choose a preset plan"}</h2>
          <p className="text-muted small mb-0">{isEs ? "Paquetes optimizados para cada etapa de tu empresa" : "Optimized packages for every stage of your business"}</p>
        </div>

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
                        <span className="text-muted ms-1.5 small">/ {billingCycle === "month" ? (isEs ? "mes" : "mo") : (isEs ? "año" : "yr")}</span>
                      </div>
                      <span className="text-muted smaller bg-light px-2.5 py-1 rounded-pill" style={{ fontSize: "10.5px" }}>
                        {isEs ? `Equivale a $${(price / (billingCycle === "month" ? 1 : 12)).toFixed(1)} / mes` : `Equivalent to $${(price / (billingCycle === "month" ? 1 : 12)).toFixed(1)} / mo`}
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
                      {isLoading ? "Procesando, esto puede tardar unos segundos..." : (blocked ? "Reactivar Cuenta" : "Empezar Plan")}
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
          <span>{isEs ? "Pagos protegidos de forma segura por Stripe y MercadoPago." : "Payments securely protected by Stripe & MercadoPago."}</span>
        </div>

        {/* Modal de Pasarela de Cobro (Checkout Modal) */}
        <Modal 
          show={showCheckoutModal} 
          onHide={() => setShowCheckoutModal(false)}
          centered
          backdrop="static"
          size="lg"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-black h5 text-dark d-flex align-items-center gap-2">
              💳 {isEs ? "Pasarela de Cobro — Plan a la Medida" : "Payment Checkout — Custom Plan"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Alert variant="purple" className="bg-purple-50 border-purple-200 text-purple-900 rounded-4 p-3 mb-4">
              <div className="d-flex align-items-center gap-2 font-bold mb-1" style={{ color: "#7e22ce" }}>
                <Sparkles size={18} />
                <span>{isEs ? "Paso 1 de 2: Confirmación de Pago" : "Step 1 of 2: Payment Confirmation"}</span>
              </div>
              <p className="small mb-0" style={{ fontSize: "12.5px" }}>
                {isEs 
                  ? "Al confirmar tu cobro, tu plan se activará inmediatamente y serás redirigido al formulario para configurar y crear tu Dashboard."
                  : "Upon payment confirmation, your plan activates immediately and you will be redirected to setup your Dashboard."}
              </p>
            </Alert>

            {checkoutConfig && (
              <div className="bg-light p-3.5 rounded-4 border mb-4">
                <h5 className="fw-bold text-dark h6 mb-3 border-bottom pb-2">
                  📋 {isEs ? "Resumen de tu Suscripción Contratada" : "Subscription Summary"}
                </h5>
                <Row className="g-3">
                  <Col md={6}>
                    <span className="text-muted smaller d-block">{isEs ? "Plan Seleccionado:" : "Selected Plan:"}</span>
                    <strong className="text-dark d-block">{isEs ? "Plan a la Medida Personalizado" : "Custom Plan"}</strong>
                  </Col>
                  <Col md={6}>
                    <span className="text-muted smaller d-block">{isEs ? "Ciclo de Facturación:" : "Billing Interval:"}</span>
                    <strong className="text-dark d-block">
                      {checkoutConfig.billingCycle === "year" ? (isEs ? "Anual (Ahorro 20% aplicado)" : "Annual (20% OFF)") : (isEs ? "Mensual" : "Monthly")}
                    </strong>
                  </Col>
                  <Col md={12}>
                    <span className="text-muted smaller d-block mb-1.5">{isEs ? "Módulos y Funcionalidades Incluidas:" : "Included Modules:"}</span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {(checkoutConfig.enabledModules || ["agenda", "clients", "services"]).map((modKey) => (
                        <span key={modKey} className="badge bg-white border border-purple-200 text-purple-700 rounded-pill px-2.5 py-1.5 small fw-semibold" style={{ color: "#7e22ce" }}>
                          ✓ {modKey.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </Col>
                </Row>
                <hr className="my-3" />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark">{isEs ? "Total a Cobrar Hoy:" : "Total to Charge Today:"}</span>
                  <div className="text-end">
                    <span className="h3 fw-black text-purple-700 mb-0" style={{ color: "#7c3aed" }}>${checkoutConfig.price || 15}</span>
                    <span className="text-muted smaller ms-1">USD / {checkoutConfig.billingCycle === "year" ? (isEs ? "año" : "year") : (isEs ? "mes" : "month")}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center py-2">
              <Button 
                onClick={handleConfirmCheckoutAndProceedToOnboarding}
                disabled={processingCheckout}
                className="w-100 rounded-pill py-3 fw-bold shadow-lg text-white border-0 d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: "#7c3aed", fontSize: "15px" }}
              >
                {processingCheckout ? (
                  <>
                    <Spinner size="sm" animation="border" />
                    <span>{isEs ? "Procesando Cobro Seguro..." : "Processing Secure Payment..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>{isEs ? `Confirmar Pago ($${checkoutConfig?.price || 15}) & Ir al Formulario del Dashboard` : `Confirm Payment ($${checkoutConfig?.price || 15}) & Go to Setup`}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
              <span className="text-muted smaller d-block mt-2" style={{ fontSize: "11px" }}>
                🔒 {isEs ? "Transacción cifrada SSL de 256 bits. Cancelación disponible en cualquier momento." : "256-bit SSL Encrypted transaction."}
              </span>
            </div>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}
