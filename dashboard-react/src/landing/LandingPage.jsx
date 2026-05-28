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
  Globe
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
    }, 2500);
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
    { title: t("howItWorks.step3.title"), img: dashClients, desc: t("howItWorks.step3.desc") },
    { title: t("howItWorks.step4.title"), img: dashTeam, desc: t("howItWorks.step4.desc") },
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

  const featureCards = [
    { key: "appointments", icon: <Calendar size={24}/>, color: "text-success" },
    { key: "clients", icon: <Users size={24}/>, color: "text-primary" },
    { key: "automation", icon: <Zap size={24}/>, color: "text-warning" },
    { key: "metrics", icon: <BarChart3 size={24}/>, color: "text-danger" },
    { key: "multiDevice", icon: <Globe size={24}/>, color: "text-info" },
    { key: "aiSupport", icon: <Zap size={24}/>, color: "text-accent" },
  ];

  const plans = [
    { key: "individual", price: "$5", featured: false },
    { key: "professional", price: "$7", featured: true },
    { key: "business", price: "$10", featured: false }
  ];

  return (
    <div className="landing-premium">
      <MainNavbar onHowItWorks={() => setShowManual(true)} />

      <main>
        {/* HERO SECTION */}
        <section className="hero-section py-5 reveal">
          <Container>
            <Row className="align-items-center g-5">
              <Col lg={6}>
                <Badge bg="dark" className="mb-4 px-3 py-2 rounded-pill fw-bold">{t("hero.badge")}</Badge>
                <h1 className="display-3 fw-black mb-4">
                  {t("hero.titleLine1")} <br/>
                  <span className="text-accent">{t("hero.titleLine2")}</span>
                </h1>
                <p className="lead text-muted mb-5 pe-lg-5">
                  {t("hero.subtitle")}
                </p>
                <div className="d-flex gap-3">
                  <Link to="/app" className="btn-premium px-5 py-3 text-decoration-none shadow-lg">
                    {t("hero.ctaPrimary")}
                  </Link>
                  <button onClick={() => setShowManual(true)} className="btn-outline-premium px-5 py-3">
                    {t("hero.ctaSecondary")}
                  </button>
                </div>
              </Col>
              <Col lg={6}>
                <div className="hero-product-shot">
                  <HeroImageStack />

                  {/* Floating Callouts para dar profundidad */}
                  <div className="floating-card metrics-card card-premium shadow-lg">
                    <BarChart3 size={20} className="text-accent mb-2" />
                    <div className="fw-bold">+24%</div>
                    <div className="text-muted smaller">{t("hero.metricsEfficiency")}</div>
                  </div>
                  <div className="floating-card users-card card-premium shadow-lg">
                    <Users size={20} className="text-primary mb-2" />
                    <div className="fw-bold">540+</div>
                    <div className="text-muted smaller">{t("hero.metricsClients")}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* FEATURES SECTION */}
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
