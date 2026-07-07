import React from "react";
import { ArrowLeft, ChevronRight, Zap, GitBranch, Sparkles } from "lucide-react";
import { TEMPLATES } from "../../../views/TemplatesView.jsx";

export default function NewFlowMethod({ onBack, onStartWizard, onStartVisual, onViewTemplates }) {
  // Grab a couple templates for preview
  const previewTemplates = TEMPLATES.slice(0, 2);

  return (
    <div className="new-flow-method-view">
      {/* Header with Back button */}
      <div className="f-topbar">
        <button className="f-icon-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="f-topbar__title">Nuevo Flujo</span>
      </div>

      <div style={{ fontSize: "14px", color: "var(--f-muted)", margin: "0 0 20px 4px" }}>
        Elige cómo quieres crear tu automatización.
      </div>

      {/* Card 1: Configuración Rápida */}
      <div className="f-card f-method">
        <div className="f-method__icon">
          <Zap size={24} />
        </div>
        <h3 className="f-method__title">Configuración Rápida</h3>
        <p className="f-method__desc">Crea tu flujo en pocos pasos con un formulario guiado.</p>
        <button className="f-method__btn" onClick={onStartWizard}>
          Crear rápido
        </button>
      </div>

      {/* Card 2: Diseñador Visual */}
      <div className="f-card f-method">
        <div className="f-method__icon" style={{ backgroundColor: "#f0eef7", color: "var(--f-purple)" }}>
          <GitBranch size={24} />
        </div>
        <h3 className="f-method__title">Diseñador Visual</h3>
        <p className="f-method__desc">Construye flujos avanzados arrastrando y conectando pasos.</p>
        <button className="f-method__btn f-method__btn--outline" onClick={onStartVisual}>
          Ver flujo (solo lectura)
        </button>
        <div className="f-method__note">
          La edición visual está disponible en escritorio.
        </div>
      </div>

      {/* Templates section */}
      <div className="d-flex justify-content-between align-items-center mb-3 mt-4" style={{ padding: "0 4px" }}>
        <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e1b2e" }}>O empieza desde una plantilla</span>
        <button 
          onClick={onViewTemplates}
          style={{ background: "none", border: 0, color: "var(--f-purple)", fontSize: "12px", fontWeight: "700" }}
        >
          Ver todas
        </button>
      </div>

      {/* Quick Template Cards */}
      {previewTemplates.map(tpl => (
        <div key={tpl.id} className="f-card f-tpl" onClick={onViewTemplates}>
          <div className="f-tpl__icon">
            <Sparkles size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1e1b2e" }}>
              {tpl.nameEs}
            </div>
            <div style={{ fontSize: "11px", color: "var(--f-muted)", marginTop: "2px" }} className="text-truncate">
              {tpl.descEs}
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "#cbd5e1" }} />
        </div>
      ))}
    </div>
  );
}
