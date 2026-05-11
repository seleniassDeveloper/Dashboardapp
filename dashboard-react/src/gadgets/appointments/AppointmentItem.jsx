// src/gadgets/appointments/AppointmentItem.jsx
import React, { useMemo, useState } from "react";
import { ListGroup, Button, Form, Modal, Badge, Alert } from "react-bootstrap";
import { Edit2, Trash2 } from "lucide-react";

// ✅ Config simple AR (solo datos de transferencia, NO afecta el teléfono)
const PAYMENT_AR = {
  businessName: "Tu negocio",
  currency: "ARS",
  alias: "TU.ALIAS.AQUI",
  cbu: "0000000000000000000000",
  holder: "Nombre Titular",
  bank: "Banco",
  mpLink: "", // opcional
};

function statusLabel(status) {
  const map = {
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    DONE: "Finalizada",
  };
  return map[status] || status || "—";
}

function statusColor(status) {
  if (status === "CONFIRMED") return "#198754";
  if (status === "CANCELLED") return "#dc3545";
  if (status === "DONE") return "#6c757d";
  return "#198754";
}

function formatDateTime(startsAt) {
  if (!startsAt) return "—";
  const d = new Date(startsAt);
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function moneyARS(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

/**
 * ✅ Convierte teléfono al formato que WhatsApp necesita:
 * - Respeta si viene con + (ej +1 (626)...)
 * - Limpia espacios/()/- etc
 * - NO agrega ningún país automáticamente
 * Retorna string para wa.me (solo dígitos, sin +) o "" si inválido
 */
function toWhatsAppPhone(rawPhone) {
  const raw = String(rawPhone || "").trim();
  if (!raw) return "";

  // dejamos solo dígitos y +
  let cleaned = raw.replace(/[^\d+]/g, "");

  // si empieza con + => e164, sacamos el + para wa.me
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (digits.length < 8) return "";
    return digits;
  }

  // si no tiene +, usamos solo dígitos tal cual (sin inventar país)
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8) return "";
  return digits;
}

export default function AppointmentItem({ appt, onEdit, onDelete, onChangeStatus }) {
  const [showPay, setShowPay] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [payMethod, setPayMethod] = useState("TRANSFER");

  const clientName =
    appt?.client
      ? `${appt.client.firstName || ""} ${appt.client.lastName || ""}`.trim()
      : (appt?.clientName || "").trim();

  const workerName = (() => {
    const fromRel = appt?.worker
      ? `${appt.worker.firstName || ""} ${appt.worker.lastName || ""}`.trim()
      : "";
    if (fromRel) return fromRel;

    const fromSnap = `${appt?.workerFirstName || ""} ${appt?.workerLastName || ""}`.trim();
    if (fromSnap) return fromSnap;

    return (appt?.workerName || "").trim() || "—";
  })();

  const serviceName = (appt?.service?.name || appt?.serviceName || "Servicio").trim();
  const when = formatDateTime(appt?.startsAt);
  const notes = appt?.notes?.trim();
  const border = statusColor(appt?.status);

  // Precio
  const price = useMemo(() => appt?.service?.price ?? appt?.price ?? null, [appt]);

  // Teléfono del cliente (tal cual viene)
  const rawPhone = appt?.client?.phone || appt?.phone || "";
  const waPhone = useMemo(() => toWhatsAppPhone(rawPhone), [rawPhone]);

  // WhatsApp URL con texto
  const waUrl = useMemo(() => {
    if (!waPhone) return null;

    const transferLines =
      payMethod === "TRANSFER"
        ? [
            "• Transferencia:",
            `  - Alias: ${PAYMENT_AR.alias}`,
            PAYMENT_AR.cbu ? `  - CBU: ${PAYMENT_AR.cbu}` : null,
            `  - Titular: ${PAYMENT_AR.holder}`,
            PAYMENT_AR.bank ? `  - Banco: ${PAYMENT_AR.bank}` : null,
          ]
        : [];

    const msgLines = [
      `Hola ${clientName || "👋"}!`,
      "",
      "Tu turno fue finalizado ✅",
      "",
      `🧾 Servicio: ${serviceName}`,
      `📅 Fecha: ${when}`,
      `💰 Total: ${moneyARS(price)}`,
      "",
      "💳 Formas de pago:",
      ...transferLines.filter(Boolean),
      PAYMENT_AR.mpLink ? `• Link MercadoPago: ${PAYMENT_AR.mpLink}` : null,
      "",
      "Gracias 🙌",
      PAYMENT_AR.businessName ? `${PAYMENT_AR.businessName}` : null,
    ].filter(Boolean);

    const text = msgLines.join("\n");
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  }, [waPhone, clientName, serviceName, when, price, payMethod]);

  const handleSelectStatus = (nextStatus) => {
    if (nextStatus === "DONE") {
      setPendingStatus("DONE");
      setShowPay(true);
      return;
    }
    onChangeStatus?.(appt, nextStatus);
  };

  const confirmPaymentAndFinish = () => {
    onChangeStatus?.(appt, "DONE");
    setShowPay(false);
    setPendingStatus(null);
  };

  const cancelPaymentModal = () => {
    setShowPay(false);
    setPendingStatus(null);
    setPayMethod("TRANSFER");
  };

  const sendWhatsApp = () => {
    if (!waUrl) return;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <ListGroup.Item
        className="appointment-card mb-2"
        style={{
          borderLeft: `4px solid ${border}`,
        }}
      >
        <div className="d-flex align-items-center justify-content-between gap-3">
          {/* Info Principal */}
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <div className="appt-time-box">
              <span className="appt-time">{new Date(appt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="appt-date">{new Date(appt.startsAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}</span>
            </div>
            
            <div className="appt-main-info">
              <h5 className="appt-client-name m-0">{clientName || "Cliente"}</h5>
              <div className="appt-details">
                <span className="appt-worker">con {workerName}</span>
                <span className="appt-divider">•</span>
                <span className="appt-service">{serviceName}</span>
              </div>
            </div>
          </div>

          {/* Acciones y Estado */}
          <div className="d-flex align-items-center gap-2">
            <div className="appt-status-badge" style={{ backgroundColor: `${border}15`, color: border, borderColor: `${border}30` }}>
              <Form.Select
                size="sm"
                value={appt?.status || "CONFIRMED"}
                onChange={(e) => handleSelectStatus(e.target.value)}
                className="appt-status-select-transparent"
                style={{ color: border }}
              >
                <option value="CONFIRMED">Confirmada</option>
                <option value="DONE">Finalizada</option>
                <option value="CANCELLED">Cancelada</option>
              </Form.Select>
            </div>

            <div className="appt-actions d-flex gap-1">
              <Button variant="link" className="p-1 text-muted hover-dark" onClick={() => onEdit?.(appt)}>
                <Edit2 size={14} />
              </Button>
              <Button variant="link" className="p-1 text-muted hover-danger" onClick={() => onDelete?.(appt)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>
      </ListGroup.Item>

      {/* ✅ MODAL PAGO */}
      <Modal show={showPay} onHide={cancelPaymentModal} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Registrar pago</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="d-grid gap-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Cliente
                </div>
                <div className="fw-semibold">{clientName || "—"}</div>
              </div>
              <Badge bg="secondary">Finalizar</Badge>
            </div>

            <div className="d-flex justify-content-between gap-3">
              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Servicio
                </div>
                <div className="fw-semibold">{serviceName}</div>
              </div>
              <div className="text-end">
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Total
                </div>
                <div className="fw-semibold">{moneyARS(price)}</div>
              </div>
            </div>

            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Trabajador
              </div>
              <div className="fw-semibold">{workerName || "—"}</div>
            </div>

            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Fecha
              </div>
              <div className="fw-semibold">{when}</div>
            </div>

            <hr className="my-2" />

            <Form.Group>
              <Form.Label>Método de pago</Form.Label>
              <Form.Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="TRANSFER">Transferencia</option>
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="OTHER">Otro</option>
              </Form.Select>
            </Form.Group>

            {payMethod === "TRANSFER" && (
              <div className="p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <div className="fw-semibold" style={{ marginBottom: 6 }}>
                  Datos para transferencia
                </div>
                <div style={{ fontSize: 13 }}>
                  <div>
                    <span className="text-muted">Alias:</span> <b>{PAYMENT_AR.alias}</b>
                  </div>
                  <div>
                    <span className="text-muted">Titular:</span> <b>{PAYMENT_AR.holder}</b>
                  </div>
                  <div>
                    <span className="text-muted">Banco:</span> <b>{PAYMENT_AR.bank}</b>
                  </div>
                  {PAYMENT_AR.cbu ? (
                    <div>
                      <span className="text-muted">CBU:</span> <b>{PAYMENT_AR.cbu}</b>
                    </div>
                  ) : null}
                  {PAYMENT_AR.mpLink ? (
                    <div className="mt-2">
                      <a href={PAYMENT_AR.mpLink} target="_blank" rel="noreferrer">
                        Abrir link MercadoPago
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {!waPhone ? (
              <Alert variant="warning" className="mb-0">
                El cliente no tiene teléfono válido. Guardalo con código de país, por ejemplo: <b>+16263849997</b>
              </Alert>
            ) : (
              <Button variant="success" onClick={sendWhatsApp}>
                Enviar por WhatsApp
              </Button>
            )}

            <div className="text-muted" style={{ fontSize: 12 }}>
              WhatsApp se abrirá con el mensaje listo para enviar (no se envía solo).
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={cancelPaymentModal}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={confirmPaymentAndFinish}>
            Confirmar pago y finalizar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}