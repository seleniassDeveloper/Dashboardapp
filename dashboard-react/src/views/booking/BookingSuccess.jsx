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

  const { message, booking, bookings, color } = location.state || {
    message: t("success.defaultMessage"),
    booking: null,
    bookings: null,
    color: "#10b981",
  };

  const list = bookings || (booking ? [booking] : []);

  if (list.length === 0) {
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
  const currencyLocale = i18n.language === "es" ? "es-AR" : "en-US";

  // Sumar totales de todos los servicios en la reserva
  const totalPrice = list.reduce((sum, appt) => sum + (appt.service?.price || 0), 0);
  const totalDownpayment = list.reduce((sum, appt) => sum + (appt.downpaymentPaid || 0), 0);
  const hasDownpayment = list.some((appt) => appt.downpaymentPaid > 0);
  const transactionId = list.find((appt) => appt.downpaymentTransactionId)?.downpaymentTransactionId;

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }} className="py-5 d-flex align-items-center">
      <Container style={{ maxWidth: "560px" }}>
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center bg-white">
          <div className="p-4 text-white" style={{ background: color }}>
            <CheckCircle2 size={56} className="mb-2 mx-auto" />
            <h2 className="fw-black h4 mb-0">{t("success.headline")}</h2>
          </div>

          <Card.Body className="p-4 text-start">
            <h3 className="h6 fw-bold text-muted uppercase mb-3">{t("success.summary")}</h3>

            <div className="d-flex flex-column gap-3 mb-4">
              {list.map((appt, index) => {
                const apptDate = new Date(appt.startsAt);
                const formattedDate = apptDate.toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const formattedTime = apptDate.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={appt.id || index} className="p-3 border rounded-3 bg-light bg-opacity-40 shadow-sm">
                    <div className="fw-bold small text-dark mb-2 d-flex justify-content-between">
                      <span>Turno {index + 1}: {appt.service?.name}</span>
                      <span style={{ color: color }}>
                        {new Intl.NumberFormat(currencyLocale, {
                          style: "currency",
                          currency: i18n.language === "es" ? "ARS" : "USD",
                          maximumFractionDigits: 0,
                        }).format(appt.service?.price || 0)}
                      </span>
                    </div>
                    <div className="d-flex flex-column gap-1 text-muted smaller" style={{ fontSize: "12px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <Calendar size={13} className="text-muted" />
                        <span className="text-capitalize">{formattedDate}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Clock size={13} className="text-muted" />
                        <span>{formattedTime} hs</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <User size={13} className="text-muted" />
                        <span>{appt.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : t("success.autoAssigned")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasDownpayment && (
              <div className="p-3 rounded-3 mb-4 border border-opacity-25" style={{ background: `${color}06`, borderColor: color }}>
                <div className="fw-bold small d-flex align-items-center gap-2 mb-2" style={{ color: color }}>
                  <CheckCircle2 size={16} />
                  <span>Seña Abonada Exitosamente</span>
                </div>
                <div className="d-flex justify-content-between text-muted small mb-1">
                  <span>Monto Total de la Seña:</span>
                  <span className="fw-bold text-dark">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: i18n.language === "es" ? "ARS" : "USD",
                      maximumFractionDigits: 0,
                    }).format(totalDownpayment)}
                  </span>
                </div>
                {transactionId && (
                  <div className="d-flex justify-content-between text-muted small mb-1" style={{ fontSize: "11px" }}>
                    <span>Código de Pago:</span>
                    <span className="font-monospace text-dark">{transactionId}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between text-muted small mt-2 pt-2 border-top">
                  <span>Saldo restante a pagar en el salón:</span>
                  <span className="fw-bold text-success">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: i18n.language === "es" ? "ARS" : "USD",
                      maximumFractionDigits: 0,
                    }).format(totalPrice - totalDownpayment)}
                  </span>
                </div>
              </div>
            )}

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
