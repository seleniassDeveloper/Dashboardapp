import React from "react";
import { 
  ChevronLeft, MoreVertical, MessageCircle, Phone, Mail, Edit2, 
  MapPin, Calendar, BookOpen, Clock, AlertTriangle, CreditCard, DollarSign 
} from "lucide-react";
import { getClientStatus } from "../../../lib/clientStatus";

const BADGE_CLASS = {
  NUEVO: "c-badge--nuevo",
  FRECUENTE: "c-badge--frecuente",
  ACTIVO: "c-badge--activo",
  INACTIVO: "c-badge--inactivo",
  VIP: "c-badge--vip"
};

// Helper to parse virtual fields stored in client notes
const parseNotesField = (notesStr) => {
  let city = "";
  let birthdate = "";
  let statusVal = "";
  let cleanNotes = notesStr || "";

  const cityMatch = cleanNotes.match(/\[Ciudad:\s*([^\]]*)\]/);
  if (cityMatch) {
    city = cityMatch[1].trim();
    cleanNotes = cleanNotes.replace(/\[Ciudad:\s*([^\]]*)\]\n?/, "");
  }

  const birthdateMatch = cleanNotes.match(/\[Nacimiento:\s*([^\]]*)\]/);
  if (birthdateMatch) {
    birthdate = birthdateMatch[1].trim();
    cleanNotes = cleanNotes.replace(/\[Nacimiento:\s*([^\]]*)\]\n?/, "");
  }

  const statusMatch = cleanNotes.match(/\[Estado:\s*([^\]]*)\]/);
  if (statusMatch) {
    statusVal = statusMatch[1].trim();
    cleanNotes = cleanNotes.replace(/\[Estado:\s*([^\]]*)\]\n?/, "");
  }

  return { city, birthdate, statusVal, notes: cleanNotes.trim() };
};

export default function ClientDetail({ client, appointments, onNavigate, onBack, handleDelete }) {
  if (!client) return null;

  const { city, birthdate, statusVal, notes: cleanNotes } = parseNotesField(client.notes);
  const autoStatusInfo = getClientStatus(client, appointments);
  const finalStatus = statusVal && statusVal !== "AUTO" ? statusVal : autoStatusInfo.status;
  const { visits, totalSpent } = autoStatusInfo;
  
  const displayName = client.fullName || `${client.firstName || ""} ${client.lastName || ""}`.trim() || "—";
  
  // Format createdAt date
  const clientSince = client.createdAt 
    ? new Date(client.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })
    : "Recientemente";

  // Clean phone for tel/whatsapp links
  const cleanPhone = (client.phone || "").replace(/[^\d+]/g, "");

  // Statistics calculations
  const clientAppts = appointments.filter(a => a.clientId === client.id);
  const doneAppts = clientAppts.filter(a => a.status === "DONE" || a.status === "CONFIRMED");
  
  // No shows calculation
  const noShowsCount = clientAppts.filter(a => a.status === "NO_SHOW" || a.status === "CANCELLED").length;

  const avgTicket = doneAppts.length > 0 
    ? (totalSpent / doneAppts.length).toFixed(2) 
    : "0.00";

  // Last appointment
  const lastAppt = doneAppts.length > 0
    ? doneAppts.reduce((latest, a) => {
        const d = new Date(a.startsAt);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;

  const lastApptStr = lastAppt && lastAppt.getTime() > 0
    ? lastAppt.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
    : "Ninguna realizada";

  // Birthday formatted
  const formatBirthdate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es", { day: "numeric", month: "long" });
    } catch {
      return dateStr;
    }
  };

  const handleDeleteClick = async () => {
    const ok = window.confirm(`¿Estás seguro de que deseas eliminar a ${displayName}?`);
    if (!ok) return;
    await handleDelete(client);
    onBack();
  };

  return (
    <div style={{ background: "var(--c-bg-soft)", minHeight: "100vh", paddingBottom: "32px" }}>
      {/* Top Banner and Header */}
      <div className="c-detail-top">
        <div className="c-detail-top__nav">
          <button className="c-back" onClick={onBack} aria-label="Volver">
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="c-back" onClick={handleDeleteClick} aria-label="Eliminar cliente">
              <span style={{ color: "#ef4444", fontSize: "14px", fontWeight: "bold" }}>Eliminar</span>
            </button>
            <button className="c-back" onClick={() => onNavigate("edit", client)} aria-label="Editar">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
        
        {/* Large Avatar */}
        <div className="c-detail__avatar">
          {displayName.charAt(0).toUpperCase()}
          <span className="c-detail__dot" />
        </div>
      </div>

      {/* Main Details Card */}
      <div className="c-detail__card">
        <h2 className="c-detail__name">{displayName}</h2>
        <div style={{ margin: "8px 0" }}>
          <span className={`c-badge ${BADGE_CLASS[finalStatus]}`}>
            {finalStatus}
          </span>
        </div>
        <p className="c-detail__since">Cliente desde {clientSince}</p>
        
        {/* Action Buttons Row */}
        <div className="c-actions">
          {cleanPhone && (
            <a 
              className="c-action" 
              href={`https://wa.me/${cleanPhone.replace("+", "")}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <div className="c-action__icon" style={{ color: "#16a34a" }}>
                <MessageCircle size={20} />
              </div>
              <span>Mensaje</span>
            </a>
          )}

          {cleanPhone && (
            <a className="c-action" href={`tel:${cleanPhone}`}>
              <div className="c-action__icon" style={{ color: "var(--c-purple)" }}>
                <Phone size={20} />
              </div>
              <span>Llamar</span>
            </a>
          )}

          {client.email && (
            <a className="c-action" href={`mailto:${client.email}`}>
              <div className="c-action__icon" style={{ color: "#3b82f6" }}>
                <Mail size={20} />
              </div>
              <span>Email</span>
            </a>
          )}

          <button className="c-action" onClick={() => onNavigate("edit", client)}>
            <div className="c-action__icon" style={{ color: "var(--c-pink)" }}>
              <Edit2 size={20} />
            </div>
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Contact Info Card */}
      <div className="c-section">
        <h4>Información de contacto</h4>
        {client.phone && (
          <div className="c-info-row">
            <Phone size={16} />
            <span>{client.phone}</span>
          </div>
        )}
        {client.email && (
          <div className="c-info-row">
            <Mail size={16} />
            <span>{client.email}</span>
          </div>
        )}
        {city && (
          <div className="c-info-row">
            <MapPin size={16} />
            <span>{city}</span>
          </div>
        )}
        {birthdate && (
          <div className="c-info-row">
            <Calendar size={16} />
            <span>Cumpleaños: {formatBirthdate(birthdate)}</span>
          </div>
        )}
      </div>

      {/* Notes Card */}
      <div className="c-section">
        <h4>Notas</h4>
        <div style={{ fontSize: "14px", color: "var(--c-text)", lineHeight: "1.5" }}>
          {cleanNotes || "Sin notas guardadas para este cliente."}
        </div>
      </div>

      {/* Statistics Card */}
      <div className="c-section">
        <h4>Estadísticas</h4>
        
        <div className="c-stat-row">
          <span className="c-stat-row__label">Total de citas</span>
          <span className="c-stat-row__val">{clientAppts.length}</span>
        </div>
        
        <div className="c-stat-row">
          <span className="c-stat-row__label">Citas completadas</span>
          <span className="c-stat-row__val">{doneAppts.length}</span>
        </div>
        
        <div className="c-stat-row">
          <span className="c-stat-row__label">No shows / Cancelaciones</span>
          <span className="c-stat-row__val">{noShowsCount}</span>
        </div>
        
        <div className="c-stat-row">
          <span className="c-stat-row__label">Total gastado</span>
          <span className="c-stat-row__val" style={{ color: "var(--c-purple-600)" }}>
            ${totalSpent.toFixed(2)}
          </span>
        </div>
        
        <div className="c-stat-row">
          <span className="c-stat-row__label">Ticket promedio</span>
          <span className="c-stat-row__val">${avgTicket}</span>
        </div>
        
        <div className="c-stat-row">
          <span className="c-stat-row__label">Última cita</span>
          <span className="c-stat-row__val">{lastApptStr}</span>
        </div>
      </div>
    </div>
  );
}
