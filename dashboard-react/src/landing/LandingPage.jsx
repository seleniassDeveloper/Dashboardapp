import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Badge, Nav, Navbar, Form } from "react-bootstrap";
import { useAuth } from "../auth/AuthProvider.jsx";
import api from "../lib/api.js";
import {
  Users,
  Calendar,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Globe,
  Lock,
  Book,
  Database,
  Sparkles,
  Play,
  ShieldCheck,
  Plus,
  ArrowDownRight,
  Clock,
  Settings,
  Heart,
  Scissors,
  Briefcase,
  Home,
  ArrowUpRight,
  Check,
  ChevronRight,
  Star
} from "lucide-react";
import LanguageSwitcher from "../components/language/LanguageSwitcher.jsx";
import "./styles/landing.css";

import logoCircular from "../assets/logo-circular.png";
import logoHorizontal from "../assets/logo-horizontal.png";

import dashHome from "../assets/tour_panel.png";
import dashCalendar from "../assets/tour_agenda.png";
import dashClients from "../assets/c3.png";
import dashTeam from "../assets/tour_equipo.png";
import dashFinance from "../assets/tour_finanzas.png";
import dashFlows from "../assets/tour_workflows.png";
import dashIntegrations from "../assets/tour_integraciones.png";
import dashSettings from "../assets/tour_config.png";
import dashInventory from "../assets/seccion3.png";

// Reutilizamos el sistema de revelación al hacer scroll
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function HeroImageStack() {
  const images = [
    dashHome,
    dashCalendar,
    dashClients,
    dashTeam,
    dashFinance,
    dashFlows,
    dashIntegrations,
    dashSettings
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="hero-carousel">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Dashboard View ${idx + 1}`}
          className={`hero-carousel__item ${idx === index ? 'active' : ''}`}
        />
      ))}
    </div>
  );
}

import { Modal } from "react-bootstrap";
import { X } from "lucide-react";

// Componente del Modal Explicativo
function HowItWorksModal({ show, onHide }) {
  const { t } = useTranslation("landing");
  const steps = [
    { title: t("howItWorks.step1.title"), img: dashHome, desc: t("howItWorks.step1.desc") },
    { title: t("howItWorks.step2.title"), img: dashCalendar, desc: t("howItWorks.step2.desc") },
    { title: t("howItWorks.step3.title"), img: dashClients, desc: t("howItWorks.step3.desc") },
    { title: t("howItWorks.step4.title"), img: dashTeam, desc: t("howItWorks.step4.desc") },
    { title: t("howItWorks.step5.title"), img: dashFinance, desc: t("howItWorks.step5.desc") },
    { title: t("howItWorks.step6.title"), img: dashFlows, desc: t("howItWorks.step6.desc") },
    { title: t("howItWorks.step7.title"), img: dashIntegrations, desc: t("howItWorks.step7.desc") },
    { title: t("howItWorks.step8.title"), img: dashSettings, desc: t("howItWorks.step8.desc") }
  ];

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="premium-modal-wrapper">
      <div className="premium-how-it-works shadow-extreme">
        <div className="modal-header-custom">
          <div>
            <h2 className="fw-black h3 mb-1">{t("howItWorks.title")}</h2>
            <p className="text-muted small mb-0">{t("howItWorks.subtitle")}</p>
          </div>
          <button className="btn-close-custom" onClick={onHide}><X size={24} /></button>
        </div>

        <div className="modal-body-custom scroll-custom">
          {steps.map((step, idx) => (
            <div key={idx} className="manual-step-item mb-5">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="step-number">{idx + 1}</div>
                <h3 className="h5 fw-bold mb-0">{step.title}</h3>
              </div>
              <p className="text-muted mb-4">{step.desc}</p>
              <div className="card-premium p-1 bg-light">
                <img src={step.img} alt={step.title} className="img-fluid rounded-4 shadow-sm" />
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer-custom">
          <Link to="/app" className="btn-premium px-5 py-3 text-decoration-none">
            {t("howItWorks.cta")}
          </Link>
        </div>
      </div>
    </Modal>
  );
}

export function MainNavbar({ onHowItWorks, onFreeTrial }) {
  const { t } = useTranslation("landing");
  const [expanded, setExpanded] = useState(false);

  const handleLinkClick = (callback) => {
    setExpanded(false);
    if (callback) callback();
  };

  return (
    <Navbar expanded={expanded} onToggle={setExpanded} bg="transparent" expand="lg" className="py-4">
      <Container>
        <Navbar.Brand href="/" className="d-flex align-items-center">
          <img src={logoCircular} alt="AuraDash Logo" style={{ height: "75px", objectFit: "contain" }} />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-4">
            <Nav.Link onClick={() => handleLinkClick(onHowItWorks)} className="fw-semibold text-dark" style={{ cursor: 'pointer' }}>
              {t("nav.howItWorks")}
            </Nav.Link>
            <Nav.Link href="#funcionalidades" onClick={() => handleLinkClick()} className="fw-semibold">{t("nav.features")}</Nav.Link>
            <Nav.Link href="#precios" onClick={() => handleLinkClick()} className="fw-semibold">{t("nav.pricing")}</Nav.Link>
            <Nav.Link href="#recursos" onClick={() => handleLinkClick()} className="fw-semibold">{t("nav.resources")}</Nav.Link>
            <Nav.Link onClick={() => handleLinkClick(onFreeTrial)} className="fw-semibold" style={{ cursor: 'pointer' }}>{t("nav.demo")}</Nav.Link>
            <LanguageSwitcher variant="landing" />
            <Link to="/app" onClick={() => handleLinkClick()} className="fw-semibold text-dark text-decoration-none" style={{ fontSize: '0.95rem' }}>
              {t("nav.login")}
            </Link>
            <button onClick={() => handleLinkClick(onFreeTrial)} className="btn-premium px-4 py-2 text-decoration-none border-0 text-white bg-purple-600 hover-bg-purple-700" style={{ fontWeight: 600 }}>
              {t("nav.freeTrial")}
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function ReportBugSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorText("Por favor, describe el error.");
      return;
    }
    setSubmitting(true);
    setErrorText("");
    setSuccess(false);
    try {
      await api.post("/public/support/report-error", {
        name,
        email,
        description,
        path: path || "Reporte desde sección pública de contacto"
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setDescription("");
      setPath("");
    } catch (err) {
      console.error(err);
      setErrorText("No se pudo enviar el reporte. Por favor, intenta de nuevo más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reportar-error" className="py-5 bg-light border-top">
      <Container>
        <Row className="justify-content-center">
          <Col lg={7} md={9}>
            <div className="text-center mb-4">
              <span className="text-uppercase fw-bold text-purple-600 small" style={{ color: "var(--lp-accent)", letterSpacing: "0.1em" }}>
                Soporte de AuraDash
              </span>
              <h2 className="fw-black h3 mt-1 mb-2" style={{ letterSpacing: "-0.02em", color: "#1e293b" }}>
                ¿Encontraste algún problema técnico?
              </h2>
              <p className="text-muted small">
                Envíanos los detalles del error y lo solucionaremos a la brevedad. El reporte se enviará directo a soporte técnico.
              </p>
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm border" style={{ borderColor: "rgba(15, 23, 42, 0.06)" }}>
              {success && (
                <div className="alert alert-success rounded-3 mb-3 py-2 border-0 small" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontWeight: 600 }}>
                  ✓ ¡Reporte enviado con éxito! Agradecemos tu ayuda para mejorar el sistema.
                </div>
              )}
              {errorText && (
                <div className="alert alert-danger rounded-3 mb-3 py-2 border-0 small" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontWeight: 600 }}>
                  ✗ {errorText}
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="smaller fw-bold text-dark mb-1">Nombre (Opcional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej. Carlos"
                        className="rounded-3 border-light bg-light small py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={submitting}
                        style={{ fontSize: "13px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="smaller fw-bold text-dark mb-1">Email de contacto (Opcional)</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="rounded-3 border-light bg-light small py-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        style={{ fontSize: "13px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="smaller fw-bold text-dark mb-1">¿Dónde ocurrió el error? (Opcional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej. Al agendar una cita / En la sección de finanzas"
                        className="rounded-3 border-light bg-light small py-2"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        disabled={submitting}
                        style={{ fontSize: "13px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="smaller fw-bold text-dark mb-1">Descripción del problema (Requerido)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Describe detalladamente qué estabas haciendo y qué error apareció..."
                        className="rounded-3 border-light bg-light small py-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                        required
                        style={{ fontSize: "13px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} className="text-end">
                    <button
                      type="submit"
                      className="btn-premium px-4 py-2.5 border-0 text-white bg-purple-600 hover-bg-purple-700 small"
                      style={{ borderRadius: "10px", background: "var(--lp-accent)", fontWeight: 600, fontSize: "13px" }}
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Enviar a Soporte"}
                    </button>
                  </Col>
                </Row>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default function LandingPage() {
  useScrollReveal();
  const { t } = useTranslation("landing");
  const [showManual, setShowManual] = useState(false);
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const handleFreeTrial = () => {
    loginDemo();
    navigate("/app");
  };

  // Estados del simulador interactivo de Aura AI Copilot
  const [aiPrompt, setAiPrompt] = useState(null);
  const [aiTyping, setAiTyping] = useState(false);

  // Estados del Explorador de Módulos (9 Módulos)
  const [activeExplorer, setActiveExplorer] = useState("dashboard");
  const [activeMobileExplorer, setActiveMobileExplorer] = useState("dashboard");

  const toggleMobileExplorer = (key) => {
    setActiveMobileExplorer(activeMobileExplorer === key ? null : key);
  };

  const explorerConfig = {
    dashboard: {
      img: dashHome,
      icon: <BarChart3 size={18} />,
      url: "https://auradash.digital/app/dashboard"
    },
    agenda: {
      img: dashCalendar,
      icon: <Calendar size={18} />,
      url: "https://auradash.digital/app/agenda"
    },
    clients: {
      img: dashClients,
      icon: <Users size={18} />,
      url: "https://auradash.digital/app/clientes"
    },
    team: {
      img: dashTeam,
      icon: <ShieldCheck size={18} />,
      url: "https://auradash.digital/app/equipo"
    },
    finance: {
      img: dashFinance,
      icon: <Database size={18} />,
      url: "https://auradash.digital/app/finanzas"
    },
    inventory: {
      img: dashInventory,
      icon: <Database size={18} />,
      url: "https://auradash.digital/app/inventario"
    },
    flows: {
      img: dashFlows,
      icon: <Zap size={18} />,
      url: "https://auradash.digital/app/workflows"
    },
    integrations: {
      img: dashIntegrations,
      icon: <Globe size={18} />,
      url: "https://auradash.digital/app/integraciones"
    },
    settings: {
      img: dashSettings,
      icon: <Lock size={18} />,
      url: "https://auradash.digital/app/configuracion"
    }
  };

  // Ejecuta la consulta ficticia del Aura AI simulator
  const handleTriggerAiSimulator = (promptKey) => {
    if (aiTyping) return;
    setAiPrompt(promptKey);
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
    }, 1200);
  };

  return (
    <div className="landing-premium">
      <MainNavbar onHowItWorks={() => setShowManual(true)} onFreeTrial={handleFreeTrial} />

      <main>
        {/* HERO SECTION */}
        <section className="hero-section py-5 reveal grid-bg">
          <Container>
            <Row className="align-items-center g-5">
              <Col lg={6}>
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Badge bg="purple" className="px-2 py-1 rounded text-white" style={{ background: 'var(--lp-accent)', fontSize: '0.75rem', fontWeight: 800 }}>NUEVO</Badge>
                  <span className="text-muted small fw-semibold" style={{ fontSize: '0.85rem' }}>{t("hero.badge")}</span>
                </div>
                <h1 className="display-4 fw-black mb-4" style={{ letterSpacing: '-0.03em', lineHeight: 1.1, fontSize: '3.5rem' }}>
                  {t("hero.titleLine1")} <br/>
                  <span style={{ color: 'var(--lp-accent)' }}>{t("hero.titleLine2")}</span>
                </h1>
                <p className="lead text-muted mb-5 pe-lg-4" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                  {t("hero.subtitle")}
                </p>
                <div className="d-flex align-items-center gap-3 mb-5 flex-wrap">
                  <button onClick={handleFreeTrial} className="btn-premium px-5 py-3 text-decoration-none shadow-lg border-0 text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2" style={{ fontWeight: 700, borderRadius: '12px' }}>
                    {t("hero.ctaPrimary")} <ArrowRight size={18} />
                  </button>
                  <button onClick={() => setShowManual(true)} className="btn-outline-premium px-5 py-3 d-flex align-items-center gap-2" style={{ borderRadius: '12px', background: '#ffffff', color: '#1e293b' }}>
                    <Play size={16} />
                    {t("hero.ctaSecondary")}
                  </button>
                  <a href="/manual" className="btn-link px-3 py-3 d-flex align-items-center gap-2 text-decoration-none fw-semibold" style={{ color: '#64748b' }}>
                    <Book size={18} />
                    {t("hero.ctaTertiary")}
                  </a>
                </div>
                

              </Col>
              
              <Col lg={6}>
                <div className="hero-product-shot">
                  <div className="hero-carousel-browser-frame">
                    <div className="browser-header">
                      <div className="browser-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <div className="browser-address-bar">
                        https://auradash.digital/app
                      </div>
                    </div>
                    <HeroImageStack />
                  </div>

                  {/* Floating Callouts */}
                  <div className="floating-card metrics-card card-premium shadow-lg" style={{ zIndex: 12, borderRadius: '16px' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <BarChart3 size={16} style={{ color: '#10b981' }} />
                      <span className="fw-bold small text-success">99.8%</span>
                    </div>
                    <div className="text-muted smaller fw-bold">{t("hero.metricsEfficiency")}</div>
                  </div>

                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* BENEFITS QUICK BAR */}
        <section className="py-4 reveal">
          <Container>
            <div className="benefits-bar">
              <Row className="g-4 text-start">
                <Col md={3} sm={6}>
                  <div className="benefit-item">
                    <div className="benefit-icon-wrapper">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">{t("benefits.b1Title")}</div>
                      <div className="text-muted smaller">{t("benefits.b1Desc")}</div>
                    </div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="benefit-item">
                    <div className="benefit-icon-wrapper">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">{t("benefits.b2Title")}</div>
                      <div className="text-muted smaller">{t("benefits.b2Desc")}</div>
                    </div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="benefit-item">
                    <div className="benefit-icon-wrapper">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">{t("benefits.b3Title")}</div>
                      <div className="text-muted smaller">{t("benefits.b3Desc")}</div>
                    </div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="benefit-item">
                    <div className="benefit-icon-wrapper">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">{t("benefits.b4Title")}</div>
                      <div className="text-muted smaller">{t("benefits.b4Desc")}</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Container>
        </section>

        {/* WHO IS IT FOR? & EXPLORER GRID */}
        <section id="funcionalidades" className="py-120 bg-soft-grey reveal">
          <Container>
            <Row className="g-5">
              {/* Left Column: Target Cards */}
              <Col lg={4}>
                <span className="text-uppercase fw-bold text-purple-600 small" style={{ color: '#7c3aed', letterSpacing: '0.1em' }}>
                  {t("target.title")}
                </span>
                <h2 className="fw-black h1 mt-2 mb-4" style={{ letterSpacing: '-0.02em' }}>
                  {t("target.subtitle")}
                </h2>
                <div className="d-flex flex-column gap-3">
                  <div className="target-card">
                    <div className="target-icon-wrapper purple">
                      <Scissors size={20} />
                    </div>
                    <h4 className="fw-bold h6 text-dark mb-1">{t("target.c1Title")}</h4>
                    <p className="text-muted smaller mb-0">{t("target.c1Desc")}</p>
                  </div>
                  <div className="target-card">
                    <div className="target-icon-wrapper green">
                      <Heart size={20} />
                    </div>
                    <h4 className="fw-bold h6 text-dark mb-1">{t("target.c2Title")}</h4>
                    <p className="text-muted smaller mb-0">{t("target.c2Desc")}</p>
                  </div>
                  <div className="target-card">
                    <div className="target-icon-wrapper indigo">
                      <Briefcase size={20} />
                    </div>
                    <h4 className="fw-bold h6 text-dark mb-1">{t("target.c3Title")}</h4>
                    <p className="text-muted smaller mb-0">{t("target.c3Desc")}</p>
                  </div>
                  <div className="target-card">
                    <div className="target-icon-wrapper blue">
                      <Home size={20} />
                    </div>
                    <h4 className="fw-bold h6 text-dark mb-1">{t("target.c4Title")}</h4>
                    <p className="text-muted smaller mb-0">{t("target.c4Desc")}</p>
                  </div>
                </div>
              </Col>

              {/* Right Column: 9 Tabs Explorer */}
              <Col lg={8}>
                {/* Desktop view */}
                <div className="desktop-explorer-only h-100">
                  <div className="h-100 p-4 p-md-5" style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.02)' }}>
                    <span className="text-uppercase fw-bold text-muted small" style={{ letterSpacing: '0.1em' }}>
                      {t("explorer.subtitle")}
                    </span>
                    <h2 className="fw-black h2 mt-2 mb-4" style={{ letterSpacing: '-0.02em' }}>
                      {t("explorer.title")}
                    </h2>
                    
                    <Row className="g-4 mt-2">
                      <Col md={4} className="d-flex flex-column gap-2" style={{ borderRight: '1px solid rgba(15, 23, 42, 0.06)' }}>
                        {Object.keys(explorerConfig).map((key) => {
                          const conf = explorerConfig[key];
                          return (
                            <button
                              key={key}
                              className={`pillar-tab-btn ${activeExplorer === key ? 'active' : ''}`}
                              onClick={() => setActiveExplorer(key)}
                              style={{ border: 'none', background: 'transparent', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem' }}
                            >
                              <span className="d-flex align-items-center gap-2">
                                {conf.icon}
                                {t(`explorer.${key}.tab`)}
                              </span>
                            </button>
                          );
                        })}
                      </Col>
                      
                      <Col md={8}>
                        <div className="mb-4">
                          <Badge bg="warning" className="text-dark px-3 py-2 rounded mb-3 smaller fw-bold uppercase">
                            {t(`explorer.${activeExplorer}.tab`)}
                          </Badge>
                          <h4 className="h5 fw-bold text-dark mb-3">{t(`explorer.${activeExplorer}.title`)}</h4>
                          <ul className="list-unstyled text-muted small mb-0">
                            <li className="mb-2 d-flex align-items-start gap-2">
                              <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                              <span>{t(`explorer.${activeExplorer}.bullet1`)}</span>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                              <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                              <span>{t(`explorer.${activeExplorer}.bullet2`)}</span>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                              <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                              <span>{t(`explorer.${activeExplorer}.bullet3`)}</span>
                            </li>
                          </ul>
                        </div>

                        {/* Mockup Browser Visor */}
                        <div className="explorer-screenshot-frame mt-3">
                          <div className="browser-header">
                            <div className="browser-dots">
                              <span className="dot red"></span>
                              <span className="dot yellow"></span>
                              <span className="dot green"></span>
                            </div>
                            <div className="browser-address-bar">
                              {explorerConfig[activeExplorer].url}
                            </div>
                          </div>
                          <div className="explorer-screenshot-body">
                            <img
                              src={explorerConfig[activeExplorer].img}
                              alt={t(`explorer.${activeExplorer}.title`)}
                              className="animate-fade-in"
                              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top center', backgroundColor: '#f8fafc', display: 'block' }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>

                {/* Mobile view accordion style */}
                <div className="mobile-explorer-only">
                  <div className="p-4" style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)' }}>
                    <span className="text-uppercase fw-bold text-muted small" style={{ letterSpacing: '0.1em' }}>
                      {t("explorer.subtitle")}
                    </span>
                    <h2 className="fw-black h2 mt-2 mb-4" style={{ letterSpacing: '-0.02em', fontSize: '1.8rem' }}>
                      {t("explorer.title")}
                    </h2>
                    
                    <div className="mobile-accordion">
                      {Object.keys(explorerConfig).map((key) => {
                        const conf = explorerConfig[key];
                        const isActive = activeMobileExplorer === key;
                        return (
                          <div key={key} className={`mobile-accordion-item ${isActive ? 'active' : ''}`}>
                            <button 
                              className="mobile-accordion-header"
                              onClick={() => toggleMobileExplorer(key)}
                            >
                              <div className="mobile-accordion-header-content">
                                <div className="mobile-accordion-icon">
                                  {conf.icon}
                                </div>
                                <div>
                                  <h3 className="mobile-accordion-title">{t(`explorer.${key}.tab`)}</h3>
                                  <p className="mobile-accordion-subtitle">{t(`explorer.${key}.tab`)}</p>
                                </div>
                              </div>
                              <ChevronRight size={18} className="mobile-accordion-chevron" />
                            </button>
                            
                            {isActive && (
                              <div className="mobile-accordion-body">
                                <p className="mobile-accordion-desc">
                                  {t(`explorer.${key}.title`)}
                                </p>
                                <ul className="mobile-accordion-bullets list-unstyled">
                                  <li className="d-flex align-items-start gap-2">
                                    <CheckCircle size={14} className="text-success mt-1 flex-shrink-0" />
                                    <span>{t(`explorer.${key}.bullet1`)}</span>
                                  </li>
                                  <li className="d-flex align-items-start gap-2">
                                    <CheckCircle size={14} className="text-success mt-1 flex-shrink-0" />
                                    <span>{t(`explorer.${key}.bullet2`)}</span>
                                  </li>
                                  <li className="d-flex align-items-start gap-2">
                                    <CheckCircle size={14} className="text-success mt-1 flex-shrink-0" />
                                    <span>{t(`explorer.${key}.bullet3`)}</span>
                                  </li>
                                </ul>
                                <div className="mobile-accordion-screenshot">
                                  <div className="browser-header">
                                    <div className="browser-dots">
                                      <span className="dot red"></span>
                                      <span className="dot yellow"></span>
                                      <span className="dot green"></span>
                                    </div>
                                    <div className="browser-address-bar" style={{ padding: '2px 10px', fontSize: '9px', backgroundColor: '#ffffff', color: '#64748b', border: '1px solid rgba(15, 23, 42, 0.08)', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', borderRadius: '4px' }}>
                                      {conf.url}
                                    </div>
                                  </div>
                                  <img 
                                    src={conf.img} 
                                    alt={t(`explorer.${key}.tab`)} 
                                    className="img-fluid w-100" 
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* INTERACTIVE AURA AI COPILOT SECTION */}
        <section className="py-120 bg-white reveal">
          <Container>
            <Row className="g-5 align-items-center">
              {/* Left Column: Dark Chat Console */}
              <Col lg={5}>
                <div className="ai-chat-console">
                  <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
                    <div className="d-flex align-items-center gap-2">
                      <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                      <span className="fw-bold small" style={{ letterSpacing: '0.05em' }}>Aura AI Copilot</span>
                    </div>
                    <Badge bg="secondary" className="smaller">v2.5</Badge>
                  </div>
                  
                  <div className="chat-box-body scroll-custom mb-4" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 className="fw-bold h5 mb-3 text-white">{t("aiCopilot.sandbox.title")}</h4>
                      <div className="d-flex flex-column gap-2">
                        <button className="ai-chat-bubble-q" onClick={() => handleTriggerAiSimulator('finance')}>
                          {t("aiCopilot.sandbox.p1")}
                        </button>
                        <button className="ai-chat-bubble-q" onClick={() => handleTriggerAiSimulator('workflow')}>
                          {t("aiCopilot.sandbox.p2")}
                        </button>
                        <button className="ai-chat-bubble-q" onClick={() => handleTriggerAiSimulator('agenda')}>
                          {t("aiCopilot.sandbox.p3")}
                        </button>
                      </div>
                    </div>
                    
                    {aiTyping && (
                      <div className="text-center py-3 text-purple-400">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                    
                    {aiPrompt === 'finance' && !aiTyping && (
                      <div className="p-3 bg-secondary rounded mt-3 text-start small border border-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-400 fw-bold d-block mb-1">{t("aiSimulator.financeResponse.header")}</span>
                        <p className="mb-0 text-slate-300">{t("aiSimulator.financeResponse.message")}</p>
                        <div className="mt-2 p-2 bg-dark rounded font-monospace" style={{ fontSize: '11px' }}>
                          Target: {t("aiSimulator.financeResponse.target")}<br/>
                          Liquidity: {t("aiSimulator.financeResponse.liquidity")}<br/>
                          Status: {t("aiSimulator.financeResponse.status")}
                        </div>
                      </div>
                    )}

                    {aiPrompt === 'workflow' && !aiTyping && (
                      <div className="p-3 bg-secondary rounded mt-3 text-start small border border-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-400 fw-bold d-block mb-1">{t("aiSimulator.workflowResponse.header")}</span>
                        <p className="mb-0 text-slate-300">{t("aiSimulator.workflowResponse.message")}</p>
                        <div className="mt-2 p-2 bg-dark rounded font-monospace" style={{ fontSize: '11px' }}>
                          Trigger: {t("aiSimulator.workflowResponse.trigger")}<br/>
                          Action 1: {t("aiSimulator.workflowResponse.action1")}<br/>
                          Action 2: {t("aiSimulator.workflowResponse.action2")}
                        </div>
                      </div>
                    )}

                    {aiPrompt === 'agenda' && !aiTyping && (
                      <div className="p-3 bg-secondary rounded mt-3 text-start small border border-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-400 fw-bold d-block mb-1">{t("aiSimulator.agendaResponse.header")}</span>
                        <p className="mb-0 text-slate-300">{t("aiSimulator.agendaResponse.message")}</p>
                        <div className="mt-2 p-2 bg-dark rounded font-monospace" style={{ fontSize: '11px' }}>
                          Busy: {t("aiSimulator.agendaResponse.busy")}<br/>
                          Free: {t("aiSimulator.agendaResponse.free")}<br/>
                          Staff: {t("aiSimulator.agendaResponse.staff")}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ai-chat-input-bar">
                    <span>{t("aiCopilot.sandbox.input")}</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Col>

              {/* Right Column: AI Details & Stack Stats */}
              <Col lg={7} className="ps-lg-5">
                <span className="text-uppercase fw-bold text-purple-600 small" style={{ color: 'var(--lp-accent)', letterSpacing: '0.1em' }}>
                  {t("aiCopilot.title")}
                </span>
                <h2 className="fw-black h1 mt-2 mb-4" style={{ letterSpacing: '-0.02em', fontSize: '2.5rem' }}>
                  {t("aiCopilot.subtitle")}
                </h2>
                <p className="lead text-muted mb-5" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                  {t("aiCopilot.desc")}
                </p>
                
                <Row className="g-4">
                  {/* Bullets details */}
                  <Col md={6} className="d-flex flex-column gap-4">
                    <div className="d-flex gap-3">
                      <div className="benefit-icon-wrapper" style={{ width: '40px', height: '40px', background: 'rgba(231, 146, 53, 0.08)', color: '#e79235' }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h5 className="fw-bold h6 mb-1 text-dark">{t("aiCopilot.bullets.b1Title")}</h5>
                        <p className="text-muted smaller mb-0">{t("aiCopilot.bullets.b1Desc")}</p>
                      </div>
                    </div>
                    <div className="d-flex gap-3">
                      <div className="benefit-icon-wrapper" style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                        <Zap size={18} />
                      </div>
                      <div>
                        <h5 className="fw-bold h6 mb-1 text-dark">{t("aiCopilot.bullets.b2Title")}</h5>
                        <p className="text-muted smaller mb-0">{t("aiCopilot.bullets.b2Desc")}</p>
                      </div>
                    </div>
                    <div className="d-flex gap-3">
                      <div className="benefit-icon-wrapper" style={{ width: '40px', height: '40px', background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' }}>
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <h5 className="fw-bold h6 mb-1 text-dark">{t("aiCopilot.bullets.b3Title")}</h5>
                        <p className="text-muted smaller mb-0">{t("aiCopilot.bullets.b3Desc")}</p>
                      </div>
                    </div>
                  </Col>
                  
                  {/* Stats card Stack */}
                  <Col md={6} className="d-flex flex-column gap-3">
                    <div className="stat-stack-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="benefit-icon-wrapper" style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                          <BarChart3 size={16} />
                        </div>
                        <div>
                          <span className="text-muted smaller d-block">{t("aiCopilot.stats.sales")}</span>
                          <span className="fw-bold text-dark small">$4.250.000</span>
                        </div>
                      </div>
                      <Badge bg="success" className="smaller">+18.5%</Badge>
                    </div>
                    
                    <div className="stat-stack-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="benefit-icon-wrapper" style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                          <Users size={16} />
                        </div>
                        <div>
                          <span className="text-muted smaller d-block">{t("aiCopilot.stats.inactive")}</span>
                          <span className="fw-bold text-dark small">28 CRM</span>
                        </div>
                      </div>
                      <span className="text-primary smaller fw-bold" style={{ cursor: 'pointer' }}>{t("aiCopilot.stats.viewList")}</span>
                    </div>

                    <div className="stat-stack-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="benefit-icon-wrapper" style={{ width: '36px', height: '36px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                          <Zap size={16} />
                        </div>
                        <div>
                          <span className="text-muted smaller d-block">{t("aiCopilot.stats.stock")}</span>
                          <span className="fw-bold text-dark small">5 insumos</span>
                        </div>
                      </div>
                      <span className="text-danger smaller fw-bold" style={{ cursor: 'pointer' }}>{t("aiCopilot.stats.viewDetails")}</span>
                    </div>

                    <div className="stat-stack-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="benefit-icon-wrapper" style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                          <CheckCircle size={16} />
                        </div>
                        <div>
                          <span className="text-muted smaller d-block">{t("aiCopilot.stats.occupancy")}</span>
                          <span className="fw-bold text-dark small">78%</span>
                        </div>
                      </div>
                      <Badge bg="success" className="smaller">+8%</Badge>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        {/* WORKFLOW TIMELINE: "Comienza en minutos, crece sin límites" */}
        <section className="py-120 bg-soft-grey reveal">
          <Container>
            <div className="text-center mb-5 pb-3">
              <h2 className="fw-black h1 mb-3">{t("steps.title")}</h2>
            </div>
            
            <div className="steps-timeline flex-column flex-md-row gap-4">
              <div className="step-timeline-card">
                <div className="step-timeline-icon-wrapper">
                  <Settings size={24} />
                </div>
                <h4 className="fw-bold h6 text-dark mb-2">{t("steps.s1Title")}</h4>
                <p className="text-muted smaller px-lg-3">{t("steps.s1Desc")}</p>
              </div>
              <div className="step-timeline-card">
                <div className="step-timeline-icon-wrapper">
                  <Database size={24} />
                </div>
                <h4 className="fw-bold h6 text-dark mb-2">{t("steps.s2Title")}</h4>
                <p className="text-muted smaller px-lg-3">{t("steps.s2Desc")}</p>
              </div>
              <div className="step-timeline-card">
                <div className="step-timeline-icon-wrapper">
                  <Calendar size={24} />
                </div>
                <h4 className="fw-bold h6 text-dark mb-2">{t("steps.s3Title")}</h4>
                <p className="text-muted smaller px-lg-3">{t("steps.s3Desc")}</p>
              </div>
              <div className="step-timeline-card">
                <div className="step-timeline-icon-wrapper">
                  <Zap size={24} />
                </div>
                <h4 className="fw-bold h6 text-dark mb-2">{t("steps.s4Title")}</h4>
                <p className="text-muted smaller px-lg-3">{t("steps.s4Desc")}</p>
              </div>
              <div className="step-timeline-card">
                <div className="step-timeline-icon-wrapper">
                  <BarChart3 size={24} />
                </div>
                <h4 className="fw-bold h6 text-dark mb-2">{t("steps.s5Title")}</h4>
                <p className="text-muted smaller px-lg-3">{t("steps.s5Desc")}</p>
              </div>
            </div>

          </Container>
        </section>

        {/* PRICING SECTION */}
        <section id="precios" className="pricing-section py-120 bg-white reveal">
          <Container>
            <div className="text-center mb-5 pb-4">
              <h2 className="fw-black display-5 text-dark mb-3" style={{ letterSpacing: '-0.02em' }}>{t("pricing.title")}</h2>
              <p className="text-muted">{t("pricing.subtitle")}</p>
            </div>
            <Row className="g-4 justify-content-center">
              {/* Plan 1 */}
              <Col lg={4} md={6}>
                <div className="pricing-card h-100 p-5 text-start border-0">
                  <h3 className="h5 fw-bold text-dark mb-1">{t("pricing.starter.name")}</h3>
                  <p className="text-muted smaller mb-4">{t("pricing.starter.desc")}</p>
                  <div className="display-4 fw-black text-dark mb-4">$19<span className="h6 text-muted">{t("pricing.perMonth")}</span></div>
                  
                  <hr className="my-4 border-light" />
                  
                  <ul className="list-unstyled mb-5 d-flex flex-column gap-3">
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: '#8b5cf6' }} /> {t("pricing.starter.f1")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: '#8b5cf6' }} /> {t("pricing.starter.f2")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: '#8b5cf6' }} /> {t("pricing.starter.f3")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: '#8b5cf6' }} /> {t("pricing.starter.f4")}
                    </li>
                  </ul>
                  <button onClick={() => navigate("/app/pricing?plan=starter&provider=stripe")} className="btn-outline-premium w-100 py-3 fw-bold mt-auto" style={{ borderRadius: '12px', background: '#f8fafc', color: '#1e293b', border: '1px solid rgba(15, 23, 42, 0.08)' }}>
                    {t("pricing.cta")}
                  </button>
                </div>
              </Col>
              
              {/* Plan 2: Featured */}
              <Col lg={4} md={6}>
                <div className="pricing-card featured h-100 p-5 text-start border-0 position-relative">
                  <div className="position-absolute top-0 end-0 mt-3 me-3">
                    <Badge bg="purple" className="text-white px-3 py-2 rounded-pill small uppercase" style={{ background: 'var(--lp-accent)', fontSize: '9px', fontWeight: 800 }}>{t("pricing.popular")}</Badge>
                  </div>
                  <h3 className="h5 fw-bold text-dark mb-1">{t("pricing.growth.name")}</h3>
                  <p className="text-muted smaller mb-4">{t("pricing.growth.desc")}</p>
                  <div className="display-4 fw-black text-dark mb-4">$49<span className="h6 text-muted">{t("pricing.perMonth")}</span></div>
                  
                  <hr className="my-4 border-light" />
                  
                  <ul className="list-unstyled mb-5 d-flex flex-column gap-3">
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.growth.f1")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.growth.f2")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.growth.f3")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.growth.f4")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.growth.f5")}
                    </li>
                  </ul>
                  <button onClick={() => navigate("/app/pricing?plan=pro&provider=stripe")} className="btn-premium w-100 py-3 fw-bold mt-auto text-white bg-purple-600 border-0" style={{ borderRadius: '12px', background: 'var(--lp-accent)' }}>
                    {t("pricing.cta")}
                  </button>
                </div>
              </Col>
              
              {/* Plan 3 */}
              <Col lg={4} md={6}>
                <div className="pricing-card h-100 p-5 text-start border-0">
                  <h3 className="h5 fw-bold text-dark mb-1">{t("pricing.aipro.name")}</h3>
                  <p className="text-muted smaller mb-4">{t("pricing.aipro.desc")}</p>
                  <div className="display-4 fw-black text-dark mb-4">$99<span className="h6 text-muted">{t("pricing.perMonth")}</span></div>
                  
                  <hr className="my-4 border-light" />
                  
                  <ul className="list-unstyled mb-5 d-flex flex-column gap-3">
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.aipro.f1")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.aipro.f2")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.aipro.f3")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.aipro.f4")}
                    </li>
                    <li className="smaller fw-medium d-flex align-items-center gap-2 text-dark">
                      <Check size={16} style={{ color: 'var(--lp-accent)' }} /> {t("pricing.aipro.f5")}
                    </li>
                  </ul>
                  <button onClick={() => navigate("/app/pricing?plan=business&provider=stripe")} className="btn-outline-premium w-100 py-3 fw-bold mt-auto" style={{ borderRadius: '12px', background: '#f8fafc', color: '#1e293b', border: '1px solid rgba(15, 23, 42, 0.08)' }}>
                    {t("pricing.cta")}
                  </button>
                </div>
              </Col>
            </Row>
            <div className="text-center mt-5">
              <span className="text-muted small">{t("pricing.footnote")}</span>
            </div>

          </Container>
        </section>

        {/* FEATURE COMPARISON MATRIX */}
        <section className="py-120 bg-soft-grey reveal">
          <Container>
            <Row className="g-5 align-items-center">
              {/* Left Side: Table */}
              <Col lg={7}>
                <div className="comparison-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("comparison.table.header1")}</th>
                        <th className="text-center">{t("comparison.table.header2")}</th>
                        <th className="text-center">{t("comparison.table.header3")}</th>
                        <th className="text-center" style={{ color: 'var(--lp-accent)', background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.header4")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-bold text-dark">{t("comparison.table.r1")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-yes">{t("comparison.table.yes")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-dark">{t("comparison.table.r2")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-partial">{t("comparison.table.partial")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-dark">{t("comparison.table.r3")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-partial">{t("comparison.table.partial")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-dark">{t("comparison.table.r4")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-partial">{t("comparison.table.partial")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-dark">{t("comparison.table.r5")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-partial" style={{ color: '#e79235' }}>{t("comparison.table.limited")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-dark">{t("comparison.table.r6")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-dark" style={{ color: 'var(--lp-accent)' }}>{t("comparison.table.r7")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-no">{t("comparison.table.no")}</td>
                        <td className="text-center text-yes" style={{ background: 'rgba(139, 92, 246, 0.02)' }}>{t("comparison.table.yes")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Col>
              
              {/* Right Side: Text details */}
              <Col lg={5} className="ps-lg-5">
                <span className="text-uppercase fw-bold text-purple-600 small" style={{ color: 'var(--lp-accent)', letterSpacing: '0.1em' }}>
                  {t("comparison.title")}
                </span>
                <h2 className="fw-black h1 mt-2 mb-4" style={{ letterSpacing: '-0.02em', fontSize: '2.5rem' }}>
                  Menos herramientas.<br/>Más resultados.
                </h2>
                <p className="text-muted small mb-4" style={{ lineHeight: '1.6' }}>
                  {t("comparison.desc")}
                </p>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={16} className="text-success" />
                    <span className="text-dark small fw-semibold">{t("comparison.b1")}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={16} className="text-success" />
                    <span className="text-dark small fw-semibold">{t("comparison.b2")}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={16} className="text-success" />
                    <span className="text-dark small fw-semibold">{t("comparison.b3")}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={16} className="text-success" />
                    <span className="text-dark small fw-semibold">{t("comparison.b4")}</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="py-5 bg-white reveal">
          <Container>
            <div className="footer-cta-banner text-center">
              <h2 className="display-5 fw-black text-white mb-3" style={{ letterSpacing: '-0.03em' }}>
                {t("ctaFooter.title")}
              </h2>
              <p className="lead text-white text-opacity-80 mb-5 mx-auto" style={{ maxWidth: '600px', fontSize: '1.1rem' }}>
                {t("ctaFooter.subtitle")}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button onClick={handleFreeTrial} className="btn btn-light px-5 py-3 fw-bold text-dark" style={{ borderRadius: '12px' }}>
                  {t("ctaFooter.btnFree")}
                </button>
                <button onClick={handleFreeTrial} className="btn btn-outline-light px-5 py-3 fw-bold text-white" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {t("ctaFooter.btnDemo")}
                </button>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <ReportBugSection />

      <HowItWorksModal show={showManual} onHide={() => setShowManual(false)} />

      <footer className="py-5 border-top bg-white">
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 text-muted small">
            <div className="fw-bold text-dark d-flex flex-column align-items-start gap-2">
              <div className="d-flex align-items-center gap-2">
                <img src={logoCircular} alt="AuraDash Logo" style={{ height: "55px", objectFit: "contain" }} />
              </div>
              <span>{t("footer.copyright")}</span>
            </div>
            <div className="d-flex gap-4">
              <a href="#">{t("footer.privacy")}</a>
              <a href="#">{t("footer.terms")}</a>
              <a href="#">{t("footer.contact")}</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
