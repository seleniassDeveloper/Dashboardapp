import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Form, Alert } from "react-bootstrap";
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
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [executingNodeId, setExecutingNodeId] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isEdit = Boolean(initialData?.id);

  // Initialize workflow visual parameters
  useEffect(() => {
    if (!show) return;
    setError("");
    setSuccessMsg("");
    setShowDebugger(false);
    setSelectedNodeId(null);
    setExecutingNodeId(null);

    if (isEdit) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "DRAFT");
      
      // Node list parsed from relational steps/transitions
      // Default to linear fallback if it doesn't have visual nodes coordinates
      const stepsList = Array.isArray(initialData.steps) ? initialData.steps : [];
      const transList = Array.isArray(initialData.transitions) ? initialData.transitions : [];

      if (stepsList.some(s => s.x !== undefined)) {
        setNodes(stepsList);
        setTransitions(transList);
      } else {
        // Build linear nodes from old templates
        const triggerType = initialData.trigger?.type || "nueva-cita";
        const builtNodes = [
          { 
            id: "node-trigger", 
            name: t("workflowsBuilder.builder.triggerTitle", { defaultValue: "⚡ Disparador" }), 
            type: "trigger", 
            subtype: triggerType, 
            x: 100, 
            y: 200, 
            description: isEs ? "Carga de disparo del sistema" : "System trigger payload" 
          }
        ];

        stepsList.forEach((s, idx) => {
          builtNodes.push({
            id: s.id || `node-${idx + 1}`,
            name: s.name || `${isEs ? "Paso" : "Step"} ${idx + 1}`,
            type: "action",
            subtype: s.type || "whatsapp",
            x: 100 + (idx + 1) * 300,
            y: 200,
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

        setNodes(builtNodes);
        setTransitions(builtTrans);
      }
    } else {
      setName("");
      setDescription("");
      setStatus("DRAFT");
      // Preload simple trigger node
      setNodes([
        { 
          id: "trigger-1", 
          name: t("workflowsBuilder.nodes.nueva-cita.name", { defaultValue: "📅 Nueva Cita" }), 
          type: "trigger", 
          subtype: "nueva-cita", 
          x: 120, 
          y: 220, 
          description: t("workflowsBuilder.nodes.nueva-cita.desc", { defaultValue: "Se ejecuta al agendar cita." }) 
        }
      ]);
      setTransitions([]);
    }
  }, [show, isEdit, initialData]);

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
    const newNode = {
      id: newId,
      name: t(`workflowsBuilder.nodes.${comp.subtype}.name`, { defaultValue: comp.name }),
      type: comp.type,
      subtype: comp.subtype,
      x: 350 + Math.floor(Math.random() * 80),
      y: 200 + Math.floor(Math.random() * 80),
      description: t(`workflowsBuilder.nodes.${comp.subtype}.desc`, { defaultValue: comp.desc }),
      config: comp.subtype === "whatsapp" || comp.subtype === "email" 
        ? { message: isEs ? "Hola {{cliente}}! Tu cita de {{servicio}} con {{profesional}} está confirmada." : "Hi {{cliente}}! Your appointment for {{servicio}} with {{profesional}} is confirmed." }
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
  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      setError(isEs ? "Por favor escribe el nombre del workflow." : "Please enter the workflow name.");
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
      setTimeout(() => onHide(), 1000);
    } catch (err) {
      console.error(err);
      setError(t("workflowsBuilder.builder.errorSave", { defaultValue: "Error al guardar la automatización en el servidor." }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 bg-light"
      style={{ zIndex: 1050, overflow: "hidden" }}
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
                className="fw-black text-gray-900 border-0 p-0 fs-5 border-hover-bottom"
                style={{ width: "320px", background: "transparent", borderBottom: "2px solid transparent" }}
              />
              <Form.Control
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isEs ? "Escribe una breve descripción del flujo..." : "Write a brief description of the flow..."}
                className="text-muted border-0 p-0 smaller mt-0.5"
                style={{ width: "400px", background: "transparent" }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border-gray-200 py-1.5 fw-bold text-gray-700 small"
              style={{ width: "130px" }}
            >
              <option value="DRAFT">📋 {isEs ? "Borrador" : "Draft"}</option>
              <option value="ACTIVE">🟢 {isEs ? "Activo" : "Active"}</option>
              <option value="PAUSED">🟡 {isEs ? "Pausado" : "Paused"}</option>
            </Form.Select>

            <Button
              variant="outline-purple"
              onClick={() => { setShowDebugger(true); setSelectedNodeId(null); }}
              className="rounded-xl px-3 py-1.5 fw-bold text-purple-700 border-purple-300 hover-bg-purple-50 d-flex align-items-center gap-1.5 small"
            >
              <Play size={14} />
              <span>{t("workflowsBuilder.builder.test", { defaultValue: "Probar" })}</span>
            </Button>

            <Button
              variant="purple"
              onClick={handleSaveWorkflow}
              disabled={saving}
              className="rounded-xl px-4 py-1.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 d-flex align-items-center gap-1.5 shadow-sm small"
            >
              <Save size={14} />
              <span>{saving ? t("workflowsBuilder.builder.saving", { defaultValue: "Guardando..." }) : t("workflowsBuilder.builder.save", { defaultValue: "Guardar" })}</span>
            </Button>

            <button 
              onClick={onHide} 
              className="btn btn-light p-2.5 rounded-xl border hover-bg-gray-100 d-flex align-items-center justify-content-center"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {error && <Alert variant="danger" className="rounded-2xl mb-3 shadow-sm">{error}</Alert>}
        {successMsg && <Alert variant="success" className="rounded-2xl mb-3 shadow-sm">{successMsg}</Alert>}

        {/* WORKSPACE MAIN ROW */}
        <Row className="g-3 flex-grow-1" style={{ height: "calc(100vh - 130px)", overflow: "hidden" }}>
          
          {/* LEFT SIDEBAR: COMPONENTS CATALOG SELECTOR */}
          <Col lg={3} md={4} className="h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
            <Card className="card-premium border-0 shadow-sm bg-white p-3 rounded-2xl h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
              <div className="fw-black text-gray-900 small mb-3 px-1 text-uppercase tracking-wider" style={{ fontSize: "10.5px" }}>
                {isEs ? "Nodos del Constructor" : "Constructor Nodes"}
              </div>

              <div className="flex-grow-1 overflow-auto pe-1 scrollbar-none" style={{ overflowY: "auto" }}>
                {/* CATEGORÍA 1: TRIGGERS */}
                <div className="mb-3.5">
                  <span className="smaller text-orange-600 fw-bold px-1 text-uppercase tracking-wider d-block mb-2" style={{ fontSize: "8.5px" }}>
                    {t("workflowsBuilder.builder.triggerTitle", { defaultValue: "⚡ Disparadores (Triggers)" })}
                  </span>
                  <div className="d-flex flex-column gap-1.5">
                    {SYNC_TRIGGERS.map((tItem) => (
                      <button
                        key={tItem.subtype}
                        onClick={() => handleAddComponent(tItem)}
                        className="btn btn-outline-orange w-100 rounded-xl px-2.5 py-1.8 text-start small border-orange-200 hover-bg-orange-50 d-grid gap-0.5"
                      >
                        <strong className="text-gray-800" style={{ fontSize: "11.5px" }}>{t(`workflowsBuilder.nodes.${tItem.subtype}.name`, { defaultValue: tItem.name })}</strong>
                        <span className="smaller text-muted" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>{t(`workflowsBuilder.nodes.${tItem.subtype}.desc`, { defaultValue: tItem.desc })}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CATEGORÍA 2: ACTIONS */}
                <div className="mb-3.5">
                  <span className="smaller text-purple-600 fw-bold px-1 text-uppercase tracking-wider d-block mb-2" style={{ fontSize: "8.5px" }}>
                    {t("workflowsBuilder.builder.actionTitle", { defaultValue: "🟢 Acciones del Sistema" })}
                  </span>
                  <div className="d-flex flex-column gap-1.5">
                    {SYNC_ACTIONS.map((a) => (
                      <button
                        key={a.subtype}
                        onClick={() => handleAddComponent(a)}
                        className="btn btn-outline-purple w-100 rounded-xl px-2.5 py-1.8 text-start small border-purple-200 hover-bg-purple-50 d-grid gap-0.5"
                      >
                        <strong className="text-gray-800" style={{ fontSize: "11.5px" }}>{t(`workflowsBuilder.nodes.${a.subtype}.name`, { defaultValue: a.name })}</strong>
                        <span className="smaller text-muted" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>{t(`workflowsBuilder.nodes.${a.subtype}.desc`, { defaultValue: a.desc })}</span>
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
      </Container>
      
      {/* Node dragging CSS resets */}
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
    </div>
  );
}
