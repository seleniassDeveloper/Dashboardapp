import React, { useState, useMemo } from "react";
import { ArrowLeft, Play, Pause, Trash2, CheckCircle2, ChevronRight, MessageSquare, Mail, Zap, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { SYNC_TRIGGERS, SYNC_ACTIONS } from "../WorkflowBuilder.jsx";

export default function FlowDetail({
  workflow,
  executions,
  onBack,
  onToggleStatus,
  onDeleteWorkflow,
  onStartVisual
}) {
  const [activeSubTab, setActiveSubTab] = useState("summary"); // summary | executions | activity

  const isActive = workflow.status === "ACTIVE";

  // Helper to separate emoji and clean name
  const parseName = (item) => {
    if (!item) return { emoji: "⚙️", name: "" };
    const nameStr = item.name || "";
    const emojiMatch = nameStr.match(/^[\p{Emoji}\u200d\uFE0F]+/u);
    const emoji = emojiMatch ? emojiMatch[0] : "⚙️";
    const cleanName = nameStr.replace(/^[\p{Emoji}\u200d\uFE0F\s]+/u, "");
    return { emoji, name: cleanName };
  };

  const getTriggerItem = () => {
    return SYNC_TRIGGERS.find(t => t.subtype === workflow.trigger?.type);
  };

  const getActionItem = () => {
    if (!workflow.steps || workflow.steps.length === 0) return null;
    const actionNode = workflow.steps.find(s => s.type === "action");
    if (!actionNode) return null;
    return SYNC_ACTIONS.find(a => a.subtype === actionNode.subtype);
  };

  const getLogicItem = () => {
    if (!workflow.steps || workflow.steps.length === 0) return null;
    const delayNode = workflow.steps.find(s => s.type === "delay");
    if (delayNode) return { name: "⏳ Retardo (Delay)" };
    const conditionNode = workflow.steps.find(s => s.type === "condition");
    if (conditionNode) return { name: "🧠 Condición (IF/ELSE)" };
    return null;
  };

  // Filter executions for this specific workflow
  const flowExecutions = useMemo(() => {
    return executions.filter(e => {
      return String(e.workflow?.name || "").toLowerCase() === String(workflow.name || "").toLowerCase();
    });
  }, [executions, workflow.name]);

  const totalRuns = flowExecutions.length;
  const failedRuns = flowExecutions.filter(e => e.status === "FAILED").length;
  const successRuns = totalRuns - failedRuns;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 98;

  const triggerInfo = parseName(getTriggerItem());
  const actionInfo = parseName(getActionItem());
  const logicItem = getLogicItem();

  return (
    <div className="flow-detail-view">
      {/* 1. Header with Back and Menu */}
      <div className="f-topbar">
        <button className="f-icon-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="f-topbar__title">Detalle del flujo</span>
        
        <Dropdown align="end">
          <Dropdown.Toggle as={CustomToggle} />
          <Dropdown.Menu style={{ borderRadius: "12px", border: "1px solid var(--f-border)" }}>
            <Dropdown.Item onClick={() => onToggleStatus(workflow)}>
              {isActive ? "Pausar" : "Activar"}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onDeleteWorkflow(workflow)} className="text-danger">
              Eliminar
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* 2. Flow Card Head */}
      <div className="f-card f-detail-head">
        <div className="f-detail-head__icon">
          {triggerInfo.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="f-detail-head__name">{workflow.name}</h2>
          <span className={`f-badge ${isActive ? "f-badge--active" : "f-badge--draft"}`}>
            {isActive ? "Activo" : "Pausado"}
          </span>
        </div>
        <button 
          className={`f-switch ${isActive ? "f-switch--on" : ""}`}
          onClick={() => onToggleStatus(workflow)}
          aria-label="Toggle Status"
        />
      </div>

      {/* 3. Sub Tabs */}
      <div className="f-tabs">
        <button 
          className={`f-tab ${activeSubTab === "summary" ? "f-tab--active" : ""}`}
          onClick={() => setActiveSubTab("summary")}
        >
          Resumen
        </button>
        <button 
          className={`f-tab ${activeSubTab === "executions" ? "f-tab--active" : ""}`}
          onClick={() => setActiveSubTab("executions")}
        >
          Ejecuciones ({flowExecutions.length})
        </button>
        <button 
          className={`f-tab ${activeSubTab === "activity" ? "f-tab--active" : ""}`}
          onClick={() => setActiveSubTab("activity")}
        >
          Actividad
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeSubTab === "summary" && (
        <div className="subtab-summary">
          <div className="f-card f-review-block">
            <h4>Disparador</h4>
            <div className="f-review-item">
              <div className="f-review-item__icon">
                {triggerInfo.emoji}
              </div>
              <span>{triggerInfo.name || "Evento"}</span>
            </div>
          </div>

          <div className="f-card f-review-block">
            <h4>Acción</h4>
            {actionInfo.name ? (
              <div className="f-review-item">
                <div className="f-review-item__icon" style={{ backgroundColor: "#e7f7f0", color: "#10b981" }}>
                  {actionInfo.emoji}
                </div>
                <span>{actionInfo.name}</span>
              </div>
            ) : (
              <div className="text-muted italic" style={{ fontSize: "13px" }}>No se definió acción.</div>
            )}

            {logicItem && (
              <div className="f-review-item mt-3 pt-3 border-top">
                <div className="f-review-item__icon" style={{ backgroundColor: "#fef3c7", color: "#f59e0b" }}>
                  ⏳
                </div>
                <span>Control lógico: {logicItem.name}</span>
              </div>
            )}
          </div>

          {/* Performance stats summary */}
          <div className="f-card f-review-block">
            <h4>Rendimiento (últimos 30 días)</h4>
            <div className="f-perf">
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e1b2e" }}>
                  {totalRuns || 245}
                </div>
                <div style={{ fontSize: "11px", color: "var(--f-muted)" }}>Ejecuciones</div>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--f-green)" }}>
                  {successRate}%
                </div>
                <div style={{ fontSize: "11px", color: "var(--f-muted)" }}>Exitosas</div>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--f-red)" }}>
                  {failedRuns || 5}
                </div>
                <div style={{ fontSize: "11px", color: "var(--f-muted)" }}>Con errores</div>
              </div>
            </div>
          </div>

          {/* Last run timestamp */}
          <div className="f-card f-review-block">
            <h4>Última ejecución</h4>
            <div className="d-flex align-items-center justify-content-between">
              <span style={{ fontSize: "13px", color: "var(--f-text)" }}>
                {flowExecutions.length > 0 ? new Date(flowExecutions[0].createdAt).toLocaleString("es-AR") : "Hoy, 08:35"}
              </span>
              <span className="f-badge f-badge--active">Exitosa</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "executions" && (
        <div className="subtab-executions">
          {flowExecutions.length === 0 ? (
            <div className="text-center py-5 text-muted f-card" style={{ fontSize: "13px" }}>
              No hay ejecuciones registradas para este flujo.
            </div>
          ) : (
            flowExecutions.map(e => {
              const hasError = e.status === "FAILED";
              return (
                <div key={e.id} className="f-card f-exec" style={{ padding: "12px 14px" }}>
                  <div className={`f-exec__icon ${hasError ? "f-exec__icon--err" : "f-exec__icon--ok"}`}>
                    {hasError ? "🚨" : "✅"}
                  </div>
                  <div className="f-exec__body">
                    <div className="f-exec__time">
                      {new Date(e.createdAt).toLocaleTimeString("es-AR")}
                    </div>
                    <div className="f-exec__sub">
                      Cliente: Cita confirmada
                    </div>
                  </div>
                  <span className={`f-badge ${hasError ? "f-badge--draft" : "f-badge--active"}`}>
                    {hasError ? "Falló" : "Exitosa"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeSubTab === "activity" && (
        <div className="subtab-activity">
          <div className="f-card">
            <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--f-muted)", margin: "0 0 10px" }}>Descripción del flujo</h4>
            <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "var(--f-text)" }}>
              {workflow.description || "Este flujo no tiene una descripción detallada asignada."}
            </p>
          </div>
          <div className="f-card">
            <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--f-muted)", margin: "0 0 10px" }}>Auditoría</h4>
            <div style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              Creado: {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString("es-AR") : new Date().toLocaleDateString("es-AR")}<br />
              Último cambio: {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString("es-AR") : new Date().toLocaleDateString("es-AR")}
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom Actions Row */}
      <div className="f-actions-row">
        <button className="f-method__btn f-btn-outline" onClick={onStartVisual}>
          Editar
        </button>
        
        <Dropdown align="end" style={{ flex: 1 }}>
          <Dropdown.Toggle as={CustomActionToggle} />
          <Dropdown.Menu style={{ borderRadius: "12px", border: "1px solid var(--f-border)", width: "100%" }}>
            <Dropdown.Item onClick={() => onToggleStatus(workflow)}>
              {isActive ? "Pausar flujo" : "Reactivar flujo"}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onDeleteWorkflow(workflow)} className="text-danger">
              Eliminar permanentemente
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
}

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    style={{
      background: "none",
      border: 0,
      color: "var(--f-text)",
      fontSize: "20px",
      lineHeight: 1,
      padding: "4px 8px"
    }}
  >
    ⋮
  </button>
));

const CustomActionToggle = React.forwardRef(({ onClick }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="f-method__btn"
    style={{ width: "100%" }}
  >
    Más acciones
  </button>
));
