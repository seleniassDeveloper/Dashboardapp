// src/components/finance/mobile/AuditoriaScreen.jsx
import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import api from "../../../lib/api.js";

function getAuditActor(log) {
  if (log.actor) return log.actor;
  if (log.metadata && typeof log.metadata === "object") {
    if (log.metadata.actor) return log.metadata.actor;
    if (log.metadata.inviterEmail) return log.metadata.inviterEmail;
    if (log.metadata.inviter) return log.metadata.inviter;
  }
  if (log.userId) {
    if (log.userId === "VaXiH3WTEqWBqsc03cXtzUsix5x1" || log.userId.includes("owner")) return "Selenia (Owner)";
    return `Usuario (${log.userId.slice(0, 6)})`;
  }
  return "Sistema / Auto";
}

function getAuditDetails(log, isEs = true) {
  if (log.details) return log.details;
  if (log.metadata && typeof log.metadata === "object") {
    if (log.metadata.details) return log.metadata.details;
  }
  const meta = log.metadata || {};
  switch (log.action) {
    case "system_init":
      return isEs 
        ? "Módulo ERP financiero inicializado en Neon Cloud PostgreSQL." 
        : "ERP financial module initialized in Neon Cloud PostgreSQL.";
    case "invitation_sent":
      return isEs
        ? `Invitación enviada al correo ${meta.email || "—"} para el rol ${meta.role || "colaborador"}.`
        : `Invitation sent to ${meta.email || "—"} for role ${meta.role || "collaborator"}.`;
    case "invitation_accepted":
      return isEs
        ? "Invitación aceptada por el usuario. Miembro asignado."
        : "Invitation accepted by the user. Member assigned.";
    case "role_switch_approved":
      return isEs
        ? "Cambio de rol verificado y autorizado con bypass."
        : "Role switch verified and authorized with bypass.";
    case "role_permissions_updated":
      return isEs
        ? "Permisos del rol de seguridad actualizados."
        : "Role security permissions updated.";
    case "create_expense":
      return isEs
        ? "Egreso operativo registrado en caja."
        : "Operational expense registered in cash.";
    case "cash_closing":
      return isEs
        ? "Cierre de caja diario guardado de forma segura."
        : "Daily cash closing saved securely.";
    default:
      return isEs 
        ? `Registro de auditoría operativa (${log.action}).` 
        : `Operational audit log entry (${log.action}).`;
  }
}

export default function AuditoriaScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/audit");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="animate-fade-in pt-3">
      {/* Header and Refresh */}
      <div className="f-section px-3 mb-2">
        <h3 className="d-flex align-items-center gap-1.5">
          <ShieldAlert size={18} className="text-purple-600 animate-pulse" />
          <span>Bitácora de Seguridad</span>
        </h3>
        <button className="btn btn-sm text-purple-600 p-0" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} />
        </button>
      </div>

      <div className="f-audit-head">
        <span>Fecha y hora</span>
        <span>Acción</span>
        <span>Actor</span>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted small">Cargando bitácora de auditoría...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-5 text-muted small border rounded-xl m-3 bg-white">
          No hay registros de auditoría disponibles.
        </div>
      ) : (
        <ul className="f-audit-list mb-3">
          {logs.slice(0, 50).map(log => {
            const dateObj = new Date(log.createdAt);
            const timeStr = dateObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
            const details = getAuditDetails(log, true);
            const actor = getAuditActor(log);

            return (
              <li className="f-audit" key={log.id}>
                <span className="f-audit__date">
                  {dateStr} · {timeStr}
                </span>
                <span className="f-audit__act text-truncate" title={log.action}>
                  {log.action?.toUpperCase()}
                  <small className="d-block text-muted text-wrap font-normal" style={{ fontSize: "9px" }}>
                    {details}
                  </small>
                </span>
                <span className="f-audit__who text-truncate" title={actor}>
                  {actor}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
