import React from "react";
import { Badge, Dropdown, Button } from "react-bootstrap";
import { MessageSquare, Mail, MoreVertical } from "lucide-react";
import { useAppointmentsStore } from "../AppointmentsProvider.jsx";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function AppointmentCard({
  appt,
  onEdit,
  onUpdateStatus,
  onSendWhatsApp,
  onSendEmail,
}) {
  const { appointmentStatuses } = useAppointmentsStore();

  const starts = new Date(appt.startsAt);
  const hour = starts.getHours();
  const minute = starts.getMinutes();
  
  // Asumimos 1 hora = 80px
  // Inicia a las 09:00 (que equivale a top: 0px)
  const startsDecimal = hour + minute / 60;
  const topOffset = (startsDecimal - 9) * 80;
  
  // Duración en horas
  const durationMinutes = appt.service?.duration || 60;
  const height = (durationMinutes / 60) * 80;

  // Formatear horas
  const formatTime = (d) => {
    return new Date(d).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusObj = appointmentStatuses.find(s => s.key === appt.status) || appointmentStatuses.find(s => s.key === "PENDING");

  const clientName = appt.clientName || [appt.client?.firstName, appt.client?.lastName].filter(Boolean).join(" ") || "Cliente";
  const serviceName = appt.serviceName || appt.service?.name || "Servicio";
  
  // Formatear seña
  const senaStatus = appt.depositStatus || appt.senaStatus || (appt.notes?.toLowerCase().includes("seña") ? "PAGADA" : "SIN_SENA");

  // Drag handlers
  const handleDragStart = (e) => {
    e.dataTransfer.setData("apptId", appt.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`appt-card-absolute`}
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        borderLeft: `4px solid ${statusObj?.color || "#3b82f6"}`
      }}
      draggable
      onDragStart={handleDragStart}
      onClick={(e) => {
        // Evitar que abra el modal si hicieron clic en botones de acción
        if (e.target.closest("button") || e.target.closest(".dropdown")) return;
        onEdit(appt);
      }}
    >
      <div className="d-flex justify-content-between align-items-start">
        <span className="appt-card-time">{formatTime(appt.startsAt)} hs</span>
        
        {/* Acciones Rápidas Dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret">
            <MoreVertical size={13} className="text-dark opacity-75" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-premium" style={{ fontSize: "11.5px" }}>
            {appointmentStatuses.map(status => (
              <Dropdown.Item 
                key={status.key} 
                onClick={() => onUpdateStatus(appt.id, status.key)} 
                className="d-flex align-items-center gap-1.5 small"
              >
                <span 
                  className="rounded-circle d-inline-block me-1.5" 
                  style={{ width: "8px", height: "8px", backgroundColor: status.color }}
                />
                {status.label}
              </Dropdown.Item>
            ))}
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => onSendWhatsApp(appt)} className="d-flex align-items-center gap-1.5 small">
              <MessageSquare size={12} className="text-success" /> Enviar WhatsApp
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onSendEmail(appt)} className="d-flex align-items-center gap-1.5 small">
              <Mail size={12} className="text-primary" /> Enviar Email
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className="appt-card-title d-flex align-items-center gap-1">
        <span>{clientName}</span>
        {appt.client?.allergies && (
          <span className="text-danger animate-pulse" title={`Alergias: ${appt.client.allergies}`} style={{ fontSize: "11px" }}>
            ⚠️
          </span>
        )}
      </div>
      <div className="appt-card-service text-truncate">{serviceName}</div>

      <div className="d-flex justify-content-between align-items-center mt-1.5 flex-wrap gap-1">
        {/* Badge de Seña */}
        <span className={`sena-badge-custom sena-badge-${senaStatus}`}>
          {senaStatus === "PAGADA" ? "Seña Pagada" : senaStatus === "PARCIAL" ? "Pago Parcial" : senaStatus === "PENDIENTE" ? "Pendiente" : "Sin Seña"}
        </span>

        {/* Mini Acciones */}
        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="link"
            className="p-0 text-success"
            onClick={() => onSendWhatsApp(appt)}
            title="Confirmar por WhatsApp"
          >
            <MessageSquare size={11} />
          </Button>
          <Button
            size="sm"
            variant="link"
            className="p-0 text-primary"
            onClick={() => onSendEmail(appt)}
            title="Confirmar por Email"
          >
            <Mail size={11} />
          </Button>
        </div>
      </div>
    </div>
  );
}
