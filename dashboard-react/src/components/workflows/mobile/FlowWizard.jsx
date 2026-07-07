import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Check, Play, Zap, HelpCircle } from "lucide-react";
import { SYNC_TRIGGERS, SYNC_ACTIONS, SYNC_LOGIC } from "../WorkflowBuilder.jsx";
import api from "../../../lib/api.js";

export default function FlowWizard({ form }) {
  const {
    stepIndex,
    setStepIndex,
    name,
    setName,
    description,
    setDescription,
    status,
    setStatus,
    trigger,
    setTrigger,
    action,
    setAction,
    logic,
    setLogic,
    saving,
    error,
    setError,
    successMsg,
    nextStep,
    prevStep,
    executeSave
  } = form;

  // Simulation test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Helper to separate emoji and clean name
  const parseItemName = (item) => {
    const nameStr = item.name || "";
    const emojiMatch = nameStr.match(/^[\p{Emoji}\u200d\uFE0F]+/u);
    const emoji = emojiMatch ? emojiMatch[0] : "⚙️";
    const cleanName = nameStr.replace(/^[\p{Emoji}\u200d\uFE0F\s]+/u, "");
    return { emoji, name: cleanName };
  };

  const handleTestFlow = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError("");

      const payload = {
        triggerType: trigger,
        actionType: action,
        logicType: logic || null,
        simulation: true
      };

      const res = await api.post("/workflows/executions", payload);
      setTestResult({
        success: true,
        message: "¡Simulación de ejecución exitosa! Evento capturado y acción disparada correctamente."
      });
    } catch (err) {
      console.error(err);
      setTestResult({
        success: false,
        message: err?.response?.data?.error || "Error en la prueba de simulación."
      });
    } finally {
      setTesting(false);
    }
  };

  const currentTriggerItem = SYNC_TRIGGERS.find(t => t.subtype === trigger);
  const currentActionItem = SYNC_ACTIONS.find(a => a.subtype === action);
  const currentLogicItem = SYNC_LOGIC.find(l => l.subtype === logic);

  return (
    <div className="flow-wizard-view">
      {/* Segmented stepper header */}
      <div className="f-wiz-head">
        <div className="d-flex align-items-center gap-2">
          <button className="f-icon-btn" onClick={prevStep} disabled={stepIndex === 1}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: "16px", fontWeight: "700" }}>Nuevo Flujo</span>
        </div>
        
        <div className="f-wiz-head__sub mt-2" style={{ padding: "0 4px" }}>
          Paso {stepIndex} de 4
        </div>

        {/* 4 segments progress bar */}
        <div className="f-progress">
          {[1, 2, 3, 4].map(step => (
            <div 
              key={step} 
              className={`f-progress__seg ${step <= stepIndex ? "f-progress__seg--on" : ""}`} 
            />
          ))}
        </div>
      </div>

      {error && (
        <div 
          className="p-3 mb-3 d-flex align-items-center justify-content-between" 
          style={{ backgroundColor: "var(--f-red-soft)", color: "var(--f-red)", borderRadius: "12px", fontSize: "13px" }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* Step Contents */}
      {stepIndex === 1 && (
        <div className="wizard-step-1">
          <h2 className="f-wiz-title">Información general</h2>
          <p className="f-wiz-desc">Define los datos principales de esta automatización.</p>

          <div className="f-field">
            <label>Nombre del flujo *</label>
            <input 
              type="text" 
              placeholder="Ej. Recordatorio 24h antes" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="f-field">
            <label>Estado de publicación</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">Activo (En producción)</option>
              <option value="PAUSED">Borrador (Pausado)</option>
            </select>
          </div>

          <div className="f-field">
            <label>Descripción</label>
            <textarea 
              placeholder="Ej. Envía un recordatorio de cita a los clientes..." 
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 160) {
                  setDescription(e.target.value);
                }
              }}
            />
            <div className="f-field__charcounter">
              {description.length} / 160
            </div>
          </div>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="wizard-step-2">
          <h2 className="f-wiz-title">¿Cuándo se dispara?</h2>
          <p className="f-wiz-desc">Elige el disparador que iniciará este flujo.</p>

          <div className="triggers-list" style={{ marginTop: "12px" }}>
            {SYNC_TRIGGERS.map(item => {
              const { emoji, name: cleanName } = parseItemName(item);
              const isActive = trigger === item.subtype;

              return (
                <div 
                  key={item.subtype}
                  className={`f-pick ${isActive ? "f-pick--active" : ""}`}
                  onClick={() => {
                    setTrigger(item.subtype);
                    setError("");
                  }}
                >
                  <div className="f-pick__icon">{emoji}</div>
                  <div className="f-pick__body">
                    <div className="f-pick__name">{cleanName}</div>
                    <div className="f-pick__desc">{item.desc}</div>
                  </div>
                  <ChevronRight size={16} className="f-pick__chev" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stepIndex === 3 && (
        <div className="wizard-step-3">
          <h2 className="f-wiz-title">¿Qué quieres que haga?</h2>
          <p className="f-wiz-desc">Elige la acción que se ejecutará.</p>

          <div className="actions-list" style={{ marginTop: "12px" }}>
            {SYNC_ACTIONS.map(item => {
              const { emoji, name: cleanName } = parseItemName(item);
              const isActive = action === item.subtype;

              return (
                <div 
                  key={item.subtype}
                  className={`f-pick ${isActive ? "f-pick--active" : ""}`}
                  onClick={() => {
                    setAction(item.subtype);
                    setError("");
                  }}
                >
                  <div className="f-pick__icon" style={{ backgroundColor: "#e7f7f0", color: "#10b981" }}>{emoji}</div>
                  <div className="f-pick__body">
                    <div className="f-pick__name">{cleanName}</div>
                    <div className="f-pick__desc">{item.desc}</div>
                  </div>
                  <ChevronRight size={16} className="f-pick__chev" />
                </div>
              );
            })}
          </div>

          {/* Logic selection optional */}
          <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--f-purple)", margin: "24px 0 10px 4px" }}>
            Agregar control (opcional)
          </div>

          <div className="logic-list">
            {SYNC_LOGIC.map(item => {
              const { emoji, name: cleanName } = parseItemName(item);
              const isActive = logic === item.subtype;

              return (
                <div 
                  key={item.subtype}
                  className={`f-pick ${isActive ? "f-pick--active" : ""}`}
                  onClick={() => {
                    setLogic(isActive ? "" : item.subtype);
                  }}
                >
                  <div className="f-pick__icon" style={{ backgroundColor: "#fef3c7", color: "#f59e0b" }}>{emoji}</div>
                  <div className="f-pick__body">
                    <div className="f-pick__name">{cleanName}</div>
                    <div className="f-pick__desc">{item.desc}</div>
                  </div>
                  {isActive ? <Check size={16} className="text-success" /> : <ChevronRight size={16} className="f-pick__chev" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stepIndex === 4 && (
        <div className="wizard-step-4" style={{ paddingBottom: "160px" }}>
          <h2 className="f-wiz-title">Revisa y activa tu flujo</h2>
          <p className="f-wiz-desc">Resumen de tu automatización.</p>

          <div className="f-card f-review-block">
            <h4>Disparador</h4>
            {currentTriggerItem && (
              <div className="f-review-item">
                <div className="f-review-item__icon">
                  {parseItemName(currentTriggerItem).emoji}
                </div>
                <span>{parseItemName(currentTriggerItem).name}</span>
              </div>
            )}
          </div>

          <div className="f-card f-review-block">
            <h4>Acción</h4>
            {currentActionItem && (
              <div className="f-review-item">
                <div className="f-review-item__icon" style={{ backgroundColor: "#e7f7f0", color: "#10b981" }}>
                  {parseItemName(currentActionItem).emoji}
                </div>
                <span>{parseItemName(currentActionItem).name}</span>
              </div>
            )}

            {currentLogicItem && (
              <div className="f-review-item mt-3 pt-3 border-top">
                <div className="f-review-item__icon" style={{ backgroundColor: "#fef3c7", color: "#f59e0b" }}>
                  {parseItemName(currentLogicItem).emoji}
                </div>
                <span>Control lógico: {parseItemName(currentLogicItem).name}</span>
              </div>
            )}
          </div>

          <div className="f-card f-review-block">
            <h4>Configuración</h4>
            <div className="f-review-kv">
              <span className="f-review-kv__k">Estado:</span>
              <span style={{ fontWeight: "700", color: status === "ACTIVE" ? "var(--f-green)" : "var(--f-muted)" }}>
                {status === "ACTIVE" ? "Activo" : "Borrador (Pausado)"}
              </span>
            </div>
            <div className="f-review-kv">
              <span className="f-review-kv__k">Descripción:</span>
              <span>{description || "Sin descripción proporcionada."}</span>
            </div>
          </div>

          {/* Test connection flow block */}
          <div className="f-card f-review-block">
            <h4>Probar antes de activar</h4>
            <p style={{ fontSize: "12px", color: "var(--f-muted)", margin: "0 0 12px" }}>
              Ejecuta una prueba para verificar que todo funcione correctamente.
            </p>
            <div className="d-flex align-items-center justify-content-between">
              <button 
                className="f-test__btn"
                onClick={handleTestFlow}
                disabled={testing}
              >
                {testing ? "Probando..." : "Probar flujo"}
              </button>
            </div>

            {testResult && (
              <div 
                className="p-3 mt-3" 
                style={{ 
                  borderRadius: "10px", 
                  backgroundColor: testResult.success ? "var(--f-green-soft)" : "var(--f-red-soft)",
                  color: testResult.success ? "#047857" : "var(--f-red)",
                  fontSize: "12px",
                  lineHeight: "1.4"
                }}
              >
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent CTA Button */}
      <button 
        className="f-cta" 
        onClick={stepIndex === 4 ? executeSave : nextStep}
        disabled={saving}
      >
        {saving ? "Guardando..." : (stepIndex === 4 ? "Guardar y activar" : "Continuar")}
      </button>
    </div>
  );
}
