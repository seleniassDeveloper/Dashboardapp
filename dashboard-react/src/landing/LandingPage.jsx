import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Badge, Nav, Navbar } from "react-bootstrap";
import {
  Users,
  Calendar,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Globe,
  Lock,
  Database,
  Sparkles,
  Play,
  ShieldCheck,
  Plus,
  ArrowDownRight
} from "lucide-react";
import LanguageSwitcher from "../components/language/LanguageSwitcher.jsx";
import "./styles/landing.css";

import dashHome from "../assets/c1.png";
import dashCalendar from "../assets/c2.png";
import dashClients from "../assets/c3.png";
import dashTeam from "../assets/c4.png";
import dashFinance from "../assets/c5.png";

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
  const images = [dashHome, dashCalendar, dashClients, dashTeam, dashFinance];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="hero-carousel card-premium p-1 shadow-extreme">
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
    { title: t("howItWorks.step3.title"), img: dashTeam, desc: t("howItWorks.step3.desc") },
    { title: t("howItWorks.step4.title"), img: dashClients, desc: t("howItWorks.step4.desc") },
    { title: t("howItWorks.step5.title"), img: dashFinance, desc: t("howItWorks.step5.desc") }
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

function MainNavbar({ onHowItWorks }) {
  const { t } = useTranslation("landing");
  return (
    <Navbar bg="transparent" expand="lg" className="py-4">
      <Container>
        <Navbar.Brand href="/" className="fw-black d-flex align-items-center gap-2">
          <div className="logo-dot"></div>
          <span style={{ letterSpacing: '-0.02em' }}>Dashboard OS</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-4">
            <Nav.Link onClick={onHowItWorks} className="fw-semibold text-dark" style={{ cursor: 'pointer' }}>
              {t("nav.howItWorks")}
            </Nav.Link>
            <Nav.Link href="#funcionalidades" className="fw-semibold">{t("nav.features")}</Nav.Link>
            <Nav.Link href="#precios" className="fw-semibold">{t("nav.pricing")}</Nav.Link>
            <LanguageSwitcher variant="landing" />
            <Link to="/app" className="btn-premium px-4 py-2 text-decoration-none">
              {t("nav.enterApp")}
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default function LandingPage() {
  useScrollReveal();
  const { t } = useTranslation("landing");
  const [showManual, setShowManual] = useState(false);

  // Estados del simulador interactivo de Aura AI Copilot
  const [aiPrompt, setAiPrompt] = useState(null);
  const [aiTyping, setAiTyping] = useState(false);

  // Estados de los 5 Pilares
  const [activePillar, setActivePillar] = useState("agendaCrm");

  const featureCards = [
    { key: "appointments", icon: <Calendar size={24}/>, color: "text-success" },
    { key: "automation", icon: <Zap size={24}/>, color: "text-warning" },
    { key: "mercadopago", icon: <Globe size={24}/>, color: "text-primary" },
    { key: "metrics", icon: <BarChart3 size={24}/>, color: "text-danger" },
    { key: "multiDevice", icon: <Sparkles size={24}/>, color: "text-info" },
    { key: "aiSupport", icon: <Lock size={24}/>, color: "text-accent" },
  ];

  const plans = [
    { key: "individual", price: "$5", featured: false },
    { key: "professional", price: "$7", featured: true },
    { key: "business", price: "$10", featured: false }
  ];

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
      <MainNavbar onHowItWorks={() => setShowManual(true)} />

      <main>
        {/* HERO SECTION */}
        <section className="hero-section py-5 reveal grid-bg">
          <Container>
            <Row className="align-items-center g-5">
              <Col lg={6}>
                <Badge bg="dark" className="mb-4 px-3 py-2 rounded-pill fw-bold text-accent">{t("hero.badge")}</Badge>
                <h1 className="display-3 fw-black mb-4" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {t("hero.titleLine1")} <br/>
                  <span className="text-accent">{t("hero.titleLine2")}</span>
                </h1>
                <p className="lead text-muted mb-5 pe-lg-4" style={{ fontSize: '1.15rem' }}>
                  {t("hero.subtitle")}
                </p>
                <div className="d-flex gap-3">
                  <Link to="/app" className="btn-premium px-5 py-3 text-decoration-none shadow-lg">
                    {t("hero.ctaPrimary")}
                  </Link>
                  <button onClick={() => setShowManual(true)} className="btn-outline-premium px-5 py-3 d-flex align-items-center gap-2">
                    <Play size={16} />
                    {t("hero.ctaSecondary")}
                  </button>
                </div>
              </Col>
              <Col lg={6}>
                <div className="hero-product-shot">
                  <HeroImageStack />

                  {/* Floating Callouts para dar profundidad */}
                  <div className="floating-card metrics-card card-premium shadow-lg">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <BarChart3 size={16} className="text-accent" />
                      <span className="fw-bold small text-success">99.8%</span>
                    </div>
                    <div className="text-muted smaller">{t("hero.metricsEfficiency")}</div>
                  </div>
                  <div className="floating-card users-card card-premium shadow-lg">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Users size={16} className="text-primary" />
                      <span className="fw-bold small">1,200+</span>
                    </div>
                    <div className="text-muted smaller">{t("hero.metricsClients")}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* 5 PILLARS SYSTEM SCOPE (FUNCTIONALITIES & SCOPE) */}
        <section className="pillars-section py-120 reveal">
          <Container>
            <div className="text-center mb-5 pb-4">
              <h2 className="fw-black display-5 text-dark mb-3" style={{ letterSpacing: '-0.02em' }}>
                {t("pillars.title")}
              </h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
                {t("pillars.subtitle")}
              </p>
            </div>

            <Row className="g-5 align-items-stretch">
              <Col lg={4} className="d-flex flex-column gap-3 justify-content-center">
                <button
                  className={`pillar-tab-btn ${activePillar === 'agendaCrm' ? 'active' : ''}`}
                  onClick={() => setActivePillar('agendaCrm')}
                >
                  <Calendar size={20} />
                  <span>{t("pillars.agendaCrm.tab")}</span>
                </button>

                <button
                  className={`pillar-tab-btn ${activePillar === 'automations' ? 'active' : ''}`}
                  onClick={() => setActivePillar('automations')}
                >
                  <Zap size={20} />
                  <span>{t("pillars.automations.tab")}</span>
                </button>

                <button
                  className={`pillar-tab-btn ${activePillar === 'checkout' ? 'active' : ''}`}
                  onClick={() => setActivePillar('checkout')}
                >
                  <Globe size={20} />
                  <span>{t("pillars.checkout.tab")}</span>
                </button>

                <button
                  className={`pillar-tab-btn ${activePillar === 'audit' ? 'active' : ''}`}
                  onClick={() => setActivePillar('audit')}
                >
                  <Database size={20} />
                  <span>{t("pillars.audit.tab")}</span>
                </button>

                <button
                  className={`pillar-tab-btn ${activePillar === 'rbac' ? 'active' : ''}`}
                  onClick={() => setActivePillar('rbac')}
                >
                  <Lock size={20} />
                  <span>{t("pillars.rbac.tab")}</span>
                </button>
              </Col>

              <Col lg={8}>
                <div className="pillar-mockup-wrapper d-flex flex-column justify-content-between h-100 shadow-extreme">
                  <div className="mb-4">
                    <Badge bg="warning" className="text-dark px-3 py-2 rounded mb-3 smaller fw-bold uppercase">
                      SYSTEM CAPABILITY
                    </Badge>
                    <h3 className="h3 text-white fw-bold mb-3">{t(`pillars.${activePillar}.title`)}</h3>
                    <ul className="list-unstyled text-muted small pe-lg-5">
                      <li className="mb-3 d-flex align-items-start gap-2">
                        <CheckCircle size={16} className="text-accent mt-1 flex-shrink-0" />
                        <span>{t(`pillars.${activePillar}.bullet1`)}</span>
                      </li>
                      <li className="mb-3 d-flex align-items-start gap-2">
                        <CheckCircle size={16} className="text-accent mt-1 flex-shrink-0" />
                        <span>{t(`pillars.${activePillar}.bullet2`)}</span>
                      </li>
                      <li className="mb-3 d-flex align-items-start gap-2">
                        <CheckCircle size={16} className="text-accent mt-1 flex-shrink-0" />
                        <span>{t(`pillars.${activePillar}.bullet3`)}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Dynamic CSS Visual representation of the active pillar */}
                  <div className="mt-auto pt-4 border-top border-secondary">
                    {activePillar === 'agendaCrm' && (
                      <div className="mock-calendar-grid">
                        <div className="mock-calendar-cell has-booking">
                          <div className="fw-bold">10:00 AM</div>
                          <div className="text-white smaller">Pediatrics Appt</div>
                          <span className="text-success smaller fw-semibold">● Active</span>
                        </div>
                        <div className="mock-calendar-cell has-booking-pending">
                          <div className="fw-bold">11:30 AM</div>
                          <div className="text-white smaller">Dental Cleaning</div>
                          <span className="text-warning smaller fw-semibold">● Pending</span>
                        </div>
                        <div className="mock-calendar-cell">
                          <div className="fw-bold text-muted">14:30 PM</div>
                          <div className="text-muted smaller">Free slot</div>
                        </div>
                        <div className="mock-calendar-cell has-booking">
                          <div className="fw-bold">16:00 PM</div>
                          <div className="text-white smaller">Terapia Session</div>
                          <span className="text-success smaller fw-semibold">● Active</span>
                        </div>
                      </div>
                    )}

                    {activePillar === 'automations' && (
                      <div className="d-flex flex-column align-items-center">
                        <div className="mock-workflow-node text-center w-75">
                          <span className="text-success small fw-bold">📥 TRIGGER</span>
                          <p className="text-white smaller mb-0">On Customer Appointment Paid (Mercado Pago)</p>
                        </div>
                        <div className="mock-workflow-node text-center w-75">
                          <span className="text-primary small fw-bold">💬 ACTION</span>
                          <p className="text-white smaller mb-0">Dispatch Personal WhatsApp Billing Message</p>
                        </div>
                        <div className="mock-workflow-node text-center w-75">
                          <span className="text-warning small fw-bold">📊 ACTION</span>
                          <p className="text-white smaller mb-0">Log entry in relational PostgreSQL Ledger</p>
                        </div>
                      </div>
                    )}

                    {activePillar === 'checkout' && (
                      <Row className="align-items-center g-4">
                        <Col md={6}>
                          <div className="mock-credit-card">
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="smaller fw-bold">MERCADO PAGO SIMULATOR</span>
                              <Globe size={20} />
                            </div>
                            <div className="my-3 font-monospace h5">•••• •••• •••• 5839</div>
                            <div className="d-flex justify-content-between smaller">
                              <span>SELENIA SANCHEZ</span>
                              <span>12 / 29</span>
                            </div>
                          </div>
                        </Col>
                        <Col md={6} className="smaller text-muted">
                          <div className="p-3 rounded bg-dark border border-secondary">
                            <div className="text-white fw-bold mb-1">🏦 Bank Facturation info:</div>
                            <div>Alias: <code>selenia.dev.mp</code></div>
                            <div>CBU: <code>0000003100094839281923</code></div>
                            <div className="mt-2 text-white fw-bold mb-1">💬 Auto SMS Template:</div>
                            <p className="mb-0 text-accent">"Hi Selenia! Booking downpayment approved. Balance updated."</p>
                          </div>
                        </Col>
                      </Row>
                    )}

                    {activePillar === 'audit' && (
                      <div className="smaller font-monospace text-muted">
                        <div className="p-3 bg-dark border border-secondary rounded mb-3">
                          <span className="text-success fw-bold">✓ CASH DRAWER CLOSING LEDGER</span>
                          <div className="d-flex gap-4 mt-2">
                            <span>Open Cash: $5,000</span>
                            <span>Sales Net: $12,450</span>
                            <span className="text-success">Diff: $0.00 (Balanced)</span>
                          </div>
                        </div>
                        <div className="p-3 bg-dark rounded" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                          <div className="mb-1 text-white">● [19:35:33] <span className="text-warning">seleniadeveloper@gmail.com</span> - Cash Drawer Closed - Balanced</div>
                          <div className="mb-1 text-white">● [19:30:11] <span className="text-success">SYSTEM</span> - WhatsApp notification trigger dispatched - SUCCESS</div>
                          <div className="text-white">● [19:15:20] <span className="text-warning">seleniadeveloper@gmail.com</span> - Booking Settings Updated - Real MP Enabled</div>
                        </div>
                      </div>
                    )}

                    {activePillar === 'rbac' && (
                      <Row className="g-4 align-items-center">
                        <Col md={6}>
                          <div className="p-3 bg-dark rounded border border-secondary smaller">
                            <div className="text-white fw-bold mb-2">Member Control Permissions Matrix</div>
                            <div className="d-flex justify-content-between mb-1">
                              <span>Owner (full access)</span>
                              <span className="text-success fw-bold">✓ Bypassed</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                              <span>Manager Role</span>
                              <span className="text-success">✓ Authorized</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Reception Staff</span>
                              <span className="text-muted">✗ Restricted</span>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-3 bg-dark rounded border border-secondary smaller">
                            <div className="text-white fw-bold mb-2">Invite team member:</div>
                            <div className="d-flex gap-2">
                              <input type="email" placeholder="staff@business.com" disabled className="form-control form-control-sm bg-secondary text-white border-0 smaller" />
                              <button className="btn btn-sm btn-warning smaller"><Plus size={14} /></button>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* INTERACTIVE AURA AI SIMULATOR (PLACED BELOW SCOPE WITH LIGHT THEME) */}
        <section className="py-120 bg-white reveal grid-bg" style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
          <Container>
            <Row className="g-5 align-items-center">
              <Col lg={5}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Sparkles size={20} className="text-accent" />
                  <span className="text-accent fw-bold uppercase">LIVE SANDBOX DEMO</span>
                </div>
                <h2 className="display-5 fw-black text-dark mb-3" style={{ letterSpacing: '-0.02em' }}>
                  {t("aiSimulator.title")}
                </h2>
                <p className="text-muted mb-4 small">
                  {t("aiSimulator.subtitle")}
                </p>

                {/* Aura Features Explanation List */}
                <div className="mb-5 d-flex flex-column gap-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-light rounded text-primary">
                      <Database size={18} />
                    </div>
                    <div>
                      <div className="fw-bold small text-dark">{t("aiSimulator.features.f1Title")}</div>
                      <div className="text-muted smaller">{t("aiSimulator.features.f1Desc")}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-light rounded text-warning">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="fw-bold small text-dark">{t("aiSimulator.features.f2Title")}</div>
                      <div className="text-muted smaller">{t("aiSimulator.features.f2Desc")}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-light rounded text-accent">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="fw-bold small text-dark">{t("aiSimulator.features.f3Title")}</div>
                      <div className="text-muted smaller">{t("aiSimulator.features.f3Desc")}</div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 mt-4 pt-3 border-top border-light">
                  <span className="smaller fw-bold text-muted uppercase mb-2">PROMPTS DISPONIBLES / CLICK PARA PROBAR:</span>
                  <button
                    className={`ai-query-button text-start d-flex align-items-center gap-3 ${aiPrompt === 'finance' ? 'active' : ''}`}
                    onClick={() => handleTriggerAiSimulator('finance')}
                  >
                    <span>{t("aiSimulator.btnFinance")}</span>
                  </button>
                  <button
                    className={`ai-query-button text-start d-flex align-items-center gap-3 ${aiPrompt === 'workflow' ? 'active' : ''}`}
                    onClick={() => handleTriggerAiSimulator('workflow')}
                  >
                    <span>{t("aiSimulator.btnWorkflow")}</span>
                  </button>
                  <button
                    className={`ai-query-button text-start d-flex align-items-center gap-3 ${aiPrompt === 'agenda' ? 'active' : ''}`}
                    onClick={() => handleTriggerAiSimulator('agenda')}
                  >
                    <span>{t("aiSimulator.btnAgenda")}</span>
                  </button>
                </div>
              </Col>

              <Col lg={7}>
                <div className="ai-simulator-wrapper shadow-extreme">
                  <div className="ai-simulator-console">
                    <div className="ai-console-header">
                      <div className="ai-dot bg-danger"></div>
                      <div className="ai-dot bg-warning"></div>
                      <div className="ai-dot bg-success"></div>
                      <span className="text-muted smaller ms-2">AURA CO-PILOT SYSTEM v2.5</span>
                    </div>

                    <div className="ai-console-body">
                      {aiPrompt === null && (
                        <div className="text-center py-5 text-muted">
                          <Sparkles size={36} className="text-accent mb-3 animate-pulse" />
                          <p className="smaller">{"[ Selecciona un prompt para iniciar la consulta interactiva ]"}</p>
                        </div>
                      )}

                      {aiPrompt !== null && aiTyping && (
                        <div className="py-4 text-accent text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-2 smaller">
                            <span>{t("aiSimulator.typing")}</span>
                          </div>
                          <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}

                      {aiPrompt === 'finance' && !aiTyping && (
                        <div className="ai-response-box text-start">
                          <div className="d-flex align-items-center gap-2 mb-3 text-accent smaller fw-bold">
                            <BarChart3 size={16} />
                            <span>{t("aiSimulator.financeResponse.header")}</span>
                          </div>
                          <p className="text-white smaller mb-3">{t("aiSimulator.financeResponse.message")}</p>
                          
                          {/* Rich generated UI widget */}
                          <div className="p-3 bg-dark rounded border border-secondary mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted smaller">Meta Mensual de Ventas</span>
                              <span className="text-accent fw-bold smaller">84.3%</span>
                            </div>
                            <div className="progress bg-secondary mb-3" style={{ height: '6px', borderRadius: '3px' }}>
                              <div className="progress-bar bg-warning" style={{ width: '84.3%', height: '100%', borderRadius: '3px' }}></div>
                            </div>
                            <div className="row g-2 text-center text-white">
                              <div className="col-6">
                                <div className="p-2 bg-secondary rounded">
                                  <div className="smaller text-muted">Total Líquido</div>
                                  <div className="small fw-bold text-success">$148,250</div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="p-2 bg-secondary rounded">
                                  <div className="smaller text-muted">Caja Activa</div>
                                  <div className="small fw-bold text-warning">Balanceado</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-dark rounded border-start border-accent smaller text-muted">
                            💡 {t("aiSimulator.financeResponse.tip")}
                          </div>
                        </div>
                      )}

                      {aiPrompt === 'workflow' && !aiTyping && (
                        <div className="ai-response-box text-start">
                          <div className="d-flex align-items-center gap-2 mb-3 text-accent smaller fw-bold">
                            <Zap size={16} />
                            <span>{t("aiSimulator.workflowResponse.header")}</span>
                          </div>
                          <p className="text-white smaller mb-3">{t("aiSimulator.workflowResponse.message")}</p>
                          
                          {/* Rich Node connection visualization */}
                          <div className="p-3 bg-dark rounded border border-secondary mb-3">
                            <div className="d-flex align-items-center justify-content-between p-2 rounded bg-secondary mb-2 text-success">
                              <span className="smaller fw-bold">📥 TRIGGER (Mercado Pago)</span>
                              <span className="smaller">Payment Approved</span>
                            </div>
                            <div className="text-center my-1 text-accent" style={{ lineHeight: 1 }}>↓</div>
                            <div className="d-flex align-items-center justify-content-between p-2 rounded bg-secondary mb-2 text-primary">
                              <span className="smaller fw-bold">💬 ACTION (WhatsApp API)</span>
                              <span className="smaller">Dispatch Alert SMS</span>
                            </div>
                            <div className="text-center my-1 text-accent" style={{ lineHeight: 1 }}>↓</div>
                            <div className="d-flex align-items-center justify-content-between p-2 rounded bg-secondary text-warning">
                              <span className="smaller fw-bold">📊 ACTION (PostgreSQL)</span>
                              <span className="smaller">Write Ledger Entry</span>
                            </div>
                          </div>

                          <div className="mt-2 text-accent fw-bold smaller text-end">
                            ● {t("aiSimulator.workflowResponse.status")}
                          </div>
                        </div>
                      )}

                      {aiPrompt === 'agenda' && !aiTyping && (
                        <div className="ai-response-box text-start">
                          <div className="d-flex align-items-center gap-2 mb-3 text-accent smaller fw-bold">
                            <Calendar size={16} />
                            <span>{t("aiSimulator.agendaResponse.header")}</span>
                          </div>
                          <p className="text-white smaller mb-3">{t("aiSimulator.agendaResponse.message")}</p>
                          
                          {/* Mini visual calendar slots */}
                          <div className="p-3 bg-dark rounded border border-secondary mb-3">
                            <div className="row g-2 text-center text-white">
                              <div className="col-4">
                                <div className="p-2 bg-secondary rounded border border-secondary text-muted">
                                  <div className="smaller">14:00</div>
                                  <div className="smaller">Ocupado</div>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="p-2 bg-secondary rounded border border-success text-success">
                                  <div className="smaller">14:30</div>
                                  <div className="smaller fw-bold">Libre</div>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="p-2 bg-secondary rounded border border-success text-success">
                                  <div className="smaller">16:00</div>
                                  <div className="smaller fw-bold">Libre</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button className="btn btn-sm btn-outline-warning w-100 rounded-pill smaller py-2 mt-2">
                            {t("aiSimulator.agendaResponse.action")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* CORE PILLARS / PLATFORM FEATURES */}
        <section id="funcionalidades" className="features-section py-120 bg-soft-grey reveal">
          <Container>
            <div className="text-center mb-5 pb-4">
              <h2 className="fw-black h1 mb-3">{t("features.title")}</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                {t("features.subtitle")}
              </p>
            </div>
            <Row className="g-4">
              {featureCards.map((feat, idx) => (
                <Col md={4} key={idx}>
                  <div className="card-premium h-100 feature-card-hover p-4 border-0">
                    <div className={`${feat.color} mb-3`}>{feat.icon}</div>
                    <h3 className="h5 fw-bold mb-3">{t(`features.${feat.key}.title`)}</h3>
                    <p className="text-muted small mb-0">{t(`features.${feat.key}.desc`)}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* PRICING SECTION */}
        <section id="precios" className="pricing-section py-120 reveal">
          <Container>
            <div className="text-center mb-5 pb-4">
              <h2 className="fw-black h1 mb-3">{t("pricing.title")}</h2>
              <p className="text-muted">{t("pricing.subtitle")}</p>
            </div>
            <Row className="g-4 justify-content-center">
              {plans.map((plan, idx) => (
                <Col lg={4} md={6} key={idx}>
                  <div className={`card-premium h-100 p-5 text-center ${plan.featured ? 'border-accent shadow-accent' : 'border-0'}`}>
                    {plan.featured && <Badge bg="warning" className="text-dark mb-3">{t("pricing.popular")}</Badge>}
                    <h3 className="h5 fw-bold text-muted uppercase mb-2">{t(`pricing.${plan.key}.name`)}</h3>
                    <div className="display-4 fw-black mb-4">{plan.price}<span className="h6 text-muted">{t("pricing.perMonth")}</span></div>
                    <ul className="list-unstyled mb-5 text-start d-inline-block mx-auto">
                      {["f1", "f2", "f3"].map((fk) => (
                        <li key={fk} className="mb-2 small fw-medium d-flex align-items-center gap-2">
                          <CheckCircle size={16} className="text-accent" /> {t(`pricing.${plan.key}.${fk}`)}
                        </li>
                      ))}
                    </ul>
                    <Link to="/app" className={`btn w-100 rounded-pill py-3 fw-bold ${plan.featured ? 'btn-dark' : 'btn-outline-dark'}`}>
                      {t("pricing.cta")}
                    </Link>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      </main>

      <HowItWorksModal show={showManual} onHide={() => setShowManual(false)} />

      <footer className="py-5 border-top bg-white">
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 text-muted small">
            <div className="fw-bold text-dark">{t("footer.copyright")}</div>
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
