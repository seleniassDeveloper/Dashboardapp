import React, { useState } from "react";
import FlowsList from "./FlowsList";
import NewFlowMethod from "./NewFlowMethod";
import FlowWizard from "./FlowWizard";
import FlowDetail from "./FlowDetail";
import FlowExecutions from "./FlowExecutions";
import FlowStats from "./FlowStats";
import useWorkflows from "../../../hooks/useWorkflows";
import useWorkflowForm from "../../../hooks/useWorkflowForm";
import api from "../../../lib/api";
import "./FlowsMobile.css";

export default function FlowsMobile({ onStartVisual }) {
  const {
    workflows,
    stats,
    executions,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    load,
    toggleStatus,
    deleteWorkflow
  } = useWorkflows();

  const [screen, setScreen] = useState("list"); // list | method | wizard | detail | executions | stats
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [activeTab, setActiveTab] = useState("my-flows"); // my-flows | templates | history | stats

  const form = useWorkflowForm({
    onSaved: async () => {
      await load();
      setScreen("list");
      setActiveTab("my-flows");
    },
    onHide: () => {
      setScreen("list");
    }
  });

  const handleToggleStatus = async (wf) => {
    try {
      await toggleStatus(wf);
      // Update selected flow reference if in detail
      if (selectedFlow && selectedFlow.id === wf.id) {
        setSelectedFlow({ ...wf, status: wf.status === "ACTIVE" ? "PAUSED" : "ACTIVE" });
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteWorkflow = async (wf) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el flujo "${wf.name}"?`)) {
      try {
        await deleteWorkflow(wf.id);
        setScreen("list");
        setSelectedFlow(null);
        setSuccessMsg("Automatización eliminada correctamente.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleInstallTemplate = async (tpl) => {
    try {
      const name = `${tpl.nameEs} (Instalado)`;
      const description = tpl.descEs;
      const payload = {
        name,
        description,
        status: "ACTIVE",
        trigger: {
          type: tpl.triggerType,
          config: {}
        },
        steps: tpl.steps,
        transitions: tpl.transitions,
        screens: []
      };

      await api.post("/workflows", payload);
      setSuccessMsg(`¡Excelente! La plantilla "${tpl.nameEs}" ha sido instalada.`);
      await load();
      setActiveTab("my-flows");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (e) {
      console.error(e);
      setError("No pudimos instalar la plantilla. Vuelve a intentarlo.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="flows-mobile">
      {screen === "list" && (
        <>
          {activeTab === "my-flows" && (
            <FlowsList
              workflows={workflows}
              stats={stats}
              loading={loading}
              error={error}
              successMsg={successMsg}
              setSuccessMsg={setSuccessMsg}
              onToggleStatus={handleToggleStatus}
              onDeleteWorkflow={handleDeleteWorkflow}
              onSelectFlow={(wf) => {
                setSelectedFlow(wf);
                setScreen("detail");
              }}
              onNewFlow={() => setScreen("method")}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onInstallTemplate={handleInstallTemplate}
            />
          )}
          {activeTab === "templates" && (
            <FlowsList
              workflows={workflows}
              stats={stats}
              loading={loading}
              error={error}
              successMsg={successMsg}
              setSuccessMsg={setSuccessMsg}
              onToggleStatus={handleToggleStatus}
              onDeleteWorkflow={handleDeleteWorkflow}
              onSelectFlow={(wf) => {
                setSelectedFlow(wf);
                setScreen("detail");
              }}
              onNewFlow={() => setScreen("method")}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onInstallTemplate={handleInstallTemplate}
            />
          )}
          {activeTab === "history" && (
            <FlowExecutions
              executions={executions}
              onBack={() => setActiveTab("my-flows")}
            />
          )}
          {activeTab === "stats" && (
            <FlowStats
              stats={stats}
              workflows={workflows}
              onBack={() => setActiveTab("my-flows")}
            />
          )}
        </>
      )}

      {screen === "method" && (
        <NewFlowMethod
          onBack={() => setScreen("list")}
          onStartWizard={() => {
            form.resetForm();
            setScreen("wizard");
          }}
          onStartVisual={() => {
            onStartVisual(null);
          }}
          onViewTemplates={() => {
            setScreen("list");
            setActiveTab("templates");
          }}
        />
      )}

      {screen === "wizard" && (
        <FlowWizard form={form} />
      )}

      {screen === "detail" && selectedFlow && (
        <FlowDetail
          workflow={selectedFlow}
          executions={executions}
          onBack={() => {
            setScreen("list");
            setSelectedFlow(null);
          }}
          onToggleStatus={handleToggleStatus}
          onDeleteWorkflow={handleDeleteWorkflow}
          onStartVisual={() => {
            onStartVisual(selectedFlow);
          }}
        />
      )}
    </div>
  );
}
