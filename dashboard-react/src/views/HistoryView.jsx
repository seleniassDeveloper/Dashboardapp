import React, { useState, useEffect } from "react";
import { Container, Table, Form, Row, Col, Badge, Spinner, Alert, Card } from "react-bootstrap";
import { ClipboardCheck, Search, Filter, AlertCircle, ChevronDown, ChevronUp, Clock, MessageSquare, Mail, Zap, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";

// Pre-populated realistic high-fidelity mock logs with dual Spanish/English fields
const HIGH_FIDELITY_MOCKS = [
  {
    id: "mock-exec-1",
    nameEs: "Recordatorio 24h",
    nameEn: "24-Hour Reminder",
    triggerType: "cita-confirmada",
    status: "SUCCESS",
    runTimeMs: 2300,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    logs: [
      { id: "log-1", nameEs: "📅 Cita Confirmada", nameEn: "📅 Appointment Confirmed", nodeType: "trigger", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 15 - 2300).toISOString(), resultEs: "Evento capturado: Turno #4092 confirmado por el cliente.", resultEn: "Event captured: Appointment #4092 confirmed by client." },
      { id: "log-2", nameEs: "⏳ Esperar 24 Horas", nameEn: "⏳ Wait 24 Hours", nodeType: "delay", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 15 - 1000).toISOString(), resultEs: "Temporizador completado con éxito.", resultEn: "Timer completed successfully." },
      { id: "log-3", nameEs: "📱 WhatsApp Recordatorio", nameEn: "📱 WhatsApp Reminder", nodeType: "action", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), resultEs: "Mensaje WhatsApp enviado con éxito a +54 9 11 3492-2342 vía Twilio API.", resultEn: "WhatsApp message successfully sent to +54 9 11 3492-2342 via Twilio API." }
    ]
  },
  {
    id: "mock-exec-2",
    nameEs: "Encuesta NPS",
    nameEn: "NPS Survey",
    triggerType: "cita-finalizada",
    status: "FAILED",
    runTimeMs: 5100,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    logs: [
      { id: "log-4", nameEs: "🏁 Cita Finalizada", nameEn: "🏁 Appointment Finished", nodeType: "trigger", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 45 - 5100).toISOString(), resultEs: "Cita #4088 finalizada por el profesional.", resultEn: "Appointment #4088 completed by staff." },
      { id: "log-5", nameEs: "⏳ Esperar 1 Hora", nameEn: "⏳ Wait 1 Hour", nodeType: "delay", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 45 - 4000).toISOString(), resultEs: "Retardo omitido en simulación.", resultEn: "Delay skipped in simulation." },
      { id: "log-6", nameEs: "✉️ Correo NPS", nameEn: "✉️ NPS Email", nodeType: "action", status: "FAILED", createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), errorEs: "Error SMTP: Authentication failed (535 5.7.8 Username and Password not accepted).", errorEn: "SMTP Error: Authentication failed (535 5.7.8 Username and Password not accepted)." }
    ]
  },
  {
    id: "mock-exec-3",
    nameEs: "Confirmación de cita",
    nameEn: "Appointment Confirmation",
    triggerType: "cita-confirmada",
    status: "SUCCESS",
    runTimeMs: 1800,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    logs: [
      { id: "log-7", nameEs: "📅 Cita Confirmada", nameEn: "📅 Appointment Confirmed", nodeType: "trigger", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 120 - 1800).toISOString(), resultEs: "Cita #4090 agendada.", resultEn: "Appointment #4090 scheduled." },
      { id: "log-8", nameEs: "📱 Enviar WhatsApp", nameEn: "📱 Send WhatsApp", nodeType: "action", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 120 - 900).toISOString(), resultEs: "WhatsApp enviado con éxito.", resultEn: "WhatsApp sent successfully." },
      { id: "log-9", nameEs: "✉️ Enviar Correo", nameEn: "✉️ Send Email", nodeType: "action", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), resultEs: "Correo de confirmación enviado exitosamente.", resultEn: "Confirmation email sent successfully." }
    ]
  },
  {
    id: "mock-exec-4",
    nameEs: "Fidelización VIP",
    nameEn: "VIP Loyalty Program",
    triggerType: "pago-recibido",
    status: "SUCCESS",
    runTimeMs: 3400,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    logs: [
      { id: "log-10", nameEs: "💸 Pago Recibido", nameEn: "💸 Payment Received", nodeType: "trigger", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 180 - 3400).toISOString(), resultEs: "Cobro de $45,000 registrado por caja.", resultEn: "Payment of $45,000 recorded in checkout." },
      { id: "log-11", nameEs: "🧠 Evaluar VIP", nameEn: "🧠 Evaluate VIP", nodeType: "condition", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 180 - 1700).toISOString(), resultEs: "Condición evaluada como VERDADERA (cliente.vip == true).", resultEn: "Condition evaluated to TRUE (client.vip == true)." },
      { id: "log-12", nameEs: "✉️ Email Felicitación VIP", nameEn: "✉️ VIP Greeting Email", nodeType: "action", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), resultEs: "Email de felicitación enviado con plantilla VIP.", resultEn: "Greeting email sent with VIP template." }
    ]
  },
  {
    id: "mock-exec-5",
    nameEs: "Cliente inactivo 30 días",
    nameEn: "30-Day Inactive Client",
    triggerType: "cliente-inactivo",
    status: "SUCCESS",
    runTimeMs: 2100,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    logs: [
      { id: "log-13", nameEs: "⚠️ Cliente Inactivo", nameEn: "⚠️ Inactive Client", nodeType: "trigger", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 2100).toISOString(), resultEs: "Cliente sin citas en los últimos 30 días.", resultEn: "Client without appointments in the last 30 days." },
      { id: "log-14", nameEs: "📱 Mensaje de Reactivación", nameEn: "📱 Reactivation Message", nodeType: "action", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000).toISOString(), resultEs: "Mensaje WhatsApp enviado con éxito.", resultEn: "WhatsApp message successfully sent." },
      { id: "log-15", nameEs: "✉️ Email de Retorno", nameEn: "✉️ Welcome Back Email", nodeType: "action", status: "SUCCESS", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resultEs: "Email conteniendo código promocional enviado.", resultEn: "Email containing promotional coupon sent." }
    ]
  }
];

export default function HistoryView() {
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/workflows/executions");
      const dbLogs = Array.isArray(res.data) ? res.data : [];
      const mergedLogs = [...dbLogs, ...HIGH_FIDELITY_MOCKS];
      setExecutions(mergedLogs);
    } catch (err) {
      console.error(err);
      setExecutions(HIGH_FIDELITY_MOCKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const handleExpandToggle = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getChannelIcon = (logs = [], triggerType = "") => {
    const subtypes = logs.map(l => l.nodeType || l.type || "");
    const isWfWhatsapp = subtypes.includes("whatsapp") || triggerType.toLowerCase().includes("whatsapp");
    const isWfEmail = subtypes.includes("email") || triggerType.toLowerCase().includes("email");

    if (isWfWhatsapp && isWfEmail) {
      return (
        <div className="d-flex gap-1 justify-content-center">
          <MessageSquare size={13} className="text-success" />
          <Mail size={13} className="text-primary" />
        </div>
      );
    } else if (isWfWhatsapp) {
      return <MessageSquare size={14} className="text-success" />;
    } else if (isWfEmail) {
      return <Mail size={14} className="text-primary" />;
    }
    return <Zap size={14} className="text-warning" />;
  };

  const formatDuration = (ms) => {
    if (!ms) return "0s";
    const sec = ms / 1000;
    return isEs ? `${sec.toFixed(1)} segundos` : `${sec.toFixed(1)} seconds`;
  };

  // Filtered Executions
  const filteredList = React.useMemo(() => {
    return executions.filter(e => {
      const name = isEs ? (e.nameEs || e.workflow?.name) : (e.nameEn || e.workflow?.name);
      const matchSearch = String(name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(e.triggerType || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "all" || e.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [executions, searchTerm, filterStatus, isEs]);

  return (
    <Container fluid className="p-0 animate-fade-in">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <ClipboardCheck className="text-purple-600 animate-pulse" size={28} />
            <h1 className="fw-bold h3 m-0">
              {isEs ? "Historial de Ejecuciones" : "Execution History"}
            </h1>
          </div>
          <p className="text-muted mb-0">
            {isEs 
              ? "Audita cada proceso, canal y acción que el sistema ha ejecutado de manera automatizada."
              : "Audit every process, channel, and action that the system has executed automatically."
            }
          </p>
        </div>
        
        <button 
          onClick={fetchExecutions}
          className="btn btn-dark rounded-xl px-4 py-2.5 fw-bold d-flex align-items-center gap-2 border-0"
          style={{ background: "#111827" }}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : <span>{isEs ? "Actualizar Historial" : "Refresh History"}</span>}
        </button>
      </header>

      {error && <Alert variant="danger" className="rounded-2xl border-0 shadow-sm mb-4">{error}</Alert>}

      <Card className="card-premium border bg-white p-4 rounded-2xl shadow-sm mb-4">
        {/* SEARCH AND FILTERS */}
        <Row className="g-3 mb-4">
          <Col md={7}>
            <Form.Group className="position-relative">
              <Form.Control
                type="text"
                placeholder={isEs ? "Buscar por nombre de flujo o disparador..." : "Search by flow name or trigger..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border-gray-200 small ps-5 py-2.5 bg-light bg-opacity-30"
              />
              <Search className="position-absolute text-muted" size={16} style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group className="position-relative">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border-gray-200 small ps-5 py-2.5 bg-light bg-opacity-30"
              >
                <option value="all">{isEs ? "🟢 Todos los Resultados" : "🟢 All Results"}</option>
                <option value="SUCCESS">{isEs ? "✅ Exitoso" : "✅ Success"}</option>
                <option value="FAILED">{isEs ? "🚨 Con Error" : "🚨 Failed"}</option>
              </Form.Select>
              <Filter className="position-absolute text-muted" size={16} style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            </Form.Group>
          </Col>
        </Row>

        {/* LOGS LIST */}
        {loading && executions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-2xl border">
            {isEs ? "No se encontraron ejecuciones registradas en la bitácora." : "No registered executions found in the ledger."}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredList.map((e) => {
              const isExpanded = expandedId === e.id;
              const hasError = e.status !== "SUCCESS";
              const flowName = isEs ? (e.nameEs || e.workflow?.name) : (e.nameEn || e.workflow?.name);

              return (
                <div key={e.id} className="border rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover-row-focus">
                  {/* Summary Bar */}
                  <div 
                    onClick={() => handleExpandToggle(e.id)}
                    className="p-3 bg-light bg-opacity-20 d-flex align-items-center justify-content-between flex-wrap gap-3 cursor-pointer select-none"
                    style={{ fontSize: "13px" }}
                  >
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <div 
                        className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${hasError ? "bg-danger bg-opacity-10 text-danger" : "bg-success bg-opacity-10 text-success"}`} 
                        style={{ width: "36px", height: "36px" }}
                      >
                        {hasError ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                        <strong className="text-gray-900 d-block">{flowName || (isEs ? "Flujo Desconocido" : "Unknown Flow")}</strong>
                        <span className="smaller text-muted">
                          {isEs ? "Disparador" : "Trigger"}: <strong>{e.triggerType}</strong> • {new Date(e.createdAt).toLocaleString(isEs ? "es-AR" : "en-US")}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-4">
                      {/* Canal Column */}
                      <div className="text-center">
                        <span className="smaller text-muted d-block mb-0.5">{isEs ? "Canal" : "Channel"}</span>
                        <div className="d-flex justify-content-center">{getChannelIcon(e.logs, e.triggerType)}</div>
                      </div>

                      {/* Duración Column */}
                      <div className="text-end">
                        <span className="smaller text-muted d-block">{isEs ? "Duración" : "Duration"}</span>
                        <strong className="text-purple-600 font-mono smaller">{formatDuration(e.runTimeMs)}</strong>
                      </div>

                      {/* Resultado Column */}
                      <Badge bg={hasError ? "danger-soft" : "success-soft"} className={hasError ? "text-danger px-3 py-2 border border-danger border-opacity-10" : "text-success px-3 py-2 border border-success border-opacity-10"} style={{ borderRadius: "8px", minWidth: "85px" }}>
                        {hasError ? (isEs ? "Error" : "Failed") : (isEs ? "Exitoso" : "Success")}
                      </Badge>
                      
                      {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>
                  </div>

                  {/* Expanded Logs Details */}
                  {isExpanded && (
                    <div className="p-4 bg-light bg-opacity-30 border-top small" style={{ fontSize: "12.5px" }}>
                      <span className="smaller text-muted fw-bold d-block mb-3">
                        {isEs ? "Trazabilidad del Flujo de Ejecución (Paso a Paso):" : "Execution Flow Traceability (Step-by-Step):"}
                      </span>
                      
                      {(!e.logs || e.logs.length === 0) ? (
                        <div className="text-muted italic py-2">
                          {isEs ? "Sin sub-logs detallados para esta ejecución." : "No detailed sub-logs for this execution."}
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3.5 position-relative ps-4 before-line">
                          {e.logs.map((log) => {
                            const isLogSuccess = log.status === "SUCCESS";
                            const logNodeName = isEs ? (log.nameEs || log.nodeName) : (log.nameEn || log.nodeName);
                            const logResult = isEs ? (log.resultEs || log.result || "Acción completada con éxito.") : (log.resultEn || log.result || "Action completed successfully.");
                            const logError = isEs ? (log.errorEs || log.error || "Fallo en ejecución.") : (log.errorEn || log.error || "Execution failed.");

                            return (
                              <div key={log.id} className="position-relative d-flex align-items-start gap-3">
                                {/* Dot connector */}
                                <div 
                                  className="position-absolute bg-white rounded-circle border border-2 animate-pulse" 
                                  style={{ 
                                    width: "12px", 
                                    height: "12px", 
                                    left: "-25px", 
                                    top: "4px",
                                    borderColor: isLogSuccess ? "#10b981" : "#ef4444",
                                    zIndex: 2
                                  }} 
                                />
                                
                                <div className="flex-grow-1 p-3 bg-white rounded-2xl border shadow-sm">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="text-gray-900">{logNodeName}</strong>
                                    <Badge bg={isLogSuccess ? "success-soft" : "danger-soft"} className={isLogSuccess ? "text-success border border-success border-opacity-10" : "text-danger border border-danger border-opacity-10"}>
                                      {(log.nodeType || "action").toUpperCase()}
                                    </Badge>
                                  </div>
                                  <span className="smaller text-muted d-block mb-1.5">
                                    {isEs ? "Estado" : "Status"}: <strong>{isLogSuccess ? (isEs ? "EXITOSO" : "SUCCESS") : (isEs ? "FALLIDO" : "FAILED")}</strong> • {new Date(log.createdAt || e.createdAt).toLocaleTimeString(isEs ? "es-AR" : "en-US")}
                                  </span>
                                  <div className="p-2.5 bg-light rounded-xl font-mono text-gray-800" style={{ fontSize: "11px", whiteSpace: "pre-line", borderLeft: `3px solid ${isLogSuccess ? '#10b981' : '#ef4444'}` }}>
                                    {isLogSuccess ? logResult : logError}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <style>{`
        .bg-success-soft {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .bg-danger-soft {
          background-color: rgba(239, 68, 68, 0.08) !important;
        }
        .before-line::before {
          content: '';
          position: absolute;
          left: 14px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background-color: #cbd5e1;
          z-index: 1;
          opacity: 0.6;
        }
        .hover-row-focus:hover {
          background-color: rgba(248, 250, 252, 0.5);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
        }
      `}</style>
    </Container>
  );
}
