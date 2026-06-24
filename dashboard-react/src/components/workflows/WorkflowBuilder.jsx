import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Modal } from "react-bootstrap";
import { 
  GitBranch, Play, Save, X, Plus, Sparkles, 
  Terminal, ShieldAlert, Layers, HelpCircle, Bot 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import WorkflowCanvas from "./WorkflowCanvas.jsx";
import WorkflowInspector from "./WorkflowInspector.jsx";
import WorkflowSimulator from "./WorkflowSimulator.jsx";
import api from "../../lib/api.js";

// List of allowed ERP Triggers & Actions
const SYNC_TRIGGERS = [
  { subtype: "nueva-cita", name: "📅 Nueva Cita", type: "trigger", desc: "Se ejecuta al agendar cita." },
  { subtype: "cita-confirmada", name: "✅ Cita Confirmada", type: "trigger", desc: "Se ejecuta al confirmar cita." },
  { subtype: "cita-cancelada", name: "❌ Cita Cancelada", type: "trigger", desc: "Se ejecuta al cancelar cita." },
  { subtype: "cita-finalizada", name: "🏁 Cita Finalizada", type: "trigger", desc: "Se ejecuta al marcar cita DONE." },
  { subtype: "consentimiento-firmado", name: "✍️ Consentimiento Firmado", type: "trigger", desc: "Se ejecuta al firmar el consentimiento." },
  { subtype: "cambio-estado-cita", name: "🔄 Cambio de Estado de Cita", type: "trigger", desc: "Se ejecuta al cambiar de estado de cita." },
  { subtype: "cliente-nuevo", name: "👤 Cliente Nuevo", type: "trigger", desc: "Se ejecuta al crear cliente." },
  { subtype: "cliente-inactivo", name: "⚠️ Cliente Inactivo", type: "trigger", desc: "Se ejecuta si cliente no asiste en 60d." },
  { subtype: "stock-bajo", name: "📦 Stock Bajo", type: "trigger", desc: "Se ejecuta al cruzar stock mínimo." },
  { subtype: "pago-recibido", name: "💸 Pago Recibido", type: "trigger", desc: "Se ejecuta al registrar cobro." }
];

const SYNC_ACTIONS = [
  { subtype: "whatsapp", name: "📱 WhatsApp", type: "action", desc: "Manda mensaje por enlace WhatsApp." },
  { subtype: "email", name: "✉️ Correo Email", type: "action", desc: "Envía un email formal por Gmail API." },
  { subtype: "notificacion", name: "🔔 Alerta Push", type: "action", desc: "Muestra alerta interna en la campana." },
  { subtype: "crear-tarea", name: "📝 Crear Tarea", type: "action", desc: "Asigna tarea técnica al equipo." },
  { subtype: "enviar-consentimiento", name: "📑 Enviar Consentimiento", type: "action", desc: "Genera y envía solicitud de consentimiento por Email." },
  { subtype: "cambiar-estado-cita", name: "🔄 Cambiar Estado de Cita", type: "action", desc: "Cambia el estado de la cita automáticamente." },
  { subtype: "enviar-comprobante", name: "🧾 Enviar Comprobante", type: "action", desc: "Envía comprobante de pago por Email." }
];

const SYNC_LOGIC = [
  { subtype: "condition", name: "🧠 Condición (IF/ELSE)", type: "condition", desc: "Bifurca el camino lógico." },
  { subtype: "delay", name: "⏳ Retardo (Delay)", type: "delay", desc: "Espera antes de avanzar." }
];

const getNodeDisplayInfo = (item, t) => {
  let nameStr = item.subtype.startsWith("custom-") ? item.name : t(`workflowsBuilder.nodes.${item.subtype}.name`, { defaultValue: item.name });
  let descStr = item.subtype.startsWith("custom-") ? item.desc : t(`workflowsBuilder.nodes.${item.subtype}.desc`, { defaultValue: item.desc });
  
  nameStr = nameStr.trim();
  const chars = Array.from(nameStr);
  if (chars.length > 0) {
    const firstChar = chars[0];
    const codePoint = firstChar.codePointAt(0);
    if (codePoint > 0x2000 || firstChar === "⚡") {
      const remainingName = chars.slice(1).join("").trim();
      return {
        emoji: firstChar,
        name: remainingName,
        desc: descStr
      };
    }
  }
  
  return {
    emoji: item.icon || (item.type === "trigger" ? "⚡" : item.type === "condition" ? "🔀" : "⏳"),
    name: nameStr,
    desc: descStr
  };
};

export default function WorkflowBuilder({
  show,
  onHide,
  initialData = null,
  onSaved
}) {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [nodes, setNodes] = useState([]);
  const [transitions, setTransitions] = useState([]);

  const [editorMode, setEditorMode] = useState("quick"); // "quick" | "visual"
  const [isComplex, setIsComplex] = useState(false);

  // Custom workflow components state
  const [customTriggers, setCustomTriggers] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_triggers");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customActions, setCustomActions] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_actions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState("trigger"); // "trigger" | "action"
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("🤖");
  const [newItemIntegration, setNewItemIntegration] = useState("webhook-inbound"); // "whatsapp" | "email" | "webhook" | "cron" | "webhook-inbound" | "sms" | "custom"
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [executingNodeId, setExecutingNodeId] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const isEdit = Boolean(initialData?.id);

  // Initialize workflow visual parameters
  useEffect(() => {
    if (!show) return;
    setError("");
    setSuccessMsg("");
    setShowDebugger(false);
    setSelectedNodeId(null);
    setExecutingNodeId(null);

    let loadedNodes = [];
    let loadedTrans = [];

    if (isEdit) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "DRAFT");
      
      // Node list parsed from relational steps/transitions
      // Default to linear fallback if it doesn't have visual nodes coordinates
      const stepsList = Array.isArray(initialData.steps) ? initialData.steps : [];
      const transList = Array.isArray(initialData.transitions) ? initialData.transitions : [];

      if (stepsList.some(s => s.x !== undefined)) {
        loadedNodes = stepsList;
        loadedTrans = transList;
      } else {
        // Build linear nodes from old templates
        const triggerType = initialData.trigger?.type || "nueva-cita";
        const builtNodes = [
          { 
            id: "trigger-1", 
            name: t(`workflowsBuilder.nodes.${triggerType}.name`, { defaultValue: "⚡ Disparador" }), 
            type: "trigger", 
            subtype: triggerType, 
            x: 150, 
            y: 250, 
            config: initialData.trigger?.config || {},
            description: t(`workflowsBuilder.nodes.${triggerType}.desc`, { defaultValue: "" }) 
          }
        ];

        stepsList.forEach((s, idx) => {
          builtNodes.push({
            id: s.id || `node-${idx + 1}`,
            name: s.name || `${isEs ? "Paso" : "Step"} ${idx + 1}`,
            type: "action",
            subtype: s.type || "whatsapp",
            x: 150 + (idx + 1) * 350,
            y: 250,
            config: s.config || {},
            description: s.description || (isEs ? "Acción del flujo" : "Flow action")
          });
        });

        // Connections
        const builtTrans = [];
        for (let i = 0; i < builtNodes.length - 1; i++) {
          builtTrans.push({
            id: `trans-${i}`,
            from: builtNodes[i].id,
            to: builtNodes[i + 1].id
          });
        }

        loadedNodes = builtNodes;
        loadedTrans = builtTrans;
      }
    } else {
      setName("");
      setDescription("");
      setStatus("DRAFT");
      
      // Preload simple trigger + action + transition
      const defaultTrigger = { 
        id: "trigger-1", 
        name: t("workflowsBuilder.nodes.nueva-cita.name", { defaultValue: "📅 Nueva Cita" }), 
        type: "trigger", 
        subtype: "nueva-cita", 
        x: 150, 
        y: 250, 
        config: { triggerTiming: "IMMEDIATE" },
        description: t("workflowsBuilder.nodes.nueva-cita.desc", { defaultValue: "Se ejecuta al agendar cita." }) 
      };

      const defaultAction = {
        id: "action-1",
        name: t("workflowsBuilder.nodes.whatsapp.name", { defaultValue: "📱 WhatsApp" }),
        type: "action",
        subtype: "whatsapp",
        x: 500,
        y: 250,
        description: t("workflowsBuilder.nodes.whatsapp.desc", { defaultValue: "Manda mensaje por enlace WhatsApp." }),
        config: {
          message: isEs 
            ? "Hola {{cliente}}! Tu cita de {{servicio}} con {{profesional}} está registrada." 
            : "Hi {{cliente}}! Your appointment for {{servicio}} with {{profesional}} is registered."
        }
      };

      loadedNodes = [defaultTrigger, defaultAction];
      loadedTrans = [{
        id: "trans-1",
        from: "trigger-1",
        to: "action-1"
      }];
    }

    // Evaluate complexity & auto-heal if 1 trigger and 0 actions
    const triggers = loadedNodes.filter(n => n.type === "trigger");
    let actions = loadedNodes.filter(n => n.type === "action");
    let others = loadedNodes.filter(n => n.type !== "trigger" && n.type !== "action");

    if (triggers.length === 1 && actions.length === 0 && others.length === 0) {
      const defaultAction = {
        id: "action-1",
        name: t("workflowsBuilder.nodes.whatsapp.name", { defaultValue: "📱 WhatsApp" }),
        type: "action",
        subtype: "whatsapp",
        x: 500,
        y: 250,
        description: t("workflowsBuilder.nodes.whatsapp.desc", { defaultValue: "Manda mensaje por enlace WhatsApp." }),
        config: {
          message: isEs 
            ? "Hola {{cliente}}! Tu cita de {{servicio}} con {{profesional}} está registrada." 
            : "Hi {{cliente}}! Your appointment for {{servicio}} with {{profesional}} is registered."
        }
      };
      loadedNodes = [...loadedNodes, defaultAction];
      loadedTrans = [...loadedTrans, {
        id: "trans-1",
        from: triggers[0].id,
        to: "action-1"
      }];
      actions = [defaultAction];
    }

    const hasComplexity = triggers.length > 1 || actions.length > 1 || others.length > 0;
    setIsComplex(hasComplexity);
    if (hasComplexity) {
      setEditorMode("visual");
    } else {
      setEditorMode("quick");
    }
    setNodes(loadedNodes);
    setTransitions(loadedTrans);
  }, [show, isEdit, initialData]);

  const quickTriggerNode = nodes.find(n => n.type === "trigger");
  const quickActionNode = nodes.find(n => n.type === "action");

  const handleQuickTriggerSubtypeChange = (subtype) => {
    if (!quickTriggerNode) return;
    const item = SYNC_TRIGGERS.find((tItem) => tItem.subtype === subtype);
    const displayName = item ? item.name : subtype;
    const displayDesc = item ? item.desc : "";

    setNodes((prev) =>
      prev.map((n) =>
        n.type === "trigger"
          ? {
              ...n,
              subtype,
              name: displayName,
              description: displayDesc,
            }
          : n
      )
    );
  };

  const handleQuickTriggerConfigChange = (key, value) => {
    if (!quickTriggerNode) return;
    const nextConfig = {
      ...(quickTriggerNode.config || {}),
      [key]: value,
    };

    let nextDescription = quickTriggerNode.description;
    const timing = nextConfig.triggerTiming || "IMMEDIATE";
    if (timing === "IMMEDIATE") {
      nextDescription = isEs 
        ? "Se ejecuta al instante al ocurrir el evento." 
        : "Triggers immediately when the event occurs.";
    } else {
      const val = nextConfig.timeValue !== undefined ? nextConfig.timeValue : 24;
      const rawUnit = nextConfig.timeUnit || "horas";
      let displayUnit = rawUnit;
      if (!isEs) {
        if (rawUnit === "minutos") displayUnit = "minutes";
        else if (rawUnit === "horas") displayUnit = "hours";
        else if (rawUnit === "dias") displayUnit = "days";
      }
      nextDescription = isEs 
        ? `${val} ${displayUnit} antes de la cita.`
        : `${val} ${displayUnit} before the appointment.`;
    }

    setNodes((prev) =>
      prev.map((n) =>
        n.type === "trigger"
          ? {
              ...n,
              description: nextDescription,
              config: nextConfig,
            }
          : n
      )
    );
  };

  const handleQuickActionSubtypeChange = (subtype) => {
    if (!quickActionNode) return;
    const item = SYNC_ACTIONS.find((aItem) => aItem.subtype === subtype);
    const displayName = item ? item.name : subtype;
    const displayDesc = item ? item.desc : "";

    const nextConfig = { ...(quickActionNode.config || {}) };
    if (subtype === "email" && !nextConfig.subject) {
      nextConfig.subject = isEs ? "Notificación de Turno" : "Appointment Alert";
    }
    if (subtype === "notificacion" && !nextConfig.title) {
      nextConfig.title = isEs ? "Confirmación de Turno" : "Appointment Alert";
    }

    setNodes((prev) =>
      prev.map((n) =>
        n.type === "action"
          ? {
              ...n,
              subtype,
              name: displayName,
              description: displayDesc,
              config: nextConfig,
            }
          : n
      )
    );
  };

  const handleQuickActionConfigChange = (key, value) => {
    if (!quickActionNode) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.type === "action"
          ? {
              ...n,
              config: {
                ...(n.config || {}),
                [key]: value,
              },
            }
          : n
      )
    );
  };

  const insertQuickVariable = (variable) => {
    const textarea = document.getElementById("quick-message-editor");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = quickActionNode?.config?.message || "";
    const updated = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
    
    handleQuickActionConfigChange("message", updated);
    
    // Reset focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 50);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Drag and update nodes positions
  const handleUpdateNodePosition = (nodeId, x, y) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
  };

  // Select node to open in inspector
  const handleSelectNode = (node) => {
    setSelectedNodeId(node.id);
    setShowDebugger(false);
  };

  // Add new nodes on canvas
  const handleAddComponent = (comp) => {
    const newId = `${comp.type}_${Date.now()}`;
    const isCustom = comp.subtype.startsWith("custom-");
    const newNode = {
      id: newId,
      name: isCustom ? comp.name : t(`workflowsBuilder.nodes.${comp.subtype}.name`, { defaultValue: comp.name }),
      type: comp.type,
      subtype: comp.subtype,
      x: 350 + Math.floor(Math.random() * 80),
      y: 200 + Math.floor(Math.random() * 80),
      description: isCustom ? comp.desc : t(`workflowsBuilder.nodes.${comp.subtype}.desc`, { defaultValue: comp.desc }),
      icon: comp.icon || undefined,
      integrationType: comp.integrationType || undefined,
      config: comp.subtype === "whatsapp" || comp.subtype === "email" || comp.integrationType === "whatsapp" || comp.integrationType === "email" || comp.integrationType === "sms"
        ? { 
            message: isEs ? "Hola {{cliente}}! Tu cita de {{servicio}} con {{profesional}} está registrada." : "Hi {{cliente}}! Your appointment for {{servicio}} with {{profesional}} is registered.",
            subject: (comp.subtype === "email" || comp.integrationType === "email") ? (isEs ? "Notificación de Turno" : "Appointment Alert") : undefined
          }
        : comp.integrationType === "webhook"
          ? {
              url: "https://api.mi-servidor.com/webhook",
              method: "POST",
              headers: '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer TOKEN"\n}',
              body: '{\n  "cliente": "{{cliente}}",\n  "fecha": "{{fecha}}",\n  "servicio": "{{servicio}}"\n}'
            }
          : comp.integrationType === "cron"
            ? {
                expression: "0 9 * * *",
                description: isEs ? "Todos los días a las 9 AM" : "Every day at 9 AM"
              }
            : comp.integrationType === "webhook-inbound"
              ? {
                  endpoint: `/api/public/workflows/trigger/${newId}`,
                  secret: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                  expectedVariables: "cliente, telefono, monto"
                }
              : comp.subtype === "condition"
                ? { property: "cliente.vip", operator: "==", value: "true" }
                : comp.subtype === "delay"
                  ? { timeValue: 2, timeUnit: isEs ? "horas" : "hours" }
                  : {}
    };

    setNodes(prev => [...prev, newNode]);

    // Connect automatically from the last node if possible
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      // Only connect if it's not a condition node which requires specific branching
      if (lastNode.type !== "condition") {
        const transId = `trans_${Date.now()}`;
        setTransitions(prev => [
          ...prev, 
          { 
            id: transId, 
            from: lastNode.id, 
            to: newId,
            conditionBranch: lastNode.type === "condition" ? "yes" : undefined
          }
        ]);
      }
    }

    setSelectedNodeId(newId);
  };

  // Add branch connection lines manually between nodes
  const handleAddConnection = (fromId, toId, branch = "yes") => {
    if (fromId === toId) return;
    const transId = `trans_${Date.now()}`;
    setTransitions(prev => [
      ...prev,
      {
        id: transId,
        from: fromId,
        to: toId,
        conditionBranch: branch
      }
    ]);
  };

  // Remove nodes and its associated transition lines
  const handleDeleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setTransitions(prev => prev.filter(t => t.from !== nodeId && t.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Update properties from Inspector
  const handleUpdateNode = (updatedNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  // Save visual nodes to relational database format
  const executeSave = async () => {
    if (!name.trim()) {
      setError(isEs ? "Por favor asigna un nombre al workflow." : "Please enter the workflow name.");
      return;
    }

    const triggerNode = nodes.find(n => n.type === "trigger");
    if (!triggerNode) {
      setError(isEs ? "El workflow debe tener al menos un nodo Disparador (Trigger)." : "The workflow must have at least one Trigger node.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        trigger: {
          type: triggerNode.subtype,
          config: triggerNode.config || {}
        },
        // We persist the entire rich node-grid in standard steps and transitions fields!
        steps: nodes,
        transitions: transitions,
        screens: []
      };

      const url = isEdit ? `/workflows/${initialData.id}` : `/workflows`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);

      setSuccessMsg(isEs ? "¡Workflow guardado con éxito!" : "Workflow saved successfully!");
      onSaved?.(res.data);
      setShowSaveModal(false);
      setTimeout(() => onHide(), 1000);
    } catch (err) {
      console.error(err);
      setError(t("workflowsBuilder.builder.errorSave", { defaultValue: "Error al guardar la automatización en el servidor." }));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkflowClick = () => {
    setError("");
    const triggerNode = nodes.find(n => n.type === "trigger");
    if (!triggerNode) {
      setError(isEs ? "El workflow debe tener al menos un nodo Disparador (Trigger)." : "The workflow must have at least one Trigger node.");
      return;
    }
    setShowSaveModal(true);
  };

  return createPortal(
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 bg-light"
      style={{ zIndex: 1040, overflow: "hidden" }}
    >
      <Container fluid className="px-4 py-3 h-100 d-flex flex-column" style={{ maxHeight: "100vh" }}>
        
        {/* VIEWPORT TOP EDITOR BAR */}
        <header className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 p-3 bg-white rounded-2xl shadow-sm border" style={{ height: "76px" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 bg-purple bg-opacity-10 text-purple-600 rounded-xl">
              <GitBranch size={22} className="animate-spin" style={{ animationDuration: "15s" }} />
            </div>
            <div>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("workflowsBuilder.builder.placeholderName", { defaultValue: "Nombre de la automatización..." })}
                className="fw-black text-gray-950 border-0 p-0 fs-5 border-hover-bottom"
                style={{ width: "320px", background: "transparent", borderBottom: "2px solid transparent" }}
              />
              <Form.Control
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isEs ? "Escribe una breve descripción del flujo..." : "Write a brief description of the flow..."}
                className="text-muted border-0 p-0 smaller mt-0.5"
                style={{ width: "450px", background: "transparent" }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border-gray-200 py-1.5 fw-bold text-gray-700 small"
              style={{ width: "135px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
            >
              <option value="DRAFT">📋 {isEs ? "Borrador" : "Draft"}</option>
              <option value="ACTIVE">🟢 {isEs ? "Activo" : "Active"}</option>
              <option value="PAUSED">🟡 {isEs ? "Pausado" : "Paused"}</option>
            </Form.Select>

            <Button
              variant="outline-purple"
              onClick={() => { setShowDebugger(true); setSelectedNodeId(null); }}
              className="rounded-xl px-3.5 py-1.8 fw-bold text-purple-700 border-purple-200 hover-bg-purple-50 d-flex align-items-center gap-1.5 small shadow-sm"
            >
              <Play size={14} />
              <span>{t("workflowsBuilder.builder.test", { defaultValue: "Probar" })}</span>
            </Button>

            <Button
              variant="purple"
              onClick={handleSaveWorkflowClick}
              disabled={saving}
              className="rounded-xl px-4 py-1.8 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 d-flex align-items-center gap-1.5 shadow-md small"
            >
              <Save size={14} />
              <span>{saving ? t("workflowsBuilder.builder.saving", { defaultValue: "Guardando..." }) : t("workflowsBuilder.builder.save", { defaultValue: "Guardar" })}</span>
            </Button>

            <button 
              onClick={onHide} 
              className="btn btn-light p-2.5 rounded-xl border hover-bg-gray-100 d-flex align-items-center justify-content-center shadow-sm"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="d-flex mb-3 gap-2 border-bottom pb-2">
          <button
            onClick={() => setEditorMode("quick")}
            className={`d-flex align-items-center gap-2 px-4 py-2 fw-bold rounded-xl border-0 transition-all ${
              editorMode === "quick" ? "bg-purple-600 text-white shadow-sm" : "bg-white border text-muted hover-bg-gray-100"
            }`}
            style={{ fontSize: "13px" }}
            disabled={isComplex}
            title={isComplex ? t("workflowsBuilder.builder.quickModeWarn") : ""}
          >
            <span>✨ {t("workflowsBuilder.builder.quickMode", { defaultValue: "Configuración Rápida" })}</span>
          </button>

          <button
            onClick={() => setEditorMode("visual")}
            className={`d-flex align-items-center gap-2 px-4 py-2 fw-bold rounded-xl border-0 transition-all ${
              editorMode === "visual" ? "bg-purple-600 text-white shadow-sm" : "bg-white border text-muted hover-bg-gray-100"
            }`}
            style={{ fontSize: "13px" }}
          >
            <span>🎨 {t("workflowsBuilder.builder.visualMode", { defaultValue: "Diseñador Visual" })}</span>
          </button>
        </div>

        {error && <Alert variant="danger" className="rounded-2xl mb-3 shadow-sm">{error}</Alert>}
        {successMsg && <Alert variant="success" className="rounded-2xl mb-3 shadow-sm">{successMsg}</Alert>}

        {editorMode === "quick" ? (
          <div className="flex-grow-1 overflow-auto bg-light bg-opacity-40 p-4 rounded-2xl border mb-3" style={{ height: "calc(100vh - 185px)" }}>
            <div className="mx-auto" style={{ maxWidth: "800px" }}>
              <div className="card-premium border bg-white p-4 rounded-2xl shadow-sm d-grid gap-4">
                
                {/* Header info */}
                <div>
                  <h4 className="fw-black text-gray-900 mb-1">
                    {t("workflowsBuilder.builder.quickMode", { defaultValue: "Configuración Rápida" })}
                  </h4>
                  <p className="text-muted small mb-0">
                    {t("workflowsBuilder.builder.quickModeSubtitle", { defaultValue: "Configura cuándo se dispara el recordatorio y qué va a decir en una sola pantalla cómoda." })}
                  </p>
                </div>

                <hr className="my-0 text-gray-200" />
                
                {/* 1. General settings */}
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-gray-700">
                        {isEs ? "Nombre de la automatización" : "Automation Name"} *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("workflowsBuilder.builder.placeholderName", { defaultValue: "Nombre de la automatización..." })}
                        className="rounded-xl border-gray-200"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-gray-700">
                        {isEs ? "Estado de publicación" : "Publication Status"}
                      </Form.Label>
                      <Form.Select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-xl border-gray-200"
                      >
                        <option value="DRAFT">📋 {isEs ? "Borrador" : "Draft"}</option>
                        <option value="ACTIVE">🟢 {isEs ? "Activo" : "Active"}</option>
                        <option value="PAUSED">🟡 {isEs ? "Pausado" : "Paused"}</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-gray-700">
                        {isEs ? "Descripción" : "Description"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={isEs ? "Escribe una breve descripción del flujo..." : "Write a brief description..."}
                        className="rounded-xl border-gray-200"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-0 text-gray-200" />

                {/* 2. TRIGGER SETTINGS */}
                <div className="p-4 bg-orange bg-opacity-5 rounded-2xl border border-orange-100">
                  <h5 className="h6 fw-black text-orange-700 mb-3 d-flex align-items-center gap-2">
                    <span>⚡ 1. ¿Cuándo se debe enviar? (Disparador)</span>
                  </h5>
                  
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">
                          {isEs ? "Evento del Sistema" : "System Event"}
                        </Form.Label>
                        <Form.Select
                          value={quickTriggerNode?.subtype || "nueva-cita"}
                          onChange={(e) => handleQuickTriggerSubtypeChange(e.target.value)}
                          className="rounded-xl border-gray-200"
                        >
                          {SYNC_TRIGGERS.map((st) => (
                            <option key={st.subtype} value={st.subtype}>
                              {st.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">
                          {isEs ? "Momento de Ejecución" : "Execution Timing"}
                        </Form.Label>
                        <Form.Select
                          value={quickTriggerNode?.config?.triggerTiming || "IMMEDIATE"}
                          onChange={(e) => handleQuickTriggerConfigChange("triggerTiming", e.target.value)}
                          className="rounded-xl border-gray-200"
                        >
                          <option value="IMMEDIATE">
                            {isEs ? "Al instante (cuando ocurre el evento)" : "Immediately (when the event occurs)"}
                          </option>
                          <option value="BEFORE_APPOINTMENT">
                            {isEs ? "Antes de la fecha/hora de la cita" : "Before the appointment date/time"}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {(quickTriggerNode?.config?.triggerTiming || "IMMEDIATE") === "BEFORE_APPOINTMENT" && (
                      <>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="smaller text-muted fw-bold">
                              {isEs ? "Anticipación" : "Time Before"}
                            </Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              value={quickTriggerNode?.config?.timeValue !== undefined ? quickTriggerNode.config.timeValue : 24}
                              onChange={(e) => handleQuickTriggerConfigChange("timeValue", Number(e.target.value))}
                              className="rounded-xl border-gray-200"
                              required
                            />
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="smaller text-muted fw-bold">
                              {isEs ? "Unidad de Tiempo" : "Time Unit"}
                            </Form.Label>
                            <Form.Select
                              value={quickTriggerNode?.config?.timeUnit || "horas"}
                              onChange={(e) => handleQuickTriggerConfigChange("timeUnit", e.target.value)}
                              className="rounded-xl border-gray-200"
                            >
                              <option value="minutos">{isEs ? "Minutos" : "Minutes"}</option>
                              <option value="horas">{isEs ? "Horas" : "Hours"}</option>
                              <option value="dias">{isEs ? "Días" : "Days"}</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </>
                    )}
                  </Row>
                </div>

                {/* 3. ACTION SETTINGS */}
                <div className="p-4 bg-purple bg-opacity-5 rounded-2xl border border-purple-100">
                  <h5 className="h6 fw-black text-purple-700 mb-3 d-flex align-items-center gap-2">
                    <span>📱 2. ¿Qué se va a enviar? (Mensaje)</span>
                  </h5>

                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">
                          {isEs ? "Canal de Envío" : "Delivery Channel"}
                        </Form.Label>
                        <Form.Select
                          value={quickActionNode?.subtype || "whatsapp"}
                          onChange={(e) => handleQuickActionSubtypeChange(e.target.value)}
                          className="rounded-xl border-gray-200"
                        >
                          <option value="whatsapp">📱 WhatsApp</option>
                          <option value="email">✉️ Correo Email</option>
                          <option value="notificacion">🔔 Alerta Push</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {quickActionNode?.subtype === "email" && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted fw-bold">
                            {isEs ? "Asunto del Correo" : "Email Subject"} *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={quickActionNode?.config?.subject || ""}
                            onChange={(e) => handleQuickActionConfigChange("subject", e.target.value)}
                            placeholder={isEs ? "Ej: Recordatorio de tu turno en Aura Studio" : "e.g., Reminder of your appointment"}
                            className="rounded-xl border-gray-200"
                            required
                          />
                        </Form.Group>
                      </Col>
                    )}

                    {quickActionNode?.subtype === "notificacion" && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="smaller text-muted fw-bold">
                            {isEs ? "Título de la Alerta" : "Alert Title"} *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={quickActionNode?.config?.title || ""}
                            onChange={(e) => handleQuickActionConfigChange("title", e.target.value)}
                            placeholder={isEs ? "Ej: Nueva cita agendada" : "e.g., New appointment booked"}
                            className="rounded-xl border-gray-200"
                            required
                          />
                        </Form.Group>
                      </Col>
                    )}

                    <Col md={12}>
                      <Form.Group>
                        <div className="d-flex justify-content-between mb-1">
                          <Form.Label className="smaller text-muted fw-bold mb-0">
                            {isEs ? "Mensaje con Variables" : "Message with Variables"}
                          </Form.Label>
                          <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2" style={{ fontSize: "9px" }}>
                            {isEs ? "Editor Dinámico" : "Dynamic Editor"}
                          </Badge>
                        </div>
                        <Form.Control
                          id="quick-message-editor"
                          as="textarea"
                          rows={5}
                          value={quickActionNode?.config?.message || ""}
                          onChange={(e) => handleQuickActionConfigChange("message", e.target.value)}
                          className="rounded-xl border-gray-200 small font-mono"
                          placeholder={isEs ? "Escribe tu mensaje..." : "Type your message..."}
                          style={{ fontSize: "12px", lineHeight: "1.4" }}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Chips for variables */}
                    <Col md={12}>
                      <span className="smaller text-muted fw-semibold d-block mb-1.5">
                        {isEs ? "Inyectar variables en el mensaje:" : "Inject variables in the message:"}
                      </span>
                      <div className="d-flex flex-wrap gap-1.5">
                        {["cliente", "fecha", "hora", "profesional", "servicio", "saldo", "sucursal"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertQuickVariable(v)}
                            className="btn btn-xs btn-outline-purple bg-light bg-opacity-40 px-2 py-1 rounded-pill small fw-semibold text-purple-700 hover-bg-purple-100"
                            style={{ fontSize: "10.5px" }}
                          >
                            +{v}
                          </button>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Row className="g-3 flex-grow-1 mb-3" style={{ height: "calc(100vh - 185px)", overflow: "hidden" }}>
            
            {/* LEFT SIDEBAR: COMPONENTS CATALOG SELECTOR */}
            <Col lg={3} md={4} className="h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
              <Card className="card-premium border-0 shadow-sm bg-white p-3 rounded-2xl h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
                <div className="fw-black text-gray-900 small mb-3 px-1 text-uppercase tracking-wider" style={{ fontSize: "10.5px" }}>
                  {isEs ? "Nodos del Constructor" : "Constructor Nodes"}
                </div>

                <div className="flex-grow-1 overflow-auto pe-1 scrollbar-none" style={{ overflowY: "auto" }}>
                  {/* CATEGORÍA 1: TRIGGERS */}
                  <div className="mb-3.5">
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="smaller text-orange-600 fw-bold text-uppercase tracking-wider" style={{ fontSize: "8.5px" }}>
                        {t("workflowsBuilder.builder.triggerTitle", { defaultValue: "⚡ Disparadores (Triggers)" })}
                      </span>
                      <button 
                        onClick={() => { setCreateType("trigger"); setNewItemIntegration("webhook-inbound"); setShowCreateModal(true); }}
                        className="btn btn-xs p-0 text-orange-600 hover-text-orange-800 border-0 d-flex align-items-center bg-transparent"
                        title={isEs ? "Crear disparador personalizado" : "Create custom trigger"}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1.5">
                      {[...SYNC_TRIGGERS, ...customTriggers].map((tItem) => (
                        <button
                          key={tItem.subtype}
                          onClick={() => handleAddComponent(tItem)}
                          className="btn btn-outline-orange w-100 rounded-xl px-2.5 py-1.8 text-start small border-orange-200 hover-bg-orange-50 d-grid gap-0.5"
                        >
                          <strong className="text-gray-800" style={{ fontSize: "11.5px" }}>
                            {tItem.subtype.startsWith("custom-") ? tItem.name : t(`workflowsBuilder.nodes.${tItem.subtype}.name`, { defaultValue: tItem.name })}
                          </strong>
                          <span className="smaller text-muted" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>
                            {tItem.subtype.startsWith("custom-") ? tItem.desc : t(`workflowsBuilder.nodes.${tItem.subtype}.desc`, { defaultValue: tItem.desc })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CATEGORÍA 2: ACTIONS */}
                  <div className="mb-3.5">
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="smaller text-purple-600 fw-bold text-uppercase tracking-wider" style={{ fontSize: "8.5px" }}>
                        {t("workflowsBuilder.builder.actionTitle", { defaultValue: "🟢 Acciones del Sistema" })}
                      </span>
                      <button 
                        onClick={() => { setCreateType("action"); setNewItemIntegration("whatsapp"); setShowCreateModal(true); }}
                        className="btn btn-xs p-0 text-purple-600 hover-text-purple-800 border-0 d-flex align-items-center bg-transparent"
                        title={isEs ? "Crear acción personalizada" : "Create custom action"}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1.5">
                      {[...SYNC_ACTIONS, ...customActions].map((a) => (
                        <button
                          key={a.subtype}
                          onClick={() => handleAddComponent(a)}
                          className="btn btn-outline-purple w-100 rounded-xl px-2.5 py-1.8 text-start small border-purple-200 hover-bg-purple-50 d-grid gap-0.5"
                        >
                          <strong className="text-gray-800" style={{ fontSize: "11.5px" }}>
                            {a.subtype.startsWith("custom-") ? a.name : t(`workflowsBuilder.nodes.${a.subtype}.name`, { defaultValue: a.name })}
                          </strong>
                          <span className="smaller text-muted" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>
                            {a.subtype.startsWith("custom-") ? a.desc : t(`workflowsBuilder.nodes.${a.subtype}.desc`, { defaultValue: a.desc })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CATEGORÍA 3: LOGICS */}
                  <div>
                    <span className="smaller text-amber-600 fw-bold px-1 text-uppercase tracking-wider d-block mb-2" style={{ fontSize: "8.5px" }}>
                      {t("workflowsBuilder.builder.logicTitle", { defaultValue: "🔀 Control de Flujo" })}
                    </span>
                    <div className="d-flex flex-column gap-1.5">
                      {SYNC_LOGIC.map((l) => (
                        <button
                          key={l.subtype}
                          onClick={() => handleAddComponent(l)}
                          className="btn btn-outline-amber w-100 rounded-xl px-2.5 py-1.8 text-start small border-amber-200 hover-bg-amber-50 d-grid gap-0.5"
                        >
                          <strong className="text-gray-800" style={{ fontSize: "11.5px" }}>{t(`workflowsBuilder.nodes.${l.subtype}.name`, { defaultValue: l.name })}</strong>
                          <span className="smaller text-muted" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>{t(`workflowsBuilder.nodes.${l.subtype}.desc`, { defaultValue: l.desc })}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* MAIN GRAPHICS CANVAS WORKSPACE */}
            <Col lg={6} md={5} className="h-100 d-flex flex-column">
              <WorkflowCanvas
                nodes={nodes}
                transitions={transitions}
                selectedNodeId={selectedNodeId}
                executingNodeId={executingNodeId}
                onSelectNode={handleSelectNode}
                onDeleteNode={handleDeleteNode}
                onUpdateNodePosition={handleUpdateNodePosition}
                onStartConnection={handleAddConnection}
              />
            </Col>

            {/* RIGHT SIDEBAR: INSPECTOR OR SIMULATOR */}
            <Col lg={3} md={3} className="h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
              {showDebugger ? (
                <WorkflowSimulator
                  workflow={{ id: initialData?.id || "temp", trigger: nodes.find(n => n.type === "trigger") }}
                  nodes={nodes}
                  transitions={transitions}
                  onHighlightNode={(nodeId) => setExecutingNodeId(nodeId)}
                  onResetHighlights={() => setExecutingNodeId(null)}
                />
              ) : (
                <WorkflowInspector
                  node={selectedNode}
                  onUpdateNode={handleUpdateNode}
                />
              )}
            </Col>
          </Row>
        )}
      </Container>
      
      <style>{`
        .border-hover-bottom:hover {
          border-bottom-color: #cbd5e1 !important;
        }
        .border-hover-bottom:focus {
          border-bottom-color: #8b5cf6 !important;
          box-shadow: none !important;
        }
        .btn-outline-orange {
          border: 1.5px solid #ffedd5;
          color: #ea580c;
        }
        .btn-outline-orange:hover {
          background-color: #fff7ed;
          color: #ea580c;
          border-color: #fdba74;
        }
        .btn-outline-purple {
          border: 1.5px solid #f3e8ff;
          color: #7c3aed;
        }
        .btn-outline-purple:hover {
          background-color: #faf5ff;
          color: #7c3aed;
          border-color: #c084fc;
        }
        .btn-outline-amber {
          border: 1.5px solid #fef3c7;
          color: #d97706;
        }
        .btn-outline-amber:hover {
          background-color: #fffbeb;
          color: #d97706;
          border-color: #fcd34d;
        }
      `}</style>

      {/* MODAL PARA CREAR DISPARADOR O ACCIÓN PERSONALIZADA */}
      <Modal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-black text-gray-900 fs-5 d-flex align-items-center gap-2">
            <Sparkles size={20} className="text-purple-600 animate-pulse" />
            <span>{createType === "trigger" ? (isEs ? "Crear Disparador Personalizado" : "Create Custom Trigger") : (isEs ? "Crear Acción Personalizada" : "Create Custom Action")}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form className="d-grid gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Nombre" : "Name"} *</Form.Label>
              <Form.Control
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={isEs ? "Ej: Enviar SMS Recordatorio" : "e.g., Send SMS Reminder"}
                className="rounded-xl border-gray-200 small"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Descripción" : "Description"}</Form.Label>
              <Form.Control
                type="text"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                placeholder={isEs ? "Ej: Envía un SMS a través de Twilio" : "e.g., Sends an SMS via Twilio"}
                className="rounded-xl border-gray-200 small"
              />
            </Form.Group>

            <Row className="g-2">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-gray-700">{isEs ? "Icono (Emoji)" : "Icon (Emoji)"}</Form.Label>
                  <Form.Select
                    value={newItemIcon}
                    onChange={(e) => setNewItemIcon(e.target.value)}
                    className="rounded-xl border-gray-200 small"
                  >
                    <option value="🤖">🤖 Webhook</option>
                    <option value="📱">📱 WhatsApp</option>
                    <option value="✉️">✉️ Email</option>
                    <option value="💬">💬 SMS</option>
                    <option value="⚡">⚡ Evento</option>
                    <option value="📅">📅 Calendario</option>
                    <option value="🎂">🎂 Cumpleaños</option>
                    <option value="📦">📦 Stock</option>
                    <option value="⚙️">⚙️ Ajustes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-gray-700">{isEs ? "Tipo de Integración" : "Integration Type"}</Form.Label>
                  <Form.Select
                    value={newItemIntegration}
                    onChange={(e) => setNewItemIntegration(e.target.value)}
                    className="rounded-xl border-gray-200 small"
                  >
                    {createType === "trigger" ? (
                      <>
                        <option value="webhook-inbound">{isEs ? "Webhook Entrante" : "Inbound Webhook"}</option>
                        <option value="cron">{isEs ? "Programación (Cron)" : "Cron Schedule"}</option>
                        <option value="custom">{isEs ? "Sistema / Personalizado" : "System / Custom"}</option>
                      </>
                    ) : (
                      <>
                        <option value="whatsapp">{isEs ? "WhatsApp Link/API" : "WhatsApp Link/API"}</option>
                        <option value="email">{isEs ? "Email personalizado" : "Custom Email"}</option>
                        <option value="webhook">{isEs ? "Webhook Saliente" : "Outbound Webhook"}</option>
                        <option value="sms">{isEs ? "Mensaje SMS" : "SMS message"}</option>
                        <option value="custom">{isEs ? "Acción Personalizada" : "Custom Action"}</option>
                      </>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4 justify-content-end gap-2">
          <Button 
            variant="light" 
            onClick={() => setShowCreateModal(false)}
            className="rounded-xl px-3 py-1.8 small fw-bold"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button 
            variant="purple" 
            onClick={() => {
              if (!newItemName.trim()) return;
              const subId = `custom-${createType}-${Date.now()}`;
              const newItem = {
                subtype: subId,
                name: `${newItemIcon} ${newItemName.trim()}`,
                type: createType,
                desc: newItemDesc.trim() || (isEs ? "Elemento personalizado" : "Custom element"),
                icon: newItemIcon,
                integrationType: newItemIntegration
              };

              if (createType === "trigger") {
                const list = [...customTriggers, newItem];
                setCustomTriggers(list);
                localStorage.setItem("custom_triggers", JSON.stringify(list));
              } else {
                const list = [...customActions, newItem];
                setCustomActions(list);
                localStorage.setItem("custom_actions", JSON.stringify(list));
              }

              setShowCreateModal(false);
              setNewItemName("");
              setNewItemDesc("");
            }}
            className="rounded-xl px-4 py-1.8 bg-purple-600 hover-bg-purple-700 text-white border-0 small fw-bold"
          >
            {isEs ? "Crear" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL PARA GUARDAR WORKFLOW */}
      <Modal 
        show={showSaveModal} 
        onHide={() => !saving && setShowSaveModal(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header closeButton={!saving} className="border-0 pb-0">
          <Modal.Title className="fw-black text-gray-900 fs-5 d-flex align-items-center gap-2">
            <Save size={20} className="text-purple-600" />
            <span>{isEs ? "Guardar Automatización" : "Save Workflow"}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form className="d-grid gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Nombre del Workflow" : "Workflow Name"} *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEs ? "Ej: Recordatorio 24h" : "e.g., 24h Reminder"}
                className="rounded-xl border-gray-200"
                disabled={saving}
                autoFocus
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Descripción (Opcional)" : "Description (Optional)"}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isEs ? "¿Qué hace este flujo?" : "What does this flow do?"}
                className="rounded-xl border-gray-200"
                disabled={saving}
              />
            </Form.Group>
            
            {error && <Alert variant="danger" className="py-2 small mb-0 rounded-xl">{error}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4 justify-content-end gap-2">
          <Button 
            variant="light" 
            onClick={() => setShowSaveModal(false)}
            disabled={saving}
            className="rounded-xl px-4 py-2 small fw-bold"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button 
            variant="purple" 
            onClick={executeSave}
            disabled={saving}
            className="rounded-xl px-5 py-2 bg-purple-600 hover-bg-purple-700 text-white border-0 small fw-bold d-flex align-items-center gap-2 shadow-sm"
          >
            {saving && <Sparkles size={16} className="animate-spin" />}
            {saving ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Guardar" : "Save")}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>,
    document.body
  );
}
