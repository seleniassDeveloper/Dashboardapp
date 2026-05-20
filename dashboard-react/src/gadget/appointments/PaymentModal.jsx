import React, { useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { PAYMENT_AR } from "../../config/paymentAR";

function safeMoney(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function PaymentModal({ show, onHide, appt }) {
  const clientName = useMemo(() => {
    const c = appt?.client;
    return [c?.firstName, c?.lastName].filter(Boolean).join(" ") || "Cliente";
  }, [appt]);

  const serviceName = appt?.service?.name || appt?.serviceName || "Servicio";
  const phone = appt?.client?.phone || "";
  const email = appt?.client?.email || "";

  const defaultAmount = useMemo(() => {
    // si guardás precio en service.price usalo; si no, 0
    const p = appt?.service?.price ?? appt?.price ?? 0;
    return safeMoney(p);
  }, [appt]);

  const [amount, setAmount] = useState(defaultAmount);
  const [copied, setCopied] = useState("");

  const alias = PAYMENT_AR.alias;
  const cbu = PAYMENT_AR.cbu;
  const qrUrl = PAYMENT_AR.mpQrUrl;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("No pude copiar 😕");
      setTimeout(() => setCopied(""), 1500);
    }
  };

  const openWhatsApp = () => {
    const digits = String(phone).replace(/\D/g, "");
    if (!digits) return;

    const msg = encodeURIComponent(
      `Hola ${clientName}! 👋\n\nTe paso los datos para abonar la cita:\n` +
      `• Servicio: ${serviceName}\n` +
      `• Total: $${amount}\n\n` +
      `Transferencia:\n` +
      `• Alias: ${alias}\n` +
      (cbu ? `• CBU: ${cbu}\n` : "") +
      (PAYMENT_AR.cuit ? `• CUIT: ${PAYMENT_AR.cuit}\n` : "") +
      `\nCuando lo tengas, enviame el comprobante. Gracias! 🙌`
    );

    // Argentina: a veces wa.me necesita +54; si tu phone ya lo incluye, ok.
    // Si guardas sin país, podés anteponer 54 manualmente.
    const url = `https://wa.me/${digits}?text=${msg}`;
    window.open(url, "_blank");
  };

  const openMail = () => {
    if (!email) return;
    const subject = encodeURIComponent(`Pago de cita - ${serviceName}`);
    const body = encodeURIComponent(
      `Hola ${clientName},\n\nTe paso los datos para abonar la cita:\n` +
      `Servicio: ${serviceName}\n` +
      `Total: $${amount}\n\n` +
      `Transferencia:\n` +
      `Alias: ${alias}\n` +
      (cbu ? `CBU: ${cbu}\n` : "") +
      (PAYMENT_AR.cuit ? `CUIT: ${PAYMENT_AR.cuit}\n` : "") +
      `\n\nGracias!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Datos de cobro</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {copied ? <Alert variant="success">{copied}</Alert> : null}

        <Form className="custom-form">
        <Row className="g-3 mb-2">
          <Col md={6}>
            <Form.Label>Cliente a cobrar</Form.Label>
            <div className="fw-semibold">{clientName}</div>
          </Col>

          <Col md={6}>
            <Form.Label>Servicio de la cita</Form.Label>
            <div className="fw-semibold">{serviceName}</div>
          </Col>

          <Col md={12}>
            <Form.Label htmlFor="payment-amount">Monto total a cobrar ($)</Form.Label>
            <Form.Control
              id="payment-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </Col>
        </Row>
        </Form>

        <hr />

        <div className="d-flex align-items-center justify-content-between gap-2">
          <div>
            <Form.Label className="mb-1">Alias de transferencia</Form.Label>
            <div className="fw-semibold">{alias}</div>
          </div>
          <Button size="sm" variant="outline-dark" onClick={() => copy(alias, "Alias copiado ✅")}>
            Copiar
          </Button>
        </div>

        {cbu ? (
          <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
            <div>
              <Form.Label className="mb-1">CBU para transferencia</Form.Label>
              <div className="fw-semibold">{cbu}</div>
            </div>
            <Button size="sm" variant="outline-dark" onClick={() => copy(cbu, "CBU copiado ✅")}>
              Copiar
            </Button>
          </div>
        ) : null}

        {qrUrl ? (
          <>
            <hr />
            <Form.Label className="mb-2">Código QR (Mercado Pago)</Form.Label>
            <img src={qrUrl} alt="QR de pago" style={{ width: "100%", borderRadius: 12, marginTop: 8 }} />
          </>
        ) : null}

        <hr />

        <div className="d-flex gap-2 flex-wrap">
          <Button variant="success" onClick={openWhatsApp} disabled={!String(phone).trim()}>
            Enviar por WhatsApp
          </Button>
          <Button variant="outline-secondary" onClick={openMail} disabled={!String(email).trim()}>
            Enviar por Email
          </Button>
        </div>

        {!phone && (
          <div className="text-muted mt-2" style={{ fontSize: 12 }}>
            * No hay teléfono del cliente cargado.
          </div>
        )}
        {!email && (
          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
            * No hay email del cliente cargado.
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="dark" onClick={onHide}>Listo</Button>
      </Modal.Footer>
    </Modal>
  );
}