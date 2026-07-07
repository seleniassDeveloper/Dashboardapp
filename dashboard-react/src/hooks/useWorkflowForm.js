import { useState, useCallback } from "react";
import api from "../lib/api.js";
import { SYNC_TRIGGERS, SYNC_ACTIONS, SYNC_LOGIC } from "../components/workflows/WorkflowBuilder.jsx";

export default function useWorkflowForm({ onSaved, onHide }) {
  const [stepIndex, setStepIndex] = useState(1); // 1: Info, 2: Trigger, 3: Action/Logic, 4: Review
  
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE"); // ACTIVE | PAUSED
  const [trigger, setTrigger] = useState(""); // trigger subtype
  const [action, setAction] = useState(""); // action subtype
  const [logic, setLogic] = useState(""); // logic subtype (optional)

  // Status indicators
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const nextStep = () => {
    if (stepIndex === 1) {
      if (!name.trim()) {
        setError("El nombre del flujo es obligatorio.");
        return;
      }
    }
    if (stepIndex === 2) {
      if (!trigger) {
        setError("Debes seleccionar un disparador.");
        return;
      }
    }
    if (stepIndex === 3) {
      if (!action) {
        setError("Debes seleccionar una acción.");
        return;
      }
    }
    setError("");
    setStepIndex(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setError("");
    setStepIndex(prev => Math.max(prev - 1, 1));
  };

  const resetForm = () => {
    setStepIndex(1);
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    setTrigger("");
    setAction("");
    setLogic("");
    setError("");
    setSuccessMsg("");
  };

  const executeSave = async () => {
    if (!name.trim()) {
      setError("El nombre del flujo es obligatorio.");
      return;
    }
    if (!trigger) {
      setError("El disparador es obligatorio.");
      return;
    }
    if (!action) {
      setError("La acción es obligatoria.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const triggerItem = SYNC_TRIGGERS.find(t => t.subtype === trigger);
      const actionItem = SYNC_ACTIONS.find(a => a.subtype === action);

      // Build standard node grid list for visual designer compatibility
      const nodes = [
        {
          id: "node-trigger",
          type: "trigger",
          subtype: trigger,
          name: triggerItem ? triggerItem.name : "Disparador",
          config: {},
          position: { x: 250, y: 100 }
        }
      ];

      const transitions = [];
      let lastNodeId = "node-trigger";

      if (logic) {
        const logicItem = SYNC_LOGIC.find(l => l.subtype === logic);
        const logicNode = {
          id: `node-${logic}`,
          type: logic,
          subtype: logic,
          name: logicItem ? logicItem.name : "Control de Flujo",
          config: {},
          position: { x: 250, y: 220 }
        };
        nodes.push(logicNode);
        transitions.push({ from: lastNodeId, to: logicNode.id });
        lastNodeId = logicNode.id;
      }

      const actionNode = {
        id: "node-action",
        type: "action",
        subtype: action,
        name: actionItem ? actionItem.name : "Acción",
        config: {},
        position: { x: 250, y: 350 }
      };
      nodes.push(actionNode);
      transitions.push({ from: lastNodeId, to: actionNode.id });

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        trigger: {
          type: trigger,
          config: {}
        },
        steps: nodes,
        transitions: transitions,
        screens: []
      };

      const res = await api.post("/workflows", payload);
      setSuccessMsg("¡Automatización guardada y activada con éxito!");
      
      if (onSaved) {
        onSaved(res.data);
      }
      if (onHide) {
        setTimeout(() => {
          onHide();
        }, 1200);
      }
    } catch (err) {
      console.error("Error saving workflow:", err);
      setError(err?.response?.data?.error || "Error al registrar la automatización en el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return {
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
    resetForm,
    executeSave
  };
}
