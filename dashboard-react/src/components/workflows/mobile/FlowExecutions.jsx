import React, { useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";

export default function FlowExecutions({ executions, onBack }) {
  const [activeTab, setActiveTab] = useState("all"); // all | success | failed
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return executions.filter(e => {
      if (activeTab === "success") return e.status === "SUCCESS";
      if (activeTab === "failed") return e.status === "FAILED";
      return true;
    });
  }, [executions, activeTab]);

  const handleToggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="flow-executions-view">
      {/* 1. Top Bar */}
      <div className="f-topbar">
        <button className="f-icon-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="f-topbar__title">Ejecuciones</span>
        <button className="f-icon-btn">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* 2. Sub Tabs */}
      <div className="f-tabs">
        <button 
          className={`f-tab ${activeTab === "all" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Todas
        </button>
        <button 
          className={`f-tab ${activeTab === "success" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("success")}
        >
          Exitosas
        </button>
        <button 
          className={`f-tab ${activeTab === "failed" ? "f-tab--active" : ""}`}
          onClick={() => setActiveTab("failed")}
        >
          Con errores
        </button>
      </div>

      {/* 3. Executions Log List */}
      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted f-card" style={{ fontSize: "13px" }}>
          No hay registros para este filtro.
        </div>
      ) : (
        <div className="executions-list-container">
          {filtered.map(e => {
            const hasError = e.status === "FAILED";
            const isExpanded = expandedId === e.id;
            const flowName = e.workflow?.name || "Flujo";

            return (
              <div key={e.id} className="f-card p-0" style={{ overflow: "hidden" }}>
                {/* Row Header */}
                <div 
                  onClick={() => handleToggleExpand(e.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", cursor: "pointer" }}
                >
                  <div className={`f-exec__icon ${hasError ? "f-exec__icon--err" : "f-exec__icon--ok"}`}>
                    {hasError ? "🚨" : "✅"}
                  </div>
                  <div className="f-exec__body">
                    <div className="f-exec__time">
                      {new Date(e.createdAt).toLocaleTimeString("es-AR")}
                    </div>
                    <div className="f-exec__sub">
                      {flowName} · {e.triggerType}
                    </div>
                  </div>
                  <span className={`f-badge ${hasError ? "f-badge--draft" : "f-badge--active"}`} style={{ marginRight: "4px" }}>
                    {hasError ? "Error" : "Exitosa"}
                  </span>
                  {isExpanded ? <ChevronUp size={16} style={{ color: "var(--f-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--f-muted)" }} />}
                </div>

                {/* Expanded step trace logs */}
                {isExpanded && (
                  <div style={{ padding: "14px", borderTop: "1px solid var(--f-border)", backgroundColor: "var(--f-bg)", fontSize: "12.5px" }}>
                    <div style={{ fontWeight: "700", color: "var(--f-text)", marginBottom: "8px" }}>
                      Trazabilidad del Flujo:
                    </div>
                    
                    {(!e.logs || e.logs.length === 0) ? (
                      <div className="text-muted italic">Sin sub-logs detallados.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {e.logs.map(log => {
                          const isLogSuccess = log.status === "SUCCESS";
                          return (
                            <div key={log.id} style={{ padding: "8px 10px", borderLeft: `3px solid ${isLogSuccess ? 'var(--f-green)' : 'var(--f-red)'}`, backgroundColor: "#fff", borderRadius: "8px" }}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span style={{ fontWeight: "700" }}>{log.nodeName}</span>
                                <span style={{ fontSize: "10px", color: isLogSuccess ? "var(--f-green)" : "var(--f-red)" }}>
                                  {isLogSuccess ? "OK" : "ERROR"}
                                </span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--f-muted)" }}>
                                {isLogSuccess ? (log.result || "Acción completada.") : (log.error || "Fallo en ejecución.")}
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
    </div>
  );
}
