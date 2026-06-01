import React, { useMemo } from "react";
import { Modal, Button, Table, Badge } from "react-bootstrap";
import { MessageSquare, Edit2, Calendar, User, Clock, DollarSign, AlertCircle, X, Mail } from "lucide-react";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function statusBadgeBg(status) {
  const map = {
    PENDING: "warning-soft text-warning border-warning",
    CONFIRMED: "success-soft text-success border-success",
    CANCELLED: "danger-soft text-danger border-danger",
    DONE: "secondary-soft text-secondary border-secondary",
  };
  return map[status] || "secondary-soft text-dark";
}

function statusLabel(status) {
  const map = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    DONE: "Finalizada",
  };
  return map[status] || status || "—";
}

export default function AgendaSummaryDetailModal({
  show,
  data,
  onHide,
  onEdit,
  onSendWhatsApp,
  onSendEmail,
  onMarkSenaPaid, // New callback
}) {
  if (!data) return null;

  const { type, title, appointments = [] } = data;

  const handleSendSenaReminder = (appt) => {
    const clientName = appt.client?.firstName || "Cliente";
    const serviceName = appt.service?.name || "Servicio";
    const startsAt = appt.startsAt;
    
    const dateStr = startsAt 
      ? new Date(startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
      : "el día agendado";
    const timeStr = startsAt 
      ? new Date(startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
      : "";

    const price = Number(appt.service?.price || 0);
    const senaPercentAmount = Math.round(price * 0.3);

    const text = `¡Hola ${clientName}! Te recordamos reservar tu turno en Aura Studio para el día ${dateStr} a las ${timeStr} hs para el servicio de ${serviceName} abonando la seña del 30% (${currency(senaPercentAmount)}). Podés realizar tu transferencia al alias: aura.studio.mp. ¡Muchas gracias!`;
    window.open(`https://wa.me/${appt.client?.phone || ""}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const isFinancial = type === "estimatedRev";

  // Calcular totales para la vista financiera
  const financialTotals = useMemo(() => {
    if (!isFinancial) return null;
    let totalPrices = 0;
    let totalSenas = 0;
    let totalPending = 0;

    appointments.forEach((a) => {
      const price = Number(a.service?.price || 0);
      const sena = Number(a.señaAmount || 0);
      totalPrices += price;
      totalSenas += sena;
      totalPending += Math.max(price - sena, 0);
    });

    return { totalPrices, totalSenas, totalPending };
  }, [appointments, isFinancial]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size={isFinancial ? "xl" : "lg"}
      className="hegemonic-modal summary-detail-modal"
    >
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-black h5 text-dark d-flex align-items-center gap-2">
          <span>{title}</span>
          <Badge bg="dark" className="rounded-pill px-2.5 py-1" style={{ fontSize: "11px" }}>
            {appointments.length} {appointments.length === 1 ? "registro" : "registros"}
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-2">
        {appointments.length === 0 ? (
          <div className="summary-detail-empty-state d-flex flex-column align-items-center justify-content-center py-5">
            <AlertCircle size={36} className="text-muted mb-2 animate-bounce" />
            <h6 className="fw-bold text-dark mb-1">Sin reservas registradas</h6>
            <p className="text-muted smaller mb-0">No se encontraron citas que coincidan con esta categoría para hoy.</p>
          </div>
        ) : isFinancial ? (
          /* DETALLE FINANCIERO */
          <div className="overflow-auto border rounded-4 bg-white">
            <Table responsive hover className="summary-detail-finance-table mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Profesional</th>
                  <th className="text-end">Precio Total</th>
                  <th className="text-end">Seña Pagada</th>
                  <th className="text-end">Saldo Pendiente</th>
                  <th className="text-center">Estado Seña</th>
                  <th className="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const price = Number(a.service?.price || 0);
                  const sena = Number(a.señaAmount || 0);
                  const balance = Math.max(price - sena, 0);
                  const senaStatus = a.senaStatus || (a.notes?.toLowerCase().includes("seña") ? "PAGADA" : "SIN_SENA");

                  return (
                    <tr key={a.id}>
                      <td className="fw-bold text-dark">{a.startTime || "—"} hs</td>
                      <td>
                        <strong className="text-dark d-block">
                          {a.client?.firstName} {a.client?.lastName || ""}
                        </strong>
                        {a.client?.phone && (
                          <span className="text-muted smaller d-block" style={{ fontSize: "10.5px" }}>
                            {a.client.phone}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary-soft text-dark border fw-medium">{a.service?.name || "Servicio"}</span>
                      </td>
                      <td>{a.workerName || "Profesional"}</td>
                      <td className="text-end fw-semibold text-dark">{currency(price)}</td>
                      <td className="text-end text-success fw-medium">{currency(sena)}</td>
                      <td className="text-end text-danger fw-semibold">{currency(balance)}</td>
                      <td className="text-center">
                        <span className={`sena-badge-custom sena-badge-${senaStatus}`}>
                          {senaStatus === "PAGADA" ? "Pagada" : senaStatus === "PARCIAL" ? "Parcial" : senaStatus === "PENDIENTE" ? "Pendiente" : "Sin Seña"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => {
                              onHide();
                              onEdit(a);
                            }}
                            title="Editar Cita"
                            className="p-1.5 rounded-circle border"
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => onSendWhatsApp(a)}
                            title="Enviar WhatsApp"
                            className="p-1.5 rounded-circle border"
                          >
                            <MessageSquare size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => onSendEmail(a)}
                            title="Enviar Email"
                            disabled={!a.client?.email}
                            className="p-1.5 rounded-circle border"
                          >
                            <Mail size={12} />
                          </Button>
                          {senaStatus === "SIN_SENA" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => handleSendSenaReminder(a)}
                                title="Enviar Recordatorio de Seña (WhatsApp)"
                                className="p-1.5 rounded-circle border"
                              >
                                <MessageSquare size={12} className="text-success" />
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => onMarkSenaPaid?.(a)}
                                title="Marcar Seña Pagada"
                                className="p-1.5 rounded-circle border bg-success text-white"
                              >
                                <DollarSign size={12} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* FILA DE TOTALES */}
                <tr className="bg-light fw-bold" style={{ borderTop: "2px solid #cbd5e1" }}>
                  <td colSpan={4} className="text-dark fw-black">TOTALES</td>
                  <td className="text-end text-dark fw-black">{currency(financialTotals.totalPrices)}</td>
                  <td className="text-end text-success fw-black">{currency(financialTotals.totalSenas)}</td>
                  <td className="text-end text-danger fw-black">{currency(financialTotals.totalPending)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </Table>
          </div>
        ) : (
          /* DETALLE DE CITAS GENERAL */
          <div className="d-grid gap-2.5">
            {appointments.map((a) => {
              const senaStatus = a.senaStatus || (a.notes?.toLowerCase().includes("seña") ? "PAGADA" : "SIN_SENA");

              return (
                <div key={a.id} className="summary-detail-card-item">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Clock className="text-muted" size={13} />
                      <strong className="text-dark">{a.startTime || "—"} hs</strong>
                      <Badge bg="white" className={`border ${statusBadgeBg(a.status)}`}>
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                    <div className="d-flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => {
                          onHide();
                          onEdit(a);
                        }}
                        className="py-1 px-2.5 small fw-bold d-flex align-items-center gap-1 border"
                      >
                        <Edit2 size={11} />
                        <span>Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => onSendWhatsApp(a)}
                        className="py-1 px-2.5 small fw-bold d-flex align-items-center gap-1 border-0"
                      >
                        <MessageSquare size={11} />
                        <span>WhatsApp</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => onSendEmail(a)}
                        disabled={!a.client?.email}
                        className="py-1 px-2.5 small fw-bold d-flex align-items-center gap-1 border"
                      >
                        <Mail size={11} />
                        <span>Email</span>
                      </Button>
                    </div>
                  </div>

                  <div className="d-grid gap-1 mb-2">
                    <div className="d-flex align-items-center gap-2 small text-dark">
                      <User size={13} className="text-muted" />
                      <span>
                        <strong>Cliente:</strong> {a.client?.firstName} {a.client?.lastName || ""}
                      </span>
                      {a.client?.phone && (
                        <span className="text-muted smaller">({a.client.phone})</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 small text-dark">
                      <Calendar size={13} className="text-muted" />
                      <span>
                        <strong>Servicio:</strong> {a.service?.name} ({a.service?.duration || 60} min)
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small text-dark">
                      <User size={13} className="text-muted" />
                      <span>
                        <strong>Estilista:</strong> {a.workerName || "Profesional"}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2 flex-wrap gap-2 small text-muted">
                    <div>
                      <span>Precio: <strong className="text-dark">{currency(a.service?.price)}</strong></span>
                      {Number(a.señaAmount) > 0 && (
                        <span className="ms-3">Seña: <strong className="text-success">{currency(a.señaAmount)}</strong></span>
                      )}
                    </div>
                    <div>
                      <span className={`sena-badge-custom sena-badge-${senaStatus}`}>
                        {senaStatus === "PAGADA" ? "Seña Pagada" : senaStatus === "PARCIAL" ? "Pago Parcial" : senaStatus === "PENDIENTE" ? "Pendiente" : "Sin Seña"}
                      </span>
                    </div>
                  </div>

                  {senaStatus === "SIN_SENA" && (
                    <div className="d-flex gap-2 mt-2 border-top pt-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => handleSendSenaReminder(a)}
                        className="py-1 px-2.5 small fw-bold d-flex align-items-center gap-1.5 border"
                      >
                        <MessageSquare size={11} className="text-success" />
                        <span>Enviar recordatorio de seña</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => onMarkSenaPaid?.(a)}
                        className="py-1 px-2.5 small fw-bold d-flex align-items-center gap-1.5 border-0 bg-success text-white"
                      >
                        <DollarSign size={11} />
                        <span>Marcar seña pagada</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 bg-light pt-2 pb-3 d-flex justify-content-end">
        <Button variant="outline-dark" onClick={onHide} className="rounded-pill px-4 py-1.5 fw-bold border">
          <X size={15} className="me-1" />
          <span>Cerrar</span>
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
