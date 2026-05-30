import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Badge, Alert } from "react-bootstrap";
import { Play, RotateCcw, AlertTriangle, CheckCircle, Terminal, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";

export default function WorkflowSimulator({ 
  workflow, 
  nodes = [], 
  transitions = [],
  onHighlightNode,
  onResetHighlights
}) {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";

  const [eventType, setEventType] = useState("nueva-cita");
  const [clientType, setClientType] = useState("vip"); // "vip" | "regular"
  const [amountInput, setAmountInput] = useState("25000");
  const [stockLevel, setStockLevel] = useState("critical"); // "critical" | "sufficient"

  const [simulating, setSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [success, setSuccess] = useState(null);

  // Trigger types matching mappings
  const eventToTriggerMap = {
    "nueva-cita": "nueva-cita",
    "cliente-nuevo": "cliente-nuevo",
    "stock-bajo": "stock-bajo",
    "pago-recibido": "pago-recibido"
  };

  const handleSimulate = async () => {
    if (!workflow || nodes.length === 0) return;

    setSimulating(true);
    setSimLogs([]);
    setSuccess(null);
    onResetHighlights();

    // 1. Check if trigger type matches workflow trigger
    const requiredTrigger = workflow.trigger?.type;
    const simulatedTrigger = eventToTriggerMap[eventType];

    addLog(isEs ? "🚀 Iniciando Simulación del Workflow contable..." : "🚀 Starting accounting Workflow Simulation...", "info");
    addLog(`${isEs ? "Evento disparado" : "Trigger event"}: ${eventType.toUpperCase()} (${clientType === "vip" ? (isEs ? "Cliente VIP" : "VIP Client") : (isEs ? "Cliente Regular" : "Regular Client")})`, "info");

    if (requiredTrigger !== simulatedTrigger) {
      setTimeout(() => {
        addLog(`⚠️ ERROR: ${isEs ? `El disparador del workflow ("${requiredTrigger}") no coincide con el evento simulado ("${simulatedTrigger}").` : `Workflow trigger ("${requiredTrigger}") does not match simulated event ("${simulatedTrigger}").`}`, "danger");
        setSuccess(false);
        setSimulating(false);
      }, 500);
      return;
    }

    // 2. Identify the Trigger node on canvas
    const triggerNode = nodes.find(n => n.type === "trigger");
    if (!triggerNode) {
      addLog(isEs ? "⚠️ ERROR: No se encontró ningún nodo de tipo DISPARADOR en el canvas." : "⚠️ ERROR: No TRIGGER node was found on the canvas.", "danger");
      setSuccess(false);
      setSimulating(false);
      return;
    }

    // Start execution simulation log sequence
    const executionLogs = [];
    
    // Step 1: Fire Trigger
    await sleep(600);
    onHighlightNode(triggerNode.id);
    addLog(`⚡ ${isEs ? "Nodo Disparador Activado" : "Trigger Node Activated"}: "${triggerNode.name}"`, "success");
    executionLogs.push({ nodeName: triggerNode.name, nodeType: triggerNode.type, status: "SUCCESS", result: "Trigger Fired" });

    // Step 2: Traverse Transitions to find next nodes
    let currentId = triggerNode.id;
    let finished = false;
    let stepsCounter = 0;

    while (!finished && stepsCounter < 10) {
      stepsCounter++;
      
      // Find all transitions leaving from current node
      const currentTransitions = transitions.filter(t => t.from === currentId);
      if (currentTransitions.length === 0) {
        addLog(isEs ? "🏁 Fin del flujo: No hay más conexiones salientes." : "🏁 End of flow: No more outgoing connections.", "info");
        finished = true;
        break;
      }

      // Check current node type
      const currentNode = nodes.find(n => n.id === currentId);
      let selectedTransition = null;

      if (currentNode && currentNode.type === "condition") {
        // Evaluate IF/ELSE logic dynamically!
        const property = currentNode.config?.property || "cliente.vip";
        const operator = currentNode.config?.operator || "==";
        const value = currentNode.config?.value || "true";

        let conditionMet = false;
        
        if (property === "cliente.vip") {
          conditionMet = clientType === "vip";
        } else if (property === "cita.importe" || property === "cliente.saldo") {
          const threshold = Number(value);
          const currentAmount = Number(amountInput);
          conditionMet = operator === ">" ? currentAmount > threshold : currentAmount < threshold;
        } else if (property === "stock.cantidad") {
          conditionMet = stockLevel === "critical";
        }

        addLog(isEs ? `🧠 Evaluando condición lógica: ¿${property} ${operator} ${value}?` : `🧠 Evaluating logical condition: ${property} ${operator} ${value}?`, "info");
        await sleep(800);

        if (conditionMet) {
          addLog(isEs ? `👉 Condición CUMPLIDA (VERDE): Tomando bifurcación SÍ` : `👉 Condition MET (GREEN): Taking YES branch`, "success");
          selectedTransition = currentTransitions.find(t => t.conditionBranch === "yes" || !t.conditionBranch);
        } else {
          addLog(isEs ? `👉 Condición NO CUMPLIDA (ROJO): Tomando bifurcación NO` : `👉 Condition NOT MET (RED): Taking NO branch`, "warning");
          selectedTransition = currentTransitions.find(t => t.conditionBranch === "no");
        }
      } else {
        // For linear connections, take the first transition
        selectedTransition = currentTransitions[0];
      }

      if (!selectedTransition) {
        addLog(isEs ? "🏁 Fin del flujo: No se encontró rama de transición válida." : "🏁 End of flow: No valid transition branch found.", "info");
        finished = true;
        break;
      }

      const nextNode = nodes.find(n => n.id === selectedTransition.to);
      if (!nextNode || nextNode.id === "end") {
        addLog(isEs ? "🏁 Fin del flujo alcanzado." : "🏁 End of flow reached.", "info");
        finished = true;
        break;
      }

      // Execute next node
      await sleep(1000);
      currentId = nextNode.id;
      onHighlightNode(currentId);

      addLog(`${isEs ? "⚙️ Ejecutando Nodo" : "⚙️ Executing Node"}: "${nextNode.name}" (${nextNode.type.toUpperCase()})`, "info");

      // Dynamic Action execution logs output
      if (nextNode.subtype === "whatsapp") {
        const msg = nextNode.config?.message || "Hola {{cliente}}!";
        const processedMsg = processVariables(msg, clientType, amountInput);
        addLog(`📱 ${isEs ? `[WhatsApp SIMULADO enviado a Cliente]: "${processedMsg}"` : `[SIMULATED WhatsApp sent to Client]: "${processedMsg}"`}`, "success");
        executionLogs.push({ nodeName: nextNode.name, nodeType: nextNode.type, status: "SUCCESS", result: `WhatsApp Sent: ${processedMsg}` });
      } else if (nextNode.subtype === "email") {
        const subject = nextNode.config?.subject || "Notificación Salon Aura";
        addLog(`✉️ ${isEs ? `[Email SIMULADO enviado a Cliente] Asunto: "${subject}"` : `[SIMULATED Email sent to Client] Subject: "${subject}"`}`, "success");
        executionLogs.push({ nodeName: nextNode.name, nodeType: nextNode.type, status: "SUCCESS", result: `Email Sent: ${subject}` });
      } else if (nextNode.subtype === "crear-tarea") {
        const priority = nextNode.config?.priority || "MEDIA";
        addLog(`📝 ${isEs ? `[Tarea Creada en CRM] Prioridad: ${priority} • Asignada a: ${nextNode.config?.assignee || "ESTILISTA"}` : `[Task Created in CRM] Priority: ${priority} • Assigned to: ${nextNode.config?.assignee || "ESTILISTA"}`}`, "success");
        executionLogs.push({ nodeName: nextNode.name, nodeType: nextNode.type, status: "SUCCESS", result: "Task Created" });
      } else if (nextNode.subtype === "notificacion") {
        addLog(`🔔 ${isEs ? `[Notificación Push enviada al Salón]: "${nextNode.config?.title || "Alerta"}"` : `[Push Notification sent to Salon]: "${nextNode.config?.title || "Alert"}"`}`, "success");
        executionLogs.push({ nodeName: nextNode.name, nodeType: nextNode.type, status: "SUCCESS", result: "Notification Sent" });
      } else if (nextNode.type === "delay") {
        const val = nextNode.config?.timeValue || 2;
        const unit = nextNode.config?.timeUnit || "horas";
        const engUnit = unit === "horas" ? "hours" : unit === "dias" ? "days" : unit === "minutos" ? "minutes" : unit;
        addLog(`⏳ ${isEs ? `[Retardo de Tiempo] Esperando ${val} ${unit} antes de avanzar...` : `[Time Delay] Waiting ${val} ${engUnit} before proceeding...`}`, "info");
        executionLogs.push({ nodeName: nextNode.name, nodeType: nextNode.type, status: "SUCCESS", result: `Delay ${val} ${unit}` });
      } else {
        executionLogs.push({ nodeName: nextNode.name, nodeType: nextNode.type, status: "SUCCESS", result: "Action executed" });
      }
    }

    // 3. Persist Execution Log to backend Neon PostgreSQL
    try {
      await api.post("/workflows/executions", {
        workflowId: workflow.id,
        status: "SUCCESS",
        triggerType: simulatedTrigger,
        runTimeMs: Math.round(1500 + Math.random() * 800),
        logs: executionLogs
      });
      addLog(isEs ? "💾 Log de simulación guardado en Neon Cloud DB con éxito." : "💾 Simulation log saved to Neon Cloud DB successfully.", "success");
      setSuccess(true);
    } catch (dbErr) {
      console.error(dbErr);
      addLog(isEs ? "⚠️ Advertencia: No se pudo guardar la ejecución en base de datos cloud." : "⚠️ Warning: Could not save simulation log to cloud database.", "warning");
      setSuccess(true);
    } finally {
      setSimulating(false);
    }
  };

  const addLog = (text, type = "info") => {
    setSimLogs(prev => [...prev, { text, type, time: new Date() }]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const processVariables = (templateText, client, amount) => {
    return templateText
      .replace(/{{cliente}}/g, client === "vip" ? "Sofía Altieri (VIP)" : "Juan Gómez")
      .replace(/{{fecha}}/g, new Date().toLocaleDateString(isEs ? "es-AR" : "en-US"))
      .replace(/{{hora}}/g, "14:30 hs")
      .replace(/{{servicio}}/g, "Balayage Premium")
      .replace(/{{profesional}}/g, "Andrea (Colorista Top)")
      .replace(/{{saldo}}/g, `$${Number(amount).toLocaleString()}`)
      .replace(/{{sucursal}}/g, "Palermo Soho");
  };

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl h-100 overflow-auto scrollbar-none d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Terminal className="text-purple-600 animate-pulse" size={20} />
          <h3 className="h6 fw-black text-gray-900 mb-0">{t("workflowsBuilder.simulator.title", { defaultValue: "Simulador de Pruebas (Debugger)" })}</h3>
        </div>
        <p className="text-muted smaller mb-4">
          {t("workflowsBuilder.simulator.subtitle", { defaultValue: "Simula eventos en vivo del salón para probar la lógica de automatización y ver las ramas recorrer el canvas." })}
        </p>

        <Form className="d-grid gap-3 mb-4">
          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">{isEs ? "1. Seleccionar Evento Disparador" : "1. Select Trigger Event"}</Form.Label>
            <Form.Select 
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="rounded-xl border-gray-200 small"
              disabled={simulating}
            >
              <option value="nueva-cita">{isEs ? "📅 Nueva cita agendada" : "📅 New appointment booked"}</option>
              <option value="cliente-nuevo">{isEs ? "👤 Cliente nuevo creado" : "👤 New client created"}</option>
              <option value="stock-bajo">{isEs ? "⚠️ Alerta stock bajo" : "⚠️ Low stock alert"}</option>
              <option value="pago-recibido">{isEs ? "💸 Pago recibido / Caja" : "💸 Payment received / Checkout"}</option>
            </Form.Select>
          </Form.Group>

          {/* Conditional inputs depending on event */}
          {eventType === "nueva-cita" && (
            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Estado de Lealtad del Cliente" : "Customer Loyalty Status"}</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check 
                  type="radio"
                  id="client-vip"
                  name="client"
                  label={isEs ? "Cliente VIP 👑" : "VIP Client 👑"}
                  checked={clientType === "vip"}
                  onChange={() => setClientType("vip")}
                  className="small text-gray-800 fw-medium"
                />
                <Form.Check 
                  type="radio"
                  id="client-regular"
                  name="client"
                  label={isEs ? "Cliente Regular 👤" : "Regular Client 👤"}
                  checked={clientType === "regular"}
                  onChange={() => setClientType("regular")}
                  className="small text-gray-800 fw-medium"
                />
              </div>
            </Form.Group>
          )}

          {eventType === "pago-recibido" && (
            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Importe del Pago ($)" : "Payment Amount ($)"}</Form.Label>
              <Form.Control
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="rounded-xl border-gray-200 small"
                disabled={simulating}
              />
            </Form.Group>
          )}

          {eventType === "stock-bajo" && (
            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">{isEs ? "Gravedad de Existencias" : "Stock Severity"}</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check 
                  type="radio"
                  id="stock-crit"
                  name="stock"
                  label={isEs ? "Por debajo del stock mínimo" : "Below minimum stock"}
                  checked={stockLevel === "critical"}
                  onChange={() => setStockLevel("critical")}
                  className="small text-gray-800 fw-medium"
                />
                <Form.Check 
                  type="radio"
                  id="stock-suff"
                  name="stock"
                  label={isEs ? "Por encima del stock mínimo" : "Above minimum stock"}
                  checked={stockLevel === "sufficient"}
                  onChange={() => setStockLevel("sufficient")}
                  className="small text-gray-800 fw-medium"
                />
              </div>
            </Form.Group>
          )}

          <div className="d-flex gap-2">
            <Button 
              variant="purple" 
              onClick={handleSimulate}
              disabled={simulating}
              className="rounded-xl py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 flex-grow-1 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              <Play size={15} />
              <span>{simulating ? (isEs ? "Corriendo..." : "Running...") : t("workflowsBuilder.simulator.triggerBtn", { defaultValue: "Iniciar Prueba" })}</span>
            </Button>
            
            <Button 
              variant="light" 
              onClick={() => { onResetHighlights(); setSimLogs([]); setSuccess(null); }}
              className="rounded-xl p-2 border"
              title={isEs ? "Resetear Simulación" : "Reset Simulation"}
              disabled={simulating}
            >
              <RotateCcw size={16} />
            </Button>
          </div>
        </Form>
      </div>

      {/* TERMINAL CONSOLE LOGS */}
      <div>
        <span className="smaller text-muted fw-bold d-block mb-1.5">{isEs ? "Consola de Depuración (Audit Console)" : "Debugging Console (Audit Console)"}</span>
        <div 
          className="p-3 bg-dark text-white rounded-2xl font-mono overflow-auto scrollbar-none"
          style={{ 
            height: "170px", 
            fontSize: "11px", 
            lineHeight: "1.5",
            border: "2px solid #334155",
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)"
          }}
        >
          {simLogs.length === 0 ? (
            <div className="text-muted italic py-5 text-center">
              {isEs ? "Consola inactiva. Haz click en \"Iniciar Prueba\" para registrar los logs del constructor." : "Console inactive. Click \"Simulate Trigger\" to see constructor log outputs."}
            </div>
          ) : (
            simLogs.map((log, idx) => (
              <div 
                key={idx} 
                className={`mb-1.5 ${
                  log.type === "success" ? "text-emerald-400" : log.type === "warning" ? "text-amber-300" : log.type === "danger" ? "text-red-400" : "text-gray-300"
                }`}
              >
                <span className="text-gray-500">[{log.time.toLocaleTimeString(isEs ? "es-AR" : "en-US")}]</span> {log.text}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
