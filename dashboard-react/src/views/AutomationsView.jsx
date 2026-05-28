import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { Zap, MessageSquare, Mail, Bell, Globe, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

const AUTO_SERVICES = [
  { id: 1, key: "whatsapp", icon: <MessageSquare />, active: true },
  { id: 2, key: "email", icon: <Mail />, active: true },
  { id: 3, key: "push", icon: <Bell />, active: false },
  { id: 4, key: "bot", icon: <Bot />, active: false },
];

export default function AutomationsView() {
  const { t } = useTranslation("views");
  return (
    <Container fluid className="p-0">
      <header className="mb-4">
        <h1 className="fw-bold h3">{t("automations.title")}</h1>
        <p className="text-muted">{t("automations.subtitle")}</p>
      </header>

      <Row className="g-4">
        {AUTO_SERVICES.map(service => (
          <Col md={6} key={service.id}>
            <div className="card-premium p-4 d-flex align-items-start justify-content-between hover-scale">
              <div className="d-flex gap-4">
                <div className="p-3 rounded-xl bg-light text-primary" style={{ height: 'fit-content' }}>
                  {React.cloneElement(service.icon, { size: 24 })}
                </div>
                <div>
                  <h3 className="h6 fw-bold mb-1">{t(`automations.services.${service.key}.name`)}</h3>
                  <p className="text-muted small mb-0" style={{ maxWidth: '300px' }}>
                    {t(`automations.services.${service.key}.desc`)}
                  </p>
                </div>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" checked={service.active} readOnly style={{ width: '40px', height: '20px', cursor: 'pointer' }} />
              </div>
            </div>
          </Col>
        ))}

        <Col md={12}>
          <div className="card-premium p-5 text-center bg-gradient-light border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <Zap size={40} className="text-warning mb-3" />
            <h4 className="fw-bold">{t("automations.comingSoonTitle")}</h4>
            <p className="text-muted mb-4">{t("automations.comingSoonDesc")}</p>
            <Badge bg="dark" className="px-3 py-2">{t("automations.comingSoonBadge")}</Badge>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
