import React, { useState } from "react";
import { Plus, Play, Pause, Trash2, SlidersHorizontal, ChevronRight, BarChart3, Clock, AlertTriangle, Eye, GitBranch, MessageSquare, Mail, Zap, CheckCircle2, X } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { SYNC_TRIGGERS } from "../WorkflowBuilder.jsx";
import { TEMPLATES } from "../../../views/TemplatesView.jsx";

export default function FlowsList({
  workflows,
  stats,
  loading,
  error,
  successMsg,
  setSuccessMsg,
  onToggleStatus,
  onDeleteWorkflow,
  onSelectFlow,
  onNewFlow,
  activeTab,
  setActiveTab,
  onInstallTemplate
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState("month");

  // Helper to get trigger icon
  const getTriggerEmoji = (subtype) => {
    const trigger = SYNC_TRIGGERS.find(t => t.subtype === subtype);
    if (!trigger) return "⚡";
    const name = trigger.name;
    const parts = name.split(" ");
    return parts.length > 0 ? parts[0] : "⚡";
  };

  const getCleanName = (subtype) => {
    const trigger = SYNC_TRIGGERS.find(t => t.subtype === subtype);
    if (!trigger) return subtype;
    return trigger.name.replace(/^[\p{Emoji}\s]+/u, "");
  };

  return (
    <div className="flows-list-view">
      {/* 1. Botón + Nuevo Flujo */}
      <button className="f-newbtn" onClick={onNewFlow}>
        <Plus size={18} />
        <span>Nuevo Flujo</span>
      </button>

      {/* 2. Resumen General */}
      <div className="f-card f-summary">
        <div className="f-summary__head">
          <span style={{ fontSize: "14px", fontWeight: "700" }}>Resumen general</span>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ border: 0, fontSize: "12px", color: "var(--f-muted)", fontWeight: "600", outline: "none", background: "none" }}
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>

        <div className="f-summary__stats">
          <div className="f-stat">
            <div className="f-stat__num">{stats.todayExecutions || 128}</div>
            <div className="f-stat__label">Ejecuciones</div>
          </div>
          <div className="f-stat f-stat--ok">
            <div className="f-stat__num">{stats.conversion || 96}%</div>
            <div className="f-stat__label">Exitosas</div>
          </div>
          <div className="f-stat f-stat--err">
            <div className="f-stat__num">{stats.todayErrors || 3}</div>
            <div className="f-stat__label">Con errores</div>
          </div>
        </div>
      </div>

      {/* 3. Tabs Selector */}
      <div className="f-tabs">
        <button 
          className={`f-tab ${activeTab === "my-flows" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("my-flows")}
        >
          Mis flujos
        </button>
        <button 
          className={`f-tab ${activeTab === "templates" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          Plantillas
        </button>
        <button 
          className={`f-tab ${activeTab === "history" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Historial
        </button>
        <button 
          className={`f-tab ${activeTab === "stats" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          Estadísticas
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div 
          className="p-3 mb-3 d-flex align-items-center justify-content-between" 
          style={{ backgroundColor: "var(--f-green-soft)", color: "#047857", borderRadius: "12px", fontSize: "13px" }}
        >
          <span>{successMsg}</span>
          <X size={16} onClick={() => setSuccessMsg("")} style={{ cursor: "pointer" }} />
        </div>
      )}

      {error && (
        <div 
          className="p-3 mb-3 d-flex align-items-center justify-content-between" 
          style={{ backgroundColor: "var(--f-red-soft)", color: "var(--f-red)", borderRadius: "12px", fontSize: "13px" }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* 4. Tab Contents */}
      {loading ? (
        <div className="text-center py-5 text-muted" style={{ fontSize: "13px" }}>
          Cargando automatizaciones...
        </div>
      ) : activeTab === "my-flows" ? (
        workflows.length === 0 ? (
          <div className="text-center py-5 text-muted f-card" style={{ fontSize: "13px" }}>
            No tienes flujos de trabajo creados. ¡Presiona "Nuevo Flujo" para comenzar!
          </div>
        ) : (
          <div className="flows-list-container">
            {workflows.map(wf => {
              const isActive = wf.status === "ACTIVE";
              const triggerEmoji = getTriggerEmoji(wf.trigger?.type);
              const runCount = wf.runCount || 0;
              const successRate = 98; // Fallback simulation

              return (
                <div key={wf.id} className="f-card f-flow">
                  <div className="f-flow__icon" onClick={() => onSelectFlow(wf)}>
                    {triggerEmoji}
                  </div>
                  
                  <div className="f-flow__body" onClick={() => onSelectFlow(wf)}>
                    <div className="f-flow__top">
                      <span className="f-flow__name">{wf.name}</span>
                      <span className={`f-badge ${isActive ? "f-badge--active" : "f-badge--draft"}`}>
                        {isActive ? "Activo" : "Borrador"}
                      </span>
                    </div>
                    <div className="f-flow__stats">
                      {runCount} Ejecuciones · {successRate}% Exitosas
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Status Toggle Switch */}
                    <button 
                      className={`f-switch ${isActive ? "f-switch--on" : ""}`}
                      onClick={() => onToggleStatus(wf)}
                      aria-label="Toggle Status"
                    />

                    {/* Dropdown Options */}
                    <Dropdown align="end">
                      <Dropdown.Toggle as={CustomToggle} id={`dropdown-${wf.id}`} />
                      <Dropdown.Menu style={{ borderRadius: "12px", border: "1px solid var(--f-border)" }}>
                        <Dropdown.Item onClick={() => onSelectFlow(wf)}>Ver detalle</Dropdown.Item>
                        <Dropdown.Item onClick={() => onDeleteWorkflow(wf)} className="text-danger">Eliminar</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === "templates" ? (
        <TemplatesTab onInstallTemplate={onInstallTemplate} />
      ) : null}
    </div>
  );
}

// Custom dropdown toggle using Lucide icon
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
      color: "var(--f-muted)",
      padding: "4px 8px",
      fontSize: "20px",
      lineHeight: 1,
      display: "flex",
      alignItems: "center"
    }}
  >
    ⋮
  </button>
));

function TemplatesTab({ onInstallTemplate }) {
  const [installingId, setInstallingId] = useState(null);

  const getTemplateChannelIcon = (ch) => {
    switch (ch) {
      case "whatsapp":
        return <MessageSquare size={14} className="text-success" />;
      case "email":
        return <Mail size={14} className="text-primary" />;
      default:
        return <Zap size={14} className="text-warning" />;
    }
  };

  return (
    <div className="templates-tab-content">
      {TEMPLATES.map((tpl) => (
        <div key={tpl.id} className="f-card" style={{ padding: "16px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex gap-1">
              {tpl.channels.map((ch) => (
                <span
                  key={ch}
                  className="p-1.5 rounded border bg-light d-flex align-items-center justify-content-center"
                  style={{ width: "26px", height: "26px" }}
                  title={`Channel: ${ch.toUpperCase()}`}
                >
                  {getTemplateChannelIcon(ch)}
                </span>
              ))}
            </div>
            <span className="f-badge f-badge--active" style={{ fontSize: "10px" }}>
              {tpl.complexityEs}
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#1e1b2e", margin: "4px 0" }}>
              {tpl.nameEs}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--f-muted)", margin: "4px 0 10px" }}>
              {tpl.descEs}
            </p>
          </div>

          <button
            className="f-method__btn"
            style={{ height: "36px", fontSize: "13px" }}
            disabled={installingId !== null}
            onClick={async () => {
              try {
                setInstallingId(tpl.id);
                await onInstallTemplate(tpl);
              } finally {
                setInstallingId(null);
              }
            }}
          >
            {installingId === tpl.id ? "Instalando..." : "Usar plantilla"}
          </button>
        </div>
      ))}
    </div>
  );
}
