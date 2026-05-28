import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";
import { CheckCircle2, Calendar, User, Clock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BookingSuccess() {
  const { t, i18n } = useTranslation("booking");
  const { businessSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { message, booking, color } = location.state || {
    message: t("success.defaultMessage"),
    booking: null,
    color: "#10b981",
  };

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <CheckCircle2 size={48} className="text-success mb-3" />
        <h2 className="fw-bold mb-3">{t("success.fallbackTitle")}</h2>
        <p className="text-muted small">{t("success.fallbackMessage")}</p>
        <Button variant="dark" onClick={() => navigate(`/booking/${businessSlug}`)} className="rounded-pill px-4">
          {t("success.newBooking")}
        </Button>
      </Container>
    );
  }

  const locale = i18n.language === "es" ? "es-AR" : "en-US";
  const apptDate = new Date(booking.startsAt);
  const formattedDate = apptDate.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = apptDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const currencyLocale = i18n.language === "es" ? "es-AR" : "en-US";

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }} className="py-5 d-flex align-items-center">
      <Container style={{ maxWidth: "560px" }}>
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center bg-white">
          <div className="p-4 text-white" style={{ background: color }}>
            <CheckCircle2 size={56} className="mb-2" />
            <h2 className="fw-black h4 mb-0">{t("success.headline")}</h2>
          </div>

          <Card.Body className="p-4 text-start">
            <h3 className="h6 fw-bold text-muted uppercase mb-3">{t("success.summary")}</h3>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex gap-3 align-items-center">
                <div className="p-2 bg-light rounded-circle text-muted">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="small text-muted">{t("success.date")}</div>
                  <div className="fw-bold small text-capitalize">{formattedDate}</div>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="p-2 bg-light rounded-circle text-muted">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="small text-muted">{t("success.time")}</div>
                  <div className="fw-bold small">{formattedTime}</div>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="p-2 bg-light rounded-circle text-muted">
                  <User size={18} />
                </div>
                <div>
                  <div className="small text-muted">{t("success.professional")}</div>
                  <div className="fw-bold small">
                    {booking.worker ? `${booking.worker.firstName} ${booking.worker.lastName}` : t("success.autoAssigned")}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 mb-4">
              <div className="fw-semibold small text-dark mb-1">{t("success.service")}</div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">{booking.service?.name}</span>
                <span className="fw-bold text-dark">
                  {new Intl.NumberFormat(currencyLocale, {
                    style: "currency",
                    currency: i18n.language === "es" ? "ARS" : "USD",
                    maximumFractionDigits: 0,
                  }).format(booking.service?.price || 0)}
                </span>
              </div>
            </div>

            <p className="text-muted text-center small mb-4">
              {t("success.emailNote", { message })}
            </p>

            <div className="d-grid gap-2">
              <Button
                variant="dark"
                onClick={() => navigate(`/booking/${businessSlug}`)}
                className="rounded-pill py-2.5 btn-premium"
                style={{ background: color, borderColor: color }}
              >
                {t("success.back")}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/")}
                className="rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>{t("success.home")}</span>
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
