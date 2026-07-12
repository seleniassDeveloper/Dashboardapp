// src/components/appointments/mobile/ApptCard.jsx
import React from "react";
import { Clock, ChevronRight, MessageSquare, Check, CreditCard } from "lucide-react";

// SVG de WhatsApp para alineación de alta fidelidad
const WhatsAppIcon = ({ size = 14, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ color: "#25D366" }}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.905-6.99C16.488 1.876 14.016 1.846 12 1.846c-5.434 0-9.858 4.417-9.863 9.861-.001 1.761.463 3.479 1.34 5.006l-1.025 3.738 3.825-.997z"/>
  </svg>
);

export default function ApptCard({ appt, state, onConfirm, onCollect, onWhatsApp, onSelect }) {
  if (!appt) return null;
  
  const clientName = appt.clientName || `${appt.client?.firstName || ""} ${appt.client?.lastName || ""}`.trim() || "Cliente";
  const serviceName = appt.serviceName || appt.service?.name || "Servicio";
  const duration = appt.service?.duration || appt.duration || 60;

  const formatTimeStr = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).replace(" a. m.", " a.m.").replace(" p. m.", " p.m.");
    } catch (e) {
      return "";
    }
  };

  const getDayAbbreviation = (dateStr) => {
    if (!dateStr) return "LUN";
    try {
      const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
      return days[new Date(dateStr).getDay()];
    } catch (e) {
      return "LUN";
    }
  };

  const timeParts = formatTimeStr(appt.startsAt).split(" ");
  const timeVal = timeParts[0] || "12:00";
  const timePeriod = timeParts[1] || "p.m.";
  const dayAbbr = getDayAbbreviation(appt.startsAt);

  // Styling maps based on status state
  const colorClass = state === "sin_sena" ? "red" : state === "pendiente" ? "amber" : "green";
  const statusLabel = state === "sin_sena" ? "Sin seña" : state === "pendiente" ? "Esperando confirmación" : "Confirmada";

  return (
    <div 
      className={`sla-appt ${state === "sin_sena" ? "sla-appt--danger" : ""}`}
      onClick={() => onSelect?.(appt)}
      style={{ cursor: "pointer" }}
    >
      <div className="d-flex align-items-center justify-content-between gap-3 w-100 flex-wrap flex-sm-nowrap">
        {/* Layout Row */}
        <div className="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
          {/* Left Time Box */}
          <div className={`sla-time sla-time--${colorClass}`}>
            <div className="sla-time__h">{timeVal}</div>
            <div className="sla-time__h">{timePeriod}</div>
            <div className="sla-time__d">{dayAbbr}</div>
          </div>

          {/* Middle Info */}
          <div className="sla-appt__info">
            <h4 className="sla-appt__name text-truncate">{clientName}</h4>
            <p className="sla-appt__svc text-truncate">{serviceName}</p>
            <div className="sla-appt__dur">
              <Clock size={12} />
              <span>{duration} min</span>
            </div>
          </div>
        </div>

        {/* Right Status Badge / Chevron */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <span className={`sla-status sla-status--${colorClass}`}>{statusLabel}</span>
          {state === "confirmada" && (
            <ChevronRight size={18} className="sla-chevron" />
          )}
        </div>
      </div>

      {/* Action Buttons underneath (only for sin_sena or pendiente) */}
      {(state === "sin_sena" || state === "pendiente") && (
        <div className="sla-appt__actions w-100 d-flex gap-2 justify-content-end">
          <button className="sla-btn sla-btn--wa" onClick={(e) => { e.stopPropagation(); onWhatsApp?.(appt); }}>
            <WhatsAppIcon size={14} />
            <span>WhatsApp</span>
          </button>
          
          {state === "sin_sena" && (
            <button className="sla-btn sla-btn--danger" onClick={(e) => { e.stopPropagation(); onCollect?.(appt.id); }}>
              <CreditCard size={13} />
              <span>Cobrar seña</span>
            </button>
          )}

          {state === "pendiente" && (
            <button className="sla-btn sla-btn--confirm" onClick={(e) => { e.stopPropagation(); onConfirm?.(appt.id); }}>
              <Check size={13} />
              <span>Confirmar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
