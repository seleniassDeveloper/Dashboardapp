import React, { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert, Badge } from "react-bootstrap";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";

// Helper dinámico para resolver el actor/responsable real (Punto de Datos PostgreSQL)
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

// Helper dinámico para resolver los detalles legibles de la auditoría en base a acción y metadatos
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
        ? `Invitación de unión enviada al correo ${meta.email || "—"} para el rol ${meta.role || "colaborador"}.`
        : `Join invitation sent to email ${meta.email || "—"} for the role ${meta.role || "collaborator"}.`;
    case "invitation_accepted":
      return isEs
        ? `Invitación aceptada por el usuario. Miembro asignado al salón.`
        : `Invitation accepted by the user. Member assigned to the salon.`;
    case "role_switch_approved":
      return isEs
        ? `Cambio de rol de seguridad verificado y autorizado con bypass de propietario.`
        : `Security role switch verified and authorized with owner bypass.`;
    case "role_permissions_updated":
      return isEs
        ? `Permisos y alcances del rol de seguridad actualizados en el panel.`
        : `Security role permissions and scopes updated in the panel.`;
    case "create_expense":
      return isEs
        ? `Egreso operativo registrado en caja.`
        : `Operational expense registered in cash.`;
    case "cash_closing":
      return isEs
        ? `Cierre de caja diario guardado de forma segura.`
        : `Daily cash closing saved securely.`;
    default:
      return isEs 
        ? `Registro de auditoría operativa (${log.action}).` 
        : `Operational audit log entry (${log.action}).`;
  }
}

export default function FinancialAudit() {
  const { t, i18n } = useTranslation("finances");
  const isEs = i18n && i18n.language ? i18n.language === "es" : true;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/finances/audit");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(t("audit.errorLoad", { defaultValue: "No se pudieron cargar los registros de auditoría." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <Card className="card-premium border-0 shadow-sm bg-white">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h3 className="h6 fw-black text-gray-900 m-0 d-flex align-items-center gap-2" style={{ color: "#1e293b" }}>
            <ShieldAlert className="text-purple-600" size={20} />
            <span>{t("audit.title", { defaultValue: "Bitácora de Auditoría Financiera de Seguridad" })}</span>
          </h3>
          <button onClick={fetchAuditLogs} disabled={loading} className="btn btn-light btn-sm rounded-circle p-2 border">
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
        </div>
        <p className="text-muted smaller mb-4">
          {t("audit.desc", { defaultValue: "Registro inmutable de movimientos significativos: modificaciones de cobros, precios de lista de tratamientos, liquidaciones de comisiones o cierres de caja." })}
        </p>

        {error && <Alert variant="danger" className="rounded-xl py-2 small">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="text-purple-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
            {t("audit.noLogs", { defaultValue: "No hay registros de auditoría de seguridad todavía." })}
          </div>
        ) : (
          <div className="table-responsive border rounded-xl overflow-hidden">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="table-header-small" style={{ fontSize: "11px", background: "#f8fafc" }}>
                  <th className="ps-3 py-2.5 fw-bold" style={{ color: "#1e293b" }}>{t("audit.thDate", { defaultValue: "Fecha y Hora" })}</th>
                  <th className="py-2.5 fw-bold" style={{ color: "#1e293b" }}>{t("audit.thAction", { defaultValue: "Operación / Acción" })}</th>
                  <th className="py-2.5 fw-bold" style={{ color: "#1e293b" }}>{t("audit.thActor", { defaultValue: "Actor / Responsable" })}</th>
                  <th className="pe-3 py-2.5 fw-bold" style={{ color: "#1e293b" }}>{t("audit.thDetails", { defaultValue: "Detalles Auditados" })}</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {logs.map((log) => {
                  if (!log) return null;
                  return (
                    <tr key={log.id} className="border-bottom">
                      {/* Fecha y Hora con Altísimo Contraste */}
                      <td className="ps-3 text-dark fw-medium" style={{ fontSize: "12.5px", color: "#1e293b" }}>
                        {new Date(log.createdAt).toLocaleDateString("es-AR")} • {new Date(log.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                      </td>
                      <td>
                        <Badge 
                          bg={log.action.includes("error") ? "danger-soft" : log.action.includes("close") ? "secondary-soft" : "primary-soft"}
                          className={log.action.includes("error") ? "text-danger rounded-pill px-2.5 py-1 fw-bold" : "text-purple-700 bg-purple-50 border border-purple-100 rounded-pill px-2.5 py-1 fw-bold"}
                          style={{ fontSize: "10.5px" }}
                        >
                          {log.action.toUpperCase()}
                        </Badge>
                      </td>
                      {/* Actor Resuelto Dinámicamente con Color de Alto Contraste */}
                      <td className="fw-bold text-dark" style={{ color: "#0f172a" }}>
                        {getAuditActor(log)}
                      </td>
                      {/* Detalles Resueltos con Color Gris Oscuro Altamente Visible */}
                      <td className="text-secondary pe-3 smaller" style={{ color: "#334155", maxWidth: "340px", fontSize: "12px" }}>
                        {getAuditDetails(log, isEs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
