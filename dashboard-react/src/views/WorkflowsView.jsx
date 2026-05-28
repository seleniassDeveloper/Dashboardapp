import React, { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Badge, Button, Spinner, Alert, Form } from "react-bootstrap";
import { Play, Plus, GitBranch, Zap, Pencil, Trash2, Pause, Sparkles, Activity, FileText, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import WorkflowBuilder from "../components/workflows/WorkflowBuilder.jsx";
import WorkflowExecutionLogs from "../components/workflows/WorkflowExecutionLogs.jsx";
import api from "../lib/api.js";

function getTriggerLabel(type) {
  const map = {
    "nueva-cita": "📅 Nueva Cita",
    "cita-confirmada": "✅ Cita Confirmada",
    "cita-cancelada": "❌ Cita Cancelada",
    "cita-finalizada": "🏁 Cita Finalizada",
    "cliente-nuevo": "👤 Cliente Nuevo",
    "cliente-inactivo": "⚠️ Cliente Inactivo",
    "stock-bajo": "📦 Stock Bajo",
    "pago-recibido": "💸 Pago Recibido"
  };
  return map[type] || type || "—";
}

function getStepsSummary(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return "—";
  // Filter out the trigger node to show actual actions
  const actionSteps = steps.filter(s => s.type !== "trigger");
  if (actionSteps.length === 0) return "Solo Disparador";
  
  return actionSteps
    .map(s => {
      const map = {
        "whatsapp": "📱 WhatsApp",
        "email": "✉️ Email",
        "notificacion": "🔔 Push",
        "crear-tarea": "📝 Tarea",
        "condition": "🧠 Condición (IF/ELSE)",
        "delay": "⏳ Delay"
      };
      return map[s.subtype] || s.name || s.type;
    })
    .join(" → ");
}

export default function WorkflowsView() {
  const { t } = useTranslation("views");
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState({ totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("workflows"); // "workflows" | "logs"

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [statsRes, wfRes] = await Promise.all([
        api.get(`/workflows/stats/summary`),
        api.get(`/workflows`),
      ]);
      setStats(statsRes.data || { totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0 });
      setWorkflows(Array.isArray(wfRes.data) ? wfRes.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Error cargando workflows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setShowBuilder(true);
  };

  const openEdit = (wf) => {
    setEditing(wf);
    setShowBuilder(true);
  };

  const toggleStatus = async (wf) => {
    const next = wf.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.patch(`/workflows/${wf.id}/status`, { status: next });
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Error cambiando estado.");
    }
  };

  const deleteWorkflow = async (wf) => {
    if (!window.confirm(`¿Eliminar "${wf.name}"?`)) return;
    try {
      await api.delete(`/workflows/${wf.id}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Error eliminando.");
    }
  };

  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3 d-flex align-items-center gap-2">
            <GitBranch className="text-purple-600 animate-pulse" size={28} />
            <span>{t("workflows.title")}</span>
          </h1>
          <p className="text-muted mb-0">{t("workflows.subtitle")}</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="dark"
            className="d-flex align-items-center gap-2 px-4 py-2.5 shadow-sm"
            style={{ borderRadius: "12px", background: "#111827" }}
            onClick={openCreate}
          >
            <Plus size={18} />
            <span>{t("workflows.newWorkflow")}</span>
          </Button>
        </div>
      </header>

      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

      {/* ERP METRICS WIDGETS */}
      <Row className="g-4 mb-4">
        <Col lg={4} md={6}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>Automatizaciones Activas</div>
              <div className="h3 fw-black m-0 text-success">{stats.activeWorkflows}</div>
            </div>
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-xl">
              <Zap size={24} />
            </div>
          </div>
        </Col>
        <Col lg={4} md={6}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>Total de Flujos</div>
              <div className="h3 fw-black m-0 text-purple-600">{stats.totalWorkflows}</div>
            </div>
            <div className="p-3 bg-purple bg-opacity-10 text-purple-600 rounded-xl">
              <GitBranch size={24} />
            </div>
          </div>
        </Col>
        <Col lg={4} md={12}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>Ejecuciones Persistidas</div>
              <div className="h3 fw-black m-0 text-dark">{stats.totalRuns}</div>
            </div>
            <div className="p-3 bg-dark bg-opacity-5 text-dark rounded-xl">
              <Activity size={24} />
            </div>
          </div>
        </Col>
      </Row>

      {/* SEGMENTED TAB NAVIGATION */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-4">
        <div className="d-flex gap-3">
          <button
            onClick={() => setActiveTab("workflows")}
            className={`btn-tab d-flex align-items-center gap-2 pb-2.5 px-1 fw-bold text-decoration-none border-0 bg-transparent position-relative ${activeTab === "workflows" ? "text-purple-600 active" : "text-muted"}`}
            style={{ fontSize: "15px", cursor: "pointer" }}
          >
            <Sparkles size={18} />
            <span>Flujos Configurados</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`btn-tab d-flex align-items-center gap-2 pb-2.5 px-1 fw-bold text-decoration-none border-0 bg-transparent position-relative ${activeTab === "logs" ? "text-purple-600 active" : "text-muted"}`}
            style={{ fontSize: "15px", cursor: "pointer" }}
          >
            <ClipboardList size={18} />
            <span>Bitácora de Auditoría (Logs)</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "workflows" ? (
        <Row className="g-4">
          <Col md={12}>
            {loading ? (
              <div className="text-center py-5 text-muted">
                <Spinner size="sm" className="me-2" /> Cargando flujos de automatizaciones…
              </div>
            ) : workflows.length === 0 ? (
              <div className="card-premium p-5 text-center bg-white border rounded-2xl shadow-sm">
                <GitBranch size={48} className="text-muted mb-3 opacity-20" />
                <h4 className="fw-bold text-gray-800">Crea tu primer flujo de automatización</h4>
                <p className="text-muted mb-4 max-w-md mx-auto">
                  Configura disparadores en tiempo real (citas, stock, cobros) y bifurca decisiones dinámicas para enviar WhatsApps, emails o tareas al equipo.
                </p>
                <Button 
                  variant="dark" 
                  className="px-4 py-2" 
                  style={{ borderRadius: "10px", background: "#111827" }} 
                  onClick={openCreate}
                >
                  <Plus size={16} className="me-1.5" /> Diseñar primer workflow
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {workflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="card-premium p-4 d-flex align-items-center justify-content-between flex-wrap gap-3 bg-white border rounded-2xl shadow-sm transition-all hover-scale"
                  >
                    <div className="d-flex align-items-center gap-4 flex-grow-1 min-w-0">
                      <div
                        className="p-3.5 rounded-xl bg-light bg-opacity-50 text-purple-600"
                        style={{ background: wf.status === "ACTIVE" ? "rgba(124, 58, 237, 0.08)" : "rgba(107, 114, 128, 0.08)" }}
                      >
                        <GitBranch size={24} />
                      </div>
                      <div className="min-w-0 flex-grow-1">
                        <div className="d-flex align-items-center gap-2.5 flex-wrap">
                          <h3 className="h6 fw-black m-0 text-gray-900 truncate">
                            {wf.name}
                          </h3>
                          <Badge 
                            bg={wf.status === "ACTIVE" ? "success-soft" : "secondary-soft"}
                            className={wf.status === "ACTIVE" ? "text-success border border-success border-opacity-10" : "text-muted border border-secondary border-opacity-10"}
                            style={{ borderRadius: "6px" }}
                          >
                            {wf.status === "ACTIVE" ? "ACTIVO" : wf.status === "PAUSED" ? "PAUSADO" : "BORRADOR"}
                          </Badge>
                        </div>
                        {wf.description && (
                          <p className="text-muted smaller mb-1 mt-0.5 text-truncate" style={{ maxWidth: "600px" }}>{wf.description}</p>
                        )}
                        <div className="d-flex align-items-center gap-3 text-muted smaller mt-1.5 flex-wrap">
                          <span className="d-flex align-items-center gap-1">
                            <Zap size={13} className="text-warning" /> Disparador: <strong>{getTriggerLabel(wf.trigger?.type)}</strong>
                          </span>
                          <span className="opacity-50">•</span>
                          <span className="text-truncate">Lógica: <strong>{getStepsSummary(wf.steps)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2.5 flex-wrap-reverse justify-content-end">
                      <div className="text-end me-2.5">
                        <div className="fw-bold small text-gray-900">{wf.runCount || 0} corridas</div>
                        <span className="smaller text-muted">Ejecuciones exitosas</span>
                      </div>
                      
                      <Button 
                        variant="light" 
                        className="p-2.5 border rounded-xl hover-bg-gray-100" 
                        title={wf.status === "ACTIVE" ? "Pausar Automatización" : "Activar Automatización"} 
                        onClick={() => toggleStatus(wf)}
                      >
                        {wf.status === "ACTIVE" ? <Pause size={15} className="text-secondary" /> : <Play size={15} className="text-success" />}
                      </Button>

                      <Button 
                        variant="light" 
                        className="p-2.5 border rounded-xl hover-bg-gray-100" 
                        title="Diseñar Flujo Visual" 
                        onClick={() => openEdit(wf)}
                      >
                        <Pencil size={15} className="text-purple-600" />
                      </Button>

                      <Button 
                        variant="light" 
                        className="p-2.5 border rounded-xl hover-bg-gray-100 text-danger" 
                        title="Eliminar Flujo" 
                        onClick={() => deleteWorkflow(wf)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Col>
        </Row>
      ) : (
        <WorkflowExecutionLogs />
      )}

      {/* FULL VIEWPORT WORKFLOW BUILDER OVERLAY */}
      {showBuilder && (
        <WorkflowBuilder
          show={showBuilder}
          onHide={() => setShowBuilder(false)}
          initialData={editing}
          onSaved={load}
        />
      )}

      <style>{`
        .btn-tab {
          transition: all 0.25s ease;
        }
        .btn-tab.active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          background-color: #7c3aed;
          border-radius: 99px;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(0,0,0,0.06) !important;
        }
        .bg-success-soft {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .bg-purple-soft {
          background-color: rgba(124, 58, 237, 0.08) !important;
        }
        .bg-secondary-soft {
          background-color: rgba(107, 114, 128, 0.08) !important;
        }
      `}</style>
    </Container>
  );
}

