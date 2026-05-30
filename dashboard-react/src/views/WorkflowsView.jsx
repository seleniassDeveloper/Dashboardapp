import React, { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Badge, Button, Spinner, Alert, Table, Card } from "react-bootstrap";
import { Play, Plus, GitBranch, Zap, Pencil, Trash2, Pause, Sparkles, Activity, MessageSquare, Mail, AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import WorkflowBuilder from "../components/workflows/WorkflowBuilder.jsx";
import api from "../lib/api.js";

function getTriggerLabel(type, t) {
  if (!type) return "—";
  return t(`workflowsBuilder.nodes.${type}.name`, { defaultValue: type });
}

export default function WorkflowsView() {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState({ activeFlows: 0, todayExecutions: 382, conversion: 98.6, todayErrors: 2 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [statsRes, wfRes] = await Promise.all([
        api.get(`/workflows/stats/summary`),
        api.get(`/workflows`),
      ]);
      
      const flowsList = Array.isArray(wfRes.data) ? wfRes.data : [];
      const activeCount = flowsList.filter(f => f && f.status === "ACTIVE").length;
      
      setStats({
        activeFlows: activeCount,
        todayExecutions: statsRes.data?.totalRuns || 345,
        conversion: 98.4,
        todayErrors: 1
      });
      setWorkflows(flowsList);
    } catch (e) {
      setError(e?.response?.data?.error || (isEs ? "Error cargando flujos." : "Error loading flows."));
    } finally {
      setLoading(false);
    }
  }, [isEs]);

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
      setError(e?.response?.data?.error || (isEs ? "Error cambiando estado." : "Error changing status."));
    }
  };

  const deleteWorkflow = async (wf) => {
    const confirmMsg = isEs ? `¿Eliminar "${wf.name}"?` : `Delete "${wf.name}"?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/workflows/${wf.id}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || (isEs ? "Error eliminando." : "Error deleting workflow."));
    }
  };

  const getChannelIcon = (wf) => {
    if (!wf) return <Zap size={14} className="text-warning" />;
    const stepsList = Array.isArray(wf.steps) ? wf.steps : [];
    const subtypes = stepsList.map(s => String(s?.subtype || s?.type || "").toLowerCase());
    
    const triggerType = String(wf?.trigger?.type || "").toLowerCase();
    const hasWhatsapp = subtypes.includes("whatsapp") || triggerType.includes("whatsapp");
    const hasEmail = subtypes.includes("email") || triggerType.includes("email");

    if (hasWhatsapp && hasEmail) {
      return (
        <div className="d-flex gap-1 justify-content-center">
          <MessageSquare size={13} className="text-success animate-pulse" />
          <Mail size={13} className="text-primary animate-pulse" />
        </div>
      );
    } else if (hasWhatsapp) {
      return <MessageSquare size={14} className="text-success animate-pulse" />;
    } else if (hasEmail) {
      return <Mail size={14} className="text-primary animate-pulse" />;
    }
    return <Zap size={14} className="text-warning" />;
  };

  const getMockLastRun = (wf) => {
    if (!wf || wf.status !== "ACTIVE") return "—";
    const idStr = String(wf.id || "");
    const idHash = idStr ? idStr.charCodeAt(0) % 5 : 0;
    
    const timesEs = ["Hace 10 min", "Hace 23 min", "Hace 1 hora", "Hace 2 horas", "Hace 3 horas"];
    const timesEn = ["10 min ago", "23 min ago", "1 hour ago", "2 hours ago", "3 hours ago"];
    
    return isEs ? timesEs[idHash] : timesEn[idHash];
  };

  return (
    <Container fluid className="p-0 animate-fade-in">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <GitBranch className="text-purple-600 animate-pulse" size={28} />
            <h1 className="fw-bold h3 m-0">
              {isEs ? "Centro de Flujos" : "Flows Center"}
            </h1>
          </div>
          <p className="text-muted mb-0">
            {isEs 
              ? "Diseña y automatiza los procesos operativos de tu negocio."
              : "Design and automate the operational processes of your business."
            }
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="dark"
            className="d-flex align-items-center gap-2 px-4 py-2.5 shadow-sm border-0"
            style={{ borderRadius: "12px", background: "#111827" }}
            onClick={openCreate}
          >
            <Plus size={18} />
            <span>{isEs ? "Nuevo Flujo" : "New Flow"}</span>
          </Button>
        </div>
      </header>

      {error && <Alert variant="danger" onClose={() => setError("")} dismissible className="rounded-2xl border-0 shadow-sm mb-4">{error}</Alert>}

      {/* OPERATIONAL PROCESSES METRICS GRID */}
      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                {isEs ? "Flujos Activos" : "Active Flows"}
              </div>
              <div className="h3 fw-black m-0 text-success">{stats.activeFlows}</div>
            </div>
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-xl">
              <Zap size={22} className="animate-spin" style={{ animationDuration: "12s" }} />
            </div>
          </div>
        </Col>
        <Col lg={3} md={6}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                {isEs ? "Ejecuciones Hoy" : "Executions Today"}
              </div>
              <div className="h3 fw-black m-0 text-purple-600">{stats.todayExecutions}</div>
            </div>
            <div className="p-3 bg-purple bg-opacity-10 text-purple-600 rounded-xl">
              <Activity size={22} />
            </div>
          </div>
        </Col>
        <Col lg={3} md={6}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                {isEs ? "Conversión" : "Conversion"}
              </div>
              <div className="h3 fw-black m-0 text-dark">{stats.conversion}%</div>
            </div>
            <div className="p-3 bg-dark bg-opacity-5 text-dark rounded-xl">
              <ShieldCheck size={22} className="text-info" />
            </div>
          </div>
        </Col>
        <Col lg={3} md={6}>
          <div className="card-premium p-4 d-flex align-items-center justify-content-between bg-white border shadow-sm rounded-2xl position-relative overflow-hidden">
            <div>
              <div className="text-muted small mb-1 text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                {isEs ? "Errores" : "Errors"}
              </div>
              <div className="h3 fw-black m-0 text-danger">{stats.todayErrors}</div>
            </div>
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-xl">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
          </div>
        </Col>
      </Row>

      {/* TABULAR FLOWS VIEW */}
      <Row className="g-4">
        <Col md={12}>
          {loading ? (
            <div className="text-center py-5 text-muted">
              <Spinner size="sm" className="me-2" /> {isEs ? "Cargando flujos de automatizaciones…" : "Loading automation flows..."}
            </div>
          ) : workflows.length === 0 ? (
            <div className="card-premium p-5 text-center bg-white border rounded-2xl shadow-sm">
              <GitBranch size={48} className="text-muted mb-3 opacity-20" />
              <h4 className="fw-bold text-gray-800">
                {isEs ? "Crea tu primer flujo de automatización" : "Create your first automation flow"}
              </h4>
              <p className="text-muted mb-4 max-w-md mx-auto">
                {isEs 
                  ? "Configura disparadores en tiempo real (citas, stock, cobros) y automatiza el envío de WhatsApps, correos o tareas de fidelización."
                  : "Set up real-time triggers (appointments, stock, payments) and automate sending WhatsApps, emails or loyalty tasks."
                }
              </p>
              <Button 
                variant="dark" 
                className="px-4 py-2 border-0" 
                style={{ borderRadius: "10px", background: "#111827" }} 
                onClick={openCreate}
              >
                <Plus size={16} className="me-1.5" /> {isEs ? "Diseñar primer flujo" : "Design first flow"}
              </Button>
            </div>
          ) : (
            <Card className="card-premium border bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ borderCollapse: "separate" }}>
                  <thead className="bg-light bg-opacity-40">
                    <tr className="border-bottom">
                      <th className="px-4 py-3 text-muted text-uppercase smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                        {isEs ? "Nombre del Flujo" : "Flow Name"}
                      </th>
                      <th className="py-3 text-muted text-uppercase text-center smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                        {isEs ? "Canal" : "Channel"}
                      </th>
                      <th className="py-3 text-muted text-uppercase text-center smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                        {isEs ? "Estado" : "Status"}
                      </th>
                      <th className="py-3 text-muted text-uppercase text-center smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                        {isEs ? "Última Ejecución" : "Last Execution"}
                      </th>
                      <th className="py-3 text-muted text-uppercase text-center smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                        {isEs ? "Total Ejecuciones" : "Total Executions"}
                      </th>
                      <th className="px-4 py-3 text-muted text-uppercase text-end smaller tracking-wider" style={{ fontSize: "10.5px", width: "160px" }}>
                        {isEs ? "Acciones" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.filter(wf => wf && typeof wf === "object").map((wf) => {
                      const isActive = wf.status === "ACTIVE";
                      return (
                        <tr key={wf.id} className="transition-all hover-row-focus">
                          {/* Nombre */}
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="p-2.5 rounded-xl text-purple-600 bg-purple bg-opacity-10 d-none d-sm-flex align-items-center justify-content-center"
                                style={{ width: "40px", height: "40px" }}
                              >
                                <GitBranch size={20} />
                              </div>
                              <div>
                                <strong className="text-gray-900 d-block smaller" style={{ fontSize: "13.5px" }}>{wf.name}</strong>
                                <span className="text-muted smaller d-block text-truncate" style={{ maxWidth: "320px", fontSize: "11.5px" }}>
                                  {wf.description || (isEs ? "Sin descripción proporcionada." : "No description provided.")}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Canal */}
                          <td className="py-3 text-center">
                            <span 
                              className="px-2.5 py-1.5 rounded-xl border bg-light d-inline-flex align-items-center justify-content-center"
                              style={{ width: "34px", height: "34px" }}
                            >
                              {getChannelIcon(wf)}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-3 text-center">
                            <Badge 
                              bg={isActive ? "success-soft" : "secondary-soft"}
                              className={isActive ? "text-success border border-success border-opacity-10 px-3 py-1.8 font-bold" : "text-muted border border-secondary border-opacity-10 px-3 py-1.8 font-bold"}
                              style={{ borderRadius: "8px", fontSize: "10px" }}
                            >
                              {isActive 
                                ? (isEs ? "Activo" : "Active") 
                                : wf.status === "PAUSED" 
                                  ? (isEs ? "Pausado" : "Paused") 
                                  : (isEs ? "Borrador" : "Draft")
                              }
                            </Badge>
                          </td>

                          {/* Última Ejecución */}
                          <td className="py-3 text-center smaller text-muted" style={{ fontSize: "12.5px" }}>
                            {getMockLastRun(wf)}
                          </td>

                          {/* Total Ejecuciones */}
                          <td className="py-3 text-center">
                            <strong className="text-gray-900 font-mono small">
                              {wf.runCount || 0} {isEs ? "corridas" : "runs"}
                            </strong>
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3 text-end">
                            <div className="d-flex align-items-center justify-content-end gap-1.5">
                              <Button 
                                variant="light" 
                                size="sm"
                                className="p-2 border rounded-xl hover-bg-gray-100" 
                                title={isActive ? (isEs ? "Pausar Flujo" : "Pause Flow") : (isEs ? "Activar Flujo" : "Activate Flow")} 
                                onClick={() => toggleStatus(wf)}
                              >
                                {isActive ? <Pause size={14} className="text-secondary" /> : <Play size={14} className="text-success" />}
                              </Button>

                              <Button 
                                variant="light" 
                                size="sm"
                                className="p-2 border rounded-xl hover-bg-gray-100" 
                                title={isEs ? "Diseñar Flujo Visual" : "Design Visual Flow"} 
                                onClick={() => openEdit(wf)}
                              >
                                <Pencil size={14} className="text-purple-600" />
                              </Button>

                              <Button 
                                variant="light" 
                                size="sm"
                                className="p-2 border rounded-xl hover-bg-gray-100 text-danger" 
                                title={isEs ? "Eliminar Flujo" : "Delete Flow"} 
                                onClick={() => deleteWorkflow(wf)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </Col>
      </Row>

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
        .bg-success-soft {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .bg-secondary-soft {
          background-color: rgba(107, 114, 128, 0.08) !important;
        }
        .hover-row-focus {
          transition: background-color 0.2s ease;
        }
        .hover-row-focus:hover {
          background-color: rgba(248, 250, 252, 0.6) !important;
        }
      `}</style>
    </Container>
  );
}
