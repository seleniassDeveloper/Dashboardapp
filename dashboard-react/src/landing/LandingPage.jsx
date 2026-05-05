import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./styles/landing.css";
import "./styles/hero.css";
import "./styles/scrollReveal.css";
import "./styles/productCards.css";
import "./styles/FeatureRow.css";
import "./styles/Pricing.css";

import portadaImg from "@dw/assets/Inicial.png";
import heroImg from "@dw/assets/imageseccion4.png";
import productImg from "@dw/assets/imageseccion4.png";

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Hero() {
  return (
    <section className="hero hero--animated">
      <div className="hero-card">
        <div className="hero-orb hero-orb--one" />
        <div className="hero-orb hero-orb--two" />

        <div className="hero-text-block hero-enter-left">
          <span className="hero-kicker">Dashboard + IA</span>

          <h1 className="hero-title">
            Organiza tu negocio,
            <br />
            clientes
            <br />
            y tareas en un solo
            <br />
            dashboard.
          </h1>

          <p className="hero-description">
            Gestiona citas, trabajadores, servicios, clientes y métricas desde
            una sola plataforma.
          </p>

          <div className="hero-buttons hero-enter-up">
            <Link className="hero-btn hero-btn-primary" to="/app">
              Iniciar prueba
            </Link>

            <a className="hero-btn hero-btn-secondary" href="#como-funciona">
              Ver cómo funciona
            </a>
          </div>
        </div>

        <div className="hero-image-container hero-enter-right">
          <div className="hero-image-frame hero-float-soft">
            <img
              src={heroImg}
              alt="Vista del dashboard"
              className="hero-image"
            />
          </div>

          <div className="hero-callout hero-callout--metrics">
            <span className="hero-callout__label">Métricas</span>
            <strong className="hero-callout__text">Estado en tiempo real</strong>
          </div>

          <div className="hero-callout hero-callout--calendar">
            <span className="hero-callout__label">Calendario</span>
            <strong className="hero-callout__text">Control visual del día</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingExplainer() {
  return (
    <section id="como-funciona" className="reveal landing-explainer">
      <div className="landing-explainer__intro">
        <div className="landing-explainer__header">
          <span className="landing-explainer__eyebrow">Cómo funciona</span>
          <h2 className="landing-explainer__title">
            Entiende el dashboard en menos de un minuto
          </h2>
        </div>

        <p className="landing-explainer__lead">
          Todo ocurre en una sola plataforma: entiendes el estado general del
          negocio, gestionas la operación diaria y revisas calendario, pagos y
          rendimiento sin cambiar de vista.
        </p>
      </div>

      <div className="landing-explainer__layout">
        <div className="landing-explainer__visual">
          <div className="landing-explainer__imageFrame">
            <img
              src={portadaImg}
              alt="Vista principal del dashboard"
              className="landing-explainer__image"
            />
          </div>

          <div className="landing-explainer__note landing-explainer__note--metrics">
            <span>Métricas en tiempo real</span>
            <small>Monitorea el estado del negocio en instante</small>
          </div>

          <div className="landing-explainer__note landing-explainer__note--citas">
            <span>Gestión de citas</span>
            <small>Edita estados, clientes y servicios fácilmente.</small>
          </div>

          <div className="landing-explainer__note landing-explainer__note--calendar">
            <span>Calendario integrado</span>
            <small>Organización clara por horarios</small>
          </div>

          <div className="landing-explainer__note landing-explainer__note--insights">
            <span>Entender qué está pasando</span>
            <small>Con métricas visuales puedes detectar rápidamente el rendimiento.</small>
          </div>
        </div>

        <div className="landing-explainer__content">
          <div className="landing-explainer__steps">
            <article className="landing-explainer__step">
              <div className="landing-explainer__stepNumber">1</div>
              <div>
                <h3>Revisa el panorama general</h3>
                <p>
                  Consulta métricas, gráficos y estados para entender qué está
                  pasando hoy en tu negocio.
                </p>
              </div>
            </article>

            <article className="landing-explainer__step">
              <div className="landing-explainer__stepNumber">2</div>
              <div>
                <h3>Gestiona la operación diaria</h3>
                <p>
                  Filtra citas, cambia estados, edita registros y mantén el flujo
                  de trabajo ordenado.
                </p>
              </div>
            </article>

            <article className="landing-explainer__step">
              <div className="landing-explainer__stepNumber">3</div>
              <div>
                <h3>Decide con datos reales</h3>
                <p>
                  Usa calendario, pagos y rentabilidad para detectar cargas,
                  ingresos y oportunidades de mejora.
                </p>
              </div>
            </article>
          </div>

          <div className="landing-explainer__miniGrid">
            <div className="landing-explainer__miniCard">
              <strong className="landing-explainer__miniCardTitle">
                Panel principal
              </strong>
              <span className="landing-explainer__miniCardDesc">
                Métricas, gráficos y visión general
              </span>
            </div>
            <div className="landing-explainer__miniCard">
              <strong className="landing-explainer__miniCardTitle">
                Lista de citas
              </strong>
              <span className="landing-explainer__miniCardDesc">
                Estados, filtros y seguimiento diario
              </span>
            </div>
            <div className="landing-explainer__miniCard">
              <strong className="landing-explainer__miniCardTitle">
                Calendario
              </strong>
              <span className="landing-explainer__miniCardDesc">
                Organización clara de horarios
              </span>
            </div>
            <div className="landing-explainer__miniCard">
              <strong className="landing-explainer__miniCardTitle">
                Pagos y rentabilidad
              </strong>
              <span className="landing-explainer__miniCardDesc">
                Ingresos, ticket promedio y cierre
              </span>
            </div>
          </div>

          <div className="landing-explainer__actions">
            <Link className="landing-explainer__btn landing-explainer__btn--primary" to="/app">
              Ver demo
            </Link>
            <a
              className="landing-explainer__btn landing-explainer__btn--secondary"
              href="/manual_dashboard_completo_clientes.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Descargar manual
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCards() {
  return (
    <section className="product-deep">
      <div className="product-deep__wrapper">
        <div className="product-deep__intro">
          <span className="product-deep__eyebrow">Vista del producto</span>
          <h2>Una interfaz pensada para el día a día</h2>
          <p>
            Calendario, citas y métricas en la misma pantalla para que no pierdas
            el hilo de la operación.
          </p>
        </div>

        <div className="product-deep__visual">
          <img
            src={productImg}
            alt="Dashboard con calendario, métricas y gestión de citas"
            className="product-deep__image"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureRow() {
  return (
    <section className="featureRow">
      <p className="featureRow__text">
        No es solo un panel visual: es el espacio donde la{" "}
        <strong>operación de tu negocio</strong> se organiza, se conecta y se
        convierte en <strong>decisiones claras</strong>.
      </p>
    </section>
  );
}

function Pricing() {
  const plans = [
    { id: "individual-5", title: "Dashboard Individual", priceLabel: "$5", featured: false },
    { id: "individual-7", title: "Dashboard Individual", priceLabel: "$7", featured: true },
    { id: "team-10", title: "Team", priceLabel: "$10", featured: false },
  ];

  return (
    <section className="pricing">
      <p className="pricing__eyebrow">Precios</p>
      <h2 className="pricing__title">Elige tu plan</h2>
      <p className="pricing__subtitle">
        Planes simples. Sin permanencia innecesaria. Pagas y empiezas.
      </p>

      <div className="pricing__grid">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`pricing__card ${p.featured ? "pricing__card--featured" : ""}`}
          >
            <p className="pricing__label">{p.title}</p>
            <p className="pricing__price">{p.priceLabel}</p>
            <Link
              className={`pricing__button ${p.featured ? "pricing__button--featured" : ""}`}
              to="/app"
            >
              Contratar
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  useScrollReveal();

  return (
    <div className="page home-page">
      <main className="stack home-main">
        <section className="reveal">
          <Hero />
        </section>

        <LandingExplainer />

        <section className="reveal">
          <ProductCards />
        </section>

        <section className="reveal">
          <FeatureRow />
        </section>

        <section className="reveal">
          <Pricing />
        </section>
      </main>
    </div>
  );
}

