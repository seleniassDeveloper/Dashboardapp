import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { CheckCircle, Rocket, Zap, BarChart3, Users, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./HowItWorks.css";

export default function HowItWorks() {
  const { t } = useTranslation("views");
  return (
    <div className="guide-container">
      {/* Hero Section */}
      <section className="guide-hero">
        <Badge bg="dark" className="mb-3 px-3 py-2 rounded-pill">{t("howItWorks.badge")}</Badge>
        <h1 className="display-4 fw-black mb-3">{t("howItWorks.heroTitle")}</h1>
        <p className="lead text-secondary max-w-600 mx-auto">{t("howItWorks.heroSubtitle")}</p>
      </section>

      {/* 01. Introducción */}
      <section className="guide-section">
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <div className="section-tag">{t("howItWorks.section1.tag")}</div>
            <h2 className="fw-black mb-4">{t("howItWorks.section1.title")}</h2>
            <p className="text-secondary mb-4">{t("howItWorks.section1.body")}</p>
            <ul className="guide-list">
              <li><CheckCircle size={18} className="text-success" /> <span>{t("howItWorks.section1.li1")}</span></li>
              <li><CheckCircle size={18} className="text-success" /> <span>{t("howItWorks.section1.li2")}</span></li>
              <li><CheckCircle size={18} className="text-success" /> <span>{t("howItWorks.section1.li3")}</span></li>
            </ul>
          </Col>
          <Col lg={6}>
            <div className="guide-img-placeholder shadow-lg">
              <div className="p-5 text-center text-muted">
                {t("howItWorks.section1.placeholder")}
              </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* 02. Recorrido Visual */}
      <section className="guide-section bg-light-soft rounded-xl p-5">
        <div className="text-center mb-5">
          <div className="section-tag">{t("howItWorks.section2.tag")}</div>
          <h2 className="fw-black">{t("howItWorks.section2.title")}</h2>
        </div>
        <Row className="g-4">
          <Col md={4}>
            <div className="guide-card">
              <div className="icon-box"><Calendar size={24} /></div>
              <h4>{t("howItWorks.section2.card1Title")}</h4>
              <p className="small text-secondary">{t("howItWorks.section2.card1Desc")}</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="guide-card">
              <div className="icon-box"><BarChart3 size={24} /></div>
              <h4>{t("howItWorks.section2.card2Title")}</h4>
              <p className="small text-secondary">{t("howItWorks.section2.card2Desc")}</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="guide-card">
              <div className="icon-box"><Users size={24} /></div>
              <h4>{t("howItWorks.section2.card3Title")}</h4>
              <p className="small text-secondary">{t("howItWorks.section2.card3Desc")}</p>
            </div>
          </Col>
        </Row>
      </section>

      {/* 03. Flujo de Trabajo */}
      <section className="guide-section">
        <div className="section-tag text-center">{t("howItWorks.section3.tag")}</div>
        <h2 className="fw-black text-center mb-5">{t("howItWorks.section3.title")}</h2>
        <div className="workflow-steps">
          <div className="step-item">
            <div className="step-num">1</div>
            <h5>{t("howItWorks.section3.step1Title")}</h5>
            <p className="small text-secondary">{t("howItWorks.section3.step1Desc")}</p>
          </div>
          <ArrowRight className="step-arrow d-none d-md-block" />
          <div className="step-item">
            <div className="step-num">2</div>
            <h5>{t("howItWorks.section3.step2Title")}</h5>
            <p className="small text-secondary">{t("howItWorks.section3.step2Desc")}</p>
          </div>
          <ArrowRight className="step-arrow d-none d-md-block" />
          <div className="step-item">
            <div className="step-num">3</div>
            <h5>{t("howItWorks.section3.step3Title")}</h5>
            <p className="small text-secondary">{t("howItWorks.section3.step3Desc")}</p>
          </div>
        </div>
      </section>

      {/* 04. Automatizaciones */}
      <section className="guide-section bg-dark text-white rounded-xl p-5 shadow-lg">
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <Zap size={48} className="text-warning mb-4" />
            <h2 className="fw-black mb-4">{t("howItWorks.section4.title")}</h2>
            <p className="text-light opacity-75 mb-4">{t("howItWorks.section4.body")}</p>
            <div className="d-flex gap-3">
              <div className="badge bg-secondary">WhatsApp</div>
              <div className="badge bg-secondary">Email</div>
              <div className="badge bg-secondary">Push</div>
            </div>
          </Col>
          <Col lg={6}>
            <div className="bg-white rounded-lg p-4 text-dark shadow">
              <h6 className="fw-bold mb-2">{t("howItWorks.section4.previewTitle")}</h6>
              <div className="p-3 bg-light rounded small italic">
                {t("howItWorks.section4.preview")}
              </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* 05. FAQ */}
      <section className="guide-section pb-5">
        <h2 className="fw-black mb-5 text-center">{t("howItWorks.faq.title")}</h2>
        <Row className="g-4">
          <Col md={6}>
            <div className="p-4 border rounded-xl h-100">
              <h6 className="fw-bold">{t("howItWorks.faq.q1")}</h6>
              <p className="small text-secondary m-0">{t("howItWorks.faq.a1")}</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="p-4 border rounded-xl h-100">
              <h6 className="fw-bold">{t("howItWorks.faq.q2")}</h6>
              <p className="small text-secondary m-0">{t("howItWorks.faq.a2")}</p>
            </div>
          </Col>
        </Row>
      </section>

      {/* Cierre */}
      <footer className="guide-footer text-center py-5">
        <Rocket size={48} className="mb-4 text-primary" />
        <h2 className="fw-black mb-3">{t("howItWorks.footer.title")}</h2>
        <p className="text-secondary mb-5">{t("howItWorks.footer.subtitle")}</p>
        <button className="btn-premium px-5 py-3">{t("howItWorks.footer.cta")}</button>
      </footer>
    </div>
  );
}
