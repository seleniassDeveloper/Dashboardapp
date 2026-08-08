import React, { useState } from "react";
import { Database, LayoutTemplate } from "lucide-react";
import FieldRegistryEditor from "./FieldRegistryEditor.jsx";
import ComponentAssignmentEditor from "./ComponentAssignmentEditor.jsx";

export default function FieldsAndFormsSettings() {
  const [activeStep, setActiveStep] = useState("registry");

  return (
    <div className="d-flex flex-column gap-4">
      {/* Stepper de 2 Pasos */}
      <div className="step-nav">
        <button
          type="button"
          className={`step-nav__item ${activeStep === "registry" ? "is-active" : ""}`}
          onClick={() => setActiveStep("registry")}
        >
          <span className="step-nav__n">1</span>
          <Database size={18} />
          <span>Catálogo de Campos (Crear)</span>
        </button>

        <button
          type="button"
          className={`step-nav__item ${activeStep === "assign" ? "is-active" : ""}`}
          onClick={() => setActiveStep("assign")}
        >
          <span className="step-nav__n">2</span>
          <LayoutTemplate size={18} />
          <span>Asignar a Formularios (Canvas)</span>
        </button>
      </div>

      {/* Content Render */}
      <div className="animate-fade-in">
        {activeStep === "registry" ? <FieldRegistryEditor /> : <ComponentAssignmentEditor />}
      </div>
    </div>
  );
}
